// Saudi Arabia standard timezone offset (UTC+3)

export const SAUDI_OFFSET = 3 * 60 * 60 * 1000;

// Returns a new Date object adjusted to Saudi Arabian time (UTC+3)
export const getSaudiTime = () => {
  const nowUtc = new Date();
  return new Date(nowUtc.getTime() + SAUDI_OFFSET);
};

// Formats a date to Saudi Arabian standard string (Gregorian)
export const formatSaudiDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleString("en-GB", { timeZone: "Asia/Riyadh" });
};
