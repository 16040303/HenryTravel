import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Calendar, Users, SlidersHorizontal, Search, Star, MapPin, Check, MessageSquare, ShieldCheck, Heart, ChevronDown, Waves, Compass, Utensils, ParkingCircle, WashingMachine, PawPrint, KeyRound, Sparkles, Plus } from 'lucide-react';
import { Villa, SearchParams, FilterParams } from '../types';
import { DEFAULT_LOCATIONS, FILTER_FACILITIES, normalizeLocationCity } from '../constants';
import { getAmenityDisplay, getAmenityLabel } from '../data/amenities';
import { useToast } from './Toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useFeaturedVillasQuery } from '../hooks/queries';
import OptimizedImage from './OptimizedImage';
import CustomDatePicker from './common/CustomDatePicker';
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


interface HomeViewProps {
  onSearch: (searchParams: SearchParams, filterParams: FilterParams) => void;
  onViewDetail: (id: string, type?: Villa['type']) => void;
  villasTriggerUpdate?: number; // to refetch if admin inserts new villas
}

export default function HomeView({ onSearch, onViewDetail, villasTriggerUpdate = 0 }: HomeViewProps) {
  const { t, language } = useLanguage();
  const formatPriceRange = (price: number, priceMax?: number | null) => {
    const min = `${price.toLocaleString('vi-VN')} VND`;
    const max = priceMax && priceMax > price ? ` - ${priceMax.toLocaleString('vi-VN')} VND` : '';
    return `${min}${max}`;
  };
  const { showToast } = useToast();

  const defaultCheckIn = getLocalDateString();
  const defaultCheckOutDate = new Date();
  defaultCheckOutDate.setDate(defaultCheckOutDate.getDate() + 1);
  const defaultCheckOut = getLocalDateString(defaultCheckOutDate);

  // Main Search State
  const [searchLocation, setSearchLocation] = useState('All');
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState('');
  const [adultCount, setAdultCount] = useState(0);
  const [childrenCount, setChildrenCount] = useState(0);
  const [infantCount, setInfantCount] = useState(0);
  const guests = adultCount + childrenCount + infantCount;
  const [rooms, setRooms] = useState(1);
  const todayDate = getLocalDateString();

  // Advanced Filters State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [guestsDropdownOpen, setGuestsDropdownOpen] = useState(false);
  const guestsRef = useRef<HTMLDivElement | null>(null);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const locationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!guestsDropdownOpen && !locationDropdownOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (guestsDropdownOpen && !guestsRef.current?.contains(target)) {
        setGuestsDropdownOpen(false);
      }
      if (locationDropdownOpen && !locationRef.current?.contains(target)) {
        setLocationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [guestsDropdownOpen, locationDropdownOpen]);
  const [priceMax, setPriceMax] = useState(10000000);
  const [propertyType, setPropertyType] = useState<FilterParams['type']>('All');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [isAmenitiesModalOpen, setIsAmenitiesModalOpen] = useState(false);

  // Villa listings state for Featured Section
  const { data: featuredVillas = [], isLoading: loading, refetch: refetchFeaturedVillas } = useFeaturedVillasQuery(language);
  const locationOptions = useMemo(
    () => Array.from(new Set([...DEFAULT_LOCATIONS, ...featuredVillas.map(v => normalizeLocationCity(v.location)).filter(Boolean)])),
    [featuredVillas]
  );

  useEffect(() => {
    if (villasTriggerUpdate > 0) {
      void refetchFeaturedVillas();
    }
  }, [refetchFeaturedVillas, villasTriggerUpdate]);

  const handleFacilityToggle = (id: string) => {
    setSelectedFacilities(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (!checkIn && checkOut) {
      showToast('warning', t('home.invalidDates'));
      return;
    }

    if (checkIn && checkOut && (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start)) {
      showToast('warning', t('home.invalidDates'));
      return;
    }

    onSearch(
      {
        location: searchLocation,
        checkIn,
        checkOut,
        guests: Math.min(Math.max(guests, 1), 20),
        rooms: Math.min(Math.max(rooms, 1), 10)
      },
      {
        priceMin: 0,
        priceMax,
        type: propertyType,
        facilities: selectedFacilities
      }
    );
  };

  const clearFilters = () => {
    setSearchLocation('All');
    setCheckIn(defaultCheckIn);
    setCheckOut('');
    setAdultCount(0);
    setChildrenCount(0);
    setInfantCount(0);
    setRooms(1);
    setPriceMax(10000000);
    setPropertyType('All');
    setSelectedFacilities([]);
  };

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

  return (
    <div className="bg-[#fcf9f8] min-h-screen text-[#1c1b1b]">
      
      {/* Hero Section */}
      <section className="relative px-4 py-24 md:py-32 flex flex-col justify-center items-center min-h-[640px] bg-neutral-900 border-b border-neutral-100">
        
        {/* Real-world high-quality Background Cover */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <OptimizedImage 
            alt="Hero Background" 
            className="w-full h-full opacity-60 scale-105" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBud3XbpU1KkZU6_ipGAS8sg95iGGwYv48b2AJWzu2E0Z9LOnx75CG8dibLoZwtvKVN1F2k04nCRINGZrLVO8qhE316VsSJSonAhph1IzAEQoZZEXZDWpEIgfnCndd8K2qNiStz27XlvwkJxeEFTheIldO5_r_DGpBRyO0y7xQkf1HbcwKq3LWbg7LG68Uy-Y4IRu0Ib4ZBafvkVtqtLHuu0BjNe9AK8iBLtxeMd9jRFelui9KLwbnVOuVAmVQu4FSGx5OM3zvGAZ2"
            isHero={true}
            aspectRatioClassName="h-full w-full"
          />
          <div className="absolute inset-0 bg-neutral-900/40" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-[1000px] mx-auto text-center flex flex-col items-center">
          
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs text-indigo-50 font-medium mb-6">
            <span>{t('home.guaranteeTitle')}</span>
          </div>

          <h1 className="text-white text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight max-w-[850px] font-display drop-shadow-md">
            {t('home.heroTitle')}
          </h1>
          <p className="text-white/95 text-lg md:text-xl font-medium mt-3 mb-10 max-w-[650px] drop-shadow-sm">
            {t('home.heroSubtitle')}
          </p>

          {/* Search Main Box Container */}
          <div className="w-full max-w-[920px] bg-white rounded-2xl shadow-xl p-4 sm:p-6 text-left border border-white/25">
            <form id="search-form" onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              
              {/* Location selection */}
              <div className="md:col-span-4 flex flex-col gap-1.5 min-w-0">
                <label className="text-xs font-bold text-neutral-500 tracking-wide flex items-center gap-1.5 h-[18px]">
                  <MapPin className="w-3.5 h-3.5 text-[#0071c2]" />
                  {t('home.popularLocations')}
                </label>
                <div className="relative" ref={locationRef}>
                  <button
                    type="button"
                    onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                    className="w-full bg-neutral-50 h-[42px] pl-3 pr-8 border border-neutral-200 rounded-lg text-sm font-semibold outline-none cursor-pointer text-left text-[#1c1b1b] flex items-center justify-between select-none relative"
                  >
                    <span className="truncate">{getLocationLabel(searchLocation)}</span>
                    <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </button>

                  {locationDropdownOpen && (
                    <div className="absolute top-[calc(100%+8px)] left-0 z-[300] w-full sm:w-[280px] rounded-2xl border border-neutral-200 bg-white p-2 shadow-2xl shadow-neutral-900/20 animate-scaleIn sm:before:content-[''] sm:before:absolute sm:before:bottom-full sm:before:left-6 sm:before:border-[9px] sm:before:border-transparent sm:before:border-b-neutral-200 sm:after:content-[''] sm:after:absolute sm:after:bottom-full sm:after:left-[25px] sm:after:border-8 sm:after:border-transparent sm:after:border-b-white">
                      <div className="flex flex-col max-h-[240px] overflow-y-auto overscroll-contain gap-0.5">
                        {/* Option: All */}
                        <button
                          type="button"
                          onClick={() => {
                            setSearchLocation('All');
                            setLocationDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all text-left ${
                            searchLocation === 'All'
                              ? 'bg-[#edf3ff] text-[#005899]'
                              : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#0071c2]" />
                            <span>{t('loc.all')}</span>
                          </div>
                          {searchLocation === 'All' && <Check className="w-4 h-4 text-[#0071c2]" />}
                        </button>

                        {/* Other options */}
                        {locationOptions.filter(loc => loc !== 'All').map(loc => {
                          const isSelected = searchLocation === loc;
                          return (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => {
                                setSearchLocation(loc);
                                setLocationDropdownOpen(false);
                              }}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all text-left ${
                                isSelected
                                  ? 'bg-[#edf3ff] text-[#005899]'
                                  : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#0071c2]" />
                                <span>{getLocationLabel(loc)}</span>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-[#0071c2]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Check-In */}
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-500 tracking-wide flex items-center gap-1.5 h-[18px]">
                  <Calendar className="w-3.5 h-3.5 text-[#0071c2]" />
                  {t('home.checkIn')}
                </label>
                <CustomDatePicker
                  value={checkIn}
                  onChange={(next) => {
                    setCheckIn(next);
                    if (checkOut && new Date(checkOut) <= new Date(next)) {
                      const adjusted = new Date(next);
                      adjusted.setDate(adjusted.getDate() + 1);
                      setCheckOut(getLocalDateString(adjusted));
                    }
                  }}
                  minDate={todayDate}
                  label="dd/mm/yyyy"
                  buttonClassName="w-full bg-neutral-50 h-[42px] border border-neutral-200 rounded-lg text-sm font-semibold outline-none px-3 cursor-pointer text-left text-[#1c1b1b]"
                />
              </div>

              {/* Check-Out */}
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-500 tracking-wide flex items-center gap-1.5 h-[18px]">
                  <Calendar className="w-3.5 h-3.5 text-[#0071c2]" />
                  {t('home.checkOut')}
                </label>
                <CustomDatePicker
                  value={checkOut}
                  onChange={setCheckOut}
                  minDate={todayDate}
                  label="dd/mm/yyyy"
                  buttonClassName="w-full bg-neutral-50 h-[42px] border border-neutral-200 rounded-lg text-sm font-semibold outline-none px-3 cursor-pointer text-left text-[#1c1b1b]"
                />
              </div>

              {/* Guests Selection */}
              <div ref={guestsRef} className="md:col-span-3 flex flex-col gap-1.5 relative">
                <label className="text-xs font-bold text-neutral-500 tracking-wide flex items-center gap-1.5 h-[18px]">
                  <Users className="w-3.5 h-3.5 text-[#0071c2]" />
                  {t('home.guests')}
                </label>
                <button
                  type="button"
                  onClick={() => setGuestsDropdownOpen(!guestsDropdownOpen)}
                  className="w-full bg-neutral-50 h-[42px] pl-3 pr-8 border border-neutral-200 rounded-lg text-sm font-semibold outline-none cursor-pointer text-left select-none relative flex flex-col justify-center"
                >
                  <span className={`leading-tight truncate pr-2 ${guests > 0 ? 'text-[#1c1b1b]' : 'text-neutral-400'}`}>
                    {guests > 0 ? `${guests} ${t('detail.guestUnit')}` : t('home.guestsPlaceholder')}
                  </span>
                  <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </button>

                {guestsDropdownOpen && (
                  <div className="absolute top-[calc(100%+8px)] right-0 z-[300] w-full sm:w-[340px] rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl shadow-neutral-900/20 animate-scaleIn sm:before:content-[''] sm:before:absolute sm:before:bottom-full sm:before:right-[106px] sm:before:border-[9px] sm:before:border-transparent sm:before:border-b-neutral-200 sm:after:content-[''] sm:after:absolute sm:after:bottom-full sm:after:right-[107px] sm:after:border-8 sm:after:border-transparent sm:after:border-b-white">
                    <GuestCategoryPicker
                      adults={adultCount}
                      children={childrenCount}
                      infants={infantCount}
                      onAdultsChange={setAdultCount}
                      onChildrenChange={setChildrenCount}
                      onInfantsChange={setInfantCount}
                      maxGuests={20}
                      flat={true}
                      minAdults={0}
                      showMax={false}
                    />
                    <div className="mt-3 pt-2 border-t border-neutral-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setGuestsDropdownOpen(false)}
                        className="rounded-lg px-3.5 py-1.5 text-xs font-black text-[#0071c2] hover:bg-[#edf3ff] transition-all"
                      >
                        {t('common.done')}
                      </button>
                    </div>
                  </div>
                )}
              </div>


              {/* Submit btn */}
              <div className="md:col-span-1 flex flex-col justify-end">
                <button 
                  type="submit"
                  className="w-full bg-[#fe6a34] hover:bg-[#e05420] text-white h-[42px] rounded-lg font-black text-xs transition-colors shadow-lg shadow-[#fe6a34]/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4 shrink-0" />
                </button>
              </div>

            </form>

            {/* Config advanced custom filter expansion toggle key */}
            <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between flex-wrap gap-3">
              <button 
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-black text-[#0071c2] hover:text-[#005899] flex items-center gap-2 cursor-pointer transition-colors"
                id="toggle-advanced-ref"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{t('list.filters')}</span>
                <span className="text-[10px] bg-blue-50 text-[#0071c2] px-2 py-0.5 rounded-full font-bold">{t('home.filterEngine')}</span>
              </button>
            </div>

            {/* Dropdown advanced filter panel visual body */}
            {showAdvanced && (
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/50 mt-4 flex flex-col gap-4 animate-scaleIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Property type selection buttons */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-neutral-500 tracking-wide">{t('list.propertyType')}</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {([
                        { value: 'All' as const, label: t('list.allTypes') },
                        { value: 'villa' as const, label: t('nav.villa') },
                        { value: 'hotel_resort' as const, label: t('nav.hotelResort') },
                      ]).map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setPropertyType(type.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            propertyType === type.value
                              ? 'bg-[#0071c2] text-white border-[#0071c2]'
                              : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Slider */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-bold text-neutral-600 uppercase tracking-wider">
                      <span>{t('list.priceRange')}</span>
                      <span className="text-neutral-800 text-sm font-black">{priceMax.toLocaleString('vi-VN')} VND</span>
                    </div>
                    <div className="flex flex-col mt-2">
                      <input 
                        type="range"
                        min={1000000}
                        max={10000000}
                        step={500000}
                        value={priceMax}
                        onChange={(e) => setPriceMax(Number(e.target.value))}
                        className="w-full accent-[#0071c2] cursor-pointer"
                      />
                      <div className="flex justify-between mt-1 text-[10px] text-neutral-400 font-semibold font-mono">
                        <span>1.000.000 VND</span>
                        <span>5.000.000 VND</span>
                        <span>10.000.000 VND+</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-neutral-500 tracking-wide">{t('list.amenities')}</span>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {FILTER_FACILITIES.map(facility => {
                      const isChecked = selectedFacilities.includes(facility.id);
                      const Icon = AMENITY_ICON_COMPONENTS[facility.icon as keyof typeof AMENITY_ICON_COMPONENTS] || Sparkles;
                      return (
                        <label 
                          key={facility.id}
                          className={`group flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border text-left h-[42px] transition-all cursor-pointer relative select-none shadow-sm hover:shadow-md ${
                            isChecked 
                              ? 'bg-[#edf3ff] border-[#0071c2] text-[#0071c2]'
                              : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleFacilityToggle(facility.id)}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className={`h-4 w-4 shrink-0 transition-colors ${isChecked ? 'text-[#0071c2]' : 'text-neutral-400 group-hover:text-neutral-500'}`} />
                            <span className="truncate text-[11px] font-extrabold tracking-tight leading-none">
                              {getAmenityLabel(getAmenityDisplay(facility.id), language)}
                            </span>
                          </div>
                          <div className={`h-4 w-4 shrink-0 rounded-md border flex items-center justify-center transition-all ${
                            isChecked ? 'bg-[#0071c2] border-[#0071c2] text-white' : 'border-neutral-300 group-hover:border-neutral-400'
                          }`}>
                            {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                          </div>
                        </label>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setIsAmenitiesModalOpen(true)}
                      className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border border-dashed border-[#a1c9ff] bg-[#edf3ff]/20 text-[#0071c2] hover:bg-[#edf3ff]/50 h-[42px] cursor-pointer transition-all relative shadow-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Plus className="h-4 w-4 shrink-0 stroke-[2.5]" />
                        <span className="truncate text-[11px] font-extrabold tracking-tight leading-none">
                          {t('list.moreAmenitiesBtn')}
                        </span>
                      </div>
                      {selectedFacilities.length > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0071c2] text-[8px] font-black text-white px-1 animate-scaleIn">
                          {selectedFacilities.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>


                <div className="border-t border-neutral-200/50 pt-3 flex justify-end gap-3 text-xs">
                  <button 
                    type="button"
                    onClick={clearFilters}
                    className="px-4 py-2 font-bold text-neutral-500 hover:text-neutral-800 bg-white hover:bg-neutral-100 rounded-lg transition-all cursor-pointer"
                  >
                    {t('list.resetFilters')}
                  </button>
                  <button 
                    type="submit"
                    form="search-form"
                    className="px-5 py-2 font-black bg-[#0071c2] text-white hover:bg-[#005899] rounded-lg shadow transition-all cursor-pointer"
                  >
                    {t('home.searchBtn')}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Popular Destinations Visual Grid */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-[#fe6a34] text-xs font-bold tracking-wide">{t('home.popularLocationsDesc')}</span>
            <h2 className="text-3xl font-display font-black tracking-tight text-neutral-800 mt-1">{t('home.popularLocations')}</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
          {[
            { loc: 'Huế', key: 'loc.hue', img: '/hue_citadel.png', gradient: 'from-purple-900/70' },
            { loc: 'Đà Nẵng', key: 'loc.danang', img: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=900&q=80', gradient: 'from-blue-900/70' },
            { loc: 'Hội An', key: 'loc.hoian', img: '/hoi_an_town.png', gradient: 'from-amber-900/70' },
            { loc: 'All', key: 'loc.nationwide', img: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80', gradient: 'from-rose-900/70' },
          ].map((item) => (
            <button
              key={item.loc}
              onClick={() => {
                onSearch(
                  { location: item.loc, checkIn, checkOut, guests, rooms },
                  { priceMin: 0, priceMax, type: propertyType, facilities: selectedFacilities }
                );
              }}
              className="relative aspect-[3/2] rounded-2xl overflow-hidden group cursor-pointer focus-ring"
            >
              <OptimizedImage
                src={item.img}
                alt={t(item.key)}
                className="w-full h-full group-hover:scale-110 transition-transform duration-700"
                aspectRatioClassName="h-full w-full"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${item.gradient} to-transparent`} />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                <h3 className="text-white font-black text-lg leading-tight drop-shadow-md">{t(item.key)}</h3>
                <p className="text-white/80 text-[10px] font-bold mt-0.5 uppercase tracking-wider">
                  {featuredVillas.filter(v => v.location === item.loc).length}+ {t('home.properties')}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Villas Section (Screen 1 "Villa Nổi Bật" mockup spec) */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 py-16 border-t border-neutral-100">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-neutral-100 gap-4">
          <div>
            <span className="text-[#fe6a34] text-xs font-bold tracking-wide">{t('home.popularLocationsDesc')}</span>
            <h2 className="text-3xl font-display font-black tracking-tight text-neutral-800 mt-1">{t('home.featuredVillas')}</h2>
          </div>
          <button 
            onClick={() => onSearch({ location: 'All', checkIn, checkOut, guests, rooms }, { priceMin: 0, priceMax, type: 'All', facilities: [] })}
            className="text-sm font-bold text-[#0071c2] hover:text-[#005899] transition-all flex items-center gap-1.5 cursor-pointer group"
          >
            <span>{t('home.viewDetails')}</span>
            <span className="group-hover:translate-x-1.5 transition-transform">→</span>
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white p-4 rounded-xl border border-neutral-100 flex flex-col gap-3 animate-pulse h-96">
                <div className="w-full h-48 bg-neutral-200 rounded-lg" />
                <div className="h-6 bg-neutral-200 rounded w-2/3 mt-2" />
                <div className="h-4 bg-neutral-200 rounded w-1/2" />
                <div className="h-8 bg-neutral-200 rounded w-full mt-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-children">
            {featuredVillas.map((villa) => {
              const ratingDisplay = villa.rating > 0 
                ? (
                  <div className="flex items-center gap-1 text-xs font-bold text-[#fe6a34] bg-[#ffdbd0]/40 px-2 py-0.5 rounded-full">
                    <Star className="w-3 h-3 fill-[#fe6a34] text-[#fe6a34]" />
                    <span>{villa.rating}</span>
                    <span className="text-neutral-500 font-normal">({villa.reviewsCount})</span>
                  </div>
                ) 
                : <span className="text-xs font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">{t('home.noReviews')}</span>;

              const badgeColor = villa.status === 'Available'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : villa.status === 'Hết phòng' 
                  ? 'bg-red-100 text-red-800 border-red-200' 
                  : 'bg-neutral-100 text-neutral-600 border-neutral-200';

              return (
                <div 
                  key={villa.id} 
                  onClick={() => onViewDetail(String(villa.id), villa.type)}
                  className="bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group hover:-translate-y-1.5 cursor-pointer"
                >
                  {/* Photo area */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <OptimizedImage 
                      src={villa.image} 
                      alt={villa.name} 
                      className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className={`absolute top-3 left-3 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-md border backdrop-blur-md shadow-sm ${badgeColor}`}>
                      {t(`status.${villa.status}`)}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="text-lg font-bold text-neutral-800 line-clamp-1 group-hover:text-[#0071c2] transition-colors">
                        {villa.name}
                      </h3>
                      {ratingDisplay}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{getLocationLabel(villa.location)}</span>
                    </div>

                    <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed mb-4 flex-grow">
                      {villa.description}
                    </p>

                    {/* Footer Row */}
                    <div className="flex items-end justify-between pt-4 border-t border-neutral-100">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-neutral-400 tracking-wide">{t('home.from')}</span>
                        <span className="text-sm font-black leading-6 tracking-tight text-[#fe6a34] font-display">
                          {formatPriceRange(villa.price, villa.priceMax)}
                        </span>
                        <span className="text-[11px] font-bold text-neutral-400">{t('public.pricePerNight')}</span>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetail(String(villa.id), villa.type);
                        }}
                        className="bg-white hover:bg-[#edf3ff] text-[#0071c2] font-semibold text-xs py-2 px-3.5 border border-[#a1c9ff] rounded-lg hover:border-[#0071c2] active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>{t('home.viewDetails')}</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Why Choose Us */}
      <section className="bg-neutral-50 border-t border-b border-neutral-100 py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 text-center">
          <span className="text-[#fe6a34] text-xs font-bold tracking-wide">{t('home.guaranteeTag')}</span>
          <h2 className="text-3xl font-display font-black tracking-tight text-neutral-800 mt-1 mb-12">{t('home.guaranteeTitle')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cardinal feature 1 */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm flex flex-col items-center">
              <div className="w-16 h-16 bg-[#edf3ff] rounded-full flex items-center justify-center text-[#0071c2] mb-6 shadow-sm">
                <MessageSquare className="w-8 h-8 font-bold fill-neutral-50 text-[#0071c2]" />
              </div>
              <h3 className="text-xl font-bold text-neutral-800 mb-2">{t('home.zaloBookingTitle')}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed max-w-[280px]">
                {t('home.zaloBookingDesc')}
              </p>
            </div>

            {/* Cardinal feature 2 */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-150 shadow-sm flex flex-col items-center">
              <div className="w-16 h-16 bg-[#edf3ff] rounded-full flex items-center justify-center text-[#0071c2] mb-6 shadow-sm">
                <ShieldCheck className="w-8 h-8 font-bold text-[#0071c2]" />
              </div>
              <h3 className="text-xl font-bold text-neutral-800 mb-2">{t('home.holdTitle')}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed max-w-[280px]">
                {t('home.holdDesc')}
              </p>
            </div>

            {/* Cardinal feature 3 */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm flex flex-col items-center">
              <div className="w-16 h-16 bg-[#edf3ff] rounded-full flex items-center justify-center text-[#0071c2] mb-6 shadow-sm">
                <Star className="w-8 h-8 fill-[#0071c2] text-[#0071c2]" />
              </div>
              <h3 className="text-xl font-bold text-neutral-800 mb-2">{t('home.reviewTitle')}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed max-w-[280px]">
                {t('home.reviewDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <AmenitiesModal
        isOpen={isAmenitiesModalOpen}
        onClose={() => setIsAmenitiesModalOpen(false)}
        selectedFacilities={selectedFacilities}
        onChange={setSelectedFacilities}
      />
    </div>
  );
}

