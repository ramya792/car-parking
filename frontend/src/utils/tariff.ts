/**
 * Canonical Smart Parking Tariff Engine
 * Rate: ₹10 per hour (per-minute precision)
 * Formula: fee = durationMinutes * (10 / 60)
 */

export const PARKING_HOURLY_RATE = 10.0;
export const PARKING_PER_MINUTE_RATE = PARKING_HOURLY_RATE / 60.0; // 0.1666667
export const MINIMUM_EXIT_FEE = 10.0;

/**
 * Parses diverse timestamp formats into a JavaScript Date object.
 * Handles:
 * - "28-09-2026 04:12 PM", "28-09-2026 08:42 PM"
 * - "10:00 AM", "01:00 PM"
 * - ISO strings & standard date strings
 */
export function parseDateTime(timeStr: string | Date | undefined, referenceDate?: Date): Date {
  if (!timeStr) return referenceDate || new Date();
  if (timeStr instanceof Date) return timeStr;

  const str = timeStr.trim();
  const ref = referenceDate || new Date();

  // Pattern: "DD-MM-YYYY hh:mm AM/PM" or "DD-MM-YYYY HH:mm:ss"
  const dmyMatch = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    let hours = parseInt(dmyMatch[4], 10);
    const minutes = parseInt(dmyMatch[5], 10);
    const seconds = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
    const meridian = dmyMatch[7]?.toUpperCase();

    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;

    return new Date(year, month, day, hours, minutes, seconds);
  }

  // Pattern: "hh:mm AM/PM"
  const timeOnlyMatch = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (timeOnlyMatch) {
    let hours = parseInt(timeOnlyMatch[1], 10);
    const minutes = parseInt(timeOnlyMatch[2], 10);
    const seconds = timeOnlyMatch[3] ? parseInt(timeOnlyMatch[3], 10) : 0;
    const meridian = timeOnlyMatch[4]?.toUpperCase();

    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;

    const d = new Date(ref);
    d.setHours(hours, minutes, seconds, 0);
    return d;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return ref;
}

/**
 * Calculates duration in minutes between entry and exit timestamps.
 * Properly handles overnight stays (exit time earlier in clock than entry time).
 */
export function calculateDurationMinutes(
  entryTime: string | Date,
  exitTime?: string | Date
): number {
  const dtExit = parseDateTime(exitTime);
  let dtEntry = parseDateTime(entryTime, dtExit);

  let diffMs = dtExit.getTime() - dtEntry.getTime();

  // If exit is before entry (e.g. 10:00 PM entry to 02:00 AM exit without date change)
  if (diffMs < 0) {
    // Add 1 day
    dtExit.setDate(dtExit.getDate() + 1);
    diffMs = dtExit.getTime() - dtEntry.getTime();
  }

  const durationMinutes = Math.max(0, Math.round(diffMs / 60000));
  return durationMinutes;
}

/**
 * Formats duration minutes into "Xh Ym" or "Xm".
 */
export function formatDuration(durationMinutes: number): string {
  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  }
  return `${mins}m`;
}

/**
 * Calculates dynamic parking fee:
 * fee = durationMinutes * (hourlyRate / 60)
 * Rounding: rounded to 2 decimal places.
 */
export function calculateParkingFee(
  durationMinutesOrEntryTime: number | string | Date,
  exitTime?: string | Date,
  hourlyRate: number = PARKING_HOURLY_RATE
): number {
  let minutes: number;
  if (typeof durationMinutesOrEntryTime === 'number') {
    minutes = durationMinutesOrEntryTime;
  } else {
    minutes = calculateDurationMinutes(durationMinutesOrEntryTime, exitTime);
  }

  const fee = minutes * (hourlyRate / 60.0);
  return Math.round((fee + Number.EPSILON) * 100) / 100;
}

export function calculateExitFee(
  durationMinutesOrEntryTime: number | string | Date,
  exitTime?: string | Date,
  hourlyRate: number = PARKING_HOURLY_RATE
): number {
  return Math.max(
    MINIMUM_EXIT_FEE,
    calculateParkingFee(durationMinutesOrEntryTime, exitTime, hourlyRate)
  );
}
