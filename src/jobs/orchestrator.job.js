import { dispatchQueue } from "../queues/sms.queue.js";

/** One dispatch job per calendar day (Asia/Riyadh date in job id). */
const dailyDispatchJobId = () => {
  const riyadhDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return `dispatch-reminders-${riyadhDate}`;
};

export const enqueueAllJobs = async () => {
  const job = await dispatchQueue.add(
    "dispatchAllReminders",
    { source: "cron", enqueuedAt: new Date().toISOString() },
    {
      jobId: dailyDispatchJobId(),
      removeOnComplete: true,
      removeOnFail: { age: 604_800 },
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 10000,
      },
    },
  );

  return job;
};
