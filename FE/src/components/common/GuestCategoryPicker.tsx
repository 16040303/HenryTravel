import { Minus, Plus, Users } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface GuestCategoryPickerProps {
  adults: number;
  children: number;
  infants: number;
  onAdultsChange: (value: number) => void;
  onChildrenChange: (value: number) => void;
  onInfantsChange: (value: number) => void;
  maxGuests?: number;
  compact?: boolean;
  flat?: boolean;
  minAdults?: number;
  showMax?: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function GuestCategoryPicker({
  adults,
  children,
  infants,
  onAdultsChange,
  onChildrenChange,
  onInfantsChange,
  maxGuests = 20,
  compact = false,
  flat = false,
  minAdults = 1,
  showMax = true,
}: GuestCategoryPickerProps) {
  const { t } = useLanguage();
  const totalGuests = adults + children + infants;

  const rows = [
    { key: 'adults', label: compact ? t('guest.compactAdults') : t('guest.adults'), desc: compact ? t('guest.compactAdultsAge') : t('guest.adultsAge'), value: adults, min: minAdults, onChange: onAdultsChange },
    { key: 'children', label: compact ? t('guest.compactChildren') : t('guest.children'), desc: compact ? t('guest.compactChildrenAge') : t('guest.childrenAge'), value: children, min: 0, onChange: onChildrenChange },
    { key: 'infants', label: compact ? t('guest.compactInfants') : t('guest.infants'), desc: compact ? t('guest.compactInfantsAge') : t('guest.infantsAge'), value: infants, min: 0, onChange: onInfantsChange },
  ];

  if (compact) {
    return (
      <div className="rounded-xl border border-[#d8e7f6] bg-gradient-to-br from-white to-[#f4f9ff] px-2.5 py-2 shadow-sm shadow-[#0071c2]/5">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#005899]">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e7f3ff]">
              <Users className="h-3.5 w-3.5 text-[#0071c2]" />
            </span>
            {t('guest.compactTotal')}
          </div>
          {showMax && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black shadow-sm ${totalGuests > maxGuests ? 'bg-rose-100 text-rose-700' : 'bg-white text-[#005899]'}`}>
              {totalGuests}/{maxGuests}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {rows.map((row) => (
            <div key={row.key} className="rounded-lg border border-white/80 bg-white/90 px-2 py-1.5 shadow-sm shadow-neutral-900/[0.03]">
              <div className="truncate text-[10px] font-black leading-tight text-neutral-800" title={row.label}>{row.label}</div>
              <div className="text-[9px] font-semibold leading-tight text-neutral-400">{row.desc}</div>
              <div className="mt-1.5 flex items-center justify-between gap-1 rounded-full bg-neutral-50 p-0.5">
                <button
                  type="button"
                  onClick={() => row.onChange(clamp(row.value - 1, row.min, maxGuests))}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-neutral-500 shadow-sm transition-colors hover:text-[#0071c2] disabled:bg-transparent disabled:shadow-none disabled:opacity-35"
                  disabled={row.value <= row.min}
                  aria-label={t('guest.decrease')}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="min-w-4 text-center text-xs font-black text-[#005899]">{row.value}</span>
                <button
                  type="button"
                  onClick={() => row.onChange(clamp(row.value + 1, row.min, maxGuests))}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0071c2] text-white shadow-sm transition-colors hover:bg-[#005899] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none"
                  disabled={totalGuests >= maxGuests}
                  aria-label={t('guest.increase')}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={flat ? "w-full" : "rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl shadow-neutral-900/10"}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-neutral-500">
          <Users className="h-4 w-4 text-[#0071c2]" />
          {t('guest.total')}
        </div>
        {showMax && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-black ${totalGuests > maxGuests ? 'bg-rose-100 text-rose-700' : 'bg-[#edf3ff] text-[#005899]'}`}>
            {totalGuests}/{maxGuests}
          </span>
        )}
      </div>

      <div className="flex flex-col divide-y divide-neutral-100">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-1">
            <div className="min-w-0">
              <div className="text-sm font-black text-neutral-800">{row.label}</div>
              <div className="text-[11px] font-semibold text-neutral-400">{row.desc}</div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => row.onChange(clamp(row.value - 1, row.min, maxGuests))} className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-[#0071c2] hover:text-[#0071c2] disabled:cursor-not-allowed disabled:opacity-40" disabled={row.value <= row.min} aria-label={t('guest.decrease')}>
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-black text-neutral-800">{row.value}</span>
              <button type="button" onClick={() => row.onChange(clamp(row.value + 1, row.min, maxGuests))} className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-[#0071c2] hover:text-[#0071c2] disabled:cursor-not-allowed disabled:opacity-40" disabled={totalGuests >= maxGuests} aria-label={t('guest.increase')}>
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
