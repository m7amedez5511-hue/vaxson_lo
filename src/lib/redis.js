// BullMQ requires an ioredis-compatible connection. We pass an options object
// (URL form) so BullMQ creates and manages its own ioredis clients — including
// the dedicated blocking client a Worker needs.
export const redisConnectionConfig = {
  url: process.env.REDIS_URL || "redis://redis:6379",
};
