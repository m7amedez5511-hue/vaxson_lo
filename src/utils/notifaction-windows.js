import { riyadhNow } from "./clock.js";


export const Kind = Object.freeze({
  PRE_EXPIRY:  "PRE_EXPIRY",
  POST_EXPIRY: "POST_EXPIRY",
  MAINT_PRE:   "MAINT_PRE",
  MAINT_DUE:   "MAINT_DUE",
});

// Returns a UTC date range for a single Saudi calendar day `offsetDays` from today.
const dayWindow = (offsetDays, now) => {
  const base = riyadhNow(now).startOf("day").plus({ days: offsetDays });
  return {
    from: base.toUTC().toJSDate(),
    to:   base.endOf("day").toUTC().toJSDate(),
  };
};

// targetDate anchors the dedup key — catch-up runs after a missed cron collide
// on the unique constraint instead of re-sending the same reminder.
const bufferedWindow = (offsetDays, bufferDays, now) => {
  const base = riyadhNow(now).startOf("day").plus({ days: offsetDays });
  return {
    from:       base.toUTC().toJSDate(),
    to:         base.plus({ days: bufferDays - 1 }).endOf("day").toUTC().toJSDate(),
    targetDate: base.toJSDate(),
  };
};

// 7-day buffer: daily cron can miss up to 6 consecutive days without losing the reminder.
export const preExpiryWindow = (months, now) => {
  const base = riyadhNow(now).startOf("day").plus({ months });
  return {
    from:       base.toUTC().toJSDate(),
    to:         base.plus({ days: 6 }).endOf("day").toUTC().toJSDate(),
    targetDate: base.toJSDate(),
  };
};

export const postExpiryWindow = (days, now) => {
  const base = riyadhNow(now).startOf("day").minus({ days });
  return {
    from:       base.toUTC().toJSDate(),
    to:         base.plus({ days: 6 }).endOf("day").toUTC().toJSDate(),
    targetDate: base.toJSDate(),
  };
};

export const maintPreWindow = (days, now) => bufferedWindow(days, 7, now);

// 7-day buffer so a missed cron does not permanently lose the MAINT_DUE reminder.
export const maintDueWindow = (now) => bufferedWindow(0, 7, now);
