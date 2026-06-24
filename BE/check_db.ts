import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const villas = await prisma.villa.findMany({
    select: { id: true, name: true, status: true }
  });
  console.log('--- Villas ---');
  console.log(villas);

  const bookings = await prisma.booking.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, bookingCode: true, guestToken: true, status: true, checkIn: true, checkOut: true, guestPhone: true }
  });
  console.log('--- Bookings ---');
  console.log(bookings);

  const feedbacks = await prisma.feedback.findMany({
    select: { id: true, rating: true, comment: true, verified: true, booking: { select: { bookingCode: true } } }
  });
  console.log('--- Feedbacks ---');
  console.log(feedbacks);
}

main().catch(console.error).finally(() => prisma.$disconnect());
