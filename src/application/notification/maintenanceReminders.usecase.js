import { maintStartMsg, maintEndMsg, maintDueTodayMsg } from "../../views/notification/messages/messages.js";
import { findMaintenanceForWindows } from "../../services/car-maintenance.service.js";
import { insertNotification } from "../../services/notification.service.js";
import { NotificationEntityType, NotificationDocType, NotificationKind } from "@prisma/client";
import { ELIGIBLE_CAR_STATUSES, MAINT_ALERT_DAYS } from "../../utils/notifaction-policy.js";
import { maintDueWindow, maintPreWindow } from "../../utils/notifaction-windows.js";
import { dbLimit } from "../../lib/db-concurrency.js";

export const dispatchMaintenanceReminders = async () => {
  const preWin = maintPreWindow(MAINT_ALERT_DAYS);
  const dueWin = maintDueWindow();

  const rows = await findMaintenanceForWindows({ preWin, dueWin, statuses: ELIGIBLE_CAR_STATUSES });

  const tasks = [];

  for (const row of rows) {
    const plate = row.car?.plateNumber ?? row.carId;

    if (row.startAt && row.startAt >= preWin.from && row.startAt <= preWin.to) {
      const msg = maintStartMsg(plate, row.startAt);
      tasks.push(
        dbLimit(async () => {
          const result = await insertNotification({
            entityType: NotificationEntityType.MAINTENANCE,
            docType: NotificationDocType.MAINT_START,
            kind: NotificationKind.MAINT_PRE,
            targetDate: preWin.targetDate,
            phone: null,
            message: msg,
            maintenanceId: row.id,
          });
          if (result) console.log(`[maintenance-start] ${msg}`);
        }),
      );
    }

    if (row.endAt && row.endAt >= preWin.from && row.endAt <= preWin.to) {
      const msg = maintEndMsg(plate, row.endAt);
      tasks.push(
        dbLimit(async () => {
          const result = await insertNotification({
            entityType: NotificationEntityType.MAINTENANCE,
            docType: NotificationDocType.MAINT_END,
            kind: NotificationKind.MAINT_PRE,
            targetDate: preWin.targetDate,
            phone: null,
            message: msg,
            maintenanceId: row.id,
          });
          if (result) console.log(`[maintenance-end] ${msg}`);
        }),
      );
    }

    if (row.endAt && row.endAt >= dueWin.from && row.endAt <= dueWin.to) {
      const msg = maintDueTodayMsg(plate, row.endAt);
      tasks.push(
        dbLimit(async () => {
          const result = await insertNotification({
            entityType: NotificationEntityType.MAINTENANCE,
            docType: NotificationDocType.MAINT_DUE,
            kind: NotificationKind.MAINT_DUE,
            targetDate: dueWin.targetDate,
            phone: null,
            message: msg,
            maintenanceId: row.id,
          });
          if (result) console.log(`[maintenance-due-today] ${msg}`);
        }),
      );
    }
  }

  await Promise.all(tasks);
  return [];
};

export default dispatchMaintenanceReminders;
