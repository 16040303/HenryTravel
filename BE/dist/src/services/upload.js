"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBufferToCloudinary = uploadBufferToCloudinary;
const cloudinary_1 = require("cloudinary");
const errors_1 = require("../utils/errors");
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
async function uploadBufferToCloudinary(fileBuffer, options = {}) {
    assertCloudinaryConfigured();
    const uploadOptions = {
        folder: options.folder || 'henrytravel/villas',
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
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
