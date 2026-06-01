"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const errors_1 = require("../utils/errors");
function errorHandler(error, _req, res, _next) {
    if ((0, errors_1.isAppError)(error)) {
        return res.status(error.statusCode).json({
            error: error.code,
            message: error.message,
            ...(process.env.NODE_ENV !== 'production' ? { stack: error.stack } : {}),
        });
    }
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    return res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' ? { details: message } : {}),
    });
}
