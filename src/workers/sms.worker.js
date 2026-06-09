import { Worker } from "bullmq";
import { redisConnectionConfig } from "../lib/redis.js";
import { sendSMS } from "../services/sms.service.js";
import { prisma } from "../lib/prisma.js";
import { logger } from "../utils/winston.js";
import { dispatchAllReminders } from "../application/notification/dispatchReminders.usecase.js";
import { updateNotificationStatus } from "../services/notification.service.js";

const SMS_CONCURRENCY = parseInt(process.env.SMS_WORKER_CONCURRENCY ?? "3", 10);



export const smsWorker = new Worker(
  "sms-queue",
  async (job) => {
    const { message, numbers, sender, notificationId } = job.data;
    logger.info(`Processing SMS job ${job.id} for numbers: ${numbers}`);

    const result = await sendSMS(message, numbers, sender);

    logger.info(`Successfully sent SMS job ${job.id}`);
    await updateNotificationStatus(notificationId, "sent", job.id);
    return result;
  },
  {
    connection: { ...redisConnectionConfig, maxRetriesPerRequest: null },
    concurrency: SMS_CONCURRENCY,
  },
);

smsWorker.on("error", (err) => {
  logger.error(`[sms-worker] worker error: ${err.message}`);
});

smsWorker.on("completed", (job) => {
  logger.info(`SMS Job ${job.id} has completed!`);
});

smsWorker.on("failed", async (job, err) => {
  logger.error(`SMS Job ${job.id} has failed with error: ${err.message}`);
  if (job.attemptsMade >= (job.opts?.attempts ?? 1)) {
    await updateNotificationStatus(job.data?.notificationId, "failed", job.id);
  }
});

export const dispatchWorker = new Worker(
  "dispatch-queue",
  async (job) => {
    logger.info(`[dispatch-worker] Processing job ${job.id} (${job.name}).`);
    const result = await dispatchAllReminders();
    logger.info(`[dispatch-worker] Job ${job.id} completed with result: ${JSON.stringify(result)}.`);
    return result;
  },
  {
    connection: { ...redisConnectionConfig, maxRetriesPerRequest: null },
    concurrency: 1,
  },
);

dispatchWorker.on("error", (err) => {
  logger.error(`[dispatch-worker] worker error: ${err.message}`);
});

dispatchWorker.on("completed", (job) => {
  logger.info(`[dispatch-worker] Job ${job.id} has completed.`);
});

dispatchWorker.on("failed", async (job, err) => {
  logger.error(`[dispatch-worker] Job ${job?.id} failed with error: ${err.message}`);
});

export const closeWorkers = async () => {
  await Promise.all([smsWorker.close(), dispatchWorker.close()]);
};
