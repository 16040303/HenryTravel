import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  ariaLabel?: string;
}

interface MenuPosition {
  top: number;
  left: number;
  width: number;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = '',
  error = false,
  ariaLabel
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  useEffect(() => {
    if (!open) return;

    const updateMenuPosition = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const isInsideTrigger = rootRef.current?.contains(target);
      const isInsideMenu = menuRef.current?.contains(target);
      if (!isInsideTrigger && !isInsideMenu) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const menu = open && menuPosition ? createPortal(
    <div
      ref={menuRef}
      className="fixed z-[1000] max-h-60 overflow-y-auto overscroll-contain rounded-xl border border-neutral-100 bg-white p-1 shadow-xl shadow-neutral-900/10"
      style={{ top: menuPosition.top, left: menuPosition.left, width: menuPosition.width }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
            className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors ${
              selected
                ? 'bg-[#0071c2] text-white'
                : 'text-neutral-700 hover:bg-[#edf3ff] hover:text-[#005899]'
            }`}
          >
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
            {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
          </button>
        );
      })}
    </div>,
    document.body
  ) : null;

  return (
    <div ref={rootRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel || placeholder}
        aria-expanded={open}
        onClick={() => !disabled && setOpen((current) => !current)}
        className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border bg-neutral-50 px-3 py-2.5 text-left text-xs font-bold text-neutral-700 shadow-sm outline-none transition-all hover:bg-white focus:border-[#0071c2] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 ${
          open ? 'border-[#0071c2] bg-white shadow-md shadow-neutral-900/10' : error ? 'border-rose-300' : 'border-neutral-200'
        }`}
      >
        <span className={`min-w-0 flex-1 truncate ${selectedOption ? '' : 'text-neutral-400'}`}>
          {selectedOption?.label || placeholder || ''}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {menu}
    </div>
  );
}

