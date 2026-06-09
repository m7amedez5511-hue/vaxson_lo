import "dotenv/config";
import { closeWorkers } from "./workers/sms.worker.js";
import "./cron.js";
import { registerGracefulShutdown } from "./lib/lifecycle.js";
import { logger } from "./utils/winston.js";

registerGracefulShutdown("worker", {
  onShutdown: closeWorkers,
});

console.log("[Worker] SMS worker is running.");
