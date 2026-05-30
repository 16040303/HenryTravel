import { VillaDetail, Feedback } from '../types';

export const MOCK_FEEDBACKS: Feedback[] = [
  {
    id: 'f1',
    villaId: 7,
    guestName: 'Nguyễn Thanh Tùng',
    rating: 5,
    comment: 'Biệt thự tuyệt đẹp, view núi cực chill buổi sáng săn mây ấm áp. Chủ nhà và quản gia hỗ trợ nhiệt tình từ lúc check-in đến lúc về. Sẽ quay lại chắc chắn!',
    createdAt: '2024-12-15T08:30:00Z',
    isVerified: true,
  },
  {
    id: 'f2',
    villaId: 7,
    guestName: 'Trần Thảo Ly',
    rating: 4.8,
    comment: 'Không gian vô cùng yên tĩnh và thư thái. Thích hợp cho chuyến đi xả stress của gia đình. Tiện nghi nướng BBQ rất đầy đủ.',
    createdAt: '2024-12-10T14:20:00Z',
    isVerified: true,
  },
  {
    id: 'f3',
    villaId: 1,
    guestName: 'Phạm Minh Đức',
    rating: 4.8,
    comment: 'Vị trí đồi thông thoáng đãng cực đẹp, ngắm hoàng hôn đỉnh chóp. Giá cả cực kỳ hợp lý.',
    createdAt: '2024-11-20T10:00:00Z',
    isVerified: true,
  }
];

export const MOCK_VILLAS: VillaDetail[] = [
  {
    id: 1,
    name: 'Biệt thự Đồi Sứ Mộng Mơ',
    location: 'Đà Lạt',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdy4jQNoEcC2th1OZNDILMRgFaimROCxixKe7kCSHlWQsPsWeGYgCSVS88MMI2uJ8zgmg6iXlDn3TZecXOcZuD1JE1T4dHVUlULkhuBaT1rcbsjU6rK-ST0Ng_-c5ZC-5cD-2awZDKtElQb9AvOXSgCd2v6Of-JB5FwiPVSYb_9p4-wJ1LjoU6GcDnsm9pJku2qh0rtuY7LOAJy1WthQXDEB8QtgzZIH-rtjjChnPILLi72zWgF0Sy6sdEbxAMczXwV4HhdPNnQCcP',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDdy4jQNoEcC2th1OZNDILMRgFaimROCxixKe7kCSHlWQsPsWeGYgCSVS88MMI2uJ8zgmg6iXlDn3TZecXOcZuD1JE1T4dHVUlULkhuBaT1rcbsjU6rK-ST0Ng_-c5ZC-5cD-2awZDKtElQb9AvOXSgCd2v6Of-JB5FwiPVSYb_9p4-wJ1LjoU6GcDnsm9pJku2qh0rtuY7LOAJy1WthQXDEB8QtgzZIH-rtjjChnPILLi72zWgF0Sy6sdEbxAMczXwV4HhdPNnQCcP',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAnJlGr3IgXtsgrN9e5EO8SF27R6jQle_YqTUX77vw7NdspyX-lGuIxv0FtNh2Ao3qOJ_ZDDPgwUGU2n5f001gO8pJNhizxzP2ybsfekot4YSRNi2NNiVyGoqnnVr6eBQbWzyfyAdKXuvMlrVe5EuADwuyL4_8UHpUdJUsckH22lcyv3Rm2SeJMm38VIbe_NUpC-bWjgwtyZcqCpYqP9TYHclDduFVsj3CnbcB2fjmPUudsTbwkp9JXyTzoCPlJ2At0r9YY02WFvEXv'
    ],
    status: 'Available',
    rating: 4.8,
    reviewsCount: 124,
    price: 2500000,
    type: 'Villa',
    facilities: ['pool', 'wifi', 'local_parking', 'kitchen', 'outdoor_grill', 'landscape'],
    description: 'Biệt thự lãng mạn lọt thỏm giữa đồi thông mộng mơ, thiết kế tinh tế pha chút cổ điển, đem đến cho hành trình của bạn sự thư giãn trọn vẹn.',
    guestsCount: 10,
    bedroomsCount: 5,
    bathroomsCount: 5,
    address: 'Đường Khởi Nghĩa Bắc Sơn, Phường 10, Đà Lạt',
    policies: {
      time: ['Nhận phòng: Từ 14:00', 'Trả phòng: Trước 12:00'],
      other: ['Huỷ phòng miễn phí trước 5 ngày.', 'Chấp nhận thanh toán bằng tiền mặt hoặc chuyển khoản.']
    },
    bookedDates: ['2026-06-05', '2026-06-06', '2026-06-12', '2026-06-13'],
    pendingDates: []
  },
  {
    id: 2,
    name: 'SeaBreeze Villa Bãi Sau',
    location: 'Vũng Tàu',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeZG45D3DnfueIyicV13N_6e0AgO8vZ3aHnaoGUlwPYsMrfYsBM-49FmORxbyLO-MAtENvre0VWcUGszJ0OF_sRf5AzKjg5LUgo1oysra6sd1-i78pqjsgAgTVXfHJIS6JZHdR12jaVlS1Zrm0eaZ9TrFe9JXeQGsniTkQPaD1woFoCiP41-1vHf89ZysceOemYy9UavfVx3WLlIB-SDax5n0Y0xyaXHte9maOVwGeVnouMoUe4ydE7SS-Z3SN2JGoDbJazePRaY8-',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCeZG45D3DnfueIyicV13N_6e0AgO8vZ3aHnaoGUlwPYsMrfYsBM-49FmORxbyLO-MAtENvre0VWcUGszJ0OF_sRf5AzKjg5LUgo1oysra6sd1-i78pqjsgAgTVXfHJIS6JZHdR12jaVlS1Zrm0eaZ9TrFe9JXeQGsniTkQPaD1woFoCiP41-1vHf89ZysceOemYy9UavfVx3WLlIB-SDax5n0Y0xyaXHte9maOVwGeVnouMoUe4ydE7SS-Z3SN2JGoDbJazePRaY8-'
    ],
    status: 'Hết phòng',
    rating: 4.5,
    reviewsCount: 89,
    price: 4200000,
    type: 'Villa',
    facilities: ['pool', 'wifi', 'local_parking', 'kitchen', 'outdoor_grill', 'beach_access'],
    description: 'Biệt thự sang trọng sát biển Bãi Sau Vũng Tàu, sở hữu hồ bơi vô cực ngắm trọn đại dương xanh mát, đón gió lộng mát rượi cả ngày.',
    guestsCount: 12,
    bedroomsCount: 6,
    bathroomsCount: 6,
    address: 'Thùy Vân, Phường Thắng Tam, Vũng Tàu',
    policies: {
      time: ['Nhận phòng: Từ 14:00', 'Trả phòng: Trước 12:00'],
      other: ['Huỷ phòng miễn phí trước 7 ngày.', 'Không mang theo vật nuôi lớn.']
    },
    bookedDates: ['2026-06-01', '2026-06-02', '2026-06-03'],
    pendingDates: []
  },
  {
    id: 3,
    name: 'Hội An Ancient Retreat',
    location: 'Hội An',
    image: 'https://picsum.photos/400/300?random=3',
    images: ['https://picsum.photos/800/600?random=3'],
    status: 'Available',
    rating: 4.9,
    reviewsCount: 210,
    price: 1800000,
    type: 'Homestay',
    facilities: ['wifi', 'local_parking', 'kitchen', 'outdoor_grill'],
    description: 'Homestay đậm chất cổ kính giữa lòng phố cổ Hội An với khuôn viên rợp bóng hoa giấy và nội thất gỗ tự nhiên quý phái.',
    guestsCount: 6,
    bedroomsCount: 3,
    bathroomsCount: 3,
    address: 'Nguyễn Tri Phương, Cẩm Nam, Hội An',
    policies: {
      time: ['Nhận phòng: Từ 14:00', 'Trả phòng: Trước 12:00'],
      other: ['Khách nước ngoài cần khai báo tạm trú đầy đủ.', 'Không hút thuốc trong phòng ngủ.']
    },
    bookedDates: [],
    pendingDates: []
  },
  {
    id: 4,
    name: 'Pearl Island Luxury Stay',
    location: 'Phú Quốc',
    image: 'https://picsum.photos/400/300?random=4',
    images: ['https://picsum.photos/800/600?random=4'],
    status: 'Sắp có',
    rating: 0,
    reviewsCount: 0,
    price: 6500000,
    type: 'Villa',
    facilities: ['pool', 'wifi', 'local_parking', 'kitchen', 'beach_access'],
    description: 'Resort thu nhỏ đẳng cấp 5 sao tại đảo ngọc Phú Quốc, đem tới bãi biển mộc mạc hoang sơ và cảnh hoàng hôn đỏ rực tuyệt đẹp.',
    guestsCount: 8,
    bedroomsCount: 4,
    bathroomsCount: 4,
    address: 'Bãi Dài, Gành Dầu, Phú Quốc',
    policies: {
      time: ['Nhận phòng: Từ 14:00', 'Trả phòng: Trước 12:00'],
      other: ['Miễn phí đưa đón sân bay bằng xe điện.', 'Tiệc BBQ bãi biển cần đăng ký trước 24h.']
    },
    bookedDates: [],
    pendingDates: []
  },
  {
    id: 5,
    name: 'Pine Valley Homestay',
    location: 'Đà Lạt',
    image: 'https://picsum.photos/400/300?random=5',
    images: ['https://picsum.photos/800/600?random=5'],
    status: 'Available',
    rating: 4.7,
    reviewsCount: 156,
    price: 1200000,
    type: 'Homestay',
    facilities: ['wifi', 'kitchen', 'pets', 'landscape'],
    description: 'Nhà gỗ nhỏ xinh dạng A-Frame lọt thỏm trong thung lũng thông reo, không gian sống xanh cực kỳ thân thiện với động vật.',
    guestsCount: 4,
    bedroomsCount: 2,
    bathroomsCount: 1,
    address: 'Khe Sanh, Phường 10, Đà Lạt',
    policies: {
      time: ['Nhận phòng: Từ 14:00', 'Trả phòng: Trước 12:00'],
      other: ['Chấp nhận chó mèo nhỏ dưới 10kg.', 'Hạn chế làm ồn sau 22h tối.']
    },
    bookedDates: [],
    pendingDates: []
  },
  {
    id: 6,
    name: 'Skyline Penthouse Villa',
    location: 'TP.HCM',
    image: 'https://picsum.photos/400/300?random=6',
    images: ['https://picsum.photos/800/600?random=6'],
    status: 'Available',
    rating: 4.6,
    reviewsCount: 67,
    price: 3500000,
    type: 'Căn hộ',
    facilities: ['pool', 'wifi', 'local_parking', 'kitchen'],
    description: 'Penthouse lộng lẫy tầm nhìn vô cực ngắm trọn vẹn tháp Landmark 81 và sông Sài Gòn phồn hoa chuyển mình tuyệt đẹp về đêm.',
    guestsCount: 6,
    bedroomsCount: 3,
    bathroomsCount: 3,
    address: 'Vinhome Golden River, Quận 1, TP.HCM',
    policies: {
      time: ['Nhận phòng: Từ 14:00', 'Trả phòng: Trước 12:00'],
      other: ['An ninh 24/7 nghiêm ngặt.', 'Yêu cầu đặt cọc bằng CMND/CCCD khi nhận phòng.']
    },
    bookedDates: [],
    pendingDates: []
  },
  {
    id: 7,
    name: 'Pine Hill Retreat Villa',
    location: 'Đà Lạt',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_Gzvn930KTyXIc-oGwCk6j8QAahpFMLvyFwuJr-PvzI7x4xlvEtqhk14hXKOamtpSnUZUEJI7pevyu5APRprYW9mSo1xjx2q3RG6r0x6bIDUge7h6u9aQCIrj7PbeNd_QaOs8tvQjj1JcMXzvGakEzS_M2hiXjl9-nrjxsjZAnY-YYSnz78hNGWTuV9lEaF6nmRLmeQMSXFX1E00AoOpz5KXRlOawIIJv_0qXEx6EsFn4F4G8R5jcSLd32JmjaATxUXQiVnjn8y0u',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC_Gzvn930KTyXIc-oGwCk6j8QAahpFMLvyFwuJr-PvzI7x4xlvEtqhk14hXKOamtpSnUZUEJI7pevyu5APRprYW9mSo1xjx2q3RG6r0x6bIDUge7h6u9aQCIrj7PbeNd_QaOs8tvQjj1JcMXzvGakEzS_M2hiXjl9-nrjxsjZAnY-YYSnz78hNGWTuV9lEaF6nmRLmeQMSXFX1E00AoOpz5KXRlOawIIJv_0qXEx6EsFn4F4G8R5jcSLd32JmjaATxUXQiVnjn8y0u',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAnJlGr3IgXtsgrN9e5EO8SF27R6jQle_YqTUX77vw7NdspyX-lGuIxv0FtNh2Ao3qOJ_ZDDPgwUGU2n5f001gO8pJNhizxzP2ybsfekot4YSRNi2NNiVyGoqnnVr6eBQbWzyfyAdKXuvMlrVe5EuADwuyL4_8UHpUdJUsckH22lcyv3Rm2SeJMm38VIbe_NUpC-bWjgwtyZcqCpYqP9TYHclDduFVsj3CnbcB2fjmPUudsTbwkp9JXyTzoCPlJ2At0r9YY02WFvEXv',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBDvjuEsaolVHCNj_jdp94rivDfhTeQBJLJ-nm4huN6JvrVUuiB3DPNMd8tNnWxZsKPiFvEbyOCFhAJlgXHQcOeZpYuHCMx80zVSO8Da3TTvIC-uivhqazAQ91Ulq1Y3Vv2I1hbplucFkFRWPE3RLKlg1x1IshdGHvMR0L3RL9Ws9ronva7-_LWZcResThrs_AhLCaSSouATwA-GSOSK1ytqFpH4hC_Oo2ikr2F8IlwDI5WYGq8VFByKy7UU_obO5_k6ajkfYimHO-C',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB6xqoqBgDxbwnfH3dJ0EjjLxwH-Oq00gYHs7tDhhRsvOl5pUptIBn5Hl5m6KnSKxjUQvoeK3NYtKvAuQJD87HmK1xguf84jScOr4-Jx1XSwB6TT2XbMDqn-Ztb5xnK_0G3TGcVS67e4KusIiWMb-7iFrZwRF_zQahcug4NT_pwxl8xNYOT8juJB3e38ffeJgnsxDbtUhm3QK6gvI8Ar9IQVDEtNyshvw2y4uq25alMJ-hD8ueiDBHeiR9mlvuTdiEvFLuDKImfN7qJ',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAbc-Z_LWByySjmtyunqyhEDXxWrkJiIbIvoEIRCg9_woljS_95PQMri8jRhZPD2QbBLR-rF12plJAf1SQK8STheRMraI3B_0CSOAQ16rjjvQaX_QqB9GoXX3RpRzucvFOrRx2PzgVJbAbOjUdXiucIK5myC3cG3xfCQQPO0mIdpOo9krpJdEBCR67HH2tmeWzmhvoGilivBRTKOkMCHAJG9JQxRb46KGdLkYh3kZv0xpIwtJQyQx6ZvZS_NUxmLVHG1aCT-wGGt31C'
    ],
    status: 'Available',
    rating: 4.8,
    reviewsCount: 24,
    price: 2500000,
    type: 'Villa',
    facilities: ['wifi', 'pool', 'local_parking', 'kitchen', 'outdoor_grill', 'landscape', 'pets'],
    description: 'Nằm ẩn mình giữa đồi thông xanh mát, Pine Hill Retreat Villa mang đến không gian nghỉ dưỡng tĩnh lặng, tách biệt hoàn toàn với sự ồn ào của phố thị. Kiến trúc A-frame hiện đại kết hợp cửa kính lớn giúp bạn ôm trọn khung cảnh sương mù đặc trưng của Đà Lạt mỗi sớm mai. Villa được trang bị nội thất đầy đủ sang trọng, lò sưởi ấm áp, bồn tắm cao cấp và khu vực BBQ hoàn hảo ngoài trời.',
    guestsCount: 8,
    bedroomsCount: 4,
    bathroomsCount: 4,
    address: 'Phường 3, Đà Lạt',
    policies: {
      time: ['Nhận phòng: Từ 14:00', 'Trả phòng: Trước 12:00'],
      other: ['Huỷ phòng miễn phí trước 7 ngày.', 'Thú cưng dưới 10kg được phép.']
    },
    bookedDates: ['2026-05-20', '2026-05-21', '2026-05-25'],
    pendingDates: ['2026-05-28']
  }
];
