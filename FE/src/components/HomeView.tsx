import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, Users, SlidersHorizontal, Search, Star, MapPin, Check, MessageSquare, ShieldCheck, Heart } from 'lucide-react';
import { Villa } from '../types';
import { getVillas } from '../lib/api';
import { LOCATIONS, FACILITIES } from '../constants';
import { useToast } from './Toast';
import { useLanguage } from '../contexts/LanguageContext';
import OptimizedImage from './OptimizedImage';

interface HomeViewProps {
  onSearch: (searchParams: {
    location: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    rooms: number;
  }, filterParams: {
    priceMin: number;
    priceMax: number;
    type?: 'Villa' | 'Homestay' | 'Căn hộ' | 'All';
    facilities: string[];
  }) => void;
  onViewDetail: (id: string) => void;
  villasTriggerUpdate?: number; // to refetch if admin inserts new villas
}

export default function HomeView({ onSearch, onViewDetail, villasTriggerUpdate = 0 }: HomeViewProps) {
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  // Main Search State
  const [searchLocation, setSearchLocation] = useState('Đà Lạt');
  const [checkIn, setCheckIn] = useState('2026-06-20');
  const [checkOut, setCheckOut] = useState('2026-06-23');
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);

  // Advanced Filters State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [priceMax, setPriceMax] = useState(10000000);
  const [propertyType, setPropertyType] = useState<'All' | 'Villa' | 'Homestay' | 'Căn hộ'>('All');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);

  // Villa listings state for Featured Section
  const [featuredVillas, setFeaturedVillas] = useState<Villa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadFeatured() {
      setLoading(true);
      try {
        const list = await getVillas();
        if (isMounted) {
          setFeaturedVillas(list.slice(0, 6));
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setFeaturedVillas([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadFeatured();
    return () => {
      isMounted = false;
    };
  }, [villasTriggerUpdate]);

  const handleFacilityToggle = (id: string) => {
    setSelectedFacilities(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (!checkIn || !checkOut || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      showToast('warning', language === 'vi'
        ? 'Ng?y tr? ph?ng ph?i sau ng?y nh?n ph?ng.'
        : (language === 'ko' ? '???? ??? ??? ???? ???.' : 'Check-out must be after check-in.')
      );
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
      'Nha Trang': 'loc.nhatrang',
      'TP.HCM': 'loc.hcm',
    };
    const key = keyMap[loc];
    return key ? t(key) : loc;
  }, [t]);

  return (
    <div className="bg-[#fcf9f8] min-h-screen text-[#1c1b1b]">
      
      {/* Hero Section */}
      <section className="relative px-4 py-24 md:py-32 flex flex-col justify-center items-center overflow-hidden min-h-[640px] bg-neutral-900 border-b border-neutral-100">
        
        {/* Real-world high-quality Background Cover */}
        <div className="absolute inset-0 z-0">
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
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              
              {/* Location selection */}
              <div className="md:col-span-3 flex flex-col gap-1.5 min-w-0">
                <label className="text-xs font-bold text-neutral-500 tracking-wide flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0071c2]" />
                  {t('home.popularLocations')}
                </label>
                <div className="relative">
                  <select 
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full bg-neutral-50 py-2.5 pl-3 pr-8 border border-neutral-200 rounded-lg text-sm font-semibold outline-none focus:border-[#0071c2] focus:ring-1 focus:ring-[#0071c2] cursor-pointer appearance-none text-[#1c1b1b]"
                  >
                    {LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{getLocationLabel(loc)}</option>
                    ))}
                  </select>
                  <MapPin className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Check-In */}
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-500 tracking-wide flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0071c2]" />
                  {t('home.checkIn')}
                </label>
                <div className="relative">
                  <input 
                    type="date"
                    value={checkIn}
                    onChange={(e) => {
                      const next = e.target.value;
                      setCheckIn(next);
                      if (checkOut && new Date(checkOut) <= new Date(next)) {
                        const adjusted = new Date(next);
                        adjusted.setDate(adjusted.getDate() + 1);
                        setCheckOut(adjusted.toISOString().slice(0, 10));
                      }
                    }}
                    className="w-full bg-neutral-50 py-2.5 border border-neutral-200 rounded-lg text-sm font-semibold outline-none px-3 cursor-pointer text-[#1c1b1b]"
                  />
                </div>
              </div>

              {/* Check-Out */}
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-500 tracking-wide flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0071c2]" />
                  {t('home.checkOut')}
                </label>
                <div className="relative">
                  <input 
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-neutral-50 py-2.5 border border-neutral-200 rounded-lg text-sm font-semibold outline-none px-3 cursor-pointer text-[#1c1b1b]"
                  />
                </div>
              </div>

              {/* Guests Selection */}
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-500 tracking-wide flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#0071c2]" />
                  {t('home.guests')}
                </label>
                <input 
                  type="number"
                  min={1}
                  max={20}
                  value={guests}
                  onChange={(e) => setGuests(Math.min(Math.max(Number(e.target.value), 1), 20))}
                  className="w-full bg-neutral-50 py-2.5 px-3 border border-neutral-200 rounded-lg text-sm font-semibold outline-none focus:border-[#0071c2] text-[#1c1b1b]"
                />
              </div>

              {/* Rooms Selection */}
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-500 tracking-wide flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#0071c2]" />
                  {t('home.rooms')}
                </label>
                <input 
                  type="number"
                  min={1}
                  max={10}
                  value={rooms}
                  onChange={(e) => setRooms(Math.min(Math.max(Number(e.target.value), 1), 10))}
                  className="w-full bg-neutral-50 py-2.5 px-3 border border-neutral-200 rounded-lg text-sm font-semibold outline-none focus:border-[#0071c2] text-[#1c1b1b]"
                />
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

              <div className="text-[10px] text-neutral-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>{t('home.filterActive')}</span>
              </div>
            </div>

            {/* Dropdown advanced filter panel visual body */}
            {showAdvanced && (
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/50 mt-4 flex flex-col gap-4 animate-scaleIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Property type selection buttons */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-neutral-500 tracking-wide">{t('list.propertyType')}</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {['All', 'Villa', 'Homestay', 'Căn hộ'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setPropertyType(type as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            propertyType === type
                              ? 'bg-[#0071c2] text-white border-[#0071c2]'
                              : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          {type === 'All' ? t('list.allTypes') : (type === 'Villa' ? t('list.villa') : (type === 'Homestay' ? t('list.homestay') : t('list.apartment')))}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Slider */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-bold text-neutral-600 uppercase tracking-wider">
                      <span>{t('list.priceRange')}</span>
                      <span className="text-neutral-800 text-sm font-black">{priceMax.toLocaleString('vi-VN')}₫</span>
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
                        <span>1.000.000₫</span>
                        <span>5.000.000₫</span>
                        <span>10.000.000₫+</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-neutral-500 tracking-wide">{t('list.amenities')}</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 mt-1.5">
                    {FACILITIES.map(facility => {
                      const isChecked = selectedFacilities.includes(facility.id);
                      return (
                        <label 
                          key={facility.id}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all ${
                            isChecked 
                              ? 'bg-[#edf3ff] border-[#a1c9ff] text-[#005899]' 
                              : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleFacilityToggle(facility.id)}
                            className="w-3.5 h-3.5 text-[#0071c2] rounded border-neutral-300 focus:ring-[#0071c2]"
                          />
                          <span>{t(`fac.${facility.id}`) || facility.label}</span>
                        </label>
                      );
                    })}
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
            { loc: 'Đà Lạt', key: 'loc.dalat', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBud3XbpU1KkZU6_ipGAS8sg95iGGwYv48b2AJWzu2E0Z9LOnx75CG8dibLoZwtvKVN1F2k04nCRINGZrLVO8qhE316VsSJSonAhph1IzAEQoZZEXZDWpEIgfnCndd8K2qNiStz27XlvwkJxeEFTheIldO5_r_DGpBRyO0y7xQkf1HbcwKq3LWbg7LG68Uy-Y4IRu0Ib4ZBafvkVtqtLHuu0BjNe9AK8iBLtxeMd9jRFelui9KLwbnVOuVAmVQu4FSGx5OM3zvGAZ2', gradient: 'from-emerald-900/70' },
            { loc: 'Vũng Tàu', key: 'loc.vungtau', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeZG45D3DnfueIyicV13N_6e0AgO8vZ3aHnaoGUlwPYsMrfYsBM-49FmORxbyLO-MAtENvre0VWcUGszJ0OF_sRf5AzKjg5LUgo1oysra6sd1-i78pqjsgAgTVXfHJIS6JZHdR12jaVlS1Zrm0eaZ9TrFe9JXeQGsniTkQPaD1woFoCiP41-1vHf89ZysceOemYy9UavfVx3WLlIB-SDax5n0Y0xyaXHte9maOVwGeVnouMoUe4ydE7SS-Z3SN2JGoDbJazePRaY8-', gradient: 'from-blue-900/70' },
            { loc: 'Phú Quốc', key: 'loc.phuquoc', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_Gzvn930KTyXIc-oGwCk6j8QAahpFMLvyFwuJr-PvzI7x4xlvEtqhk14hXKOamtpSnUZUEJI7pevyu5APRprYW9mSo1xjx2q3RG6r0x6bIDUge7h6u9aQCIrj7PbeNd_QaOs8tvQjj1JcMXzvGakEzS_M2hiXjl9-nrjxsjZAnY-YYSnz78hNGWTuV9lEaF6nmRLmeQMSXFX1E00AoOpz5KXRlOawIIJv_0qXEx6EsFn4F4G8R5jcSLd32JmjaATxUXQiVnjn8y0u', gradient: 'from-amber-900/70' },
            { loc: 'Hội An', key: 'loc.hoian', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnJlGr3IgXtsgrN9e5EO8SF27R6jQle_YqTUX77vw7NdspyX-lGuIxv0FtNh2Ao3qOJ_ZDDPgwUGU2n5f001gO8pJNhizxzP2ybsfekot4YSRNi2NNiVyGoqnnVr6eBQbWzyfyAdKXuvMlrVe5EuADwuyL4_8UHpUdJUsckH22lcyv3Rm2SeJMm38VIbe_NUpC-bWjgwtyZcqCpYqP9TYHclDduFVsj3CnbcB2fjmPUudsTbwkp9JXyTzoCPlJ2At0r9YY02WFvEXv', gradient: 'from-rose-900/70' },
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
                  className="bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group hover:-translate-y-1.5"
                >
                  {/* Photo area */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <OptimizedImage 
                      src={villa.image} 
                      alt={villa.name} 
                      className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className={`absolute top-3 left-3 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-md border backdrop-blur-md shadow-sm ${badgeColor}`}>
                      {t(`status.${villa.status.toUpperCase()}`) || t(`status.${villa.status}`) || villa.status}
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
                    <div className="flex items-end justify-between pt-4 border-t border-neutral-100 font-mono">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-neutral-400 tracking-wide">{t('home.from')}</span>
                        <span className="text-lg font-black text-[#fe6a34] font-display">
                          {villa.price.toLocaleString('vi-VN')}₫
                          <span className="text-xs text-neutral-400 font-normal"> / {t('home.night')}</span>
                        </span>
                      </div>

                      <button 
                        onClick={() => onViewDetail(villa.id)}
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

    </div>
  );
}
