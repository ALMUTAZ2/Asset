export const BOOT_AND_GLOBAL_OVERLAYS_MARKUP = `
  <!-- ==================== FIRESTORE BOOT / SEED OVERLAY ==================== -->
  <div id="dbBootOverlay" role="status" aria-live="polite" class="fixed inset-0 z-[130] flex items-center justify-center p-6 text-white">
    <div class="boot-card relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/15 p-8 text-center sm:p-12">
      <div class="boot-orbit" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="relative z-10 mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-2xl">
        <i data-lucide="zap" class="h-8 w-8 text-se-light-blue"></i>
      </div>
      <p class="relative z-10 mb-3 text-xs font-bold tracking-wide text-se-light-blue">الشركة السعودية للطاقة <span class="mx-1 text-white/40">/</span> استلام الأصول</p>
      <h2 class="relative z-10 text-2xl font-black leading-relaxed sm:text-3xl">طاقةٌ لا تتوقف.. وإدارةٌ تُحكم كل تفصيل</h2>
      <p class="relative z-10 mt-3 text-sm leading-7 text-white/75">نُهيّئ بياناتك وصلاحياتك، لتقود عمليات الاستلام بدقة وثقة</p>
      <div class="boot-progress relative z-10 mt-8" aria-hidden="true"><span></span></div>
      <p id="dbBootStatusText" class="relative z-10 mt-4 text-xs font-semibold tracking-wide text-white/65">نُجهّز بيئة العمل...</p>
    </div>
  </div>

  <!-- ==================== PRINT-ONLY REPORT CONTAINER ==================== -->
  <div id="printArea" class="hidden bg-white p-6 text-right" dir="rtl"></div>

  <!-- ==================== WELCOME SPLASH SCREEN (3 SECONDS) ==================== -->
  <div id="welcomeSplash" class="hidden fixed inset-0 z-[120] bg-se-dark-gradient flex items-center justify-center p-6 text-white">
    <div class="max-w-md w-full bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-8 text-center shadow-2xl animate-fade-up">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-se-mid-blue flex items-center justify-center shadow-lg shadow-se-mid-blue/30 mb-5">
        <i data-lucide="sparkles" class="w-8 h-8 text-white"></i>
      </div>
      <p class="text-xs font-bold text-se-light-blue mb-1">منصة متابعة فواتير الصيانة والطوارئ — قسم استلام الأصول</p>
      <h2 id="welcomeSplashName" class="text-2xl sm:text-3xl font-black text-white mt-2">مرحباً</h2>
      <p id="welcomeSplashSub" class="text-xs text-slate-300 mt-2">جاري تجهيز لوحة العمل الخاصة بك...</p>
      <div class="w-full h-2 bg-white/15 rounded-full overflow-hidden mt-6">
        <div id="welcomeProgressBar" class="h-full bg-se-mid-blue rounded-full"></div>
      </div>
    </div>
  </div>

  <!-- ==================== TOAST NOTIFICATIONS ==================== -->
  <div id="toastContainer" class="fixed bottom-5 left-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"></div>
`;

export const LOGIN_VIEW_MARKUP = `
    <!-- ==================== 1. DUAL-MODE LOGIN SCREEN ==================== -->
    <section id="loginView" class="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-se-dark-gradient relative overflow-hidden">
      <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(#ffffff 1px, transparent 1px); background-size: 26px 26px;"></div>
      <div class="absolute -top-24 -left-24 w-96 h-96 bg-se-mid-blue/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-se-light-blue/15 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/10 animate-fade-up">

        <!-- Right Visual Identity Panel -->
        <div class="login-brand-panel lg:col-span-5 bg-gradient-to-b from-se-dark-blue to-se-extra-dark-blue text-white p-7 sm:p-10 flex flex-col justify-center relative overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-l from-se-mid-blue via-se-light-blue to-se-green"></div>
          <div>
            <div class="flex items-center gap-3 mb-7">
              <div class="w-14 h-14 rounded-2xl bg-white/10 border-2 border-se-light-blue/40 flex items-center justify-center shadow-xl se-logo-glow shrink-0">
                <svg viewBox="0 0 40 40" class="w-9 h-9 se-energy-icon" fill="none">
                  <circle cx="20" cy="20" r="18" fill="rgba(0,128,255,0.15)" stroke="#0080FF" stroke-width="1.5"/>
                  <path d="M23 6L11 22h10l-4 12 18-18H23L27 6z" fill="#0080FF"/>
                  <path d="M23 6L11 22h10l-4 12 18-18H23L27 6z" fill="white" opacity="0.85"/>
                </svg>
              </div>
              <div>
                <h1 class="text-lg font-extrabold leading-tight">منصة متابعة فواتير الصيانة والطوارئ قسم استلام الاصول</h1>
              </div>
            </div>
            <div class="text-[11px] text-se-light-blue font-bold tracking-widest uppercase mb-1">Saudi Energy · الشركة السعودية للطاقة</div>

            <h2 class="login-brand-headline text-2xl sm:text-3xl font-black leading-snug mb-7">
              من استلام الأصل إلى اعتماد الفاتورة — كل خطوة أوضح، وكل قرار أسرع
            </h2>

            <div class="login-brand-features space-y-3 text-xs sm:text-sm">
              <div class="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                <div class="w-8 h-8 rounded-lg bg-se-mid-blue/20 text-se-light-blue flex items-center justify-center shrink-0">
                  <i data-lucide="shield-check" class="w-4 h-4"></i>
                </div>
                <span>مساحة مستقلة لكل مقاول، مع تنبيه استباقي لتكرار أوامر العمل</span>
              </div>
              <div class="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                <div class="w-8 h-8 rounded-lg bg-se-light-blue/20 text-se-light-blue flex items-center justify-center shrink-0">
                  <i data-lucide="cloud-upload" class="w-4 h-4"></i>
                </div>
                <span>وثّق الإنجاز بالصور، واترك للأرشفة حفظ التفاصيل</span>
              </div>
              <div class="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                <div class="w-8 h-8 rounded-lg bg-se-green/20 text-se-green flex items-center justify-center shrink-0">
                  <i data-lucide="bar-chart-3" class="w-4 h-4"></i>
                </div>
                <span>رؤية تشغيلية مباشرة، وتقارير جاهزة للقرار بصيغتي PDF وExcel</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Left Login Form Panel -->
        <div class="login-form-panel lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white">
          <div>
            <div class="mb-6">
              <h3 class="text-2xl font-extrabold text-se-dark-blue">تسجيل الدخول إلى المنصة</h3>
              <p class="text-sm text-slate-500 mt-1">اختر بوابة الدخول المناسبة حسب نوع الحساب</p>
            </div>

            <!-- Dual-Mode Tabs (Company Staff FIRST, then Contractors) -->
            <div class="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
              <button type="button" id="tabStaffBtn" onclick="switchLoginTab('staff')"
                class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all bg-se-dark-blue text-white shadow-sm">
                <i data-lucide="briefcase" class="w-4 h-4"></i>
                <span>دخول موظف الشركة</span>
              </button>
              <button type="button" id="tabContractorBtn" onclick="switchLoginTab('contractor')"
                class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all text-slate-600 hover:text-se-dark-blue">
                <i data-lucide="hard-hat" class="w-4 h-4"></i>
                <span>دخول المقاولين</span>
              </button>
            </div>

            <!-- Error Banner -->
            <div id="loginErrorBox" class="hidden mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-2">
              <i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i>
              <span id="loginErrorText"></span>
            </div>

            <!-- TAB 1: Company Staff Login (Default Visible) -->
            <form id="staffLoginForm" onsubmit="handleStaffLogin(event)" class="space-y-4">
              <div>
                <label class="block text-sm font-bold text-se-dark-blue mb-1.5">الرقم الوظيفي (اسم المستخدم)</label>
                <div class="relative">
                  <input type="text" id="staffUsernameInput" required placeholder="أدخل الرقم الوظيفي"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-dark-blue focus:ring-2 focus:ring-se-mid-blue/20 py-3 pr-10 pl-4 text-sm font-semibold outline-none transition text-left" dir="ltr" />
                  <i data-lucide="user" class="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-sm font-bold text-se-dark-blue">كلمة المرور</label>

                </div>
                <div class="relative">
                  <input type="password" id="staffPasswordInput" required placeholder="••••••••"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-dark-blue focus:ring-2 focus:ring-se-mid-blue/20 py-3 pr-10 pl-4 text-sm font-semibold outline-none transition text-left" dir="ltr" />
                  <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                </div>
              </div>

              <button type="submit" class="w-full py-3.5 px-6 rounded-xl bg-se-dark-blue hover:bg-se-blue text-white font-extrabold text-sm shadow-lg shadow-se-dark-blue/25 transition flex items-center justify-center gap-2">
                <i data-lucide="shield" class="w-4 h-4"></i>
                <span>دخول موظف الشركة</span>
              </button>
            </form>

            <!-- TAB 2: Contractor Login -->
            <form id="contractorLoginForm" onsubmit="handleContractorLogin(event)" class="hidden space-y-4">
              <div class="relative">
                <label class="block text-sm font-bold text-se-dark-blue mb-1.5">اختر اسم المقاول (قائمة قابلة للبحث)</label>
                <div class="relative">
                  <input type="text" id="contractorSearchInput" autocomplete="off"
                    placeholder="ابحث عن اسم المقاول أو اختر من القائمة..."
                    onfocus="openContractorDropdown()"
                    oninput="filterContractorDropdown(this.value)"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue focus:ring-2 focus:ring-se-mid-blue/20 py-3 pr-10 pl-10 text-sm font-semibold text-se-dark-blue outline-none transition" />
                  <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                  <button type="button" onclick="toggleContractorDropdown()" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-se-dark-blue p-1">
                    <i data-lucide="chevron-down" class="w-4 h-4"></i>
                  </button>
                </div>
                <input type="hidden" id="selectedContractorValue" />
                <div id="contractorDropdownList" class="hidden absolute z-30 mt-1.5 w-full max-h-56 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl divide-y divide-slate-100"></div>
              </div>

              <div>
                <label class="block text-sm font-bold text-se-dark-blue mb-1.5">الرقم السري للمقاول (PIN)</label>
                <div class="relative">
                  <input type="password" id="contractorPinInput" required minlength="4" maxlength="12" inputmode="numeric" pattern="[0-9]{4,12}" placeholder="أدخل PIN الخاص بالمقاول (4 أرقام على الأقل)"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue focus:ring-2 focus:ring-se-mid-blue/20 py-3 pr-10 pl-4 text-sm font-semibold outline-none transition" />
                  <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                </div>
              </div>

              <button type="submit" class="w-full py-3.5 px-6 rounded-xl bg-se-mid-blue hover:bg-se-blue text-white font-extrabold text-sm shadow-lg shadow-se-mid-blue/25 transition flex items-center justify-center gap-2">
                <i data-lucide="log-in" class="w-4 h-4"></i>
                <span>دخول إلى بوابة المقاول</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
`;

export const CONTRACTOR_VIEW_MARKUP = `
    <!-- ==================== 2. CONTRACTOR PORTAL VIEW ==================== -->
    <section id="contractorView" class="hidden min-h-screen flex flex-col bg-slatebg">
      <!-- Top Bar -->
      <header class="bg-se-dark-blue text-white shadow-md sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-se-mid-blue flex items-center justify-center shadow">
              <i data-lucide="hard-hat" class="w-5 h-5 text-white"></i>
            </div>
            <div>
              <p class="text-[11px] text-slate-300">بوابة المقاول الخاصة (بيانات معزولة)</p>
              <h1 id="contractorHeaderName" class="text-base sm:text-lg font-extrabold leading-tight">اسم المقاول</h1>
            </div>
          </div>

          <div class="flex items-center gap-2 sm:gap-3">
            <button onclick="logout()" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-100 hover:text-white text-xs font-bold border border-rose-400/30 transition">
              <i data-lucide="log-out" class="w-4 h-4"></i>
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6">
        <!-- Contractor Personal KPIs -->
        <div id="contractorKpiGrid" class="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4"></div>

        <!-- Contractor Navigation Tabs -->
        <div class="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
          <div class="flex gap-2">
            <button id="cTabListBtn" onclick="switchContractorTab('list')" class="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-se-dark-blue text-white transition">
              <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
              <span>سجل فواتيري</span>
            </button>
            <button id="cTabFormBtn" onclick="switchContractorTab('form')" class="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 text-slate-600 hover:bg-slate-100 transition">
              <i data-lucide="plus-circle" class="w-4 h-4"></i>
              <span id="cTabFormLabel">رفع فاتورة جديدة</span>
            </button>
          </div>
        </div>

        <!-- Contractor Sub-View 1: My Invoices Table -->
        <div id="contractorListPanel" class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div class="relative flex-1 min-w-[220px]">
              <input type="text" id="contractorTableSearch" oninput="renderContractorTable()" placeholder="ابحث برقم أمر العمل، الموقع الوظيفي، وصف العمل..."
                class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue py-2.5 pr-10 pl-4 text-sm outline-none" />
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2"></i>
            </div>
            <select id="contractorStatusFilter" onchange="renderContractorTable()" class="rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 text-sm font-semibold outline-none">
              <option value="">كل الحالات</option>
              <option value="معتمد">معتمد (تم)</option>
              <option value="قيد المراجعة">قيد المراجعة</option>
              <option value="ملاحظات معلقة">ملاحظات معلقة</option>
              <option value="مرفوض">مرفوض (غير معتمد)</option>
            </select>
          </div>

          <div id="contractorTableScrollWrap" class="overflow-auto max-h-[65vh]">
            <table class="copyable-table w-full min-w-max text-sm text-right">
              <thead class="bg-slate-100 text-slate-700 text-xs font-extrabold border-b border-slate-200 whitespace-nowrap sticky top-0 z-10">
                <tr>
                  <th class="py-3.5 px-3 bg-slate-100">رقم أمر العمل</th>
                  <th class="py-3.5 px-3 bg-slate-100">الاستشاري</th>
                  <th class="py-3.5 px-3 bg-slate-100">تاريخ الفاتورة</th>
                  <th class="py-3.5 px-3 bg-slate-100">نوع العمل</th>
                  <th class="py-3.5 px-3 bg-slate-100">وصف العمل</th>
                  <th class="py-3.5 px-3 bg-slate-100">نوع المعدة</th>
                  <th class="py-3.5 px-3 bg-slate-100">الموقع الوظيفي</th>
                  <th class="py-3.5 px-3 bg-slate-100">المكتب</th>
                  <th class="py-3.5 px-3 bg-slate-100">تاريخ التسليم للأصول</th>
                  <th class="py-3.5 px-3 bg-slate-100">المرفقات</th>
                  <th class="py-3.5 px-3 bg-slate-100">الحالة والملاحظة</th>
                  <th class="py-3.5 px-3 text-center bg-slate-100">إجراء</th>
                </tr>
              </thead>
              <tbody id="contractorTableBody" class="divide-y divide-slate-100"></tbody>
            </table>
          </div>
        </div>

        <!-- Contractor Sub-View 2: New / Edit Invoice Submission Form -->
        <div id="contractorFormPanel" class="hidden bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-7">
          <div class="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-200">
            <div>
              <h2 id="cFormHeading" class="text-xl font-extrabold text-se-dark-blue">تقديم فاتورة صيانة / طوارئ جديدة</h2>
              <p class="text-xs text-slate-500 mt-1">عبّئ كافة حقول الجدول المعتمد وأرفق صور مراحل التنفيذ ليتم حفظها وتصنيفها تلقائياً</p>
            </div>
            <button type="button" onclick="resetContractorForm(); switchContractorTab('list');" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition">
              العودة للسجل
            </button>
          </div>

          <form id="contractorInvoiceForm" onsubmit="submitContractorInvoice(event)" class="space-y-6">
            <input type="hidden" id="cEditId" value="" />

            <!-- Duplicate WO Alert -->
            <div id="duplicateWoAlert" class="hidden p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm font-bold flex items-center gap-2">
              <i data-lucide="alert-triangle" class="w-5 h-5 text-amber-600 shrink-0"></i>
              <span id="duplicateWoText"></span>
            </div>

            <!-- Grid Fields matching Excel Columns -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">رقم أمر العمل *</label>
                <input type="text" id="cf_wo" required oninput="checkDuplicateWo(this.value)" placeholder="مثال: 422073943"
                  class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue py-2.5 px-3.5 text-sm font-mono font-bold outline-none" dir="ltr" />
              </div>
              <div>
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">المقاول (مثبّت تلقائياً)</label>
                <input type="text" id="cf_contractor" readonly
                  class="w-full rounded-xl border border-slate-200 bg-slate-100 text-slate-600 py-2.5 px-3.5 text-sm font-bold cursor-not-allowed" />
              </div>
              <div>
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">الاستشاري *</label>
                <select id="cf_consultant" required class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue py-2.5 px-3.5 text-sm font-semibold outline-none"></select>
              </div>
              <div>
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">تاريخ الفاتورة *</label>
                <input type="date" id="cf_invoiceDate" required
                  class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue py-2.5 px-3.5 text-sm font-semibold outline-none" />
              </div>
              <div>
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">نوع العمل *</label>
                <select id="cf_workType" required class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue py-2.5 px-3.5 text-sm font-semibold outline-none"></select>
              </div>
              <div>
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">وصف العمل *</label>
                <input type="text" id="cf_workDesc" list="workDescList" required placeholder="اختر أو اكتب وصف العمل..."
                  class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue py-2.5 px-3.5 text-sm font-semibold outline-none" />
                <datalist id="workDescList"></datalist>
              </div>
              <div>
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">نوع المعدة *</label>
                <select id="cf_equipType" required class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue py-2.5 px-3.5 text-sm font-semibold outline-none"></select>
              </div>
              <div>
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">الموقع الوظيفي (Functional Location) *</label>
                <input type="text" id="cf_funcLoc" required placeholder="مثال: 4400-JHS-090101"
                  class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue py-2.5 px-3.5 text-sm font-mono font-semibold outline-none" dir="ltr" />
              </div>
              <div>
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">المكتب *</label>
                <select id="cf_office" required class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue py-2.5 px-3.5 text-sm font-semibold outline-none"></select>
              </div>
              <div>
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">تاريخ تسليم الفاتورة للأصول (تلقائي بتاريخ اليوم)</label>
                <input type="date" id="cf_deliveryDate" readonly required
                  class="w-full rounded-xl border border-slate-200 bg-slate-100 text-slate-600 py-2.5 px-3.5 text-sm font-bold cursor-not-allowed outline-none" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs font-extrabold text-se-dark-blue mb-1.5">ملاحظات إضافية من المقاول (اختياري)</label>
                <input type="text" id="cf_contractorNote" placeholder="أي تفاصيل ميدانية أو رقم طلب SAP..."
                  class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-se-mid-blue py-2.5 px-3.5 text-sm outline-none" />
              </div>
            </div>

            <!-- Smart Pre-Submission Quality Checklist -->
            <div class="bg-se-navy-50/70 border border-se-navy-100 rounded-2xl p-4 sm:p-5">
              <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div class="flex items-center gap-2">
                  <i data-lucide="clipboard-check" class="w-5 h-5 text-se-mid-blue"></i>
                  <h3 class="text-sm font-extrabold text-se-dark-blue">قائمة التحقق الذكية قبل الرفع (لتفادي تأخر واعتماد الفاتورة)</h3>
                </div>
                <span id="checklistScoreBadge" class="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-800">جاهزية: 0%</span>
              </div>
              <div class="w-full h-2 bg-white rounded-full overflow-hidden mb-4 border border-se-navy-100">
                <div id="checklistProgressBar" class="h-full bg-se-mid-blue transition-all duration-300" style="width: 0%"></div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs font-bold text-se-dark-blue">
                <label class="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-se-mid-blue transition">
                  <input type="checkbox" class="cf-check w-4 h-4 accent-se-mid-blue rounded" data-key="gis" onchange="updateChecklistProgress()" />
                  <span>تم توقيع الفاتورة من قسم GIS</span>
                </label>
                <label class="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-se-mid-blue transition">
                  <input type="checkbox" class="cf-check w-4 h-4 accent-se-mid-blue rounded" data-key="sap" onchange="updateChecklistProgress()" />
                  <span>تم إنشاء المعدة على نظام SAP</span>
                </label>
                <label class="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-se-mid-blue transition">
                  <input type="checkbox" class="cf-check w-4 h-4 accent-se-mid-blue rounded" data-key="pretest" onchange="updateChecklistProgress()" />
                  <span>إرفاق نموذج اختبار ما قبل التشغيل</span>
                </label>
                <label class="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-se-mid-blue transition">
                  <input type="checkbox" class="cf-check w-4 h-4 accent-se-mid-blue rounded" data-key="photosMatch" onchange="updateChecklistProgress()" />
                  <span>الصور مطابقة لمراحل العمل المنفذ</span>
                </label>
                <label class="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-se-mid-blue transition">
                  <input type="checkbox" class="cf-check w-4 h-4 accent-se-mid-blue rounded" data-key="warningTape" onchange="updateChecklistProgress()" />
                  <span>الالتزام بالشريط التحذيري للحفر/الجوينت</span>
                </label>
              </div>
            </div>

            <!-- Multi-Photo Upload & Dropbox Zone -->
            <div class="border-2 border-dashed border-slate-300 hover:border-se-mid-blue rounded-2xl p-5 bg-slate-50/70 transition">
              <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div class="flex items-center gap-2.5">
                  <div class="w-10 h-10 rounded-xl bg-se-light-blue/20 text-se-mid-blue flex items-center justify-center">
                    <i data-lucide="camera" class="w-5 h-5"></i>
                  </div>
                  <div>
                    <h3 class="text-sm font-extrabold text-se-dark-blue">إرفاق صور الأعمال والفاتورة (الأرشفة على Dropbox)</h3>
                    <p class="text-xs text-slate-500">يتم ضغط الصور تلقائياً وأرشفتها داخل مجلد المقاول وأمر العمل على Dropbox</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <label class="text-xs font-bold text-slate-600">تصنيف الصورة:</label>
                  <select id="photoStageSelect" class="rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs font-bold outline-none">
                    <option value="قبل التنفيذ">قبل التنفيذ</option>
                    <option value="أثناء العمل">أثناء العمل</option>
                    <option value="بعد التنفيذ">بعد التنفيذ</option>
                    <option value="صورة الفاتورة">صورة الفاتورة</option>
                  </select>
                </div>
              </div>

              <label for="cf_photoInput" class="flex flex-col items-center justify-center py-6 px-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-se-light-blue/10 transition text-center">
                <i data-lucide="cloud-upload" class="w-8 h-8 text-se-mid-blue mb-2"></i>
                <span class="text-sm font-bold text-se-dark-blue">اضغط لاختيار الملفات (صور، PDF، بوربوينت) أو اسحبها هنا</span>
                <span class="text-xs text-slate-400 mt-1">يدعم رفع الصور (JPG, PNG)، ملفات PDF، وعروض PowerPoint (PPT, PPTX)</span>
                <input type="file" id="cf_photoInput" accept="image/*,.pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" multiple class="hidden" onchange="handlePhotoSelection(event)" />
              </label>

              <div id="pendingPhotosGrid" class="mt-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3"></div>
            </div>

            <!-- Submit Button -->
            <div class="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button type="button" onclick="resetContractorForm()" class="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition">
                مسح الحقول
              </button>
              <button type="submit" id="cfSubmitBtn" class="px-7 py-3 rounded-xl bg-se-mid-blue hover:bg-se-blue text-white text-sm font-extrabold shadow-lg shadow-se-mid-blue/25 transition flex items-center gap-2">
                <i data-lucide="send" class="w-4 h-4"></i>
                <span>اعتماد ورفع الفاتورة للقسم</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </section>
`;
