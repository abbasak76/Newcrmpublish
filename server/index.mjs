import 'dotenv/config';
import express from 'express';
import sql from 'mssql';
import crypto from 'node:crypto';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '256kb', strict: true }));
app.use((req, res, next) => {
  req.correlationId = req.get('x-correlation-id')?.slice(0, 100) || crypto.randomUUID();
  res.set('x-correlation-id', req.correlationId);
  res.set('cache-control', 'no-store');
  next();
});

const requiredEnv = ['SQLSERVER_HOST', 'SQLSERVER_DATABASE', 'SQLSERVER_USER', 'SQLSERVER_PASSWORD', 'AUTH_TOKEN_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
let poolPromise;
const pool = () => {
  if (missingEnv.length) throw Object.assign(new Error('Backend configuration is incomplete'), { code: 'CONFIG_MISSING' });
  poolPromise ??= sql.connect({
    server: process.env.SQLSERVER_HOST,
    database: process.env.SQLSERVER_DATABASE,
    user: process.env.SQLSERVER_USER,
    password: process.env.SQLSERVER_PASSWORD,
    port: Number(process.env.SQLSERVER_PORT || 1433),
    options: { encrypt: process.env.SQLSERVER_ENCRYPT !== 'false', trustServerCertificate: process.env.SQLSERVER_TRUST_CERT === 'true' },
    pool: { min: 0, max: 10, idleTimeoutMillis: 30000 },
    connectionTimeout: 8000,
    requestTimeout: 15000,
  });
  return poolPromise;
};

const b64url = (value) => Buffer.from(value).toString('base64url');
function issueToken(claims) {
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(JSON.stringify({ ...claims, iat: now, exp: now + 3600, iss: 'akhavan-crm-api', aud: 'akhavan-crm' }));
  const signature = crypto.createHmac('sha256', process.env.AUTH_TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}
function verifyToken(token) {
  if (!token || token.length > 4096) return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;
  const expected = crypto.createHmac('sha256', process.env.AUTH_TOKEN_SECRET).update(payload).digest();
  let actual;
  try { actual = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (claims.iss !== 'akhavan-crm-api' || claims.aud !== 'akhavan-crm' || !Number.isInteger(claims.exp) || claims.exp <= now || !claims.userId || !claims.tenantId) return null;
    return claims;
  } catch { return null; }
}
function passwordMatches(password, saltHex, hashHex) {
  if (typeof password !== 'string' || password.length < 1 || password.length > 256 || !saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  if (!salt.length || !expected.length) return false;
  const actual = crypto.scryptSync(password, salt, expected.length);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
async function withTenantContext(claims, work) {
  const db = await pool();
  const transaction = new sql.Transaction(db);
  await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
  try {
    const context = new sql.Request(transaction);
    await context.input('tenantId', sql.UniqueIdentifier, claims.tenantId)
      .input('userId', sql.UniqueIdentifier, claims.userId)
      .query("EXEC sys.sp_set_session_context @key=N'TenantId', @value=@tenantId; EXEC sys.sp_set_session_context @key=N'UserId', @value=@userId;");
    const result = await work(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    try { await transaction.rollback(); } catch { /* transaction may already be aborted */ }
    throw error;
  }
}

function authenticate(req, res, next) {
  const header = req.get('authorization') || '';
  const match = /^Bearer ([^ ]+)$/i.exec(header);
  const claims = match ? verifyToken(match[1]) : null;
  if (!claims) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'احراز هویت معتبر نیست.' }, correlationId: req.correlationId });
  req.auth = claims;
  next();
}
function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      const allowed = await withTenantContext(req.auth, async (transaction) => {
        const result = await new sql.Request(transaction)
          .input('tenantId', sql.UniqueIdentifier, req.auth.tenantId)
          .input('userId', sql.UniqueIdentifier, req.auth.userId)
          .input('permission', sql.NVarChar(120), permission)
          .query(`SELECT TOP (1) 1 AS Allowed
            FROM core.UserRole ur
            JOIN core.RolePermission rp ON rp.TenantId=ur.TenantId AND rp.RoleId=ur.RoleId
            WHERE ur.TenantId=@tenantId AND ur.UserId=@userId
              AND ur.ValidFromUtc<=SYSUTCDATETIME() AND (ur.ValidToUtc IS NULL OR ur.ValidToUtc>SYSUTCDATETIME())
              AND rp.PermissionCode=@permission AND rp.FieldAccess='DO'`);
        return result.recordset.length > 0;
      });
      if (!allowed) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'مجوز انجام این عملیات را ندارید.' }, correlationId: req.correlationId });
      next();
    } catch (error) { next(error); }
  };
}

app.get('/health/live', (_req, res) => res.json({ status: 'ok', service: 'akhavan-crm-api' }));
app.get('/health/ready', async (_req, res) => {
  if (missingEnv.length) return res.status(503).json({ status: 'not_ready', reason: 'configuration_missing', missing: missingEnv });
  try { await (await pool()).request().query('SELECT 1 AS ready'); return res.json({ status: 'ready', database: 'connected' }); }
  catch { return res.status(503).json({ status: 'not_ready', database: 'unavailable' }); }
});

app.post('/api/v1/auth/login', async (req, res, next) => {
  try {
    const { tenantCode, userName, password } = req.body || {};
    if (![tenantCode, userName, password].every((v) => typeof v === 'string' && v.length > 0) || tenantCode.length > 50 || userName.length > 100 || password.length > 256) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'اطلاعات ورود معتبر نیست.' }, correlationId: req.correlationId });
    }
    const db = await pool();
    const result = await db.request()
      .input('tenantCode', sql.NVarChar(50), tenantCode.trim())
      .input('userName', sql.NVarChar(100), userName.trim())
      .execute('security.GetLoginCredential');
    const user = result.recordset[0];
    if (!user || !passwordMatches(password, user.PasswordSaltHex, user.PasswordHashHex)) {
      // Persistent lockout is recorded inside SQL; the response intentionally does not reveal whether the account exists.
      await db.request()
        .input('tenantCode', sql.NVarChar(50), tenantCode.trim())
        .input('userName', sql.NVarChar(100), userName.trim())
        .execute('security.RecordLoginFailure');
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'نام کاربری یا گذرواژه صحیح نیست.' }, correlationId: req.correlationId });
    }
    await db.request()
      .input('tenantCode', sql.NVarChar(50), tenantCode.trim())
      .input('userName', sql.NVarChar(100), userName.trim())
      .execute('security.RecordLoginSuccess');
    const token = issueToken({ tenantId: user.TenantId, userId: user.UserId, userName: user.UserName });
    res.json({ accessToken: token, tokenType: 'Bearer', expiresIn: 3600, user: { id: user.UserId, displayName: user.DisplayName, userName: user.UserName } });
  } catch (error) { next(error); }
});


const isUuid = (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

app.post('/api/v1/accounts', authenticate, requirePermission('accounts.CREATE'), async (req, res, next) => {
  try {
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const accountCode = typeof body.accountCode === 'string' ? body.accountCode.trim() : null;
    const phone = typeof body.phone === 'string' ? body.phone.trim() : null;
    const email = typeof body.email === 'string' ? body.email.trim() : null;
    const ownerUserId = body.ownerUserId == null || body.ownerUserId === '' ? null : body.ownerUserId;
    const idempotencyKey = req.get('idempotency-key') || '';
    if (!name || name.length > 250 || (accountCode && accountCode.length > 80) ||
        (phone && phone.length > 40) || (email && (email.length > 320 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))) ||
        (ownerUserId && !isUuid(ownerUserId))) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'اطلاعات مشتری معتبر نیست.' }, correlationId: req.correlationId });
    }
    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) {
      return res.status(400).json({ error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'برای ثبت امن درخواست، کلید تکرارناپذیر معتبر ارسال کنید.' }, correlationId: req.correlationId });
    }
    const normalized = { name, accountCode: accountCode || null, phone: phone || null, email: email || null, ownerUserId: ownerUserId || null };
    const requestHash = sha256(JSON.stringify(normalized));
    const result = await withTenantContext(req.auth, async (transaction) => {
      const request = new sql.Request(transaction);
      await request
        .input('lockResource', sql.NVarChar(255), `account-create:${req.auth.tenantId}:${idempotencyKey}`)
        .query("DECLARE @lockResult int; EXEC @lockResult=sys.sp_getapplock @Resource=@lockResource, @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=5000; IF @lockResult < 0 THROW 51001, 'IDEMPOTENCY_LOCK_FAILED', 1;");
      const existing = await new sql.Request(transaction)
        .input('tenantId', sql.UniqueIdentifier, req.auth.tenantId)
        .input('userId', sql.UniqueIdentifier, req.auth.userId)
        .input('idempotencyKey', sql.NVarChar(128), idempotencyKey)
        .query(`SELECT RequestHash, ResponseStatus, ResponseJson FROM integration.ApiIdempotency WITH (UPDLOCK,HOLDLOCK)
          WHERE TenantId=@tenantId AND UserId=@userId AND RouteCode=N'accounts.create' AND IdempotencyKey=@idempotencyKey`);
      if (existing.recordset.length) {
        const prior = existing.recordset[0];
        if (prior.RequestHash !== requestHash) return { conflict: true };
        return { replay: true, status: prior.ResponseStatus, body: JSON.parse(prior.ResponseJson) };
      }
      const created = await new sql.Request(transaction)
        .input('tenantId', sql.UniqueIdentifier, req.auth.tenantId)
        .input('name', sql.NVarChar(250), name)
        .input('accountCode', sql.NVarChar(80), normalized.accountCode)
        .input('phone', sql.NVarChar(40), normalized.phone)
        .input('email', sql.NVarChar(320), normalized.email)
        .input('ownerUserId', sql.UniqueIdentifier, normalized.ownerUserId)
        .query(`INSERT INTO crm.Account (TenantId, Name, AccountCode, Phone, Email, OwnerUserId, AccountType, StatusCode)
          OUTPUT inserted.AccountId, inserted.AccountCode, inserted.Name, inserted.StatusCode, inserted.OwnerUserId, inserted.UpdatedAtUtc
          VALUES (@tenantId, @name, @accountCode, @phone, @email, @ownerUserId, 'CUSTOMER', 'ACTIVE')`);
      const account = created.recordset[0];
      const eventId = crypto.randomUUID();
      const payload = JSON.stringify({ eventId, tenantId: req.auth.tenantId, accountId: account.AccountId, accountCode: account.AccountCode, name: account.Name, operation: 'ACCOUNT_CREATED', occurredAtUtc: new Date().toISOString() });
      await new sql.Request(transaction)
        .input('tenantId', sql.UniqueIdentifier, req.auth.tenantId)
        .input('eventId', sql.UniqueIdentifier, eventId)
        .input('aggregateId', sql.NVarChar(100), String(account.AccountId))
        .input('payload', sql.NVarChar(sql.MAX), payload)
        .query(`INSERT INTO integration.OutboxMessage (TenantId, EventId, EventType, ContractVersion, AggregateType, AggregateId, PayloadJson, StatusCode)
          VALUES (@tenantId, @eventId, N'crm.account.created', '1.0', N'Account', @aggregateId, @payload, 'PENDING')`);
      const responseBody = { data: account, operation: { eventId, status: 'PENDING_EXTERNAL_SYNC' }, correlationId: req.correlationId };
      await new sql.Request(transaction)
        .input('tenantId', sql.UniqueIdentifier, req.auth.tenantId)
        .input('userId', sql.UniqueIdentifier, req.auth.userId)
        .input('routeCode', sql.NVarChar(80), 'accounts.create')
        .input('idempotencyKey', sql.NVarChar(128), idempotencyKey)
        .input('requestHash', sql.Char(64), requestHash)
        .input('responseStatus', sql.SmallInt, 201)
        .input('responseJson', sql.NVarChar(sql.MAX), JSON.stringify(responseBody))
        .query(`INSERT INTO integration.ApiIdempotency (TenantId, UserId, RouteCode, IdempotencyKey, RequestHash, ResponseStatus, ResponseJson)
          VALUES (@tenantId, @userId, @routeCode, @idempotencyKey, @requestHash, @responseStatus, @responseJson)`);
      await new sql.Request(transaction)
        .input('tenantId', sql.UniqueIdentifier, req.auth.tenantId)
        .input('actorUserId', sql.UniqueIdentifier, req.auth.userId)
        .input('correlationId', sql.NVarChar(100), req.correlationId)
        .input('entityId', sql.NVarChar(120), String(account.AccountId))
        .input('details', sql.NVarChar(sql.MAX), JSON.stringify({ eventId, idempotencyKey }))
        .query(`INSERT INTO security.AuditEvent (TenantId, ActorUserId, CorrelationId, EventType, EntityType, EntityId, OutcomeCode, DetailsJson)
          VALUES (@tenantId, @actorUserId, @correlationId, N'crm.account.created', N'Account', @entityId, 'SUCCESS', @details)`);
      return { replay: false, status: 201, body: responseBody };
    });
    if (result.conflict) return res.status(409).json({ error: { code: 'IDEMPOTENCY_KEY_REUSED', message: 'این کلید قبلاً برای درخواست متفاوت استفاده شده است.' }, correlationId: req.correlationId });
    res.set('idempotency-replayed', result.replay ? 'true' : 'false');
    return res.status(result.status).json(result.body);
  } catch (error) {
    if (error.number === 2601 || error.number === 2627) {
      return res.status(409).json({ error: { code: 'DUPLICATE_RECORD', message: 'رکورد تکراری است.' }, correlationId: req.correlationId });
    }
    next(error);
  }
});

app.get('/api/v1/accounts', authenticate, requirePermission('accounts.VIEW'), async (req, res, next) => {
  try {
    const take = Math.min(100, Math.max(1, Number.parseInt(req.query.take || '25', 10) || 25));
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor.slice(0, 250) : '';
    const result = await withTenantContext(req.auth, async (transaction) => new sql.Request(transaction)
      .input('tenantId', sql.UniqueIdentifier, req.auth.tenantId)
      .input('take', sql.Int, take)
      .input('cursor', sql.NVarChar(250), cursor)
      .query(`SELECT TOP (@take) AccountId, AccountCode, Name, StatusCode, OwnerUserId, UpdatedAtUtc
        FROM crm.Account WHERE TenantId=@tenantId AND (@cursor=N'' OR Name>@cursor)
        ORDER BY Name ASC, AccountId ASC`));
    res.json({ data: result.recordset, page: { take, nextCursor: result.recordset.length === take ? result.recordset.at(-1).Name : null }, correlationId: req.correlationId });
  } catch (error) { next(error); }
});

app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'مسیر درخواست‌شده پیدا نشد.' }, correlationId: req.correlationId }));
app.use((error, req, res, _next) => {
  const status = error.code === 'CONFIG_MISSING' ? 503 : 500;
  // Never serialize SQL errors, connection strings, tokens, or stack traces to clients.
  console.error(JSON.stringify({ level: 'error', correlationId: req.correlationId, code: error.code || 'INTERNAL_ERROR', message: error.code === 'CONFIG_MISSING' ? error.message : 'request_failed' }));
  res.status(status).json({ error: { code: status === 503 ? 'SERVICE_UNAVAILABLE' : 'INTERNAL_ERROR', message: status === 503 ? 'سرویس هنوز آماده نیست.' : 'خطای داخلی رخ داد.' }, correlationId: req.correlationId });
});

const port = Number(process.env.API_PORT || 4000);
if (process.env.NODE_ENV !== 'test') app.listen(port, () => console.log(JSON.stringify({ level: 'info', event: 'api_started', port })));
export { app, issueToken, verifyToken, passwordMatches };
