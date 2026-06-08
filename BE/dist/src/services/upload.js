"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCloudinaryPublicId = extractCloudinaryPublicId;
exports.isManagedCloudinaryPublicId = isManagedCloudinaryPublicId;
exports.destroyCloudinaryMedia = destroyCloudinaryMedia;
exports.uploadBufferToCloudinary = uploadBufferToCloudinary;
const cloudinary_1 = require("cloudinary");
const errors_1 = require("../utils/errors");
const MANAGED_CLOUDINARY_PREFIXES = [
    'henrytravel/villas/images/',
    'henrytravel/villas/videos/',
];
function assertCloudinaryConfigured() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
        throw new errors_1.AppError(500, 'CLOUDINARY_NOT_CONFIGURED', 'Cloudinary chưa được cấu hình.');
    }
    cloudinary_1.v2.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
    });
}
function extractCloudinaryPublicId(url) {
    try {
        const parsedUrl = new URL(url);
        if (!parsedUrl.hostname.endsWith('cloudinary.com'))
            return null;
        const uploadIndex = parsedUrl.pathname.split('/').findIndex((part) => part === 'upload');
        if (uploadIndex < 0)
            return null;
        const parts = parsedUrl.pathname.split('/').slice(uploadIndex + 1).filter(Boolean);
        const publicIdParts = parts[0]?.startsWith('v') && /^v\d+$/.test(parts[0]) ? parts.slice(1) : parts;
        if (publicIdParts.length === 0)
            return null;
        const publicIdWithExtension = publicIdParts.join('/');
        return publicIdWithExtension.replace(/\.[^/.]+$/, '');
    }
    catch {
        return null;
    }
}
function isManagedCloudinaryPublicId(publicId) {
    return MANAGED_CLOUDINARY_PREFIXES.some((prefix) => publicId.startsWith(prefix));
}
async function destroyCloudinaryMedia(publicId, resourceType) {
    if (!isManagedCloudinaryPublicId(publicId)) {
        throw new errors_1.AppError(400, 'UNMANAGED_CLOUDINARY_ASSET', 'Media không thuộc thư mục quản lý.');
    }
    assertCloudinaryConfigured();
    await cloudinary_1.v2.uploader.destroy(publicId, { resource_type: resourceType });
}
async function uploadBufferToCloudinary(fileBuffer, options) {
    assertCloudinaryConfigured();
    const uploadOptions = {
        folder: options.folder,
        resource_type: options.resourceType,
        ...(options.resourceType === 'image'
            ? { transformation: [{ quality: 'auto', fetch_format: 'auto' }] }
            : {}),
    };
    const result = await new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream(uploadOptions, (error, response) => {
            if (error || !response) {
                reject(error || new Error('Cloudinary upload response is empty.'));
                return;
            }
            resolve(response);
        });
        stream.end(fileBuffer);
    });
    const thumbnailUrl = options.resourceType === 'video'
        ? cloudinary_1.v2.url(result.public_id, {
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
