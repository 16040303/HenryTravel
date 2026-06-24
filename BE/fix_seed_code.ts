import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Update VB-2026-999 to VB-2026-002
  const updated = await prisma.booking.updateMany({
    where: { bookingCode: 'VB-2026-999' },
    data: { bookingCode: 'VB-2026-002' }
  });

  console.log('Updated booking count:', updated.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
