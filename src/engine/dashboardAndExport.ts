import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { createIcons, icons } from 'lucide';
import type { InvoiceRecord } from '../firestoreStore';
import { DELAY_OBSERVATIONS, OFFICES, WORK_TYPES } from '../seedData';

Chart.register(ChartDataLabels);

export interface SessionInfo {
  type: 'staff' | 'contractor';
  name: string;
  username?: string;
  role: string;
}

export interface SlaInfo {
  reviewed: boolean;
  days: number | null;
  daysText: string;
  category: 'تمت المراجعة' | 'جديد' | 'متأخر' | 'مصعّد';
  badgeClass: string;
}

export interface ScorecardRow {
  contractor: string;
  total: number;
  'طوارئ': number;
  'صيانة معدة': number;
  'صيانة مغذي': number;
  C4C: number;
  approved: number;
  flagged: number;
}

export function refreshLucideIcons(): void {
  createIcons({ icons });
}

export function escapeHtml(str: unknown): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return String(str ?? '').replace(/[&<>"']/g, (m) => map[m] || m);
}

export function formatNow(): string {
  const d = new Date();
  return d.toLocaleString('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// حساب أيام العمل الفعلية من تاريخ التسليم إلى تاريخ اليوم مع استبعاد الجمعة (5) والسبت (6)
export function calcWorkingDays(startDateStr: string): number {
  if (!startDateStr) return 0;
  const parts = String(startDateStr).slice(0, 10).split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return 0;
  const start = new Date(parts[0], parts[1] - 1, parts[2]);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (start >= today) return 0;
  let workingDays = 0;
  const cur = new Date(start);
  while (cur < today) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay();
    if (day !== 5 && day !== 6) {
      workingDays++;
    }
  }
  return workingDays;
}

export function getInvoiceSlaInfo(inv: InvoiceRecord): SlaInfo {
  if (inv.status !== 'قيد المراجعة') {
    return {
      reviewed: true,
      days: null,
      daysText: 'تمت المراجعة',
      category: 'تمت المراجعة',
      badgeClass: 'bg-se-extra-dark-blue-10 text-se-text-muted border-se-border',
    };
  }
  const days = calcWorkingDays(inv.deliveryDate);
  let category: SlaInfo['category'] = 'جديد';
  let badgeClass = 'bg-se-tertiary-green/20 text-se-tertiary-green border-se-tertiary-green/30';
  if (days >= 4 && days <= 5) {
    category = 'متأخر';
    badgeClass = 'bg-se-tertiary-orange/20 text-se-tertiary-orange border-se-tertiary-orange/30';
  } else if (days > 5) {
    category = 'مصعّد';
    badgeClass = 'bg-se-tertiary-red/20 text-se-tertiary-red border-se-tertiary-red/30';
  }
  const daysText =
    days === 0 ? 'اليوم (0)' : days === 1 ? '1 يوم' : days === 2 ? 'يومان' : `${days} أيام`;
  return { reviewed: false, days, daysText, category, badgeClass };
}

export function statusBadgeHtml(status: string): string {
  const styles: Record<string, string> = {
    'معتمد': 'bg-se-tertiary-green/20 text-se-tertiary-green border-se-tertiary-green/30',
    'قيد المراجعة': 'bg-se-mid-blue/20 text-se-mid-blue border-se-mid-blue/30',
    'ملاحظات معلقة': 'bg-se-tertiary-orange/20 text-se-tertiary-orange border-se-tertiary-orange/30',
    'مرفوض': 'bg-se-tertiary-red/20 text-se-tertiary-red border-se-tertiary-red/30',
  };
  const cls = styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${cls}">${escapeHtml(status)}</span>`;
}

export function buildScorecardData(sourceList: InvoiceRecord[]): ScorecardRow[] {
  const map: Record<string, ScorecardRow> = {};
  sourceList.forEach((i) => {
    if (!map[i.contractor]) {
      map[i.contractor] = {
        contractor: i.contractor,
        total: 0,
        'طوارئ': 0,
        'صيانة معدة': 0,
        'صيانة مغذي': 0,
        C4C: 0,
        approved: 0,
        flagged: 0,
      };
    }
    const m = map[i.contractor];
    m.total++;
    if (i.workType === 'طوارئ') m['طوارئ']++;
    else if (i.workType === 'صيانة معدة') m['صيانة معدة']++;
    else if (i.workType === 'صيانة مغذي') m['صيانة مغذي']++;
    else if (i.workType === 'C4C') m.C4C++;
    if (i.status === 'معتمد') m.approved++;
    if (i.status === 'مرفوض' || i.status === 'ملاحظات معلقة') m.flagged++;
  });
  return Object.values(map).sort((a, b) => b.total - a.total);
}

export interface DashboardExportContext {
  getInvoices: () => InvoiceRecord[];
  getSession: () => SessionInfo | null;
  logAudit: (action: string, details: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function createDashboardAndExportController(ctx: DashboardExportContext) {
  const charts: Record<string, Chart | null> = {};
  let activeDashKpiKey: string | null = null;
  let currentReportFileName = 'التقرير_التنفيذي';

  function getElVal(id: string): string {
    const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
    return el ? el.value : '';
  }

  function destroyChart(key: string): void {
    if (charts[key]) {
      charts[key]!.destroy();
      charts[key] = null;
    }
  }

  function destroyAllCharts(): void {
    Object.keys(charts).forEach((k) => destroyChart(k));
  }

  function resetActiveKpi(): void {
    activeDashKpiKey = null;
  }

  function getFilteredDashboardInvoices(): InvoiceRecord[] {
    const c = getElVal('dashContractorFilter');
    const o = getElVal('dashOfficeFilter');
    const wt = getElVal('dashWorkTypeFilter');
    const cons = getElVal('dashConsultantFilter');
    const st = getElVal('dashStatusFilter');

    return ctx.getInvoices().filter((i) => {
      if (c && i.contractor !== c) return false;
      if (o && i.office !== o) return false;
      if (wt && i.workType !== wt) return false;
      if (cons && i.consultant !== cons) return false;
      if (st && i.status !== st) return false;
      return true;
    });
  }

  function getActiveDashFilterInfo() {
    const contractor = getElVal('dashContractorFilter');
    const office = getElVal('dashOfficeFilter');
    const workType = getElVal('dashWorkTypeFilter');
    const consultant = getElVal('dashConsultantFilter');
    const status = getElVal('dashStatusFilter');

    const parts: string[] = [];
    if (contractor) parts.push(`المقاول: ${contractor}`);
    if (office) parts.push(`المكتب: ${office}`);
    if (workType) parts.push(`نوع العمل: ${workType}`);
    if (consultant) parts.push(`الاستشاري: ${consultant}`);
    if (status) parts.push(`الحالة: ${status}`);

    const suffixParts = [contractor, office, workType, consultant, status]
      .filter(Boolean)
      .map((s) => s.replace(/\s+/g, '_'));

    return {
      contractor,
      office,
      workType,
      consultant,
      status,
      hasFilters: parts.length > 0,
      summaryText: parts.length ? parts.join(' | ') : 'كافة البيانات (بدون تصفية)',
      fileSuffix: suffixParts.length ? '_' + suffixParts.join('_') : '_الكل',
    };
  }

  function closeDashDrilldown(): void {
    activeDashKpiKey = null;
    const panel = document.getElementById('dashDrilldownPanel');
    if (panel) panel.classList.add('hidden');
  }

  function resetDashFilters(): void {
    [
      'dashContractorFilter',
      'dashOfficeFilter',
      'dashWorkTypeFilter',
      'dashConsultantFilter',
      'dashStatusFilter',
    ].forEach((id) => {
      const el = document.getElementById(id) as HTMLSelectElement | null;
      if (el) el.value = '';
    });
    activeDashKpiKey = null;
    closeDashDrilldown();
    renderDashboard();
  }

  function getDashDrilldownData(data: InvoiceRecord[], key: string) {
    const defs: Record<string, { title: string; fn: (i: InvoiceRecord) => boolean }> = {
      all: { title: 'إجمالي الفواتير', fn: () => true },
      approved: { title: 'الفواتير المعتمدة', fn: (i) => i.status === 'معتمد' },
      withNotes: {
        title: 'الفواتير التي عليها ملاحظة / مرفوضة',
        fn: (i) => i.status === 'مرفوض' || i.status === 'ملاحظات معلقة',
      },
      emergency: { title: 'فواتير الطوارئ', fn: (i) => i.workType === 'طوارئ' },
      maintenance: {
        title: 'فواتير أعمال الصيانة (معدة + مغذي)',
        fn: (i) => i.workType === 'صيانة معدة' || i.workType === 'صيانة مغذي',
      },
      c4c: { title: 'فواتير أعمال C4C', fn: (i) => i.workType === 'C4C' },
      sla_new: {
        title: 'الفواتير الجديدة (1 - 3 أيام عمل بدون مراجعة)',
        fn: (i) => getInvoiceSlaInfo(i).category === 'جديد',
      },
      sla_late: {
        title: 'الفواتير المتأخرة (4 - 5 أيام عمل بدون مراجعة)',
        fn: (i) => getInvoiceSlaInfo(i).category === 'متأخر',
      },
      sla_escalated: {
        title: 'الفواتير المصعّدة (أكثر من 5 أيام عمل بدون مراجعة)',
        fn: (i) => getInvoiceSlaInfo(i).category === 'مصعّد',
      },
    };
    const def = defs[key];
    if (!def) return { title: '', list: [] as InvoiceRecord[] };
    return { title: def.title, list: data.filter(def.fn) };
  }

  function renderDashDrilldown(): void {
    if (!activeDashKpiKey) return;
    const baseData = getFilteredDashboardInvoices();
    const { title, list } = getDashDrilldownData(baseData, activeDashKpiKey);
    const q = getElVal('dashDrilldownSearch').trim().toLowerCase();
    const filtered = q
      ? list.filter((i) =>
          `${i.wo} ${i.contractor} ${i.consultant} ${i.workDesc} ${i.office} ${i.note}`
            .toLowerCase()
            .includes(q)
        )
      : list;

    const titleEl = document.getElementById('dashDrilldownTitle');
    const subEl = document.getElementById('dashDrilldownSub');
    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = `عدد الفواتير المعروضة: ${filtered.length} من أصل ${list.length}`;

    const tbody = document.getElementById('dashDrilldownBody');
    if (!tbody) return;
    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="12" class="py-8 text-center text-slate-400 font-bold">لا توجد فواتير مطابقة ضمن هذا التصنيف</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered
      .map((inv) => {
        const sla = getInvoiceSlaInfo(inv);
        return `
          <tr class="hover:bg-slate-50 transition">
            <td class="py-2.5 px-3 font-mono font-extrabold text-se-dark-blue whitespace-nowrap" dir="ltr">${escapeHtml(inv.wo)}</td>
            <td class="py-2.5 px-3 font-bold text-se-dark-blue whitespace-nowrap">${escapeHtml(inv.contractor)}</td>
            <td class="py-2.5 px-3 text-slate-600 whitespace-nowrap">${escapeHtml(inv.consultant)}</td>
            <td class="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap" dir="ltr">${escapeHtml(inv.invoiceDate || '-')}</td>
            <td class="py-2.5 px-3 whitespace-nowrap"><span class="px-2 py-0.5 rounded-md bg-navy-50 text-navy-800 font-bold">${escapeHtml(inv.workType)}</span></td>
            <td class="py-2.5 px-3 font-semibold text-slate-700">${escapeHtml(inv.workDesc)}</td>
            <td class="py-2.5 px-3 font-semibold whitespace-nowrap">${escapeHtml(inv.office)}</td>
            <td class="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap" dir="ltr">${escapeHtml(inv.deliveryDate || '-')}</td>
            <td class="py-2.5 px-3 font-extrabold whitespace-nowrap ${sla.reviewed ? 'text-slate-400' : 'text-se-dark-blue'}">${escapeHtml(sla.daysText)}</td>
            <td class="py-2.5 px-3 whitespace-nowrap"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${sla.badgeClass}">${escapeHtml(sla.category)}</span></td>
            <td class="py-2.5 px-3 whitespace-nowrap">
              <div>${statusBadgeHtml(inv.status)}</div>
              ${inv.status === 'مرفوض' ? `<div class="text-[10px] font-bold text-se-tertiary-red mt-0.5">سبب الرفض: ${escapeHtml(inv.note || 'غير محدد')}</div>` : ''}
            </td>
            <td class="py-2.5 px-3 text-center whitespace-nowrap">
              <button onclick="openReviewModal('${escapeHtml(inv.id)}')" class="px-2.5 py-1 rounded-lg bg-navy-900 hover:bg-accent-500 text-white text-[11px] font-bold transition">مراجعة</button>
            </td>
          </tr>
        `;
      })
      .join('');
    refreshLucideIcons();
  }

  function selectDashKpiCard(key: string): void {
    if (activeDashKpiKey === key) {
      activeDashKpiKey = null;
      closeDashDrilldown();
      renderDashboard();
      return;
    }
    activeDashKpiKey = key;
    const searchEl = document.getElementById('dashDrilldownSearch') as HTMLInputElement | null;
    if (searchEl) searchEl.value = '';
    renderDashboard();
    renderDashDrilldown();
    const panel = document.getElementById('dashDrilldownPanel');
    if (panel) {
      panel.classList.remove('hidden');
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function renderDashboardCharts(
    data: InvoiceRecord[],
    top5Notes: Array<[string, number]>,
    delayByContractor: Array<{
      contractor: string;
      total: number;
      topNote: string;
      topNoteCount: number;
      sortedNotes: Array<[string, number]>;
    }>
  ): void {
    const isDark = document.documentElement.classList.contains('dark');
    const chartTooltip = {
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.96)' : '#00183A',
      titleColor: '#ffffff',
      bodyColor: '#f8fafc',
      borderColor: isDark ? '#38bdf8' : '#0080FF',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 10,
      titleFont: { family: 'Cairo', size: 12, weight: 800 as const },
      bodyFont: { family: 'Cairo', size: 11, weight: 700 as const },
      rtl: true,
    };

    const axisColor = isDark ? '#e2e8f0' : '#00183A';
    const gridColor = isDark ? 'rgba(148, 178, 230, 0.12)' : '#e2e8f0';
    const pillBg = isDark ? '#1e293b' : '#eef3f9';
    const pillColor = isDark ? '#f8fafc' : '#00183A';
    const pillBorder = isDark ? '#334155' : '#cbd5e1';

    const makeHBarPill = (bg: string, color: string, border: string) => ({
      anchor: 'end' as const,
      align: 'right' as const,
      offset: 8,
      clip: false,
      textAlign: 'center' as const,
      backgroundColor: bg,
      borderColor: border,
      borderWidth: 1,
      color,
      borderRadius: 6,
      padding: { top: 2, bottom: 2, left: 8, right: 8 },
      font: { weight: 800 as const, size: 11, family: 'Cairo' },
      formatter: (val: number) => (val > 0 ? val : ''),
    });

    // 1. Contractors Stacked Bar
    const cMap: Record<string, { approved: number; pending: number; flagged: number; total: number }> = {};
    data.forEach((i) => {
      if (!cMap[i.contractor]) cMap[i.contractor] = { approved: 0, pending: 0, flagged: 0, total: 0 };
      cMap[i.contractor].total++;
      if (i.status === 'معتمد') cMap[i.contractor].approved++;
      else if (i.status === 'قيد المراجعة') cMap[i.contractor].pending++;
      else cMap[i.contractor].flagged++;
    });
    const cEntries = Object.entries(cMap).sort((a, b) => a[1].total - b[1].total);
    const maxContractorTotal = cEntries.length ? cEntries[cEntries.length - 1][1].total : 1;
    destroyChart('contractors');
    const cCanvas = document.getElementById('chartContractors') as HTMLCanvasElement | null;
    if (cCanvas) {
      charts.contractors = new Chart(cCanvas, {
        type: 'bar',
        data: {
          labels: cEntries.map((e) => e[0]),
          datasets: [
            { label: 'معتمد', data: cEntries.map((e) => e[1].approved), backgroundColor: '#10b981', borderRadius: 4, maxBarThickness: 22 },
            { label: 'قيد المراجعة', data: cEntries.map((e) => e[1].pending), backgroundColor: '#0ea5e9', borderRadius: 4, maxBarThickness: 22 },
            { label: 'مرفوض/ملاحظات', data: cEntries.map((e) => e[1].flagged), backgroundColor: '#f43f5e', borderRadius: 4, maxBarThickness: 22 },
            {
              label: '__total__',
              data: cEntries.map(() => 0),
              backgroundColor: 'transparent',
              datalabels: {
                display: true,
                anchor: 'end',
                align: 'right',
                offset: 8,
                clip: false,
                textAlign: 'center',
                backgroundColor: pillBg,
                borderColor: pillBorder,
                borderWidth: 1,
                color: pillColor,
                borderRadius: 6,
                padding: { top: 2, bottom: 2, left: 8, right: 8 },
                font: { weight: 800, size: 11, family: 'Cairo' },
                formatter: (_val, ctxData) => (cEntries[ctxData.dataIndex] ? cEntries[ctxData.dataIndex][1].total : ''),
              },
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { right: 54 } },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: axisColor,
                font: { size: 11, weight: 700 },
                usePointStyle: true,
                boxWidth: 8,
                filter: (item) => item.text !== '__total__',
              },
            },
            tooltip: {
              ...chartTooltip,
              filter: (item) => item.dataset.label !== '__total__',
            },
            datalabels: {
              color: '#ffffff',
              font: { weight: 800, size: 10, family: 'Cairo' },
              display: (c) => {
                if (c.dataset.label === '__total__') return true;
                const v = Number(c.dataset.data[c.dataIndex] || 0);
                return v > 0 && v / maxContractorTotal >= 0.06;
              },
              formatter: (val) => val,
            },
          },
          scales: {
            x: { stacked: true, beginAtZero: true, grace: '15%', grid: { color: gridColor }, ticks: { color: axisColor, maxRotation: 0, autoSkip: true, font: { size: 11 } } },
            y: { stacked: true, grid: { display: false }, ticks: { font: { size: 11, weight: 700 }, color: axisColor } },
          },
        },
      });
    }

    // 2. Work Types Doughnut + Breakdown Cards
    const wtMap: Record<string, number> = {};
    WORK_TYPES.forEach((w) => (wtMap[w] = 0));
    data.forEach((i) => {
      wtMap[i.workType] = (wtMap[i.workType] || 0) + 1;
    });
    const wtColors = isDark
      ? ['#fb923c', '#38bdf8', '#0ea5e9', '#facc15']
      : ['#ea580c', '#0027B9', '#0284c7', '#d97706'];
    const wtTotal = data.length;
    const centerEl = document.getElementById('workTypesTotalCenter');
    if (centerEl) {
      centerEl.textContent = String(wtTotal);
      centerEl.style.color = axisColor;
    }

    const breakdownEl = document.getElementById('workTypesBreakdown');
    if (breakdownEl) {
      breakdownEl.innerHTML = WORK_TYPES.map((w, idx) => {
        const cnt = wtMap[w] || 0;
        const pct = wtTotal ? Math.round((cnt / wtTotal) * 100) : 0;
        return `
          <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${wtColors[idx]}"></span>
              <span class="text-[11px] font-extrabold text-se-dark-blue truncate">${escapeHtml(w)}</span>
            </div>
            <div class="text-left shrink-0 mr-1">
              <span class="text-xs font-black text-se-dark-blue">${cnt}</span>
              <span class="text-[10px] font-bold text-slate-400">(${pct}%)</span>
            </div>
          </div>
        `;
      }).join('');
    }

    destroyChart('workTypes');
    const wtCanvas = document.getElementById('chartWorkTypes') as HTMLCanvasElement | null;
    if (wtCanvas) {
      charts.workTypes = new Chart(wtCanvas, {
        type: 'doughnut',
        data: {
          labels: WORK_TYPES,
          datasets: [
            {
              data: WORK_TYPES.map((w) => wtMap[w]),
              backgroundColor: wtColors,
              borderWidth: 2,
              borderColor: isDark ? '#0d1830' : '#ffffff',
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: { display: false },
            datalabels: { display: false },
            tooltip: {
              ...chartTooltip,
              callbacks: {
                label: (c) => {
                  const v = Number(c.parsed || 0);
                  const pct = wtTotal ? Math.round((v / wtTotal) * 100) : 0;
                  return ` ${c.label}: ${v} فاتورة (${pct}%)`;
                },
              },
            },
          },
        },
      });
    }

    // 3. Offices Vertical Bar
    const offMap: Record<string, number> = {};
    OFFICES.forEach((o) => (offMap[o] = 0));
    data.forEach((i) => {
      if (i.office) offMap[i.office] = (offMap[i.office] || 0) + 1;
    });
    const offEntries = Object.entries(offMap).sort((a, b) => b[1] - a[1]);
    destroyChart('offices');
    const offCanvas = document.getElementById('chartOffices') as HTMLCanvasElement | null;
    if (offCanvas) {
      charts.offices = new Chart(offCanvas, {
        type: 'bar',
        data: {
          labels: offEntries.map((e) => e[0]),
          datasets: [
            {
              label: 'عدد الفواتير',
              data: offEntries.map((e) => e[1]),
              backgroundColor: isDark ? '#38bdf8' : '#0027B9',
              hoverBackgroundColor: isDark ? '#60a5fa' : '#0080FF',
              borderRadius: 7,
              maxBarThickness: 32,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { top: 24 } },
          plugins: {
            legend: { display: false },
            tooltip: chartTooltip,
            datalabels: {
              anchor: 'end',
              align: 'top',
              offset: 4,
              clip: false,
              textAlign: 'center',
              backgroundColor: pillBg,
              borderColor: pillBorder,
              borderWidth: 1,
              color: pillColor,
              borderRadius: 6,
              padding: { top: 2, bottom: 2, left: 7, right: 7 },
              font: { weight: 800, size: 11, family: 'Cairo' },
              formatter: (val: number) => (val > 0 ? val : ''),
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11, weight: 700 }, color: axisColor } },
            y: { beginAtZero: true, grace: '15%', grid: { color: gridColor }, ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 11 } } },
          },
        },
      });
    }

    // 4. Top Work Descriptions Horizontal Bar
    const dMap: Record<string, number> = {};
    data.forEach((i) => {
      dMap[i.workDesc] = (dMap[i.workDesc] || 0) + 1;
    });
    const dEntries = Object.entries(dMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    destroyChart('workDescs');
    const wdCanvas = document.getElementById('chartWorkDescs') as HTMLCanvasElement | null;
    if (wdCanvas) {
      charts.workDescs = new Chart(wdCanvas, {
        type: 'bar',
        data: {
          labels: dEntries.map((e) => e[0]),
          datasets: [
            {
              label: 'التكرار',
              data: dEntries.map((e) => e[1]),
              backgroundColor: isDark ? '#fb923c' : '#F26522',
              hoverBackgroundColor: isDark ? '#f97316' : '#d95314',
              borderRadius: 7,
              maxBarThickness: 22,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { right: 44 } },
          plugins: {
            legend: { display: false },
            tooltip: chartTooltip,
            datalabels: makeHBarPill(isDark ? '#332014' : '#fff4ee', isDark ? '#fdba74' : '#b8420d', isDark ? '#7c2d12' : '#fed7aa'),
          },
          scales: {
            x: { beginAtZero: true, grace: '20%', grid: { color: gridColor }, ticks: { color: isDark ? '#94a3b8' : '#64748b', maxRotation: 0, autoSkip: true, font: { size: 11 } } },
            y: { grid: { display: false }, ticks: { font: { size: 11, weight: 700 }, color: axisColor } },
          },
        },
      });
    }

    // 5. Top Delay Root Causes Horizontal Bar
    const noteColors = isDark
      ? ['#f43f5e', '#fb7185', '#fb923c', '#facc15', '#38bdf8']
      : ['#e11d48', '#f43f5e', '#fb7185', '#f97316', '#f59e0b'];
    destroyChart('topDelayNotes');
    const dnCanvas = document.getElementById('chartTopDelayNotes') as HTMLCanvasElement | null;
    if (dnCanvas) {
      charts.topDelayNotes = new Chart(dnCanvas, {
        type: 'bar',
        data: {
          labels: top5Notes.map((n) => n[0]),
          datasets: [
            {
              label: 'عدد التكرارات',
              data: top5Notes.map((n) => n[1]),
              backgroundColor: top5Notes.map((_, idx) => noteColors[idx % noteColors.length]),
              borderRadius: 7,
              maxBarThickness: 26,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { right: 48 } },
          plugins: {
            legend: { display: false },
            tooltip: chartTooltip,
            datalabels: makeHBarPill(isDark ? '#3b1219' : '#fff1f2', isDark ? '#fda4af' : '#be123c', isDark ? '#881337' : '#fecdd3'),
          },
          scales: {
            x: { beginAtZero: true, grace: '20%', grid: { color: gridColor }, ticks: { color: isDark ? '#94a3b8' : '#64748b', stepSize: 1, maxRotation: 0, autoSkip: true, font: { size: 11 } } },
            y: { grid: { display: false }, ticks: { font: { size: 11, weight: 700 }, color: axisColor } },
          },
        },
      });
    }

    // 6. Top 5 Contractors with Most Blocking/Delay Notes
    destroyChart('delayByContractor');
    const shortTxt = (s: string, max = 26) => (s && s.length > max ? s.slice(0, max) + '…' : s);
    const dbcCanvas = document.getElementById('chartDelayByContractor') as HTMLCanvasElement | null;
    if (dbcCanvas) {
      charts.delayByContractor = new Chart(dbcCanvas, {
        type: 'bar',
        data: {
          labels: delayByContractor.map((d) => [d.contractor, `الأبرز: ${shortTxt(d.topNote)} (${d.topNoteCount})`]),
          datasets: [
            {
              label: 'الفواتير المتوقفة',
              data: delayByContractor.map((d) => d.total),
              backgroundColor: isDark
                ? ['#38bdf8', '#818cf8', '#f43f5e', '#fb923c', '#fbbf24']
                : ['#001F5E', '#0027B9', '#e11d48', '#0080FF', '#f59e0b'],
              borderRadius: 7,
              maxBarThickness: 26,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { right: 48 } },
          plugins: {
            legend: { display: false },
            datalabels: makeHBarPill(pillBg, pillColor, pillBorder),
            tooltip: {
              ...chartTooltip,
              callbacks: {
                title: (items) => {
                  const d = delayByContractor[items[0].dataIndex];
                  return d ? `${d.contractor} — إجمالي المتوقف: ${d.total}` : '';
                },
                label: (c) => {
                  const d = delayByContractor[c.dataIndex];
                  if (!d || !d.sortedNotes.length) return ` ${c.parsed.x} فاتورة`;
                  return d.sortedNotes.map(([noteText, cnt]) => `• ${noteText}: ${cnt}`);
                },
              },
            },
          },
          scales: {
            x: { beginAtZero: true, grace: '20%', grid: { color: gridColor }, ticks: { color: isDark ? '#94a3b8' : '#64748b', stepSize: 1, maxRotation: 0, autoSkip: true, font: { size: 11 } } },
            y: { grid: { display: false }, ticks: { font: { size: 10.5, weight: 700 }, color: axisColor } },
          },
        },
      });
    }
  }

  function renderDashboard(): void {
    const data = getFilteredDashboardInvoices();
    const filterInfo = getActiveDashFilterInfo();
    const hintEl = document.getElementById('dashActiveFilterHint');
    if (hintEl) {
      hintEl.innerHTML = `<i data-lucide="sliders-horizontal" class="w-3.5 h-3.5 text-se-mid-blue"></i><span>نطاق التصدير الحالي (${data.length} فاتورة): <b class="font-extrabold text-se-mid-blue">${escapeHtml(filterInfo.summaryText)}</b></span>`;
    }

    const total = data.length;
    const approved = data.filter((i) => i.status === 'معتمد').length;
    const withNotes = data.filter((i) => i.status === 'مرفوض' || i.status === 'ملاحظات معلقة').length;
    const emergency = data.filter((i) => i.workType === 'طوارئ').length;
    const maintenance = data.filter((i) => i.workType === 'صيانة معدة' || i.workType === 'صيانة مغذي').length;
    const c4c = data.filter((i) => i.workType === 'C4C').length;
    const rate = total ? Math.round((approved / total) * 100) : 0;

    let slaNew = 0;
    let slaLate = 0;
    let slaEscalated = 0;
    data.forEach((i) => {
      const cat = getInvoiceSlaInfo(i).category;
      if (cat === 'جديد') slaNew++;
      else if (cat === 'متأخر') slaLate++;
      else if (cat === 'مصعّد') slaEscalated++;
    });

    const opsCards: Array<{
      key: string;
      label: string;
      val: number;
      sub: string;
      icon: string;
      color: string;
      progress?: number;
    }> = [
      { key: 'all', label: 'إجمالي الفواتير', val: total, sub: 'اضغط لعرض كافة الفواتير', icon: 'layers', color: 'text-se-dark-blue bg-se-navy-50' },
      { key: 'approved', label: 'معتمد', val: approved, sub: `نسبة الاعتماد: ${rate}%`, icon: 'check-circle-2', color: 'text-se-tertiary-green bg-se-tertiary-green/20', progress: rate },
      { key: 'withNotes', label: 'عليه ملاحظة / مرفوض', val: withNotes, sub: 'يتطلب معالجة المقاول', icon: 'alert-triangle', color: 'text-se-tertiary-red bg-se-tertiary-red/20' },
      { key: 'emergency', label: 'فواتير الطوارئ', val: emergency, sub: `${total ? Math.round((emergency / total) * 100) : 0}% من الإجمالي`, icon: 'zap', color: 'text-se-mid-blue bg-se-mid-blue/20' },
      { key: 'maintenance', label: 'أعمال الصيانة', val: maintenance, sub: 'صيانة معدة + صيانة مغذي', icon: 'wrench', color: 'text-se-blue bg-se-blue/20' },
      { key: 'c4c', label: 'أعمال C4C', val: c4c, sub: 'طلبات C4C المستقلة', icon: 'clipboard-list', color: 'text-se-tertiary-orange bg-se-tertiary-orange/20' },
    ];

    const slaCards = [
      { key: 'sla_new', label: 'جديد (1 - 3 أيام عمل)', val: slaNew, sub: 'اضغط لعرض الفواتير الجديدة', icon: 'clock', border: 'border-se-tertiary-green/30', badge: 'bg-se-tertiary-green/20 text-se-tertiary-green', valColor: 'text-se-tertiary-green' },
      { key: 'sla_late', label: 'متأخر (4 - 5 أيام عمل)', val: slaLate, sub: 'اضغط لعرض الفواتير المتأخرة', icon: 'hourglass', border: 'border-se-tertiary-orange/30', badge: 'bg-se-tertiary-orange/20 text-se-tertiary-orange', valColor: 'text-se-tertiary-orange' },
      { key: 'sla_escalated', label: 'مصعّد (أكثر من 5 أيام عمل)', val: slaEscalated, sub: 'اضغط لعرض الفواتير المصعّدة', icon: 'flame', border: 'border-se-tertiary-red/30', badge: 'bg-se-tertiary-red/20 text-se-tertiary-red', valColor: 'text-se-tertiary-red' },
    ];

    const kpiEl = document.getElementById('dashKpiGrid');
    if (kpiEl) {
      kpiEl.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
          ${opsCards
            .map((c) => {
              const activeCls =
                activeDashKpiKey === c.key
                  ? 'ring-2 ring-se-mid-blue border-se-mid-blue shadow-md bg-se-mid-blue/20'
                  : 'border-slate-200 hover:border-se-mid-blue hover:shadow-md';
              return `
                <div onclick="selectDashKpiCard('${c.key}')" class="cursor-pointer bg-white rounded-2xl p-4 shadow-sm border ${activeCls} transition flex flex-col justify-between gap-2.5">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <p class="text-[11px] font-bold text-slate-500">${c.label}</p>
                      <p class="text-2xl font-black text-se-dark-blue mt-1">${c.val}</p>
                    </div>
                    <div class="w-10 h-10 rounded-xl ${c.color} flex items-center justify-center shrink-0">
                      <i data-lucide="${c.icon}" class="w-5 h-5"></i>
                    </div>
                  </div>
                  <div>
                    <p class="text-[11px] font-semibold text-slate-500">${c.sub}</p>
                    ${
                      c.progress !== undefined
                        ? `<div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5"><div class="h-full bg-se-tertiary-green rounded-full" style="width:${c.progress}%"></div></div>`
                        : ''
                    }
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          ${slaCards
            .map((s) => {
              const activeCls =
                activeDashKpiKey === s.key
                  ? 'ring-2 ring-se-mid-blue border-se-mid-blue shadow-md'
                  : `${s.border} hover:shadow-md`;
              return `
                <div onclick="selectDashKpiCard('${s.key}')" class="cursor-pointer bg-white rounded-2xl p-4 shadow-sm border ${activeCls} transition flex items-center justify-between gap-3">
                  <div>
                    <p class="text-xs font-extrabold text-se-dark-blue">${s.label}</p>
                    <p class="text-2xl font-black ${s.valColor} mt-1">${s.val}</p>
                    <p class="text-[11px] font-semibold text-slate-500 mt-0.5">${s.sub}</p>
                  </div>
                  <div class="w-11 h-11 rounded-2xl ${s.badge} flex items-center justify-center shrink-0">
                    <i data-lucide="${s.icon}" class="w-5 h-5"></i>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      `;
    }

    const noteFreq: Record<string, number> = {};
    data.forEach((i) => {
      const n = (i.note || '').trim();
      if (!n || n === 'تم' || n === 'قيد المراجعة' || n === '1') return;
      noteFreq[n] = (noteFreq[n] || 0) + 1;
    });
    const top5Notes = Object.entries(noteFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const contractorDelayMap: Record<string, { contractor: string; total: number; notes: Record<string, number> }> = {};
    data.forEach((i) => {
      const n = (i.note || '').trim();
      const isBlocking =
        (n && n !== 'تم' && n !== 'قيد المراجعة' && n !== '1') ||
        i.status === 'مرفوض' ||
        i.status === 'ملاحظات معلقة';
      if (!isBlocking) return;
      const reason =
        n && n !== 'تم' && n !== 'قيد المراجعة' && n !== '1'
          ? n
          : i.status === 'مرفوض'
          ? 'مرفوض بدون ملاحظة'
          : 'ملاحظة معلقة';
      if (!contractorDelayMap[i.contractor]) {
        contractorDelayMap[i.contractor] = { contractor: i.contractor, total: 0, notes: {} };
      }
      contractorDelayMap[i.contractor].total++;
      contractorDelayMap[i.contractor].notes[reason] = (contractorDelayMap[i.contractor].notes[reason] || 0) + 1;
    });

    const delayByContractor = Object.values(contractorDelayMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((d) => {
        const sortedNotes = Object.entries(d.notes).sort((a, b) => b[1] - a[1]);
        return {
          contractor: d.contractor,
          total: d.total,
          topNote: sortedNotes[0] ? sortedNotes[0][0] : '',
          topNoteCount: sortedNotes[0] ? sortedNotes[0][1] : 0,
          sortedNotes,
        };
      });

    renderDashboardCharts(data, top5Notes, delayByContractor);
    if (activeDashKpiKey) renderDashDrilldown();
    refreshLucideIcons();
  }

  function renderReportsModule(): void {
    const rows = buildScorecardData(ctx.getInvoices());
    const tbody = document.getElementById('scorecardBody');
    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-slate-400 font-bold">لا توجد بيانات متاحة حالياً</td></tr>`;
      return;
    }
    tbody.innerHTML = rows
      .map((r) => {
        const rate = r.total ? Math.round((r.approved / r.total) * 100) : 0;
        const barCls = rate >= 75 ? 'bg-se-tertiary-green' : rate >= 45 ? 'bg-se-tertiary-orange' : 'bg-se-tertiary-red';
        return `
          <tr class="hover:bg-slate-50 transition">
            <td class="py-3 px-4 font-extrabold text-se-dark-blue">${escapeHtml(r.contractor)}</td>
            <td class="py-3 px-3 text-center font-black text-se-dark-blue">${r.total}</td>
            <td class="py-3 px-3 text-center font-bold text-accent-600">${r['طوارئ']}</td>
            <td class="py-3 px-3 text-center font-bold text-navy-800">${r['صيانة معدة']}</td>
            <td class="py-3 px-3 text-center font-bold text-se-mid-blue">${r['صيانة مغذي']}</td>
            <td class="py-3 px-3 text-center font-bold text-se-tertiary-orange">${r.C4C}</td>
            <td class="py-3 px-3 text-center font-extrabold text-se-tertiary-green">${r.approved}</td>
            <td class="py-3 px-3 text-center font-extrabold text-se-tertiary-red">${r.flagged}</td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-2">
                <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full ${barCls} rounded-full" style="width:${rate}%"></div>
                </div>
                <span class="text-xs font-extrabold text-se-dark-blue w-9 text-left">${rate}%</span>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  function openReportPrintPreview(htmlContent: string, fileName = ''): void {
    currentReportFileName = fileName || `التقرير_التنفيذي_${todayISO()}`;
    const pa = document.getElementById('printArea');
    const pb = document.getElementById('printPreviewBody');
    const pm = document.getElementById('printPreviewModal');
    if (pa) pa.innerHTML = htmlContent;
    if (pb) pb.innerHTML = htmlContent;
    if (pm) pm.classList.remove('hidden');
    refreshLucideIcons();
  }

  function triggerNativePdfPrint(): void {
    window.print();
  }

  async function downloadDirectPdf(): Promise<void> {
    const btn = document.getElementById('btnDownloadPdfDirect') as HTMLButtonElement | null;
    const sourceEl = document.getElementById('printPreviewBody');
    if (!sourceEl || !sourceEl.innerHTML.trim()) {
      ctx.showToast('لا يوجد محتوى لتصديره حالياً', 'warning');
      return;
    }

    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>جاري تجهيز ملف PDF...</span>';
    }

    try {
      const clone = sourceEl.cloneNode(true) as HTMLElement;
      clone.style.width = '1040px';
      clone.style.padding = '20px';
      clone.style.background = '#ffffff';
      clone.style.direction = 'rtl';
      clone.style.fontFamily = 'Cairo, sans-serif';

      const opt = {
        margin: [8, 8, 8, 8] as [number, number, number, number],
        filename: `${currentReportFileName}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.96 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const },
        pagebreak: { mode: ['css', 'legacy'], before: '.page-break' },
      };

      await (html2pdf() as any).set(opt).from(clone).save();
      ctx.showToast('تم حفظ وتنزيل ملف PDF بنجاح', 'success');
    } catch {
      ctx.showToast('تعذر توليد ملف PDF مباشرة، سيتم فتح نافذة الطباعة كبديل', 'warning');
      triggerNativePdfPrint();
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origHtml;
        refreshLucideIcons();
      }
    }
  }

  function downloadReportHtml(): void {
    const content = document.getElementById('printArea')?.innerHTML || '';
    const fullHtml = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>${escapeHtml(currentReportFileName)}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"><\/script>
      <script>
        tailwind.config = {
          theme: {
            extend: {
              fontFamily: { cairo: ['Cairo', 'sans-serif'] },
              colors: {
                navy: { 50: '#eef3f9', 100: '#d5e2f0', 200: '#abc5e1', 700: '#163b6b', 800: '#0f2f57', 900: '#0B2545', 950: '#07182e' },
                accent: { 50: '#fff4ee', 100: '#ffe5d6', 500: '#F26522', 600: '#d95314', 700: '#b8420d' },
                slatebg: '#F4F7FA'
              }
            }
          }
        };
      <\/script>
      <style>body{font-family:'Cairo',sans-serif;padding:24px;background:#F4F7FA;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact;} .page-break{page-break-before:always;} table{border-collapse:collapse;width:100%;} @media print{.no-print{display:none!important;} body{background:#fff;padding:0;}}</style>
    </head><body>
      <div class="no-print mb-4 flex justify-end"><button onclick="window.print()" style="background:#F26522;color:#fff;padding:10px 20px;border-radius:10px;font-weight:bold;border:none;cursor:pointer;font-family:'Cairo',sans-serif;">طباعة / حفظ PDF</button></div>
      ${content}
    </body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentReportFileName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    ctx.showToast('تم تنزيل ملف HTML منسّقاً وجاهزاً للطباعة', 'success');
  }

  function exportDashboardPdf(): void {
    const filtered = getFilteredDashboardInvoices();
    const filterInfo = getActiveDashFilterInfo();
    const session = ctx.getSession();

    const captureChartImg = (id: string) => {
      const c = document.getElementById(id) as HTMLCanvasElement | null;
      if (!c || !c.width || !c.height) return '';
      try {
        return c.toDataURL('image/png', 1.0);
      } catch {
        return '';
      }
    };

    const imgWorkTypes = captureChartImg('chartWorkTypes');
    const imgContractors = captureChartImg('chartContractors');
    const imgOffices = captureChartImg('chartOffices');
    const imgWorkDescs = captureChartImg('chartWorkDescs');
    const imgTopDelayNotes = captureChartImg('chartTopDelayNotes');
    const imgDelayByContractor = captureChartImg('chartDelayByContractor');

    const kpiHtml = document.getElementById('dashKpiGrid')?.innerHTML || '';
    const wtBreakdownHtml = document.getElementById('workTypesBreakdown')?.innerHTML || '';
    const wtTotal = filtered.length;

    const filterChips: Array<[string, string]> = [
      ['المقاول', filterInfo.contractor || 'كل المقاولين'],
      ['المكتب', filterInfo.office || 'كل المكاتب'],
      ['نوع العمل', filterInfo.workType || 'كل أنواع الأعمال'],
      ['الاستشاري', filterInfo.consultant || 'كل الاستشاريين'],
      ['الحالة', filterInfo.status || 'كل الحالات'],
    ];

    const dashboardHtml = `
      <div class="space-y-5" dir="rtl" style="font-family:'Cairo',sans-serif;">
        <div style="background-color:#0B2545;color:#ffffff;border-radius:16px;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="margin:0;font-size:20px;font-weight:900;color:#ffffff;">لوحة التحكم التنفيذية (Dashboard) — فواتير الصيانة والطوارئ</h1>
            <p style="margin:4px 0 0;font-size:12px;color:#cbd5e1;font-weight:600;">قسم استلام الأصول — نسخة مصدّرة مطابقة لواجهة لوحة التحكم</p>
          </div>
          <div style="text-align:left;font-size:12px;color:#e2e8f0;line-height:1.8;">
            <div>تاريخ التصدير: <strong style="color:#ffffff;">${formatNow()}</strong></div>
            <div>المُصدر: <strong style="color:#ffffff;">${escapeHtml(session ? session.name : '')}</strong></div>
          </div>
        </div>

        <div style="background:#ffffff;border:1px solid #cbd5e1;border-radius:14px;padding:12px 16px;">
          <div style="font-size:12px;font-weight:800;color:#0B2545;margin-bottom:8px;">معايير التصفية المطبّقة على لوحة التحكم (${wtTotal} فاتورة):</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${filterChips
              .map(
                ([k, v]) => `
              <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#eef3f9;border:1px solid #cbd5e1;font-size:11px;font-weight:700;color:#0B2545;">
                ${escapeHtml(k)}: <strong style="color:#d95314;">${escapeHtml(v)}</strong>
              </span>
            `
              )
              .join('')}
          </div>
        </div>

        <div style="pointer-events:none;">${kpiHtml}</div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200">
          <h3 class="text-sm font-extrabold text-se-dark-blue mb-3">توزيع أنواع الأعمال (الإجمالي: ${wtTotal})</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div class="flex justify-center">
              ${imgWorkTypes ? `<img src="${imgWorkTypes}" alt="توزيع أنواع الأعمال" style="max-height:210px;object-fit:contain;" />` : ''}
            </div>
            <div class="grid grid-cols-2 gap-2">${wtBreakdownHtml}</div>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200">
          <h3 class="text-sm font-extrabold text-se-dark-blue mb-3">عدد الفواتير حسب المقاول وحالة الاعتماد</h3>
          ${imgContractors ? `<img src="${imgContractors}" alt="المقاولون" style="width:100%;max-height:320px;object-fit:contain;" />` : ''}
        </div>

        <div class="page-break"></div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white p-5 rounded-2xl border border-slate-200">
            <h3 class="text-sm font-extrabold text-se-dark-blue mb-3">توزيع الفواتير حسب المكاتب</h3>
            ${imgOffices ? `<img src="${imgOffices}" alt="المكاتب" style="width:100%;max-height:260px;object-fit:contain;" />` : ''}
          </div>
          <div class="bg-white p-5 rounded-2xl border border-slate-200">
            <h3 class="text-sm font-extrabold text-se-dark-blue mb-3">أكثر أوصاف الأعمال تكراراً</h3>
            ${imgWorkDescs ? `<img src="${imgWorkDescs}" alt="أوصاف الأعمال" style="width:100%;max-height:260px;object-fit:contain;" />` : ''}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white p-5 rounded-2xl border border-slate-200">
            <h3 class="text-sm font-extrabold text-se-dark-blue mb-3">مؤشر أبرز أسباب تأخر إنجاز الفواتير</h3>
            ${imgTopDelayNotes ? `<img src="${imgTopDelayNotes}" alt="أسباب التأخير" style="width:100%;max-height:260px;object-fit:contain;" />` : ''}
          </div>
          <div class="bg-white p-5 rounded-2xl border border-slate-200">
            <h3 class="text-sm font-extrabold text-se-dark-blue mb-3">مؤشر أسباب تأخر إنجاز الفواتير حسب المقاول (أكثر 5 مقاولين)</h3>
            ${imgDelayByContractor ? `<img src="${imgDelayByContractor}" alt="التأخير حسب المقاول" style="width:100%;max-height:260px;object-fit:contain;" />` : ''}
          </div>
        </div>
      </div>
    `;

    ctx.logAudit('تصدير Dashboard PDF', `تصدير لوحة التحكم (${filterInfo.summaryText})`);
    openReportPrintPreview(dashboardHtml, `Dashboard_فواتير_الصيانة${filterInfo.fileSuffix}_${todayISO()}`);
  }

  function mapInvoiceRowForExcel(i: InvoiceRecord, idx: number) {
    const sla = getInvoiceSlaInfo(i);
    return {
      'رقم': i.seq || idx + 1,
      'رقم امر العمل': String(i.wo || ''),
      'المقاول': String(i.contractor || ''),
      'الاستشاري': String(i.consultant || ''),
      'تاريخ الفاتورة': String(i.invoiceDate || ''),
      'نوع العمل': String(i.workType || ''),
      'وصف العمل': String(i.workDesc || ''),
      'نوع المعدة': String(i.equipType || ''),
      'الموقع الوظيفي': String(i.funcLoc || ''),
      'المكتب': String(i.office || ''),
      'تاريخ تسليم الفاتورة للأصول': String(i.deliveryDate || ''),
      'المدة (أيام عمل)': String(sla.daysText || ''),
      'التصنيف': String(sla.category || ''),
      'الحالة': String(i.status || ''),
      'ملاحظة': String(i.note || ''),
      'حالة التنفيذ': String(i.quality || ''),
      'عدد الصور': (i.photos && i.photos.length) || 0,
      'مسار صور Dropbox':
        i.photos && i.photos.length
          ? i.photos.map((p) => p.oneDrivePath).join(' | ').slice(0, 30000)
          : '',
    };
  }

  function downloadWorkbook(
    sheets: Array<{ name: string; rows: Array<Record<string, unknown>> }>,
    fileNameBase: string
  ): void {
    const wb = XLSX.utils.book_new();
    sheets.forEach((s) => {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s.rows), s.name);
    });
    const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbOut], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileNameBase}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function exportDashboardExcel(): void {
    const filtered = getFilteredDashboardInvoices();
    const filterInfo = getActiveDashFilterInfo();
    if (!filtered.length) {
      ctx.showToast('لا توجد فواتير مطابقة للفلاتر الحالية لتصديرها', 'warning');
      return;
    }

    const s1Data = filtered.map(mapInvoiceRowForExcel);
    const s2Data = buildScorecardData(filtered).map((r) => ({
      'المقاول': String(r.contractor || ''),
      'الإجمالي': r.total,
      'طوارئ': r['طوارئ'],
      'صيانة معدة': r['صيانة معدة'],
      'صيانة مغذي': r['صيانة مغذي'],
      C4C: r.C4C,
      'المعتمد': r.approved,
      'المرفوض/الملاحظات': r.flagged,
      'نسبة الاعتماد %': r.total ? Math.round((r.approved / r.total) * 100) + '%' : '0%',
    }));
    const s3Data = [
      { 'المعيار': 'المقاول', 'القيمة المختارة': filterInfo.contractor || 'كل المقاولين' },
      { 'المعيار': 'المكتب', 'القيمة المختارة': filterInfo.office || 'كل المكاتب' },
      { 'المعيار': 'نوع العمل', 'القيمة المختارة': filterInfo.workType || 'كل أنواع الأعمال' },
      { 'المعيار': 'الاستشاري', 'القيمة المختارة': filterInfo.consultant || 'كل الاستشاريين' },
      { 'المعيار': 'الحالة', 'القيمة المختارة': filterInfo.status || 'كل الحالات' },
      { 'المعيار': 'إجمالي الفواتير المصدّرة', 'القيمة المختارة': filtered.length },
      { 'المعيار': 'تاريخ التصدير', 'القيمة المختارة': formatNow() },
    ];

    try {
      downloadWorkbook(
        [
          { name: 'الفواتير المفلترة', rows: s1Data },
          { name: 'ملخص المقاولين', rows: s2Data },
          { name: 'معايير التصفية', rows: s3Data },
        ],
        `فواتير_Dashboard${filterInfo.fileSuffix}_${todayISO()}`
      );
      ctx.logAudit('تصدير Excel (حسب الفلتر)', `تم تصدير ${s1Data.length} فاتورة (${filterInfo.summaryText})`);
      ctx.showToast(`تم تصدير ملف Excel المفلتر (${s1Data.length} فاتورة) بنجاح`, 'success');
    } catch {
      ctx.showToast('تعذر تنزيل ملف Excel، يرجى إعادة المحاولة', 'error');
    }
  }

  function exportFilteredTableExcel(
    filtered: InvoiceRecord[],
    filterSummary: string,
    fileSuffix = ''
  ): void {
    if (!filtered.length) {
      ctx.showToast('لا توجد فواتير معروضة في الجدول لتصديرها', 'warning');
      return;
    }

    const s1Data = filtered.map(mapInvoiceRowForExcel);
    try {
      downloadWorkbook(
        [{ name: 'فواتير الجدول', rows: s1Data }],
        `سجل_الفواتير${fileSuffix}_${todayISO()}`
      );
      ctx.logAudit(
        'تصدير Excel للجدول',
        `تم تصدير ${s1Data.length} فاتورة معروضة في الجدول (${filterSummary})`
      );
      ctx.showToast(`تم تصدير ملف Excel للجدول (${s1Data.length} فاتورة) بنجاح`, 'success');
    } catch {
      ctx.showToast('تعذر تنزيل ملف Excel، يرجى إعادة المحاولة', 'error');
    }
  }

  function exportFullExcel(): void {
    const all = ctx.getInvoices();
    const s1Data = all.map(mapInvoiceRowForExcel);
    const s2Data = buildScorecardData(all).map((r) => ({
      'المقاول': String(r.contractor || ''),
      'الإجمالي': r.total,
      'طوارئ': r['طوارئ'],
      'صيانة معدة': r['صيانة معدة'],
      'صيانة مغذي': r['صيانة مغذي'],
      C4C: r.C4C,
      'المعتمد': r.approved,
      'المرفوض/الملاحظات': r.flagged,
      'نسبة الاعتماد %': r.total ? Math.round((r.approved / r.total) * 100) + '%' : '0%',
    }));
    const s3Data = DELAY_OBSERVATIONS.map((d) => ({
      'المقاول': String(d.contractor || ''),
      'أبرز ملاحظات تأخير إنجاز الفواتير': String(d.note || ''),
    }));

    try {
      downloadWorkbook(
        [
          { name: 'الفواتير التفصيلية', rows: s1Data },
          { name: 'ملخص المقاولين', rows: s2Data },
          { name: 'ملاحظات التأخير', rows: s3Data },
        ],
        `فواتير_الصيانة_والطوارئ_شامل_${todayISO()}`
      );
      ctx.logAudit('تصدير Excel شامل', `تم تصدير ${s1Data.length} فاتورة في ملف Excel متعدد الأوراق`);
      ctx.showToast(`تم تصدير ملف Excel الشامل (${s1Data.length} فاتورة) بنجاح`, 'success');
    } catch {
      ctx.showToast('تعذر تنزيل ملف Excel، يرجى إعادة المحاولة', 'error');
    }
  }

  function printExecutiveReport(): void {
    const data = ctx.getInvoices();
    const session = ctx.getSession();
    const total = data.length;
    const approved = data.filter((i) => i.status === 'معتمد').length;
    const emergency = data.filter((i) => i.workType === 'طوارئ').length;
    const flagged = data.filter((i) => i.status === 'مرفوض' || i.status === 'ملاحظات معلقة').length;
    const scorecard = buildScorecardData(data);

    const reportHtml = `
      <div class="border-b-4 border-navy-900 pb-4 mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-se-dark-blue">التقرير التنفيذي الشامل لفواتير الصيانة والطوارئ</h1>
          <p class="text-xs text-slate-600 mt-1">قسم استلام الأصول — صادر من المنصة الرقمية الموحّدة</p>
        </div>
        <div class="text-left text-xs text-slate-600">
          <div>تاريخ الإصدار: <b>${formatNow()}</b></div>
          <div>المُصدر: <b>${escapeHtml(session ? session.name : '')}</b></div>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-3 mb-6">
        <div class="p-3 border border-slate-300 rounded-xl"><div class="text-xs text-slate-500">إجمالي الفواتير</div><div class="text-xl font-black">${total}</div></div>
        <div class="p-3 border border-slate-300 rounded-xl"><div class="text-xs text-slate-500">المعتمدة</div><div class="text-xl font-black text-se-tertiary-green">${approved} (${total ? Math.round((approved / total) * 100) : 0}%)</div></div>
        <div class="p-3 border border-slate-300 rounded-xl"><div class="text-xs text-slate-500">فواتير الطوارئ</div><div class="text-xl font-black text-accent-600">${emergency}</div></div>
        <div class="p-3 border border-slate-300 rounded-xl"><div class="text-xs text-slate-500">مرفوضة / ملاحظات</div><div class="text-xl font-black text-se-tertiary-red">${flagged}</div></div>
      </div>

      <h2 class="text-base font-extrabold text-se-dark-blue mb-2">1. مصفوفة أداء المقاولين حسب نوع العمل</h2>
      <table class="w-full text-xs border border-slate-300 mb-6">
        <thead class="bg-slate-100">
          <tr>
            <th class="border border-slate-300 p-2 text-right">المقاول</th>
            <th class="border border-slate-300 p-2">الإجمالي</th>
            <th class="border border-slate-300 p-2">طوارئ</th>
            <th class="border border-slate-300 p-2">صيانة معدة</th>
            <th class="border border-slate-300 p-2">صيانة مغذي</th>
            <th class="border border-slate-300 p-2">C4C</th>
            <th class="border border-slate-300 p-2">معتمد</th>
            <th class="border border-slate-300 p-2">نسبة الاعتماد</th>
          </tr>
        </thead>
        <tbody>
          ${scorecard
            .map(
              (r) => `
            <tr>
              <td class="border border-slate-300 p-1.5 font-bold">${escapeHtml(r.contractor)}</td>
              <td class="border border-slate-300 p-1.5 text-center font-bold">${r.total}</td>
              <td class="border border-slate-300 p-1.5 text-center">${r['طوارئ']}</td>
              <td class="border border-slate-300 p-1.5 text-center">${r['صيانة معدة']}</td>
              <td class="border border-slate-300 p-1.5 text-center">${r['صيانة مغذي']}</td>
              <td class="border border-slate-300 p-1.5 text-center">${r.C4C}</td>
              <td class="border border-slate-300 p-1.5 text-center">${r.approved}</td>
              <td class="border border-slate-300 p-1.5 text-center font-bold">${r.total ? Math.round((r.approved / r.total) * 100) : 0}%</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <h2 class="text-base font-extrabold text-se-dark-blue mb-2">2. أبرز أسباب وملاحظات تأخير إنجاز الفواتير</h2>
      <table class="w-full text-xs border border-slate-300 mb-6">
        <thead class="bg-slate-100"><tr><th class="border border-slate-300 p-2 text-right w-1/3">المقاول</th><th class="border border-slate-300 p-2 text-right">الملاحظة</th></tr></thead>
        <tbody>
          ${DELAY_OBSERVATIONS.map(
            (d) => `<tr><td class="border border-slate-300 p-1.5 font-bold">${escapeHtml(d.contractor)}</td><td class="border border-slate-300 p-1.5">${escapeHtml(d.note)}</td></tr>`
          ).join('')}
        </tbody>
      </table>

      <div class="page-break"></div>
      <h2 class="text-base font-extrabold text-se-dark-blue mb-2">3. الجدول التفصيلي الكامل للفواتير (${total} فاتورة)</h2>
      <table class="w-full text-[11px] border border-slate-300">
        <thead class="bg-slate-100">
          <tr>
            <th class="border border-slate-300 p-1.5">أمر العمل</th>
            <th class="border border-slate-300 p-1.5">المقاول</th>
            <th class="border border-slate-300 p-1.5">الاستشاري</th>
            <th class="border border-slate-300 p-1.5">تاريخ الفاتورة</th>
            <th class="border border-slate-300 p-1.5">نوع العمل</th>
            <th class="border border-slate-300 p-1.5">وصف العمل</th>
            <th class="border border-slate-300 p-1.5">نوع المعدة</th>
            <th class="border border-slate-300 p-1.5">الموقع الوظيفي</th>
            <th class="border border-slate-300 p-1.5">المكتب</th>
            <th class="border border-slate-300 p-1.5">التسليم للأصول</th>
            <th class="border border-slate-300 p-1.5">المدة</th>
            <th class="border border-slate-300 p-1.5">التصنيف</th>
            <th class="border border-slate-300 p-1.5">الحالة والملاحظة</th>
          </tr>
        </thead>
        <tbody>
          ${data
            .map((i) => {
              const sla = getInvoiceSlaInfo(i);
              return `
                <tr>
                  <td class="border border-slate-300 p-1 font-mono">${escapeHtml(i.wo)}</td>
                  <td class="border border-slate-300 p-1 font-bold">${escapeHtml(i.contractor)}</td>
                  <td class="border border-slate-300 p-1">${escapeHtml(i.consultant)}</td>
                  <td class="border border-slate-300 p-1 font-mono">${escapeHtml(i.invoiceDate || '-')}</td>
                  <td class="border border-slate-300 p-1">${escapeHtml(i.workType)}</td>
                  <td class="border border-slate-300 p-1">${escapeHtml(i.workDesc)}</td>
                  <td class="border border-slate-300 p-1">${escapeHtml(i.equipType)}</td>
                  <td class="border border-slate-300 p-1 font-mono">${escapeHtml(i.funcLoc || '-')}</td>
                  <td class="border border-slate-300 p-1">${escapeHtml(i.office)}</td>
                  <td class="border border-slate-300 p-1 font-mono">${escapeHtml(i.deliveryDate || '-')}</td>
                  <td class="border border-slate-300 p-1 font-bold">${escapeHtml(sla.daysText)}</td>
                  <td class="border border-slate-300 p-1 font-bold">${escapeHtml(sla.category)}</td>
                  <td class="border border-slate-300 p-1">${escapeHtml(i.status)}${i.note ? ' — ' + escapeHtml(i.note) : ''}</td>
                </tr>`;
            })
            .join('')}
        </tbody>
      </table>
    `;
    ctx.logAudit('طباعة تقرير PDF', 'إصدار التقرير التنفيذي الشامل للطباعة');
    openReportPrintPreview(reportHtml, `التقرير_التنفيذي_الشامل_${todayISO()}`);
  }

  function printSingleWorkOrder(id: string | null): void {
    if (!id) return;
    const inv = ctx.getInvoices().find((i) => i.id === id);
    if (!inv) return;
    const cardHtml = `
      <div class="border-2 border-navy-900 rounded-2xl p-6">
        <div class="flex justify-between items-center border-b-2 border-slate-200 pb-4 mb-5">
          <div>
            <h1 class="text-xl font-black text-se-dark-blue">بطاقة أمر عمل فاتورة صيانة / طوارئ</h1>
            <p class="text-xs text-slate-500">رقم أمر العمل: <b class="font-mono text-sm">${escapeHtml(inv.wo)}</b></p>
          </div>
          <div class="text-xs text-left">تاريخ الطباعة: ${formatNow()}</div>
        </div>
        <div class="grid grid-cols-2 gap-3 text-xs mb-5">
          <div class="p-2.5 border rounded-lg"><b>المقاول:</b> ${escapeHtml(inv.contractor)}</div>
          <div class="p-2.5 border rounded-lg"><b>الاستشاري:</b> ${escapeHtml(inv.consultant)}</div>
          <div class="p-2.5 border rounded-lg"><b>نوع العمل:</b> ${escapeHtml(inv.workType)}</div>
          <div class="p-2.5 border rounded-lg"><b>وصف العمل:</b> ${escapeHtml(inv.workDesc)}</div>
          <div class="p-2.5 border rounded-lg"><b>نوع المعدة:</b> ${escapeHtml(inv.equipType)}</div>
          <div class="p-2.5 border rounded-lg"><b>الموقع الوظيفي:</b> ${escapeHtml(inv.funcLoc || '-')}</div>
          <div class="p-2.5 border rounded-lg"><b>المكتب:</b> ${escapeHtml(inv.office)}</div>
          <div class="p-2.5 border rounded-lg"><b>تاريخ التسليم:</b> ${escapeHtml(inv.deliveryDate || '-')}</div>
          <div class="p-2.5 border rounded-lg"><b>حالة الاعتماد:</b> ${escapeHtml(inv.status)}</div>
          <div class="p-2.5 border rounded-lg"><b>الملاحظات:</b> ${escapeHtml(inv.note || '-')}</div>
        </div>
        ${
          inv.photos && inv.photos.length
            ? `
          <h3 class="text-sm font-extrabold mb-2">الصور الميدانية المرفقة:</h3>
          <div class="grid grid-cols-2 gap-3">
            ${inv.photos
              .map(
                (p) =>
                  `<div class="border rounded-xl p-2"><img src="${p.dataUrl}" class="w-full h-44 object-cover rounded-lg mb-1"/><div class="text-[11px] font-bold">${escapeHtml(p.stage)}</div></div>`
              )
              .join('')}
          </div>
        `
            : ''
        }
      </div>
    `;
    openReportPrintPreview(cardHtml, `بطاقة_امر_عمل_${inv.wo}_${todayISO()}`);
  }

  window.addEventListener('se-theme-changed', () => {
    try {
      if (ctx.getInvoices().length > 0) {
        renderDashboard();
      }
    } catch {
      /* ignore */
    }
  });

  return {
    renderDashboard,
    resetDashFilters,
    selectDashKpiCard,
    closeDashDrilldown,
    renderDashDrilldown,
    renderReportsModule,
    exportDashboardPdf,
    exportDashboardExcel,
    exportFilteredTableExcel,
    exportFullExcel,
    downloadDirectPdf,
    triggerNativePdfPrint,
    downloadReportHtml,
    printExecutiveReport,
    printSingleWorkOrder,
    destroyAllCharts,
    resetActiveKpi,
  };
}
