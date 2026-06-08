import { Router } from 'express';
import type { MediaType, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logAdminAction } from '../../services/adminLog';
import { AppError } from '../../utils/errors';

const router = Router({ mergeParams: true });
const mediaTypes: MediaType[] = ['image', 'video'];
const MAX_VIDEOS_PER_VILLA = 3;

type MediaInput = {
  type?: unknown;
  url?: unknown;
  secureUrl?: unknown;
  publicId?: unknown;
  thumbnailUrl?: unknown;
  width?: unknown;
  height?: unknown;
  duration?: unknown;
  format?: unknown;
  bytes?: unknown;
};

function getAdminId(req: Express.Request): string {
  if (!req.user?.id) throw new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập admin.');
  return req.user.id;
}

async function assertVilla(villaId: string): Promise<void> {
  const villa = await prisma.villa.findUnique({ where: { id: villaId }, select: { id: true } });
  if (!villa) throw new AppError(404, 'VILLA_NOT_FOUND', 'Không tìm thấy chỗ ở.');
}

function parseMediaInput(input: MediaInput, sortOrder: number): Prisma.VillaMediaUncheckedCreateWithoutVillaInput {
  if (input.type !== 'image' && input.type !== 'video') throw new AppError(400, 'VALIDATION_ERROR', 'type media không hợp lệ.');
  if (typeof input.url !== 'string' || !input.url.trim()) throw new AppError(400, 'VALIDATION_ERROR', 'url media là bắt buộc.');

  return {
    type: input.type,
    url: input.url.trim(),
    secureUrl: typeof input.secureUrl === 'string' ? input.secureUrl : null,
    publicId: typeof input.publicId === 'string' ? input.publicId : null,
    thumbnailUrl: typeof input.thumbnailUrl === 'string' ? input.thumbnailUrl : null,
    width: typeof input.width === 'number' ? input.width : null,
    height: typeof input.height === 'number' ? input.height : null,
    duration: typeof input.duration === 'number' ? input.duration : null,
    format: typeof input.format === 'string' ? input.format : null,
    bytes: typeof input.bytes === 'number' ? input.bytes : null,
    sortOrder,
    isCover: false,
  };
}

router.get('/:villaId/media', async (req, res, next) => {
  try {
    const villaId = req.params.villaId;
    await assertVilla(villaId);
    const media = await prisma.villaMedia.findMany({ where: { villaId }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    res.json({ media });
  } catch (error) {
    next(error);
  }
});

router.post('/:villaId/media', async (req, res, next) => {
  try {
    const villaId = req.params.villaId;
    await assertVilla(villaId);
    const files = Array.isArray((req.body as { files?: unknown }).files) ? (req.body as { files: MediaInput[] }).files : [];
    if (files.length === 0) throw new AppError(400, 'VALIDATION_ERROR', 'files là bắt buộc.');

    const incomingVideoCount = files.filter((item) => item.type === 'video').length;
    const existingVideoCount = await prisma.villaMedia.count({ where: { villaId, type: 'video' } });
    if (existingVideoCount + incomingVideoCount > MAX_VIDEOS_PER_VILLA) {
      throw new AppError(400, 'TOO_MANY_VIDEOS', 'Mỗi chỗ ở chỉ được tối đa 3 video.');
    }

    const last = await prisma.villaMedia.findFirst({ where: { villaId }, orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } });
    const startOrder = (last?.sortOrder ?? -1) + 1;
    const existingCount = await prisma.villaMedia.count({ where: { villaId } });

    const media = await prisma.$transaction(async (tx) => {
      const created = [];
      for (let index = 0; index < files.length; index += 1) {
        const data = parseMediaInput(files[index], startOrder + index);
        created.push(await tx.villaMedia.create({ data: { ...data, villaId, isCover: existingCount === 0 && index === 0 } }));
      }
      return created;
    });

    await logAdminAction({ adminId: getAdminId(req), action: 'ADD_VILLA_MEDIA', targetType: 'villa', targetId: villaId, req });
    res.status(201).json({ media });
  } catch (error) {
    next(error);
  }
});

router.put('/:villaId/media/reorder', async (req, res, next) => {
  try {
    const villaId = req.params.villaId;
    await assertVilla(villaId);
    const items = Array.isArray((req.body as { items?: unknown }).items) ? (req.body as { items: Array<{ id?: unknown; sortOrder?: unknown }> }).items : [];
    await prisma.$transaction(items.map((item) => {
      if (typeof item.id !== 'string' || typeof item.sortOrder !== 'number') throw new AppError(400, 'VALIDATION_ERROR', 'items reorder không hợp lệ.');
      return prisma.villaMedia.updateMany({ where: { id: item.id, villaId }, data: { sortOrder: item.sortOrder } });
    }));
    await logAdminAction({ adminId: getAdminId(req), action: 'REORDER_VILLA_MEDIA', targetType: 'villa', targetId: villaId, req });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.put('/:villaId/media/:mediaId', async (req, res, next) => {
  try {
    const { villaId, mediaId } = req.params;
    await assertVilla(villaId);
    const isCover = (req.body as { isCover?: unknown }).isCover;
    if (typeof isCover !== 'boolean') throw new AppError(400, 'VALIDATION_ERROR', 'isCover phải là boolean.');

    const media = await prisma.$transaction(async (tx) => {
      if (isCover) await tx.villaMedia.updateMany({ where: { villaId, id: { not: mediaId } }, data: { isCover: false } });
      return tx.villaMedia.update({ where: { id: mediaId }, data: { isCover } });
    });
    await logAdminAction({ adminId: getAdminId(req), action: 'UPDATE_VILLA_MEDIA', targetType: 'villa_media', targetId: mediaId, req });
    res.json(media);
  } catch (error) {
    next(error);
  }
});

router.delete('/:villaId/media/:mediaId', async (req, res, next) => {
  try {
    const { villaId, mediaId } = req.params;
    await assertVilla(villaId);
    const media = await prisma.villaMedia.findFirst({ where: { id: mediaId, villaId } });
    if (!media) throw new AppError(404, 'MEDIA_NOT_FOUND', 'Không tìm thấy media.');

    await prisma.villaMedia.delete({ where: { id: mediaId } });
    if (media.publicId) {
      await prisma.cloudinaryCleanupJob.upsert({
        where: { publicId_url_status_resourceType: { publicId: media.publicId, url: media.secureUrl || media.url, status: 'pending', resourceType: media.type } },
        update: {},
        create: { publicId: media.publicId, resourceType: media.type, url: media.secureUrl || media.url, villaId, reason: 'Deleted villa media' },
      });
    }
    await logAdminAction({ adminId: getAdminId(req), action: 'DELETE_VILLA_MEDIA', targetType: 'villa_media', targetId: mediaId, req });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
