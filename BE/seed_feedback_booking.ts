import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const villa = await prisma.villa.findFirst({ where: { name: '5y' } });
  if (!villa) {
    console.error('Villa 5y not found.');
    return;
  }

  // Delete existing test booking with same code if any
  await prisma.booking.deleteMany({
    where: { bookingCode: 'VB-2026-999' }
  });

  const checkIn = new Date(Date.now() - 48 * 60 * 60 * 1000); // 2 days ago
  const checkOut = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

  const booking = await prisma.booking.create({
    data: {
      bookingCode: 'VB-2026-999',
      guestToken: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      status: 'completed',
      checkIn,
      checkOut,
      guestName: 'Nguyen Van Feedback',
      guestPhone: '0900006854',
      guestEmail: 'feedback@test.com',
      guestsCount: 2,
      adultCount: 2,
      childrenCount: 0,
      infantCount: 0,
      roomsCount: 1,
      source: 'web',
      villaId: villa.id,
    }
  });

  console.log('Created feedback test booking:', booking);
}

main().catch(console.error).finally(() => prisma.$disconnect());
