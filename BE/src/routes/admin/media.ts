import { Router } from 'express';
import multer from 'multer';
import { uploadBufferToCloudinary, type CloudinaryResourceType } from '../../services/upload';
import { AppError } from '../../utils/errors';

const router = Router();
const MAX_FILES = 10;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const VIDEO_MAX_BYTES = 100 * 1024 * 1024;

const mimeToResourceType: Record<string, CloudinaryResourceType | undefined> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: VIDEO_MAX_BYTES,
    files: MAX_FILES,
  },
  fileFilter: (_req, file, callback) => {
    const resourceType = mimeToResourceType[file.mimetype];
    if (!resourceType) {
      callback(new AppError(400, 'INVALID_FILE_TYPE', 'Chỉ hỗ trợ JPG, PNG, WEBP, MP4, WEBM hoặc MOV.'));
      return;
    }
    callback(null, true);
  },
});

router.post('/upload', (req, res, next) => {
  upload.array('files', MAX_FILES)(req, res, async (error) => {
    try {
      if (error) {
        if (error instanceof multer.MulterError) {
          if (error.code === 'LIMIT_FILE_SIZE') throw new AppError(413, 'FILE_TOO_LARGE', 'Video không được vượt quá 100MB.');
          if (error.code === 'LIMIT_FILE_COUNT') throw new AppError(400, 'TOO_MANY_FILES', 'Chỉ được tải lên tối đa 10 file/lần.');
        }
        throw error;
      }

      const files = Array.isArray(req.files) ? req.files : [];
      if (files.length === 0) throw new AppError(400, 'NO_FILES', 'Vui lòng chọn ít nhất một file để tải lên.');
      if (files.length > MAX_FILES) throw new AppError(400, 'TOO_MANY_FILES', 'Chỉ được tải lên tối đa 10 file/lần.');

      const uploadedFiles = await Promise.all(files.map(async (file) => {
        const resourceType = mimeToResourceType[file.mimetype];
        if (!resourceType) throw new AppError(400, 'INVALID_FILE_TYPE', 'Định dạng file không hợp lệ.');
        if (resourceType === 'image' && file.size > IMAGE_MAX_BYTES) throw new AppError(413, 'FILE_TOO_LARGE', 'Mỗi ảnh không được vượt quá 5MB.');
        if (resourceType === 'video' && file.size > VIDEO_MAX_BYTES) throw new AppError(413, 'FILE_TOO_LARGE', 'Mỗi video không được vượt quá 100MB.');

        return uploadBufferToCloudinary(file.buffer, {
          resourceType,
          folder: resourceType === 'image' ? 'henrytravel/villas/images' : 'henrytravel/villas/videos',
        });
      }));

      res.json({ files: uploadedFiles });
    } catch (routeError) {
      next(routeError);
    }
  });
});

export default router;
