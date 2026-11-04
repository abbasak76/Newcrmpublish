# RBAC Audit — b19

## کنترل‌های اضافه‌شده
- `geo.view`: مشاهدهٔ صفحهٔ هوش مکانی.
- `geo.manage`: ایجاد/ویرایش هندسه، تغییر وضعیت زون و به‌روزرسانی انتساب مشتری.
- این مجوزها در `CapabilityPermission`, `PERMISSION_LABELS`, `PERMISSION_MATRIX` و `RBACService.canAccessWorkspace` تعریف شده‌اند؛ تنظیمات پروفایل مجوزها از `PERMISSION_LABELS` تغذیه می‌شود، پس هر دو مجوز در UI تنظیم‌پذیرند.
- مدیرانی که مجوز موجود `settings.manage` یا `roles.manage` دارند، به‌منظور سازگاری می‌توانند صفحه را باز کنند؛ اما تغییر زون فقط با `geo.manage` (یا کلید عملیاتی صریح `geo.edit`) مجاز است. `geo.view` و مجوز ورود به صفحه به‌تنهایی مجوز مدیریت نیستند.
- مسیر `/geo-intelligence` با `guard('geo_intelligence', ...)` محافظت شده و آیتم منو از `filterSections`/RBAC مشترک عبور می‌کند.
- صفحه مشتریان قابل مشاهده را با `rbac.canActOnRecord('accounts','VIEW', scope)` محدود می‌کند؛ داشتن مجوز geo به‌تنهایی نباید scope مشتریان را گسترش دهد.
- هنگام refresh انتساب، فقط رکوردهای قبلی مشتریان داخل محدوده مجاز کاربر بسته می‌شوند؛ رکوردهای بیرون scope تغییر نمی‌کنند.
- تغییر هندسه، وضعیت زون، انتساب مشتری و ساخت task وصول از زون در `auditLogs` محلی ثبت می‌شود. ساخت task به `tasks.CREATE` نیاز دارد؛ ارجاع به کاربر دیگر/تعیین ناظر به `tasks.ASSIGN` نیاز دارد.

## شواهد تست
- `tests/rbac-configurability.test.mjs`: 13 assertion، شامل مشاهده geo، جدایی view/manage و رد دسترسی کاربر بدون مجوز.
- `tests/geoWorkspaceContracts.test.mjs`: 9 assertion قراردادی برای route guard، navigation، permission matrix، scope، point-in-polygon، versioning و عدم نمایش سنجه غیرمتصل.
- `node scripts/audit-actions.mjs`: 74/74 handler تغییردهنده دارای guard در ممیزی ایستا.

## محدودیت‌ها/ریسک‌های باز
- این‌ها کنترل‌های سمت کلاینت هستند؛ کاربر کنترل‌گر state محلی است و این روش مرز امنیتی برای دادهٔ حساس محسوب نمی‌شود.
- `geo.manage` در حال حاضر به صورت مجوز کلی زون/انتساب است؛ مجوزهای جداگانه برای ویرایش هندسه، فعال‌سازی، انتساب و export هنوز تفکیک نشده‌اند.
- Scope مشتری از RBAC حساب‌ها reuse می‌شود، اما scope اختصاصی زون (territory/team ownership) هنوز کامل نیست؛ مدل `GeoZone` باید با سیاست واقعی قلمرو و تیم هم‌راستا شود.
- فیلدهای `SEE/DO/HIDDEN` در تنظیمات قابل تنظیم‌اند، ولی پوشش واقعی تمام rendererها و APIها هنوز audit و اثبات نشده است.
- آزمون مرورگر، iOS، API و SQL Server RLS اجرا نشده است.


## افزوده b20 — کنترل نتیجه وظیفهٔ وصول
- ثبت نتیجه از `canOn('tasks','EDIT', ...)` استفاده می‌کند و همان scope موجود وظایف را می‌سنجد. این بررسی client-side است و مرز امنیتی server-side نیست.
- فهرست taskها به `source=GEO_ZONE`, `taskType=COLLECTION`, زون انتخاب‌شده و مشتریان قابل مشاهده محدود است.
- اعتبارسنجی helper مانع ثبت پرداخت ناشناخته/معلق/متعلق به مشتری دیگر و مبلغ دستی می‌شود. این کنترل‌ها باید در Backend تکرار شوند.


## b22 delta
- The geo collection report is built only from tasks passing customer visibility and `RBACService.canActOnRecord('tasks', 'VIEW', ...)` in the client.
- Export button requires `geo.view`; report contents inherit the filtered task subset.
- The workspace now explicitly destructures `rbac` from `useCan`; this avoids relying on an undeclared identifier.
- These controls are client-side and are not a security boundary against modified browser state or direct API calls. Backend authorization and SQL Server RLS remain mandatory before production data.


## b23 delta
- Summary and detail exports consume the same date-filtered task subset already scoped to visible customers and tasks.
- UI report table is limited to the selected zone and current client RBAC scope; it does not implement server-side authorization.
- Export controls require `geo.view`. Direct API/RLS enforcement remains a production blocker.


## b24 delta
- Financial diagnostic in Geo workspace only receives invoices, payments and allocations associated with customers inside the selected zone, derived from the currently visible customer set.
- This remains client-side filtering; backend authorization/RLS is still required.
