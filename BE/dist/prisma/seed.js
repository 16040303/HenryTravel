"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const sampleVillas = [
    {
        name: 'Henry Ocean View Đà Nẵng',
        location: 'Sơn Trà, Đà Nẵng',
        description: 'Villa hướng biển cao cấp tại Sơn Trà, không gian mở, hồ bơi riêng và ban công ngắm bình minh.',
        status: 'available',
        price: 3500000,
        priceType: 'fixed',
        accommodationType: 'villa',
        facilities: ['wifi_high_speed', 'pool', 'sea_view', 'kitchen', 'bbq_grill', 'balcony', 'air_conditioning'],
        media: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'],
        depositRequired: true,
        depositAmount: 1000000,
        maxGuests: 10,
    },
    {
        name: 'Villa Hội An Garden Retreat',
        location: 'Cẩm Thanh, Hội An',
        description: 'Villa sân vườn yên tĩnh gần phố cổ Hội An, phù hợp gia đình và nhóm bạn nghỉ dưỡng cuối tuần.',
        status: 'available',
        price: 2800000,
        priceType: 'fixed',
        accommodationType: 'villa',
        facilities: ['wifi_high_speed', 'pool', 'garden', 'kitchen', 'washer', 'free_parking', 'self_checkin'],
        media: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c'],
        depositRequired: true,
        depositAmount: 800000,
        maxGuests: 8,
    },
    {
        name: 'Đà Lạt Pine Hill Villa',
        location: 'Phường 3, Đà Lạt',
        description: 'Villa giữa đồi thông Đà Lạt, có lò sưởi, khu BBQ ngoài trời và không gian săn mây buổi sáng.',
        status: 'available',
        price: 4200000,
        priceType: 'fixed',
        accommodationType: 'villa',
        facilities: ['wifi_high_speed', 'mountain_view', 'bbq_grill', 'hot_tub', 'free_parking', 'kettle', 'workspace'],
        media: ['https://images.unsplash.com/photo-1518780664697-55e3ad937233', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3'],
        depositRequired: false,
        depositAmount: null,
        maxGuests: 12,
    },
    {
        name: 'Vũng Tàu Sunset Pool Villa',
        location: 'Bãi Sau, Vũng Tàu',
        description: 'Villa hồ bơi gần biển Bãi Sau, thiết kế hiện đại, sân thượng ngắm hoàng hôn và khu karaoke riêng.',
        status: 'available',
        price: 5200000,
        priceType: 'fixed',
        accommodationType: 'villa',
        facilities: ['wifi_high_speed', 'pool', 'near_beach', 'sea_view', 'bbq_grill', 'tv', 'air_conditioning'],
        media: ['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde', 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154'],
        depositRequired: true,
        depositAmount: 1500000,
        maxGuests: 15,
    },
    {
        name: 'Henry Hotel Resort Hội An',
        location: 'Hội An',
        description: 'Khách sạn - resort Hội An gần phố cổ, phù hợp khách nghỉ dưỡng cần dịch vụ tiện nghi và hỗ trợ tư vấn nhanh.',
        status: 'available',
        price: 1800000,
        priceType: 'fixed',
        accommodationType: 'hotel_resort',
        facilities: ['wifi_high_speed', 'pool', 'near_beach', 'free_parking', 'tv', 'hot_water', 'towels'],
        media: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d', 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf'],
        depositRequired: true,
        depositAmount: 2000000,
        maxGuests: 14,
    },
];
async function main() {
    const passwordHash = await bcryptjs_1.default.hash('admin123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@villa.com' },
        update: { name: 'HenryTravel Admin', password: passwordHash, role: 'admin', isGuest: false },
        create: { name: 'HenryTravel Admin', email: 'admin@villa.com', password: passwordHash, role: 'admin', isGuest: false },
    });
    await prisma.villa.deleteMany({ where: { name: { in: sampleVillas.map((villa) => villa.name) }, bookings: { none: {} } } });
    for (const villa of sampleVillas) {
        const { media, ...villaData } = villa;
        await prisma.villa.create({
            data: {
                ...villaData,
                facilities: villaData.facilities,
                viewsCount: 0,
                media: {
                    create: media.map((url, index) => ({
                        type: 'image',
                        url,
                        sortOrder: index,
                        isCover: index === 0,
                    })),
                },
            },
        });
    }
    console.log('Seed completed: admin@villa.com/admin123 and sample villas created.');
}
main()
    .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
