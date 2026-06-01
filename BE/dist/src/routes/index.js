"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const villas_1 = __importDefault(require("./villas"));
const router = (0, express_1.Router)();
router.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'henrytravel-api',
        timestamp: new Date().toISOString(),
    });
});
router.use('/villas', villas_1.default);
exports.default = router;
