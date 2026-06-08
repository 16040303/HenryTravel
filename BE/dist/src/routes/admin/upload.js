"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const upload_1 = require("../../services/upload");
const errors_1 = require("../../utils/errors");
const router = (0, express_1.Router)();
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 20;
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
        files: MAX_FILES,
    },
    fileFilter: (_req, file, callback) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            callback(new errors_1.AppError(400, 'INVALID_FILE_TYPE', 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.'));
            return;
        }
        callback(null, true);
    },
});
const uploadImagesMiddleware = upload.array('images', MAX_FILES);
router.post('/', (req, res, next) => {
    uploadImagesMiddleware(req, res, async (error) => {
        try {
            if (error) {
                if (error instanceof multer_1.default.MulterError) {
                    if (error.code === 'LIMIT_FILE_SIZE') {
                        throw new errors_1.AppError(413, 'FILE_TOO_LARGE', 'Mỗi ảnh không được vượt quá 5MB.');
                    }
                    if (error.code === 'LIMIT_FILE_COUNT') {
                        throw new errors_1.AppError(400, 'TOO_MANY_FILES', 'Chỉ được tải lên tối đa 20 ảnh.');
                    }
                }
                throw error;
            }
            const files = Array.isArray(req.files) ? req.files : [];
            if (files.length === 0) {
                throw new errors_1.AppError(400, 'NO_FILES', 'Vui lòng chọn ít nhất một ảnh để tải lên.');
            }
            if (files.length > MAX_FILES) {
                throw new errors_1.AppError(400, 'TOO_MANY_FILES', 'Chỉ được tải lên tối đa 20 ảnh.');
            }
            const uploadedFiles = await Promise.all(files.map(async (file) => {
                try {
                    return await (0, upload_1.uploadBufferToCloudinary)(file.buffer, { folder: 'henrytravel/villas/images', resourceType: 'image' });
                }
                catch (uploadError) {
                    if (uploadError instanceof errors_1.AppError)
                        throw uploadError;
                    throw new errors_1.AppError(500, 'UPLOAD_FAILED', 'Không thể tải ảnh lên. Vui lòng thử lại.');
                }
            }));
            res.json({
                urls: uploadedFiles.map((file) => file.secureUrl || file.url),
                files: uploadedFiles,
            });
        }
        catch (routeError) {
            next(routeError);
        }
    });
});
exports.default = router;
