/**
 * Formats a Date object or timestamp to a local ISO date string (YYYY-MM-DD)
 * without timezone offset drift.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const tzoffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
  return new Date(date.getTime() - tzoffset).toISOString().slice(0, 10);
}
