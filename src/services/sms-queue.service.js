import { smsQueue } from "../queues/sms.queue.js";

const SMS_SENDER = process.env.SMS_SENDER;
const SMS_ENABLED = process.env.SMS_NOTIFICATIONS_ENABLED === "true";

const SMS_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: "exponential", delay: 30_000 },
  removeOnComplete: { age: 86_400 },
  removeOnFail: { age: 604_800 },
};

/** Enqueue a single SMS via BullMQ (no direct DB access). */
export const queueSms = async ({ phone, message, notificationId }) => {
  if (!SMS_ENABLED || !SMS_SENDER || !phone) return false;

  await smsQueue.add(
    "expiry-reminder",
    { message, numbers: [phone], sender: SMS_SENDER, notificationId },
    SMS_JOB_OPTIONS,
  );
  return true;
};

/**
 * Enqueue multiple SMS jobs in one BullMQ addBulk call.
 * @returns {Promise<number>} count of jobs enqueued
 */
export const queueSmsBulk = async (messages) => {
  if (!SMS_ENABLED || !SMS_SENDER) return 0;

  const valid = messages.filter((m) => m.phone);
  if (valid.length === 0) return 0;

  await smsQueue.addBulk(
    valid.map(({ phone, message, notificationId }) => ({
      name: "expiry-reminder",
      data: { message, numbers: [phone], sender: SMS_SENDER, notificationId },
      opts: SMS_JOB_OPTIONS,
    })),
  );
  return valid.length;
};
