import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleVillaNames = [
  'Henry Ocean View Đà Nẵng',
  'Villa Hội An Garden Retreat',
  'Đà Lạt Pine Hill Villa',
  'Vũng Tàu Sunset Pool Villa',
  'Phú Quốc Beachfront Villa',
];

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@villa.com' },
    update: {
      name: 'HenryTravel Admin',
      password: passwordHash,
      role: 'admin',
      isGuest: false,
    },
    create: {
      name: 'HenryTravel Admin',
      email: 'admin@villa.com',
      password: passwordHash,
      role: 'admin',
      isGuest: false,
    },
  });

  await prisma.villa.deleteMany({
    where: {
      name: { in: sampleVillaNames },
      bookings: { none: {} },
    },
  });

  await prisma.villa.createMany({
    data: [
      {
        name: 'Henry Ocean View Đà Nẵng',
        location: 'Sơn Trà, Đà Nẵng',
        description:
          'Villa hướng biển cao cấp tại Sơn Trà, không gian mở, hồ bơi riêng và ban công ngắm bình minh.',
        status: 'available',
        price: 3500000,
        priceType: 'fixed',
        facilities: ['Hồ bơi riêng', 'View biển', 'Bếp đầy đủ', 'BBQ', 'Wifi tốc độ cao'],
        images: [
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
        ],
        viewsCount: 0,
        holdMinutes: 15,
        depositRequired: true,
        depositAmount: 1000000,
        maxGuests: 10,
      },
      {
        name: 'Villa Hội An Garden Retreat',
        location: 'Cẩm Thanh, Hội An',
        description:
          'Villa sân vườn yên tĩnh gần phố cổ Hội An, phù hợp gia đình và nhóm bạn nghỉ dưỡng cuối tuần.',
        status: 'available',
        price: 2800000,
        priceType: 'fixed',
        facilities: ['Sân vườn', 'Hồ bơi', 'Xe đạp miễn phí', 'Bếp', 'Gần phố cổ'],
        images: [
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
        ],
        viewsCount: 0,
        holdMinutes: 20,
        depositRequired: true,
        depositAmount: 800000,
        maxGuests: 8,
      },
      {
        name: 'Đà Lạt Pine Hill Villa',
        location: 'Phường 3, Đà Lạt',
        description:
          'Villa giữa đồi thông Đà Lạt, có lò sưởi, khu BBQ ngoài trời và không gian săn mây buổi sáng.',
        status: 'available',
        price: 4200000,
        priceType: 'fixed',
        facilities: ['View đồi thông', 'Lò sưởi', 'BBQ', 'Bồn tắm', 'Bãi đỗ xe'],
        images: [
          'https://images.unsplash.com/photo-1518780664697-55e3ad937233',
          'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3',
        ],
        viewsCount: 0,
        holdMinutes: 15,
        depositRequired: false,
        depositAmount: null,
        maxGuests: 12,
      },
      {
        name: 'Vũng Tàu Sunset Pool Villa',
        location: 'Bãi Sau, Vũng Tàu',
        description:
          'Villa hồ bơi gần biển Bãi Sau, thiết kế hiện đại, sân thượng ngắm hoàng hôn và khu karaoke riêng.',
        status: 'available',
        price: 5200000,
        priceType: 'fixed',
        facilities: ['Hồ bơi', 'Karaoke', 'Sân thượng', 'Gần biển', 'BBQ'],
        images: [
          'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde',
          'https://images.unsplash.com/photo-1600607688969-a5bfcd646154',
        ],
        viewsCount: 0,
        holdMinutes: 15,
        depositRequired: true,
        depositAmount: 1500000,
        maxGuests: 15,
      },
      {
        name: 'Phú Quốc Beachfront Villa',
        location: 'Dương Tơ, Phú Quốc',
        description:
          'Villa sát biển Phú Quốc với bãi cát riêng, phòng ngủ rộng, bếp mở và dịch vụ hỗ trợ đặt tour đảo.',
        status: 'available',
        price: 6800000,
        priceType: 'fixed',
        facilities: ['Sát biển', 'Bãi riêng', 'Hồ bơi', 'Dịch vụ tour', 'Bếp mở'],
        images: [
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d',
          'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf',
        ],
        viewsCount: 0,
        holdMinutes: 30,
        depositRequired: true,
        depositAmount: 2000000,
        maxGuests: 14,
      },
    ],
  });

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
