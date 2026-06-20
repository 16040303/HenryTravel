import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, MapPin, Calendar, Users, SlidersHorizontal, Star, Sliders, CheckSquare, RefreshCw, Check, Waves, Compass, Utensils, ParkingCircle, WashingMachine, PawPrint, KeyRound, Sparkles } from 'lucide-react';
import { AccommodationTypeValue, FilterParams, Villa } from '../types';
import { DEFAULT_LOCATIONS, FILTER_FACILITIES, normalizeLocationCity } from '../constants';
import { getAmenityDisplay, getAmenityLabel, getCardAmenities, FILTER_AMENITY_KEYS } from '../data/amenities';
import { useLanguage } from '../contexts/LanguageContext';
import { useVillasQuery } from '../hooks/queries';
import OptimizedImage from './OptimizedImage';
import { VillaCardSkeleton } from './common/Skeleton';
import EmptyState from './common/EmptyState';
import GuestCategoryPicker from './common/GuestCategoryPicker';
import AmenitiesModal from './common/AmenitiesModal';
import { getLocalDateString } from '../lib/date';

const AMENITY_ICON_COMPONENTS = {
  Waves,
  Compass,
  Utensils,
  ParkingCircle,
  WashingMachine,
  PawPrint,
  KeyRound,
  Sparkles,
} satisfies Record<string, React.ComponentType<{ className?: string }>>;


interface ListingViewProps {
  initialSearchParams: {
    location: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    rooms: number;
  };
  initialFilterParams: FilterParams;
  onViewDetail: (id: string, type?: Villa['type']) => void;
  villasTriggerUpdate?: number;
  onSearchParamsUpdate?: (params: ListingViewProps['initialSearchParams'], filters?: ListingViewProps['initialFilterParams']) => void;
}

export default function ListingView({ initialSearchParams, initialFilterParams, onViewDetail, villasTriggerUpdate = 0, onSearchParamsUpdate }: ListingViewProps) {
  const { t, language } = useLanguage();
  const formatPriceRange = (price: number, priceMax?: number | null) => {
    const min = `${price.toLocaleString('vi-VN')} VND`;
    const max = priceMax && priceMax > price ? ` - ${priceMax.toLocaleString('vi-VN')} VND` : '';
    return `${t('public.priceFrom')} ${min}${max}`;
  };

  // Configured check-in state
  const [params, setParams] = useState(initialSearchParams);
  const [filterParams, setFilterParams] = useState(initialFilterParams);

  // Edit Search Popup Toggle
  const [showEditSearch, setShowEditSearch] = useState(false);
  const [isAmenitiesModalOpen, setIsAmenitiesModalOpen] = useState(false);
  const villaQueryFilters = useMemo(() => ({
    location: params.location,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    guests: params.guests,
    rooms: params.rooms,
    priceMin: filterParams.priceMin,
    priceMax: filterParams.priceMax,
    type: filterParams.type,
    facilities: [...filterParams.facilities].sort(),
    lang: language
  }), [params, filterParams, language]);
  const { data: villas = [], isLoading: loading, refetch: refetchVillas } = useVillasQuery(villaQueryFilters);
  const [sortBy, setSortBy] = useState<'popular' | 'priceAsc' | 'priceDesc'>('popular');
  const locationOptions = useMemo(
    () => Array.from(new Set([...DEFAULT_LOCATIONS, ...villas.map(v => normalizeLocationCity(v.location)).filter(Boolean)])),
    [villas]
  );
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [activeEditDateField, setActiveEditDateField] = useState<'checkIn' | 'checkOut' | null>(null);

  // Input states for editing search parameters
  const [editLocation, setEditLocation] = useState(params.location);
  const [editCheckIn, setEditCheckIn] = useState(params.checkIn);
  const [editCheckOut, setEditCheckOut] = useState(params.checkOut);
  const [editAdults, setEditAdults] = useState(Math.max(params.guests, 1));
  const [editChildren, setEditChildren] = useState(0);
  const [editInfants, setEditInfants] = useState(0);
  const editGuests = editAdults + editChildren + editInfants;
  const [editRooms, setEditRooms] = useState(params.rooms);

  useEffect(() => {
    setParams(initialSearchParams);
    setFilterParams(initialFilterParams);
    setEditLocation(initialSearchParams.location);
    setEditCheckIn(initialSearchParams.checkIn);
    setEditCheckOut(initialSearchParams.checkOut);
    setEditAdults(Math.max(initialSearchParams.guests, 1));
    setEditChildren(0);
    setEditInfants(0);
    setEditRooms(initialSearchParams.rooms);
  }, [initialSearchParams, initialFilterParams]);

  useEffect(() => {
    if (villasTriggerUpdate > 0) {
      void refetchVillas();
    }
  }, [refetchVillas, villasTriggerUpdate]);

  // Safe mapping of location string for translation looks
  const getLocationLabel = useCallback((loc: string): string => {
    const keyMap: Record<string, string> = {
      'Đà Lạt': 'loc.dalat',
      'Vũng Tàu': 'loc.vungtau',
      'Phú Quốc': 'loc.phuquoc',
      'Hội An': 'loc.hoian',
      'Huế': 'loc.hue',
      'Đà Nẵng': 'loc.danang',
      'All': 'loc.all',
      'Nha Trang': 'loc.nhatrang',
      'TP.HCM': 'loc.hcm',
    };
    const key = keyMap[loc];
    return key ? t(key) : loc;
  }, [t]);

  const handleApplyEditSearch = (e: React.FormEvent) => {
     e.preventDefault();
     const nextParams = {
       location: editLocation,
       checkIn: editCheckIn,
       checkOut: editCheckOut,
       guests: Math.max(editGuests, 1),
       rooms: editRooms
     };
     setParams(nextParams);
     onSearchParamsUpdate?.(nextParams, filterParams);
     setShowEditSearch(false);
     setActiveEditDateField(null);
   };

  const sortedVillas = useMemo(() => [...villas].sort((a, b) => {
    if (sortBy === 'priceAsc') return a.price - b.price;
    if (sortBy === 'priceDesc') return b.price - a.price;
    return b.rating - a.rating; // default popular
  }), [villas, sortBy]);

  const villaCardModels = useMemo(() => sortedVillas.map((villa) => {
    const cardAmenities = getCardAmenities(villa.facilities, 5);
    return {
      villa,
      isAvailable: villa.status === 'Available',
      badgeColor: villa.status === 'Available'
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
        : villa.status === 'Hết phòng'
          ? 'bg-rose-50 text-rose-800 border-rose-200'
          : 'bg-neutral-100 text-neutral-600',
      locationLabel: getLocationLabel(villa.location),
      priceRange: formatPriceRange(villa.price, villa.priceMax),
      amenities: cardAmenities.items.map(item => ({
        key: item.key,
        label: getAmenityLabel(item, language),
      })),
      remainingAmenities: cardAmenities.remainingCount,
    };
  }), [sortedVillas, language, t]);

  const handleFacilityCheck = (id: string) => {
    const isMatched = filterParams.facilities.includes(id);
    const updated = isMatched 
      ? filterParams.facilities.filter(item => item !== id) 
      : [...filterParams.facilities, id];

    const nextFilter = {
      ...filterParams,
      facilities: updated
    };
    setFilterParams(nextFilter);
    onSearchParamsUpdate?.(params, nextFilter);
  };

  const handleTypeCheck = (type: AccommodationTypeValue | 'All') => {
    const nextFilter = {
      ...filterParams,
      type
    };
    setFilterParams(nextFilter);
    onSearchParamsUpdate?.(params, nextFilter);
  };

  const handlePriceMaxSlider = (val: number) => {
    const nextFilter = {
      ...filterParams,
      priceMax: val
    };
    setFilterParams(nextFilter);
    onSearchParamsUpdate?.(params, nextFilter);
  };

  const handleResetSearch = () => {
    setFilterParams({
      priceMin: 0,
      priceMax: 10000000,
      type: 'All',
      facilities: []
    });
    const resetParams = {
      location: 'All',
      checkIn: getLocalDateString(),
      checkOut: '',
      guests: 2,
      rooms: 1
    };
    setParams(resetParams);
    setEditLocation(resetParams.location);
    setEditCheckIn(resetParams.checkIn);
    setEditCheckOut(resetParams.checkOut);
    setEditAdults(resetParams.guests);
    setEditChildren(0);
    setEditInfants(0);
    setEditRooms(resetParams.rooms);
    onSearchParamsUpdate?.(resetParams, {
      priceMin: 0,
      priceMax: 10000000,
      type: 'All',
      facilities: []
    });
  };

  const formatDisplayDate = (value: string) => {
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : 'dd/mm/yyyy';
  };

  const renderEditDateCalendar = (
    field: 'checkIn' | 'checkOut',
    value: string,
    onSelect: (value: string) => void
  ) => {
    if (activeEditDateField !== field) return null;
    const selected = new Date(value);
    const year = Number.isNaN(selected.getTime()) ? 2026 : selected.getFullYear();
    const month = Number.isNaN(selected.getTime()) ? 5 : selected.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const monthLabel = new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
      month: 'long',
      year: 'numeric'
    }).format(new Date(year, month, 1));

    return (
      <div className="absolute left-0 top-[calc(100%+8px)] z-[200] w-[280px] rounded-2xl border border-neutral-100 bg-white p-3 shadow-2xl shadow-neutral-900/15 animate-scaleIn">
        <div className="mb-3 flex items-center justify-between border-b border-neutral-100 pb-2">
          <span className="text-xs font-black capitalize text-neutral-800">{monthLabel}</span>
          <button
            type="button"
            onClick={() => setActiveEditDateField(null)}
            className="rounded-lg px-2 py-1 text-[10px] font-bold text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
          >
            {t('common.close')}
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-neutral-400">
          {t('calendar.weekdays').split(',').map(day => (
            <span key={day}>{day}</span>
          ))}
          {Array.from({ length: offset }).map((_, index) => (
            <span key={`empty-${index}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, index) => index + 1).map(day => {
            const dateValue = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = dateValue === value;
            return (
              <button
                key={dateValue}
                type="button"
                onClick={() => {
                  onSelect(dateValue);
                  setActiveEditDateField(null);
                }}
                className={`aspect-square rounded-xl text-[11px] font-bold transition-all ${
                  isSelected
                    ? 'bg-[#0071c2] text-white shadow-sm shadow-[#0071c2]/30'
                    : 'text-neutral-700 hover:bg-[#edf3ff] hover:text-[#005899]'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };


  // Mini-calendar formatter which highlights reservation states of a villa
  const renderMiniCalendar = (villaId: number) => {
    const checkInDate = new Date(params.checkIn);
    const checkOutDate = new Date(params.checkOut);
    const safeBaseDate = Number.isNaN(checkInDate.getTime()) ? new Date('2026-06-01') : checkInDate;
    const year = safeBaseDate.getFullYear();
    const month = safeBaseDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const visibleStart = Math.max(1, safeBaseDate.getDate() - 2);
    const visibleEnd = Math.min(daysInMonth, visibleStart + 13);
    const days = Array.from({ length: visibleEnd - visibleStart + 1 }, (_, i) => visibleStart + i);
    const checkInDay = Number.isNaN(checkInDate.getTime()) ? null : checkInDate.getDate();
    const checkOutDay = Number.isNaN(checkOutDate.getTime()) ? null : checkOutDate.getDate();
    const isSameDisplayMonth = !Number.isNaN(checkOutDate.getTime()) && checkOutDate.getFullYear() === year && checkOutDate.getMonth() === month;
    const monthLabel = `${String(month + 1).padStart(2, '0')}/${year}`;

    return (
      <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 flex flex-col gap-1.5 animate-fadeIn">
        <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
          <span className="text-[9px] font-extrabold bg-[#edf3ff] text-[#005899] py-0.5 px-2 rounded-full uppercase tracking-wider">
            {t('list.calendarTitle')}
          </span>
          <span className="text-[#0071c2]">{monthLabel}</span>
        </div>
        
        {/* Days grid row */}
        <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px]">
          {t('calendar.weekdays').split(',').map(w => (
            <span key={w} className="text-[8px] font-bold text-neutral-400">{w}</span>
          ))}

          {days.map(d => {
            let bgClass = 'bg-white hover:bg-neutral-100 text-neutral-700';
            let title = t('list.calendarAvailable');

            const isSelectedRange = checkInDay !== null && checkOutDay !== null && isSameDisplayMonth && d >= checkInDay && d <= checkOutDay;

            if (isSelectedRange) {
              bgClass = 'bg-[#0071c2] text-white font-extrabold rounded-md';
              title = t('list.calendarSearched');
            } else if (d === 25 || d === 26) {
              bgClass = 'bg-rose-100 text-rose-500 line-through rounded-md opacity-60';
              title = t('list.calendarHeld');
            }

            return (
              <span 
                key={d} 
                className={`py-0.5 font-semibold transition-colors flex items-center justify-center cursor-default ${bgClass}`}
                title={title}
              >
                {d}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#fcf9f8] min-h-screen text-[#1c1b1b]">
      
      {/* Visual Header overview block */}
      <section className="bg-[#003580] text-white py-12 px-4 shadow-inner border-b border-blue-900">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs text-blue-100 uppercase font-black tracking-widest leading-none">
              <span>{getLocationLabel(params.location)} — {params.guests} {t('detail.guestUnit')}</span>
            </div>
            <h1 className="text-2xl md:text-3.5xl font-display font-black tracking-tight text-white leading-none">
              {t('nav.listings')} {getLocationLabel(params.location)}
            </h1>
            <p className="text-xs text-blue-200 leading-relaxed font-medium">
              CheckIn: <span className="font-mono bg-blue-950 font-bold px-1.5 py-0.5 rounded text-white mr-2">{formatDisplayDate(params.checkIn)}</span> 
              CheckOut: <span className="font-mono bg-blue-950 font-bold px-1.5 py-0.5 rounded text-white">{formatDisplayDate(params.checkOut)}</span>
            </p>
          </div>

          <button 
            onClick={() => setShowEditSearch(true)}
            className="bg-[#0071c2] hover:bg-[#005899] text-white hover:text-white px-5 py-2.5 rounded-lg border border-white/10 shadow-md font-bold text-xs transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span>{t('list.changeSearch')}</span>
          </button>
        </div>
      </section>

      {/* Edit Search dialog screen overlay modal */}
      {showEditSearch && (
        <div className="fixed inset-0 z-[300] overflow-y-auto overscroll-contain bg-neutral-900/60 p-4 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center py-4">
            <div className="max-h-[90vh] w-full max-w-[540px] overflow-y-auto overscroll-contain rounded-2xl border border-neutral-100 bg-white p-5 shadow-2xl animate-scaleIn sm:p-6">
            <h3 className="font-black font-display text-lg text-neutral-800 mb-4 pb-2 border-b border-neutral-100">
              {t('list.editTitle')}
            </h3>

            <form onSubmit={handleApplyEditSearch} className="flex flex-col gap-4 text-xs font-semibold">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">{t('list.locationLabel')}</span>
                <select 
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="bg-neutral-50 border p-2.5 rounded-lg text-sm font-semibold outline-none focus:border-[#0071c2]"
                >
                  <option value="All">{t('loc.all')}</option>
                  {locationOptions.map(loc => (
                    <option key={loc} value={loc}>{getLocationLabel(loc)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{t('home.checkIn')}</span>
                  <button 
                    type="button" 
                    onClick={() => setActiveEditDateField(activeEditDateField === 'checkIn' ? null : 'checkIn')}
                    className="bg-neutral-50 border p-2 rounded-lg text-xs font-bold font-mono outline-none text-left hover:border-[#0071c2] hover:bg-white transition-colors"
                  >
                    {formatDisplayDate(editCheckIn)}
                  </button>
                  {renderEditDateCalendar('checkIn', editCheckIn, setEditCheckIn)}
                </div>
                <div className="relative flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{t('home.checkOut')}</span>
                  <button 
                    type="button" 
                    onClick={() => setActiveEditDateField(activeEditDateField === 'checkOut' ? null : 'checkOut')}
                    className="bg-neutral-50 border p-2 rounded-lg text-xs font-bold font-mono outline-none text-left hover:border-[#0071c2] hover:bg-white transition-colors"
                  >
                    {formatDisplayDate(editCheckOut)}
                  </button>
                  {renderEditDateCalendar('checkOut', editCheckOut, setEditCheckOut)}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <GuestCategoryPicker
                  adults={editAdults}
                  children={editChildren}
                  infants={editInfants}
                  onAdultsChange={setEditAdults}
                  onChildrenChange={setEditChildren}
                  onInfantsChange={setEditInfants}
                  maxGuests={20}
                  minAdults={0}
                  showMax={false}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button 
                  type="submit"
                  className="bg-[#0071c2] hover:bg-[#005899] text-white py-1.5 h-9 px-4 rounded-lg font-black transition-colors"
                >
                  {t('list.applyBtn')}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEditSearch(false);
                    setActiveEditDateField(null);
                  }}
                  className="border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-600 py-1.5 px-3 rounded-lg font-bold"
                >
                  {t('list.closeBtn')}
                </button>
              </div>
            </form>
          </div>
          </div>
        </div>
      )}

      {/* Main grids arrangement */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 py-10 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Sidebar filter layout */}
        <aside className="md:col-span-3 flex flex-col gap-6 bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm self-start">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="font-bold text-sm tracking-tight text-neutral-800 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#0071c2]" />
              {t('list.filters')}
            </h3>
            <button 
              onClick={handleResetSearch} 
              className="text-[10px] text-neutral-400 hover:text-red-500 font-bold uppercase tracking-wider flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              {t('list.resetFilters')}
            </button>
          </div>

          {/* Pricing range filter */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-bold text-neutral-600 uppercase">
              <span>{t('list.priceRange')}</span>
              <span className="text-neutral-800 font-black">{filterParams.priceMax.toLocaleString('vi-VN')} VND</span>
            </div>
            <input 
              type="range"
              min={1000000}
              max={10000000}
              step={500000}
              value={filterParams.priceMax}
              onChange={(e) => handlePriceMaxSlider(Number(e.target.value))}
              className="w-full accent-[#0071c2] cursor-pointer"
            />
          </div>

          {/* Dwelling type selector */}
          <div className="flex flex-col gap-2 pt-3 border-t border-neutral-100">
            <span className="text-xs font-bold text-neutral-600 uppercase">{t('list.propertyType')}</span>
            <div className="flex flex-col gap-2 mt-1">
              {([
                { value: 'All' as const, label: t('list.allTypes') },
                { value: 'villa' as const, label: t('nav.villa') },
                { value: 'hotel_resort' as const, label: t('nav.hotelResort') },
              ]).map((type) => (
                <label key={type.value} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
                  <input 
                    type="radio" 
                    name="filter-type"
                    checked={filterParams.type === type.value}
                    onChange={() => handleTypeCheck(type.value)}
                    className="w-4 h-4 text-[#0071c2] border-neutral-300 focus:ring-[#0071c2]"
                  />
                  <span>{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Amenities checklist */}
          <div className="flex flex-col gap-2 pt-3 border-t border-neutral-100">
            <span className="text-xs font-bold text-neutral-600 uppercase">{t('list.amenities')}</span>
            <div className="flex flex-col gap-2 mt-1.5 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
              {FILTER_FACILITIES.map(facility => {
                const isChecked = filterParams.facilities.includes(facility.id);
                const Icon = AMENITY_ICON_COMPONENTS[facility.icon as keyof typeof AMENITY_ICON_COMPONENTS] || Sparkles;
                return (
                  <label 
                    key={facility.id} 
                    className={`flex items-center justify-between p-2 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer select-none ${
                      isChecked
                        ? 'bg-[#edf3ff] border-[#a1c9ff] text-[#005899]'
                        : 'bg-white border-neutral-100 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleFacilityCheck(facility.id)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        isChecked ? 'bg-[#cbdfff] text-[#005899]' : 'bg-neutral-50 text-neutral-500'
                      }`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate pr-1">{getAmenityLabel(getAmenityDisplay(facility.id), language)}</span>
                    </div>
                    <div className={`h-4.5 w-4.5 shrink-0 rounded-md border flex items-center justify-center transition-all ${
                      isChecked ? 'bg-[#0071c2] border-[#0071c2] text-white' : 'border-neutral-300'
                    }`}>
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </label>
                );
              })}
              {filterParams.facilities
                .filter(id => !FILTER_AMENITY_KEYS.includes(id))
                .map(id => {
                  const facility = getAmenityDisplay(id);
                  const Icon = AMENITY_ICON_COMPONENTS[facility.icon as keyof typeof AMENITY_ICON_COMPONENTS] || Sparkles;
                  return (
                    <label 
                      key={id} 
                      className="flex items-center justify-between p-2 rounded-xl border border-[#a1c9ff] bg-[#edf3ff] text-[#005899] text-left text-xs font-bold transition-all cursor-pointer select-none animate-fadeIn"
                    >
                      <input 
                        type="checkbox"
                        checked={true}
                        onChange={() => handleFacilityCheck(id)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#cbdfff] text-[#005899]">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate pr-1">{getAmenityLabel(facility, language)}</span>
                      </div>
                      <div className="h-4.5 w-4.5 shrink-0 rounded-md border border-[#0071c2] bg-[#0071c2] text-white flex items-center justify-center transition-all">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    </label>
                  );
                })}
            </div>
            
            <button
              type="button"
              onClick={() => setIsAmenitiesModalOpen(true)}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-dashed border-[#a1c9ff] bg-[#edf3ff]/40 text-[#0071c2] hover:bg-[#edf3ff] text-xs font-bold transition-all cursor-pointer"
            >
              <span>+ {t('list.moreAmenitiesBtn')}</span>
              {filterParams.facilities.length > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0071c2] text-[9px] font-black text-white px-1">
                  {filterParams.facilities.length}
                </span>
              )}
            </button>
          </div>
        </aside>

        {/* Right Listings List content */}
        <section className="md:col-span-9 flex flex-col gap-6">
          
          {/* Top Info sorting controller row */}
          <div className="relative z-10 overflow-visible rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)] backdrop-blur-md sm:p-5">
            <div className="pointer-events-none absolute -right-10 -top-14 h-28 w-28 rounded-full bg-[#0071c2]/10 blur-2xl" />
            <div className="pointer-events-none absolute -left-8 bottom-0 h-20 w-20 rounded-full bg-[#fe6a34]/10 blur-2xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#edf3ff] text-[#0071c2] shadow-inner">
                  <Search className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                    {t('list.searchResults')}
                  </p>
                  <div className="mt-1 flex items-baseline gap-1.5 text-sm font-semibold text-neutral-600">
                    <span>{t('list.foundPrefix')}</span>
                    <strong className="font-display text-2xl font-black leading-none text-[#005899]">{sortedVillas.length}</strong>
                    <span>{t('list.foundSuffix')}</span>
                  </div>
                </div>
              </div>

              <div className="relative w-full sm:w-auto sm:min-w-[250px]">
                <button
                  type="button"
                  onClick={() => setSortMenuOpen(prev => !prev)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-neutral-50/90 px-3 py-2.5 shadow-inner transition-all hover:border-[#a1c9ff] hover:bg-white"
                >
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-[#0071c2]" />
                    {t('list.sortLabel')}
                  </span>
                  <span className="text-xs font-black text-neutral-800">
                    {sortBy === 'popular'
                      ? t('list.sortPopular')
                      : sortBy === 'priceAsc'
                        ? t('list.sortPriceAsc')
                        : t('list.sortPriceDesc')}
                  </span>
                </button>

                {sortMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-full overflow-hidden rounded-2xl border border-neutral-100 bg-white p-1.5 shadow-2xl shadow-neutral-900/10 animate-scaleIn">
                    {([
                      ['popular', t('list.sortPopular')],
                      ['priceAsc', t('list.sortPriceAsc')],
                      ['priceDesc', t('list.sortPriceDesc')]
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setSortBy(value);
                          setSortMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition-colors ${
                          sortBy === value
                            ? 'bg-[#0071c2] text-white shadow-sm'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                        }`}
                      >
                        <span>{label}</span>
                        {sortBy === value && <CheckSquare className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="min-h-[520px]">
            {loading ? (
              <div className="flex flex-col gap-6">
                {[1, 2, 3].map((n) => <VillaCardSkeleton key={n} />)}
              </div>
            ) : villaCardModels.length === 0 ? (
              <EmptyState
                title={t('list.emptyTitle')}
                description={t('list.emptyDesc')}
                actionText={t('list.emptyAction')}
                onAction={handleResetSearch}
                icon="search"
              />
            ) : (
              <div className="relative z-0 flex flex-col gap-6">
              {villaCardModels.map(({ villa, isAvailable, badgeColor, locationLabel, priceRange, amenities, remainingAmenities }) => {
                return (
                  <div 
                    key={villa.id}
                    onClick={() => onViewDetail(villa.id, villa.type)}
                    className="bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden grid grid-cols-1 md:grid-cols-12 hover:-translate-y-1 group cursor-pointer"
                  >
                    {/* Media Column */}
                    <div className="relative aspect-[4/3] min-h-[220px] md:col-span-4 md:aspect-auto">
                      <OptimizedImage 
                        src={villa.image} 
                        alt={villa.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        aspectRatioClassName="h-full w-full"
                      />
                      <span className={`absolute top-3 left-3 px-2 py-0.5 text-[9px] font-extrabold uppercase rounded border backdrop-blur-md ${badgeColor}`}>
                        {t(`status.${villa.status}`)}
                      </span>
                    </div>

                    {/* Content text Column */}
                    <div className="p-5 md:col-span-5 flex flex-col justify-between">
                      <div>
                        {/* Rating row */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[10px] bg-[#edf3ff] text-[#005899] uppercase font-bold py-0.5 px-2 rounded-full font-mono">
                            {villa.type}
                          </span>
                          
                          {villa.rating > 0 && (
                            <div className="flex items-center gap-0.5 text-xs font-black text-[#fe6a34]">
                              <Star className="w-3.5 h-3.5 fill-[#fe6a34] text-[#fe6a34]" />
                              <span>{villa.rating}</span>
                              <span className="text-neutral-500 font-normal"> / 5.0</span>
                            </div>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-neutral-800 group-hover:text-[#0071c2] transition-colors leading-tight mb-2">
                          {villa.name}
                        </h3>

                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium mb-3">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{locationLabel}</span>
                        </div>

                        <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed mb-4">
                          {villa.description}
                        </p>
                      </div>

                      {/* Display key tags of amenities */}
                      <div className="flex flex-wrap gap-1.5">
                        {amenities.map(item => (
                          <span key={item.key} className="bg-neutral-50 text-neutral-500 px-2 py-1 rounded text-[10px] font-bold">
                            ✓ {item.label}
                          </span>
                        ))}
                        {remainingAmenities > 0 && (
                          <span className="bg-sky-50 text-sky-700 px-2 py-1 rounded text-[10px] font-bold">
                            {t('list.moreAmenities', { count: remainingAmenities })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Booking prices & mini calendar Column */}
                    <div className="p-5 md:col-span-3 border-t md:border-t-0 md:border-l border-neutral-100 bg-neutral-50/25 flex flex-col justify-between gap-4">
                      
                      {/* Mini calendar block directly on card! */}
                      {renderMiniCalendar(villa.id)}

                      <div className="flex items-end justify-between md:flex-col md:items-stretch gap-1">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-neutral-400">{t('list.rateLabel')}</span>
                          <div className="mt-1 text-sm font-black leading-6 tracking-tight text-[#fe6a34] font-display md:text-right">
                            <span>{priceRange}</span>
                            <span className="block text-[11px] font-bold text-neutral-400">{t('public.pricePerNight')}</span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetail(villa.id, villa.type);
                          }}
                          className={`w-full text-center py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            isAvailable
                              ? 'bg-[#0071c2] hover:bg-[#005899] text-white shadow-md hover:scale-[1.01]'
                              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          {isAvailable 
                            ? t('list.bookNow') 
                            : t('list.viewInfo')}
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
              </div>
            )}
          </div>
        </section>

      </div>
      <AmenitiesModal
        isOpen={isAmenitiesModalOpen}
        onClose={() => setIsAmenitiesModalOpen(false)}
        selectedFacilities={filterParams.facilities}
        onChange={(updated) => {
          const nextFilter = {
            ...filterParams,
            facilities: updated
          };
          setFilterParams(nextFilter);
          onSearchParamsUpdate?.(params, nextFilter);
        }}
      />
    </div>
  );
}

