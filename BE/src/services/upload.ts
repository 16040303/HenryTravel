import { v2 as cloudinary, type UploadApiResponse, type UploadApiOptions } from 'cloudinary';
import { AppError } from '../utils/errors';

export type CloudinaryResourceType = 'image' | 'video';

export interface UploadedCloudinaryMedia {
  type: CloudinaryResourceType;
  url: string;
  secureUrl: string;
  publicId: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  format: string;
  bytes: number;
}

type UploadBufferOptions = Pick<UploadApiOptions, 'folder'> & { resourceType: CloudinaryResourceType };

const MANAGED_CLOUDINARY_PREFIXES = [
  'henrytravel/villas/images/',
  'henrytravel/villas/videos/',
];

function assertCloudinaryConfigured(): void {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new AppError(500, 'CLOUDINARY_NOT_CONFIGURED', 'Cloudinary chưa được cấu hình.');
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export function extractCloudinaryPublicId(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.hostname.endsWith('cloudinary.com')) return null;

    const uploadIndex = parsedUrl.pathname.split('/').findIndex((part) => part === 'upload');
    if (uploadIndex < 0) return null;

    const parts = parsedUrl.pathname.split('/').slice(uploadIndex + 1).filter(Boolean);
    const publicIdParts = parts[0]?.startsWith('v') && /^v\d+$/.test(parts[0]) ? parts.slice(1) : parts;
    if (publicIdParts.length === 0) return null;

    const publicIdWithExtension = publicIdParts.join('/');
    return publicIdWithExtension.replace(/\.[^/.]+$/, '');
  } catch {
    return null;
  }
}

export function isManagedCloudinaryPublicId(publicId: string): boolean {
  return MANAGED_CLOUDINARY_PREFIXES.some((prefix) => publicId.startsWith(prefix));
}

export async function destroyCloudinaryMedia(publicId: string, resourceType: CloudinaryResourceType): Promise<void> {
  if (!isManagedCloudinaryPublicId(publicId)) {
    throw new AppError(400, 'UNMANAGED_CLOUDINARY_ASSET', 'Media không thuộc thư mục quản lý.');
  }

  assertCloudinaryConfigured();
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export async function uploadBufferToCloudinary(
  fileBuffer: Buffer,
  options: UploadBufferOptions
): Promise<UploadedCloudinaryMedia> {
  assertCloudinaryConfigured();

  const uploadOptions: UploadApiOptions = {
    folder: options.folder,
    resource_type: options.resourceType,
    ...(options.resourceType === 'image'
      ? { transformation: [{ quality: 'auto', fetch_format: 'auto' }] }
      : {}),
  };

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, response) => {
      if (error || !response) {
        reject(error || new Error('Cloudinary upload response is empty.'));
        return;
      }
      resolve(response);
    });

    stream.end(fileBuffer);
  });

  const thumbnailUrl = options.resourceType === 'video'
    ? cloudinary.url(result.public_id, {
        resource_type: 'video',
        format: 'jpg',
        transformation: [{ width: 1280, crop: 'limit', quality: 'auto' }],
        secure: true,
      })
    : result.secure_url;

  return {
    type: options.resourceType,
    url: result.url,
    secureUrl: result.secure_url,
    publicId: result.public_id,
    thumbnailUrl,
    width: result.width,
    height: result.height,
    duration: typeof result.duration === 'number' ? result.duration : undefined,
    format: result.format,
    bytes: result.bytes,
  };
}
