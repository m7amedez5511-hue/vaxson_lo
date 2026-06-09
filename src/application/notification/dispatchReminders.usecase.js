import { queueSmsBulk } from "../../services/sms-queue.service.js";
import { reEnqueueOrphanedNotifications } from "../../services/notification.service.js";
import { dispatchDriverReminders } from "./driverReminders.usecase.js";
import { dispatchCarReminders } from "./carReminders.usecase.js";
import { dispatchMaintenanceReminders } from "./maintenanceReminders.usecase.js";

// Insert-before-enqueue: Notification row written first; unique constraint
// deduplicates across instances and restarts.
export const dispatchAllReminders = async () => {
  //console.log("[dispatch] dispatchAllReminders started.");

  const requeued = await reEnqueueOrphanedNotifications();
  //console.log(`[dispatch] reEnqueueOrphanedNotifications returned ${requeued}.`);

  // Run sequentially so peak DB concurrency stays within the shared dbLimit cap.
  const driverSms = await dispatchDriverReminders();
  const carSms = await dispatchCarReminders();
  const maintSms = await dispatchMaintenanceReminders();

  //console.log(`[dispatch] dispatchDriverReminders returned ${driverSms.length} payload(s).`);
  //console.log(`[dispatch] dispatchCarReminders returned ${carSms.length} payload(s).`);
  //console.log(`[dispatch] dispatchMaintenanceReminders returned ${maintSms.length} payload(s).`);

  const allSms = [...driverSms, ...carSms, ...maintSms];
  //console.log(`[dispatch] Total SMS payloads from reminders: ${allSms.length}.`);

  const queued = await queueSmsBulk(allSms);
  //console.log(`[dispatch] queueSmsBulk enqueued ${queued} SMS job(s).`);

  //console.log(`[dispatch] Done. SMS queued: ${queued}.`);
  return { queued };
};
