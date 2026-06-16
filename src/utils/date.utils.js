// Saudi Arabia timezone
export const SAUDI_TZ = "Asia/Riyadh";

// Returns the current date-time string in Saudi Arabian time (UTC+3)
// Use this for display/logging only — not for arithmetic with Date objects
export const getSaudiTime = () => {
  return new Date().toLocaleString("en-GB", { timeZone: SAUDI_TZ });
};

// Formats a date to Saudi Arabian standard string (Gregorian)
export const formatSaudiDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleString("en-GB", { timeZone: "Asia/Riyadh" });
};