import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Building2, Trash2, Edit, PlusCircle, Search, MapPin, 
  Users, CheckCircle2, AlertCircle, X, Copy, Eye, 
  ToggleLeft, ToggleRight, CheckSquare, Square 
} from 'lucide-react';
import { AccommodationTypeLabel, EntityId, VillaDetail, VillaMedia } from '../../types';
import { AMENITY_CATEGORY_LABELS, AMENITIES, getAmenityDisplay, getAmenityLabel, normalizeAmenityKey, normalizeAmenityKeys } from '../../data/amenities';
import { VIETNAM_PROVINCES_2025 } from '../../constants/vietnamProvinces';
import { useLanguage } from '../../contexts/LanguageContext';
import MediaUploader from './MediaUploader';

interface AdminVillaManagerProps {
  villas: VillaDetail[];
  onAddVilla: (v: Omit<VillaDetail, 'id' | 'rating' | 'reviewsCount' | 'bookedDates' | 'pendingDates' | 'blockedDates'>) => Promise<void>;
  onDeleteVilla: (id: EntityId, name: string) => void;
  onUpdateVilla: (v: VillaDetail) => void | Promise<void>;
  onDuplicateVilla: (id: EntityId) => void | Promise<void>;
  onBulkDeleteVillas: (ids: EntityId[]) => void;
  onBulkStatusUpdateVillas: (ids: EntityId[], active: boolean) => void;
  showAddModalDirectly?: boolean;
  onCloseAddModalDirectly?: () => void;
  mutationLoading?: boolean;
}

export default function AdminVillaManager({
  villas,
  onAddVilla,
  onDeleteVilla,
  onUpdateVilla,
  onDuplicateVilla,
  onBulkDeleteVillas,
  onBulkStatusUpdateVillas,
  showAddModalDirectly = false,
  onCloseAddModalDirectly,
  mutationLoading = false
}: AdminVillaManagerProps) {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [amenitySearchQuery, setAmenitySearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Hết phòng' | 'Sắp có' | 'Maintenance'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | AccommodationTypeLabel>('All');
  
  // Custom Active/Inactive filter state
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Modals Toggles
  const [showAddModal, setShowAddModal] = useState(showAddModalDirectly);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVilla, setEditingVilla] = useState<VillaDetail | null>(null);
  const modalOverlayRef = useRef<HTMLDivElement>(null);
  const modalPanelRef = useRef<HTMLDivElement>(null);

  // Bulk selections state
  const [selectedVillaIds, setSelectedVillaIds] = useState<EntityId[]>([]);

  // Add/Edit Form State
  const [villaName, setVillaName] = useState('');
  const [villaLocation, setVillaLocation] = useState('');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [villaPrice, setVillaPrice] = useState<number | ''>('');
  const [villaPriceMax, setVillaPriceMax] = useState<number | ''>('');
  const [villaType, setVillaType] = useState<AccommodationTypeLabel>('Villa');
  const [villaDescription, setVillaDescription] = useState('');
  const [villaNameEn, setVillaNameEn] = useState('');
  const [villaLocationEn, setVillaLocationEn] = useState('');
  const [villaDescriptionEn, setVillaDescriptionEn] = useState('');
  const [villaDescriptionKo, setVillaDescriptionKo] = useState('');
  const [villaAddress, setVillaAddress] = useState('');
  const [villaGuests, setVillaGuests] = useState(8);
  const [villaBedrooms, setVillaBedrooms] = useState(4);
  const [villaBathrooms, setVillaBathrooms] = useState(4);
  const [villaFacilities, setVillaFacilities] = useState<string[]>(['wifi', 'kitchen']);
  const [villaStatus, setVillaStatus] = useState<'Available' | 'Hết phòng' | 'Sắp có' | 'Maintenance'>('Available');
  const [villaIsActive, setVillaIsActive] = useState(true);
  const [pendingMediaPreview, setPendingMediaPreview] = useState<VillaMedia[]>([]);

  useEffect(() => {
    const isModalOpen = showAddModal || showEditModal;
    if (!isModalOpen) return;
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showAddModal, showEditModal]);

  const resetVillaModalScroll = () => {
    requestAnimationFrame(() => {
      modalOverlayRef.current?.scrollTo({ top: 0, behavior: 'auto' });
      modalPanelRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    });
  };

  useEffect(() => {
    const isModalOpen = showAddModal || showEditModal;
    if (!isModalOpen) return;

    resetVillaModalScroll();
  }, [showAddModal, showEditModal, editingVilla?.id]);

  // Load details to editor
  const handleOpenEdit = (v: VillaDetail) => {
    setEditingVilla(v);
    setVillaName(v.name);
    setVillaLocation(v.location);
    setVillaPrice(v.price);
    setVillaPriceMax(v.priceMax ?? '');
    setVillaType(v.type);
    setVillaDescription(v.description);
    setVillaNameEn(v.nameEn || '');
    setVillaLocationEn(v.locationEn || '');
    setVillaDescriptionEn(v.descriptionEn || '');
    setVillaDescriptionKo(v.descriptionKo || '');
    setVillaAddress(v.address);
    setVillaGuests(v.guestsCount);
    setVillaBedrooms(v.bedroomsCount);
    setVillaBathrooms(v.bathroomsCount);
    setVillaFacilities(normalizeAmenityKeys(v.facilities));
    setVillaStatus(v.status);
    setVillaIsActive(v.isActive !== false);
    resetVillaModalScroll();
    setShowEditModal(true);
  };

  const handleOpenAdd = () => {
    setVillaName('');
    setVillaLocation('');
    setVillaPrice('');
    setVillaPriceMax('');
    setVillaType('Villa');
    setVillaDescription('');
    setVillaNameEn('');
    setVillaLocationEn('');
    setVillaDescriptionEn('');
    setVillaDescriptionKo('');
    setVillaAddress('');
    setVillaGuests(8);
    setVillaBedrooms(4);
    setVillaBathrooms(4);
    setVillaFacilities(['wifi_high_speed', 'kitchen']);
    setAmenitySearchQuery('');
    setVillaStatus('Available');
    setVillaIsActive(true);
    setPendingMediaPreview([]);
    resetVillaModalScroll();
    setShowAddModal(true);
  };

  const handleCloseAdd = () => {
    setShowAddModal(false);
    if (onCloseAddModalDirectly) {
      onCloseAddModalDirectly();
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (villaPriceMax !== '' && villaPrice !== '' && Number(villaPriceMax) < Number(villaPrice)) {
      alert(t('admin.validationVillaPriceRange'));
      return;
    }
    await onAddVilla({
      name: villaName,
      location: villaLocation,
      price: Number(villaPrice),
      priceMax: villaPriceMax === '' ? null : Number(villaPriceMax),
      type: villaType,
      description: villaDescription,
      nameEn: villaNameEn,
      locationEn: villaLocationEn,
      descriptionEn: villaDescriptionEn,
      descriptionKo: villaDescriptionKo,
      address: villaAddress,
      guestsCount: villaGuests,
      bedroomsCount: villaBedrooms,
      bathroomsCount: villaBathrooms,
      facilities: villaFacilities,
      image: pendingMediaPreview.find((item) => item.isCover)?.thumbnailUrl || pendingMediaPreview[0]?.thumbnailUrl || pendingMediaPreview[0]?.url || '',
      media: pendingMediaPreview,
      status: villaStatus,
      isActive: villaIsActive,
      policies: {
        time: ['Nhận phòng: Từ 14:00', 'Trả phòng: Trước 12:00'],
        other: ['Cần liên hệ đặt cọc trước.', 'Giữ vệ sinh chung.']
      }
    });
    handleCloseAdd();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVilla) return;
    if (villaPriceMax !== '' && villaPrice !== '' && Number(villaPriceMax) < Number(villaPrice)) {
      alert(t('admin.validationVillaPriceRange'));
      return;
    }
    await onUpdateVilla({
      ...editingVilla,
      name: villaName,
      location: villaLocation,
      price: Number(villaPrice),
      priceMax: villaPriceMax === '' ? null : Number(villaPriceMax),
      type: villaType,
      description: villaDescription,
      nameEn: villaNameEn,
      locationEn: villaLocationEn,
      descriptionEn: villaDescriptionEn,
      descriptionKo: villaDescriptionKo,
      address: villaAddress,
      guestsCount: villaGuests,
      bedroomsCount: villaBedrooms,
      bathroomsCount: villaBathrooms,
      facilities: villaFacilities,
      image: editingVilla.image,
      media: editingVilla.media,
      status: villaStatus,
      isActive: villaIsActive
    });
    setShowEditModal(false);
    setEditingVilla(null);
  };

  const handleFacilityToggle = (id: string) => {
    const normalizedId = normalizeAmenityKey(id);
    setVillaFacilities(prev => {
      const normalized = normalizeAmenityKeys(prev);
      return normalized.includes(normalizedId) ? normalized.filter(x => x !== normalizedId) : [...normalized, normalizedId];
    });
  };

  // Toggle active individual
  const handleToggleActiveIndividual = (v: VillaDetail) => {
    const nextActive = !(v.isActive !== false);
    onUpdateVilla({
      ...v,
      isActive: nextActive,
      status: nextActive ? 'Available' : v.status
    });
  };

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  // Filter & Search
  const filteredVillas = useMemo(() => villas.filter(v => {
    const matchesSearch = !normalizedSearchQuery ||
      v.name.toLowerCase().includes(normalizedSearchQuery) ||
      v.location.toLowerCase().includes(normalizedSearchQuery);
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    
    // Active/Inactive filter matching
    const activeVal = v.isActive !== false;
    const matchesActive = 
      activeFilter === 'All' ? true :
      activeFilter === 'Active' ? activeVal === true :
      activeVal === false;


    const matchesType = typeFilter === 'All' || v.type === typeFilter;

    return matchesSearch && matchesStatus && matchesActive && matchesType;
  }), [activeFilter, normalizedSearchQuery, statusFilter, typeFilter, villas]);

  // Checkbox handlers
  const handleToggleSelect = (id: EntityId) => {
    setSelectedVillaIds(prev =>
      prev.some(x => String(x) === String(id)) ? prev.filter(x => String(x) !== String(id)) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedVillaIds.length === filteredVillas.length) {
      setSelectedVillaIds([]);
    } else {
      setSelectedVillaIds(filteredVillas.map(v => v.id));
    }
  };

  const handleBulkStatusChange = (active: boolean) => {
    onBulkStatusUpdateVillas(selectedVillaIds, active);
    setSelectedVillaIds([]);
  };

  const locationSuggestions = useMemo(() => {
    const query = villaLocation.trim().toLowerCase();
    if (!query) return VIETNAM_PROVINCES_2025.slice(0, 8);
    return VIETNAM_PROVINCES_2025.filter((province) =>
      province.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [villaLocation]);

  const handleBulkDelete = () => {
    onBulkDeleteVillas(selectedVillaIds);
    setSelectedVillaIds([]);
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3.5 top-3 text-neutral-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder={t('admin.villa.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold outline-none focus:bg-white focus:border-[#0071c2]"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Availability Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-700 outline-none cursor-pointer"
          >
            <option value="All">{t('admin.villa.allStatuses')}</option>
            <option value="Available">{t('admin.villa.available')}</option>
            <option value="Hết phòng">{t('admin.villa.booked')}</option>
            <option value="Sắp có">{t('admin.villa.upcoming')}</option>
            <option value="Maintenance">{t('admin.villa.maintenance')}</option>
          </select>

          {/* Accommodation Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'All' | AccommodationTypeLabel)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-700 outline-none cursor-pointer"
          >
            <option value="All">{t('admin.villa.allTypes')}</option>
            <option value="Villa">Villa</option>
            <option value="Khách sạn - resort">{t('nav.hotelResort')}</option>
          </select>

          {/* Active / Inactive operational filter */}
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as any)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-700 outline-none cursor-pointer"
          >
            <option value="All">{t('admin.villa.allActivity')}</option>
            <option value="Active">{t('admin.villa.activeOnly')}</option>
            <option value="Inactive">{t('admin.villa.inactiveOnly')}</option>
          </select>

          <button
            onClick={handleOpenAdd}
            className="bg-[#0071c2] hover:bg-[#005899] text-white font-black text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow shadow-[#0071c2]/10"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('admin.villa.add')}</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when selectedVillaIds.length > 0) */}
      {selectedVillaIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-scaleIn shadow-sm">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
            <CheckCircle2 className="w-5 h-5 text-[#0071c2]" />
            <span>
              {t('admin.villa.selected', { count: selectedVillaIds.length })}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleBulkStatusChange(true)}
              className="bg-white hover:bg-neutral-50 text-emerald-600 border border-emerald-200 font-bold text-xs py-2 px-4 rounded-xl cursor-pointer transition-colors"
            >
              {t('admin.villa.batchActive')}
            </button>
            <button
              onClick={() => handleBulkStatusChange(false)}
              className="bg-white hover:bg-neutral-50 text-neutral-500 border border-neutral-200 font-bold text-xs py-2 px-4 rounded-xl cursor-pointer transition-colors"
            >
              {t('admin.villa.batchInactive')}
            </button>
            <button
              onClick={handleBulkDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-2 px-4 rounded-xl cursor-pointer transition-colors shadow shadow-rose-600/10"
            >
              {t('admin.villa.batchDelete')}
            </button>
          </div>
        </div>
      )}

      {/* Select All checklist anchor */}
      {filteredVillas.length > 0 && (
        <div className="flex items-center justify-between text-xs px-2">
          <button
            onClick={handleToggleSelectAll}
            className="flex items-center gap-1.5 font-bold text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            {selectedVillaIds.length === filteredVillas.length ? (
              <CheckSquare className="w-4 h-4 text-[#0071c2]" />
            ) : (
              <Square className="w-4 h-4 text-neutral-350" />
            )}
            <span>
              {selectedVillaIds.length === filteredVillas.length ? t('admin.villa.deselectAll') : t('admin.villa.selectAll')}
            </span>
          </button>
          <span className="text-[10px] text-neutral-400 font-semibold font-mono">
            {t('admin.villa.showing', { count: filteredVillas.length })}
          </span>
        </div>
      )}

      {/* Grid listing */}
      <div className="grid min-h-[420px] grid-cols-1 content-start gap-5 sm:grid-cols-2 md:grid-cols-3">
        {filteredVillas.length === 0 ? (
          <div className="col-span-full flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white/70 px-6 py-10 text-center">
            <Building2 className="mb-3 h-9 w-9 text-neutral-300" />
            <p className="text-sm font-black text-neutral-700">{t('admin.villa.noRooms')}</p>
            <p className="mt-1 text-xs font-semibold text-neutral-400">{t('admin.villa.noRoomsDesc')}</p>
          </div>
        ) : filteredVillas.map((v) => {
          const isChecked = selectedVillaIds.some(id => String(id) === String(v.id));
          const isActive = v.isActive !== false;
          
          const badgeClass = 
            v.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
            v.status === 'Hết phòng' ? 'bg-rose-50 text-rose-700 border-rose-100' :
            v.status === 'Maintenance' ? 'bg-amber-50 text-amber-700 border-amber-100' :
            'bg-neutral-100 text-neutral-500 border-neutral-200';

          return (
            <div 
              key={v.id} 
              className={`bg-white rounded-2xl border overflow-hidden shadow-sm flex flex-col group hover:shadow-md transition-all duration-200 ${
                isChecked ? 'border-[#0071c2] ring-2 ring-[#0071c2]/10 bg-blue-50/5' : 'border-neutral-100'
              }`}
            >
              {/* Image Block */}
              <div className="relative aspect-[4/3] w-full bg-neutral-100">
                <img 
                  src={v.image} 
                  alt={v.name} 
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" 
                />
                
                {/* Row Checkbox Overlay top-left */}
                <button
                  type="button"
                  onClick={() => handleToggleSelect(v.id)}
                  className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg p-1 text-neutral-800 shadow hover:scale-105 transition-all cursor-pointer z-10"
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-[#0071c2]" />
                  ) : (
                    <Square className="w-4 h-4 text-neutral-400" />
                  )}
                </button>

                {/* Active/Inactive badge Overlay top-right */}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border backdrop-blur-md ${badgeClass}`}>
                    {v.status === 'Available'
                      ? t('admin.villa.available')
                      : v.status === 'Hết phòng'
                        ? t('admin.villa.booked')
                        : v.status === 'Maintenance'
                          ? t('admin.villa.maintenance')
                          : v.status === 'Sắp có'
                            ? t('admin.villa.upcoming')
                            : v.status}
                  </span>
                  
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border backdrop-blur-md ${
                    isActive 
                      ? 'bg-emerald-500/90 text-white border-emerald-400' 
                      : 'bg-neutral-500/90 text-white border-neutral-400'
                  }`}>
                    {isActive ? t('admin.villa.activeOption') : t('admin.villa.inactiveOption')}
                  </span>
                </div>

                <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                  ID: {v.id}
                </span>
              </div>

              {/* Body */}
              <div className="p-4 flex flex-col flex-grow gap-2">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] bg-[#edf3ff] text-[#005899] px-2 py-0.5 rounded font-black uppercase tracking-wider">
                      {v.type}
                    </span>
                    
                    {/* Active toggle button widget */}
                    <button
                      onClick={() => handleToggleActiveIndividual(v)}
                      className="text-neutral-400 hover:text-neutral-700 transition-colors flex items-center gap-1 cursor-pointer"
                      title={isActive ? t('admin.villa.deactivate') : t('admin.villa.activate')}
                    >
                      {isActive ? (
                        <ToggleRight className="w-6 h-6 text-emerald-500 fill-emerald-500/10" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-neutral-350" />
                      )}
                    </button>
                  </div>
                  <h4 className="font-bold text-sm text-neutral-800 line-clamp-1 mt-1">{v.name}</h4>
                  <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-semibold mt-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-300" />
                    <span>{v.location}</span>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mt-1 font-mono text-sm font-black text-[#fe6a34] border-t border-neutral-50 pt-3">
                  <span>{v.price.toLocaleString('vi-VN')} VND{v.priceMax && v.priceMax > v.price ? ` - ${v.priceMax.toLocaleString('vi-VN')} VND` : ''}</span>
                  <span className="text-[10px] text-neutral-400 font-normal"> / {t('admin.villa.night')}</span>
                </div>

                {/* Grid details */}
                <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-2 rounded-xl text-center text-[10px] font-semibold text-neutral-500 mt-1">
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold text-neutral-400">{t('admin.villa.guests')}</span>
                    <span className="text-neutral-700 font-bold mt-0.5">{v.guestsCount} {t('admin.villa.maxShort')}</span>
                  </div>
                  <div className="flex flex-col border-x border-neutral-200">
                    <span className="text-[8px] uppercase font-bold text-neutral-400">{t('admin.villa.beds')}</span>
                    <span className="text-neutral-700 font-bold mt-0.5">{v.bedroomsCount} P</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold text-neutral-400">{t('admin.villa.baths')}</span>
                    <span className="text-neutral-700 font-bold mt-0.5">{v.bathroomsCount} WC</span>
                  </div>
                </div>

                {/* Actions row with duplicate clone and previews */}
                <div className="flex gap-2 mt-auto pt-3 border-t border-neutral-50 flex-wrap sm:flex-nowrap">
                  {/* Public link preview */}
                  <a
                    href={`#/villas/${v.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-[#edf3ff] hover:bg-[#0071c2] text-[#0071c2] hover:text-white border border-[#a1c9ff] font-bold text-xs py-2 rounded-lg text-center cursor-pointer transition-all flex items-center justify-center gap-1 shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('admin.villa.preview')}</span>
                  </a>

                  {/* Clone duplication button */}
                  <button
                    onClick={() => onDuplicateVilla(v.id)}
                    disabled={mutationLoading}
                    className="p-2 border border-neutral-200 hover:bg-neutral-50 hover:text-indigo-600 rounded-lg text-neutral-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title={t('admin.villa.clone')}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenEdit(v)}
                    className="p-2 border border-neutral-200 hover:bg-neutral-50 hover:text-blue-600 rounded-lg text-neutral-400 transition-colors cursor-pointer"
                    title={t('admin.villa.edit')}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteVilla(v.id, v.name)}
                    disabled={mutationLoading}
                    className="p-2 border border-neutral-200 hover:bg-red-50 hover:text-red-600 rounded-lg text-neutral-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title={t('admin.villa.delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Villa Modal Dialog */}
      {(showAddModal || showEditModal) && createPortal(
        <div ref={modalOverlayRef} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overflow-y-auto overscroll-contain">
          <div className="min-h-full flex items-start justify-center p-4 sm:p-6">
            <div ref={modalPanelRef} className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 overflow-y-auto overscroll-contain max-h-[90vh] shadow-2xl animate-scaleIn border">
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-neutral-100">
              <div>
                <h3 className="text-lg font-display font-black text-neutral-800">
                  {showAddModal ? t('admin.villa.addTitle') : t('admin.villa.editTitle')}
                </h3>
                <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                  {t('admin.villa.modalDesc')}
                </p>
              </div>
              <button 
                onClick={showAddModal ? handleCloseAdd : () => setShowEditModal(false)}
                className="text-neutral-400 hover:text-neutral-800 font-bold hover:bg-neutral-100 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit} className="flex flex-col gap-5 text-xs font-semibold text-neutral-600">
              {showAddModal ? (
                <MediaUploader
                  value={pendingMediaPreview}
                  onChange={setPendingMediaPreview}
                  disabled={mutationLoading}
                />
              ) : editingVilla ? (
                <MediaUploader
                  villaId={String(editingVilla.id)}
                  value={editingVilla.media}
                  onChange={(media) => setEditingVilla({ ...editingVilla, media, image: media.find((item) => item.isCover)?.thumbnailUrl || media[0]?.thumbnailUrl || media[0]?.url || editingVilla.image })}
                  disabled={mutationLoading}
                />
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{t('admin.villa.name')}</span>
                  <input
                    type="text"
                    required
                    placeholder={t('admin.villa.namePlaceholder')}
                    value={villaName}
                    onChange={(e) => setVillaName(e.target.value)}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] focus:bg-white text-xs font-bold text-neutral-800"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{t('admin.villa.location')}</span>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={villaLocation}
                      onFocus={() => setShowLocationSuggestions(true)}
                      onChange={(e) => {
                        setVillaLocation(e.target.value);
                        setShowLocationSuggestions(true);
                      }}
                      placeholder={t('admin.villa.locationPlaceholder')}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none text-neutral-800"
                    />
                    {showLocationSuggestions && locationSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-[80] mt-1 max-h-56 overflow-y-auto rounded-xl border border-neutral-100 bg-white p-1 shadow-xl shadow-neutral-900/10">
                        {locationSuggestions.map((province) => (
                          <button
                            key={province}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setVillaLocation(province);
                              setShowLocationSuggestions(false);
                            }}
                            className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-neutral-700 hover:bg-[#edf3ff] hover:text-[#005899]"
                          >
                            {province}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{t('admin.villa.priceMin')}</span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={villaPrice}
                    onChange={(e) => setVillaPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] focus:bg-white font-mono text-xs text-neutral-800"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{t('admin.villa.priceMax')}</span>
                  <input
                    type="number"
                    min={0}
                    placeholder={t('admin.villa.priceMaxPlaceholder')}
                    value={villaPriceMax}
                    onChange={(e) => setVillaPriceMax(e.target.value === '' ? '' : Number(e.target.value))}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] focus:bg-white font-mono text-xs text-neutral-800"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{t('admin.villa.type')}</span>
                  <select
                    value={villaType}
                    onChange={(e) => setVillaType(e.target.value as AccommodationTypeLabel)}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none text-neutral-800 cursor-pointer"
                  >
                    <option value="Villa">Villa</option>
                    <option value="Khách sạn - resort">{t('nav.hotelResort')}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{t('admin.villa.status')}</span>
                  <select
                    value={villaStatus}
                    onChange={(e) => setVillaStatus(e.target.value as 'Available' | 'Hết phòng' | 'Sắp có' | 'Maintenance')}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none text-neutral-800 cursor-pointer"
                  >
                    <option value="Available">{t('admin.villa.available')}</option>
                    <option value="Hết phòng">{t('admin.villa.booked')}</option>
                    <option value="Sắp có">{t('admin.villa.upcoming')}</option>
                    <option value="Maintenance">{t('admin.villa.maintenance')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{t('admin.villa.maxGuests')}</span>
                  <input
                    type="number"
                    min={1}
                    value={villaGuests}
                    onChange={(e) => setVillaGuests(Number(e.target.value))}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{t('admin.villa.bedrooms')}</span>
                  <input
                    type="number"
                    min={0}
                    value={villaBedrooms}
                    onChange={(e) => setVillaBedrooms(Number(e.target.value))}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{t('admin.villa.bathrooms')}</span>
                  <input
                    type="number"
                    min={0}
                    value={villaBathrooms}
                    onChange={(e) => setVillaBathrooms(Number(e.target.value))}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{t('admin.villa.websiteVisibility')}</span>
                  <select
                    value={villaIsActive ? 'Active' : 'Inactive'}
                    onChange={(e) => setVillaIsActive(e.target.value === 'Active')}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none text-neutral-800 cursor-pointer"
                  >
                    <option value="Active">{t('admin.villa.activeOption')}</option>
                    <option value="Inactive">{t('admin.villa.inactiveOption')}</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">{t('admin.villa.address')}</span>
                <input
                  type="text"
                  required
                  placeholder={t('admin.villa.addressPlaceholder')}
                  value={villaAddress}
                  onChange={(e) => setVillaAddress(e.target.value)}
                  className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">{t('admin.villa.description')}</span>
                <textarea
                  required
                  rows={3}
                  placeholder={t('admin.villa.descriptionPlaceholder')}
                  value={villaDescription}
                  onChange={(e) => setVillaDescription(e.target.value)}
                  className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 outline-none resize-none text-xs leading-relaxed"
                />
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 flex flex-col gap-4">
                <div>
                  <h4 className="text-xs font-black text-[#005899] uppercase">{t('admin.villa.multilingualTitle')}</h4>
                  <p className="text-[10px] text-neutral-500 font-semibold mt-1">{t('admin.villa.multilingualDesc')}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Name EN</span>
                    <input
                      type="text"
                      value={villaNameEn}
                      onChange={(e) => setVillaNameEn(e.target.value)}
                      className="bg-white border border-neutral-200 rounded-lg p-2.5 outline-none text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Location EN</span>
                    <input
                      type="text"
                      value={villaLocationEn}
                      onChange={(e) => setVillaLocationEn(e.target.value)}
                      className="bg-white border border-neutral-200 rounded-lg p-2.5 outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Description EN</span>
                  <textarea
                    rows={3}
                    value={villaDescriptionEn}
                    onChange={(e) => setVillaDescriptionEn(e.target.value)}
                    className="bg-white border border-neutral-200 rounded-xl p-3 outline-none resize-none text-xs leading-relaxed"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{t('admin.villa.descriptionKo')}</span>
                  <textarea
                    rows={3}
                    value={villaDescriptionKo}
                    onChange={(e) => setVillaDescriptionKo(e.target.value)}
                    className="bg-white border border-neutral-200 rounded-xl p-3 outline-none resize-none text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* Facilities Checklist */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{t('admin.villa.amenities')}</span>
                  <input
                    type="text"
                    value={amenitySearchQuery}
                    onChange={(e) => setAmenitySearchQuery(e.target.value)}
                    placeholder="Tìm tiện ích..."
                    className="w-full sm:w-60 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold outline-none focus:border-[#0071c2] focus:bg-white"
                  />
                </div>
                <div className="max-h-[360px] overflow-y-auto rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                  {Object.entries(
                    AMENITIES
                      .filter((item) => {
                        const query = amenitySearchQuery.trim().toLowerCase();
                        if (!query) return true;
                        return [item.key, item.labelVi, item.labelEn, item.labelKo, item.labelZh]
                          .some((value) => value.toLowerCase().includes(query));
                      })
                      .reduce<Record<string, typeof AMENITIES>>((acc, item) => {
                        acc[item.category] = [...(acc[item.category] || []), item];
                        return acc;
                      }, {})
                  ).map(([category, items]) => (
                    <div key={category} className="mb-5 last:mb-0">
                      <div className="mb-2 flex items-center justify-between border-b border-neutral-200/70 pb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
                          {AMENITY_CATEGORY_LABELS[category as keyof typeof AMENITY_CATEGORY_LABELS]?.[language] || category}
                        </span>
                        <span className="text-[10px] font-bold text-neutral-400">{items.length}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map(item => {
                          const normalizedFacilities = normalizeAmenityKeys(villaFacilities);
                          const isChecked = normalizedFacilities.includes(item.key);
                          return (
                            <label key={item.key} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold cursor-pointer transition-all ${isChecked ? 'border-sky-200 bg-sky-50 text-sky-800' : 'border-white bg-white text-neutral-700 hover:border-neutral-200'}`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleFacilityToggle(item.key)}
                                className="w-4 h-4 text-[#0071c2] rounded border-neutral-350 focus:ring-[#0071c2]"
                              />
                              <span>{getAmenityLabel(getAmenityDisplay(item.key), language)}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 text-xs">
                <button
                  type="button"
                  onClick={showAddModal ? handleCloseAdd : () => setShowEditModal(false)}
                  className="px-4.5 py-2.5 font-bold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 rounded-xl cursor-pointer"
                >
                  {t('admin.villa.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={mutationLoading}
                  className="bg-[#0071c2] hover:bg-[#005899] text-white font-black py-2.5 px-6 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {mutationLoading ? t('admin.villa.processing') : showAddModal ? t('admin.villa.register') : t('admin.villa.save')}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

