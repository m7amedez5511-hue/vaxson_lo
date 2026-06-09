import pLimit from "p-limit";

/** Shared limiter for all notification / cron DB writes (one pool, one cap). */
const DB_CONCURRENCY = parseInt(process.env.DB_CONCURRENCY ?? "5", 10);

export const dbLimit = pLimit(DB_CONCURRENCY);
