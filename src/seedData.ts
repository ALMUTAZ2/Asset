import type { InvoiceRecord, ContractorRecord, StaffUser, AuditLogRecord } from './firestoreStore';

export const DEFAULT_CONTRACTOR_NAMES = [
  'الشركة العالمية', 'مؤسسة كنان العربية', 'شركة ديار الوطن', 'شركة رابكوا', 'شركة هيف',
  'شركة بن دلامة', 'مؤسسة سعيد عبدالله القحطاني', 'مؤسسة عباجة', 'شركة مستورة', 'شركة اسناد الطرق',
  'شركة الجهاز', 'مؤسسة ركن الفايزية', 'مؤسسة قوى البنية', 'البحر المتوسط', 'شركة الجازع',
  'شركة الجناحين', 'شركة الجوان المطوره', 'شركة الراجحي', 'شركة السبق العربي', 'شركة الطموح الجديد',
  'شركة بكري الصعب', 'شركة دسر العربية', 'شركة ناصر الوبران', 'مؤسسة اعمار الجنوب', 'مؤسسة المدخلي',
  'مؤسسة المنجوف', 'مؤسسة سليمان القسومي', 'مؤسسة أصالة الجزيرة', 'شركة العرض الانشائي', 'شركة الحمزي',
  'مؤسسة ساند للاعمال',
];

export const CONSULTANTS = ['علوم العمران', 'سعود كونسلت', 'محرم باخوم', 'حسن فقية'];
export const WORK_TYPES = ['طوارئ', 'صيانة معدة', 'C4C', 'صيانة مغذي'];
export const EQUIP_TYPES = [
  'OH', 'RMU', 'TR', 'UNIT+RMU', 'SWITCH', 'ROOM', 'MINIPILER',
  'UNIT', 'LVPD', 'LBS', 'REC', 'PACKAGE', 'مغذي', 'عمود',
];
export const OFFICES = ['صبيا', 'أبو عريش', 'فيفا', 'بيش', 'الحقو', 'جيزان', 'صامطة', 'بني مالك'];
export const WORK_DESCS = [
  'فحص وصيانة معدة', 'استبدال محول', 'عمل وصلة مستقيمة لكيبل مضروب', 'استبدال وحدة حلقية',
  'استبدال عمود', 'نهايه طرفيه', 'تمديد كيبل وعمل وصلة', 'شد شبكه',
  'استبدال لوحة توزيع هوائية', 'استبدال عوازل', 'استبدال ميني بيلر', 'حفر وتمديد كيبل', 'تأريض وحدة حلقية',
];
export const QUICK_REVIEW_NOTES = [
  'تم', 'غير معتمد', 'عدم توقيع GIS', 'عدم إنشاء المعدة على SAP',
  'ناقص نموذج اختبار ما قبل التشغيل', 'ناقص إرفاق المحول', 'الموقع الوظيفي ناقص',
  'صور غير مطابقة للأعمال', 'سوء جودة التنفيذ', 'عدم الالتزام بالشريط التحذيري',
];
export const DELAY_OBSERVATIONS = [
  { contractor: 'شركة هيف', note: 'إضافة المعدات في أعمال صيانة المغذيات' },
  { contractor: 'شركة الجهاز', note: 'إضافة بنود غير مطابقة للأعمال المنفذة' },
  { contractor: 'مؤسسة سعيد عبدالله القحطاني', note: 'إضافة بنود من مهام الصيانة لأعمال الطوارئ' },
  { contractor: 'مؤسسة ركن الفايزية', note: 'إضافة صور لا تتبع للأعمال المنفذة' },
  { contractor: 'شركة اسناد الطرق', note: 'عدم توقيع الفواتير من قسم GIS' },
  { contractor: 'شركة ديار الوطن', note: 'عدم إنشاء المعدات الجديدة أو المستبدلة على نظام SAP' },
  { contractor: 'مؤسسة عباجة', note: 'عدم وجود نموذج اختبار ما قبل التشغيل للمعدات الجديدة أو المستبدلة' },
  { contractor: 'شركة رابكوا', note: 'سوء جودة التنفيذ' },
  { contractor: 'مؤسسة قوى البنية', note: 'عدم توثيق الأعمال ومراحل العمل بشكل جيد' },
  { contractor: 'ملاحظة عامة', note: 'عدم الالتزام بالشريط التحذيري لأعمال الحفر والتمديد أو الجوينت' },
];

export function makeSamplePhotoSvg(wo: string, stage: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0B2545"/>
        <stop offset="100%" stop-color="#163b6b"/>
      </linearGradient>
    </defs>
    <rect width="600" height="400" fill="url(#g)"/>
    <rect x="24" y="24" width="552" height="352" rx="18" fill="none" stroke="#F26522" stroke-width="3" stroke-dasharray="10 6"/>
    <text x="300" y="165" text-anchor="middle" fill="#F26522" font-family="Cairo, sans-serif" font-size="26" font-weight="bold">توثيق ميداني — ${stage}</text>
    <text x="300" y="215" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="30" font-weight="bold">WO: ${wo}</text>
    <text x="300" y="265" text-anchor="middle" fill="#94a3b8" font-family="Cairo, sans-serif" font-size="16">منصة متابعة فواتير الصيانة والطوارئ</text>
  </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

export function buildSeedInvoices(): InvoiceRecord[] {
  const nowIso = new Date().toISOString();
  type CoreRow = Omit<InvoiceRecord, 'id' | 'checklist' | 'photos' | 'updatedAt'>;
  const coreRows: CoreRow[] = [
    { seq: 52, wo: '422073943', contractor: 'مؤسسة كنان العربية', consultant: 'علوم العمران', invoiceDate: '2026-10-12', workType: 'C4C', workDesc: 'استبدال عمود', equipType: 'OH', funcLoc: 'بدون', office: 'أبو عريش', deliveryDate: '2026-11-01', note: 'تم', status: 'معتمد', quality: 'ممتاز' },
    { seq: 54, wo: '422059055', contractor: 'مؤسسة كنان العربية', consultant: 'علوم العمران', invoiceDate: '2026-10-14', workType: 'C4C', workDesc: 'استبدال عمود', equipType: 'OH', funcLoc: 'بدون', office: 'أبو عريش', deliveryDate: '2026-11-01', note: 'تم', status: 'معتمد', quality: 'ممتاز' },
    { seq: 56, wo: '422073234', contractor: 'مؤسسة كنان العربية', consultant: 'علوم العمران', invoiceDate: '2026-10-15', workType: 'C4C', workDesc: 'استبدال عمود', equipType: 'OH', funcLoc: 'بدون', office: 'أبو عريش', deliveryDate: '2026-11-01', note: 'تم', status: 'معتمد', quality: 'ممتاز' },
    { seq: 68, wo: '422051184', contractor: 'مؤسسة كنان العربية', consultant: 'علوم العمران', invoiceDate: '2026-09-08', workType: 'C4C', workDesc: 'استبدال عمود', equipType: 'OH', funcLoc: 'بدون', office: 'أبو عريش', deliveryDate: '2026-11-01', note: 'غير معتمد', status: 'مرفوض', quality: 'جيد' },
    { seq: 72, wo: '422073843', contractor: 'مؤسسة كنان العربية', consultant: 'علوم العمران', invoiceDate: '2026-10-18', workType: 'طوارئ', workDesc: 'استبدال وحدة حلقية', equipType: 'SWITCH', funcLoc: '4400-JhS-060086', office: 'أبو عريش', deliveryDate: '2026-11-01', note: 'تم', status: 'معتمد', quality: 'ممتاز' },
    { seq: 9, wo: '421966027', contractor: 'مؤسسة كنان العربية', consultant: 'علوم العمران', invoiceDate: '2026-09-25', workType: 'صيانة معدة', workDesc: 'فحص وصيانة معدة', equipType: 'OH', funcLoc: '4400-JHS-090101', office: 'أبو عريش', deliveryDate: '2026-11-01', note: 'تم', status: 'معتمد', quality: 'جيد جداً' },
    { seq: 61, wo: '422073480', contractor: 'مؤسسة كنان العربية', consultant: 'علوم العمران', invoiceDate: '2026-10-20', workType: 'طوارئ', workDesc: 'عمل وصلة مستقيمة لكيبل مضروب', equipType: 'MINIPILER', funcLoc: '4400-JhS-090121', office: 'أبو عريش', deliveryDate: '2026-11-01', note: 'تم', status: 'معتمد', quality: 'ممتاز' },
    { seq: 79, wo: '421964907', contractor: 'مؤسسة كنان العربية', consultant: 'علوم العمران', invoiceDate: '2026-06-16', workType: 'طوارئ', workDesc: 'استبدال محول', equipType: 'OH', funcLoc: '4400-JhS-120044', office: 'أبو عريش', deliveryDate: '2026-11-01', note: 'ناقص إرفاق المحول', status: 'ملاحظات معلقة', quality: 'جيد' },
    { seq: 77, wo: '422051080', contractor: 'مؤسسة كنان العربية', consultant: 'علوم العمران', invoiceDate: '2026-09-10', workType: 'طوارئ', workDesc: 'استبدال محول', equipType: 'OH', funcLoc: '4400-JhS-200038', office: 'أبو عريش', deliveryDate: '2026-11-01', note: 'الموقع الوظيفي ناقص', status: 'ملاحظات معلقة', quality: 'جيد' },
    { seq: 70, wo: '422050882', contractor: 'مؤسسة كنان العربية', consultant: 'علوم العمران', invoiceDate: '2026-09-08', workType: 'طوارئ', workDesc: 'استبدال وحدة حلقية', equipType: 'SWITCH', funcLoc: '4400-JhS-090666', office: 'أبو عريش', deliveryDate: '2026-11-01', note: 'غير معتمد', status: 'مرفوض', quality: 'سوء جودة التنفيذ' },
    { seq: 101, wo: '421900080', contractor: 'شركة ديار الوطن', consultant: 'محرم باخوم', invoiceDate: '2026-09-12', workType: 'صيانة معدة', workDesc: 'فحص وصيانة معدة', equipType: 'OH', funcLoc: '4400-JIS-010001', office: 'بيش', deliveryDate: '2026-11-01', note: 'تم', status: 'معتمد', quality: 'ممتاز' },
    { seq: 100, wo: '421900902', contractor: 'شركة ديار الوطن', consultant: 'محرم باخوم', invoiceDate: '2026-09-15', workType: 'صيانة معدة', workDesc: 'فحص وصيانة معدة', equipType: 'OH', funcLoc: '4400-JIS-010002', office: 'بيش', deliveryDate: '2026-11-01', note: 'تم', status: 'معتمد', quality: 'جيد جداً' },
    { seq: 115, wo: '421897571', contractor: 'شركة ديار الوطن', consultant: 'علوم العمران', invoiceDate: '2026-10-05', workType: 'طوارئ', workDesc: 'استبدال محول', equipType: 'TR', funcLoc: '4400-JIS-010004', office: 'الحقو', deliveryDate: '2026-11-03', note: 'عدم إنشاء المعدة على SAP', status: 'ملاحظات معلقة', quality: 'جيد' },
    { seq: 136, wo: '421967838', contractor: 'الشركة العالمية', consultant: 'سعود كونسلت', invoiceDate: '2026-04-01', workType: 'صيانة معدة', workDesc: 'فحص وصيانة معدة', equipType: 'ROOM', funcLoc: '4400-JJS-150042', office: 'جيزان', deliveryDate: '2026-11-03', note: 'تم', status: 'معتمد', quality: 'ممتاز' },
    { seq: 137, wo: '421967513', contractor: 'الشركة العالمية', consultant: 'سعود كونسلت', invoiceDate: '2026-04-01', workType: 'صيانة معدة', workDesc: 'فحص وصيانة معدة', equipType: 'ROOM', funcLoc: '4400-JJS-150043', office: 'جيزان', deliveryDate: '2026-11-03', note: 'تم', status: 'معتمد', quality: 'ممتاز' },
    { seq: 262, wo: '421958953', contractor: 'شركة رابكوا', consultant: 'محرم باخوم', invoiceDate: '2026-05-01', workType: 'صيانة معدة', workDesc: 'فحص وصيانة معدة', equipType: 'OH', funcLoc: '4400-JHS-210011', office: 'صبيا', deliveryDate: '2026-11-04', note: 'قيد المراجعة', status: 'قيد المراجعة', quality: 'جيد' },
    { seq: 263, wo: '421922434', contractor: 'شركة رابكوا', consultant: 'محرم باخوم', invoiceDate: '2026-05-01', workType: 'صيانة معدة', workDesc: 'فحص وصيانة معدة', equipType: 'OH', funcLoc: '4400-JHS-210019', office: 'صبيا', deliveryDate: '2026-11-04', note: 'سوء جودة التنفيذ', status: 'مرفوض', quality: 'سوء جودة التنفيذ' },
    { seq: 236, wo: '421971726', contractor: 'شركة هيف', consultant: 'علوم العمران', invoiceDate: '2026-06-24', workType: 'طوارئ', workDesc: 'استبدال محول', equipType: 'OH', funcLoc: '4400-JBS-010276', office: 'بني مالك', deliveryDate: '2026-11-04', note: 'تم', status: 'معتمد', quality: 'ممتاز' },
    { seq: 340, wo: '422057429', contractor: 'شركة بن دلامة', consultant: 'سعود كونسلت', invoiceDate: '2026-08-08', workType: 'طوارئ', workDesc: 'نهايه طرفيه', equipType: 'SWITCH', funcLoc: '4400-JSS-480831', office: 'صامطة', deliveryDate: '2026-11-08', note: 'قيد المراجعة', status: 'قيد المراجعة', quality: 'جيد جداً' },
    { seq: 119, wo: '421987212', contractor: 'مؤسسة سعيد عبدالله القحطاني', consultant: 'حسن فقية', invoiceDate: '2026-07-06', workType: 'طوارئ', workDesc: 'عمل وصلة مستقيمة لكيبل مضروب', equipType: 'RMU', funcLoc: '4400-JIS-040058', office: 'بيش', deliveryDate: '2026-11-01', note: 'تم', status: 'معتمد', quality: 'ممتاز' },
    { seq: 244, wo: '421961139', contractor: 'مؤسسة عباجة', consultant: 'علوم العمران', invoiceDate: '2026-05-04', workType: 'طوارئ', workDesc: 'استبدال محول', equipType: 'OH', funcLoc: '4400-JFS-010642', office: 'فيفا', deliveryDate: '2026-11-04', note: 'ناقص نموذج اختبار ما قبل التشغيل', status: 'ملاحظات معلقة', quality: 'جيد' },
    { seq: 127, wo: '421804463', contractor: 'شركة مستورة', consultant: 'علوم العمران', invoiceDate: '2026-09-01', workType: 'صيانة مغذي', workDesc: 'استبدال عوازل', equipType: 'OH', funcLoc: 'ARDAH-B430', office: 'أبو عريش', deliveryDate: '2026-11-02', note: 'تم', status: 'معتمد', quality: 'ممتاز' },
    { seq: 341, wo: '421928733', contractor: 'شركة اسناد الطرق', consultant: 'سعود كونسلت', invoiceDate: '2026-05-18', workType: 'طوارئ', workDesc: 'استبدال محول', equipType: 'TR', funcLoc: '4400-JSS-480198', office: 'صامطة', deliveryDate: '2026-11-08', note: 'عدم توقيع GIS', status: 'ملاحظات معلقة', quality: 'جيد' },
  ];

  const contractorTargets: Array<[string, number]> = [
    ['الشركة العالمية', 138], ['مؤسسة كنان العربية', 136], ['شركة ديار الوطن', 111],
    ['شركة رابكوا', 78], ['شركة هيف', 30], ['شركة بن دلامة', 29],
    ['مؤسسة سعيد عبدالله القحطاني', 22], ['مؤسسة عباجة', 19], ['شركة مستورة', 5], ['شركة اسناد الطرق', 3],
  ];
  const workTypeTargets: Array<[string, number]> = [['طوارئ', 323], ['صيانة معدة', 232], ['C4C', 11], ['صيانة مغذي', 5]];
  const consultantTargets: Array<[string, number]> = [['علوم العمران', 219], ['سعود كونسلت', 185], ['محرم باخوم', 139], ['حسن فقية', 28]];
  const officeTargets: Array<[string, number]> = [
    ['صبيا', 162], ['أبو عريش', 151], ['فيفا', 75], ['بيش', 51],
    ['الحقو', 42], ['جيزان', 41], ['صامطة', 27], ['بني مالك', 22],
  ];
  const equipTargets: Array<[string, number]> = [
    ['OH', 229], ['RMU', 95], ['TR', 85], ['UNIT+RMU', 28], ['عمود', 24],
    ['SWITCH', 24], ['ROOM', 22], ['MINIPILER', 27], ['UNIT', 15], ['LVPD', 12], ['PACKAGE', 6], ['مغذي', 4],
  ];
  const descTargets: Array<[string, number]> = [
    ['فحص وصيانة معدة', 238], ['استبدال محول', 151], ['عمل وصلة مستقيمة لكيبل مضروب', 52],
    ['استبدال وحدة حلقية', 26], ['استبدال عمود', 24], ['نهايه طرفيه', 17],
    ['تمديد كيبل وعمل وصلة', 15], ['شد شبكه', 12], ['استبدال لوحة توزيع هوائية', 10],
    ['استبدال عوازل', 8], ['استبدال ميني بيلر', 6], ['حفر وتمديد كيبل', 6], ['تأريض وحدة حلقية', 6],
  ];

  const buildPool = (targets: Array<[string, number]>, field: keyof CoreRow) => {
    const used: Record<string, number> = {};
    coreRows.forEach((r) => {
      const val = String(r[field]);
      used[val] = (used[val] || 0) + 1;
    });
    const pool: string[] = [];
    targets.forEach(([val, count]) => {
      const rem = Math.max(0, count - (used[val] || 0));
      for (let i = 0; i < rem; i++) pool.push(val);
    });
    return pool;
  };

  const contractorsPool = buildPool(contractorTargets, 'contractor');
  const workTypesPool = buildPool(workTypeTargets, 'workType');
  const consultantsPool = buildPool(consultantTargets, 'consultant');
  const officesPool = buildPool(officeTargets, 'office');
  const equipsPool = buildPool(equipTargets, 'equipType');
  const descsPool = buildPool(descTargets, 'workDesc');

  const statusNoteSpecs: Array<{ status: InvoiceRecord['status']; note: string; deliveryDate: string }> = [];
  const pushSN = (n: number, status: InvoiceRecord['status'], note: string, deliveryPool: string[]) => {
    for (let i = 0; i < n; i++) {
      statusNoteSpecs.push({ status, note, deliveryDate: deliveryPool[i % deliveryPool.length] });
    }
  };

  const usedApproved = coreRows.filter((r) => r.status === 'معتمد').length;
  const usedRejected = coreRows.filter((r) => r.status === 'مرفوض').length;
  const usedFlagged = coreRows.filter((r) => r.status === 'ملاحظات معلقة').length;
  const usedPending = coreRows.filter((r) => r.status === 'قيد المراجعة').length;

  pushSN(216 - usedApproved, 'معتمد', 'تم', ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-08', '2026-11-09']);

  const delayNotesWeighted: Array<[InvoiceRecord['status'], string, number]> = [
    ['مرفوض', 'غير معتمد', Math.max(0, 14 - usedRejected)],
    ['ملاحظات معلقة', 'عدم توقيع GIS', 7],
    ['ملاحظات معلقة', 'عدم إنشاء المعدة على SAP', 5],
    ['ملاحظات معلقة', 'ناقص نموذج اختبار ما قبل التشغيل', 4],
    ['مرفوض', 'سوء جودة التنفيذ', 3],
    ['ملاحظات معلقة', 'الموقع الوظيفي ناقص', 2],
    ['ملاحظات معلقة', 'ناقص إرفاق المحول', 1],
  ];
  let addedRF = 0;
  const targetRF = (17 - usedRejected) + (15 - usedFlagged);
  delayNotesWeighted.forEach(([st, nt, cnt]) => {
    for (let i = 0; i < cnt && addedRF < targetRF; i++) {
      statusNoteSpecs.push({ status: st, note: nt, deliveryDate: '2026-11-01' });
      addedRF++;
    }
  });

  const remPending = Math.max(0, 323 - usedPending);
  const newCount = Math.round(remPending * 0.22);
  const lateCount = Math.round(remPending * 0.18);
  const escalatedCount = remPending - newCount - lateCount;
  pushSN(newCount, 'قيد المراجعة', 'قيد المراجعة', ['2026-11-18', '2026-11-17', '2026-11-16']);
  pushSN(lateCount, 'قيد المراجعة', 'قيد المراجعة', ['2026-11-15', '2026-11-12']);
  pushSN(escalatedCount, 'قيد المراجعة', 'قيد المراجعة', ['2026-11-10', '2026-11-09', '2026-11-08', '2026-11-04', '2026-11-03', '2026-11-01']);

  const allRaw: CoreRow[] = [...coreRows];
  const remainingTotal = 571 - coreRows.length;
  const invDates = ['2026-04-01', '2026-05-04', '2026-06-16', '2026-07-09', '2026-08-12', '2026-08-23', '2026-09-08', '2026-09-21', '2026-10-08', '2026-10-19'];
  const prefixMap: Record<string, string> = {
    صبيا: 'JSS',
    'أبو عريش': 'JHS',
    فيفا: 'JFS',
    بيش: 'JIS',
    الحقو: 'JHS',
    جيزان: 'JJS',
    صامطة: 'JSS',
    'بني مالك': 'JBS',
  };

  for (let i = 0; i < remainingTotal; i++) {
    const sn = statusNoteSpecs[i] || { status: 'قيد المراجعة' as const, note: 'قيد المراجعة', deliveryDate: '2026-11-09' };
    const wt = workTypesPool[i] || 'طوارئ';
    const desc = descsPool[i] || (wt === 'صيانة معدة' ? 'فحص وصيانة معدة' : 'استبدال محول');
    const off = officesPool[i] || 'صبيا';
    allRaw.push({
      seq: coreRows.length + i + 1,
      wo: String(421900100 + i * 317),
      contractor: contractorsPool[i] || 'الشركة العالمية',
      consultant: consultantsPool[i] || 'علوم العمران',
      invoiceDate: invDates[i % invDates.length],
      workType: wt,
      workDesc: desc,
      equipType: equipsPool[i] || 'OH',
      funcLoc: `4400-${prefixMap[off] || 'JHS'}-${String(10000 + i * 17).slice(0, 6)}`,
      office: off,
      deliveryDate: sn.deliveryDate,
      note: sn.note,
      status: sn.status,
      quality: sn.status === 'مرفوض' ? 'سوء جودة التنفيذ' : (sn.status === 'معتمد' ? 'ممتاز' : 'جيد جداً'),
    });
  }

  return allRaw.map((item, idx) => ({
    id: 'inv_' + (1000 + idx),
    ...item,
    checklist: {
      gis: item.status === 'معتمد',
      sap: item.status === 'معتمد',
      pretest: item.status === 'معتمد',
      photosMatch: true,
      warningTape: item.status !== 'مرفوض',
    },
    photos: idx < 12
      ? [
          {
            name: `WO_${item.wo}_after.jpg`,
            stage: 'بعد التنفيذ',
            dataUrl: makeSamplePhotoSvg(item.wo, 'بعد التنفيذ'),
            oneDrivePath: `/Apps/Invoice Tracker – Asset Receiving/${item.contractor}/${item.wo}/WO_${item.wo}_after.jpg`,
            synced: false,
          },
        ]
      : [],
    updatedAt: nowIso,
  }));
}

export function buildSeedContractors(): ContractorRecord[] {
  return [
    { id: 'ctr_1', name: 'الشركة العالمية', pin: '1001', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_2', name: 'مؤسسة كنان العربية', pin: '1002', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_3', name: 'شركة ديار الوطن', pin: '1003', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_4', name: 'شركة رابكوا', pin: '1004', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_5', name: 'شركة هيف', pin: '1005', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_6', name: 'شركة بن دلامة', pin: '1006', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_7', name: 'مؤسسة سعيد عبدالله القحطاني', pin: '1007', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_8', name: 'مؤسسة عباجة', pin: '1008', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_9', name: 'شركة مستورة', pin: '1009', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_10', name: 'شركة اسناد الطرق', pin: '1010', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_11', name: 'شركة الجهاز', pin: '1011', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_12', name: 'مؤسسة ركن الفايزية', pin: '1012', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_13', name: 'مؤسسة قوى البنية', pin: '1013', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_14', name: 'البحر المتوسط', pin: '1014', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_15', name: 'شركة الجازع', pin: '1015', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_16', name: 'شركة الجناحين', pin: '1016', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_17', name: 'شركة الجوان المطوره', pin: '1017', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_18', name: 'شركة الراجحي', pin: '1018', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_19', name: 'شركة السبق العربي', pin: '1019', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_20', name: 'شركة الطموح الجديد', pin: '1020', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_21', name: 'شركة بكري الصعب', pin: '1021', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_22', name: 'شركة دسر العربية', pin: '1022', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_23', name: 'شركة ناصر الوبران', pin: '1023', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_24', name: 'مؤسسة اعمار الجنوب', pin: '1024', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_25', name: 'مؤسسة المدخلي', pin: '1025', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_26', name: 'مؤسسة المنجوف', pin: '1026', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_27', name: 'مؤسسة سليمان القسومي', pin: '1027', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_28', name: 'مؤسسة أصالة الجزيرة', pin: '1028', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_29', name: 'شركة العرض الانشائي', pin: '1029', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_30', name: 'شركة الحمزي', pin: '1030', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'ctr_31', name: 'مؤسسة ساند للاعمال', pin: '1031', active: true, updatedAt: '2026-11-19T16:52:52.236Z' },
  ];
}

export function buildSeedStaffUsers(): StaffUser[] {
  return [
    { id: 'st_1', name: 'المعتز محمد ابوطالب', username: '100889', role: 'admin', password: '1234', updatedAt: '2026-11-19T21:42:24.852Z' },
    { id: 'st_2', name: 'عماد احمد عقيلي', username: '78620', role: 'reviewer', password: 'SE@78620', updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'st_3', name: 'يوسف ال جحيف', username: '66288', role: 'reviewer', password: 'SE@66288', updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'st_4', name: 'عبدالعزيز حكمي', username: '114073', role: 'reviewer', password: 'SE@114073', updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'st_5', name: 'عبدالعزيز النعمي', username: '114084', role: 'reviewer', password: 'SE@114084', updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'st_6', name: 'إبراهيم حوذان', username: '110161', role: 'reviewer', password: 'SE@110161', updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'st_7', name: 'عبدالرحمن حمود آل عقيل', username: '1077825980', role: 'reviewer', password: 'SE@1077825980', updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'st_8', name: 'ريان احمد نمري', username: '1102794680', role: 'reviewer', password: 'SE@1102794680', updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'st_9', name: 'أحمد ماجد صائغ', username: '1093540407', role: 'reviewer', password: 'SE@1093540407', updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'st_10', name: 'خالد علي الحازمي', username: '1087282826', role: 'reviewer', password: 'SE@1087282826', updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'st_11', name: 'إبراهيم علي حكمي', username: '1101833679', role: 'reviewer', password: 'SE@1101833679', updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'st_12', name: 'خالد مجلي كريري', username: '1109735108', role: 'reviewer', password: 'SE@1109735108', updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'st_13', name: 'علي احمد الغريب', username: '1107106401', role: 'reviewer', password: 'SE@1107106401', updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'st_14', name: 'محمد احمد مسلماني', username: '1091959393', role: 'reviewer', password: 'SE@1091959393', updatedAt: '2026-11-19T16:52:52.236Z' },
    { id: 'st_15', name: 'عبدالعزيز هاشم صيقل', username: '1079857098', role: 'reviewer', password: 'SE@1079857098', updatedAt: '2026-11-19T16:52:52.236Z' },
  ];
}

export function buildSeedAuditLogs(): AuditLogRecord[] {
  return [
    { id: 'log_1', time: '٢٠‏/١١‏/٢٠٢٦، ١١:٥١ ص', user: 'المعتز محمد ابوطالب (admin)', action: 'تصدير Dashboard PDF', details: 'تصدير لوحة التحكم (كافة البيانات (بدون تصفية))', createdAtMs: 1795128129315 },
    { id: 'log_2', time: '٢٠‏/١١‏/٢٠٢٦، ١١:٥٠ ص', user: 'المعتز محمد ابوطالب (100889)', action: 'تسجيل دخول', details: 'دخول موظف الشركة: المعتز محمد ابوطالب (100889)', createdAtMs: 1795117670070 },
    { id: 'log_3', time: '١٩‏/١١‏/٢٠٢٦، ١٠:٤٥ م', user: 'المعتز محمد ابوطالب (admin)', action: 'تحديث الصلاحيات', details: 'مزامنة بيانات المستخدمين والمقاولين في قاعدة البيانات', createdAtMs: 1795117600000 },
    { id: 'log_4', time: '١٩‏/١١‏/٢٠٢٦، ٠٨:٣٠ م', user: 'عماد احمد عقيلي (78620)', action: 'اعتماد فاتورة', details: 'اعتماد أمر العمل WO-422073943', createdAtMs: 1795117000000 },
  ];
}

