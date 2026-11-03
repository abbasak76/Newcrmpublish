import type { AppState } from '../types.ts';

export function generateSeedData(): AppState {
  const defaultCustomers = [
    {
      id: 'cust-1',
      name: 'شرکت مهندسی فراگستر',
      company: 'فراگستر نوین',
      phone: '02188776655',
      email: 'info@faragostar.com',
      ownerId: 'user-admin',
      branchId: 'branch-tehran',
      status: 'ACTIVE',
      creditLimit: 500000000,
      balance: 150000000,
      totalRevenue: 450000000,
      createdAt: '2025-01-15T09:00:00Z',
      contacts: [
        {
          id: 'con-1',
          name: 'مهندس حسینی',
          title: 'مدیر تدارکات و خرید',
          phone: '09121112233',
          email: 'hosseini@faragostar.com',
          isPrimary: true
        }
      ]
    },
    {
      id: 'cust-2',
      name: 'صنایع فولاد آذرخش',
      company: 'فولاد آذرخش',
      phone: '02122334455',
      email: 'contact@azarakhsh.ir',
      ownerId: 'user-sales-1',
      branchId: 'branch-tehran',
      status: 'ACTIVE',
      creditLimit: 800000000,
      balance: 0,
      totalRevenue: 280000000,
      createdAt: '2025-02-10T11:30:00Z',
      contacts: [
        {
          id: 'con-2',
          name: 'دکتر صابری',
          title: 'معاون بازرگانی',
          phone: '09123334455',
          email: 'saberi@azarakhsh.ir',
          isPrimary: true
        }
      ]
    },
  ];

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  return {
    schemaVersion: 19,
    currentUserId: 'user-admin',
    users: [
      {
        id: 'user-admin',
        name: 'احمد اخوان',
        username: 'a.akhavan',
        email: 'admin@akhavan.ir',
        phone: '09121111111',
        roleId: 'role-admin',
        permissionSetId: 'perm-admin',
        branchId: 'branch-tehran',
        isActive: true,
        active: true,
        onboardingCompleted: false
      },
      {
        id: 'user-sales-1',
        name: 'سارا رضایی',
        username: 's.rezaei',
        email: 'rezaei@akhavan.ir',
        phone: '09122222222',
        roleId: 'role-sales',
        permissionSetId: 'perm-sales',
        branchId: 'branch-tehran',
        isActive: true,
        active: true,
        onboardingCompleted: true
      },
      {
        id: 'user-finance-1',
        name: 'رضا کمالی',
        username: 'r.kamali',
        email: 'kamali@akhavan.ir',
        phone: '09123333333',
        roleId: 'role-finance',
        permissionSetId: 'perm-admin',
        branchId: 'branch-tehran',
        isActive: true,
        active: true,
        onboardingCompleted: true
      }
    ],
    roles: [
      {
        id: 'role-admin',
        name: 'مدیر ارشد سامانه',
        visibilityScope: 'ORG',
        description: 'دسترسی کامل به کل سازمان و تمامی شعب',
        requiredDevicePermissions: ['LOCATION', 'NOTIFICATIONS']
      },
      {
        id: 'role-sales',
        name: 'کارشناس فروش و مذاکرات',
        visibilityScope: 'OWNER',
        description: 'دسترسی به پرونده‌ها و مشتریان تخصیص‌یافته به خود',
        requiredDevicePermissions: ['NOTIFICATIONS']
      },
      {
        id: 'role-finance',
        name: 'مدیر امور مالی و وصول مطالبات',
        visibilityScope: 'ORG',
        description: 'دسترسی کامل به تراکنش‌ها، چک‌ها و صورتحساب‌ها',
        requiredDevicePermissions: ['NOTIFICATIONS']
      }
    ],
    permissionSets: [
      {
        id: 'perm-admin',
        name: 'دسترسی کامل مدیریتی',
        permissions: [
          'accounts.view',
          'accounts.edit',
          'accounts.delete',
          'leads.view',
          'leads.edit',
          'quotes.view',
          'quotes.create',
          'quotes.approve',
          'finance.view',
          'finance.manage',
          'settings.manage',
          'cases.view',
          'cases.edit',
          'marketing.manage',
          'knowledge.manage',
          'agents.manage',
          'automation.manage',
          'users.manage',
          'roles.manage',
          'internal.view',
          'internal.manage',
          'geo.view',
          'geo.manage',
        ],
      },
      {
        id: 'perm-sales',
        name: 'دسترسی کارشناس فروش',
        permissions: [
          'accounts.view',
          'accounts.edit',
          'leads.view',
          'leads.edit',
          'quotes.view',
          'quotes.create',
          'finance.view',
          'internal.view',
          'knowledge.manage'
        ],
      },
    ],
    groups: [
      {
        id: 'group-tehran-sales',
        name: 'تیم فروش و بازرگانی تهران',
        description: 'هماهنگی و پیگیری سفارشات مشتریان مستقر در استان تهران و البرز',
        managerId: 'user-admin',
        memberIds: ['user-admin', 'user-sales-1'],
        active: true
      },
      {
        id: 'group-finance-coll',
        name: 'تیم مالی و وصولی',
        description: 'پایش سررسید چک‌ها، تسهیم اسناد دریافتی و تراز بدهی مشتریان',
        managerId: 'user-admin',
        memberIds: ['user-admin', 'user-finance-1'],
        active: true
      }
    ],
    customers: defaultCustomers,
    accounts: defaultCustomers,
    quotes: [
      {
        id: 'quote-101',
        quoteNumber: 'Q-1403-101',
        accountId: 'cust-1',
        customerId: 'cust-1',
        ownerId: 'user-admin',
        totalAmount: 185000000,
        marginPercent: 20,
        status: 'DRAFT',
        lines: [
          {
            id: 'line-1',
            productId: 'prod-1',
            quantity: 3,
            unitPrice: 50000000,
            costPrice: 20000000,
            lineTotal: 150000000
          }
        ],
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date().toISOString()
      },
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'پیگیری تسویه فاکتور شرکت فراگستر',
        description: 'تماس با واحد مالی جهت هماهنگی وصول مانده فاکتور',
        accountId: 'cust-1',
        customerId: 'cust-1',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: todayStr,
        slaStatus: 'ON_TRACK',
        assigneeType: 'USER',
        assigneeId: 'user-admin',
        assignedTo: 'user-admin',
        createdAt: new Date().toISOString()
      },
    ],
    opportunities: [
      {
        id: 'opp-1',
        accountId: 'cust-1',
        title: 'قرارداد توسعه زیرساخت و لایسنس سالانه',
        amount: 250000000,
        stage: 'NEGOTIATION',
        expectedCloseDate: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
        ownerId: 'user-admin',
        createdAt: new Date().toISOString()
      }
    ],
    externalProducts: [
      {
        id: 'prod-1',
        name: 'سرویس CRM ابری اخوان',
        code: 'AKH-CRM-CLOUD',
        sku: 'AKH-CRM-CLOUD',
        category: 'نرم‌افزار',
        unitPrice: 50000000,
        basePrice: 50000000,
        costPrice: 20000000,
        stock: 12, minStock: 5, stockAsOf: new Date().toISOString(), source: 'LOCAL_TEST',
      },
      {
        id: 'prod-2',
        name: 'پکیج ماژول یکپارچه‌سازی مالی و CPQ',
        code: 'AKH-MOD-FIN',
        sku: 'AKH-MOD-FIN',
        category: 'ماژول‌های تخصصی',
        unitPrice: 35000000,
        basePrice: 35000000,
        costPrice: 12000000,
        stock: 4, minStock: 8, stockAsOf: new Date().toISOString(), source: 'LOCAL_TEST',
      }
    ],
    suppliers: [
      { id: 'test-supplier-1', code: 'SUP-TEST-01', name: 'تأمین‌کننده آزمایشی یک', phone: '', status: 'ACTIVE', source: 'LOCAL_TEST' },
      { id: 'test-supplier-2', code: 'SUP-TEST-02', name: 'تأمین‌کننده آزمایشی دو', phone: '', status: 'ACTIVE', source: 'LOCAL_TEST' },
    ],
    purchaseRequests: [
      { id: 'test-purchase-1001', requestNumber: 'PR-TEST-1001', supplierId: 'test-supplier-2', productId: 'prod-2', quantity: 20, status: 'OPEN', reason: 'موجودی آزمایشی زیر نقطه سفارش', source: 'LOCAL_TEST', createdAt: new Date().toISOString() },
    ],
    // داده‌های عملیاتی صرفاً برای آزمون محلی؛ هر رکورد با source=LOCAL_TEST برچسب می‌خورد.
    salesOrders: [
      { id: 'test-order-1001', orderNumber: 'TEST-1405-1001', customerId: 'cust-1', ownerId: 'user-admin', status: 'PENDING_APPROVAL', currency: 'IRR', totalAmount: 150000000, costAmount: 60000000, costKnown: true, lines: [{ id: 'test-order-line-1001', productId: 'prod-1', productName: 'سرویس CRM ابری اخوان', quantity: 3, unitPrice: 50000000, costPrice: 20000000, lineTotal: 150000000 }], notes: 'سفارش نمونه برای آزمون چرخه تأیید', source: 'LOCAL_TEST', externalReference: null, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString(), branchId: 'branch-tehran' },
      { id: 'test-order-1002', orderNumber: 'TEST-1405-1002', customerId: 'cust-2', ownerId: 'user-sales-1', status: 'APPROVED', currency: 'IRR', totalAmount: 105000000, costAmount: null, costKnown: false, lines: [{ id: 'test-order-line-1002', productId: 'prod-2', productName: 'پکیج ماژول یکپارچه‌سازی مالی و CPQ', quantity: 3, unitPrice: 35000000, costPrice: null, lineTotal: 105000000 }], notes: 'بهای تمام‌شده عمداً نامشخص است تا رفتار پوشش سود تست شود', source: 'LOCAL_TEST', externalReference: null, createdAt: new Date(Date.now() - 43200000).toISOString(), updatedAt: new Date().toISOString(), branchId: 'branch-tehran' },
    ],
    dispatchPlans: [
      { id: 'test-dispatch-1001', planNumber: 'DP-TEST-1001', name: 'مسیر آزمایشی تهران شمال', vehicleLabel: 'خودروی تست A', capacityKg: 1200, plannedWeightKg: null, zone: 'NORTH', orderIds: ['test-order-1002'], status: 'DRAFT', source: 'LOCAL_TEST', createdBy: 'user-admin', createdAt: new Date().toISOString() },
    ],
    salesReturns: [
      { id: 'test-return-1001', returnNumber: 'RET-TEST-1001', orderId: 'test-order-1001', invoiceId: null, customerId: 'cust-1', amount: 5000000, reason: 'نمونه برگشت برای آزمون؛ سند مالی مرجع متصل نیست', status: 'OPEN', source: 'LOCAL_TEST', financialDocumentConfirmed: false, createdBy: 'user-admin', createdAt: new Date().toISOString() },
    ],
    commercialPolicies: [
      { id: 'test-policy-1001', name: 'کنترل آزمایشی فروش اعتباری', type: 'NO_CREDIT', scope: 'COMPANY', value: null, enabled: true, enforcement: 'CRM_TEST_ONLY', createdBy: 'user-admin', createdAt: new Date().toISOString() },
      { id: 'test-policy-1002', name: 'هشدار آزمایشی حاشیه سود پایین', type: 'MIN_MARGIN', scope: 'COMPANY', value: '12', enabled: true, enforcement: 'CRM_TEST_ONLY', createdBy: 'user-admin', createdAt: new Date().toISOString() },
    ],
    reconciliationCases: [
      { id: 'test-case-1001', caseNumber: 'REC-TEST-1001', type: 'RETURN_REVIEW', title: 'تطبیق برگشت نمونه با سند مالی', relatedEntityType: 'SalesReturn', relatedEntityId: 'test-return-1001', reason: 'برگشتی آزمایشی ثبت شده اما سند بستانکاری معتبر به آن متصل نیست؛ مانده نباید خودکار تغییر کند.', status: 'OPEN', severity: 'MEDIUM', assignedTo: 'user-finance-1', createdAt: new Date().toISOString() },
      { id: 'test-case-1002', caseNumber: 'REC-TEST-1002', type: 'COST_COVERAGE', title: 'بهای تمام‌شده نامشخص در سفارش', relatedEntityType: 'SalesOrder', relatedEntityId: 'test-order-1002', reason: 'تا دریافت بهای معتبر، سود و حاشیه سود این سفارش قابل تأیید نیست.', status: 'OPEN', severity: 'HIGH', assignedTo: 'user-admin', createdAt: new Date().toISOString() },
    ],
    seedMetadata: { mode: 'LOCAL_TEST', seededAt: new Date().toISOString(), schema: 'operations-v1', note: 'داده‌های مصنوعی برای آزمون؛ هیچ اتصال ERP یا سند مالی واقعی وجود ندارد.' },
    invoices: [
      {
        id: 'INV-1001',
        invoiceNumber: 'INV-1403-1001',
        accountId: 'cust-1',
        customerId: 'cust-1',
        totalAmount: 150000000,
        paidAmount: 50000000,
        balance: 100000000,
        status: 'PARTIAL',
        date: '2025-03-01',
        dueDate: todayStr
      },
    ],
    payments: [
      {
        id: 'pay-1',
        accountId: 'cust-1',
        customerId: 'cust-1',
        amount: 50000000,
        date: '2025-03-05',
        method: 'TRANSFER',
        reference: 'TR-889922',
        status: 'CLEARED',
        notes: 'حواله ساتنا پیش‌پرداخت'
      }
    ],
    paymentAllocations: [
      {
        id: 'alloc-1',
        paymentId: 'pay-1',
        invoiceId: 'INV-1001',
        amount: 50000000,
        createdAt: '2025-03-05T10:00:00Z'
      }
    ],
    cheques: [
      {
        id: 'chq-1',
        chequeNumber: '782910384756',
        bankName: 'بانک ملت - شعبه مرکزی',
        amount: 100000000,
        dueDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
        status: 'PENDING',
        customerId: 'cust-1',
        accountId: 'cust-1'
      }
    ],
    activities: [
      {
        id: 'act-1',
        accountId: 'cust-1',
        customerId: 'cust-1',
        type: 'CALL',
        title: 'مذاکره تلفنی در خصوص تمدید پشتیبانی',
        description: 'با مهندس حسینی صحبت شد؛ کلیات قرارداد مورد توافق قرار گرفت.',
        dateTime: new Date(Date.now() - 86400000).toISOString(),
        ownerId: 'user-admin'
      }
    ],
    internalRequests: [
      {
        id: 'req-1',
        type: 'LEAVE',
        title: 'درخواست مرخصی استحقاقی دوره‌ای',
        creatorId: 'user-sales-1',
        currentAssigneeId: 'user-admin',
        status: 'IN_REVIEW',
        data: {
          startDate: todayStr,
          endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          substituteName: 'احمد اخوان'
        },
        createdAt: new Date().toISOString()
      }
    ],
    internalMeetings: [
      {
        id: 'meet-1',
        title: 'جلسه بازنگری تارگت‌های فصلی فروش',
        date: todayStr,
        startTime: '10:30',
        endTime: '12:00',
        organizerId: 'user-admin',
        participantIds: ['user-admin', 'user-sales-1'],
        groupIds: ['group-tehran-sales']
      }
    ],
    notifications: [],
    businessEvents: [],
    timelineEvents: [
      {
        id: 'tl-1',
        customerId: 'cust-1',
        type: 'CALL',
        title: 'مذاکره تلفنی در خصوص تمدید پشتیبانی',
        description: 'با مهندس حسینی صحبت شد؛ کلیات قرارداد مورد توافق قرار گرفت.',
        dateTime: new Date(Date.now() - 86400000).toISOString(),
        relatedEntityId: 'act-1'
      }
    ],
    articles: [
      {
        id: 'art-base-1',
        title: 'شیوه‌نامه استعلام و اعتبارسنجی مشتریان جدید FMCG',
        category: 'اعتبارسنجی و مالی',
        content: 'تمامی مشتریان عمده و هایپرمارکت‌ها پیش از تخصیص سقف اعتبار بالای ۱۰۰ میلیون ریال موظف به ارائه شناسه ملی، پروانه کسب معتبر و استعلام بانکی صیاد از طریق کارشناس مالی شرکت می‌باشند.',
        status: 'PUBLISHED',
        authorId: 'user-admin',
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'art-base-2',
        title: 'دستورالعمل ثبت و تسویه پیش‌فاکتورها در موتور CPQ',
        category: 'فروش و بازرگانی',
        content: 'در هنگام صدور پیش‌فاکتور، اعمال تخفیفات پلکانی بیش از ۵ درصد نیازمند تایید سرپرست فروش بوده و حاشیه سود نهایی نباید از ۱۵ درصد کف مصوب سازمانی کمتر باشد.',
        status: 'PUBLISHED',
        authorId: 'user-admin',
        createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    cases: [
      {
        id: 'case-base-1',
        caseNumber: 'CS-1403-01',
        accountId: 'cust-1',
        subject: 'درخواست بازبینی سقف اعتبار تجاری',
        description: 'مشتری تقاضای بازبینی سقف اعتبار برای ثبت سفارش جدید خواربار را دارد.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        ownerId: 'user-admin',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    campaigns: [
      {
        id: 'camp-base-1',
        name: 'جشنواره توزیع روغن و برنج بهاره',
        status: 'ACTIVE',
        description: '۳ درصد تخفیف نقدی برای سفارشات حجمی بالاتر از ۵۰ میلیون ریال',
        targetAudience: 'فروشگاه‌های زنجیره‌ای و هایپرمارکت‌ها',
        startDate: todayStr,
        endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
        executionCount: 5,
        budget: 150000000
      }
    ],
    geoZones: [
      {
        id: 'zone-base-1',
        code: 'ZONE-TH-01',
        name: 'زون ۱ — تهران مرکزی و بازار',
        status: 'ACTIVE',
        ownerId: 'user-admin',
        currentGeometryVersionId: 'gv-base-1',
        createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    zoneGeometryVersions: [
      {
        id: 'gv-base-1',
        zoneId: 'zone-base-1',
        version: 1,
        geometry: {
          type: 'Polygon',
          coordinates: [[[51.36, 35.67], [51.44, 35.67], [51.44, 35.73], [51.36, 35.73], [51.36, 35.67]]]
        },
        effectiveFrom: '2025-01-01T00:00:00Z',
        effectiveTo: null,
        createdBy: 'user-admin',
        createdAt: new Date(Date.now() - 86400000 * 60).toISOString()
      }
    ],
    zoneAssignments: [
      {
        id: 'za-base-1',
        zoneId: 'zone-base-1',
        entityType: 'CUSTOMER',
        entityId: 'cust-1',
        method: 'MANUAL',
        effectiveFrom: '2025-01-01T00:00:00Z',
        effectiveTo: null,
        createdBy: 'user-admin',
        createdAt: new Date(Date.now() - 86400000 * 60).toISOString()
      }
    ],
    financeRequests: [
      {
        id: 'freq-base-1',
        kind: 'PAYMENT_ORDER',
        payeeName: 'شرکت حمل‌ونقل و باربری سریع',
        amount: 35000000,
        reason: 'تسویه کرایه حمل بارنامه توزیع شعبه تهران',
        dueDate: todayStr,
        requestedBy: 'user-admin',
        status: 'SUBMITTED',
        erpStatus: 'NOT_CONFIGURED',
        createdAt: new Date().toISOString()
      }
    ],
    creditNotes: [
      {
        id: 'cn-base-1',
        creditNoteNumber: 'CN-1403-01',
        accountId: 'cust-1',
        customerId: 'cust-1',
        amount: 5000000,
        reason: 'بستانکاری بابت تخفیف نقدی تسویه فاکتور INV-1001',
        status: 'POSTED',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
      }
    ],
    onboardingApplications: [
      {
        id: 'app-base-1',
        firstName: 'محمدرضا',
        lastName: 'کاظمی',
        mobile: '09124455667',
        nationalId: '0499370899',
        desiredRole: 'ویزیتور میدانی بازاریابی',
        status: 'UNDER_REVIEW',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ],
    personnelFiles: [
      {
        id: 'pf-base-1',
        userId: 'user-sales-1',
        fullName: 'سارا رضایی',
        nationalCode: '0499370899',
        contractType: 'PERMANENT',
        department: 'فروش و بازاریابی',
        jobTitle: 'کارشناس فروش',
        hireDate: '2024-03-20',
        status: 'ACTIVE',
        bankAccount: { bank: 'بانک ملت', iban: 'IR062960000000100324200001' }
      }
    ],
    auditLogs: [],
    attachments: [],
    agents: [
      {
        id: 'agent-sales',
        name: 'دستیار هوشمند فروش و جذب سرنخ',
        type: 'SALES',
        role: 'پایش و پیگیری خودکار فرصت‌های تجاری و سرنخ‌های جدید',
        active: true,
        requiresHumanApproval: false,
        allowedTools: ['createTask', 'searchAccounts', 'calculateQuote'],
        prompt: 'پاسخگویی سریع به سرنخ‌های ورودی، اولویت‌بندی تماس‌ها و هماهنگی جلسات دمو',
        autonomyLevel: 85,
        description: 'تسهیل چرخه تبدیل سرنخ به مشتری و یادآوری پیگیری‌های فروش',
        lastActive: new Date().toISOString()
      },
      {
        id: 'agent-collection',
        name: 'دستیار پایش مطالبات و وصولی',
        type: 'COLLECTION',
        role: 'پایش سررسید چک‌ها، اخطار فاکتورهای معوق و هشدار برگشتی',
        active: true,
        requiresHumanApproval: true,
        allowedTools: ['createTask', 'searchAccounts'],
        prompt: 'ارسال یادآوری پیامکی و بومی پیش از موعد سررسید چک و ارجاع موارد پرریسک به سرپرست مالی',
        autonomyLevel: 70,
        description: 'پیشگیری از نکول مطالبات با اخطارهای محترمانه چندمرحله‌ای',
        lastActive: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'agent-pricing',
        name: 'دستیار تحلیل قیمت و مظنه (CPQ)',
        type: 'PRICING',
        role: 'تحلیل حاشیه سود، اعتبارسنجی تخفیف‌های پلکانی و پیشنهاد پکیج',
        active: true,
        requiresHumanApproval: true,
        allowedTools: ['calculateQuote', 'negotiateTerms'],
        prompt: 'بررسی حداقل کف حاشیه سود مصوب و پیشنهاد بهترین شیوه پرداخت نقدی/اقساطی',
        autonomyLevel: 60,
        description: 'تضمین سودآوری در پیش‌فاکتورها و جلوگیری از نقض سیاست‌های قیمت‌گذاری',
        lastActive: new Date(Date.now() - 3600000 * 5).toISOString()
      }
    ],
    agentLogs:  [],
    messagingChannels:  [
      { id: 'eitaa', name: 'پیام‌رسان ایتا (Eitaa)', type: 'EITAA', active: false, status: 'NOT_CONFIGURED', botToken: '', webhookUrl: '', autoReply: false },
      { id: 'rubika', name: 'سوپراپلیکیشن روبیکا (Rubika)', type: 'RUBIKA', active: false, status: 'NOT_CONFIGURED', botToken: '', webhookUrl: '', autoReply: false },
      { id: 'bale', name: 'پیام‌رسان بله (Bale)', type: 'BALE', active: false, status: 'NOT_CONFIGURED', botToken: '', webhookUrl: '', autoReply: false },
      { id: 'kavenegar', name: 'درگاه پیامک خدماتی (کاوه‌نگار)', type: 'SMS', active: false, status: 'NOT_CONFIGURED', botToken: '', webhookUrl: '', autoReply: false },
      { id: 'telegram', name: 'تلگرام بات (Telegram)', type: 'TELEGRAM', active: false, status: 'NOT_CONFIGURED', botToken: '', webhookUrl: '', autoReply: false },
      { id: 'custom_webhook', name: 'وب‌هوک سفارشی سازمانی', type: 'WEBHOOK', active: false, status: 'NOT_CONFIGURED', botToken: '', webhookUrl: '', autoReply: false }
    ],
    messagingLogs:  [],
    settings: {
      enforceDevicePermissions: false,
      quoteApprovalMarginThreshold: 15,
      aiKillSwitch: false,
      orgConfig: {
        tenantName: 'گروه اخوان',
        enableLeadManagement: true,
        enableOpportunities: true,
        enableQuotes: true,
        enableFinance: true
      },
      locale: {
        rtl: true,
        language: 'fa',
        calendar: 'jalali',
        currency: 'IRR',
        timezone: 'Asia/Tehran',
        firstDayOfWeek: 6,
        numberFormat: 'persian'
      },
      privacy: {
        soundEnabled: true
      },
      integrations: {
        erpConnector: { active: false, status: 'NOT_CONFIGURED', endpoint: '', token: '' },
        whatsappGateway: { active: false, status: 'NOT_CONFIGURED', endpoint: '', token: '' },
        smsGateway: { active: false, status: 'NOT_CONFIGURED', endpoint: '', token: '' }
      }
    }
  };
}

/* =====================================================================
 * موتور داده آزمایشی (Demo Seed Engine)
 * - قطعی (Deterministic): با PRNG ثابت؛ هیچ داده‌ای هاردکد نشده، همه از الگوها تولید می‌شوند.
 * - ضدتکرار (Idempotent): شناسه‌ها با پیشوند «demo-» ثابت‌اند؛ اجرای مجدد رکورد تکراری نمی‌سازد.
 * - ایمن: فقط رکورد اضافه می‌کند؛ هیچ رکورد واقعی را تغییر یا حذف نمی‌کند. purgeDemoData فقط رکوردهای demo- را برمی‌دارد.
 * - فقط با درخواست صریح (دکمه + تأیید) یا در محیط توسعه فراخوانی شود.
 * ===================================================================== */
export const DEMO_PREFIX = 'demo-';
export const isDemoId = (id: any) => typeof id === 'string' && id.startsWith(DEMO_PREFIX);

function mulberry32(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** پرتره سبک‌وار (SVG) برای پرسنل؛ تصویر واقعی نیست و کاملاً محلی تولید می‌شود */
export function generateAvatarSvg(seedNum: number, female: boolean): string {
  const r = mulberry32(seedNum);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const skin = pick(['#F2C9A5', '#E6B98F', '#D19C72', '#B67C54', '#966044']);
  const hair = pick(['#1B1B1D', '#2E211B', '#4A3123', '#6B4A32', '#23252B']);
  const [b1, b2] = pick([['#DDE5F7', '#B7C6EC'], ['#F3DEDC', '#E6B7B2'], ['#DDEFE0', '#B5DBB8'], ['#F6EBD2', '#EBCFA0'], ['#E4E1F3', '#C6BFE6']]);
  const shirt = pick(['#2F3138', '#4B5F9E', '#B24E47', '#3E7C55', '#8A6B3A', '#5B4B8A']);
  const glasses = !female && r() > 0.7, beard = !female && r() > 0.55;
  const hairBack = female ? `<path d="M34 78C28 44 52 24 80 24s52 20 46 54c-3 24-6 42-10 54H44c-4-12-7-30-10-54z" fill="${hair}"/>` : '';
  const hairTop = female
    ? `<path d="M46 66c2-24 18-36 34-36s32 12 34 36c-12-8-24-14-34-14S58 58 46 66z" fill="${hair}"/>`
    : `<path d="M48 62c0-22 14-34 32-34s32 12 32 34c-8-8-18-12-32-12S56 54 48 62z" fill="${hair}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b1}"/><stop offset="1" stop-color="${b2}"/></linearGradient></defs><rect width="160" height="160" fill="url(#g)"/>${hairBack}<path d="M18 160c4-30 26-42 62-42s58 12 62 42z" fill="${shirt}"/><rect x="68" y="98" width="24" height="26" rx="10" fill="${skin}"/><ellipse cx="80" cy="74" rx="30" ry="34" fill="${skin}"/>${beard ? `<path d="M52 78c2 26 14 36 28 36s26-10 28-36c-6 12-16 16-28 16s-22-4-28-16z" fill="${hair}" opacity=".9"/>` : ''}${hairTop}<circle cx="68" cy="76" r="2.8" fill="#23252B"/><circle cx="92" cy="76" r="2.8" fill="#23252B"/>${glasses ? `<g fill="none" stroke="#23252B" stroke-width="2"><circle cx="68" cy="76" r="9"/><circle cx="92" cy="76" r="9"/><path d="M77 76h6"/></g>` : ''}<path d="M70 92q10 8 20 0" fill="none" stroke="#7A3B33" stroke-width="2.6" stroke-linecap="round"/></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

export interface DemoSeedReport { created: Record<string, number>; skipped: number; total: number }

const M_NAMES = ['علی', 'محمد', 'حسین', 'رضا', 'مهدی', 'امیر', 'سعید', 'پیمان', 'کامران', 'بهروز'];
const F_NAMES = ['سارا', 'مریم', 'زهرا', 'نگار', 'الهام', 'فاطمه', 'نیلوفر', 'شیما', 'پریسا', 'مینا'];
const LASTS = ['رضایی', 'کریمی', 'حسینی', 'احمدی', 'موسوی', 'جعفری', 'صادقی', 'کاظمی', 'نوری', 'طاهری', 'فرهادی', 'سلیمانی', 'اکبری', 'باقری', 'رحیمی'];
const SHOP_TYPES = ['فروشگاه', 'سوپرمارکت', 'هایپرمارکت', 'قنادی', 'رستوران', 'عمده‌فروشی', 'سلف‌سرویس', 'میوه و تره‌بار'];
const SHOP_NAMES = ['آفتاب', 'گلبرگ', 'نیلوفر', 'پارسیان', 'آریا', 'مهر', 'سپیدار', 'بهار', 'ستاره', 'کوروش', 'رضوان', 'نگین', 'ایرانیان', 'فجر', 'سروش', 'پیمان', 'ماهان', 'نارنج', 'دنا', 'کیان', 'طوبی', 'شمیم', 'آرمان', 'ترنج', 'سپهر', 'بامداد', 'گیلار', 'هستی'];
const CITIES: [string, number, number][] = [['تهران', 35.70, 51.40], ['کرج', 35.83, 50.99], ['قم', 34.64, 50.88], ['اصفهان', 32.65, 51.67], ['شیراز', 29.59, 52.58], ['مشهد', 36.30, 59.60], ['تبریز', 38.08, 46.29], ['ساوه', 35.02, 50.36]];
const STREETS = ['بلوار آزادی', 'خیابان مطهری', 'میدان فاطمی', 'بلوار کشاورز', 'خیابان شریعتی', 'بلوار امام رضا', 'خیابان ولیعصر', 'جاده مخصوص'];
const PRODUCTS: [string, string, string, number, number][] = [
  ['روغن مایع آفتابگردان ۱٫۸ لیتری', 'روغن و چربی', 'کارتن', 5200000, 0.86], ['برنج ایرانی طارم ۱۰ کیلویی', 'برنج و غلات', 'کیسه', 9800000, 0.89],
  ['قند حبه ۹۰۰ گرمی', 'قند و شکر', 'کارتن', 2600000, 0.9], ['چای کله‌مورچه ۵۰۰ گرمی', 'چای', 'کارتن', 7400000, 0.84], ['ماکارونی فرمی ۵۰۰ گرمی', 'ماکارونی', 'کارتن', 1900000, 0.88],
  ['رب گوجه‌فرنگی ۸۰۰ گرمی', 'کنسرو و رب', 'کارتن', 3100000, 0.87], ['نوشابه خانواده ۱٫۵ لیتری', 'نوشیدنی', 'پک', 2300000, 0.82], ['آب معدنی ۰٫۵ لیتری', 'نوشیدنی', 'پک', 1100000, 0.8],
  ['شکر سفید ۱ کیلویی', 'قند و شکر', 'کیسه', 2450000, 0.92], ['لوبیا چیتی ۹۰۰ گرمی', 'حبوبات', 'کارتن', 4300000, 0.88], ['عدس ۹۰۰ گرمی', 'حبوبات', 'کارتن', 3900000, 0.88],
  ['نمک یددار ۷۵۰ گرمی', 'ادویه', 'کارتن', 900000, 0.85], ['تن ماهی ۱۸۰ گرمی', 'کنسرو و رب', 'کارتن', 6100000, 0.83], ['شیر پرچرب ۱ لیتری', 'لبنیات', 'پک', 2700000, 0.9],
  ['پنیر UF ۴۰۰ گرمی', 'لبنیات', 'کارتن', 5600000, 0.86], ['بیسکویت ساقه‌طلایی', 'تنقلات', 'کارتن', 2100000, 0.81], ['شوینده ظرف ۷۵۰ میلی', 'بهداشتی', 'کارتن', 3400000, 0.84], ['دستمال کاغذی ۲۰۰ برگ', 'بهداشتی', 'پک', 1800000, 0.82],
];
const SUPPLIERS = ['شرکت پخش گلستان', 'صنایع غذایی ماهان', 'کشت و صنعت دشت سبز', 'بازرگانی نیکان', 'شرکت لبنی شمیم', 'پخش سراسری آرمان'];
const EXPENSE_CATS: [string, string, number, number][] = [['اجاره انبار', 'ثابت', 140000000, 140000000], ['سوخت و حمل‌ونقل', 'عملیاتی', 50000000, 110000000], ['تعمیر و نگهداری خودرو', 'عملیاتی', 20000000, 90000000], ['تبلیغات و بازاریابی', 'بازاریابی', 30000000, 110000000], ['قبوض و انرژی', 'ثابت', 25000000, 60000000], ['بسته‌بندی و ملزومات', 'عملیاتی', 15000000, 70000000]];

/** افزودن داده آزمایشی به draft؛ مقدار برگشتی گزارش شمارش‌هاست. فقط رکوردهای جدید با پیشوند demo- افزوده می‌شوند. */
export function applyDemoSeed(draft: AppState, now: Date = new Date()): DemoSeedReport {
  const r = mulberry32(14050725);
  const rnd = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
  const pick = <T,>(a: T[]): T => a[Math.floor(r() * a.length)];
  const day = (offset: number) => new Date(now.getTime() + offset * 86400000);
  const iso = (offset: number, hour = 10) => { const d = day(offset); d.setHours(hour, rnd(0, 59), 0, 0); return d.toISOString(); };
  const ymd = (offset: number) => day(offset).toISOString().split('T')[0];
  const created: Record<string, number> = {}; let skipped = 0;

  const add = (key: string, rows: any[]) => {
    const list: any[] = ((draft as any)[key] ||= []);
    const ids = new Set(list.map(x => x.id));
    rows.forEach(row => { if (ids.has(row.id)) { skipped++; return; } list.push(row); ids.add(row.id); created[key] = (created[key] || 0) + 1; });
  };
  const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);

  /* --- کاربران و پرسنل (با تصویر پرتره) --- */
  const staffPlan: { role: string; perm: string; title: string; female: boolean; cost: number }[] = [
    ...Array.from({ length: 5 }, (_, i) => ({ role: 'role-sales', perm: 'perm-sales', title: 'ویزیتور بازاریاب', female: i % 3 === 1, cost: rnd(100, 170) * 1000000 })),
    { role: 'role-sales', perm: 'perm-sales', title: 'سرپرست فروش', female: true, cost: 230000000 },
    { role: 'role-finance', perm: 'perm-admin', title: 'حسابدار و مسئول وصول', female: false, cost: 210000000 },
    { role: 'role-finance', perm: 'perm-admin', title: 'کارشناس مالی', female: true, cost: 160000000 },
    { role: 'role-sales', perm: 'perm-sales', title: 'مسئول انبار و ارسال', female: false, cost: 130000000 },
  ];
  const staff = staffPlan.map((p, i) => ({
    id: `${DEMO_PREFIX}user-${i + 1}`, name: `${p.female ? pick(F_NAMES) : pick(M_NAMES)} ${pick(LASTS)}`, username: `demo.staff${i + 1}`,
    phone: `0912${rnd(1000000, 9999999)}`, roleId: p.role, permissionSetId: p.perm, branchId: 'branch-tehran', jobTitle: p.title,
    monthlyCost: p.cost, isActive: true, active: true, onboardingCompleted: true, avatar: generateAvatarSvg(9100 + i * 37, p.female),
  }));
  add('users', staff);
  const visitors = staff.filter(s => s.jobTitle === 'ویزیتور بازاریاب' || s.jobTitle === 'سرپرست فروش');
  const staffIds = staff.map(s => s.id);
  const salesIds = visitors.map(v => v.id);
  const adminIds = ['user-admin'];

  add('groups', [
    { id: `${DEMO_PREFIX}group-field`, name: 'تیم ویزیتورهای میدانی', description: 'هماهنگی ویزیت روزانه و گزارش بازار', managerId: visitors[visitors.length - 1].id, memberIds: salesIds, active: true },
    { id: `${DEMO_PREFIX}group-finance`, name: 'واحد مالی و وصول مطالبات', description: 'پیگیری چک‌ها و مطالبات معوق', managerId: staff[6].id, memberIds: [staff[6].id, staff[7].id, 'user-finance-1'], active: true },
  ]);

  /* --- مشتریان --- */
  const customers = Array.from({ length: 80 }, (_, i) => {
    const city = CITIES[i % 4 === 0 ? rnd(1, CITIES.length - 1) : 0];
    const owner = salesIds[i % salesIds.length];
    return {
      id: `${DEMO_PREFIX}cust-${i + 1}`, code: `C-1405-${String(100 + i)}`, name: `${SHOP_TYPES[i % SHOP_TYPES.length]} ${SHOP_NAMES[i % SHOP_NAMES.length]}`, company: `${SHOP_NAMES[i % SHOP_NAMES.length]} ${pick(LASTS)}`,
      phone: `021${rnd(20000000, 89999999)}`, email: `demo${i + 1}@example.ir`, address: `${city[0]}، ${pick(STREETS)}، پلاک ${rnd(2, 190)}`,
      city: city[0], lat: +(city[1] + (r() - 0.5) * 0.12).toFixed(5), lng: +(city[2] + (r() - 0.5) * 0.12).toFixed(5),
      ownerId: owner, branchId: 'branch-tehran', status: i % 11 === 10 ? 'INACTIVE' : 'ACTIVE', creditLimit: rnd(30, 200) * 100000000,
      balance: 0, totalRevenue: 0, tags: [pick(['VIP', 'عمده', 'خرده', 'پرسود']), pick(['نقدی', 'اعتباری'])], createdAt: iso(-rnd(120, 520)),
      contacts: [{ id: `${DEMO_PREFIX}con-${i + 1}`, name: `${pick([...M_NAMES, ...F_NAMES])} ${pick(LASTS)}`, title: pick(['مدیر خرید', 'مدیر فروشگاه', 'صاحب فروشگاه', 'مسئول مالی']), phone: `0935${rnd(1000000, 9999999)}`, email: `contact${i + 1}@example.ir`, isPrimary: true }],
    };
  });
  add('accounts', customers.map(c => ({ ...c })));
  add('customers', customers.map(c => ({ ...c })));

  /* --- تأمین‌کنندگان و کالاها --- */
  const suppliers = SUPPLIERS.map((n, i) => ({ id: `${DEMO_PREFIX}sup-${i + 1}`, name: n, city: pick(['تهران', 'کرج', 'اصفهان', 'قزوین']), phone: `021${rnd(30000000, 89999999)}`, paymentTermDays: pick([15, 30, 45, 60]), contact: `${pick(M_NAMES)} ${pick(LASTS)}` }));
  add('suppliers', suppliers);
  const products = PRODUCTS.map(([name, category, unit, price, costRatio], i) => ({
    id: `${DEMO_PREFIX}prod-${i + 1}`, name, code: `P-${200 + i}`, sku: `P-${200 + i}`, category, unit, unitPrice: price, basePrice: price, costPrice: Math.round(price * costRatio),
    supplierId: suppliers[i % suppliers.length].id, stock: rnd(0, 420), minStock: rnd(40, 120), leadTimeDays: rnd(2, 9), weightKgPerUnit: unit === 'کیسه' ? 10 : unit === 'کارتن' ? 6 : 2, source: 'LOCAL_TEST',
  }));
  add('externalProducts', products);

  /* --- پیش‌فاکتورها --- */
  const statusPool = ['ACCEPTED', 'ACCEPTED', 'ACCEPTED', 'ACCEPTED', 'APPROVED', 'SENT', 'SENT', 'DRAFT', 'REJECTED', 'PENDING_APPROVAL'];
  const quotes = Array.from({ length: 240 }, (_, i) => {
    const cust = customers[(i * 5 + rnd(0, 4)) % customers.length];
    const lines = Array.from({ length: rnd(1, 4) }, (_, k) => {
      const p = pick(products), q = rnd(30, 400), up = Math.round(p.basePrice * (0.97 + r() * 0.06));
      return { id: `${DEMO_PREFIX}ql-${i + 1}-${k + 1}`, productId: p.id, quantity: q, unitPrice: up, costPrice: p.costPrice, lineTotal: q * up };
    });
    const total = sum(lines.map(l => l.lineTotal)), cost = sum(lines.map(l => l.costPrice * l.quantity));
    return { id: `${DEMO_PREFIX}quote-${i + 1}`, quoteNumber: `Q-1405-${300 + i}`, accountId: cust.id, customerId: cust.id, ownerId: cust.ownerId, createdBy: cust.ownerId, totalAmount: total, marginPercent: Math.round(((total - cost) / total) * 1000) / 10, status: pick(statusPool), lines, createdAt: iso(-rnd(2, 150)), updatedAt: iso(-rnd(0, 2)) };
  });
  add('quotes', quotes);

  /* --- فاکتور، پرداخت، چک دریافتی و تخصیص (روابط معتبر) --- */
  const invoices: any[] = [], payments: any[] = [], cheques: any[] = [], allocs: any[] = [];
  quotes.filter(q => q.status === 'ACCEPTED' || q.status === 'APPROVED').forEach((q, i) => {
    const age = Math.max(3, Math.round((now.getTime() - new Date(q.createdAt).getTime()) / 86400000) - 2);
    const dueOff = -age + pick([21, 30, 45, 60]);
    const mode = r();
    const paid = mode < 0.68 ? q.totalAmount : mode < 0.84 ? Math.round(q.totalAmount * (0.3 + r() * 0.4)) : 0;
    const balance = q.totalAmount - paid;
    const inv = { id: `${DEMO_PREFIX}inv-${i + 1}`, invoiceNumber: `INV-1405-${500 + i}`, accountId: q.accountId, customerId: q.customerId, quoteId: q.id, totalAmount: q.totalAmount, paidAmount: paid, balance, status: balance === 0 ? 'PAID' : paid > 0 ? (dueOff < 0 ? 'OVERDUE' : 'PARTIAL') : dueOff < 0 ? 'OVERDUE' : 'UNPAID', date: ymd(-age), dueDate: ymd(dueOff) };
    invoices.push(inv);
    if (paid > 0) {
      const method = pick(['TRANSFER', 'CASH', 'CHEQUE', 'CHEQUE']) as 'TRANSFER' | 'CASH' | 'CHEQUE';
      const payId = `${DEMO_PREFIX}pay-${i + 1}`;
      const chqDue = i % 7 === 0 ? rnd(1, 3) : rnd(-45, 40);
      const cleared = method !== 'CHEQUE' || chqDue < 0;
      payments.push({ id: payId, accountId: q.accountId, customerId: q.customerId, amount: paid, date: ymd(-Math.max(1, age - rnd(1, 5))), method, reference: method === 'TRANSFER' ? `TR-${rnd(100000, 999999)}` : undefined, bankName: method === 'CHEQUE' ? pick(['بانک ملت', 'بانک ملی', 'بانک سامان', 'بانک پاسارگاد']) : undefined, chequeDueDate: method === 'CHEQUE' ? ymd(chqDue) : undefined, status: cleared ? 'CLEARED' : 'PENDING', notes: 'پرداخت فاکتور' });
      allocs.push({ id: `${DEMO_PREFIX}alloc-${i + 1}`, paymentId: payId, invoiceId: inv.id, amount: paid, createdAt: iso(-Math.max(1, age - 2)) });
      if (method === 'CHEQUE') cheques.push({ id: `${DEMO_PREFIX}chq-in-${i + 1}`, direction: 'RECEIVABLE', chequeNumber: String(rnd(100000000000, 999999999999)), bankName: payments[payments.length - 1].bankName, amount: paid, dueDate: ymd(chqDue), status: chqDue < 0 ? (r() < 0.12 ? 'BOUNCED' : 'CLEARED') : pick(['PENDING', 'RECEIVED', 'DEPOSITED']), customerId: q.customerId, accountId: q.accountId, paymentId: payId });
    }
  });
  add('invoices', invoices); add('payments', payments); add('cheques', cheques); add('paymentAllocations', allocs);
  // مانده و گردش مشتریان آزمایشی از فاکتورهای همان‌ها
  [(draft.accounts as any[]), ((draft as any).customers as any[])].forEach(list => (list || []).forEach(c => {
    if (!isDemoId(c.id)) return;
    const mine = invoices.filter(x => x.customerId === c.id);
    c.balance = sum(mine.map(x => x.balance)); c.totalRevenue = sum(mine.map(x => x.totalAmount));
  }));

  /* --- فاکتور خرید تأمین‌کنندگان و چک پرداختی (چند مورد در ۱ تا ۳ روز آینده برای هشدار نقدینگی) --- */
  const bills = Array.from({ length: 48 }, (_, i) => {
    const sup = suppliers[i % suppliers.length];
    const dueOff = i < 3 ? i + 1 : rnd(-25, 28);
    const amount = rnd(2, 14) * 100000000;
    const paid = dueOff < -3 ? amount : 0;
    return { id: `${DEMO_PREFIX}bill-${i + 1}`, supplierId: sup.id, billNumber: `B-1405-${70 + i}`, amount, paidAmount: paid, status: paid >= amount ? 'PAID' : dueOff < 0 ? 'OVERDUE' : 'UNPAID', date: ymd(dueOff - sup.paymentTermDays), dueDate: ymd(dueOff) };
  });
  add('supplierBills', bills);
  add('cheques', bills.filter((_, i) => i % 3 !== 2).map((b, i) => ({
    id: `${DEMO_PREFIX}chq-out-${i + 1}`, direction: 'PAYABLE', chequeNumber: String(rnd(100000000000, 999999999999)), bankName: pick(['بانک ملت', 'بانک ملی', 'بانک تجارت']),
    amount: b.amount - b.paidAmount || b.amount, dueDate: b.dueDate, status: b.status === 'PAID' ? 'CLEARED' : 'PENDING', supplierId: b.supplierId, billId: b.id,
  })));

  /* --- هزینه‌ها (حقوق ۳ ماه اخیر + هزینه‌های عملیاتی) --- */
  const expenses: any[] = [];
  Array.from({ length: 6 }, (_, m) => m).forEach(m => staff.forEach(s => expenses.push({ id: `${DEMO_PREFIX}exp-sal-${m}-${s.id}`, title: `حقوق ${s.name}`, category: 'حقوق و دستمزد', amount: s.monthlyCost, date: ymd(-30 * m - 2), dueDate: ymd(-30 * m - 2), status: 'PAID', staffId: s.id })));
  Array.from({ length: 6 }, (_, m) => m).forEach(m => EXPENSE_CATS.forEach(([title, cat, lo, hi], k) => expenses.push({ id: `${DEMO_PREFIX}exp-${m}-${k}`, title, category: cat, amount: rnd(lo / 1000000, hi / 1000000) * 1000000, date: ymd(-30 * m - rnd(1, 20)), dueDate: ymd(-30 * m - 1), status: 'PAID' })));
  EXPENSE_CATS.slice(0, 3).forEach(([title, cat, lo, hi], k) => expenses.push({ id: `${DEMO_PREFIX}exp-due-${k}`, title: `${title} (سررسید آتی)`, category: cat, amount: rnd(lo / 1000000, hi / 1000000) * 1000000, date: ymd(0), dueDate: ymd(k + 2), status: 'DUE' }));
  add('expenses', expenses);

  /* --- وظایف: چه کسی، چه زمانی انجام داد --- */
  const taskTpl = ['پیگیری وصول چک {c}', 'ارسال پیش‌فاکتور برای {c}', 'ویزیت حضوری {c}', 'هماهنگی تحویل سفارش {c}', 'بررسی موجودی و قیمت برای {c}', 'تماس پیگیری رضایت {c}', 'تسویه مانده حساب {c}', 'ثبت نیاز جدید {c}'];
  const tasks = Array.from({ length: 120 }, (_, i) => {
    const c = pick(customers), assignee = pick(staffIds), roll = r();
    const status = roll < 0.42 ? 'COMPLETED' : roll < 0.62 ? 'IN_PROGRESS' : roll < 0.92 ? 'OPEN' : 'PENDING';
    const dueOff = status === 'COMPLETED' ? -rnd(1, 25) : rnd(-12, 14), createdOff = dueOff - rnd(3, 12);
    return { id: `${DEMO_PREFIX}task-${i + 1}`, title: pick(taskTpl).replace('{c}', c.name), description: 'ایجاد‌شده توسط موتور داده آزمایشی', accountId: c.id, customerId: c.id, status, priority: pick(['HIGH', 'MEDIUM', 'MEDIUM', 'LOW']), dueDate: ymd(dueOff), assigneeType: 'USER', assigneeId: assignee, assignedTo: assignee, createdAt: iso(createdOff), completedAt: status === 'COMPLETED' ? iso(dueOff - rnd(0, 2)) : undefined, completedBy: status === 'COMPLETED' ? assignee : undefined, slaStatus: dueOff < 0 && status !== 'COMPLETED' ? 'BREACHED' : 'ON_TRACK' };
  });
  add('tasks', tasks);

  /* --- فعالیت‌ها، بازدیدها و خط زمان --- */
  const actTpl: [string, string][] = [['VISIT', 'ویزیت و بررسی قفسه {c}'], ['CALL', 'تماس پیگیری سفارش {c}'], ['MEETING', 'جلسه مذاکره قیمت با {c}'], ['CALL', 'یادآوری سررسید چک {c}'], ['VISIT', 'ویزیت معرفی کالای جدید به {c}']];
  const activities = Array.from({ length: 220 }, (_, i) => {
    const c = pick(customers), [type, t] = pick(actTpl), off = i < 6 ? rnd(1, 4) : -rnd(0, 60);
    return { id: `${DEMO_PREFIX}act-${i + 1}`, accountId: c.id, customerId: c.id, type, title: t.replace('{c}', c.name), description: 'ثبت‌شده در سامانه (داده آزمایشی)', dateTime: iso(off, rnd(8, 18)), ownerId: c.ownerId };
  });
  add('activities', activities);
  const visits = Array.from({ length: 120 }, (_, i) => {
    const c = pick(customers), off = -rnd(0, 40), st = off === 0 ? 'PLANNED' : r() < 0.1 ? 'MISSED' : 'COMPLETED';
    return { id: `${DEMO_PREFIX}visit-${i + 1}`, accountId: c.id, repId: c.ownerId, status: st, plannedAt: iso(off, 9), checkInAt: st === 'COMPLETED' ? iso(off, 10) : undefined, durationMin: st === 'COMPLETED' ? rnd(15, 55) : undefined, gps: st === 'COMPLETED' ? { lat: c.lat, lng: c.lng, accuracy: rnd(8, 40) } : undefined, notes: pick(['سفارش ثبت شد', 'نیاز به تخفیف دارد', 'قفسه خالی از کالا', 'پیگیری چک', 'بدون نیاز فعلی']) };
  });
  add('visits', visits);
  add('timelineEvents', visits.filter(v => v.status === 'COMPLETED').slice(0, 30).map(v => ({ id: `${DEMO_PREFIX}tl-${v.id}`, customerId: v.accountId, type: 'VISIT', title: 'ویزیت انجام شد', description: v.notes, dateTime: v.checkInAt, relatedEntityId: v.id })));

  /* --- فرصت‌ها و سرنخ‌ها --- */
  const stages = ['DISCOVERY', 'DISCOVERY', 'PROPOSAL', 'PROPOSAL', 'NEGOTIATION', 'NEGOTIATION', 'WON', 'LOST'];
  add('opportunities', Array.from({ length: 60 }, (_, i) => { const c = pick(customers); return { id: `${DEMO_PREFIX}opp-${i + 1}`, accountId: c.id, title: pick(['قرارداد تأمین ماهانه', 'سفارش عمده نوروزی', 'توسعه تنوع کالا', 'قرارداد زنجیره فروشگاهی', 'تأمین کالای اساسی']) + ' - ' + c.name, amount: rnd(5, 60) * 100000000, stage: pick(stages), expectedCloseDate: ymd(rnd(-5, 40)), ownerId: c.ownerId, createdAt: iso(-rnd(5, 90)) }; }));
  add('leads', Array.from({ length: 14 }, (_, i) => ({ id: `${DEMO_PREFIX}lead-${i + 1}`, companyName: `${pick(SHOP_TYPES)} ${pick(SHOP_NAMES)} ${pick(['جدید', 'غرب', 'مرکز', 'شرق'])}`, contactName: `${pick([...M_NAMES, ...F_NAMES])} ${pick(LASTS)}`, phone: `0910${rnd(1000000, 9999999)}`, stage: pick(['NEW', 'NEW', 'CONTACTED', 'QUALIFIED', 'LOST']), ownerId: pick(salesIds), createdAt: iso(-rnd(1, 45)) })));

  /* --- پیام‌های گروهی با منشن، اعلان‌ها و ممیزی --- */
  const msgTpl = ['{m} لطفاً وضعیت چک {c} را امروز پیگیری کن.', 'گزارش ویزیت امروز ثبت شد؛ {c} سفارش داد.', '{m} پیش‌فاکتور {c} آماده تأیید است.', 'موجودی کالا برای سفارش {c} کم است، لطفاً هماهنگ کنید.'];
  add('messages', Array.from({ length: 24 }, (_, i) => {
    const g = i % 2 === 0 ? `${DEMO_PREFIX}group-field` : `${DEMO_PREFIX}group-finance`, sender = pick(staff), m = pick(staff), c = pick(customers);
    return { id: `${DEMO_PREFIX}msg-${i + 1}`, groupId: g, senderId: sender.id, content: pick(msgTpl).replace('{m}', `@${m.name}`).replace('{c}', c.name), mentions: [{ id: m.id, type: 'USER', display: m.name }, { id: c.id, type: 'CUSTOMER', display: c.name }], createdAt: iso(-rnd(0, 10), rnd(8, 19)), readBy: [sender.id] };
  }));
  const overdueInv = invoices.filter(x => x.status === 'OVERDUE'), soonChq = bills.filter(b => b.status !== 'PAID' && new Date(b.dueDate).getTime() - now.getTime() < 3 * 86400000 && new Date(b.dueDate).getTime() >= now.getTime() - 86400000);
  add('notifications', [
    ...overdueInv.slice(0, 5).map((x, i) => ({ id: `${DEMO_PREFIX}ntf-od-${i + 1}`, title: 'فاکتور معوق', message: `فاکتور ${x.invoiceNumber} به مبلغ ${x.balance.toLocaleString('fa-IR')} ریال سررسید گذشته است.`, type: 'ERROR', read: i > 2, createdAt: iso(-i), linkTab: 'finance' })),
    ...soonChq.slice(0, 4).map((b, i) => ({ id: `${DEMO_PREFIX}ntf-chq-${i + 1}`, title: 'سررسید چک پرداختی نزدیک است', message: `تا ${i + 1} روز دیگر ${b.amount.toLocaleString('fa-IR')} ریال نقدینگی لازم است.`, type: 'WARNING', read: false, createdAt: iso(0), linkTab: 'finance' })),
    ...tasks.filter(t => t.status !== 'COMPLETED' && t.slaStatus === 'BREACHED').slice(0, 4).map((t, i) => ({ id: `${DEMO_PREFIX}ntf-task-${i + 1}`, title: 'وظیفه معوق', message: t.title, type: 'WARNING', read: false, createdAt: iso(-1), linkTab: 'tasks' })),
  ]);
  add('auditLogs', tasks.filter(t => t.status === 'COMPLETED').slice(0, 14).map((t, i) => ({ id: `${DEMO_PREFIX}aud-${i + 1}`, action: 'TASK_COMPLETED', entityType: 'task', entityId: t.id, details: `تکمیل وظیفه «${t.title}»`, actor: t.completedBy as string, createdAt: t.completedAt as string })));

  /* --- داده‌های عملیاتی FMCG برای آزمون مرکز سفارش/پخش؛ کاملاً مصنوعی و جدا از اسناد واقعی --- */
  const demoOrderStatuses = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'RELEASED', 'DELIVERED'];
  const demoOrders = Array.from({ length: 60 }, (_, i) => {
    const customer = customers[(i * 3 + 1) % customers.length];
    const selectedProducts = [products[(i * 2) % products.length], products[(i * 2 + 3) % products.length]].filter(Boolean);
    const lines = selectedProducts.map((p, k) => {
      const quantity = rnd(12, 90);
      const unitPrice = Number(p.basePrice || p.unitPrice || 0);
      const costPrice = Number(p.costPrice || 0);
      return { id: `${DEMO_PREFIX}order-line-${i + 1}-${k + 1}`, productId: p.id, productName: p.name, productGroupId: p.category, quantity, unitPrice, costPrice, lineTotal: quantity * unitPrice, weightKg: quantity * Number(p.weightKgPerUnit || 0) };
    });
    const totalAmount = sum(lines.map(l => l.lineTotal));
    const costAmount = sum(lines.map(l => l.costPrice * l.quantity));
    const weightKg = sum(lines.map(l => l.weightKg));
    const zone = ['تهران', 'کرج'].includes(customer.city) ? 'CENTER' : ['اصفهان', 'قم', 'ساوه'].includes(customer.city) ? 'SOUTH' : 'NORTH';
    return { id: `${DEMO_PREFIX}sales-order-${i + 1}`, orderNumber: `SO-DEMO-1405-${String(i + 1).padStart(4, '0')}`, customerId: customer.id, ownerId: customer.ownerId, branchId: customer.branchId, status: demoOrderStatuses[i % demoOrderStatuses.length], currency: 'IRR', totalAmount, costAmount, costKnown: costAmount > 0, weightKg, weightSource: 'TEST_SEED_ESTIMATE', zone, lines, source: 'LOCAL_TEST', externalReference: null, createdAt: iso(-rnd(0, 35)), updatedAt: iso(-rnd(0, 2)), notes: 'سفارش مصنوعی FMCG برای آزمون؛ سند ERP ندارد' };
  });
  const demoDispatchPlans = Array.from({ length: 12 }, (_, i) => {
    const assigned = demoOrders.filter((_, index) => index % 12 === i);
    return { id: `${DEMO_PREFIX}dispatch-${i + 1}`, planNumber: `DP-DEMO-${i + 1}`, name: ['مسیر مرکز', 'مسیر شمال', 'مسیر جنوب'][i % 3] + ` ${i + 1}`, vehicleLabel: `خودروی آزمایشی ${i + 1}`, capacityKg: [1200, 1600, 2000][i % 3], plannedWeightKg: assigned.every(o => Number.isFinite(o.weightKg)) ? sum(assigned.map(o => o.weightKg)) : null, zone: ['CENTER', 'NORTH', 'SOUTH'][i % 3], orderIds: assigned.map(o => o.id), status: i === 0 ? 'IN_TRANSIT' : 'DRAFT', source: 'LOCAL_TEST', createdBy: staff[i % staff.length].id, createdAt: iso(-i) };
  });
  demoOrders.forEach(order => { const plan = demoDispatchPlans.find(p => p.orderIds.includes(order.id)); if (plan) order.dispatchPlanId = plan.id; });
  add('salesOrders', demoOrders);
  add('dispatchPlans', demoDispatchPlans);
  add('commercialPolicies', [
    { id: `${DEMO_PREFIX}policy-no-credit`, name: 'محدودیت اعتباری نمونه برای یک کالای منتخب', type: 'NO_CREDIT', scope: 'PRODUCT', value: products[6]?.id || products[0]?.id, enabled: true, enforcement: 'CRM_TEST_ONLY', source: 'LOCAL_TEST', createdAt: iso(0) },
    { id: `${DEMO_PREFIX}policy-min-margin`, name: 'حداقل حاشیه سود آزمایشی', type: 'MIN_MARGIN', scope: 'COMPANY', value: '12', enabled: true, enforcement: 'CRM_TEST_ONLY', source: 'LOCAL_TEST', createdAt: iso(0) },
    { id: `${DEMO_PREFIX}policy-discount`, name: 'سقف تخفیف آزمایشی', type: 'MAX_DISCOUNT', scope: 'COMPANY', value: '5', enabled: true, enforcement: 'CRM_TEST_ONLY', source: 'LOCAL_TEST', createdAt: iso(0) },
  ]);
  const demoReturns = Array.from({ length: 24 }, (_, n) => {
    const order = demoOrders[(n * 2 + 1) % demoOrders.length];
    const codes = ['CUSTOMER_REJECTED', 'QUALITY', 'DAMAGE', 'LOADING_MISMATCH', 'ORDER_ERROR', 'CREDIT_POLICY'];
    const reasons = ['عدم پذیرش در زمان تحویل', 'گزارش کیفیت نیازمند بررسی', 'آسیب احتمالی در حمل', 'نیاز به تطبیق بارگیری', 'مغایرت سفارش', 'محدودیت اعتباری'];
    return { id: `${DEMO_PREFIX}return-${n + 1}`, returnNumber: `RET-DEMO-${String(n + 1).padStart(3, '0')}`, orderId: order.id, invoiceId: null, customerId: order.customerId, amount: Math.round(order.totalAmount * (0.03 + (n % 6) * 0.01)), reasonCode: codes[n % codes.length], reason: reasons[n % reasons.length], status: 'OPEN', source: 'LOCAL_TEST', financialDocumentConfirmed: false, createdBy: order.ownerId, createdAt: iso(-n) };
  });
  add('salesReturns', demoReturns);
  add('reconciliationCases', demoReturns.map((ret, i) => ({ id: `${DEMO_PREFIX}recon-${i + 1}`, caseNumber: `REC-DEMO-${i + 1}`, type: 'RETURN_REVIEW', title: `بررسی علت برگشت ${ret.returnNumber}`, relatedEntityType: 'SalesReturn', relatedEntityId: ret.id, reason: `دسته علت: ${ret.reasonCode}؛ سند مالی مرجع متصل نیست و مانده نباید خودکار تغییر کند.`, status: 'OPEN', severity: i === 2 ? 'HIGH' : 'MEDIUM', assignedTo: staff[(i + 6) % staff.length].id, dueDate: ymd(i + 1), source: 'LOCAL_TEST', createdAt: iso(-i) })));
  add('tasks', demoReturns.map((ret, i) => ({ id: `${DEMO_PREFIX}return-task-${i + 1}`, title: `رسیدگی به ${ret.returnNumber}`, description: `بررسی علت ${ret.reasonCode} و اتصال سند مالی معتبر`, relatedEntityType: 'SalesReturn', relatedEntityId: ret.id, accountId: ret.customerId, customerId: ret.customerId, status: 'PENDING', priority: 'HIGH', dueDate: ymd(i + 1), assigneeType: 'USER', assigneeId: staff[(i + 6) % staff.length].id, assignedTo: staff[(i + 6) % staff.length].id, source: 'LOCAL_TEST', createdAt: iso(0) })));
  add('purchaseRequests', products.slice(0, 5).filter(p => Number(p.stock) <= Number(p.minStock)).map((p, i) => ({ id: `${DEMO_PREFIX}purchase-request-${i + 1}`, requestNumber: `PR-DEMO-${i + 1}`, supplierId: p.supplierId, productId: p.id, quantity: rnd(40, 120), status: 'OPEN', reason: 'موجودی آزمایشی در نقطه سفارش یا پایین‌تر', source: 'LOCAL_TEST', createdAt: iso(0) })));

  /* --- مقالات پایگاه دانش سازمانی (Knowledge Base) --- */
  const kbCategories = ['اعتبارسنجی و مالی', 'فروش و بازرگانی', 'لجستیک و پخش', 'عملیات میدانی', 'سازمان و منابع انسانی', 'پشتیبانی و تیکتینگ'];
  const kbTitles = [
    'شیوه‌نامه استعلام و اعتبارسنجی مشتریان جدید FMCG',
    'دستورالعمل ثبت و تسویه پیش‌فاکتورها در موتور CPQ',
    'شیوه‌نامه مرجوعی کالا و ثبت فرم عدم انطباق کیفی',
    'آیین‌نامه پیگیری و وصول چک‌های صیادی سررسید گذشته',
    'راهنمای ویزیت حضوری و ثبت مختصات جغرافیایی (GPS)',
    'شیوه‌نامه درخواست‌های پرسنلی، مرخصی و ماموریت‌های بین‌شهری',
    'راهنمای تنظیم سیاست‌های تخفیف پلکانی و پروموشن‌های فصلی',
    'شیوه‌نامه رسیدگی به شکایات مشتریان و جبران خسارت ناوگان',
    'فرآیند ثبت فاکتورهای رسمی در سامانه مودیان مالیاتی',
    'چک‌لیست استانداردهای چیدمان کالا و پایش قفسه در سوپرمارکت‌ها',
    'راهنمای کاربری ماژول هوش مکانی و تحلیل زون‌های فروش',
    'شیوه‌نامه ارزیابی عملکرد ویزیتورها و پاداش تحقق اهداف'
  ];
  const demoArticles = kbTitles.map((title, i) => ({
    id: `${DEMO_PREFIX}art-${i + 1}`,
    title,
    category: kbCategories[i % kbCategories.length],
    content: `این سند راهنمای رسمی سازمانی در خصوص ${title} می‌باشد. کلیه کارشناسان و مدیران موظف به رعایت گام‌های اجرایی، مهلت‌های زمانی و کنترل‌های داخلی مندرج در این شیوه‌نامه هستند. بازبینی دوره‌ای هر سه ماه یکبار توسط مدیر سیستم انجام می‌شود.`,
    status: 'PUBLISHED',
    authorId: staff[i % staff.length].id,
    readCount: rnd(25, 240),
    createdAt: iso(-rnd(15, 180)),
    updatedAt: iso(-rnd(0, 10)),
  }));
  add('articles', demoArticles);

  /* --- تیکت‌ها و شکایات پشتیبانی مشتریان (Support Cases) --- */
  const caseSubjects = [
    'مغایرت تعداد اقلام تحویلی در فاکتور سفارش',
    'درخواست بازبینی و افزایش سقف اعتبار خرید ماهانه',
    'شکایت از تاخیر ناوگان توزیع در تحویل سفارش عصر',
    'خطای ثبت شناسه صیادی در سیستم وصول مطالبات',
    'درخواست صدور فاکتور رسمی تجمیعی ارزش‌افزوده',
    'گزارش آسیب‌دیدگی کارتن‌های کنسروجات در حین بارگیری',
    'درخواست تغییر ویزیتور و مسیر توزیع شعبه',
    'مغایرت تاریخ انقضای اقلام لبنی با فاکتور',
    'درخواست عودت وجه اضافه واریزی بابت حواله بانکی',
    'پیگیری وضعیت تحویل سفارش معوق خواربار',
    'شکایت از برخورد نماینده تحویل در زمان تخلیه بار',
    'درخواست هماهنگی استند تبلیغاتی ویژه محصولات جدید',
    'عدم اعمال تخفیف جشنواره در فاکتور صادرشده',
    'درخواست تغییر آدرس انبار و شماره تماس حسابداری',
    'استعلام مانده بدهی تجاری و وضعیت چک‌های امانی',
    'درخواست تسویه با تخفیف نقدی تسویه زودهنگام'
  ];
  const casePriorities = ['LOW', 'NORMAL', 'NORMAL', 'HIGH', 'HIGH', 'URGENT'];
  const caseStatuses = ['NEW', 'IN_PROGRESS', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  const demoCases = caseSubjects.map((subject, i) => {
    const cust = customers[(i * 3 + 2) % customers.length];
    return {
      id: `${DEMO_PREFIX}case-${i + 1}`,
      caseNumber: `CS-1405-${String(101 + i)}`,
      accountId: cust.id,
      customerId: cust.id,
      subject: `${subject} — ${cust.name}`,
      description: `ثبت شکایت/درخواست توسط ${cust.name}؛ نیازمند پیگیری توسط کارشناس مسئول و ثبت صورتجلسه توافق با مشتری.`,
      status: caseStatuses[i % caseStatuses.length],
      priority: casePriorities[i % casePriorities.length],
      ownerId: cust.ownerId,
      createdAt: iso(-rnd(1, 45)),
      updatedAt: iso(-rnd(0, 5)),
    };
  });
  add('cases', demoCases);

  /* --- کمپین‌های بازاریابی و پروموشن‌ها (Marketing Campaigns) --- */
  const campPlans = [
    { name: 'جشنواره توزیع روغن و حبوبات بهاره', aud: 'سوپرمارکت‌های ممتاز و هایپرمارکت‌ها', bud: 250000000, st: 'ACTIVE', ex: 18 },
    { name: 'کمپین فعال‌سازی مشتریان غیرفعال زون شرق', aud: 'مشتریان راکد و بدون خرید ۴۵ روز اخیر', bud: 120000000, st: 'ACTIVE', ex: 9 },
    { name: 'پروموشن فصلی نوشیدنی و کنسروجات ۱۰+۱', aud: 'تمام فروشگاه‌های دارای قفسه نوشیدنی', bud: 350000000, st: 'PLANNED', ex: 0 },
    { name: 'پویش تشویق تسویه نقدی و چک‌های زیر ۲۰ روز', aud: 'مشتریان خوش‌حساب با رتبه اعتباری A', bud: 180000000, st: 'COMPLETED', ex: 24 },
    { name: 'طرح توسعه شبکه توزیع زون البرز و شهریار', aud: 'فروشگاه‌های مناطق جدید شهری', bud: 400000000, st: 'ACTIVE', ex: 12 },
    { name: 'جشنواره وفاداری خریداران عمده برنج ایرانی', aud: 'عمده‌فروشان و بازارهای زنجیره‌ای', bud: 500000000, st: 'PLANNED', ex: 0 },
    { name: 'پروموشن تابستانه شوینده‌ها و ملزومات بهداشتی', aud: 'هایپرمارکت‌ها و فروشگاه‌های بزرگ', bud: 200000000, st: 'COMPLETED', ex: 15 },
    { name: 'طرح تخفیف نقدی آغاز فصل پاییز', aud: 'سوپرمارکت‌های خواربار', bud: 220000000, st: 'ACTIVE', ex: 7 }
  ];
  const demoCampaigns = campPlans.map((c, i) => ({
    id: `${DEMO_PREFIX}camp-${i + 1}`,
    name: c.name,
    status: c.st,
    description: `طرح ویژه سازمانی اخوان جهت ${c.name} با تارگت فروش مشخص و بسته‌های تشویقی برای خریداران عمده و ویزیتورها.`,
    targetAudience: c.aud,
    startDate: ymd(-rnd(5, 40)),
    endDate: ymd(rnd(10, 60)),
    executionCount: c.ex,
    budget: c.bud,
    createdAt: iso(-rnd(10, 60)),
  }));
  add('campaigns', demoCampaigns);

  /* --- اتوماسیون داخلی: درخواست‌ها و جلسات (Internal Requests & Meetings) --- */
  const reqTypes = ['LEAVE', 'MISSION', 'EXPENSE', 'PURCHASE'];
  const reqTitles = [
    'درخواست مرخصی استحقاقی سالانه',
    'ماموریت ویزیت میدانی شعب کرج و البرز',
    'درخواست تنخواه سوخت و استهلاک خودروی توزیع',
    'خرید بارکدخوان بی‌سیم برای انبار مرکزی',
    'درخواست مرخصی ساعتی جهت امور بانکی',
    'ماموریت بررسی بازار استان اصفهان و کاشان',
    'هزینه پذیرایی جلسات فصلی مشتریان کلیدی',
    'تعمیر و سرویس چرخ‌دستی و جک هیدرولیک انبار',
    'درخواست تهیه سیم‌کارت شرکتی برای ویزیتور جدید',
    'ماموریت بازدید از کارخانه بسته‌بندی قزوین',
    'درخواست مرخصی تشویقی بابت تحقق تارگت ماهانه',
    'خرید ملزومات چاپی فرم‌های فاکتور و برگه تحویل'
  ];
  const demoInternalRequests = reqTitles.map((title, i) => {
    const creator = staff[i % staff.length];
    const assignee = staff[(i + 1) % staff.length];
    const type = reqTypes[i % reqTypes.length];
    return {
      id: `${DEMO_PREFIX}req-${i + 1}`,
      requestNumber: `REQ-1405-${String(201 + i)}`,
      type,
      title,
      creatorId: creator.id,
      currentAssigneeId: assignee.id,
      status: i % 3 === 0 ? 'PENDING' : i % 3 === 1 ? 'APPROVED' : 'REJECTED',
      data: {
        startDate: ymd(rnd(-5, 10)),
        endDate: ymd(rnd(1, 15)),
        substituteName: staff[(i + 2) % staff.length].name,
        amount: type === 'EXPENSE' || type === 'PURCHASE' ? rnd(10, 65) * 1000000 : undefined,
        reason: 'ثبت‌شده در سامانه اتوماسیون اداری اخوان'
      },
      createdAt: iso(-rnd(1, 20)),
    };
  });
  add('internalRequests', demoInternalRequests);

  const meetingTitles = [
    'جلسه بازنگری تارگت‌های فروش و مطالبات زون ۱',
    'کمیته هماهنگی زنجیره تامین و لجستیک نوروزی',
    'بررسی پرونده‌های حقوقی و چک‌های برگشتی معوق',
    'جلسه بررسی نتایج کمپین فعال‌سازی مشتریان راکد',
    'کمیته اعتبارسنجی و سقف اعتبار مشتریان عمده',
    'جلسه آموزش کار با نسخه موبایل CRM برای ویزیتورها',
    'هماهنگی شیفت‌های انبارداری و ارسال‌های فوری',
    'جلسه ماهانه ارزیابی عملکرد و پاداش پرسنل فروش'
  ];
  const demoInternalMeetings = meetingTitles.map((title, i) => ({
    id: `${DEMO_PREFIX}meet-${i + 1}`,
    title,
    date: ymd(rnd(0, 10)),
    startTime: `${String(rnd(9, 15)).padStart(2, '0')}:00`,
    endTime: `${String(rnd(10, 17)).padStart(2, '0')}:30`,
    organizerId: staff[i % staff.length].id,
    participantIds: [staff[i % staff.length].id, staff[(i + 1) % staff.length].id, staff[(i + 2) % staff.length].id],
    room: ['اتاق جلسات بازرگانی', 'سالن کنفرانس اصلی', 'دفتر مدیریت مالی', 'اتاق آموزش'][i % 4],
  }));
  add('internalMeetings', demoInternalMeetings);

  /* --- متقاضیان استخدام و پرونده پرسنلی (Onboarding & HR) --- */
  const roles = ['ویزیتور میدانی بازاریابی', 'کارشناس حسابداری و خزانه', 'سرپرست توزیع و انبار', 'کارشناس پشتیبانی و CRM', 'راننده موزع توزیع', 'کارشناس فروش تلفنی'];
  const applicantStatuses = ['NEW', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED', 'ACCEPTED', 'REJECTED'];
  const demoApplications = Array.from({ length: 8 }, (_, i) => ({
    id: `${DEMO_PREFIX}app-${i + 1}`,
    firstName: pick(i % 2 === 0 ? M_NAMES : F_NAMES),
    lastName: pick(LASTS),
    mobile: `0912${rnd(1000000, 9999999)}`,
    nationalId: '0499370899',
    desiredRole: roles[i % roles.length],
    status: applicantStatuses[i % applicantStatuses.length],
    interview: i % 2 === 0 ? {
      date: ymd(rnd(1, 5)),
      time: '10:30',
      interviewerId: staff[0].id,
      address: 'تهران، خیابان مطهری، پلاک ۱۲، ساختمان مرکزی اخوان',
      smsStatus: 'LOCAL_ONLY'
    } : undefined,
    createdAt: iso(-rnd(2, 25)),
  }));
  add('onboardingApplications', demoApplications);

  const demoPersonnelFiles = staff.slice(0, 6).map((s, i) => ({
    id: `${DEMO_PREFIX}pf-${i + 1}`,
    userId: s.id,
    fullName: s.name,
    nationalCode: '0499370899',
    contractType: i % 3 === 0 ? 'CONTRACT' : 'PERMANENT',
    department: s.jobTitle?.includes('مالی') ? 'مالی و خزانه‌داری' : 'فروش و بازاریابی',
    jobTitle: s.jobTitle || 'کارشناس',
    hireDate: ymd(-rnd(180, 720)),
    status: 'ACTIVE',
    bankAccount: { bank: pick(['بانک ملت', 'بانک پاسارگاد', 'بانک سامان', 'بانک ملی']), iban: 'IR062960000000100324200001' },
    emergencyContact: { name: pick(['همسر', 'پدر', 'برادر']), phone: `0912${rnd(1000000, 9999999)}` }
  }));
  add('personnelFiles', demoPersonnelFiles);

  /* --- هوش مکانی: محدوده‌ها و زون‌های توزیع (Geo Intelligence) --- */
  const demoZones = [
    { id: `${DEMO_PREFIX}zone-tehran-center`, code: 'ZONE-TH-01', name: 'زون ۱ — تهران مرکزی و بازار', status: 'ACTIVE', ownerId: staff[0].id, currentGeometryVersionId: `${DEMO_PREFIX}gv-1`, createdAt: iso(-180), updatedAt: iso(-2) },
    { id: `${DEMO_PREFIX}zone-tehran-north`, code: 'ZONE-TH-02', name: 'زون ۲ — تهران شمال و شمیرانات', status: 'ACTIVE', ownerId: staff[1].id, currentGeometryVersionId: `${DEMO_PREFIX}gv-2`, createdAt: iso(-180), updatedAt: iso(-2) },
    { id: `${DEMO_PREFIX}zone-tehran-west`, code: 'ZONE-TH-03', name: 'زون ۳ — تهران غرب و جاده مخصوص', status: 'ACTIVE', ownerId: staff[2].id, currentGeometryVersionId: `${DEMO_PREFIX}gv-3`, createdAt: iso(-180), updatedAt: iso(-2) },
    { id: `${DEMO_PREFIX}zone-alborz`, code: 'ZONE-AB-01', name: 'زون ۴ — کرج و استان البرز', status: 'ACTIVE', ownerId: staff[3].id, currentGeometryVersionId: `${DEMO_PREFIX}gv-4`, createdAt: iso(-180), updatedAt: iso(-2) },
  ];
  const demoGeometryVersions = [
    { id: `${DEMO_PREFIX}gv-1`, zoneId: `${DEMO_PREFIX}zone-tehran-center`, version: 1, geometry: { type: 'Polygon', coordinates: [[[51.36, 35.67], [51.44, 35.67], [51.44, 35.73], [51.36, 35.73], [51.36, 35.67]]] }, effectiveFrom: '2025-01-01T00:00:00Z', effectiveTo: null, createdBy: staff[0].id, createdAt: iso(-180) },
    { id: `${DEMO_PREFIX}gv-2`, zoneId: `${DEMO_PREFIX}zone-tehran-north`, version: 1, geometry: { type: 'Polygon', coordinates: [[[51.38, 35.74], [51.48, 35.74], [51.48, 35.82], [51.38, 35.82], [51.38, 35.74]]] }, effectiveFrom: '2025-01-01T00:00:00Z', effectiveTo: null, createdBy: staff[1].id, createdAt: iso(-180) },
    { id: `${DEMO_PREFIX}gv-3`, zoneId: `${DEMO_PREFIX}zone-tehran-west`, version: 1, geometry: { type: 'Polygon', coordinates: [[[51.20, 35.68], [51.35, 35.68], [51.35, 35.76], [51.20, 35.76], [51.20, 35.68]]] }, effectiveFrom: '2025-01-01T00:00:00Z', effectiveTo: null, createdBy: staff[2].id, createdAt: iso(-180) },
    { id: `${DEMO_PREFIX}gv-4`, zoneId: `${DEMO_PREFIX}zone-alborz`, version: 1, geometry: { type: 'Polygon', coordinates: [[[50.85, 35.75], [51.10, 35.75], [51.10, 35.90], [50.85, 35.90], [50.85, 35.75]]] }, effectiveFrom: '2025-01-01T00:00:00Z', effectiveTo: null, createdBy: staff[3].id, createdAt: iso(-180) },
  ];
  const demoZoneAssignments = customers.slice(0, 40).map((c, i) => {
    const zone = demoZones[i % demoZones.length];
    return {
      id: `${DEMO_PREFIX}za-${i + 1}`,
      zoneId: zone.id,
      entityType: 'CUSTOMER' as const,
      entityId: c.id,
      method: 'POLYGON' as const,
      effectiveFrom: '2025-01-01T00:00:00Z',
      effectiveTo: null,
      createdBy: staff[0].id,
      createdAt: iso(-120),
    };
  });
  add('geoZones', demoZones);
  add('zoneGeometryVersions', demoGeometryVersions);
  add('zoneAssignments', demoZoneAssignments);

  /* --- امور مالی: دستور پرداخت‌ها و بستانکاری‌ها (Finance Requests & Credit Notes) --- */
  const finPayees = [
    'شرکت حمل‌ونقل و باربری سریع البرز',
    'خدمات بسته‌بندی نوین کارتن',
    'استرداد اضافه واریزی مشتریان',
    'تعمیرگاه مجاز ناوگان توزیع پایتخت',
    'شرکت چاپ و بسته‌بندی نگین سپهر',
    'بیمه مسئولیت مدنی ناوگان و انبار'
  ];
  const demoFinanceRequests = finPayees.map((payee, i) => ({
    id: `${DEMO_PREFIX}freq-${i + 1}`,
    kind: 'PAYMENT_ORDER',
    payeeName: payee,
    amount: rnd(25, 120) * 1000000,
    reason: `تسویه صورتحساب شماره ${140500 + i} بابت ${payee}`,
    dueDate: ymd(rnd(1, 10)),
    requestedBy: staff[i % staff.length].id,
    status: i === 0 ? 'SUBMITTED' : i === 1 ? 'APPROVED' : i === 2 ? 'NEEDS_INFO' : 'SUBMITTED',
    erpStatus: 'NOT_CONFIGURED',
    createdAt: iso(-rnd(1, 10)),
  }));
  add('financeRequests', demoFinanceRequests);

  const demoCreditNotes = Array.from({ length: 8 }, (_, i) => {
    const cust = customers[(i * 4 + 1) % customers.length];
    return {
      id: `${DEMO_PREFIX}cn-${i + 1}`,
      creditNoteNumber: `CN-1405-${String(i + 1).padStart(2, '0')}`,
      accountId: cust.id,
      customerId: cust.id,
      amount: rnd(4, 25) * 1000000,
      reason: ['بستانکاری بابت تخفیف نقدی تسویه زودهنگام', 'تعدیل بابت اقلام مرجوعی آسیب‌دیده', 'پاداش دستیابی به سقف تارگت خرید فصلی (Rebate)'][i % 3],
      status: 'POSTED',
      createdAt: iso(-rnd(2, 30)),
    };
  });
  add('creditNotes', demoCreditNotes);

  const total = Object.values(created).reduce((s, n) => s + n, 0);
  return { created, skipped, total };
}

/** حذف فقط رکوردهای آزمایشی (پیشوند demo-)؛ داده واقعی دست‌نخورده می‌ماند */
export function purgeDemoData(draft: AppState): number {
  let removed = 0;
  Object.keys(draft).forEach(k => {
    const v = (draft as any)[k];
    if (!Array.isArray(v)) return;
    const kept = v.filter((x: any) => !(x && isDemoId(x.id)));
    removed += v.length - kept.length;
    if (kept.length !== v.length) (draft as any)[k] = kept;
  });
  return removed;
}
