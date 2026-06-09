import { Queue } from "bullmq";
import { redisConnectionConfig } from "../lib/redis.js";

export const smsQueue = new Queue("sms-queue", {
  connection: redisConnectionConfig,
});

export const dispatchQueue = new Queue("dispatch-queue", {
  connection: redisConnectionConfig,
});

export const closeQueues = async () => {
  await Promise.all([smsQueue.close(), dispatchQueue.close()]);
};
