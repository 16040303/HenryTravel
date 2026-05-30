import React, { createContext, useState, useContext, ReactNode } from 'react';

export type Language = 'vi' | 'en' | 'ko';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  vi: {
    // Navbar
    'nav.home': 'Trang Chủ',
    'nav.listings': 'Tìm Villas',
    'nav.lookup': 'Tra cứu Booking',
    'nav.admin': 'Quản trị Admin',
    'nav.zaloSupport': 'Hỗ trợ Zalo',

    // Home
    'home.heroTitle': 'Biệt Thự Nghỉ Dưỡng Sang Trọng Hàng Đầu VN',
    'home.heroSubtitle': 'Khám phá chuỗi biệt thự cao cấp đồi thông Đà Lạt, sát biển xanh lộng gió cùng dịch vụ giữ chỗ thông minh bảo bọc kỳ nghỉ an toàn của bạn.',
    'home.searchPlaceholder': 'Chọn điểm đến của bạn...',
    'home.checkIn': 'Nhận phòng',
    'home.checkOut': 'Trả phòng',
    'home.guests': 'Số khách',
    'home.rooms': 'Số phòng',
    'home.searchBtn': 'TÌM KIẾM NGAY',
    'home.popularLocations': 'Điểm Đến Cực Hot',
    'home.popularLocationsDesc': 'Những tọa độ du lịch nghỉ dưỡng đón sóng du khách tuyệt vời nhất Việt Nam năm 2026',
    'home.featuredVillas': 'Biệt Thự & Homestay Nổi Bật',
    'home.featuredVillasDesc': 'Bộ sưu tập độc quyền của chúng tôi với kiến trúc đặc trưng, nội thất gỗ mộc mạc ôm lấy thiên nhiên thơ mộng',
    'home.night': 'đêm',
    'home.viewDetails': 'Xem Chi Tiết phòng',
    'home.bookNow': 'Đặt Giữ Chỗ Ngay',

    // Listings
    'list.filters': 'Bộ lọc tìm kiếm nâng cao',
    'list.priceRange': 'Khoảng giá thuê (VND/đêm)',
    'list.propertyType': 'Loại hình biệt thự',
    'list.allTypes': 'Tất cả loại hình',
    'list.villa': 'Biệt thự (Villa)',
    'list.homestay': 'Nhà dân (Homestay)',
    'list.apartment': 'Căn hộ dịch vụ',
    'list.amenities': 'Tiện nghi mong muốn',
    'list.resetFilters': 'Thiết lập lại bộ lọc',
    'list.foundResults': 'Tìm thấy {count} căn hộ/biệt thự chuẩn 2026',
    'list.noResults': 'Không tìm thấy kết quả nào phù hợp với bộ lọc hiện tại. Vui lòng thử nới lỏng điều kiện!',

    // Detail
    'detail.back': 'Trở lại danh sách biệt thự',
    'detail.capacity': 'Khách hàng tối đa',
    'detail.bedrooms': 'Căn phòng ngủ',
    'detail.bathrooms': 'Phòng vệ sinh',
    'detail.address': 'Địa chỉ cụ thể',
    'detail.description': 'Giới thiệu chi tiết không gian kiến trúc',
    'detail.policies': 'Quy định nội bộ & Hướng dẫn',
    'detail.reviews': 'Đánh giá chân thực từ du khách',
    'detail.verifiedGuest': 'Du khách thực tế đã nghỉ dưỡng',
    'detail.addFeedback': 'Chia sẻ cảm nhận lưu trú của bạn',
    'detail.fullName': 'Tên của bạn',
    'detail.comment': 'Nhập trải nghiệm thực tế (Mô tả chi tiết phòng ốc, thái độ phục vụ...)',
    'detail.rating': 'Xếp hạng dịch vụ',
    'detail.submit': 'Gửi đánh giá xác nhận',
    'detail.pricePerNight': 'Giá thuê / đêm',
    'detail.totalCost': 'Tổng tiền tạm gửi (x {nights} đêm)',
    'detail.policyHoldMessage': 'Lưu ý: Sau khi bấm nút xác nhận, VillaStay sẽ tạm khóa biệt thự này trong vòng 15 phút. Bạn cần thực hiện chuyển khoản thanh toán nhanh và gửi biên nhận qua Zalo hỗ trợ để được duyệt ngay lập tức.',
    'detail.confirmBooking': 'XÁC NHẬN GIỮ CHỖ 15 PHÚT',
    'detail.phone': 'Số điện thoại liên lạc',
    'detail.email': 'Địa chỉ thư điện tử (Email)',
    'detail.successfulTitle': 'ĐÃ GIỮ CHỖ THÀNH CÔNG!',
    'detail.successfulSubtitle': 'Vui lòng hoàn tất thanh toán để tránh lệnh tự động hủy biệt thự sau 15 phút.',
    'detail.bookingCode': 'Mã số đặt biệt thự',
    'detail.expiryNotice': 'Thời gian hết hạn bảo giữ chỗ',
    'detail.zaloAlertInstruction': 'Bấm nút dưới đây để gửi trực tiếp thông tin/hình ảnh giao dịch qua Zalo cho Admin duyệt booking của bạn.',
    'detail.zaloSendReceiptBtn': 'Gửi Biên Lai Thanh Toán Qua Zalo',
    'detail.searchBookingBtn': 'Sang Trang Tra Cứu Hóa Đơn',

    // Lookup
    'look.title': 'Tra cứu trạng thái đặt villa',
    'look.subtitle': 'Giải pháp tự động giúp kiểm tra kịp thời tình trạng đối soát tài chính của bạn mà không cần chờ đợi lâu.',
    'look.enterCode': 'Điền mã phòng của bạn (Vd: VB-PENDING)',
    'look.enterPhone': 'Nhập số điện thoại đăng ký đặt giữ chỗ',
    'look.checkBtn': 'TIẾN HÀNH KIỂM TRA TRẠNG THÁI',
    'look.bookingDetails': 'Chi tiết hành trình của bạn',
    'look.customerName': 'Họ tên hành khách đại diện',
    'look.status': 'Trạng thái đối soát biên lai',
    'look.checkZaloAlert': 'Nếu bạn đã chuyển khoản thành công nhưng trạng thái chưa cập nhật, vui lòng bấm Zalo support để gửi nhanh minh chứng nộp tiền nhé.',
    'look.titleTag': 'Truy tìm đặt chỗ',
    'look.enterCodeLabel': 'Mã Đặt Phòng (Code)',
    'look.enterPhoneLabel': 'Số Điện Thoại Đăng Ký',
    'look.searching': 'Đang truy vấn...',
    'look.resultHeader': 'KẾT QUẢ ĐẶT PHÒNG CỦA BẠN',
    'look.guestName': 'Khách hàng chính',
    'look.guestPhone': 'Số điện thoại liên hệ',
    'look.bookingDates': 'Lịch nhận trả phòng',
    'look.totalCost': 'Tổng giá trị đơn',
    'look.pendingTitle': 'Đơn hàng hiện đang giữ phòng tạm khóa (PENDING)',
    'look.pendingDesc': 'Bạn chưa thanh toán xác minh. Để tránh bị hủy sau 15 phút, vui lòng kích hoạt thanh toán chuyển khoản và liên hệ quản lý hỗ trợ chốt phòng ngay qua Zalo.',
    'look.confirmTitle': 'Đặt phòng đã xác nhận thành công! (CONFIRMED)',
    'look.confirmDesc': 'Lịch trình của quý khách đã được lưu đóng băng trên hệ thống. Quản gia của VillaStay sẽ liên hệ trực tiếp trước ngày khởi hành 24 giờ để gửi mã cửa biệt thự và hướng dẫn đón tiếp. Chúc quý khách một chuyến nghỉ dưỡng an nhiên hạnh phúc!',
    'look.cancelledTitle': 'Đặt phòng đã hủy bỏ hoặc hoàn thành cũ (CANCELLED)',
    'look.cancelledDesc': 'Khi giữ chỗ hết hạn mà không được đối chiếu biên lai, phòng được thả trống trở lại thị trường. Quý khách vui lòng liên hệ hotline hỗ trợ nếu phát hiện nhầm lẫn.',
    'look.feedbackHeader': 'Gửi phản hồi / Review kỳ nghỉ của bạn',
    'look.feedbackDesc': 'Nếu quý khách đã hoàn tất kỳ nghỉ, hãy dành chút thời gian gửi gắm cảm nghĩ!',
    'look.feedbackName': 'Tên hiển thị nhận xét',
    'look.feedbackRating': 'Đánh giá chung của bạn',
    'look.feedbackComment': 'Nhận xét chi tiết',
    'look.feedbackCommentPlaceholder': 'Cam kết review trung thực, khách quan giúp xây dựng dịch vụ...',
    'look.feedbackBtn': 'Gửi phản hồi của tôi',
    'look.feedbackSuccess': 'Nhận xét ý kiến đã gửi lên ban quản trị thành công! Xin chân thành cảm ơn đóng góp.',
    'look.notFoundTitle': 'Không tìm thấy thông tin',
    'look.notFoundDesc': 'Hệ thống không tìm thấy đặt phòng khớp với mã số đặt và điện thoại đã điền.',
    'look.btnConfirmZalo': 'Xác nhận giữ chỗ ngay',
    'look.rating5': '⭐️⭐️⭐️⭐️⭐️ Trải nghiệm tuyệt hảo (5 sao)',
    'look.rating4': '⭐️⭐️⭐️⭐️ Trải nghiệm rất ổn (4 sao)',
    'look.rating3': '⭐️⭐️⭐️ Trải nghiệm bình thường (3 sao)',
    'look.rating2': '⭐️⭐️ Trải nghiệm dưới trung bình (2 sao)',
    'look.rating1': '⭐️ Tệ tệ hại (1 sao)',

    // Admin
    'admin.title': 'Khu Vực Phân Tích & Điều Hành',
    'admin.subtitle': 'Theo dõi lưu lượng đặt phòng trực quan, đối soát biên lai chuyển khoản và biên tập cơ sở hạ tầng.',
    'admin.revenue': 'Tổng Doanh Thu Du Lịch',
    'admin.totalVillas': 'Biệt thự lưu trú',
    'admin.totalBookings': 'Đơn giữ chỗ trực tuyến',
    'admin.approvalAlert': 'YÊU CẦU CHỜ DUYỆT TÀI CHÍNH TẠM GIỮ CHỖ',
    'admin.confirmPaid': 'Xác nhận đã nộp tiền chuyển khoản',
    'admin.cancelHold': 'Hủy giữ phòng',
    'admin.chartTitle': 'Thống Kê Doanh Thu Tuần 2026',
    'admin.chartDesc': 'Biểu đồ trực quan doanh thu biến động theo từng mốc thời gian thực',
    'admin.addVillaBtn': 'Thêm Biệt Thự Mới',
    'admin.listTitle': 'Khảo Sát Kho Phòng Du Lịch',

    // Facilities & Locations
    'fac.wifi': 'WiFi tốc độ cao',
    'fac.pool': 'Hồ bơi vô cực',
    'fac.local_parking': 'Bãi đỗ xe an toàn',
    'fac.kitchen': 'Bếp nấu đầy đủ',
    'fac.outdoor_grill': 'Khu lò nướng BBQ',
    'fac.landscape': 'Cảnh quan núi đồi',
    'fac.beach_access': 'Đường xuống biển',
    'fac.pets': 'Thân thiện thú cưng',

    'loc.dalat': 'Đà Lạt',
    'loc.vungtau': 'Vũng Tàu',
    'loc.phuquoc': 'Phú Quốc',
    'loc.hoian': 'Hội An',
    'loc.nhatrang': 'Nha Trang',
    'loc.hcm': 'TP.HCM',

    'status.PENDING': 'Đang giữ phòng (Chờ nộp tiền)',
    'status.CONFIRMED': 'Đã đối soát (Giao dịch hoàn tất)',
    'status.CANCELLED': 'Đã hủy giữ chỗ (Hết giờ/Chủ động)',
  },
  en: {
    // Navbar
    'nav.home': 'Home',
    'nav.listings': 'Find Villas',
    'nav.lookup': 'Lookup Booking',
    'nav.admin': 'Admin Console',
    'nav.zaloSupport': 'Zalo Support',

    // Home
    'home.heroTitle': 'Leading Luxury Vacation Villas in VN',
    'home.heroSubtitle': 'Discover our collection of premium villas in Da Lat hills, coastal Vung Tau, and ocean resorts with a smart 15-minute booking hold system.',
    'home.searchPlaceholder': 'Choose your dream destination...',
    'home.checkIn': 'Check-in',
    'home.checkOut': 'Check-out',
    'home.guests': 'Guests',
    'home.rooms': 'Rooms',
    'home.searchBtn': 'SEARCH NOW',
    'home.popularLocations': 'Popular Destinations',
    'home.popularLocationsDesc': 'The most attractive and highly-rated vacation coordinates in Vietnam for 2026',
    'home.featuredVillas': 'Featured Villas & Homestays',
    'home.featuredVillasDesc': 'Explore our selected portfolio with iconic designs, natural pine surroundings, and modern comforts',
    'home.night': 'night',
    'home.viewDetails': 'View Property Details',
    'home.bookNow': 'Book Property Now',

    // Listings
    'list.filters': 'Advanced Search Filters',
    'list.priceRange': 'Price range (VND/night)',
    'list.propertyType': 'Property Type',
    'list.allTypes': 'All Types',
    'list.villa': 'Luxury Villa',
    'list.homestay': 'Cosy Homestay',
    'list.apartment': 'Service Apartment',
    'list.amenities': 'Required Amenities',
    'list.resetFilters': 'Reset advanced filters',
    'list.foundResults': 'Found {count} premium stays for 2026',
    'list.noResults': 'No villas match your filters. Please expand your selection price range or options!',

    // Detail
    'detail.back': 'Back to villas listing',
    'detail.capacity': 'Maximum Guests',
    'detail.bedrooms': 'Bedrooms Count',
    'detail.bathrooms': 'Bathrooms Count',
    'detail.address': 'Specific Address',
    'detail.description': 'Architecture & Spatial Description',
    'detail.policies': 'House Regulations & Guidelines',
    'detail.reviews': 'Authentic Reviews from Guests',
    'detail.verifiedGuest': 'Verified Vacationer',
    'detail.addFeedback': 'Share Your Vacation Experience',
    'detail.fullName': 'Your profile name',
    'detail.comment': 'Add your authentic feedback (Describe rooms condition, host hospitality...)',
    'detail.rating': 'Overall Rating Score',
    'detail.submit': 'Submit verified review',
    'detail.pricePerNight': 'Price / night',
    'detail.totalCost': 'Total Cost (x {nights} nights)',
    'detail.policyHoldMessage': 'Notice: Upon confirmation, VillaStay locks this villa for you for 15 minutes. Transfer funds now and message our support team on Zalo with your receipt for fast approval.',
    'detail.confirmBooking': 'HOLD THIS PROPERTY (15 MINS)',
    'detail.phone': 'Your Contact Phone',
    'detail.email': 'Your Email Address',
    'detail.successfulTitle': 'PROPERTY LOCKED SUCCESSFULLY!',
    'detail.successfulSubtitle': 'Please complete the bancassurance transfer within 15 minutes to prevent automated release.',
    'detail.bookingCode': 'System Booking Code',
    'detail.expiryNotice': 'Room Hold Expiration',
    'detail.zaloAlertInstruction': 'Click below to send receipt photo and reference code to Zalo support for instant validation.',
    'detail.zaloSendReceiptBtn': 'Send Receipt image via Zalo',
    'detail.searchBookingBtn': 'Go to Reservation Lookup Page',

    // Lookup
    'look.title': 'Look up your reservation status',
    'look.subtitle': 'Automated lookup center to match bank transfer status in real-time without administrative delays.',
    'look.enterCode': 'Enter booking code (e.g., VB-PENDING)',
    'look.enterPhone': 'Enter registered phone number',
    'look.checkBtn': 'EXECUTE STATUS CHECKUP',
    'look.bookingDetails': 'Your Booking Reservation Details',
    'look.customerName': 'Representative Guest Name',
    'look.status': 'Account Reconciliation Status',
    'look.checkZaloAlert': 'If money has been sent but the status is still pending, please click Zalo Support to provide instant payment evidence.',
    'look.titleTag': 'Search Booking',
    'look.enterCodeLabel': 'Booking Code',
    'look.enterPhoneLabel': 'Registered Phone Number',
    'look.searching': 'Querying...',
    'look.resultHeader': 'YOUR RESERVATION RESULT',
    'look.guestName': 'Primary Guest',
    'look.guestPhone': 'Contact Phone Number',
    'look.bookingDates': 'Check-in/Check-out Dates',
    'look.totalCost': 'Total Reservation Price',
    'look.pendingTitle': 'Booking is currently pending hold (PENDING)',
    'look.pendingDesc': 'Payment verification pending. To prevent automated release in 15 minutes, please complete your bank transfer and message us on Zalo to secure your room.',
    'look.confirmTitle': 'Reservation confirmed successfully! (CONFIRMED)',
    'look.confirmDesc': 'Your reservation is locked in. Our VillaStay house manager will contact you 24 hours prior to arrival with the door access code and check-in instructions. Wish you a wonderful vacation!',
    'look.cancelledTitle': 'Reservation cancelled or past completed (CANCELLED)',
    'look.cancelledDesc': 'If the room hold expires without bank transfer matching, the room is released back to inventory. Please contact support if this is an error.',
    'look.feedbackHeader': 'Submit feedback / Review your vacation',
    'look.feedbackDesc': 'If you have completed your vacation, please take a moment to share your experience!',
    'look.feedbackName': 'Reviewer Display Name',
    'look.feedbackRating': 'Your Overall Rating',
    'look.feedbackComment': 'Detailed Comment',
    'look.feedbackCommentPlaceholder': 'Please provide an honest and objective review to help us improve...',
    'look.feedbackBtn': 'Submit My Feedback',
    'look.feedbackSuccess': 'Your review has been successfully submitted to management! Thank you so much for your feedback.',
    'look.notFoundTitle': 'Reservation Not Found',
    'look.notFoundDesc': 'The system could not find a reservation matching the booking code and phone number provided.',
    'look.btnConfirmZalo': 'Secure Reservation Now',
    'look.rating5': '⭐️⭐️⭐️⭐️⭐️ Excellent experience (5 stars)',
    'look.rating4': '⭐️⭐️⭐️⭐️ Very good experience (4 stars)',
    'look.rating3': '⭐️⭐️⭐️ Normal experience (3 stars)',
    'look.rating2': '⭐️⭐️ Below average experience (2 stars)',
    'look.rating1': '⭐️ Very poor experience (1 star)',

    // Admin
    'admin.title': 'Executive Analytics Dashboard',
    'admin.subtitle': 'Monitor active rental flows, reconcile booking bank receipts, and edit inventory settings.',
    'admin.revenue': 'Accumulated Travel Revenue',
    'admin.totalVillas': 'Total Stays Registered',
    'admin.totalBookings': 'Direct Holdings Placed',
    'admin.approvalAlert': 'PENDING BANKING VERIFICATIONS FOR HOLDS',
    'admin.confirmPaid': 'Confirm Bank Receipt Received',
    'admin.cancelHold': 'Reclaim Room Hold',
    'admin.chartTitle': 'Weekly Financial Statistics 2026',
    'admin.chartDesc': 'Calculated performance metrics over active days updated dynamically',
    'admin.addVillaBtn': 'Add New Property',
    'admin.listTitle': 'Inventory Asset Management',

    // Facilities & Locations
    'fac.wifi': 'High-speed WiFi',
    'fac.pool': 'Infinity Pool',
    'fac.local_parking': 'Secure Parking lot',
    'fac.kitchen': 'Chef Kitchen',
    'fac.outdoor_grill': 'BBQ grill station',
    'fac.landscape': 'Scenic Pine Valley view',
    'fac.beach_access': 'Beach access path',
    'fac.pets': 'Pet Friendly allowed',

    'loc.dalat': 'Da Lat',
    'loc.vungtau': 'Vung Tau',
    'loc.phuquoc': 'Phu Quoc',
    'loc.hoian': 'Hoi An',
    'loc.nhatrang': 'Nha Trang',
    'loc.hcm': 'Ho Chi Minh',

    'status.PENDING': 'Reserved (Awaiting Transfer)',
    'status.CONFIRMED': 'Verified (Transaction Secured)',
    'status.CANCELLED': 'Expired/Terminated',
  },
  ko: {
    // Navbar
    'nav.home': '홈',
    'nav.listings': '빌라 검색',
    'nav.lookup': '예약 조회',
    'nav.admin': '관리자 콘솔',
    'nav.zaloSupport': '잘로 지원',

    // Home
    'home.heroTitle': '베트남 최고급 휴양 빌라 컬렉션',
    'home.heroSubtitle': '다랏의 청정 소나무 숲, 붕타우의 시원한 해변 휴양 빌라를 지능형 15분 선확보 기술로 가장 안전하게 예약해 보세요.',
    'home.searchPlaceholder': '꿈꾸던 여행지를 선택하세요...',
    'home.checkIn': '체크인',
    'home.checkOut': '체크아웃',
    'home.guests': '인원수',
    'home.rooms': '객실수',
    'home.searchBtn': '지금 객실 검색',
    'home.popularLocations': '인기 명소 탐방',
    'home.popularLocationsDesc': '2026년 가장 많은 사랑을 받고 있는 베트남 최고의 힐링 여행 포인트',
    'home.featuredVillas': '추천 빌라 & 홈스테이',
    'home.featuredVillasDesc': '빼어난 주변 전망과 소박한 전통 원목 스타일이 어우러진 최고급 스위트 홈스테이 엄선',
    'home.night': '박',
    'home.viewDetails': '객실 상세 정보 보기',
    'home.bookNow': '지금 임시 예약하기',

    // Listings
    'list.filters': '정밀 검색 조건 설정',
    'list.priceRange': '요금 범위 (VND/1박)',
    'list.propertyType': '주거 숙박 형태',
    'list.allTypes': '모든 형태',
    'list.villa': '독채 빌라',
    'list.homestay': '정감 있는 홈스테이',
    'list.apartment': '레지던스 아파트',
    'list.amenities': '원하는 편의 시설',
    'list.resetFilters': '검색 조건 초기화',
    'list.foundResults': '2026 트렌드 부합 숙소 {count}개 발견',
    'list.noResults': '선택하신 요건에 맞는 숙소가 없습니다. 요금 범위나 편의 시설 조건을 완화해 보십시오!',

    // Detail
    'detail.back': '숙소 목록 리스트로 돌아가기',
    'detail.capacity': '최대 수용 인원',
    'detail.bedrooms': '안락한 침실',
    'detail.bathrooms': '청결한 욕실',
    'detail.address': '정확한 상세 주소',
    'detail.description': '인테리어 디자인 및 공간 소개',
    'detail.policies': '숙소 이용 안전 규정 및 지침',
    'detail.reviews': '실제 투숙 고객의 리얼 평점',
    'detail.verifiedGuest': '실제 투숙 인증 투숙객',
    'detail.addFeedback': '여러분의 소중한 후기를 공유하세요',
    'detail.fullName': '고객 성함',
    'detail.comment': '투숙하신 생생한 후기를 입력해주세요 (객실 위생, 친절도 등등...)',
    'detail.rating': '서비스 종합 평점',
    'detail.submit': '작성하신 후기 전송하기',
    'detail.pricePerNight': '1박당 요금',
    'detail.totalCost': '합계 금액 (x {nights}박)',
    'detail.policyHoldMessage': '주의: 예약 확정 버튼을 누르시면 해당 객실이 15분 동안 특별 확보됩니다. 시간 내에 무통장 송금을 완료한 뒤 영수증 이미지를 잘로(Zalo)로 접수해주십시오.',
    'detail.confirmBooking': '15분 객실 임시 확보하기',
    'detail.phone': '연락 가능한 전화번호',
    'detail.email': '이메일 주소 정보',
    'detail.successfulTitle': '객실 특별 선점 성공!',
    'detail.successfulSubtitle': '15분 안에 무통장 이체를 완료하셔야 자동 예약 취소를 방지할 수 있습니다.',
    'detail.bookingCode': '임시 예약 식별 코드',
    'detail.expiryNotice': '선점 유효 만료 시간',
    'detail.zaloAlertInstruction': '아래 버튼을 눌러 잘로 메신저를 통해 영수증 전송 또는 관리자 검토를 원클릭 요청할 수 있습니다.',
    'detail.zaloSendReceiptBtn': 'Zalo로 이체 영수증 전송하기',
    'detail.searchBookingBtn': '예약 거래 전용 조회 페이지 이동',

    // Lookup
    'look.title': '실시간 예약 대조 검색',
    'look.subtitle': '송금 처리 상황 및 객실 최종 허가 여부를 대기 없이 편리하게 셀프 체크할 수 있는 공간입니다.',
    'look.enterCode': '안내받으신 예약 번호 입력 (예: VB-PENDING)',
    'look.enterPhone': '등록하실 때 사용했던 전화번호',
    'look.checkBtn': '실시간 승인 현황 분석 확인',
    'look.bookingDetails': '나의 확정 여정 정보',
    'look.customerName': '대표 예약 승객명',
    'look.status': '이체 대조 처리 현황',
    'look.checkZaloAlert': '송금을 올바르게 끝마쳤으나 상태 업데이트가 늦어지는 경우 잘로 상담 채널로 즉시 영수증을 접수해주시기 바랍니다.',
    'look.titleTag': '예약 조회',
    'look.enterCodeLabel': '예약 코드',
    'look.enterPhoneLabel': '등록된 전화번호',
    'look.searching': '조회 중...',
    'look.resultHeader': '나의 예약 결과',
    'look.guestName': '주 예약 고객',
    'look.guestPhone': '연락처',
    'look.bookingDates': '체크인/체크아웃 일정',
    'look.totalCost': '총 결제 금액',
    'look.pendingTitle': '객실 임시 확보 중 (대기 - PENDING)',
    'look.pendingDesc': '송금 대조 대기 상태입니다. 15분 경과 후 자동 확보 취소를 방지하기 위해 신속히 무통장 입금을 완료하시고 잘로(Zalo)로 승인을 요청해 주세요.',
    'look.confirmTitle': '예약이 성공적으로 확정되었습니다! (CONFIRMED)',
    'look.confirmDesc': '예약 일정이 시스템에 안전하게 기록 및 확보되었습니다. 입실 24시간 전 하우스 매니저가 직접 공동현관 비밀번호 및 투숙 안내 문자를 전송해 드립니다. 편안하고 행복한 휴양 되시기를 바랍니다!',
    'look.cancelledTitle': '예약이 취소되었거나 이미 지난 여정입니다 (CANCELLED)',
    'look.cancelledDesc': '입금 대조 시한 만료 시 임시 확보된 객실은 자동으로 반환되어 판매가 재개됩니다. 오류 발생 시 잘로 상담창으로 신속히 연락해 주시기 바랍니다.',
    'look.feedbackHeader': '소중한 이용 후기 / 리뷰 남기기',
    'look.feedbackDesc': '투숙 일정을 모두 마치셨다면, 따뜻한 피드백과 소감을 들려주세요!',
    'look.feedbackName': '리뷰어 표시 이름',
    'look.feedbackRating': '종합 별점 선택',
    'look.feedbackComment': '상세 의견 작성',
    'look.feedbackCommentPlaceholder': '객실의 위생 상태, 시설 편의성, 친절도 등 실제 경험하신 생생한 의견을 들려주세요...',
    'look.feedbackBtn': '작성한 후기 전송하기',
    'look.feedbackSuccess': '작성하신 리뷰가 성공적으로 등록되었습니다! 소중한 의견에 깊이 감사드립니다.',
    'look.notFoundTitle': '예약 정보 조회 불가',
    'look.notFoundDesc': '입력하신 예약 번호 및 전화번호와 일치하는 객실 확보 데이터를 찾을 수 없습니다.',
    'look.btnConfirmZalo': 'Zalo로 이체 승인 요청',
    'look.rating5': '⭐️⭐️⭐️⭐️⭐️ 최고예요! 아주 만족함 (5성)',
    'look.rating4': '⭐️⭐️⭐️⭐️ 좋아요! 만족스러운 수준 (4성)',
    'look.rating3': '⭐️⭐️⭐️ 보통이에요! 무난함 (3성)',
    'look.rating2': '⭐️⭐️ 아쉬워요! 평균 이하 (2성)',
    'look.rating1': '⭐️ 별로예요! 실망스러움 (1성)',

    // Admin
    'admin.title': '전산 관리 및 제어판',
    'admin.subtitle': '객실 이용률 모니터링, 무통장 송금 승인, 전사 시설 정비 및 신규 펜션 정보를 배포합니다.',
    'admin.revenue': '총 관광 상품 매출 실적',
    'admin.totalVillas': '등록된 관리 빌라',
    'admin.totalBookings': '직접 예약 접수 건수',
    'admin.approvalAlert': '송금 대조 및 승인 대기 목록',
    'admin.confirmPaid': '영수증 수령 및 결제 최종 승인',
    'admin.cancelHold': '확보 취소 및 공실 반환',
    'admin.chartTitle': '2026 주간 실적 추이 그래픽',
    'admin.chartDesc': '활성화된 일자별 매출 동향 실시간 변화',
    'admin.addVillaBtn': '신규 빌라 추가 등록',
    'admin.listTitle': '등록 숙소 시설 인벤토리 분석',

    // Facilities & Locations
    'fac.wifi': '초고속 기가 와이파이',
    'fac.pool': '야외 인피니티 풀',
    'fac.local_parking': '안전 지상 주차장',
    'fac.kitchen': '조리 도구 완비 주방',
    'fac.outdoor_grill': '개별 바베큐 그릴 존',
    'fac.landscape': '운치 있는 산악 조망',
    'fac.beach_access': '해변 접근 산책로',
    'fac.pets': '반려동물 투숙 허용',

    'loc.dalat': '다랏 (Da Lat)',
    'loc.vungtau': '붕타우 (Vung Tau)',
    'loc.phuquoc': '푸꾸옥 (Phu Quoc)',
    'loc.hoian': '호이안 (Hoi An)',
    'loc.nhatrang': '나트랑 (Nha Trang)',
    'loc.hcm': '호치민 (HCMC)',

    'status.PENDING': '대기 중 (송금 확인 필요)',
    'status.CONFIRMED': '승인 완료 (객실 예약 안심)',
    'status.CANCELLED': '선점 시간 경과 및 예약 취소',
  },
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Try to read default language from localstorage, fallback to 'vi'
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('villastay_language');
    if (saved === 'en' || saved === 'vi' || saved === 'ko') {
      return saved as Language;
    }
    return 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('villastay_language', lang);
  };

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    const dictionary = TRANSLATIONS[language];
    let template = dictionary[key] || TRANSLATIONS['vi'][key] || key;

    if (replacements) {
      Object.keys(replacements).forEach((k) => {
        template = template.replace(`{${k}}`, String(replacements[k]));
      });
    }
    return template;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
