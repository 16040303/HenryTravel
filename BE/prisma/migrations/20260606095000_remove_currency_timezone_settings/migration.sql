-- Remove obsolete runtime settings that are no longer used by Admin Settings UI/API.
DELETE FROM "system_settings"
WHERE "key" IN ('ADMIN_CURRENCY_TYPE', 'ADMIN_TIMEZONE');
