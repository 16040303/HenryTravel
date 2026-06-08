import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// ---- Types ----
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextProps {
  showToast: (type: ToastType, message: string, duration?: number) => void;
}

// ---- Context ----
const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const toastMeta: Record<ToastType, {
  titleKey: string;
  icon: React.ReactNode;
  toneClass: string;
  iconClass: string;
  progressClass: string;
}> = {
  success: {
    titleKey: 'toast.success',
    icon: <CheckCircle2 className="h-4 w-4" />,
    toneClass: 'border-emerald-100 bg-emerald-50/80 text-emerald-700',
    iconClass: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    progressClass: 'bg-emerald-500',
  },
  error: {
    titleKey: 'toast.error',
    icon: <XCircle className="h-4 w-4" />,
    toneClass: 'border-rose-100 bg-rose-50/80 text-rose-700',
    iconClass: 'bg-rose-100 text-rose-700 ring-rose-200',
    progressClass: 'bg-rose-500',
  },
  warning: {
    titleKey: 'toast.warning',
    icon: <AlertTriangle className="h-4 w-4" />,
    toneClass: 'border-amber-100 bg-amber-50/80 text-amber-700',
    iconClass: 'bg-amber-100 text-amber-700 ring-amber-200',
    progressClass: 'bg-amber-500',
  },
  info: {
    titleKey: 'toast.info',
    icon: <Info className="h-4 w-4" />,
    toneClass: 'border-blue-100 bg-blue-50/80 text-[#005899]',
    iconClass: 'bg-blue-100 text-[#0071c2] ring-blue-200',
    progressClass: 'bg-[#0071c2]',
  },
};

// ---- Individual Toast Item ----
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const meta = toastMeta[toast.type];
  const { t } = useLanguage();
  const duration = toast.duration || 4200;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 250);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, duration, onRemove]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 250);
  };

  return (
    <div
      role="alert"
      className={`
        relative flex w-[calc(100vw-24px)] max-w-[360px] items-start gap-2.5 overflow-hidden rounded-xl
        border bg-white/95 p-3 pr-2.5 shadow-xl shadow-neutral-900/10 backdrop-blur-xl
        ${meta.toneClass}
        ${isExiting ? 'animate-toastOut' : 'animate-toastIn'}
      `}
    >
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ${meta.iconClass}`}>
        {meta.icon}
      </div>

      <div className="min-w-0 flex-1 text-left">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-neutral-800">
          {t(meta.titleKey)}
        </p>
        <p className="mt-0.5 text-xs font-semibold leading-relaxed text-neutral-650">
          {toast.message}
        </p>
      </div>

      <button
        onClick={handleClose}
        className="shrink-0 rounded-lg p-1 text-neutral-400 transition-colors hover:bg-white/70 hover:text-neutral-800 cursor-pointer"
        aria-label={t('toast.close')}
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-neutral-100/70">
        <div
          className={`h-full ${meta.progressClass}`}
          style={{ animation: `toastProgress ${duration}ms linear forwards` }}
        />
      </div>
    </div>
  );
}

// ---- Provider ----
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message, duration }].slice(-4));
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div
        className="fixed top-6 left-1/2 z-[9998] flex -translate-x-1/2 flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
