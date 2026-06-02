import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from 'lucide-react';

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
  title: string;
  icon: React.ReactNode;
  toneClass: string;
  iconClass: string;
  progressClass: string;
}> = {
  success: {
    title: 'Thành công',
    icon: <CheckCircle2 className="h-5 w-5" />,
    toneClass: 'border-emerald-100 bg-emerald-50/80 text-emerald-700',
    iconClass: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    progressClass: 'bg-emerald-500',
  },
  error: {
    title: 'Không thể thực hiện',
    icon: <XCircle className="h-5 w-5" />,
    toneClass: 'border-rose-100 bg-rose-50/80 text-rose-700',
    iconClass: 'bg-rose-100 text-rose-700 ring-rose-200',
    progressClass: 'bg-rose-500',
  },
  warning: {
    title: 'Cần kiểm tra',
    icon: <AlertTriangle className="h-5 w-5" />,
    toneClass: 'border-amber-100 bg-amber-50/80 text-amber-700',
    iconClass: 'bg-amber-100 text-amber-700 ring-amber-200',
    progressClass: 'bg-amber-500',
  },
  info: {
    title: 'Thông tin',
    icon: <Info className="h-5 w-5" />,
    toneClass: 'border-blue-100 bg-blue-50/80 text-[#005899]',
    iconClass: 'bg-blue-100 text-[#0071c2] ring-blue-200',
    progressClass: 'bg-[#0071c2]',
  },
};

// ---- Individual Toast Item ----
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const meta = toastMeta[toast.type];
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
        relative flex w-[calc(100vw-24px)] max-w-[440px] items-start gap-3 overflow-hidden rounded-2xl
        border bg-white/95 p-4 pr-3 shadow-2xl shadow-neutral-900/12 backdrop-blur-xl
        ${meta.toneClass}
        ${isExiting ? 'animate-toastOut' : 'animate-toastIn'}
      `}
    >
      <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${meta.iconClass}`}>
        {meta.icon}
      </div>

      <div className="min-w-0 flex-1 text-left">
        <p className="text-[12px] font-black uppercase tracking-[0.14em] text-neutral-800">
          {meta.title}
        </p>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-neutral-650">
          {toast.message}
        </p>
      </div>

      <button
        onClick={handleClose}
        className="shrink-0 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-white/70 hover:text-neutral-800 cursor-pointer"
        aria-label="Đóng thông báo"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="absolute bottom-0 left-0 h-1 w-full bg-neutral-100/70">
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
        className="fixed top-20 left-1/2 z-[200] flex -translate-x-1/2 flex-col gap-3 pointer-events-none sm:right-6 sm:left-auto sm:translate-x-0"
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
