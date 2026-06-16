// BullMQ requires an ioredis-compatible connection. We pass an options object
// (URL form) so BullMQ creates and manages its own ioredis clients — including
// the dedicated blocking client a Worker needs.

const redisUrl = new URL(process.env.REDIS_URL || "redis://redis:6379");

export const redisConnectionConfig = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port) || 6379,
};