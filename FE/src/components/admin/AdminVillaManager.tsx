import React, { useState } from 'react';
import { 
  Building2, Trash2, Edit, PlusCircle, Search, MapPin, 
  Users, CheckCircle2, AlertCircle, X, Copy, Eye, 
  ToggleLeft, ToggleRight, CheckSquare, Square 
} from 'lucide-react';
import { EntityId, VillaDetail } from '../../types';
import { LOCATIONS, FACILITIES } from '../../constants';
import { useLanguage } from '../../contexts/LanguageContext';

interface AdminVillaManagerProps {
  villas: VillaDetail[];
  onAddVilla: (v: Omit<VillaDetail, 'id' | 'rating' | 'reviewsCount' | 'bookedDates' | 'pendingDates' | 'images'>) => Promise<void>;
  onDeleteVilla: (id: EntityId, name: string) => void;
  onUpdateVilla: (v: VillaDetail) => void;
  onDuplicateVilla: (id: EntityId) => void;
  onBulkDeleteVillas: (ids: EntityId[]) => void;
  onBulkStatusUpdateVillas: (ids: EntityId[], active: boolean) => void;
  showAddModalDirectly?: boolean;
  onCloseAddModalDirectly?: () => void;
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
  onCloseAddModalDirectly
}: AdminVillaManagerProps) {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Hết phòng' | 'Sắp có' | 'Maintenance'>('All');
  
  // Custom Active/Inactive filter state
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Modals Toggles
  const [showAddModal, setShowAddModal] = useState(showAddModalDirectly);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVilla, setEditingVilla] = useState<VillaDetail | null>(null);

  // Bulk selections state
  const [selectedVillaIds, setSelectedVillaIds] = useState<EntityId[]>([]);

  // Add/Edit Form State
  const [villaName, setVillaName] = useState('');
  const [villaLocation, setVillaLocation] = useState('Đà Lạt');
  const [villaPrice, setVillaPrice] = useState(2500000);
  const [villaType, setVillaType] = useState<'Villa' | 'Homestay' | 'Căn hộ'>('Villa');
  const [villaDescription, setVillaDescription] = useState('');
  const [villaAddress, setVillaAddress] = useState('');
  const [villaGuests, setVillaGuests] = useState(8);
  const [villaBedrooms, setVillaBedrooms] = useState(4);
  const [villaBathrooms, setVillaBathrooms] = useState(4);
  const [villaFacilities, setVillaFacilities] = useState<string[]>(['wifi', 'kitchen']);
  const [villaImageUrl, setVillaImageUrl] = useState('https://picsum.photos/400/300?random=20');
  const [villaStatus, setVillaStatus] = useState<'Available' | 'Hết phòng' | 'Sắp có' | 'Maintenance'>('Available');
  const [villaIsActive, setVillaIsActive] = useState(true);

  // Load details to editor
  const handleOpenEdit = (v: VillaDetail) => {
    setEditingVilla(v);
    setVillaName(v.name);
    setVillaLocation(v.location);
    setVillaPrice(v.price);
    setVillaType(v.type);
    setVillaDescription(v.description);
    setVillaAddress(v.address);
    setVillaGuests(v.guestsCount);
    setVillaBedrooms(v.bedroomsCount);
    setVillaBathrooms(v.bathroomsCount);
    setVillaFacilities(v.facilities);
    setVillaImageUrl(v.image);
    setVillaStatus(v.status);
    setVillaIsActive(v.isActive !== false);
    setShowEditModal(true);
  };

  const handleOpenAdd = () => {
    setVillaName('');
    setVillaLocation('Đà Lạt');
    setVillaPrice(2500000);
    setVillaType('Villa');
    setVillaDescription('');
    setVillaAddress('');
    setVillaGuests(8);
    setVillaBedrooms(4);
    setVillaBathrooms(4);
    setVillaFacilities(['wifi', 'kitchen']);
    setVillaImageUrl(`https://picsum.photos/400/300?random=${Math.floor(Math.random() * 50) + 10}`);
    setVillaStatus('Available');
    setVillaIsActive(true);
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
    await onAddVilla({
      name: villaName,
      location: villaLocation,
      price: villaPrice,
      type: villaType,
      description: villaDescription,
      address: villaAddress,
      guestsCount: villaGuests,
      bedroomsCount: villaBedrooms,
      bathroomsCount: villaBathrooms,
      facilities: villaFacilities,
      image: villaImageUrl,
      status: villaStatus,
      isActive: villaIsActive,
      policies: {
        time: ['Nhận phòng: Từ 14:00', 'Trả phòng: Trước 12:00'],
        other: ['Cần liên hệ đặt cọc trước.', 'Giữ vệ sinh chung.']
      }
    });
    handleCloseAdd();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVilla) return;
    onUpdateVilla({
      ...editingVilla,
      name: villaName,
      location: villaLocation,
      price: villaPrice,
      type: villaType,
      description: villaDescription,
      address: villaAddress,
      guestsCount: villaGuests,
      bedroomsCount: villaBedrooms,
      bathroomsCount: villaBathrooms,
      facilities: villaFacilities,
      image: villaImageUrl,
      status: villaStatus,
      isActive: villaIsActive
    });
    setShowEditModal(false);
    setEditingVilla(null);
  };

  const handleFacilityToggle = (id: string) => {
    setVillaFacilities(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Toggle active individual
  const handleToggleActiveIndividual = (v: VillaDetail) => {
    const nextActive = !(v.isActive !== false);
    onUpdateVilla({
      ...v,
      isActive: nextActive
    });
  };

  // Filter & Search
  const filteredVillas = villas.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    
    // Active/Inactive filter matching
    const activeVal = v.isActive !== false;
    const matchesActive = 
      activeFilter === 'All' ? true :
      activeFilter === 'Active' ? activeVal === true :
      activeVal === false;

    return matchesSearch && matchesStatus && matchesActive;
  });

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
            placeholder={language === 'vi' ? 'Tìm kiếm villa theo tên, khu vực...' : 'Search by name, location...'}
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
            <option value="All">{language === 'vi' ? 'Tất cả trạng thái phòng' : 'All Statuses'}</option>
            <option value="Available">{language === 'vi' ? 'Trống (Available)' : 'Available'}</option>
            <option value="Hết phòng">{language === 'vi' ? 'Hết phòng (Full)' : 'Booked'}</option>
            <option value="Sắp có">{language === 'vi' ? 'Sắp mở bán' : 'Upcoming'}</option>
            <option value="Maintenance">{language === 'vi' ? 'Đang bảo trì' : 'Maintenance'}</option>
          </select>

          {/* Active / Inactive operational filter */}
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as any)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-700 outline-none cursor-pointer"
          >
            <option value="All">{language === 'vi' ? 'Mọi hoạt động' : 'All Active/Inactive'}</option>
            <option value="Active">{language === 'vi' ? 'Đang hiển thị (Active)' : 'Active Only'}</option>
            <option value="Inactive">{language === 'vi' ? 'Đã ẩn (Inactive)' : 'Inactive Only'}</option>
          </select>

          <button
            onClick={handleOpenAdd}
            className="bg-[#0071c2] hover:bg-[#005899] text-white font-black text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow shadow-[#0071c2]/10"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{language === 'vi' ? 'Thêm mới' : 'Add Villa'}</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when selectedVillaIds.length > 0) */}
      {selectedVillaIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-scaleIn shadow-sm">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
            <CheckCircle2 className="w-5 h-5 text-[#0071c2]" />
            <span>
              {language === 'vi' 
                ? `Đã chọn ${selectedVillaIds.length} biệt thự` 
                : `Selected ${selectedVillaIds.length} accommodations`}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleBulkStatusChange(true)}
              className="bg-white hover:bg-neutral-50 text-emerald-600 border border-emerald-200 font-bold text-xs py-2 px-4 rounded-xl cursor-pointer transition-colors"
            >
              {language === 'vi' ? 'Hiện hàng loạt (Active)' : 'Batch Set Active'}
            </button>
            <button
              onClick={() => handleBulkStatusChange(false)}
              className="bg-white hover:bg-neutral-50 text-neutral-500 border border-neutral-200 font-bold text-xs py-2 px-4 rounded-xl cursor-pointer transition-colors"
            >
              {language === 'vi' ? 'Ẩn hàng loạt (Inactive)' : 'Batch Set Inactive'}
            </button>
            <button
              onClick={handleBulkDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-2 px-4 rounded-xl cursor-pointer transition-colors shadow shadow-rose-600/10"
            >
              {language === 'vi' ? 'Xóa hàng loạt' : 'Batch Delete'}
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
              {selectedVillaIds.length === filteredVillas.length 
                ? (language === 'vi' ? 'Bỏ chọn tất cả' : 'Deselect all') 
                : (language === 'vi' ? 'Chọn tất cả hiển thị' : 'Select all listed')}
            </span>
          </button>
          <span className="text-[10px] text-neutral-400 font-semibold font-mono">
            {language === 'vi' ? `Hiển thị ${filteredVillas.length} căn` : `Showing ${filteredVillas.length} properties`}
          </span>
        </div>
      )}

      {/* Grid listing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {filteredVillas.map((v) => {
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
                    {v.status}
                  </span>
                  
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border backdrop-blur-md ${
                    isActive 
                      ? 'bg-emerald-500/90 text-white border-emerald-400' 
                      : 'bg-neutral-500/90 text-white border-neutral-400'
                  }`}>
                    {isActive ? 'Active' : 'Inactive'}
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
                      title={isActive ? 'Deactivate' : 'Activate'}
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
                  <span>{v.price.toLocaleString('vi-VN')}₫</span>
                  <span className="text-[10px] text-neutral-400 font-normal"> / {language === 'vi' ? 'đêm' : 'night'}</span>
                </div>

                {/* Grid details */}
                <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-2 rounded-xl text-center text-[10px] font-semibold text-neutral-500 mt-1">
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold text-neutral-400">{language === 'vi' ? 'Khách' : 'Guests'}</span>
                    <span className="text-neutral-700 font-bold mt-0.5">{v.guestsCount} max</span>
                  </div>
                  <div className="flex flex-col border-x border-neutral-200">
                    <span className="text-[8px] uppercase font-bold text-neutral-400">{language === 'vi' ? 'Giường' : 'Beds'}</span>
                    <span className="text-neutral-700 font-bold mt-0.5">{v.bedroomsCount} P</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold text-neutral-400">{language === 'vi' ? 'Tắm' : 'Baths'}</span>
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
                    <span>Preview</span>
                  </a>

                  {/* Clone duplication button */}
                  <button
                    onClick={() => onDuplicateVilla(v.id)}
                    className="p-2 border border-neutral-200 hover:bg-neutral-50 hover:text-indigo-600 rounded-lg text-neutral-400 transition-colors cursor-pointer"
                    title={language === 'vi' ? 'Sao chép / Nhân bản' : 'Clone Property'}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenEdit(v)}
                    className="p-2 border border-neutral-200 hover:bg-neutral-50 hover:text-blue-600 rounded-lg text-neutral-400 transition-colors cursor-pointer"
                    title={language === 'vi' ? 'Sửa thông tin' : 'Edit'}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteVilla(v.id, v.name)}
                    className="p-2 border border-neutral-200 hover:bg-red-50 hover:text-red-600 rounded-lg text-neutral-400 transition-colors cursor-pointer"
                    title={language === 'vi' ? 'Xoá' : 'Delete'}
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
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 overflow-y-auto max-h-[90vh] shadow-2xl animate-scaleIn border">
            
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-neutral-100">
              <div>
                <h3 className="text-lg font-display font-black text-neutral-800">
                  {showAddModal 
                    ? (language === 'vi' ? 'Thêm biệt thự lưu trú mới' : 'Add New Accommodation')
                    : (language === 'vi' ? 'Cập nhật thông tin biệt thự' : 'Modify Accommodation')}
                </h3>
                <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                  {language === 'vi' ? 'Khai báo chi tiết thông số để cập nhật hệ thống' : 'Specify exact lodging attributes'}
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
              {/* Visual drag/click mock image container */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-neutral-450 uppercase">{language === 'vi' ? 'Ảnh đại diện (Mock upload)' : 'Mock Image URL'}</span>
                <div 
                  onClick={() => {
                    const id = Math.floor(Math.random() * 50) + 10;
                    setVillaImageUrl(`https://picsum.photos/800/600?random=${id}`);
                  }}
                  className="border-2 border-dashed border-neutral-200 bg-neutral-50 rounded-2xl p-5 text-center cursor-pointer hover:bg-neutral-100/50 transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <img src={villaImageUrl} alt="Thumb preview" className="w-32 h-20 object-cover rounded-xl border shadow-sm" />
                  <div className="flex flex-col leading-none">
                    <span className="text-[11px] font-bold text-[#0071c2]">{language === 'vi' ? 'Click để đổi ảnh ngẫu nhiên' : 'Click to cycle random mocks'}</span>
                    <span className="text-[9px] text-neutral-400 font-semibold mt-1">Chuẩn 4:3 (JPG, PNG, WEBP)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{language === 'vi' ? 'Tên Villa / Homestay *' : 'Name *'}</span>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Pine Hill Retreat Villa"
                    value={villaName}
                    onChange={(e) => setVillaName(e.target.value)}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] focus:bg-white text-xs font-bold text-neutral-800"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{language === 'vi' ? 'Khu vực địa điểm *' : 'Location *'}</span>
                  <select
                    value={villaLocation}
                    onChange={(e) => setVillaLocation(e.target.value)}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none text-neutral-800 cursor-pointer"
                  >
                    {LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{language === 'vi' ? 'Giá thuê 1 đêm *' : 'Price / night *'}</span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={villaPrice}
                    onChange={(e) => setVillaPrice(Number(e.target.value))}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] focus:bg-white font-mono text-xs text-neutral-800"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{language === 'vi' ? 'Loại dịch vụ' : 'Dwelling Type'}</span>
                  <select
                    value={villaType}
                    onChange={(e) => setVillaType(e.target.value as any)}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none text-neutral-800 cursor-pointer"
                  >
                    <option value="Villa">Villa (Biệt thự)</option>
                    <option value="Homestay">Homestay (Nhà dân)</option>
                    <option value="Căn hộ">Căn hộ dịch vụ</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{language === 'vi' ? 'Trạng thái hoạt động' : 'Status'}</span>
                  <select
                    value={villaStatus}
                    onChange={(e) => setVillaStatus(e.target.value as any)}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none text-neutral-800 cursor-pointer"
                  >
                    <option value="Available">Available</option>
                    <option value="Hết phòng">Hết phòng</option>
                    <option value="Sắp có">Sắp có</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{language === 'vi' ? 'Sức chứa khách max' : 'Guests Count'}</span>
                  <input
                    type="number"
                    min={1}
                    value={villaGuests}
                    onChange={(e) => setVillaGuests(Number(e.target.value))}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{language === 'vi' ? 'Phòng ngủ' : 'Bedrooms'}</span>
                  <input
                    type="number"
                    min={0}
                    value={villaBedrooms}
                    onChange={(e) => setVillaBedrooms(Number(e.target.value))}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{language === 'vi' ? 'Phòng vệ sinh' : 'Bathrooms'}</span>
                  <input
                    type="number"
                    min={0}
                    value={villaBathrooms}
                    onChange={(e) => setVillaBathrooms(Number(e.target.value))}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Hiển thị website</span>
                  <select
                    value={villaIsActive ? 'Active' : 'Inactive'}
                    onChange={(e) => setVillaIsActive(e.target.value === 'Active')}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none text-neutral-800 cursor-pointer"
                  >
                    <option value="Active">Active (Hiển thị)</option>
                    <option value="Inactive">Inactive (Tạm ẩn)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">{language === 'vi' ? 'Địa chỉ chính xác *' : 'Precise Address *'}</span>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phường 3, Thành Phố Đà Lạt"
                  value={villaAddress}
                  onChange={(e) => setVillaAddress(e.target.value)}
                  className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">{language === 'vi' ? 'Mô tả dịch vụ chi tiết *' : 'Description *'}</span>
                <textarea
                  required
                  rows={3}
                  placeholder="Giới thiệu điểm độc đáo, cảnh quan sân vườn..."
                  value={villaDescription}
                  onChange={(e) => setVillaDescription(e.target.value)}
                  className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 outline-none resize-none text-xs leading-relaxed"
                />
              </div>

              {/* Facilities Checklist */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">{language === 'vi' ? 'Các tiện ích hiện hữu' : 'Amenities Checklist'}</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                  {FACILITIES.map(item => {
                    const isChecked = villaFacilities.includes(item.id);
                    return (
                      <label key={item.id} className="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleFacilityToggle(item.id)}
                          className="w-4 h-4 text-[#0071c2] rounded border-neutral-350 focus:ring-[#0071c2]"
                        />
                        <span>{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 text-xs">
                <button
                  type="button"
                  onClick={showAddModal ? handleCloseAdd : () => setShowEditModal(false)}
                  className="px-4.5 py-2.5 font-bold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 rounded-xl cursor-pointer"
                >
                  {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-[#0071c2] hover:bg-[#005899] text-white font-black py-2.5 px-6 rounded-xl cursor-pointer"
                >
                  {showAddModal 
                    ? (language === 'vi' ? 'Đăng ký ngay' : 'Register Villa') 
                    : (language === 'vi' ? 'Lưu thay đổi' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
