import React, { useEffect, useRef } from 'react';
import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'warning'
}: ConfirmModalProps) {
  const { t } = useLanguage();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on ESC key press and lock background scroll only while open.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.classList.add('modal-open');
      // Accessibility: focus modal after scroll reset to avoid browser forcing old scroll position.
      requestAnimationFrame(() => {
        modalRef.current?.scrollTo({ top: 0, behavior: 'auto' });
        modalRef.current?.focus({ preventScroll: true });
      });
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const iconMap = {
    danger: <AlertCircle className="w-10 h-10 text-red-500 shrink-0" />,
    warning: <AlertTriangle className="w-10 h-10 text-amber-500 shrink-0" />,
    info: <Info className="w-10 h-10 text-[#0071c2] shrink-0" />
  };

  const buttonConfirmColorMap = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-red-100',
    warning: 'bg-[#fe6a34] hover:bg-[#ab3500] focus:ring-orange-500 shadow-orange-100',
    info: 'bg-[#0071c2] hover:bg-[#005899] focus:ring-blue-500 shadow-blue-100'
  };

  return (
    <div
      className="fixed inset-0 z-[300] overflow-y-auto overscroll-contain bg-neutral-900/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onClose}
    >
      <div className="min-h-full flex items-start justify-center p-4">
        <div
          ref={modalRef}
          tabIndex={-1}
          className="w-full max-w-md max-h-[90vh] overflow-y-auto overscroll-contain bg-white rounded-2xl shadow-2xl border border-neutral-100 p-6 flex flex-col gap-5 outline-none relative animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Close Button top-right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-1.5 rounded-lg transition-colors cursor-pointer"
          aria-label={t('common.close')}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Info Row */}
        <div className="flex items-start gap-4">
          <div className="bg-neutral-50 p-2.5 rounded-full border border-neutral-100/50">
            {iconMap[type]}
          </div>
          <div className="flex flex-col gap-1.5 flex-1 pr-6 text-left">
            <h3
              id="confirm-modal-title"
              className="text-base font-black text-neutral-800 tracking-tight"
            >
              {title}
            </h3>
            <p className="text-xs text-neutral-500 font-semibold leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-end gap-2.5 border-t border-neutral-100 pt-4 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            {cancelText || t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all hover:scale-[1.02] cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonConfirmColorMap[type]}`}
          >
            {confirmText || t('common.confirm')}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
