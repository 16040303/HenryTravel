import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Check, RefreshCw,
  Wifi, KeyRound, ParkingCircle, Snowflake, WashingMachine, Wind, Laptop, Waves,
  Bath, PawPrint, Utensils, Building2, Compass, Mountain, Refrigerator, Microwave,
  CookingPot, Coffee, Wine, Table, Sparkles, Trash2, ShowerHead, BedDouble, Shirt,
  ScrollText, Tv, PlayCircle, Volume2, Puzzle, Gamepad2, BookOpen, Mic2, Armchair,
  Trees, Sun, ShieldAlert, BriefcaseMedical, DoorOpen, Camera, ShieldCheck, Users,
  Baby, Plug, Briefcase, ArrowUpDown, Plane, Car, Bike, Map, Languages, Flame
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { AMENITIES, AMENITY_CATEGORY_LABELS, getAmenityLabel } from '../../data/amenities';

const AMENITY_ICON_COMPONENTS = {
  Wifi, KeyRound, ParkingCircle, Snowflake, WashingMachine, Wind, Laptop, Waves,
  Bath, PawPrint, Utensils, Building2, Compass, Mountain, Refrigerator, Microwave,
  CookingPot, Coffee, Wine, Table, Sparkles, Trash2, ShowerHead, BedDouble, Shirt,
  ScrollText, Tv, PlayCircle, Volume2, Puzzle, Gamepad2, BookOpen, Mic2, Armchair,
  Trees, Sun, ShieldAlert, BriefcaseMedical, DoorOpen, Camera, ShieldCheck, Users,
  Baby, Plug, Briefcase, ArrowUpDown, Plane, Car, Bike, Map, Languages, Flame,
} satisfies Record<string, React.ComponentType<{ className?: string }>>;

interface AmenitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFacilities: string[];
  onChange: (facilities: string[]) => void;
}

export default function AmenitiesModal({
  isOpen,
  onClose,
  selectedFacilities,
  onChange,
}: AmenitiesModalProps) {
  const { t, language } = useLanguage();
  const [localSelected, setLocalSelected] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalSelected([...selectedFacilities]);
      document.body.classList.add('modal-open');
      requestAnimationFrame(() => {
        if (modalRef.current) {
          modalRef.current.scrollTop = 0;
          modalRef.current.focus({ preventScroll: true });
        }
      });
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, selectedFacilities]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggle = (key: string) => {
    setLocalSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleClearAll = () => {
    setLocalSelected([]);
  };

  const handleApply = () => {
    onChange(localSelected);
    onClose();
  };

  // Group all 144 amenities by categories
  const categories = Array.from(new Set(AMENITIES.map(a => a.category))).map(cat => {
    const items = AMENITIES.filter(a => a.category === cat).sort((a, b) => a.sortOrder - b.sortOrder);
    return {
      key: cat,
      label: AMENITY_CATEGORY_LABELS[cat][language] || cat,
      items
    };
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[350] overflow-y-auto overscroll-contain bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-4xl max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-neutral-100 flex flex-col overflow-hidden outline-none animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-black text-neutral-800 tracking-tight">
              {t('list.allAmenitiesTitle')}
            </h3>
            <p className="text-[11px] text-neutral-400 font-semibold mt-0.5">
              {t('list.filterSelectedCount', { count: localSelected.length })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-1.5 rounded-lg transition-colors cursor-pointer"
            aria-label={t('common.close')}
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto flex-1 flex flex-col gap-6 scrollbar-thin">
          {categories.map(cat => (
            <div key={cat.key} className="flex flex-col gap-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 border-b border-neutral-100 pb-1.5">
                {cat.label}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {cat.items.map(item => {
                  const isChecked = localSelected.includes(item.key);
                  const Icon = AMENITY_ICON_COMPONENTS[item.icon as keyof typeof AMENITY_ICON_COMPONENTS];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleToggle(item.key)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#edf3ff] border-[#a1c9ff] text-[#005899]'
                          : 'bg-white border-neutral-100 text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          isChecked ? 'bg-[#cbdfff] text-[#005899]' : 'bg-neutral-50 text-neutral-500'
                        }`}>
                          {Icon ? <Icon className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                        </span>
                        <span className="truncate pr-1">{getAmenityLabel(item, language)}</span>
                      </div>
                      <div className={`h-4.5 w-4.5 shrink-0 rounded-md border flex items-center justify-center transition-all ${
                        isChecked ? 'bg-[#0071c2] border-[#0071c2] text-white' : 'border-neutral-300'
                      }`}>
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-between bg-neutral-50 shrink-0">
          <button
            type="button"
            onClick={handleClearAll}
            disabled={localSelected.length === 0}
            className="flex items-center gap-1.5 font-bold text-xs text-neutral-500 hover:text-red-500 disabled:opacity-50 disabled:hover:text-neutral-500 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('list.resetFilters')}</span>
          </button>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-600 font-bold text-xs px-4.5 py-2 rounded-xl transition-all cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="bg-[#0071c2] hover:bg-[#005899] text-white font-black text-xs px-5 py-2 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {t('list.applyFilterBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
