import { testConnection } from './firebase';
import {
  type AuditLogRecord,
  type ContractorRecord,
  type InvoiceChecklist,
  type InvoicePhoto,
  type InvoiceRecord,
  type OneDriveCloudSettings,
  type StaffRole,
  type StaffUser,
  ensureFirestoreSeeded,
  fsAddAuditLog,
  fsBulkApproveInvoices,
  fsCreateContractor,
  fsCreateStaffUser,
  fsDeleteInvoice,
  fsDeleteStaffUser,
  fsSaveInvoice,
  fsSaveOneDriveSettings,
  fsToggleContractorActive,
  fsUpdateContractorPin,
  fsUpdateInvoicePhotos,
  fsUpdateInvoiceReview,
  fsUpdateStaffPassword,
  fsUpdateStaffRole,
  hashPassword,
  sanitizeId,
  subscribeAllCollections,
  verifyPassword,
} from './firestoreStore';
import {
  CONSULTANTS,
  EQUIP_TYPES,
  OFFICES,
  QUICK_REVIEW_NOTES,
  WORK_DESCS,
  WORK_TYPES,
  buildInitialSeedBundle,
} from './seedData';
import {
  type SessionInfo,
  createDashboardAndExportController,
  escapeHtml,
  formatNow,
  getInvoiceSlaInfo,
  refreshLucideIcons,
  statusBadgeHtml,
  todayISO,
} from './engine/dashboardAndExport';

const LOCAL_ONEDRIVE_TOKEN_KEY = 'sec_onedrive_local_token_v1';

interface AppState {
  invoices: InvoiceRecord[];
  contractors: ContractorRecord[];
  staffUsers: StaffUser[];
  auditLog: AuditLogRecord[];
  oneDrive: OneDriveCloudSettings & { accessToken: string };
}

function getLocalOneDriveToken(): string {
  try {
    return localStorage.getItem(LOCAL_ONEDRIVE_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

function setLocalOneDriveToken(token: string): void {
  try {
    if (token) localStorage.setItem(LOCAL_ONEDRIVE_TOKEN_KEY, token);
    else localStorage.removeItem(LOCAL_ONEDRIVE_TOKEN_KEY);
  } catch {
    // Ignore storage quota errors
  }
}

export function initPlatformEngine(onFatalError?: (err: Error) => void): () => void {
  const appState: AppState = {
    invoices: [],
    contractors: [],
    staffUsers: [],
    auditLog: [],
    oneDrive: {
      clientId: '',
      tenantId: 'common',
      baseFolder: '/فواتير_الصيانة_والطوارئ',
      connectedUser: '',
      updatedAt: '',
      accessToken: getLocalOneDriveToken(),
    },
  };

  let currentSession: SessionInfo | null = null;
  let currentStaffSection = 'dashboard';
  const selectedInvoiceIds = new Set<string>();
  let pendingPhotos: InvoicePhoto[] = [];
  let currentReviewId: string | null = null;
  let unsubFirestore: (() => void) | null = null;
  let destroyed = false;
  let initialSnapshotsReady = {
    staff: false,
    contractors: false,
    invoices: false,
  };
  let bootHidden = false;

  const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
    document.getElementById(id) as T | null;

  // ==================== TOAST & MODAL UTILITIES ====================
  function showToast(
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'success'
  ): void {
    const colors: Record<string, string> = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-rose-600 text-white',
      warning: 'bg-amber-500 text-navy-950',
      info: 'bg-navy-900 text-white',
    };
    const container = $('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `pointer-events-auto px-4 py-3 rounded-xl shadow-xl text-xs sm:text-sm font-bold flex items-center justify-between gap-3 animate-fade-up ${colors[type] || colors.info}`;
    el.innerHTML = `<span>${escapeHtml(message)}</span><button onclick="this.parentElement.remove()" class="opacity-80 hover:opacity-100 font-extrabold">✕</button>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  function closeModal(id: string): void {
    const el = $(id);
    if (el) el.classList.add('hidden');
  }

  function openConfirmModal(opts: {
    title: string;
    message: string;
    withInput?: boolean;
    defaultValue?: string;
    placeholder?: string;
    onConfirm?: (val: string) => void | Promise<void>;
  }): void {
    const titleEl = $('cmTitle');
    const msgEl = $('cmMessage');
    const inp = $<HTMLInputElement>('cmInput');
    const btn = $<HTMLButtonElement>('cmConfirmBtn');
    const modal = $('confirmModal');
    if (!titleEl || !msgEl || !inp || !btn || !modal) return;

    titleEl.textContent = opts.title;
    msgEl.textContent = opts.message;
    if (opts.withInput) {
      inp.classList.remove('hidden');
      inp.value = opts.defaultValue || '';
      inp.placeholder = opts.placeholder || '';
    } else {
      inp.classList.add('hidden');
    }

    btn.onclick = () => {
      const val = inp.value.trim();
      closeModal('confirmModal');
      if (opts.onConfirm) {
        void opts.onConfirm(val);
      }
    };
    modal.classList.remove('hidden');
    if (opts.withInput) setTimeout(() => inp.focus(), 80);
  }

  function openLightbox(src: string, title?: string, path?: string, fileName?: string): void {
    const img = $<HTMLImageElement>('lbImage');
    const docView = $('lbDocView');
    const docName = $('lbDocName');
    const downloadBtn = $<HTMLAnchorElement>('lbDownloadBtn');
    const lbTitle = $('lbTitle');
    const lbPath = $('lbPath');
    const modal = $('lightboxModal');

    if (lbTitle) lbTitle.textContent = title || 'معاينة المرفق';
    if (lbPath) lbPath.textContent = path || '';

    if (src.startsWith('data:image/')) {
      if (img) {
        img.src = src;
        img.classList.remove('hidden');
      }
      if (docView) docView.classList.add('hidden');
    } else {
      if (img) {
        img.src = '';
        img.classList.add('hidden');
      }
      if (docView) docView.classList.remove('hidden');
      if (docName) docName.textContent = fileName || path?.split('/').pop() || 'مستند مرفق';
      if (downloadBtn) downloadBtn.href = src;
    }

    if (modal) modal.classList.remove('hidden');
    refreshLucideIcons();
  }

  // ==================== AUDIT LOG (FIRESTORE) ====================
  function logAudit(action: string, details: string): void {
    const userLabel = currentSession
      ? `${currentSession.name} (${currentSession.type === 'staff' ? currentSession.role : 'مقاول'})`
      : 'النظام';
    const entry: AuditLogRecord = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      time: formatNow(),
      user: userLabel,
      action,
      details,
      createdAtMs: Date.now(),
    };
    appState.auditLog.unshift(entry);
    if (appState.auditLog.length > 60) appState.auditLog.pop();
    void fsAddAuditLog(entry).catch((err) => {
      console.error('Audit log write failed:', err);
    });
  }

  // ==================== DASHBOARD & EXPORT CONTROLLER ====================
  const dashCtrl = createDashboardAndExportController({
    getInvoices: () => appState.invoices,
    getSession: () => currentSession,
    logAudit,
    showToast,
  });

  // ==================== SHARED SELECTS ====================
  function populateStaticSelects(): void {
    const fill = (id: string, items: string[], firstOpt: string | null = null) => {
      const el = $(id);
      if (!el) return;
      el.innerHTML =
        (firstOpt ? `<option value="">${firstOpt}</option>` : '') +
        items.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
    };

    fill('cf_consultant', CONSULTANTS);
    fill('cf_workType', WORK_TYPES);
    fill('cf_equipType', EQUIP_TYPES);
    fill('cf_office', OFFICES);

    fill('im_consultant', CONSULTANTS);
    fill('im_workType', WORK_TYPES);
    fill('im_equipType', EQUIP_TYPES);
    fill('im_office', OFFICES);

    fill('dashOfficeFilter', OFFICES, 'كل المكاتب');
    fill('dashWorkTypeFilter', WORK_TYPES, 'كل أنواع الأعمال');
    fill('dashConsultantFilter', CONSULTANTS, 'كل الاستشاريين');

    fill('invFilterOffice', OFFICES, 'كل المكاتب');
    fill('invFilterWorkType', WORK_TYPES, 'كل أنواع الأعمال');

    const dl = $('workDescList');
    if (dl) {
      dl.innerHTML = WORK_DESCS.map((d) => `<option value="${escapeHtml(d)}"></option>`).join('');
    }
    refreshDynamicContractorSelects();
  }

  function refreshDynamicContractorSelects(): void {
    const names = appState.contractors.map((c) => c.name);
    const fill = (id: string, firstOpt: string | null = null) => {
      const el = $<HTMLSelectElement>(id);
      if (!el) return;
      const prev = el.value;
      el.innerHTML =
        (firstOpt ? `<option value="">${firstOpt}</option>` : '') +
        names.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
      if (prev) el.value = prev;
    };
    fill('im_contractor');
    fill('invFilterContractor', 'كل المقاولين');
    fill('dashContractorFilter', 'كل المقاولين');
  }

  const ARABIC_MONTHS = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ];

  function formatArabicYearMonth(ym: string): string {
    const parts = ym.split('-');
    if (parts.length !== 2) return ym;
    const year = parts[0];
    const monthIdx = Number(parts[1]) - 1;
    if (monthIdx < 0 || monthIdx > 11) return ym;
    return `${ARABIC_MONTHS[monthIdx]} ${year}`;
  }

  function refreshDynamicMonthSelect(): void {
    const el = $<HTMLSelectElement>('invFilterMonth');
    if (!el) return;
    const prev = el.value;
    const monthsSet = new Set<string>();
    appState.invoices.forEach((inv) => {
      const ym = (inv.invoiceDate || inv.deliveryDate || '').trim().slice(0, 7);
      if (/^\d{4}-\d{2}$/.test(ym)) monthsSet.add(ym);
    });
    const sortedMonths = Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
    el.innerHTML =
      '<option value="">كل الأشهر</option>' +
      sortedMonths
        .map((ym) => `<option value="${escapeHtml(ym)}">${escapeHtml(formatArabicYearMonth(ym))}</option>`)
        .join('');
    if (prev && sortedMonths.includes(prev)) el.value = prev;
  }

  // ==================== LOGIN LOGIC ====================
  function switchLoginTab(mode: 'staff' | 'contractor'): void {
    const cBtn = $('tabContractorBtn');
    const sBtn = $('tabStaffBtn');
    const cForm = $('contractorLoginForm');
    const sForm = $('staffLoginForm');
    $('loginErrorBox')?.classList.add('hidden');
    if (!cBtn || !sBtn || !cForm || !sForm) return;

    if (mode === 'contractor') {
      cBtn.className =
        'flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all bg-navy-900 text-white shadow-sm';
      sBtn.className =
        'flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all text-slate-600 hover:text-navy-900';
      cForm.classList.remove('hidden');
      sForm.classList.add('hidden');
    } else {
      sBtn.className =
        'flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all bg-navy-900 text-white shadow-sm';
      cBtn.className =
        'flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all text-slate-600 hover:text-navy-900';
      sForm.classList.remove('hidden');
      cForm.classList.add('hidden');
    }
  }

  function showLoginError(msg: string): void {
    const errText = $('loginErrorText');
    const errBox = $('loginErrorBox');
    if (errText) errText.textContent = msg;
    if (errBox) errBox.classList.remove('hidden');
  }

  function renderContractorDropdown(filter = ''): void {
    const listEl = $('contractorDropdownList');
    if (!listEl) return;
    const q = filter.trim().toLowerCase();
    const filtered = appState.contractors.filter((c) => c.name.toLowerCase().includes(q));
    if (!filtered.length) {
      listEl.innerHTML = `<div class="p-3 text-xs text-slate-400 text-center">لا توجد نتائج مطابقة</div>`;
      return;
    }
    listEl.innerHTML = filtered
      .map(
        (c) => `
      <button type="button" onclick="selectContractorFromList('${escapeHtml(c.name)}')"
        class="w-full text-right px-4 py-2.5 text-sm font-semibold hover:bg-accent-50 hover:text-accent-700 flex items-center justify-between transition ${!c.active ? 'opacity-50' : ''}">
        <span>${escapeHtml(c.name)}</span>
        ${!c.active ? '<span class="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">موقوف</span>' : ''}
      </button>
    `
      )
      .join('');
  }

  function openContractorDropdown(): void {
    const inp = $<HTMLInputElement>('contractorSearchInput');
    renderContractorDropdown(inp?.value || '');
    $('contractorDropdownList')?.classList.remove('hidden');
  }

  function toggleContractorDropdown(): void {
    const listEl = $('contractorDropdownList');
    if (!listEl) return;
    if (listEl.classList.contains('hidden')) openContractorDropdown();
    else listEl.classList.add('hidden');
  }

  function filterContractorDropdown(val: string): void {
    const sel = $<HTMLInputElement>('selectedContractorValue');
    if (sel) sel.value = val.trim();
    renderContractorDropdown(val);
    $('contractorDropdownList')?.classList.remove('hidden');
  }

  function selectContractorFromList(name: string): void {
    const search = $<HTMLInputElement>('contractorSearchInput');
    const sel = $<HTMLInputElement>('selectedContractorValue');
    if (search) search.value = name;
    if (sel) sel.value = name;
    $('contractorDropdownList')?.classList.add('hidden');
  }

  function showWelcomeSplash(displayName: string, subtitle: string, callback: () => void): void {
    const splash = $('welcomeSplash');
    const nameEl = $('welcomeSplashName');
    const subEl = $('welcomeSplashSub');
    const barEl = $('welcomeProgressBar');
    if (!splash || !nameEl || !subEl || !barEl) {
      callback();
      return;
    }

    nameEl.textContent = `مرحباً، ${displayName}`;
    subEl.textContent = subtitle || 'جاري تجهيز لوحة العمل الخاصة بك...';
    barEl.classList.remove('animate-welcome-bar');
    void barEl.offsetWidth;
    barEl.classList.add('animate-welcome-bar');

    splash.classList.remove('hidden');
    refreshLucideIcons();

    setTimeout(() => {
      splash.classList.add('hidden');
      if (!destroyed) callback();
    }, 3000);
  }

  function openResetPasswordModal(isLoggedIn = false): void {
    const userInp = $<HTMLInputElement>('rp_username');
    const curInp = $<HTMLInputElement>('rp_currentPass');
    const newInp = $<HTMLInputElement>('rp_newPass');
    const confInp = $<HTMLInputElement>('rp_confirmPass');
    if (!userInp || !curInp || !newInp || !confInp) return;

    curInp.value = '';
    newInp.value = '';
    confInp.value = '';
    $('rp_error')?.classList.add('hidden');

    if (isLoggedIn && currentSession && currentSession.type === 'staff') {
      userInp.value = currentSession.username || '';
      userInp.readOnly = true;
      userInp.classList.add('bg-slate-100', 'text-slate-500');
    } else {
      userInp.value = $<HTMLInputElement>('staffUsernameInput')?.value.trim() || '';
      userInp.readOnly = false;
      userInp.classList.remove('bg-slate-100', 'text-slate-500');
    }
    $('resetPassModal')?.classList.remove('hidden');
    refreshLucideIcons();
  }

  async function handleResetPassword(e: Event): Promise<void> {
    e.preventDefault();
    const username = ($<HTMLInputElement>('rp_username')?.value || '').trim().toLowerCase();
    const currentPass = ($<HTMLInputElement>('rp_currentPass')?.value || '').trim();
    const newPass = ($<HTMLInputElement>('rp_newPass')?.value || '').trim();
    const confirmPass = ($<HTMLInputElement>('rp_confirmPass')?.value || '').trim();
    const errEl = $('rp_error');

    const showErr = (msg: string) => {
      if (errEl) {
        errEl.textContent = msg;
        errEl.classList.remove('hidden');
      }
    };

    const staff = appState.staffUsers.find((u) => u.username.toLowerCase() === username);
    if (!staff) {
      showErr('الرقم الوظيفي غير مسجّل في قاعدة البيانات.');
      return;
    }
    const valid = await verifyPassword(currentPass, staff.passwordHash);
    if (!valid) {
      showErr('كلمة المرور الحالية غير صحيحة.');
      return;
    }
    if (newPass.length < 4) {
      showErr('يجب أن تكون كلمة المرور الجديدة 4 خانات على الأقل.');
      return;
    }
    if (newPass !== confirmPass) {
      showErr('تأكيد كلمة المرور الجديدة غير متطابق.');
      return;
    }

    try {
      const newHash = await hashPassword(newPass);
      await fsUpdateStaffPassword(staff.username, newHash);
      staff.passwordHash = newHash;
      logAudit('إعادة تعيين كلمة المرور', `تم تحديث كلمة المرور للموظف: ${staff.name} (${staff.username})`);
      closeModal('resetPassModal');
      showToast('تم تحديث كلمة المرور وحفظها في قاعدة بيانات Firestore بنجاح', 'success');
    } catch {
      showErr('تعذر تحديث كلمة المرور في قاعدة البيانات، يرجى المحاولة مجدداً.');
    }
  }

  function handleContractorLogin(e: Event): void {
    e.preventDefault();
    const name = (
      $<HTMLInputElement>('selectedContractorValue')?.value ||
      $<HTMLInputElement>('contractorSearchInput')?.value ||
      ''
    ).trim();
    const pin = ($<HTMLInputElement>('contractorPinInput')?.value || '').trim();

    const found = appState.contractors.find((c) => c.name === name);
    if (!found) {
      showLoginError('يرجى اختيار اسم مقاول صحيح من القائمة المنسدلة.');
      return;
    }
    if (!found.active) {
      showLoginError('تم إيقاف حساب هذا المقاول مؤقتاً، يرجى مراجعة القسم.');
      return;
    }
    if (found.pin !== pin) {
      showLoginError('الرقم السري (PIN) غير صحيح.');
      return;
    }

    currentSession = { type: 'contractor', name: found.name, role: 'contractor' };
    logAudit('تسجيل دخول', `دخول المقاول: ${found.name}`);
    showWelcomeSplash(found.name, 'جاري فتح بوابة المقاول الخاصة بك...', () => {
      enterContractorPortal();
    });
  }

  async function handleStaffLogin(e: Event): Promise<void> {
    e.preventDefault();
    const user = ($<HTMLInputElement>('staffUsernameInput')?.value || '').trim().toLowerCase();
    const pass = ($<HTMLInputElement>('staffPasswordInput')?.value || '').trim();

    const found = appState.staffUsers.find((u) => u.username.toLowerCase() === user);
    if (!found) {
      showLoginError('الرقم الوظيفي أو كلمة المرور غير صحيحة.');
      return;
    }
    const ok = await verifyPassword(pass, found.passwordHash);
    if (!ok) {
      showLoginError('الرقم الوظيفي أو كلمة المرور غير صحيحة.');
      return;
    }

    currentSession = {
      type: 'staff',
      name: found.name,
      username: found.username,
      role: found.role,
    };
    logAudit('تسجيل دخول', `دخول موظف الشركة: ${found.name} (${found.username})`);
    showWelcomeSplash(found.name, `الرقم الوظيفي: ${found.username} — جاري فتح لوحة التحكم...`, () => {
      enterStaffPortal();
    });
  }

  function logout(): void {
    if (currentSession) {
      logAudit('تسجيل خروج', `خروج: ${currentSession.name}`);
    }
    currentSession = null;
    selectedInvoiceIds.clear();
    dashCtrl.resetActiveKpi();
    $('contractorView')?.classList.add('hidden');
    $('staffView')?.classList.add('hidden');
    $('loginView')?.classList.remove('hidden');
    const cPin = $<HTMLInputElement>('contractorPinInput');
    const sPass = $<HTMLInputElement>('staffPasswordInput');
    if (cPin) cPin.value = '';
    if (sPass) sPass.value = '';
    $('loginErrorBox')?.classList.add('hidden');
    refreshLucideIcons();
  }

  // ==================== CONTRACTOR PORTAL ====================
  function enterContractorPortal(): void {
    if (!currentSession) return;
    $('loginView')?.classList.add('hidden');
    $('staffView')?.classList.add('hidden');
    $('contractorView')?.classList.remove('hidden');

    const hdr = $('contractorHeaderName');
    if (hdr) hdr.textContent = `مرحباً، ${currentSession.name}`;
    updateOneDriveBadges();
    resetContractorForm();
    switchContractorTab('list');
    renderContractorKPIs();
    renderContractorTable();
    enableDragScroll($('contractorTableScrollWrap'));
    refreshLucideIcons();
  }

  function switchContractorTab(tab: 'list' | 'form'): void {
    const listPanel = $('contractorListPanel');
    const formPanel = $('contractorFormPanel');
    const listBtn = $('cTabListBtn');
    const formBtn = $('cTabFormBtn');
    if (!listPanel || !formPanel || !listBtn || !formBtn) return;

    if (tab === 'list') {
      listPanel.classList.remove('hidden');
      formPanel.classList.add('hidden');
      listBtn.className =
        'px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-navy-900 text-white transition';
      formBtn.className =
        'px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 text-slate-600 hover:bg-slate-100 transition';
    } else {
      formPanel.classList.remove('hidden');
      listPanel.classList.add('hidden');
      formBtn.className =
        'px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-accent-500 text-white transition';
      listBtn.className =
        'px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 text-slate-600 hover:bg-slate-100 transition';
    }
    refreshLucideIcons();
  }

  function renderContractorKPIs(): void {
    if (!currentSession) return;
    const mine = appState.invoices.filter((i) => i.contractor === currentSession!.name);
    const total = mine.length;
    const approved = mine.filter((i) => i.status === 'معتمد').length;
    const pending = mine.filter((i) => i.status === 'قيد المراجعة').length;
    const flagged = mine.filter((i) => i.status === 'مرفوض' || i.status === 'ملاحظات معلقة').length;
    const rate = total ? Math.round((approved / total) * 100) : 0;

    const cards = [
      { label: 'إجمالي فواتيري', val: total, icon: 'file-text', cls: 'bg-navy-50 text-navy-900' },
      { label: 'المعتمدة', val: approved, icon: 'check-circle-2', cls: 'bg-emerald-50 text-emerald-700' },
      { label: 'قيد المراجعة', val: pending, icon: 'clock', cls: 'bg-sky-50 text-sky-700' },
      { label: 'مرفوضة / ملاحظات', val: flagged, icon: 'alert-circle', cls: 'bg-rose-50 text-rose-700' },
      { label: 'نسبة الاعتماد', val: rate + '%', icon: 'trending-up', cls: 'bg-accent-50 text-accent-600' },
    ];

    const grid = $('contractorKpiGrid');
    if (grid) {
      grid.innerHTML = cards
        .map(
          (c) => `
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-bold text-slate-500">${c.label}</p>
            <p class="text-2xl font-black text-navy-900 mt-1">${c.val}</p>
          </div>
          <div class="w-10 h-10 rounded-xl ${c.cls} flex items-center justify-center shrink-0">
            <i data-lucide="${c.icon}" class="w-5 h-5"></i>
          </div>
        </div>
      `
        )
        .join('');
    }
    refreshLucideIcons();
  }

  function renderContractorTable(): void {
    if (!currentSession) return;
    const q = ($<HTMLInputElement>('contractorTableSearch')?.value || '').trim().toLowerCase();
    const st = $<HTMLSelectElement>('contractorStatusFilter')?.value || '';

    const list = appState.invoices.filter((inv) => {
      if (inv.contractor !== currentSession!.name) return false;
      if (st && inv.status !== st) return false;
      if (q && !`${inv.wo} ${inv.funcLoc} ${inv.workDesc} ${inv.office} ${inv.note}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });

    const tbody = $('contractorTableBody');
    if (!tbody) return;
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="12" class="py-10 text-center text-slate-400 font-bold">لا توجد فواتير مطابقة حالياً. يمكنك رفع فاتورة جديدة من الزر أعلاه.</td></tr>`;
      return;
    }

    tbody.innerHTML = list
      .map((inv) => {
        const photos = inv.photos || [];
        const canResubmit =
          inv.status === 'مرفوض' || inv.status === 'ملاحظات معلقة' || inv.status === 'قيد المراجعة';
        return `
          <tr class="hover:bg-slate-50/80 transition">
            <td class="py-3 px-3 font-mono font-extrabold text-navy-900 whitespace-nowrap" dir="ltr">${escapeHtml(inv.wo)}</td>
            <td class="py-3 px-3 text-xs font-semibold whitespace-nowrap">${escapeHtml(inv.consultant)}</td>
            <td class="py-3 px-3 text-xs font-mono text-slate-600 whitespace-nowrap" dir="ltr">${escapeHtml(inv.invoiceDate || '-')}</td>
            <td class="py-3 px-3 whitespace-nowrap"><span class="px-2 py-0.5 rounded-lg bg-navy-50 text-navy-800 text-xs font-bold">${escapeHtml(inv.workType)}</span></td>
            <td class="py-3 px-3 text-xs font-bold text-navy-900">${escapeHtml(inv.workDesc)}</td>
            <td class="py-3 px-3 text-xs font-bold text-navy-800 whitespace-nowrap">${escapeHtml(inv.equipType)}</td>
            <td class="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap" dir="ltr">${escapeHtml(inv.funcLoc || '-')}</td>
            <td class="py-3 px-3 text-xs font-semibold whitespace-nowrap">${escapeHtml(inv.office)}</td>
            <td class="py-3 px-3 text-xs font-mono text-slate-600 whitespace-nowrap" dir="ltr">${escapeHtml(inv.deliveryDate || '-')}</td>
            <td class="py-3 px-3 whitespace-nowrap">
              ${
                photos.length
                  ? `
                <button onclick="openInvoicePhotosLightbox('${escapeHtml(inv.id)}')" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold">
                  <i data-lucide="image" class="w-3.5 h-3.5"></i>
                  <span>${photos.length} صورة</span>
                </button>
              `
                  : '<span class="text-xs text-slate-400">بدون صور</span>'
              }
            </td>
            <td class="py-3 px-3">
              <div>${statusBadgeHtml(inv.status)}</div>
              ${inv.note ? `<div class="text-[11px] text-slate-600 mt-1 max-w-[180px]">${escapeHtml(inv.note)}</div>` : ''}
            </td>
            <td class="py-3 px-3 text-center whitespace-nowrap">
              ${
                canResubmit
                  ? `
                <button onclick="editContractorInvoice('${escapeHtml(inv.id)}')" class="px-3 py-1.5 rounded-lg bg-accent-50 hover:bg-accent-500 text-accent-700 hover:text-white text-xs font-bold transition">
                  ${inv.status === 'مرفوض' || inv.status === 'ملاحظات معلقة' ? 'تعديل وإعادة إرسال' : 'تعديل'}
                </button>
              `
                  : '<span class="text-xs text-emerald-600 font-bold">مكتملة</span>'
              }
            </td>
          </tr>
        `;
      })
      .join('');
    refreshLucideIcons();
  }

  function openInvoicePhotosLightbox(invId: string): void {
    const inv = appState.invoices.find((i) => i.id === invId);
    if (!inv || !inv.photos || !inv.photos.length) return;
    const p = inv.photos[0];
    openLightbox(p.dataUrl, `أمر عمل ${inv.wo} — ${p.stage || 'صورة مرفقة'}`, p.oneDrivePath);
  }

  function editContractorInvoice(id: string): void {
    if (!currentSession) return;
    const inv = appState.invoices.find((i) => i.id === id && i.contractor === currentSession!.name);
    if (!inv) return;

    const setVal = (elId: string, val: string) => {
      const el = $<HTMLInputElement | HTMLSelectElement>(elId);
      if (el) el.value = val;
    };

    setVal('cEditId', inv.id);
    const heading = $('cFormHeading');
    if (heading) heading.textContent = `تعديل وإعادة إرسال أمر العمل: ${inv.wo}`;
    const tabLbl = $('cTabFormLabel');
    if (tabLbl) tabLbl.textContent = 'تعديل الفاتورة';

    setVal('cf_wo', inv.wo);
    setVal('cf_contractor', inv.contractor);
    setVal('cf_consultant', inv.consultant);
    setVal('cf_invoiceDate', inv.invoiceDate || todayISO());
    setVal('cf_workType', inv.workType);
    setVal('cf_workDesc', inv.workDesc);
    setVal('cf_equipType', inv.equipType);
    setVal('cf_funcLoc', inv.funcLoc || '');
    setVal('cf_office', inv.office);
    setVal('cf_deliveryDate', inv.deliveryDate || todayISO());
    setVal('cf_contractorNote', inv.note || '');

    const ck = (inv.checklist || {}) as Record<string, boolean | undefined>;
    document.querySelectorAll<HTMLInputElement>('.cf-check').forEach((cb) => {
      const key = cb.dataset.key || '';
      cb.checked = !!ck[key];
    });
    updateChecklistProgress();

    pendingPhotos = Array.isArray(inv.photos) ? [...inv.photos] : [];
    renderPendingPhotos();
    switchContractorTab('form');
  }

  function resetContractorForm(): void {
    $<HTMLFormElement>('contractorInvoiceForm')?.reset();
    const editEl = $<HTMLInputElement>('cEditId');
    if (editEl) editEl.value = '';
    const heading = $('cFormHeading');
    if (heading) heading.textContent = 'تقديم فاتورة صيانة / طوارئ جديدة';
    const tabLbl = $('cTabFormLabel');
    if (tabLbl) tabLbl.textContent = 'رفع فاتورة جديدة';
    if (currentSession) {
      const cEl = $<HTMLInputElement>('cf_contractor');
      if (cEl) cEl.value = currentSession.name;
    }
    const invDate = $<HTMLInputElement>('cf_invoiceDate');
    const delDate = $<HTMLInputElement>('cf_deliveryDate');
    if (invDate) invDate.value = todayISO();
    if (delDate) delDate.value = todayISO();
    $('duplicateWoAlert')?.classList.add('hidden');
    pendingPhotos = [];
    renderPendingPhotos();
    updateChecklistProgress();
  }

  function checkDuplicateWo(woVal: string): void {
    const clean = woVal.trim();
    const editId = $<HTMLInputElement>('cEditId')?.value || '';
    const alertBox = $('duplicateWoAlert');
    const alertText = $('duplicateWoText');
    if (!alertBox || !alertText) return;
    if (!clean) {
      alertBox.classList.add('hidden');
      return;
    }
    const dup = appState.invoices.find((i) => i.wo === clean && i.id !== editId);
    if (dup) {
      alertText.textContent = `تنبيه تكرار: رقم أمر العمل (${clean}) مسجّل مسبقاً لدى (${dup.contractor}) بحالة "${dup.status}". يرجى التأكد قبل الرفع.`;
      alertBox.classList.remove('hidden');
    } else {
      alertBox.classList.add('hidden');
    }
  }

  function updateChecklistProgress(): void {
    const boxes = Array.from(document.querySelectorAll<HTMLInputElement>('.cf-check'));
    const checked = boxes.filter((b) => b.checked).length;
    const pct = boxes.length ? Math.round((checked / boxes.length) * 100) : 0;
    const bar = $('checklistProgressBar');
    if (bar) bar.style.width = pct + '%';
    const badge = $('checklistScoreBadge');
    if (badge) {
      badge.textContent = `جاهزية: ${pct}%`;
      badge.className =
        pct === 100
          ? 'text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800'
          : 'text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-800';
    }
  }

  function compressImageFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 600;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx2d = canvas.getContext('2d');
          if (!ctx2d) {
            reject(new Error('Canvas unavailable'));
            return;
          }
          ctx2d.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.62));
        };
        img.onerror = reject;
        img.src = String(ev.target?.result || '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handlePhotoSelection(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length || !currentSession) return;

    const stage = $<HTMLSelectElement>('photoStageSelect')?.value || 'قبل التنفيذ';
    const wo = ($<HTMLInputElement>('cf_wo')?.value || '').trim() || 'NEW_WO';
    const remainingSlots = Math.max(0, 8 - pendingPhotos.length);
    if (remainingSlots === 0) {
      showToast('الحد الأقصى للمرفقات لكل فاتورة هو 8 ملفات', 'warning');
      input.value = '';
      return;
    }

    const toProcess = files.slice(0, remainingSlots);
    let processed = 0;
    for (const file of toProcess) {
      try {
        let dataUrl = '';
        const isImage = file.type.startsWith('image/');
        if (isImage) {
          dataUrl = await compressImageFile(file);
        } else {
          dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(String(ev.target?.result || ''));
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }
        const safeName = `${Date.now()}_${file.name.replace(/[^\w.\-\u0600-\u06FF]/g, '_')}`;
        const oneDrivePath = `${appState.oneDrive.baseFolder}/${currentSession.name}/${wo}/${safeName}`;
        pendingPhotos.push({ name: safeName, stage, dataUrl, oneDrivePath, synced: false });
        processed++;
      } catch {
        showToast('تعذر معالجة أحد الملفات المختارة', 'error');
      }
    }
    input.value = '';
    renderPendingPhotos();
    if (processed) showToast(`تم تجهيز وإرفاق ${processed} ملف بنجاح`, 'success');
  }

  function renderPendingPhotos(): void {
    const grid = $('pendingPhotosGrid');
    if (!grid) return;
    if (!pendingPhotos.length) {
      grid.innerHTML = '';
      return;
    }
    grid.innerHTML = pendingPhotos
      .map((p, idx) => {
        const isImage = p.dataUrl.startsWith('data:image/');
        const ext = p.name.split('.').pop()?.toUpperCase() || 'FILE';
        return `
      <div class="relative group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        ${isImage
          ? `<img src="${p.dataUrl}" onclick="openPendingPhotoLightbox(${idx})" class="w-full h-28 object-cover cursor-pointer" />`
          : `<div onclick="openPendingPhotoLightbox(${idx})" class="w-full h-28 bg-slate-100 flex flex-col items-center justify-center p-2 cursor-pointer text-center">
               <span class="px-2.5 py-1 rounded-lg bg-accent-100 text-accent-700 font-black text-xs mb-1">${ext}</span>
               <span class="text-[10px] text-slate-600 truncate max-w-full px-1">${escapeHtml(p.name)}</span>
             </div>`
        }
        <div class="p-2 text-[11px]">
          <div class="font-bold text-navy-900 truncate">${escapeHtml(p.stage)}</div>
          <div class="text-[10px] ${p.synced ? 'text-emerald-600' : 'text-sky-600'} font-bold truncate">
            ${p.synced ? 'مرفوع على OneDrive ✓' : 'جاهز للمزامنة مع OneDrive'}
          </div>
        </div>
        <button type="button" onclick="removePendingPhoto(${idx})" class="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center shadow">✕</button>
      </div>
    `;
      })
      .join('');
  }

  function openPendingPhotoLightbox(idx: number): void {
    const p = pendingPhotos[idx];
    if (!p) return;
    openLightbox(p.dataUrl, p.stage, p.oneDrivePath, p.name);
  }

  function removePendingPhoto(idx: number): void {
    pendingPhotos.splice(idx, 1);
    renderPendingPhotos();
  }

  async function submitContractorInvoice(e: Event): Promise<void> {
    e.preventDefault();
    if (!currentSession) return;
    const editId = $<HTMLInputElement>('cEditId')?.value || '';
    const wo = ($<HTMLInputElement>('cf_wo')?.value || '').trim();

    const checklist: InvoiceChecklist = {};
    document.querySelectorAll<HTMLInputElement>('.cf-check').forEach((cb) => {
      const k = cb.dataset.key as keyof InvoiceChecklist | undefined;
      if (k) checklist[k] = cb.checked;
    });

    if (appState.oneDrive.accessToken && pendingPhotos.length) {
      for (const p of pendingPhotos) {
        if (!p.synced) {
          p.oneDrivePath = `${appState.oneDrive.baseFolder}/${currentSession.name}/${wo}/${p.name}`;
          const uploaded = await uploadSinglePhotoToOneDrive(p);
          if (uploaded) p.synced = true;
        }
      }
    } else {
      pendingPhotos.forEach((p) => {
        p.oneDrivePath = `${appState.oneDrive.baseFolder}/${currentSession!.name}/${wo}/${p.name}`;
      });
    }

    const existing = editId ? appState.invoices.find((i) => i.id === editId) : null;
    const record: InvoiceRecord = {
      id: existing ? existing.id : `inv_${Date.now()}`,
      seq: existing ? existing.seq : appState.invoices.length + 1,
      wo,
      contractor: currentSession.name,
      consultant: $<HTMLSelectElement>('cf_consultant')?.value || CONSULTANTS[0],
      invoiceDate: $<HTMLInputElement>('cf_invoiceDate')?.value || todayISO(),
      workType: $<HTMLSelectElement>('cf_workType')?.value || WORK_TYPES[0],
      workDesc: ($<HTMLInputElement>('cf_workDesc')?.value || '').trim(),
      equipType: $<HTMLSelectElement>('cf_equipType')?.value || EQUIP_TYPES[0],
      funcLoc: ($<HTMLInputElement>('cf_funcLoc')?.value || '').trim(),
      office: $<HTMLSelectElement>('cf_office')?.value || OFFICES[0],
      deliveryDate: editId ? $<HTMLInputElement>('cf_deliveryDate')?.value || todayISO() : todayISO(),
      note: ($<HTMLInputElement>('cf_contractorNote')?.value || '').trim() || 'قيد المراجعة',
      status: 'قيد المراجعة',
      quality: 'جيد جداً',
      checklist,
      photos: [...pendingPhotos],
      updatedAt: new Date().toISOString(),
    };

    try {
      await fsSaveInvoice(record);
      if (editId) {
        logAudit('تعديل فاتورة مقاول', `أمر العمل ${wo} — إعادة إرسال للمراجعة`);
        showToast('تم تحديث وإعادة إرسال الفاتورة وحفظها في Firestore بنجاح', 'success');
      } else {
        logAudit('رفع فاتورة جديدة', `أمر العمل ${wo} (${record.workType}) مع ${pendingPhotos.length} صور`);
        showToast('تم رفع الفاتورة وحفظها في Firestore بنجاح', 'success');
      }
      resetContractorForm();
      switchContractorTab('list');
    } catch {
      showToast('تعذر حفظ الفاتورة في قاعدة البيانات', 'error');
    }
  }

  // ==================== STAFF PORTAL & RBAC ====================
  function applyStaffRoleVisibility(): void {
    if (!currentSession || currentSession.type !== 'staff') return;
    const roleNames: Record<string, string> = {
      admin: 'مدير النظام (صلاحيات كاملة)',
      reviewer: 'موظف الشركة (مراجعة واعتماد وتقارير)',
      viewer: 'مراقب (عرض وتقارير فقط)',
    };
    const nameLbl = $('staffNameLabel');
    const roleLbl = $('staffRoleLabel');
    const avatar = $('staffAvatarChar');
    const topWelcomeEl = $('staffTopWelcome');

    if (nameLbl) nameLbl.textContent = `مرحباً، ${currentSession.name}`;
    if (roleLbl) roleLbl.textContent = roleNames[currentSession.role] || currentSession.role;
    if (avatar) avatar.textContent = currentSession.name.charAt(0);
    if (topWelcomeEl) {
      topWelcomeEl.textContent = `مرحباً، ${currentSession.name} (${currentSession.username})`;
    }

    const isViewer = currentSession.role === 'viewer';
    const isAdmin = currentSession.username === '100889' || currentSession.role === 'admin';
    $('staffAddInvBtn')?.classList.toggle('hidden', isViewer);
    document.querySelector('[data-sec="users"]')?.classList.toggle('hidden', !isAdmin);

    if (!isAdmin && currentStaffSection === 'users') {
      switchStaffSection('dashboard');
    }
  }

  function enterStaffPortal(): void {
    if (!currentSession) return;
    $('loginView')?.classList.add('hidden');
    $('contractorView')?.classList.add('hidden');
    $('staffView')?.classList.remove('hidden');

    applyStaffRoleVisibility();
    updateOneDriveBadges();
    switchStaffSection('dashboard');
    enableDragScroll($('staffTableScrollWrap'));
    enableDragScroll($('dashDrilldownScrollWrap'));
    refreshLucideIcons();
  }

  function toggleMobileSidebar(show: boolean): void {
    const sb = $('staffSidebar');
    const ov = $('sidebarOverlay');
    if (!sb || !ov) return;
    if (show) {
      sb.classList.remove('translate-x-full');
      ov.classList.remove('hidden');
    } else {
      sb.classList.add('translate-x-full');
      ov.classList.add('hidden');
    }
  }

  function switchStaffSection(sec: string): void {
    currentStaffSection = sec;
    const titles: Record<string, string> = {
      dashboard: 'لوحة التحكم التنفيذية (Dashboard)',
      invoices: 'سجل ومراجعة فواتير الصيانة والطوارئ',
      reports: 'مركز التقارير والتصدير الشامل',
      users: 'إدارة الصلاحيات والمستخدمين وسجل التدقيق',
      onedrive: 'الربط السحابي مع Microsoft OneDrive',
    };
    const titleEl = $('staffSectionTitle');
    if (titleEl) titleEl.textContent = titles[sec] || '';
    ['dashboard', 'invoices', 'reports', 'users', 'onedrive'].forEach((s) => {
      $('sec_' + s)?.classList.toggle('hidden', s !== sec);
    });
    document.querySelectorAll<HTMLElement>('.staff-nav-btn').forEach((btn) => {
      const active = btn.dataset.sec === sec;
      btn.className = active
        ? 'staff-nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition bg-accent-500 text-white shadow'
        : 'staff-nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition text-slate-300 hover:bg-white/10 hover:text-white';
    });
    toggleMobileSidebar(false);

    if (sec === 'dashboard') dashCtrl.renderDashboard();
    if (sec === 'invoices') {
      refreshDynamicMonthSelect();
      renderStaffInvoicesTable();
    }
    if (sec === 'reports') dashCtrl.renderReportsModule();
    if (sec === 'users') renderUsersManagement();
    if (sec === 'onedrive') renderOneDriveModule();
    refreshLucideIcons();
  }

  // ==================== INVOICES MANAGEMENT ====================
  function getFilteredStaffInvoices(): InvoiceRecord[] {
    const q = ($<HTMLInputElement>('invSearch')?.value || '').trim().toLowerCase();
    const monthFilter = $<HTMLSelectElement>('invFilterMonth')?.value || '';
    const c = $<HTMLSelectElement>('invFilterContractor')?.value || '';
    const o = $<HTMLSelectElement>('invFilterOffice')?.value || '';
    const wt = $<HTMLSelectElement>('invFilterWorkType')?.value || '';
    const st = $<HTMLSelectElement>('invFilterStatus')?.value || '';
    const slaFilter = $<HTMLSelectElement>('invFilterSla')?.value || '';

    return appState.invoices.filter((inv) => {
      if (monthFilter) {
        const invYm = (inv.invoiceDate || inv.deliveryDate || '').trim().slice(0, 7);
        if (invYm !== monthFilter) return false;
      }
      if (c && inv.contractor !== c) return false;
      if (o && inv.office !== o) return false;
      if (wt && inv.workType !== wt) return false;
      if (st && inv.status !== st) return false;
      if (slaFilter && getInvoiceSlaInfo(inv).category !== slaFilter) return false;
      if (q && !`${inv.wo} ${inv.contractor} ${inv.funcLoc} ${inv.workDesc} ${inv.note}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }

  function exportFilteredStaffInvoicesExcel(): void {
    const filtered = getFilteredStaffInvoices();
    const parts: string[] = [];
    const q = ($<HTMLInputElement>('invSearch')?.value || '').trim();
    const monthFilter = $<HTMLSelectElement>('invFilterMonth')?.value || '';
    const c = $<HTMLSelectElement>('invFilterContractor')?.value || '';
    const o = $<HTMLSelectElement>('invFilterOffice')?.value || '';
    const wt = $<HTMLSelectElement>('invFilterWorkType')?.value || '';
    const st = $<HTMLSelectElement>('invFilterStatus')?.value || '';
    const slaFilter = $<HTMLSelectElement>('invFilterSla')?.value || '';

    if (monthFilter) parts.push(`الشهر: ${formatArabicYearMonth(monthFilter)}`);
    if (c) parts.push(`المقاول: ${c}`);
    if (o) parts.push(`المكتب: ${o}`);
    if (wt) parts.push(`النوع: ${wt}`);
    if (st) parts.push(`الحالة: ${st}`);
    if (slaFilter) parts.push(`التصنيف: ${slaFilter}`);
    if (q) parts.push(`بحث: ${q}`);

    const summary = parts.length ? parts.join(' | ') : 'جميع البيانات بدون تصفية';
    const fileSuffix = monthFilter ? `_${monthFilter}` : parts.length ? '_مفلتر' : '';
    dashCtrl.exportFilteredTableExcel(filtered, summary, fileSuffix);
  }

  function renderStaffInvoicesTable(): void {
    const list = getFilteredStaffInvoices();
    const countEl = $('staffTableCount');
    if (countEl) countEl.textContent = String(list.length);
    const bannerCountEl = $('staffTableBannerCount');
    if (bannerCountEl) bannerCountEl.textContent = String(list.length);
    const isViewer = currentSession?.role === 'viewer';
    const tbody = $('staffInvoicesBody');
    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="16" class="py-10 text-center text-slate-400 font-bold">لا توجد فواتير مطابقة لخيارات البحث</td></tr>`;
      updateBulkBar();
      return;
    }

    tbody.innerHTML = list
      .map((inv) => {
        const photosCount = (inv.photos && inv.photos.length) || 0;
        const checked = selectedInvoiceIds.has(inv.id) ? 'checked' : '';
        const sla = getInvoiceSlaInfo(inv);
        return `
          <tr class="hover:bg-slate-50 transition">
            <td class="py-3 px-2.5"><input type="checkbox" ${checked} onchange="toggleSingleInvSelect('${escapeHtml(inv.id)}', this.checked)" class="w-4 h-4 accent-accent-500 rounded" /></td>
            <td class="py-3 px-2.5 font-mono font-extrabold text-navy-900 whitespace-nowrap" dir="ltr">${escapeHtml(inv.wo)}</td>
            <td class="py-3 px-2.5 font-bold text-navy-900 whitespace-nowrap">${escapeHtml(inv.contractor)}</td>
            <td class="py-3 px-2.5 text-slate-600 whitespace-nowrap">${escapeHtml(inv.consultant)}</td>
            <td class="py-3 px-2.5 font-mono text-xs text-slate-600 whitespace-nowrap" dir="ltr">${escapeHtml(inv.invoiceDate || '-')}</td>
            <td class="py-3 px-2.5 whitespace-nowrap">
              <span class="px-2 py-0.5 rounded-md bg-navy-50 text-navy-800 text-[11px] font-bold">${escapeHtml(inv.workType)}</span>
            </td>
            <td class="py-3 px-2.5 text-xs font-semibold text-slate-700 min-w-[140px]">${escapeHtml(inv.workDesc)}</td>
            <td class="py-3 px-2.5 font-bold text-xs text-navy-800 whitespace-nowrap">${escapeHtml(inv.equipType)}</td>
            <td class="py-3 px-2.5 font-mono text-[11px] text-slate-600 whitespace-nowrap" dir="ltr">${escapeHtml(inv.funcLoc || '-')}</td>
            <td class="py-3 px-2.5 font-semibold whitespace-nowrap">${escapeHtml(inv.office)}</td>
            <td class="py-3 px-2.5 font-mono text-xs text-slate-600 whitespace-nowrap" dir="ltr">${escapeHtml(inv.deliveryDate || '-')}</td>
            <td class="py-3 px-2.5 text-xs font-extrabold whitespace-nowrap ${sla.reviewed ? 'text-slate-400' : 'text-navy-900'}">${escapeHtml(sla.daysText)}</td>
            <td class="py-3 px-2.5 whitespace-nowrap">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${sla.badgeClass}">${escapeHtml(sla.category)}</span>
            </td>
            <td class="py-3 px-2.5 whitespace-nowrap">
              ${photosCount ? `<button onclick="openReviewModal('${escapeHtml(inv.id)}')" class="px-2 py-1 rounded-lg bg-sky-50 text-sky-700 text-[11px] font-bold">${photosCount} صور</button>` : '<span class="text-slate-400 text-[11px]">—</span>'}
            </td>
            <td class="py-3 px-2.5 min-w-[140px]">
              <div>${statusBadgeHtml(inv.status)}</div>
              ${
                inv.status === 'مرفوض'
                  ? `<div class="mt-1 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700 leading-snug" title="${escapeHtml(inv.note || 'غير محدد')}">سبب الرفض: ${escapeHtml(inv.note || 'غير محدد')}</div>`
                  : inv.status === 'ملاحظات معلقة' && inv.note
                  ? `<div class="mt-1 text-[11px] font-semibold text-amber-700 max-w-[160px] truncate" title="${escapeHtml(inv.note)}">${escapeHtml(inv.note)}</div>`
                  : ''
              }
            </td>
            <td class="py-3 px-2.5 whitespace-nowrap">
              <div class="flex items-center justify-center gap-1">
                <button onclick="openReviewModal('${escapeHtml(inv.id)}')" title="مراجعة واعتماد" class="px-2.5 py-1.5 rounded-lg bg-navy-900 hover:bg-accent-500 text-white text-[11px] font-bold transition">مراجعة</button>
                ${
                  !isViewer
                    ? `
                  <button onclick="openStaffInvoiceModal('${escapeHtml(inv.id)}')" title="تعديل" class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-navy-900"><i data-lucide="edit-3" class="w-3.5 h-3.5"></i></button>
                  <button onclick="deleteInvoice('${escapeHtml(inv.id)}')" title="حذف" class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white transition"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                `
                    : ''
                }
              </div>
            </td>
          </tr>
        `;
      })
      .join('');
    updateBulkBar();
    refreshLucideIcons();
  }

  function toggleSingleInvSelect(id: string, isChecked: boolean): void {
    if (isChecked) selectedInvoiceIds.add(id);
    else selectedInvoiceIds.delete(id);
    updateBulkBar();
  }

  function toggleSelectAllInv(isChecked: boolean): void {
    const visible = getFilteredStaffInvoices();
    visible.forEach((i) => (isChecked ? selectedInvoiceIds.add(i.id) : selectedInvoiceIds.delete(i.id)));
    renderStaffInvoicesTable();
  }

  function updateBulkBar(): void {
    const btn = $('bulkApproveBtn');
    const span = $('selectedCountSpan');
    const count = selectedInvoiceIds.size;
    if (span) span.textContent = String(count);
    if (btn) btn.classList.toggle('hidden', count === 0 || currentSession?.role === 'viewer');
  }

  function bulkApproveSelected(): void {
    const count = selectedInvoiceIds.size;
    if (!count) return;
    openConfirmModal({
      title: 'اعتماد جماعي للفواتير',
      message: `هل تريد اعتماد عدد (${count}) فاتورة محددة دفعة واحدة وتغيير ملاحظتها إلى "تم"؟`,
      onConfirm: async () => {
        const ids = Array.from(selectedInvoiceIds);
        try {
          await fsBulkApproveInvoices(ids);
          selectedInvoiceIds.clear();
          const selAll = $<HTMLInputElement>('selectAllInv');
          if (selAll) selAll.checked = false;
          logAudit('اعتماد جماعي', `تم اعتماد ${count} فاتورة دفعة واحدة`);
          showToast(`تم اعتماد ${count} فاتورة وحفظها في Firestore بنجاح`, 'success');
        } catch {
          showToast('تعذر تنفيذ الاعتماد الجماعي في قاعدة البيانات', 'error');
        }
      },
    });
  }

  // Review Modal
  function openReviewModal(id: string): void {
    const inv = appState.invoices.find((i) => i.id === id);
    if (!inv) return;
    currentReviewId = id;
    const titleEl = $('rmTitle');
    if (titleEl) titleEl.textContent = `رقم أمر العمل: ${inv.wo}`;
    const sla = getInvoiceSlaInfo(inv);
    const fields: Array<[string, string]> = [
      ['رقم أمر العمل', inv.wo],
      ['المقاول', inv.contractor],
      ['الاستشاري', inv.consultant],
      ['تاريخ الفاتورة', inv.invoiceDate || '-'],
      ['نوع العمل', inv.workType],
      ['وصف العمل', inv.workDesc],
      ['نوع المعدة', inv.equipType],
      ['الموقع الوظيفي', inv.funcLoc || '-'],
      ['المكتب', inv.office],
      ['تاريخ التسليم للأصول', inv.deliveryDate || '-'],
      ['المدة بدون مراجعة (أيام عمل)', sla.daysText],
      ['التصنيف', sla.category],
      ['الحالة الحالية', inv.status],
      ['جودة التنفيذ', inv.quality || '-'],
    ];

    const detailsGrid = $('rmDetailsGrid');
    if (detailsGrid) {
      detailsGrid.innerHTML = fields
        .map(
          ([k, v]) => `
        <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div class="text-[11px] text-slate-500 font-semibold">${k}</div>
          <div class="text-xs font-extrabold text-navy-900 mt-0.5">${escapeHtml(v)}</div>
        </div>
      `
        )
        .join('');
    }

    const ck = (inv.checklist || {}) as Record<string, boolean | undefined>;
    const ckLabels: Array<[string, string]> = [
      ['gis', 'توقيع GIS'],
      ['sap', 'إنشاء المعدة على SAP'],
      ['pretest', 'اختبار ما قبل التشغيل'],
      ['photosMatch', 'مطابقة الصور'],
      ['warningTape', 'الشريط التحذيري'],
    ];
    const ckBox = $('rmChecklistBox');
    if (ckBox) {
      ckBox.innerHTML = `
        <div class="text-xs font-extrabold text-navy-900 mb-2">التزام المقاول بقائمة التحقق قبل الرفع:</div>
        <div class="flex flex-wrap gap-2">
          ${ckLabels
            .map(
              ([k, lbl]) => `
            <span class="px-2.5 py-1 rounded-full text-[11px] font-bold ${ck[k] ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}">
              ${ck[k] ? '✓' : '✕'} ${lbl}
            </span>
          `
            )
            .join('')}
        </div>
      `;
    }

    const photos = inv.photos || [];
    const photosGrid = $('rmPhotosGrid');
    if (photosGrid) {
      photosGrid.innerHTML = photos.length
        ? photos
            .map(
              (p, idx) => `
        <div class="rounded-xl border border-slate-200 overflow-hidden bg-white">
          <img src="${p.dataUrl}" onclick="openReviewPhotoLightbox('${escapeHtml(inv.id)}', ${idx})"
            class="w-full h-24 object-cover cursor-pointer hover:opacity-90 transition" />
          <div class="p-2 text-[10px]">
            <div class="font-bold text-navy-900 truncate">${escapeHtml(p.stage || 'مرفق')}</div>
            <div class="text-sky-700 truncate font-mono" dir="ltr" title="${escapeHtml(p.oneDrivePath)}">${p.synced ? 'OneDrive ✓' : 'أرشفة محلية'}</div>
          </div>
        </div>
      `
            )
            .join('')
        : '<div class="col-span-full p-4 rounded-xl bg-slate-50 text-xs text-slate-400 text-center">لم يرفق المقاول صوراً لهذا الأمر</div>';
    }

    const stSel = $<HTMLSelectElement>('rmStatusSelect');
    const qSel = $<HTMLSelectElement>('rmQualitySelect');
    const noteInp = $<HTMLTextAreaElement>('rmNoteInput');
    if (stSel) stSel.value = inv.status;
    if (qSel) qSel.value = inv.quality || 'جيد جداً';
    if (noteInp) noteInp.value = inv.note || '';

    const chips = $('quickNoteChips');
    if (chips) {
      chips.innerHTML = QUICK_REVIEW_NOTES.map(
        (n) =>
          `<button type="button" onclick="appendReviewNote('${escapeHtml(n)}')" class="px-2.5 py-1 rounded-full bg-white hover:bg-navy-900 hover:text-white border border-slate-300 text-[11px] font-bold transition">${escapeHtml(n)}</button>`
      ).join('');
    }

    const isViewer = currentSession?.role === 'viewer';
    $('rmSaveBtn')?.classList.toggle('hidden', isViewer);
    $('reviewModal')?.classList.remove('hidden');
    refreshLucideIcons();
  }

  function openReviewPhotoLightbox(invId: string, photoIdx: number): void {
    const inv = appState.invoices.find((i) => i.id === invId);
    const p = inv?.photos?.[photoIdx];
    if (!p) return;
    openLightbox(p.dataUrl, p.stage || 'مرفق', p.oneDrivePath);
  }

  function appendReviewNote(text: string): void {
    const ta = $<HTMLTextAreaElement>('rmNoteInput');
    if (!ta) return;
    ta.value =
      text === 'تم'
        ? 'تم'
        : ta.value && ta.value !== 'تم' && ta.value !== 'قيد المراجعة'
        ? `${ta.value} — ${text}`
        : text;
  }

  async function saveReviewDecision(): Promise<void> {
    if (!currentReviewId) return;
    const inv = appState.invoices.find((i) => i.id === currentReviewId);
    if (!inv) return;

    const status = ($<HTMLSelectElement>('rmStatusSelect')?.value || inv.status) as InvoiceRecord['status'];
    const quality = $<HTMLSelectElement>('rmQualitySelect')?.value || inv.quality || 'جيد جداً';
    const note = ($<HTMLTextAreaElement>('rmNoteInput')?.value || '').trim() || (status === 'معتمد' ? 'تم' : '');

    try {
      await fsUpdateInvoiceReview(inv.id, status, quality, note);
      logAudit('مراجعة فاتورة', `أمر العمل ${inv.wo} ⇐ ${status} (${note})`);
      closeModal('reviewModal');
      showToast('تم حفظ قرار المراجعة وتحديث السجل في Firestore', 'success');
    } catch {
      showToast('تعذر حفظ قرار المراجعة في قاعدة البيانات', 'error');
    }
  }

  function openStaffInvoiceModal(id: string | null = null): void {
    refreshDynamicContractorSelects();
    const inv = id ? appState.invoices.find((i) => i.id === id) : null;
    const setVal = (elId: string, val: string) => {
      const el = $<HTMLInputElement | HTMLSelectElement>(elId);
      if (el) el.value = val;
    };

    setVal('imId', inv ? inv.id : '');
    const heading = $('imHeading');
    if (heading) heading.textContent = inv ? `تعديل أمر العمل: ${inv.wo}` : 'إضافة فاتورة جديدة للسجل';
    setVal('im_wo', inv ? inv.wo : '');
    if (inv) setVal('im_contractor', inv.contractor);
    if (inv) setVal('im_consultant', inv.consultant);
    setVal('im_invoiceDate', inv ? inv.invoiceDate || '' : todayISO());
    if (inv) setVal('im_workType', inv.workType);
    setVal('im_workDesc', inv ? inv.workDesc : '');
    if (inv) setVal('im_equipType', inv.equipType);
    setVal('im_funcLoc', inv ? inv.funcLoc || '' : '');
    if (inv) setVal('im_office', inv.office);
    setVal('im_deliveryDate', inv ? inv.deliveryDate || '' : todayISO());
    setVal('im_status', inv ? inv.status : 'قيد المراجعة');
    setVal('im_note', inv ? inv.note || '' : '');
    $('invoiceModal')?.classList.remove('hidden');
  }

  async function saveStaffInvoice(e: Event): Promise<void> {
    e.preventDefault();
    const id = $<HTMLInputElement>('imId')?.value || '';
    const existing = id ? appState.invoices.find((i) => i.id === id) : null;
    const wo = ($<HTMLInputElement>('im_wo')?.value || '').trim();
    const contractor = $<HTMLSelectElement>('im_contractor')?.value || '';

    const record: InvoiceRecord = {
      id: existing ? existing.id : `inv_${Date.now()}`,
      seq: existing ? existing.seq : appState.invoices.length + 1,
      wo,
      contractor,
      consultant: $<HTMLSelectElement>('im_consultant')?.value || CONSULTANTS[0],
      invoiceDate: $<HTMLInputElement>('im_invoiceDate')?.value || '',
      workType: $<HTMLSelectElement>('im_workType')?.value || WORK_TYPES[0],
      workDesc: ($<HTMLInputElement>('im_workDesc')?.value || '').trim(),
      equipType: $<HTMLSelectElement>('im_equipType')?.value || EQUIP_TYPES[0],
      funcLoc: ($<HTMLInputElement>('im_funcLoc')?.value || '').trim(),
      office: $<HTMLSelectElement>('im_office')?.value || OFFICES[0],
      deliveryDate: $<HTMLInputElement>('im_deliveryDate')?.value || '',
      status: ($<HTMLSelectElement>('im_status')?.value || 'قيد المراجعة') as InvoiceRecord['status'],
      note: ($<HTMLInputElement>('im_note')?.value || '').trim(),
      quality: existing ? existing.quality : 'جيد جداً',
      checklist: existing ? existing.checklist : {},
      photos: existing ? existing.photos : [],
      updatedAt: new Date().toISOString(),
    };

    try {
      await fsSaveInvoice(record);
      if (existing) {
        logAudit('تعديل سجل', `تعديل أمر العمل ${wo}`);
        showToast('تم تحديث بيانات الفاتورة في Firestore', 'success');
      } else {
        logAudit('إضافة سجل', `إضافة أمر العمل ${wo} (${contractor})`);
        showToast('تمت إضافة الفاتورة وحفظها في Firestore بنجاح', 'success');
      }
      closeModal('invoiceModal');
    } catch {
      showToast('تعذر حفظ بيانات الفاتورة في قاعدة البيانات', 'error');
    }
  }

  function deleteInvoice(id: string): void {
    const inv = appState.invoices.find((i) => i.id === id);
    if (!inv) return;
    openConfirmModal({
      title: 'حذف الفاتورة',
      message: `هل أنت متأكد من حذف أمر العمل (${inv.wo}) الخاص بـ (${inv.contractor})؟ لا يمكن التراجع عن هذا الإجراء.`,
      onConfirm: async () => {
        try {
          await fsDeleteInvoice(id);
          selectedInvoiceIds.delete(id);
          logAudit('حذف فاتورة', `تم حذف أمر العمل ${inv.wo}`);
          showToast('تم حذف الفاتورة من السجل', 'info');
        } catch {
          showToast('تعذر حذف الفاتورة من قاعدة البيانات', 'error');
        }
      },
    });
  }

  // ==================== USERS, CONTRACTORS & AUDIT ====================
  function renderUsersManagement(): void {
    const q = ($<HTMLInputElement>('contractorAdminSearch')?.value || '').trim().toLowerCase();
    const filtered = appState.contractors.filter((c) => c.name.toLowerCase().includes(q));

    const cBody = $('contractorsAdminBody');
    if (cBody) {
      cBody.innerHTML = filtered
        .map(
          (c) => `
        <tr class="hover:bg-slate-50">
          <td class="py-2.5 px-4 font-bold text-navy-900">${escapeHtml(c.name)}</td>
          <td class="py-2.5 px-3 font-mono font-bold text-slate-600">${escapeHtml(c.pin)}</td>
          <td class="py-2.5 px-3">
            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${c.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}">${c.active ? 'نشط' : 'موقوف'}</span>
          </td>
          <td class="py-2.5 px-3 text-center whitespace-nowrap">
            <button onclick="changeContractorPin('${escapeHtml(c.id)}')" class="text-navy-900 hover:text-accent-600 font-bold ml-2">تعديل PIN</button>
            <button onclick="toggleContractorActive('${escapeHtml(c.id)}')" class="text-xs font-bold ${c.active ? 'text-rose-600' : 'text-emerald-600'} hover:underline">${c.active ? 'إيقاف' : 'تفعيل'}</button>
          </td>
        </tr>
      `
        )
        .join('');
    }

    const roleAr: Record<string, string> = { admin: 'مدير نظام', reviewer: 'موظف شركة', viewer: 'مراقب' };
    const sBody = $('staffUsersBody');
    if (sBody) {
      sBody.innerHTML = appState.staffUsers
        .map(
          (u) => `
        <tr class="hover:bg-slate-50">
          <td class="py-2.5 px-3 font-bold">${escapeHtml(u.name)}</td>
          <td class="py-2.5 px-3 font-mono" dir="ltr">${escapeHtml(u.username)}</td>
          <td class="py-2.5 px-3">
            ${
              u.username !== '100889'
                ? `
              <select onchange="changeStaffRole('${escapeHtml(u.username)}', this.value)" class="rounded-lg border border-slate-300 bg-white py-1 px-2 text-xs font-bold text-navy-900 outline-none focus:border-accent-500">
                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>مدير نظام (كامل)</option>
                <option value="reviewer" ${u.role === 'reviewer' ? 'selected' : ''}>موظف شركة (مراجعة واعتماد)</option>
                <option value="viewer" ${u.role === 'viewer' ? 'selected' : ''}>مراقب (عرض وتقارير)</option>
              </select>
            `
                : `<span class="px-2 py-0.5 rounded-full bg-navy-900 text-white font-bold">${roleAr[u.role] || u.role}</span>`
            }
          </td>
          <td class="py-2.5 px-3 text-center">
            ${u.username !== '100889' ? `<button onclick="removeStaffUser('${escapeHtml(u.username)}')" class="text-rose-600 hover:underline font-bold">حذف</button>` : '<span class="text-slate-400">أدمن رئيسي</span>'}
          </td>
        </tr>
      `
        )
        .join('');
    }

    const aBody = $('auditLogBody');
    if (aBody) {
      aBody.innerHTML = appState.auditLog
        .slice(0, 40)
        .map(
          (l) => `
        <tr class="hover:bg-slate-50">
          <td class="py-2 px-4 font-mono text-slate-500 whitespace-nowrap">${escapeHtml(l.time)}</td>
          <td class="py-2 px-4 font-bold text-navy-900">${escapeHtml(l.user)}</td>
          <td class="py-2 px-4"><span class="px-2 py-0.5 rounded-md bg-accent-50 text-accent-700 font-bold">${escapeHtml(l.action)}</span></td>
          <td class="py-2 px-4 text-slate-600">${escapeHtml(l.details)}</td>
        </tr>
      `
        )
        .join('');
    }
  }

  function changeContractorPin(idOrName: string): void {
    const c = appState.contractors.find((x) => x.id === idOrName || x.name === idOrName);
    if (!c) return;
    openConfirmModal({
      title: 'تعديل الرقم السري للمقاول',
      message: `أدخل الرقم السري (PIN) الجديد لحساب: ${c.name}`,
      withInput: true,
      defaultValue: c.pin,
      placeholder: 'مثال: 5588',
      onConfirm: async (newPin) => {
        if (!newPin) return;
        try {
          await fsUpdateContractorPin(c.id, newPin);
          logAudit('تعديل PIN مقاول', `تم تحديث الرقم السري للمقاول: ${c.name}`);
          showToast(`تم تحديث الرقم السري لـ ${c.name} في Firestore`, 'success');
        } catch {
          showToast('تعذر تحديث الرقم السري في قاعدة البيانات', 'error');
        }
      },
    });
  }

  async function toggleContractorActive(idOrName: string): Promise<void> {
    const c = appState.contractors.find((x) => x.id === idOrName || x.name === idOrName);
    if (!c) return;
    const nextActive = !c.active;
    try {
      await fsToggleContractorActive(c.id, nextActive);
      logAudit('تغيير حالة مقاول', `${c.name} ⇐ ${nextActive ? 'تفعيل' : 'إيقاف'}`);
      showToast(`تم ${nextActive ? 'تفعيل' : 'إيقاف'} حساب ${c.name}`, 'info');
    } catch {
      showToast('تعذر تحديث حالة المقاول في قاعدة البيانات', 'error');
    }
  }

  function addNewContractorPrompt(): void {
    openConfirmModal({
      title: 'إضافة مقاول جديد للمنصة',
      message: 'أدخل اسم الشركة أو المؤسسة الجديدة (سيكون الرقم السري الافتراضي 1234):',
      withInput: true,
      placeholder: 'مثال: شركة النور للمقاولات الكهربائية',
      onConfirm: async (name) => {
        if (!name) return;
        if (appState.contractors.some((c) => c.name === name)) {
          showToast('هذا المقاول مسجل مسبقاً', 'warning');
          return;
        }
        try {
          await fsCreateContractor({
            id: `ctr_${Date.now()}`,
            name,
            pin: '1234',
            active: true,
            updatedAt: new Date().toISOString(),
          });
          logAudit('إضافة مقاول', `تمت إضافة المقاول: ${name}`);
          showToast(`تمت إضافة ${name} وحفظه في Firestore بنجاح`, 'success');
        } catch {
          showToast('تعذر إضافة المقاول في قاعدة البيانات', 'error');
        }
      },
    });
  }

  async function addStaffUser(e: Event): Promise<void> {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = ($<HTMLInputElement>('newStaffName')?.value || '').trim();
    const username = sanitizeId(($<HTMLInputElement>('newStaffUser')?.value || '').trim());
    const password = ($<HTMLInputElement>('newStaffPass')?.value || '').trim();
    const role = ($<HTMLSelectElement>('newStaffRole')?.value || 'reviewer') as StaffRole;

    if (!name || !username || !password) return;
    if (appState.staffUsers.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      showToast('اسم المستخدم موجود مسبقاً', 'error');
      return;
    }

    try {
      const passwordHash = await hashPassword(password);
      await fsCreateStaffUser({
        id: `st_${Date.now()}`,
        name,
        username,
        passwordHash,
        role,
        updatedAt: new Date().toISOString(),
      });
      logAudit('إضافة موظف', `حساب جديد: ${name} (${username})`);
      form.reset();
      showToast('تم إنشاء حساب الموظف وحفظه في Firestore بنجاح', 'success');
    } catch {
      showToast('تعذر إنشاء حساب الموظف في قاعدة البيانات', 'error');
    }
  }

  async function removeStaffUser(usernameOrId: string): Promise<void> {
    const user = appState.staffUsers.find(
      (u) => u.username === usernameOrId || u.id === usernameOrId
    );
    if (!user || user.username === '100889') return;
    try {
      await fsDeleteStaffUser(user.username);
      logAudit('حذف موظف', `تم حذف حساب الموظف: ${user.name} (${user.username})`);
      showToast('تم حذف حساب الموظف من Firestore', 'info');
    } catch {
      showToast('تعذر حذف حساب الموظف', 'error');
    }
  }

  async function changeStaffRole(usernameOrId: string, newRole: string): Promise<void> {
    const user = appState.staffUsers.find(
      (u) => u.username === usernameOrId || u.id === usernameOrId
    );
    if (!user || user.username === '100889') return;
    const roleAr: Record<string, string> = {
      admin: 'مدير نظام (كامل)',
      reviewer: 'موظف شركة (مراجعة واعتماد)',
      viewer: 'مراقب (عرض وتقارير)',
    };
    const validRole = (['admin', 'reviewer', 'viewer'].includes(newRole) ? newRole : 'reviewer') as StaffRole;
    try {
      await fsUpdateStaffRole(user.username, validRole);
      logAudit(
        'تعديل صلاحية موظف',
        `تم تغيير صلاحية ${user.name} (${user.username}) إلى: ${roleAr[validRole] || validRole}`
      );
      showToast(`تم تحديث صلاحية ${user.name} إلى ${roleAr[validRole] || validRole}`, 'success');
    } catch {
      showToast('تعذر تحديث صلاحية الموظف في قاعدة البيانات', 'error');
    }
  }

  // ==================== ONEDRIVE INTEGRATION ====================
  function renderOneDriveModule(): void {
    const setVal = (id: string, val: string) => {
      const el = $<HTMLInputElement>(id);
      if (el) el.value = val;
    };
    setVal('odClientId', appState.oneDrive.clientId || '');
    setVal('odTenantId', appState.oneDrive.tenantId || 'common');
    setVal('odBaseFolder', appState.oneDrive.baseFolder || '/فواتير_الصيانة_والطوارئ');
    setVal('odAccessToken', appState.oneDrive.accessToken || '');
    updateOneDriveBadges();

    const tree: Record<string, Record<string, InvoicePhoto[]>> = {};
    let totalPhotos = 0;
    appState.invoices.forEach((inv) => {
      if (inv.photos && inv.photos.length) {
        if (!tree[inv.contractor]) tree[inv.contractor] = {};
        tree[inv.contractor][inv.wo] = inv.photos;
        totalPhotos += inv.photos.length;
      }
    });
    const totalEl = $('odTotalPhotosCount');
    if (totalEl) totalEl.textContent = String(totalPhotos);

    const lines = [`📁 OneDrive${appState.oneDrive.baseFolder}`];
    Object.entries(tree)
      .slice(0, 6)
      .forEach(([contractor, wos]) => {
        lines.push(`  ├─ 📂 ${contractor}`);
        Object.entries(wos)
          .slice(0, 3)
          .forEach(([wo, photos]) => {
            lines.push(`  │   ├─ 📂 ${wo}`);
            photos.forEach((p) => {
              lines.push(`  │   │   └─ 🖼️ ${p.name} ${p.synced ? '[Synced ✓]' : '[Local]'}`);
            });
          });
      });
    const preview = $('odFolderTreePreview');
    if (preview) {
      preview.innerHTML = lines.map((l) => `<div class="whitespace-pre">${escapeHtml(l)}</div>`).join('');
    }
  }

  function updateOneDriveBadges(): void {
    const connected = !!(appState.oneDrive.accessToken && appState.oneDrive.connectedUser);
    const odBadge = $('odStatusBadge');
    if (odBadge) {
      odBadge.textContent = connected ? `متصل (${appState.oneDrive.connectedUser})` : 'غير متصل';
      odBadge.className = connected
        ? 'text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800'
        : 'text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-800';
    }
    refreshLucideIcons();
  }

  async function saveOneDriveConfig(): Promise<void> {
    appState.oneDrive.clientId = ($<HTMLInputElement>('odClientId')?.value || '').trim();
    appState.oneDrive.tenantId = ($<HTMLInputElement>('odTenantId')?.value || '').trim() || 'common';
    appState.oneDrive.baseFolder =
      ($<HTMLInputElement>('odBaseFolder')?.value || '').trim() || '/فواتير_الصيانة_والطوارئ';
    appState.oneDrive.accessToken = ($<HTMLInputElement>('odAccessToken')?.value || '').trim();

    // Keep token strictly in browser localStorage; never send secrets to Firestore
    setLocalOneDriveToken(appState.oneDrive.accessToken);
    try {
      await fsSaveOneDriveSettings({
        clientId: appState.oneDrive.clientId,
        tenantId: appState.oneDrive.tenantId,
        baseFolder: appState.oneDrive.baseFolder,
        connectedUser: appState.oneDrive.connectedUser,
        updatedAt: new Date().toISOString(),
      });
      renderOneDriveModule();
      showToast('تم حفظ إعدادات OneDrive بنجاح', 'success');
    } catch {
      showToast('تعذر حفظ إعدادات OneDrive في Firestore', 'error');
    }
  }

  function connectOneDriveOAuth(): void {
    void saveOneDriveConfig();
    if (!appState.oneDrive.clientId) {
      showToast('يرجى إدخال Client ID الخاص بتطبيق Azure أولاً (أو لصق Access Token مباشرة)', 'warning');
      return;
    }
    const redirectUri = window.location.origin + window.location.pathname;
    const scope = encodeURIComponent('Files.ReadWrite User.Read');
    const authUrl = `https://login.microsoftonline.com/${encodeURIComponent(appState.oneDrive.tenantId)}/oauth2/v2.0/authorize?client_id=${encodeURIComponent(appState.oneDrive.clientId)}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
    const a = document.createElement('a');
    a.href = authUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('تم توجيهك لصفحة تسجيل الدخول إلى Microsoft OneDrive', 'info');
  }

  async function verifyOneDriveToken(): Promise<void> {
    await saveOneDriveConfig();
    if (!appState.oneDrive.accessToken) {
      showToast('لا يوجد رمز وصول (Access Token) لفحصه حالياً', 'warning');
      return;
    }
    try {
      const res = await fetch('https://graph.microsoft.com/v1.0/me/drive', {
        headers: { Authorization: `Bearer ${appState.oneDrive.accessToken}` },
      });
      if (!res.ok) throw new Error('Unauthorized');
      const info = await res.json();
      appState.oneDrive.connectedUser = info.owner?.user?.displayName || 'حساب OneDrive';
      await fsSaveOneDriveSettings({
        clientId: appState.oneDrive.clientId,
        tenantId: appState.oneDrive.tenantId,
        baseFolder: appState.oneDrive.baseFolder,
        connectedUser: appState.oneDrive.connectedUser,
        updatedAt: new Date().toISOString(),
      });
      updateOneDriveBadges();
      logAudit('ربط OneDrive', `تم التحقق من الاتصال بحساب: ${appState.oneDrive.connectedUser}`);
      showToast(`تم الاتصال بنجاح بحساب OneDrive: ${appState.oneDrive.connectedUser}`, 'success');
    } catch {
      appState.oneDrive.connectedUser = '';
      await fsSaveOneDriveSettings({
        clientId: appState.oneDrive.clientId,
        tenantId: appState.oneDrive.tenantId,
        baseFolder: appState.oneDrive.baseFolder,
        connectedUser: '',
        updatedAt: new Date().toISOString(),
      });
      updateOneDriveBadges();
      showToast('فشل التحقق من الاتصال: تأكد من صلاحية Access Token', 'error');
    }
  }

  async function uploadSinglePhotoToOneDrive(photo: InvoicePhoto): Promise<boolean> {
    if (!appState.oneDrive.accessToken) return false;
    try {
      const blob = await (await fetch(photo.dataUrl)).blob();
      const cleanPath = photo.oneDrivePath.replace(/^\/+/, '');
      const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURI(cleanPath)}:/content`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${appState.oneDrive.accessToken}`,
          'Content-Type': blob.type || 'image/jpeg',
        },
        body: blob,
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function syncLocalPhotosToOneDrive(): Promise<void> {
    if (!appState.oneDrive.accessToken) {
      showToast('يرجى ربط حساب OneDrive أولاً لإتمام المزامنة السحابية', 'warning');
      return;
    }
    let syncedCount = 0;
    for (const inv of appState.invoices) {
      let changed = false;
      for (const p of inv.photos || []) {
        if (!p.synced) {
          const ok = await uploadSinglePhotoToOneDrive(p);
          if (ok) {
            p.synced = true;
            syncedCount++;
            changed = true;
          }
        }
      }
      if (changed) {
        await fsUpdateInvoicePhotos(inv.id, inv.photos);
      }
    }
    renderOneDriveModule();
    logAudit('مزامنة OneDrive', `تم رفع ومزامنة ${syncedCount} صورة إلى OneDrive`);
    showToast(
      syncedCount ? `تمت مزامنة ${syncedCount} صورة إلى OneDrive بنجاح` : 'كافة الصور متزامنة أو تعذر الرفع',
      syncedCount ? 'success' : 'info'
    );
  }

  // ==================== DRAG SCROLL & LIVE RE-RENDER ====================
  function enableDragScroll(el: HTMLElement | null): void {
    if (!el || el.dataset.dragInit) return;
    el.dataset.dragInit = '1';
    let isDown = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;

    el.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement)?.closest('button, a, input, select, textarea, label')) return;
      isDown = true;
      el.classList.add('is-dragging');
      startX = e.pageX - el.offsetLeft;
      startY = e.pageY - el.offsetTop;
      scrollLeft = el.scrollLeft;
      scrollTop = el.scrollTop;
    });
    const stopDrag = () => {
      isDown = false;
      el.classList.remove('is-dragging');
    };
    el.addEventListener('mouseleave', stopDrag);
    el.addEventListener('mouseup', stopDrag);
    el.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const y = e.pageY - el.offsetTop;
      el.scrollLeft = scrollLeft - (x - startX) * 1.25;
      el.scrollTop = scrollTop - (y - startY) * 1.25;
    });
  }

  function refreshActiveView(): void {
    if (destroyed) return;
    if (!currentSession) {
      // On login screen, refresh contractor dropdown if open
      const dd = $('contractorDropdownList');
      if (dd && !dd.classList.contains('hidden')) {
        renderContractorDropdown($<HTMLInputElement>('contractorSearchInput')?.value || '');
      }
      return;
    }

    if (currentSession.type === 'contractor') {
      renderContractorKPIs();
      renderContractorTable();
      return;
    }

    // Staff portal: keep live role in sync if changed by admin in Firestore
    const liveUser = appState.staffUsers.find((u) => u.username === currentSession?.username);
    if (liveUser && liveUser.role !== currentSession.role) {
      currentSession.role = liveUser.role;
      applyStaffRoleVisibility();
    }

    if (currentStaffSection === 'dashboard') dashCtrl.renderDashboard();
    else if (currentStaffSection === 'invoices') renderStaffInvoicesTable();
    else if (currentStaffSection === 'reports') dashCtrl.renderReportsModule();
    else if (currentStaffSection === 'users') renderUsersManagement();
    else if (currentStaffSection === 'onedrive') renderOneDriveModule();
  }

  function maybeHideBootOverlay(): void {
    if (bootHidden) return;
    if (
      initialSnapshotsReady.staff &&
      initialSnapshotsReady.contractors &&
      initialSnapshotsReady.invoices
    ) {
      bootHidden = true;
      $('dbBootOverlay')?.classList.add('hidden');
      refreshLucideIcons();
    }
  }

  // ==================== WINDOW GLOBAL HANDLERS ====================
  const w = window as unknown as Record<string, unknown>;
  const bindings: Record<string, unknown> = {
    switchLoginTab,
    openContractorDropdown,
    toggleContractorDropdown,
    filterContractorDropdown,
    selectContractorFromList,
    handleContractorLogin,
    handleStaffLogin,
    openResetPasswordModal,
    handleResetPassword,
    logout,
    closeModal,
    openLightbox,
    switchContractorTab,
    renderContractorTable,
    openInvoicePhotosLightbox,
    editContractorInvoice,
    resetContractorForm,
    checkDuplicateWo,
    updateChecklistProgress,
    handlePhotoSelection,
    openPendingPhotoLightbox,
    removePendingPhoto,
    submitContractorInvoice,
    toggleMobileSidebar,
    switchStaffSection,
    renderDashboard: dashCtrl.renderDashboard,
    resetDashFilters: dashCtrl.resetDashFilters,
    selectDashKpiCard: dashCtrl.selectDashKpiCard,
    closeDashDrilldown: dashCtrl.closeDashDrilldown,
    renderDashDrilldown: dashCtrl.renderDashDrilldown,
    exportDashboardPdf: dashCtrl.exportDashboardPdf,
    exportDashboardExcel: dashCtrl.exportDashboardExcel,
    exportFullExcel: dashCtrl.exportFullExcel,
    downloadDirectPdf: dashCtrl.downloadDirectPdf,
    triggerNativePdfPrint: dashCtrl.triggerNativePdfPrint,
    downloadReportHtml: dashCtrl.downloadReportHtml,
    printExecutiveReport: dashCtrl.printExecutiveReport,
    printSingleWorkOrder: dashCtrl.printSingleWorkOrder,
    renderStaffInvoicesTable,
    toggleSingleInvSelect,
    toggleSelectAllInv,
    bulkApproveSelected,
    openReviewModal,
    openReviewPhotoLightbox,
    appendReviewNote,
    saveReviewDecision,
    openStaffInvoiceModal,
    saveStaffInvoice,
    deleteInvoice,
    exportFilteredStaffInvoicesExcel,
    renderUsersManagement,
    changeContractorPin,
    toggleContractorActive,
    addNewContractorPrompt,
    addStaffUser,
    removeStaffUser,
    changeStaffRole,
    saveOneDriveConfig,
    connectOneDriveOAuth,
    verifyOneDriveToken,
    syncLocalPhotosToOneDrive,
    __getCurrentReviewId: () => currentReviewId,
  };

  Object.entries(bindings).forEach(([k, fn]) => {
    w[k] = fn;
  });

  const handleDocClick = (e: MouseEvent) => {
    const dd = $('contractorDropdownList');
    const inp = $('contractorSearchInput');
    if (dd && inp && !dd.contains(e.target as Node) && !inp.contains(e.target as Node)) {
      dd.classList.add('hidden');
    }
  };
  document.addEventListener('click', handleDocClick);

  // ==================== FIRESTORE BOOTSTRAP ====================
  populateStaticSelects();
  refreshLucideIcons();

  (async () => {
    const bootText = $('dbBootStatusText');
    try {
      if (bootText) bootText.textContent = 'جاري التحقق من الاتصال بخادم Firestore...';
      await testConnection();

      if (destroyed) return;
      await ensureFirestoreSeeded(buildInitialSeedBundle, (msg) => {
        if (bootText) bootText.textContent = msg;
      });

      if (destroyed) return;
      if (bootText) bootText.textContent = 'جاري تحميل البيانات والمستخدمين والصلاحيات...';

      unsubFirestore = subscribeAllCollections({
        onStaff: (staff) => {
          appState.staffUsers = staff;
          initialSnapshotsReady.staff = true;
          maybeHideBootOverlay();
          refreshActiveView();
        },
        onContractors: (contractors) => {
          appState.contractors = contractors;
          initialSnapshotsReady.contractors = true;
          refreshDynamicContractorSelects();
          maybeHideBootOverlay();
          refreshActiveView();
        },
        onInvoices: (invoices) => {
          appState.invoices = invoices;
          initialSnapshotsReady.invoices = true;
          refreshDynamicMonthSelect();
          maybeHideBootOverlay();
          refreshActiveView();
        },
        onAuditLogs: (logs) => {
          appState.auditLog = logs;
          if (currentSession?.type === 'staff' && currentStaffSection === 'users') {
            renderUsersManagement();
          }
        },
        onOneDrive: (settings) => {
          appState.oneDrive = {
            ...settings,
            accessToken: appState.oneDrive.accessToken || getLocalOneDriveToken(),
          };
          updateOneDriveBadges();
          if (currentSession?.type === 'staff' && currentStaffSection === 'onedrive') {
            renderOneDriveModule();
          }
        },
        onError: (err) => {
          console.error('Firestore subscription error:', err);
          onFatalError?.(err);
        },
      });

      // Check OAuth implicit hash return from Microsoft OneDrive
      if (window.location.hash && window.location.hash.includes('access_token=')) {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const token = params.get('access_token');
        if (token) {
          appState.oneDrive.accessToken = token;
          setLocalOneDriveToken(token);
          window.history.replaceState(null, '', window.location.pathname);
          void verifyOneDriveToken();
        }
      }
    } catch (err) {
      console.error('Firestore initialization error:', err);
      if (!destroyed) {
        onFatalError?.(err instanceof Error ? err : new Error(String(err)));
      }
    }
  })();

  return () => {
    destroyed = true;
    document.removeEventListener('click', handleDocClick);
    if (unsubFirestore) unsubFirestore();
    dashCtrl.destroyAllCharts();
  };
}
