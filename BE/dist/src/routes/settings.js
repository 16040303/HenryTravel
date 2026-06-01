"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_1 = require("../services/settings");
const router = (0, express_1.Router)();
/**
 * GET /api/settings/public
 * Returns public-safe settings (Zalo phone, URL).
 * No auth required — safe for frontend public pages.
 */
router.get('/public', async (_req, res, next) => {
    try {
        const settings = await (0, settings_1.getPublicSettings)();
        res.json(settings);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
