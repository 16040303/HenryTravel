import { prisma } from '../lib/prisma';
import { destroyCloudinaryMedia, isManagedCloudinaryPublicId, type CloudinaryResourceType } from '../services/upload';

const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 10;

const globalForCloudinaryJobs = globalThis as unknown as {
  cloudinaryCleanupStarted?: boolean;
  cloudinaryCleanupInterval?: NodeJS.Timeout;
};

function shortError(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 240);
  return 'Cloudinary cleanup failed.';
}

function normalizeResourceType(value: string): CloudinaryResourceType {
  return value === 'video' ? 'video' : 'image';
}

export async function processCloudinaryCleanupJobs(): Promise<number> {
  try {
    const jobs = await prisma.cloudinaryCleanupJob.findMany({
      where: {
        OR: [
          { status: 'pending' },
          { status: 'failed', attempts: { lt: MAX_ATTEMPTS } },
        ],
        scheduledAt: { lte: new Date() },
      },
      orderBy: { createdAt: 'asc' },
      take: BATCH_SIZE,
    });

    let processedCount = 0;

    for (const job of jobs) {
      await prisma.cloudinaryCleanupJob.update({
        where: { id: job.id },
        data: { status: 'processing' },
      });

      try {
        if (!isManagedCloudinaryPublicId(job.publicId)) {
          await prisma.cloudinaryCleanupJob.update({
            where: { id: job.id },
            data: {
              status: 'skipped',
              reason: 'Public ID is outside managed folder.',
              processedAt: new Date(),
            },
          });
          processedCount += 1;
          continue;
        }

        const referencedCount = await prisma.villaMedia.count({
          where: {
            OR: [
              { publicId: job.publicId },
              { url: job.url },
              { secureUrl: job.url },
              { thumbnailUrl: job.url },
            ],
          },
        });

        if (referencedCount > 0) {
          await prisma.cloudinaryCleanupJob.update({
            where: { id: job.id },
            data: {
              status: 'skipped',
              reason: 'Media is still referenced by villa_media.',
              processedAt: new Date(),
            },
          });
          processedCount += 1;
          continue;
        }

        await destroyCloudinaryMedia(job.publicId, normalizeResourceType(job.resourceType));
        await prisma.cloudinaryCleanupJob.update({
          where: { id: job.id },
          data: {
            status: 'completed',
            processedAt: new Date(),
            error: null,
          },
        });
        processedCount += 1;
      } catch (error) {
        const nextAttempts = job.attempts + 1;
        await prisma.cloudinaryCleanupJob.update({
          where: { id: job.id },
          data: {
            status: nextAttempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
            attempts: nextAttempts,
            error: shortError(error),
            scheduledAt: new Date(Date.now() + 10 * 60 * 1000),
          },
        });
      }
    }

    if (processedCount > 0) {
      console.log(`Processed ${processedCount} Cloudinary cleanup job(s).`);
    }

    return processedCount;
  } catch (error) {
    console.error('processCloudinaryCleanupJobs failed:', shortError(error));
    return 0;
  }
}

export function startCloudinaryCleanupJob() {
  if (globalForCloudinaryJobs.cloudinaryCleanupStarted) return;

  globalForCloudinaryJobs.cloudinaryCleanupStarted = true;
  void processCloudinaryCleanupJobs();

  globalForCloudinaryJobs.cloudinaryCleanupInterval = setInterval(() => {
    void processCloudinaryCleanupJobs();
  }, 10 * 60 * 1000);

  console.log('Cloudinary cleanup job started.');
}

export function stopCloudinaryCleanupJob() {
  if (globalForCloudinaryJobs.cloudinaryCleanupInterval) {
    clearInterval(globalForCloudinaryJobs.cloudinaryCleanupInterval);
  }
  globalForCloudinaryJobs.cloudinaryCleanupStarted = false;
}
