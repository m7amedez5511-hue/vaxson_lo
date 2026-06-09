import { DateTime } from "luxon";

export const RIYADH_TZ = "Asia/Riyadh";

/**
 * Returns current DateTime in Riyadh timezone.
 * Injectable: pass `now` in tests to pin time.
 *
 * @param {DateTime} [now]
 * @returns {DateTime}
 */
export const riyadhNow = (now) =>
  (now ?? DateTime.now()).setZone(RIYADH_TZ);
