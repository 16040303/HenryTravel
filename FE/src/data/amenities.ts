import type { Language } from '../contexts/LanguageContext';

export type AmenityCategory =
  | 'popular'
  | 'kitchen_dining'
  | 'bed_bath'
  | 'laundry_cleaning'
  | 'entertainment'
  | 'outdoor'
  | 'safety'
  | 'family'
  | 'international'
  | 'local_support'
  | 'other';

export type AmenityKey = string;

export interface AmenityItem {
  key: AmenityKey;
  labelVi: string;
  labelEn: string;
  labelKo: string;
  labelZh: string;
  icon: string;
  category: AmenityCategory;
  sortOrder: number;
  isPopular?: boolean;
  isEssential?: boolean;
  isLuxury?: boolean;
}

export const AMENITY_CATEGORY_LABELS: Record<AmenityCategory, Record<Language, string>> = {
  popular: { vi: 'Tiện ích phổ biến', en: 'Popular amenities', ko: '인기 편의시설', zh: '热门设施' },
  kitchen_dining: { vi: 'Bếp và ăn uống', en: 'Kitchen and dining', ko: '주방 및 식사', zh: '厨房和用餐' },
  bed_bath: { vi: 'Phòng ngủ và phòng tắm', en: 'Bedroom and bathroom', ko: '침실 및 욕실', zh: '卧室和浴室' },
  laundry_cleaning: { vi: 'Giặt giũ và vệ sinh', en: 'Laundry and cleaning', ko: '세탁 및 청소', zh: '洗衣和清洁' },
  entertainment: { vi: 'Giải trí', en: 'Entertainment', ko: '엔터테인먼트', zh: '娱乐' },
  outdoor: { vi: 'Ngoài trời', en: 'Outdoor', ko: '야외', zh: '户外' },
  safety: { vi: 'An toàn', en: 'Safety', ko: '안전', zh: '安全' },
  family: { vi: 'Gia đình và trẻ em', en: 'Family and children', ko: '가족 및 어린이', zh: '家庭和儿童' },
  international: { vi: 'Hỗ trợ khách quốc tế', en: 'International guest support', ko: '외국인 고객 지원', zh: '国际客人支持' },
  local_support: { vi: 'Hỗ trợ địa phương', en: 'Local support', ko: '현지 지원', zh: '本地支持' },
  other: { vi: 'Tiện ích khác', en: 'Other amenities', ko: '기타 편의시설', zh: '其他设施' },
};

const amenity = (item: AmenityItem): AmenityItem => item;

export const AMENITIES: AmenityItem[] = [
  amenity({ key: 'wifi_high_speed', labelVi: 'WiFi tốc độ cao', labelEn: 'High-speed WiFi', labelKo: '초고속 WiFi', labelZh: '高速 WiFi', icon: 'Wifi', category: 'popular', sortOrder: 10, isPopular: true, isEssential: true }),
  amenity({ key: 'self_checkin', labelVi: 'Tự nhận phòng', labelEn: 'Self check-in', labelKo: '셀프 체크인', labelZh: '自助入住', icon: 'KeyRound', category: 'popular', sortOrder: 20, isPopular: true }),
  amenity({ key: 'free_parking', labelVi: 'Chỗ đậu xe miễn phí', labelEn: 'Free parking', labelKo: '무료 주차', labelZh: '免费停车', icon: 'ParkingCircle', category: 'popular', sortOrder: 30, isPopular: true, isEssential: true }),
  amenity({ key: 'air_conditioning', labelVi: 'Điều hòa', labelEn: 'Air conditioning', labelKo: '에어컨', labelZh: '空调', icon: 'Snowflake', category: 'popular', sortOrder: 40, isPopular: true, isEssential: true }),
  amenity({ key: 'washer', labelVi: 'Máy giặt', labelEn: 'Washer', labelKo: '세탁기', labelZh: '洗衣机', icon: 'WashingMachine', category: 'popular', sortOrder: 50, isPopular: true }),
  amenity({ key: 'dryer', labelVi: 'Máy sấy', labelEn: 'Dryer', labelKo: '건조기', labelZh: '烘干机', icon: 'Wind', category: 'popular', sortOrder: 60 }),
  amenity({ key: 'workspace', labelVi: 'Góc làm việc', labelEn: 'Workspace', labelKo: '업무 공간', labelZh: '工作区', icon: 'Laptop', category: 'popular', sortOrder: 70 }),
  amenity({ key: 'pool', labelVi: 'Hồ bơi', labelEn: 'Pool', labelKo: '수영장', labelZh: '泳池', icon: 'Waves', category: 'popular', sortOrder: 80, isPopular: true, isLuxury: true }),
  amenity({ key: 'hot_tub', labelVi: 'Bồn tắm nóng / Jacuzzi', labelEn: 'Hot tub / Jacuzzi', labelKo: '온수 욕조 / 자쿠지', labelZh: '热水浴缸 / 按摩浴缸', icon: 'Bath', category: 'popular', sortOrder: 90, isLuxury: true }),
  amenity({ key: 'pet_friendly', labelVi: 'Cho phép thú cưng', labelEn: 'Pet friendly', labelKo: '반려동물 동반 가능', labelZh: '允许携带宠物', icon: 'PawPrint', category: 'popular', sortOrder: 100, isPopular: true }),
  amenity({ key: 'kitchen', labelVi: 'Bếp đầy đủ', labelEn: 'Full kitchen', labelKo: '주방 완비', labelZh: '完整厨房', icon: 'Utensils', category: 'popular', sortOrder: 110, isPopular: true, isEssential: true }),
  amenity({ key: 'balcony', labelVi: 'Ban công', labelEn: 'Balcony', labelKo: '발코니', labelZh: '阳台', icon: 'Building2', category: 'popular', sortOrder: 120 }),
  amenity({ key: 'sea_view', labelVi: 'View biển', labelEn: 'Sea view', labelKo: '바다 전망', labelZh: '海景', icon: 'Compass', category: 'popular', sortOrder: 130, isPopular: true, isLuxury: true }),
  amenity({ key: 'city_view', labelVi: 'View thành phố', labelEn: 'City view', labelKo: '도시 전망', labelZh: '城市景观', icon: 'Building2', category: 'popular', sortOrder: 140 }),
  amenity({ key: 'mountain_view', labelVi: 'View núi', labelEn: 'Mountain view', labelKo: '산 전망', labelZh: '山景', icon: 'Mountain', category: 'popular', sortOrder: 150 }),
  amenity({ key: 'fridge', labelVi: 'Tủ lạnh', labelEn: 'Fridge', labelKo: '냉장고', labelZh: '冰箱', icon: 'Refrigerator', category: 'kitchen_dining', sortOrder: 210 }),
  amenity({ key: 'freezer', labelVi: 'Ngăn đông', labelEn: 'Freezer', labelKo: '냉동실', labelZh: '冷冻室', icon: 'Refrigerator', category: 'kitchen_dining', sortOrder: 220 }),
  amenity({ key: 'microwave', labelVi: 'Lò vi sóng', labelEn: 'Microwave', labelKo: '전자레인지', labelZh: '微波炉', icon: 'Microwave', category: 'kitchen_dining', sortOrder: 230 }),
  amenity({ key: 'oven', labelVi: 'Lò nướng', labelEn: 'Oven', labelKo: '오븐', labelZh: '烤箱', icon: 'CookingPot', category: 'kitchen_dining', sortOrder: 240 }),
  amenity({ key: 'stove', labelVi: 'Bếp nấu', labelEn: 'Stove', labelKo: '스토브', labelZh: '炉灶', icon: 'CookingPot', category: 'kitchen_dining', sortOrder: 250 }),
  amenity({ key: 'kettle', labelVi: 'Ấm đun nước', labelEn: 'Kettle', labelKo: '전기포트', labelZh: '水壶', icon: 'Coffee', category: 'kitchen_dining', sortOrder: 260 }),
  amenity({ key: 'coffee_maker', labelVi: 'Máy pha cà phê', labelEn: 'Coffee maker', labelKo: '커피 메이커', labelZh: '咖啡机', icon: 'Coffee', category: 'kitchen_dining', sortOrder: 270 }),
  amenity({ key: 'rice_cooker', labelVi: 'Nồi cơm điện', labelEn: 'Rice cooker', labelKo: '전기밥솥', labelZh: '电饭煲', icon: 'CookingPot', category: 'kitchen_dining', sortOrder: 280 }),
  amenity({ key: 'cookware', labelVi: 'Nồi/chảo/dụng cụ nấu ăn', labelEn: 'Cookware', labelKo: '조리도구', labelZh: '炊具', icon: 'CookingPot', category: 'kitchen_dining', sortOrder: 290 }),
  amenity({ key: 'dishes_cutlery', labelVi: 'Bát đĩa và dao nĩa', labelEn: 'Dishes and cutlery', labelKo: '식기 및 커트러리', labelZh: '餐具和刀叉', icon: 'Utensils', category: 'kitchen_dining', sortOrder: 300 }),
  amenity({ key: 'wine_glasses', labelVi: 'Ly rượu', labelEn: 'Wine glasses', labelKo: '와인잔', labelZh: '酒杯', icon: 'Wine', category: 'kitchen_dining', sortOrder: 310 }),
  amenity({ key: 'dining_table', labelVi: 'Bàn ăn', labelEn: 'Dining table', labelKo: '식탁', labelZh: '餐桌', icon: 'Table', category: 'kitchen_dining', sortOrder: 320 }),
  amenity({ key: 'dish_soap', labelVi: 'Nước rửa chén', labelEn: 'Dish soap', labelKo: '주방 세제', labelZh: '洗洁精', icon: 'Sparkles', category: 'kitchen_dining', sortOrder: 330 }),
  amenity({ key: 'trash_bins', labelVi: 'Thùng rác', labelEn: 'Trash bins', labelKo: '쓰레기통', labelZh: '垃圾桶', icon: 'Trash2', category: 'kitchen_dining', sortOrder: 340 }),
  amenity({ key: 'bbq_grill', labelVi: 'BBQ / bếp nướng', labelEn: 'BBQ grill', labelKo: '바비큐 그릴', labelZh: '烧烤架', icon: 'Flame', category: 'kitchen_dining', sortOrder: 350 }),
  amenity({ key: 'hot_water', labelVi: 'Nước nóng', labelEn: 'Hot water', labelKo: '온수', labelZh: '热水', icon: 'ShowerHead', category: 'bed_bath', sortOrder: 410, isEssential: true }),
  amenity({ key: 'bed_linen', labelVi: 'Ga giường', labelEn: 'Bed linen', labelKo: '침구류', labelZh: '床上用品', icon: 'BedDouble', category: 'bed_bath', sortOrder: 420 }),
  amenity({ key: 'extra_pillows', labelVi: 'Gối dự phòng', labelEn: 'Extra pillows', labelKo: '여분 베개', labelZh: '额外枕头', icon: 'BedDouble', category: 'bed_bath', sortOrder: 430 }),
  amenity({ key: 'extra_blankets', labelVi: 'Chăn dự phòng', labelEn: 'Extra blankets', labelKo: '여분 담요', labelZh: '额外毛毯', icon: 'BedDouble', category: 'bed_bath', sortOrder: 440 }),
  amenity({ key: 'towels', labelVi: 'Khăn tắm', labelEn: 'Towels', labelKo: '수건', labelZh: '毛巾', icon: 'Bath', category: 'bed_bath', sortOrder: 450 }),
  amenity({ key: 'shampoo', labelVi: 'Dầu gội', labelEn: 'Shampoo', labelKo: '샴푸', labelZh: '洗发水', icon: 'Sparkles', category: 'bed_bath', sortOrder: 460 }),
  amenity({ key: 'body_wash', labelVi: 'Sữa tắm', labelEn: 'Body wash', labelKo: '바디워시', labelZh: '沐浴露', icon: 'Sparkles', category: 'bed_bath', sortOrder: 470 }),
  amenity({ key: 'hand_soap', labelVi: 'Xà phòng rửa tay', labelEn: 'Hand soap', labelKo: '핸드워시', labelZh: '洗手液', icon: 'Sparkles', category: 'bed_bath', sortOrder: 480 }),
  amenity({ key: 'hair_dryer', labelVi: 'Máy sấy tóc', labelEn: 'Hair dryer', labelKo: '헤어드라이어', labelZh: '吹风机', icon: 'Wind', category: 'bed_bath', sortOrder: 490 }),
  amenity({ key: 'clothes_hangers', labelVi: 'Móc treo quần áo', labelEn: 'Clothes hangers', labelKo: '옷걸이', labelZh: '衣架', icon: 'Shirt', category: 'bed_bath', sortOrder: 500 }),
  amenity({ key: 'iron', labelVi: 'Bàn là', labelEn: 'Iron', labelKo: '다리미', labelZh: '熨斗', icon: 'Shirt', category: 'bed_bath', sortOrder: 510 }),
  amenity({ key: 'wardrobe', labelVi: 'Tủ quần áo', labelEn: 'Wardrobe', labelKo: '옷장', labelZh: '衣柜', icon: 'Shirt', category: 'bed_bath', sortOrder: 520 }),
  amenity({ key: 'laundry_detergent', labelVi: 'Nước giặt', labelEn: 'Laundry detergent', labelKo: '세탁 세제', labelZh: '洗衣液', icon: 'WashingMachine', category: 'laundry_cleaning', sortOrder: 610 }),
  amenity({ key: 'cleaning_supplies', labelVi: 'Dụng cụ vệ sinh', labelEn: 'Cleaning supplies', labelKo: '청소용품', labelZh: '清洁用品', icon: 'Sparkles', category: 'laundry_cleaning', sortOrder: 620 }),
  amenity({ key: 'vacuum_cleaner', labelVi: 'Máy hút bụi', labelEn: 'Vacuum cleaner', labelKo: '진공청소기', labelZh: '吸尘器', icon: 'Sparkles', category: 'laundry_cleaning', sortOrder: 630 }),
  amenity({ key: 'broom', labelVi: 'Chổi và đồ hốt rác', labelEn: 'Broom and dustpan', labelKo: '빗자루와 쓰레받기', labelZh: '扫帚和簸箕', icon: 'Sparkles', category: 'laundry_cleaning', sortOrder: 640 }),
  amenity({ key: 'paper_towels', labelVi: 'Khăn giấy', labelEn: 'Paper towels', labelKo: '종이타월', labelZh: '纸巾', icon: 'ScrollText', category: 'laundry_cleaning', sortOrder: 650 }),
  amenity({ key: 'bin_liners', labelVi: 'Túi rác', labelEn: 'Bin liners', labelKo: '쓰레기봉투', labelZh: '垃圾袋', icon: 'Trash2', category: 'laundry_cleaning', sortOrder: 660 }),
  amenity({ key: 'tv', labelVi: 'TV', labelEn: 'TV', labelKo: 'TV', labelZh: '电视', icon: 'Tv', category: 'entertainment', sortOrder: 710 }),
  amenity({ key: 'smart_tv', labelVi: 'Smart TV', labelEn: 'Smart TV', labelKo: '스마트 TV', labelZh: '智能电视', icon: 'Tv', category: 'entertainment', sortOrder: 720 }),
  amenity({ key: 'netflix', labelVi: 'Netflix', labelEn: 'Netflix', labelKo: '넷플릭스', labelZh: 'Netflix', icon: 'PlayCircle', category: 'entertainment', sortOrder: 730 }),
  amenity({ key: 'speaker', labelVi: 'Loa Bluetooth', labelEn: 'Bluetooth speaker', labelKo: '블루투스 스피커', labelZh: '蓝牙音箱', icon: 'Volume2', category: 'entertainment', sortOrder: 740 }),
  amenity({ key: 'board_games', labelVi: 'Board game', labelEn: 'Board games', labelKo: '보드게임', labelZh: '桌游', icon: 'Puzzle', category: 'entertainment', sortOrder: 750 }),
  amenity({ key: 'game_console', labelVi: 'Máy chơi game', labelEn: 'Game console', labelKo: '게임 콘솔', labelZh: '游戏机', icon: 'Gamepad2', category: 'entertainment', sortOrder: 760 }),
  amenity({ key: 'books', labelVi: 'Sách', labelEn: 'Books', labelKo: '도서', labelZh: '书籍', icon: 'BookOpen', category: 'entertainment', sortOrder: 770 }),
  amenity({ key: 'karaoke', labelVi: 'Karaoke', labelEn: 'Karaoke', labelKo: '노래방', labelZh: '卡拉OK', icon: 'Mic2', category: 'entertainment', sortOrder: 780 }),
  amenity({ key: 'outdoor_seating', labelVi: 'Bàn ghế ngoài trời', labelEn: 'Outdoor seating', labelKo: '야외 좌석', labelZh: '户外座椅', icon: 'Armchair', category: 'outdoor', sortOrder: 810 }),
  amenity({ key: 'outdoor_dining', labelVi: 'Khu ăn uống ngoài trời', labelEn: 'Outdoor dining', labelKo: '야외 식사 공간', labelZh: '户外用餐区', icon: 'Utensils', category: 'outdoor', sortOrder: 820 }),
  amenity({ key: 'garden', labelVi: 'Sân vườn', labelEn: 'Garden', labelKo: '정원', labelZh: '花园', icon: 'Trees', category: 'outdoor', sortOrder: 830 }),
  amenity({ key: 'terrace', labelVi: 'Sân thượng', labelEn: 'Terrace', labelKo: '테라스', labelZh: '露台', icon: 'Building2', category: 'outdoor', sortOrder: 840 }),
  amenity({ key: 'hammock', labelVi: 'Võng', labelEn: 'Hammock', labelKo: '해먹', labelZh: '吊床', icon: 'Waves', category: 'outdoor', sortOrder: 850 }),
  amenity({ key: 'sun_loungers', labelVi: 'Ghế tắm nắng', labelEn: 'Sun loungers', labelKo: '선베드', labelZh: '日光躺椅', icon: 'Sun', category: 'outdoor', sortOrder: 860 }),
  amenity({ key: 'private_yard', labelVi: 'Sân riêng', labelEn: 'Private yard', labelKo: '전용 마당', labelZh: '私人庭院', icon: 'Trees', category: 'outdoor', sortOrder: 870 }),
  amenity({ key: 'smoke_alarm', labelVi: 'Báo khói', labelEn: 'Smoke alarm', labelKo: '화재 경보기', labelZh: '烟雾报警器', icon: 'ShieldAlert', category: 'safety', sortOrder: 910 }),
  amenity({ key: 'carbon_monoxide_alarm', labelVi: 'Báo khí CO', labelEn: 'Carbon monoxide alarm', labelKo: '일산화탄소 경보기', labelZh: '一氧化碳报警器', icon: 'ShieldAlert', category: 'safety', sortOrder: 920 }),
  amenity({ key: 'fire_extinguisher', labelVi: 'Bình chữa cháy', labelEn: 'Fire extinguisher', labelKo: '소화기', labelZh: '灭火器', icon: 'ShieldAlert', category: 'safety', sortOrder: 930 }),
  amenity({ key: 'first_aid_kit', labelVi: 'Bộ sơ cứu', labelEn: 'First aid kit', labelKo: '구급상자', labelZh: '急救包', icon: 'BriefcaseMedical', category: 'safety', sortOrder: 940 }),
  amenity({ key: 'emergency_exit', labelVi: 'Lối thoát hiểm', labelEn: 'Emergency exit', labelKo: '비상구', labelZh: '紧急出口', icon: 'DoorOpen', category: 'safety', sortOrder: 950 }),
  amenity({ key: 'security_camera', labelVi: 'Camera an ninh khu vực chung', labelEn: 'Common-area security camera', labelKo: '공용 공간 보안 카메라', labelZh: '公共区域安防摄像头', icon: 'Camera', category: 'safety', sortOrder: 960 }),
  amenity({ key: 'door_lock', labelVi: 'Khóa cửa an toàn', labelEn: 'Secure door lock', labelKo: '안전 도어락', labelZh: '安全门锁', icon: 'KeyRound', category: 'safety', sortOrder: 970 }),
  amenity({ key: 'safe_box', labelVi: 'Két an toàn', labelEn: 'Safe box', labelKo: '금고', labelZh: '保险箱', icon: 'ShieldCheck', category: 'safety', sortOrder: 980 }),
  amenity({ key: 'family_friendly', labelVi: 'Phù hợp gia đình', labelEn: 'Family friendly', labelKo: '가족 친화', labelZh: '适合家庭', icon: 'Users', category: 'family', sortOrder: 1010 }),
  amenity({ key: 'baby_crib', labelVi: 'Nôi em bé', labelEn: 'Baby crib', labelKo: '아기 침대', labelZh: '婴儿床', icon: 'Baby', category: 'family', sortOrder: 1020 }),
  amenity({ key: 'high_chair', labelVi: 'Ghế ăn trẻ em', labelEn: 'High chair', labelKo: '아기 식탁의자', labelZh: '儿童餐椅', icon: 'Baby', category: 'family', sortOrder: 1030 }),
  amenity({ key: 'children_cutlery', labelVi: 'Bát đĩa trẻ em', labelEn: 'Children cutlery', labelKo: '어린이 식기', labelZh: '儿童餐具', icon: 'Utensils', category: 'family', sortOrder: 1040 }),
  amenity({ key: 'baby_safety_gate', labelVi: 'Chặn cầu thang', labelEn: 'Baby safety gate', labelKo: '유아 안전문', labelZh: '儿童安全门', icon: 'ShieldCheck', category: 'family', sortOrder: 1050 }),
  amenity({ key: 'corner_guards', labelVi: 'Bọc góc bàn', labelEn: 'Corner guards', labelKo: '모서리 보호대', labelZh: '桌角保护', icon: 'ShieldCheck', category: 'family', sortOrder: 1060 }),
  amenity({ key: 'window_guards', labelVi: 'Khóa/cửa an toàn cho trẻ', labelEn: 'Child-safe window guards', labelKo: '어린이 안전 창문 잠금', labelZh: '儿童安全窗锁', icon: 'ShieldCheck', category: 'family', sortOrder: 1070 }),
  amenity({ key: 'balcony_protection', labelVi: 'Ban công an toàn', labelEn: 'Balcony protection', labelKo: '발코니 안전장치', labelZh: '阳台防护', icon: 'ShieldCheck', category: 'family', sortOrder: 1080 }),
  amenity({ key: 'universal_adapter', labelVi: 'Ổ chuyển đổi quốc tế', labelEn: 'Universal adapter', labelKo: '멀티 어댑터', labelZh: '国际转换插头', icon: 'Plug', category: 'international', sortOrder: 1110 }),
  amenity({ key: 'phone_charger', labelVi: 'Sạc điện thoại', labelEn: 'Phone charger', labelKo: '휴대폰 충전기', labelZh: '手机充电器', icon: 'Plug', category: 'international', sortOrder: 1120 }),
  amenity({ key: 'luggage_storage', labelVi: 'Gửi hành lý', labelEn: 'Luggage storage', labelKo: '수하물 보관', labelZh: '行李寄存', icon: 'Briefcase', category: 'international', sortOrder: 1130 }),
  amenity({ key: 'elevator', labelVi: 'Thang máy', labelEn: 'Elevator', labelKo: '엘리베이터', labelZh: '电梯', icon: 'ArrowUpDown', category: 'international', sortOrder: 1140 }),
  amenity({ key: 'private_entrance', labelVi: 'Lối vào riêng', labelEn: 'Private entrance', labelKo: '전용 출입구', labelZh: '独立入口', icon: 'DoorOpen', category: 'international', sortOrder: 1150 }),
  amenity({ key: 'keyless_entry', labelVi: 'Khóa điện tử', labelEn: 'Keyless entry', labelKo: '무키 출입', labelZh: '无钥匙进入', icon: 'KeyRound', category: 'international', sortOrder: 1160 }),
  amenity({ key: 'local_guidebook', labelVi: 'Sổ hướng dẫn địa phương', labelEn: 'Local guidebook', labelKo: '현지 가이드북', labelZh: '本地指南', icon: 'BookOpen', category: 'international', sortOrder: 1170 }),
  amenity({ key: 'near_beach', labelVi: 'Gần biển', labelEn: 'Near beach', labelKo: '해변 근처', labelZh: '靠近海滩', icon: 'Compass', category: 'local_support', sortOrder: 1210, isPopular: true }),
  amenity({ key: 'airport_transfer', labelVi: 'Hỗ trợ đưa đón sân bay', labelEn: 'Airport transfer support', labelKo: '공항 픽업 지원', labelZh: '机场接送支持', icon: 'Plane', category: 'local_support', sortOrder: 1220 }),
  amenity({ key: 'motorbike_parking', labelVi: 'Chỗ để xe máy', labelEn: 'Motorbike parking', labelKo: '오토바이 주차', labelZh: '摩托车停车位', icon: 'ParkingCircle', category: 'local_support', sortOrder: 1230 }),
  amenity({ key: 'car_rental_support', labelVi: 'Hỗ trợ thuê ô tô', labelEn: 'Car rental support', labelKo: '렌터카 지원', labelZh: '租车支持', icon: 'Car', category: 'local_support', sortOrder: 1240 }),
  amenity({ key: 'motorbike_rental_support', labelVi: 'Hỗ trợ thuê xe máy', labelEn: 'Motorbike rental support', labelKo: '오토바이 렌탈 지원', labelZh: '摩托车租赁支持', icon: 'Bike', category: 'local_support', sortOrder: 1250 }),
  amenity({ key: 'tour_booking_support', labelVi: 'Hỗ trợ đặt tour', labelEn: 'Tour booking support', labelKo: '투어 예약 지원', labelZh: '旅游预订支持', icon: 'Map', category: 'local_support', sortOrder: 1260 }),
  amenity({ key: 'korean_support', labelVi: 'Hỗ trợ tiếng Hàn', labelEn: 'Korean language support', labelKo: '한국어 지원', labelZh: '韩语支持', icon: 'Languages', category: 'local_support', sortOrder: 1270 }),
  amenity({ key: 'vietnamese_support', labelVi: 'Hỗ trợ tiếng Việt', labelEn: 'Vietnamese language support', labelKo: '베트남어 지원', labelZh: '越南语支持', icon: 'Languages', category: 'local_support', sortOrder: 1280 }),
  amenity({ key: 'english_support', labelVi: 'Hỗ trợ tiếng Anh', labelEn: 'English language support', labelKo: '영어 지원', labelZh: '英语支持', icon: 'Languages', category: 'local_support', sortOrder: 1290 }),
];

export const LEGACY_AMENITY_KEY_MAP: Record<string, AmenityKey> = {
  bbq: 'bbq_grill',
  pets: 'pet_friendly',
  local_parking: 'free_parking',
  outdoor_grill: 'bbq_grill',
  wifi: 'wifi_high_speed',
  beach_access: 'near_beach',
  landscape: 'mountain_view',
  garden_view: 'garden',
  body_soap: 'body_wash',
  bed_linens: 'bed_linen',
  hangers: 'clothes_hangers',
  refrigerator: 'fridge',
  dishes: 'dishes_cutlery',
  smart_lock: 'keyless_entry',
  self_check_in: 'self_checkin',
  crib: 'baby_crib',
  lake_access: 'near_beach',
  fire_pit: 'bbq_grill',
  bathtub: 'hot_tub',
  pets_allowed: 'pet_friendly',
};

export const CARD_AMENITY_PRIORITY: AmenityKey[] = [
  'pool',
  'sea_view',
  'near_beach',
  'free_parking',
  'kitchen',
  'wifi_high_speed',
  'air_conditioning',
  'washer',
  'self_checkin',
];

export const FILTER_AMENITY_KEYS: AmenityKey[] = [
  'pool',
  'near_beach',
  'sea_view',
  'kitchen',
  'free_parking',
  'washer',
  'pet_friendly',
  'self_checkin',
];

export const AMENITY_BY_KEY = new Map(AMENITIES.map((item) => [item.key, item]));

export function normalizeAmenityKey(key: string): AmenityKey {
  return AMENITY_BY_KEY.has(key) ? key : LEGACY_AMENITY_KEY_MAP[key] || key;
}

export function normalizeAmenityKeys(keys: string[]): AmenityKey[] {
  return Array.from(new Set(keys.map(normalizeAmenityKey)));
}

export function getAmenityLabel(item: AmenityItem, language: Language): string {
  if (language === 'en') return item.labelEn;
  if (language === 'ko') return item.labelKo;
  if (language === 'zh') return item.labelZh;
  return item.labelVi;
}

export function formatUnknownAmenityLabel(key: string): string {
  return key.replace(/[_-]+/g, ' ').trim();
}

export function getAmenityDisplay(key: string): AmenityItem {
  const normalizedKey = normalizeAmenityKey(key);
  return AMENITY_BY_KEY.get(normalizedKey) || {
    key: normalizedKey,
    labelVi: formatUnknownAmenityLabel(normalizedKey),
    labelEn: formatUnknownAmenityLabel(normalizedKey),
    labelKo: formatUnknownAmenityLabel(normalizedKey),
    labelZh: formatUnknownAmenityLabel(normalizedKey),
    icon: 'Sparkles',
    category: 'other',
    sortOrder: 9999,
  };
}

export function getAmenitiesByCategory(keys: string[]): Array<{ category: AmenityCategory; items: AmenityItem[] }> {
  const items = normalizeAmenityKeys(keys).map(getAmenityDisplay);
  const grouped = new Map<AmenityCategory, AmenityItem[]>();
  items.forEach((item) => grouped.set(item.category, [...(grouped.get(item.category) || []), item]));
  return Array.from(grouped.entries())
    .map(([category, categoryItems]) => ({ category, items: categoryItems.sort((a, b) => a.sortOrder - b.sortOrder) }))
    .sort((a, b) => (a.items[0]?.sortOrder || 9999) - (b.items[0]?.sortOrder || 9999));
}

export function getCardAmenities(keys: string[], limit = 5): { items: AmenityItem[]; remainingCount: number } {
  const normalizedKeys = normalizeAmenityKeys(keys);
  const priority = new Map(CARD_AMENITY_PRIORITY.map((key, index) => [key, index]));
  const sorted = normalizedKeys
    .map(getAmenityDisplay)
    .sort((a, b) => (priority.get(a.key) ?? 999) - (priority.get(b.key) ?? 999) || a.sortOrder - b.sortOrder);
  return { items: sorted.slice(0, limit), remainingCount: Math.max(sorted.length - limit, 0) };
}

export const FACILITIES = AMENITIES.map((item) => ({ id: item.key, label: item.labelVi, icon: item.icon }));
export const FILTER_FACILITIES = FILTER_AMENITY_KEYS.map(getAmenityDisplay).map((item) => ({ id: item.key, label: item.labelVi, icon: item.icon }));
