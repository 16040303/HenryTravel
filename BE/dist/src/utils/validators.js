"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePositiveInt = parsePositiveInt;
exports.parseDate = parseDate;
exports.isValidDateRange = isValidDateRange;
exports.parseFacilities = parseFacilities;
function parsePositiveInt(value, defaultValue, maxValue) {
    if (value === undefined || value === null || value === '')
        return defaultValue;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0)
        return defaultValue;
    return Math.min(parsed, maxValue);
}
function parseDate(value) {
    if (typeof value !== 'string' || !value.trim())
        return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return undefined;
    return date;
}
function isValidDateRange(checkIn, checkOut) {
    if (!checkIn || !checkOut)
        return false;
    return checkIn.getTime() < checkOut.getTime();
}
function parseFacilities(value) {
    if (!value)
        return [];
    if (Array.isArray(value)) {
        return value
            .filter((item) => typeof item === 'string')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    if (typeof value !== 'string')
        return [];
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}
