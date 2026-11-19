export const STAFF_VIEW_MARKUP = `
    <!-- ==================== 3. DEPARTMENT STAFF PORTAL VIEW ==================== -->
    <section id="staffView" class="hidden min-h-screen flex bg-slatebg relative">
      <!-- Mobile Sidebar Overlay -->
      <div id="sidebarOverlay" onclick="toggleMobileSidebar(false)" class="hidden fixed inset-0 bg-navy-950/50 z-40 lg:hidden"></div>

      <!-- Staff Sidebar -->
      <aside id="staffSidebar" class="fixed lg:sticky top-0 right-0 h-screen w-72 bg-navy-900 text-white flex flex-col justify-between z-50 translate-x-full lg:translate-x-0 transition-transform duration-300 shadow-2xl shrink-0">
        <div class="overflow-y-auto">
          <div class="p-5 border-b border-white/10 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-accent-500 flex items-center justify-center shadow">
                <i data-lucide="zap" class="w-5 h-5 text-white"></i>
              </div>
              <div>
                <h1 class="text-sm font-extrabold leading-tight">إدارة الفواتير</h1>
                <p class="text-[11px] text-slate-300">الصيانة والطوارئ</p>
              </div>
            </div>
            <button onclick="toggleMobileSidebar(false)" class="lg:hidden text-slate-300 hover:text-white p-1">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <nav class="p-3.5 space-y-1.5" id="staffNav">
            <button onclick="switchStaffSection('dashboard')" data-sec="dashboard" class="staff-nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition bg-accent-500 text-white shadow">
              <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
              <span>لوحة التحكم (Dashboard)</span>
            </button>
            <button onclick="switchStaffSection('invoices')" data-sec="invoices" class="staff-nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition text-slate-300 hover:bg-white/10 hover:text-white">
              <i data-lucide="file-check-2" class="w-4 h-4"></i>
              <span>سجل ومراجعة الفواتير</span>
            </button>
            <button onclick="switchStaffSection('reports')" data-sec="reports" class="staff-nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition text-slate-300 hover:bg-white/10 hover:text-white">
              <i data-lucide="file-bar-chart-2" class="w-4 h-4"></i>
              <span>التقارير والتصدير الكامل</span>
            </button>
            <button onclick="switchStaffSection('users')" data-sec="users" class="staff-nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition text-slate-300 hover:bg-white/10 hover:text-white">
              <i data-lucide="users-cog" class="w-4 h-4"></i>
              <span>إدارة الصلاحيات والمستخدمين</span>
            </button>
            <button onclick="switchStaffSection('onedrive')" data-sec="onedrive" class="staff-nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition text-slate-300 hover:bg-white/10 hover:text-white">
              <i data-lucide="cloud" class="w-4 h-4"></i>
              <span>الربط السحابي OneDrive</span>
            </button>
          </nav>
        </div>

        <div class="p-4 border-t border-white/10 bg-navy-950/60">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-full bg-accent-500/20 border border-accent-500/40 text-accent-400 flex items-center justify-center font-extrabold text-sm" id="staffAvatarChar">م</div>
            <div class="min-w-0">
              <div id="staffNameLabel" class="text-xs font-extrabold truncate">مرحباً</div>
              <div id="staffRoleLabel" class="text-[11px] text-slate-400 truncate">صلاحيات كاملة</div>
            </div>
          </div>
          <div class="space-y-1.5">
            <button onclick="openResetPasswordModal(true)" class="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-accent-500 text-xs font-bold text-slate-200 hover:text-white flex items-center justify-center gap-2 transition border border-white/10">
              <i data-lucide="key-round" class="w-3.5 h-3.5"></i>
              <span>إعادة تعيين كلمة المرور</span>
            </button>
            <button onclick="logout()" class="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-rose-600 text-xs font-bold text-white flex items-center justify-center gap-2 transition">
              <i data-lucide="log-out" class="w-4 h-4"></i>
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- Staff Main Content -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Top Bar -->
        <header class="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <button onclick="toggleMobileSidebar(true)" class="lg:hidden p-2 rounded-xl bg-slate-100 text-navy-900">
              <i data-lucide="menu" class="w-5 h-5"></i>
            </button>
            <div>
              <h2 id="staffSectionTitle" class="text-lg font-extrabold text-navy-900">لوحة التحكم التنفيذية</h2>
              <p id="staffTopWelcome" class="text-xs font-bold text-accent-600">مرحباً بك في منصة متابعة فواتير الصيانة والطوارئ</p>
            </div>
          </div>

          <div class="flex items-center gap-2 sm:gap-3"></div>
        </header>

        <main class="p-4 sm:p-6 flex-1 space-y-6">

          <!-- ========== MODULE 1: EXECUTIVE DASHBOARD ========== -->
          <div id="sec_dashboard" class="space-y-6 animate-fade-up">
            <!-- Dashboard Filters & Filtered Export Bar -->
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3">
              <div class="flex flex-wrap items-center gap-3">
                <div class="flex items-center gap-2 text-xs font-extrabold text-navy-900 ml-2">
                  <i data-lucide="filter" class="w-4 h-4 text-accent-500"></i>
                  <span>تصفية لوحة التحكم:</span>
                </div>
                <select id="dashContractorFilter" onchange="renderDashboard()" class="rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 text-xs font-bold outline-none"></select>
                <select id="dashOfficeFilter" onchange="renderDashboard()" class="rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 text-xs font-bold outline-none"></select>
                <select id="dashWorkTypeFilter" onchange="renderDashboard()" class="rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 text-xs font-bold outline-none"></select>
                <select id="dashConsultantFilter" onchange="renderDashboard()" class="rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 text-xs font-bold outline-none"></select>
                <select id="dashStatusFilter" onchange="renderDashboard()" class="rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 text-xs font-bold outline-none">
                  <option value="">كل الحالات</option>
                  <option value="معتمد">معتمد</option>
                  <option value="قيد المراجعة">قيد المراجعة</option>
                  <option value="ملاحظات معلقة">ملاحظات معلقة</option>
                  <option value="مرفوض">مرفوض</option>
                </select>
                <button onclick="resetDashFilters()" class="mr-auto text-xs font-bold text-accent-600 hover:underline">إعادة تعيين</button>
              </div>

              <!-- Export Current Filtered Dashboard (PDF) -->
              <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                <div id="dashActiveFilterHint" class="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                  <i data-lucide="sliders-horizontal" class="w-3.5 h-3.5 text-navy-700"></i>
                  <span>نطاق التصدير الحالي: كافة البيانات (بدون تصفية)</span>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <button type="button" onclick="exportDashboardPdf()" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-xs font-extrabold shadow-sm transition">
                    <i data-lucide="file-text" class="w-4 h-4"></i>
                    <span>تصدير Dashboard PDF</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- KPI Cards (Operations + SLA Tracking) -->
            <div id="dashKpiGrid" class="space-y-4"></div>

            <!-- Interactive KPI Drill-Down Table (Opens when clicking any KPI Card) -->
            <div id="dashDrilldownPanel" class="hidden bg-white rounded-2xl shadow-md border-2 border-accent-500/30 overflow-hidden animate-fade-up">
              <div class="p-4 bg-navy-900 text-white flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-accent-500 flex items-center justify-center">
                    <i data-lucide="list-filter" class="w-4 h-4 text-white"></i>
                  </div>
                  <div>
                    <h3 id="dashDrilldownTitle" class="text-sm font-extrabold">تفاصيل الفواتير</h3>
                    <p id="dashDrilldownSub" class="text-[11px] text-slate-300"></p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <input type="text" id="dashDrilldownSearch" oninput="renderDashDrilldown()" placeholder="بحث سريع داخل القائمة..."
                    class="rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-300 py-1.5 px-3 text-xs outline-none w-48 sm:w-60" />
                  <button onclick="closeDashDrilldown()" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    <span>إغلاق</span>
                  </button>
                </div>
              </div>
              <div id="dashDrilldownScrollWrap" class="overflow-auto max-h-96">
                <table class="copyable-table w-full min-w-max text-xs text-right">
                  <thead class="bg-slate-100 text-slate-700 font-extrabold sticky top-0 z-10 border-b border-slate-200 whitespace-nowrap">
                    <tr>
                      <th class="py-3 px-3">أمر العمل</th>
                      <th class="py-3 px-3">المقاول</th>
                      <th class="py-3 px-3">الاستشاري</th>
                      <th class="py-3 px-3">تاريخ الفاتورة</th>
                      <th class="py-3 px-3">نوع العمل</th>
                      <th class="py-3 px-3">وصف العمل</th>
                      <th class="py-3 px-3">المكتب</th>
                      <th class="py-3 px-3">تاريخ التسليم للأصول</th>
                      <th class="py-3 px-3">المدة</th>
                      <th class="py-3 px-3">التصنيف</th>
                      <th class="py-3 px-3">الحالة</th>
                      <th class="py-3 px-3 text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody id="dashDrilldownBody" class="divide-y divide-slate-100"></tbody>
                </table>
              </div>
            </div>

            <!-- Chart 1 (Top): Work Types Distribution -->
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h3 class="text-sm font-extrabold text-navy-900 mb-3 flex items-center gap-2">
                <i data-lucide="pie-chart" class="w-4 h-4 text-accent-500"></i>
                توزيع أنواع الأعمال
              </h3>
              <div class="max-w-md mx-auto">
                <div class="h-48 relative flex items-center justify-center">
                  <canvas id="chartWorkTypes"></canvas>
                  <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span class="text-[11px] font-bold text-slate-400">الإجمالي</span>
                    <span id="workTypesTotalCenter" class="text-2xl font-black text-navy-900">0</span>
                  </div>
                </div>
                <div id="workTypesBreakdown" class="mt-3 grid grid-cols-2 gap-2"></div>
              </div>
            </div>

            <!-- Chart 2: Contractors Stacked Bar -->
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 class="text-sm font-extrabold text-navy-900 flex items-center gap-2">
                  <i data-lucide="bar-chart-horizontal" class="w-4 h-4 text-accent-500"></i>
                  عدد الفواتير حسب المقاول وحالة الاعتماد
                </h3>
              </div>
              <div class="h-80 relative"><canvas id="chartContractors"></canvas></div>
            </div>

            <!-- Charts Row 2 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <h3 class="text-sm font-extrabold text-navy-900 mb-3 flex items-center gap-2">
                  <i data-lucide="map-pin" class="w-4 h-4 text-accent-500"></i>
                  توزيع الفواتير حسب المكاتب
                </h3>
                <div class="h-64 relative"><canvas id="chartOffices"></canvas></div>
              </div>
              <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <h3 class="text-sm font-extrabold text-navy-900 mb-3 flex items-center gap-2">
                  <i data-lucide="wrench" class="w-4 h-4 text-accent-500"></i>
                  أكثر أوصاف الأعمال تكراراً
                </h3>
                <div class="h-64 relative"><canvas id="chartWorkDescs"></canvas></div>
              </div>
            </div>

            <!-- Row 3: Delay Root Causes Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 class="text-sm font-extrabold text-navy-900 flex items-center gap-2">
                    <i data-lucide="alert-octagon" class="w-4 h-4 text-rose-500"></i>
                    مؤشر أبرز أسباب تأخر إنجاز الفواتير
                  </h3>
                  <span class="text-[11px] font-bold text-slate-400">حسب تكرار الملاحظة</span>
                </div>
                <div class="h-64 relative"><canvas id="chartTopDelayNotes"></canvas></div>
              </div>

              <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 class="text-sm font-extrabold text-navy-900 flex items-center gap-2">
                    <i data-lucide="building-2" class="w-4 h-4 text-rose-500"></i>
                    مؤشر أسباب تأخر إنجاز الفواتير حسب المقاول
                  </h3>
                  <span class="text-[11px] font-bold text-slate-400">أكثر 5 مقاولين عليهم ملاحظات</span>
                </div>
                <div class="h-72 relative"><canvas id="chartDelayByContractor"></canvas></div>
              </div>
            </div>
          </div>

          <!-- ========== MODULE 2: ALL INVOICES MANAGEMENT ========== -->
          <div id="sec_invoices" class="hidden space-y-5 animate-fade-up">
            <!-- Action Bar -->
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div class="flex flex-wrap items-center gap-2">
                <button id="staffAddInvBtn" onclick="openStaffInvoiceModal()" class="px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold flex items-center gap-1.5 transition">
                  <i data-lucide="plus" class="w-4 h-4"></i>
                  <span>إضافة فاتورة</span>
                </button>
                <button id="staffExportExcelBtn" type="button" onclick="exportFilteredStaffInvoicesExcel()" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition">
                  <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
                  <span>تصدير Excel</span>
                </button>
                <button id="bulkApproveBtn" onclick="bulkApproveSelected()" class="hidden px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-xs font-bold flex items-center gap-1.5 transition">
                  <i data-lucide="check-check" class="w-4 h-4"></i>
                  <span>اعتماد المحدد (<span id="selectedCountSpan">0</span>)</span>
                </button>
              </div>
              <div class="text-xs font-bold text-slate-500">
                المعروض: <span id="staffTableCount" class="text-navy-900 font-extrabold">0</span> فاتورة
              </div>
            </div>

            <!-- Filters Bar -->
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-2.5">
              <div class="lg:col-span-2 relative">
                <input type="text" id="invSearch" oninput="renderStaffInvoicesTable()" placeholder="بحث برقم أمر العمل، الموقع، وصف العمل..."
                  class="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white py-2 pr-9 pl-3 text-xs font-semibold outline-none" />
                <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2"></i>
              </div>
              <select id="invFilterMonth" onchange="renderStaffInvoicesTable()" class="rounded-xl border border-slate-300 bg-slate-50 py-2 px-2.5 text-xs font-bold outline-none">
                <option value="">كل الأشهر</option>
              </select>
              <select id="invFilterContractor" onchange="renderStaffInvoicesTable()" class="rounded-xl border border-slate-300 bg-slate-50 py-2 px-2.5 text-xs font-bold outline-none"></select>
              <select id="invFilterOffice" onchange="renderStaffInvoicesTable()" class="rounded-xl border border-slate-300 bg-slate-50 py-2 px-2.5 text-xs font-bold outline-none"></select>
              <select id="invFilterWorkType" onchange="renderStaffInvoicesTable()" class="rounded-xl border border-slate-300 bg-slate-50 py-2 px-2.5 text-xs font-bold outline-none"></select>
              <select id="invFilterStatus" onchange="renderStaffInvoicesTable()" class="rounded-xl border border-slate-300 bg-slate-50 py-2 px-2.5 text-xs font-bold outline-none">
                <option value="">كل الحالات</option>
                <option value="معتمد">معتمد</option>
                <option value="قيد المراجعة">قيد المراجعة</option>
                <option value="ملاحظات معلقة">ملاحظات معلقة</option>
                <option value="مرفوض">مرفوض</option>
              </select>
              <select id="invFilterSla" onchange="renderStaffInvoicesTable()" class="rounded-xl border border-slate-300 bg-slate-50 py-2 px-2.5 text-xs font-bold outline-none">
                <option value="">كل التصنيفات</option>
                <option value="جديد">جديد (1-3 أيام)</option>
                <option value="متأخر">متأخر (4-5 أيام)</option>
                <option value="مصعّد">مصعّد (+5 أيام)</option>
                <option value="تمت المراجعة">تمت المراجعة</option>
              </select>
            </div>

            <!-- Invoices Table (Scrollable X & Y + Full Text Copy Support) -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div class="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-bold">
                <span class="flex items-center gap-2">
                  <i data-lucide="table" class="w-4 h-4 text-accent-500"></i>
                  <span>جميع بيانات الجدول — العدد الإجمالي: <span id="staffTableBannerCount" class="text-navy-900 font-black">0</span> فاتورة</span>
                </span>
              </div>
              <div id="staffTableScrollWrap" class="overflow-auto max-h-[65vh]">
                <table class="copyable-table w-full min-w-max text-xs sm:text-sm text-right">
                  <thead class="bg-slate-100 text-slate-700 text-xs font-extrabold border-b border-slate-200 whitespace-nowrap sticky top-0 z-10 shadow-xs">
                    <tr>
                      <th class="py-3 px-2.5 w-8 bg-slate-100"><input type="checkbox" id="selectAllInv" onchange="toggleSelectAllInv(this.checked)" class="w-4 h-4 accent-accent-500 rounded" /></th>
                      <th class="py-3 px-2.5 bg-slate-100">أمر العمل</th>
                      <th class="py-3 px-2.5 bg-slate-100">المقاول</th>
                      <th class="py-3 px-2.5 bg-slate-100">الاستشاري</th>
                      <th class="py-3 px-2.5 bg-slate-100">تاريخ الفاتورة</th>
                      <th class="py-3 px-2.5 bg-slate-100">نوع العمل</th>
                      <th class="py-3 px-2.5 bg-slate-100">وصف العمل</th>
                      <th class="py-3 px-2.5 bg-slate-100">نوع المعدة</th>
                      <th class="py-3 px-2.5 bg-slate-100">الموقع الوظيفي</th>
                      <th class="py-3 px-2.5 bg-slate-100">المكتب</th>
                      <th class="py-3 px-2.5 bg-slate-100">تاريخ التسليم للأصول</th>
                      <th class="py-3 px-2.5 bg-slate-100">المدة</th>
                      <th class="py-3 px-2.5 bg-slate-100">التصنيف</th>
                      <th class="py-3 px-2.5 bg-slate-100">المرفقات</th>
                      <th class="py-3 px-2.5 bg-slate-100">الحالة</th>
                      <th class="py-3 px-2.5 text-center bg-slate-100">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody id="staffInvoicesBody" class="divide-y divide-slate-100"></tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ========== MODULE 3: REPORTS & FULL EXPORT ========== -->
          <div id="sec_reports" class="hidden space-y-6 animate-fade-up">
            <!-- Export Action Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-gradient-to-l from-navy-900 to-navy-800 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between gap-4">
                <div>
                  <div class="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 text-accent-100 mb-3">
                    <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                    <span>تقرير تنفيذي جاهز للطباعة والحفظ كـ PDF</span>
                  </div>
                  <h3 class="text-lg font-extrabold">تصدير التقرير الشامل (PDF / طباعة)</h3>
                  <p class="text-xs text-slate-300 mt-1 leading-relaxed">
                    يتضمن ملخص مؤشرات الأداء، مصفوفة المقاولين × نوع العمل، توزيع المكاتب، أبرز ملاحظات التأخير، والجدول التفصيلي الكامل للفواتير.
                  </p>
                </div>
                <button onclick="printExecutiveReport()" class="w-full sm:w-auto self-start px-5 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-extrabold shadow-lg transition flex items-center gap-2">
                  <i data-lucide="file-text" class="w-4 h-4"></i>
                  <span>إصدار وطباعة التقرير الكامل PDF</span>
                </button>
              </div>

              <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between gap-4">
                <div>
                  <div class="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 mb-3">
                    <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5"></i>
                    <span>ملف Excel متعدد الأوراق (.xlsx)</span>
                  </div>
                  <h3 class="text-lg font-extrabold text-navy-900">تصدير قاعدة البيانات والتقارير إلى Excel</h3>
                  <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                    ينشئ ملف إكسل حقيقي يحتوي على 3 أوراق: (1) الفواتير التفصيلية مع روابط OneDrive، (2) ملخص أداء المقاولين ونوع العمل، (3) سجل ملاحظات التأخير.
                  </p>
                </div>
                <button onclick="exportFullExcel()" class="w-full sm:w-auto self-start px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold shadow transition flex items-center gap-2">
                  <i data-lucide="download" class="w-4 h-4"></i>
                  <span>تنزيل ملف Excel الشامل (.xlsx)</span>
                </button>
              </div>
            </div>

            <!-- Contractor Performance Scorecard -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div class="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 class="text-base font-extrabold text-navy-900">بطاقة أداء المقاولين ومصفوفة أنواع الأعمال</h3>
                  <p class="text-xs text-slate-500">تحديث لحظي مطابق لهيكل ورقة5 مع نسب الاعتماد ومؤشر الالتزام</p>
                </div>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-xs sm:text-sm text-right">
                  <thead class="bg-slate-50 text-slate-600 text-xs font-extrabold border-b border-slate-200">
                    <tr>
                      <th class="py-3 px-4">المقاول</th>
                      <th class="py-3 px-3 text-center">الإجمالي</th>
                      <th class="py-3 px-3 text-center">طوارئ</th>
                      <th class="py-3 px-3 text-center">صيانة معدة</th>
                      <th class="py-3 px-3 text-center">صيانة مغذي</th>
                      <th class="py-3 px-3 text-center">C4C</th>
                      <th class="py-3 px-3 text-center text-emerald-700">معتمد</th>
                      <th class="py-3 px-3 text-center text-rose-700">مرفوض/ملاحظات</th>
                      <th class="py-3 px-4">نسبة الاعتماد</th>
                    </tr>
                  </thead>
                  <tbody id="scorecardBody" class="divide-y divide-slate-100"></tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ========== MODULE 4: USERS, CONTRACTORS & AUDIT LOG ========== -->
          <div id="sec_users" class="hidden space-y-6 animate-fade-up">
            <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <!-- Contractors Directory -->
              <div class="xl:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 class="text-base font-extrabold text-navy-900">إدارة حسابات المقاولين (31 مقاولاً)</h3>
                    <p class="text-xs text-slate-500">تعديل الرقم السري، تفعيل أو إيقاف الدخول، وإضافة مقاول جديد — محفوظ مباشرة في Firestore</p>
                  </div>
                  <button onclick="addNewContractorPrompt()" class="px-3.5 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-xs font-bold flex items-center gap-1.5">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>مقاول جديد</span>
                  </button>
                </div>
                <div class="p-3 border-b border-slate-100">
                  <input type="text" id="contractorAdminSearch" oninput="renderUsersManagement()" placeholder="ابحث عن مقاول..."
                    class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 text-xs font-semibold outline-none" />
                </div>
                <div class="overflow-x-auto max-h-96">
                  <table class="w-full text-xs text-right">
                    <thead class="bg-slate-50 text-slate-600 font-extrabold sticky top-0">
                      <tr>
                        <th class="py-2.5 px-4">اسم المقاول</th>
                        <th class="py-2.5 px-3">الرقم السري (PIN)</th>
                        <th class="py-2.5 px-3">الحالة</th>
                        <th class="py-2.5 px-3 text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody id="contractorsAdminBody" class="divide-y divide-slate-100"></tbody>
                  </table>
                </div>
              </div>

              <!-- Staff Accounts -->
              <div class="xl:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div class="p-5 border-b border-slate-100">
                  <h3 class="text-base font-extrabold text-navy-900">حسابات موظفي القسم والصلاحيات</h3>
                  <p class="text-xs text-slate-500">إضافة موظف جديد وتعديل مستوى الصلاحية — متزامن لحظياً مع Firestore</p>
                </div>
                <form onsubmit="addStaffUser(event)" class="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-2.5">
                  <input type="text" id="newStaffName" required placeholder="الاسم الكامل" class="rounded-lg border border-slate-300 bg-white py-2 px-2.5 text-xs font-semibold outline-none" />
                  <input type="text" id="newStaffUser" required placeholder="اسم المستخدم (إنجليزي)" class="rounded-lg border border-slate-300 bg-white py-2 px-2.5 text-xs font-mono outline-none" dir="ltr" />
                  <input type="text" id="newStaffPass" required placeholder="كلمة المرور" class="rounded-lg border border-slate-300 bg-white py-2 px-2.5 text-xs font-mono outline-none" dir="ltr" />
                  <select id="newStaffRole" class="rounded-lg border border-slate-300 bg-white py-2 px-2.5 text-xs font-bold outline-none">
                    <option value="admin">مدير النظام (كامل)</option>
                    <option value="reviewer">مهندس مراجع (اعتماد)</option>
                    <option value="viewer">مراقب (عرض وتقارير)</option>
                  </select>
                  <button type="submit" class="col-span-2 py-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition">
                    إضافة حساب موظف
                  </button>
                </form>
                <div class="overflow-y-auto flex-1 max-h-72">
                  <table class="w-full text-xs text-right">
                    <thead class="bg-slate-50 text-slate-600 font-extrabold">
                      <tr>
                        <th class="py-2.5 px-3">الموظف</th>
                        <th class="py-2.5 px-3">المستخدم</th>
                        <th class="py-2.5 px-3">الصلاحية</th>
                        <th class="py-2.5 px-3 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody id="staffUsersBody" class="divide-y divide-slate-100"></tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Live Audit Log -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div class="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 class="text-base font-extrabold text-navy-900 flex items-center gap-2">
                  <i data-lucide="history" class="w-4 h-4 text-accent-500"></i>
                  سجل التدقيق والعمليات (Audit Log)
                </h3>
                <span class="text-xs text-slate-400">آخر 40 عملية</span>
              </div>
              <div class="overflow-x-auto max-h-72">
                <table class="w-full text-xs text-right">
                  <thead class="bg-slate-50 text-slate-600 font-extrabold sticky top-0">
                    <tr>
                      <th class="py-2.5 px-4">الوقت والتاريخ</th>
                      <th class="py-2.5 px-4">المستخدم</th>
                      <th class="py-2.5 px-4">العملية</th>
                      <th class="py-2.5 px-4">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody id="auditLogBody" class="divide-y divide-slate-100"></tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ========== MODULE 5: MICROSOFT ONEDRIVE INTEGRATION ========== -->
          <div id="sec_onedrive" class="hidden space-y-6 animate-fade-up">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <!-- Config & OAuth Form -->
              <div class="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
                <div class="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div class="flex items-center gap-3">
                    <div class="w-11 h-11 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center">
                      <i data-lucide="cloud" class="w-6 h-6"></i>
                    </div>
                    <div>
                      <h3 class="text-base font-extrabold text-navy-900">إعدادات الربط السحابي مع Microsoft OneDrive</h3>
                      <p class="text-xs text-slate-500">رفع وتخزين صور المقاولين مباشرة عبر Microsoft Graph API</p>
                    </div>
                  </div>
                  <span id="odStatusBadge" class="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-800">غير متصل (حفظ محلي)</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="sm:col-span-2">
                    <label class="block text-xs font-extrabold text-navy-900 mb-1.5">معرّف تطبيق Azure (Client ID)</label>
                    <input type="text" id="odClientId" placeholder="مثال: 12345678-abcd-efgh-ijkl-1234567890ab"
                      class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3.5 text-xs font-mono outline-none" dir="ltr" />
                  </div>
                  <div>
                    <label class="block text-xs font-extrabold text-navy-900 mb-1.5">معرّف المستأجر (Tenant ID)</label>
                    <input type="text" id="odTenantId" value="common" placeholder="common"
                      class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3.5 text-xs font-mono outline-none" dir="ltr" />
                  </div>
                  <div>
                    <label class="block text-xs font-extrabold text-navy-900 mb-1.5">المجلد الرئيسي على OneDrive</label>
                    <input type="text" id="odBaseFolder" value="/فواتير_الصيانة_والطوارئ"
                      class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3.5 text-xs font-bold outline-none" />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="block text-xs font-extrabold text-navy-900 mb-1.5">رمز الوصول المباشر (Access Token - محلي بالمتصفح فقط ولا يُحفظ بالسحابة)</label>
                    <input type="password" id="odAccessToken" placeholder="الصق Graph API Access Token أو استخدم زر الربط المباشر أدناه"
                      class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3.5 text-xs font-mono outline-none" dir="ltr" />
                  </div>
                </div>

                <div class="flex flex-wrap gap-2.5 pt-2">
                  <button type="button" onclick="saveOneDriveConfig()" class="px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition">
                    حفظ الإعدادات
                  </button>
                  <button type="button" onclick="connectOneDriveOAuth()" class="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 transition">
                    <i data-lucide="link-2" class="w-4 h-4"></i>
                    <span>ربط حساب OneDrive الآن</span>
                  </button>
                  <button type="button" onclick="verifyOneDriveToken()" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition">
                    <i data-lucide="check-circle-2" class="w-4 h-4"></i>
                    <span>فحص الاتصال</span>
                  </button>
                  <button type="button" onclick="syncLocalPhotosToOneDrive()" class="px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-xs font-bold flex items-center gap-1.5 transition">
                    <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                    <span>مزامنة الصور المحلية</span>
                  </button>
                </div>

                <!-- 4-Step Guide -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
                  <h4 class="font-extrabold text-navy-900">خطوات تفعيل الربط الحقيقي مع حساب OneDrive الخاص بالقسم:</h4>
                  <ol class="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed">
                    <li>سجّل الدخول إلى بوابة <span class="font-mono font-bold text-navy-800">portal.azure.com</span> واختر <b>App Registrations &gt; New registration</b>.</li>
                    <li>أضف رابط الصفحة الحالية كـ <b>Redirect URI (Single-page application)</b>، وفعّل <b>Access tokens</b> من تبويب Authentication.</li>
                    <li>من تبويب <b>API Permissions</b> أضف صلاحية <b>Microsoft Graph &gt; Files.ReadWrite</b> و <b>User.Read</b>.</li>
                    <li>انسخ <b>Application (client) ID</b> والصقه في الحقل أعلاه ثم اضغط «ربط حساب OneDrive الآن».</li>
                  </ol>
                </div>
              </div>

              <!-- Visual Folder Tree Preview -->
              <div class="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                <div>
                  <h3 class="text-base font-extrabold text-navy-900 mb-1 flex items-center gap-2">
                    <i data-lucide="folder-tree" class="w-5 h-5 text-accent-500"></i>
                    هيكل الأرشفة التلقائي على OneDrive
                  </h3>
                  <p class="text-xs text-slate-500 mb-4">يتم إنشاء المجلدات وتسمية الصور تلقائياً باسم المقاول ورقم أمر العمل</p>
                  <div id="odFolderTreePreview" class="bg-navy-950 text-sky-100 rounded-2xl p-4 font-mono text-xs space-y-1.5 overflow-y-auto max-h-80" dir="ltr"></div>
                </div>
                <div class="mt-4 p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 font-semibold">
                  إجمالي الصور المؤرشفة في المنصة حالياً: <span id="odTotalPhotosCount" class="font-extrabold text-sky-700">0</span> صورة
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </section>
`;
