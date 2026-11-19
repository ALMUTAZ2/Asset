export const MODALS_MARKUP = `
  <!-- ==================== MODAL 1: STAFF REVIEW & APPROVAL MODAL ==================== -->
  <div id="reviewModal" class="hidden fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto animate-fade-up">
      <div class="sticky top-0 bg-navy-900 text-white px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
        <div>
          <p class="text-xs text-accent-100">مراجعة واعتماد أمر العمل</p>
          <h3 id="rmTitle" class="text-lg font-extrabold">رقم أمر العمل: ---</h3>
        </div>
        <button onclick="closeModal('reviewModal')" class="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div class="p-6 space-y-5">
        <div id="rmDetailsGrid" class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs"></div>

        <!-- Quality Checklist Display -->
        <div id="rmChecklistBox" class="bg-slate-50 rounded-2xl p-4 border border-slate-200"></div>

        <!-- Attached Photos Gallery -->
        <div>
          <h4 class="text-xs font-extrabold text-navy-900 mb-2 flex items-center gap-1.5">
            <i data-lucide="images" class="w-4 h-4 text-accent-500"></i>
            الصور المرفقة ومسار OneDrive
          </h4>
          <div id="rmPhotosGrid" class="grid grid-cols-2 sm:grid-cols-4 gap-3"></div>
        </div>

        <!-- Staff Decision Section -->
        <div id="rmDecisionArea" class="bg-navy-50/70 rounded-2xl p-4 border border-navy-100 space-y-4">
          <h4 class="text-sm font-extrabold text-navy-900">قرار المراجعة والتقييم</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-navy-900 mb-1">حالة الاعتماد</label>
              <select id="rmStatusSelect" class="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-xs font-bold outline-none">
                <option value="معتمد">معتمد (تم)</option>
                <option value="قيد المراجعة">قيد المراجعة</option>
                <option value="ملاحظات معلقة">ملاحظات معلقة (تتطلب تعديل المقاول)</option>
                <option value="مرفوض">مرفوض (غير معتمد)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-navy-900 mb-1">تقييم حالة التنفيذ</label>
              <select id="rmQualitySelect" class="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-xs font-bold outline-none">
                <option value="ممتاز">ممتاز</option>
                <option value="جيد جداً">جيد جداً</option>
                <option value="جيد">جيد</option>
                <option value="سوء جودة التنفيذ">سوء جودة التنفيذ</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-navy-900 mb-1.5">ملاحظات سريعة (اضغط للإضافة):</label>
            <div class="flex flex-wrap gap-1.5 mb-2" id="quickNoteChips"></div>
            <textarea id="rmNoteInput" rows="2" placeholder="اكتب ملاحظة المراجعة أو سبب الرفض..."
              class="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-semibold outline-none"></textarea>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 pt-2">
            <button type="button" onclick="printSingleWorkOrder(window.__getCurrentReviewId())" class="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-navy-900 text-xs font-bold flex items-center gap-1.5">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>طباعة بطاقة أمر العمل</span>
            </button>
            <div class="flex gap-2">
              <button type="button" onclick="closeModal('reviewModal')" class="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold">إلغاء</button>
              <button type="button" id="rmSaveBtn" onclick="saveReviewDecision()" class="px-6 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-xs font-extrabold shadow">
                حفظ قرار المراجعة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== MODAL 2: STAFF ADD/EDIT INVOICE MODAL ==================== -->
  <div id="invoiceModal" class="hidden fixed inset-0 z-50 bg-navy-950/60 flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto animate-fade-up">
      <div class="bg-navy-900 text-white px-6 py-4 flex items-center justify-between rounded-t-3xl">
        <h3 id="imHeading" class="text-base font-extrabold">إضافة فاتورة جديدة</h3>
        <button onclick="closeModal('invoiceModal')" class="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      <form onsubmit="saveStaffInvoice(event)" class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
        <input type="hidden" id="imId" />
        <div>
          <label class="block font-bold mb-1">رقم أمر العمل *</label>
          <input type="text" id="im_wo" required class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 font-mono font-bold" dir="ltr" />
        </div>
        <div>
          <label class="block font-bold mb-1">المقاول *</label>
          <select id="im_contractor" required class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 font-semibold"></select>
        </div>
        <div>
          <label class="block font-bold mb-1">الاستشاري *</label>
          <select id="im_consultant" required class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 font-semibold"></select>
        </div>
        <div>
          <label class="block font-bold mb-1">تاريخ الفاتورة</label>
          <input type="date" id="im_invoiceDate" class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 font-semibold" />
        </div>
        <div>
          <label class="block font-bold mb-1">نوع العمل *</label>
          <select id="im_workType" required class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 font-semibold"></select>
        </div>
        <div>
          <label class="block font-bold mb-1">وصف العمل *</label>
          <input type="text" id="im_workDesc" list="workDescList" required class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 font-semibold" />
        </div>
        <div>
          <label class="block font-bold mb-1">نوع المعدة *</label>
          <select id="im_equipType" required class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 font-semibold"></select>
        </div>
        <div>
          <label class="block font-bold mb-1">الموقع الوظيفي</label>
          <input type="text" id="im_funcLoc" class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 font-mono" dir="ltr" />
        </div>
        <div>
          <label class="block font-bold mb-1">المكتب *</label>
          <select id="im_office" required class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 font-semibold"></select>
        </div>
        <div>
          <label class="block font-bold mb-1">تاريخ التسليم للأصول</label>
          <input type="date" id="im_deliveryDate" class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 font-semibold" />
        </div>
        <div>
          <label class="block font-bold mb-1">الحالة</label>
          <select id="im_status" class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 font-bold">
            <option value="قيد المراجعة">قيد المراجعة</option>
            <option value="معتمد">معتمد</option>
            <option value="ملاحظات معلقة">ملاحظات معلقة</option>
            <option value="مرفوض">مرفوض</option>
          </select>
        </div>
        <div>
          <label class="block font-bold mb-1">ملاحظة</label>
          <input type="text" id="im_note" class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3" />
        </div>
        <div class="sm:col-span-2 flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button type="button" onclick="closeModal('invoiceModal')" class="px-4 py-2.5 rounded-xl bg-slate-100 font-bold">إلغاء</button>
          <button type="submit" class="px-6 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-extrabold">حفظ الفاتورة</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== MODAL 3: PHOTO LIGHTBOX ==================== -->
  <div id="lightboxModal" class="hidden fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-4" onclick="closeModal('lightboxModal')">
    <div class="max-w-4xl w-full bg-navy-950 rounded-2xl overflow-hidden shadow-2xl border border-white/10" onclick="event.stopPropagation()">
      <div class="px-5 py-3 bg-navy-900 text-white flex items-center justify-between">
        <div>
          <div id="lbTitle" class="text-sm font-bold">معاينة الصورة</div>
          <div id="lbPath" class="text-[11px] text-sky-300 font-mono" dir="ltr"></div>
        </div>
        <button onclick="closeModal('lightboxModal')" class="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      <div class="p-6 flex flex-col items-center justify-center bg-black/40 max-h-[75vh] overflow-auto gap-4">
        <img id="lbImage" src="" alt="صورة مرفقة" class="max-h-[68vh] rounded-xl object-contain" />
        <div id="lbDocView" class="hidden flex flex-col items-center justify-center text-white text-center p-6 space-y-3">
          <i data-lucide="file-text" class="w-16 h-16 text-accent-400"></i>
          <p id="lbDocName" class="text-sm font-bold"></p>
          <a id="lbDownloadBtn" href="#" download class="px-5 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-xs font-extrabold flex items-center gap-2 shadow transition">
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>تنزيل الملف المرفق</span>
          </a>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== MODAL 4: CUSTOM CONFIRM / PROMPT MODAL ==================== -->
  <div id="confirmModal" class="hidden fixed inset-0 z-[80] bg-navy-950/60 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-up space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center shrink-0">
          <i data-lucide="help-circle" class="w-5 h-5"></i>
        </div>
        <h3 id="cmTitle" class="text-base font-extrabold text-navy-900">تأكيد الإجراء</h3>
      </div>
      <p id="cmMessage" class="text-xs sm:text-sm text-slate-600 leading-relaxed"></p>
      <input type="text" id="cmInput" class="hidden w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 text-sm font-semibold outline-none" />
      <div class="flex justify-end gap-2 pt-2">
        <button type="button" onclick="closeModal('confirmModal')" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold">إلغاء</button>
        <button type="button" id="cmConfirmBtn" class="px-5 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-xs font-extrabold">تأكيد</button>
      </div>
    </div>
  </div>

  <!-- ==================== MODAL 5: RESET PASSWORD MODAL ==================== -->
  <div id="resetPassModal" class="hidden fixed inset-0 z-[90] bg-navy-950/65 flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-up">
      <div class="bg-navy-900 text-white px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i data-lucide="key-round" class="w-5 h-5 text-accent-400"></i>
          <h3 class="text-base font-extrabold">إعادة تعيين كلمة المرور</h3>
        </div>
        <button onclick="closeModal('resetPassModal')" class="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>
      <form onsubmit="handleResetPassword(event)" class="p-6 space-y-4 text-xs">
        <div>
          <label class="block font-extrabold text-navy-900 mb-1">الرقم الوظيفي *</label>
          <input type="text" id="rp_username" required placeholder="أدخل الرقم الوظيفي"
            class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 font-mono font-bold outline-none text-left" dir="ltr" />
        </div>
        <div>
          <label class="block font-extrabold text-navy-900 mb-1">كلمة المرور الحالية *</label>
          <input type="password" id="rp_currentPass" required placeholder="أدخل كلمة المرور الحالية"
            class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 font-mono outline-none text-left" dir="ltr" />
        </div>
        <div>
          <label class="block font-extrabold text-navy-900 mb-1">كلمة المرور الجديدة *</label>
          <input type="password" id="rp_newPass" required minlength="4" placeholder="4 أحرف أو أرقام على الأقل"
            class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 font-mono outline-none text-left" dir="ltr" />
        </div>
        <div>
          <label class="block font-extrabold text-navy-900 mb-1">تأكيد كلمة المرور الجديدة *</label>
          <input type="password" id="rp_confirmPass" required minlength="4" placeholder="أعد كتابة كلمة المرور الجديدة"
            class="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 font-mono outline-none text-left" dir="ltr" />
        </div>
        <div id="rp_error" class="hidden p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold"></div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="closeModal('resetPassModal')" class="px-4 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-700">إلغاء</button>
          <button type="submit" class="px-5 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-extrabold shadow">حفظ كلمة المرور الجديدة</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== MODAL 6: PRINT / PDF REPORT PREVIEW MODAL ==================== -->
  <div id="printPreviewModal" class="hidden fixed inset-0 z-[85] bg-navy-950/75 flex items-center justify-center p-3 sm:p-6">
    <div class="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-fade-up">
      <div class="bg-navy-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div class="flex items-center gap-2">
          <i data-lucide="file-text" class="w-5 h-5 text-accent-400"></i>
          <h3 class="text-sm sm:text-base font-extrabold">معاينة التقرير التنفيذي (جاهز للطباعة والحفظ كـ PDF)</h3>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" id="btnDownloadPdfDirect" onclick="downloadDirectPdf()" class="px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow transition">
            <i data-lucide="file-down" class="w-4 h-4"></i>
            <span>حفظ PDF مباشرة</span>
          </button>
          <button type="button" onclick="triggerNativePdfPrint()" class="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition">
            <i data-lucide="printer" class="w-4 h-4"></i>
            <span>طباعة</span>
          </button>
          <button type="button" onclick="downloadReportHtml()" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition">
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>تنزيل HTML</span>
          </button>
          <button type="button" onclick="closeModal('printPreviewModal')" class="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
      </div>
      <div id="printPreviewBody" class="p-6 overflow-y-auto flex-1 bg-white text-right" dir="rtl"></div>
    </div>
  </div>
`;
