import { v2 as cloudinary, type UploadApiResponse, type UploadApiOptions } from 'cloudinary';
import { AppError } from '../utils/errors';

export interface UploadedCloudinaryImage {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

type UploadBufferOptions = Pick<UploadApiOptions, 'folder'>;

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

export async function uploadBufferToCloudinary(
  fileBuffer: Buffer,
  options: UploadBufferOptions = {}
): Promise<UploadedCloudinaryImage> {
  assertCloudinaryConfigured();

  const uploadOptions: UploadApiOptions = {
    folder: options.folder || 'henrytravel/villas',
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
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

  return {
    url: result.url,
    secureUrl: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}
