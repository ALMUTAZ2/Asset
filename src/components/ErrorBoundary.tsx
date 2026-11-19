import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  details: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
      details: '',
    };
  }

  static getDerivedStateFromError(error: Error): State {
    let errorMessage = 'حدث خطأ غير متوقع أثناء الاتصال بقاعدة البيانات أو تشغيل المنصة.';
    let details = error.message || '';

    try {
      const parsed = JSON.parse(error.message);
      if (parsed && parsed.operationType) {
        errorMessage = `تعذّر تنفيذ عملية (${parsed.operationType}) على المسار (${parsed.path || 'Firestore'}).`;
        details = parsed.error || error.message;
      }
    } catch {
      // Standard error string
    }

    return { hasError: true, errorMessage, details };
  }

  componentDidCatch(error: Error) {
    console.error('Application ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-slatebg flex items-center justify-center p-6 font-cairo"
        >
          <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-2xl">
              !
            </div>
            <h2 className="text-xl font-black text-navy-900">
              تنبيه تقني في الاتصال بالمنصة
            </h2>
            <p className="text-sm font-semibold text-slate-600 leading-relaxed">
              {this.state.errorMessage}
            </p>
            {this.state.details && (
              <div
                dir="ltr"
                className="text-xs font-mono bg-slate-100 text-slate-700 rounded-xl p-3 text-left break-words max-h-36 overflow-auto"
              >
                {this.state.details}
              </div>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-extrabold transition"
            >
              إعادة تحميل المنصة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
