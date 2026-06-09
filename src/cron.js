import "dotenv/config";
import cron from "node-cron";
import { enqueueAllJobs } from "./jobs/orchestrator.job.js";
import { withPgAdvisoryLock } from "./jobs/pg-lock.js";

const TIMEZONE = "Asia/Riyadh";

let startupRunScheduled = false;
let cronRunInFlight = false;

const runExpiringServicesJob = async () => {
  if (cronRunInFlight) {
    console.log("[Cron] Previous run still in progress, skipping.");
    return;
  }

  cronRunInFlight = true;
  try {
    await withPgAdvisoryLock("cron:expiring-services", enqueueAllJobs);
  } catch (error) {
    console.error("[Cron] Fatal error in expiring services job:", error.message);
  } finally {
    cronRunInFlight = false;
  }
};

const scheduleStartupCatchUp = () => {
  if (startupRunScheduled) return;
  startupRunScheduled = true;

  if (process.env.CRON_RUN_ON_STARTUP === "false") {
    console.log("[Cron] Startup catch-up disabled (CRON_RUN_ON_STARTUP=false).");
    return;
  }

  const delayMs = parseInt(process.env.CRON_STARTUP_DELAY_MS ?? "45000", 10);
  const jitterMs = Math.floor(Math.random() * 15_000);

  setTimeout(() => {
    console.log(`[Cron] Running deferred startup catch-up (${delayMs + jitterMs}ms after boot).`);
    runExpiringServicesJob();
  }, delayMs + jitterMs);
};

scheduleStartupCatchUp();

cron.schedule("0 6 * * *", runExpiringServicesJob, { timezone: TIMEZONE });

console.log("[Cron] Expiring services cron is running.");
