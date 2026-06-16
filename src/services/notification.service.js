import { orphanedDriverReenqueueMsg } from "../views/notification/messages/messages.js";
import { prisma } from "../lib/prisma.js";
import { createAppError } from "../utils/createAppError.js";
import { queueSmsBulk } from "./sms-queue.service.js";
import { Logger } from "winston";

const FLEET_MANAGER_PHONE = process.env.FLEET_MANAGER_PHONE ?? null;

export const insertNotification = async ({
  entityType,
  docType,
  kind,
  targetDate,
  phone,
  message,
  driverId = null,
  carId = null,
  maintenanceId = null,
}) => {
  try {
    const resolvedPhone = phone ?? FLEET_MANAGER_PHONE;
    const status = resolvedPhone ? "queued" : "sent";

    const notif = await prisma.notification.create({
      data: {
        entityType,
        docType,
        kind,
        targetDate,
        driverId,
        carId,
        maintenanceId,
        status,
      },
      select: { id: true },
    });
    return { id: notif.id, phone: resolvedPhone, message };
  } catch (err) {
    if (err.code === "P2002") return null;
    throw err;
  }
};

export const reEnqueueOrphanedNotifications = async () => {
  const cutoff = new Date(Date.now() - 10 * 60 * 1000);

  const orphans = await prisma.notification.findMany({
    where: {
      status: "queued",
      smsJobId: null,
      createdAt: { lt: cutoff },
    },
    include: {
      driver: { select: { phone: true, name: true } },
    },
  });

  if (orphans.length === 0) return 0;

  const getOrphanPhone = (n) => n.driver?.phone ?? FLEET_MANAGER_PHONE;

  const requeueCandidates = orphans.filter(
    (n) => (n.requeueCount ?? 0) < 3 && getOrphanPhone(n),
  );
  const immediateFailures = orphans.filter(
    (n) => (n.requeueCount ?? 0) >= 3 || !getOrphanPhone(n),
  );

  const payloads = requeueCandidates.map((n) => ({
    phone: getOrphanPhone(n),
    message: orphanedDriverReenqueueMsg(n.driver?.name, n.docType, n.kind),
    notificationId: n.id,
  }));

  let reQueued = 0;
  try {
    if (payloads.length > 0) {
      const ids = requeueCandidates.map((n) => n.id);

      await prisma.$transaction(async (tx) => {
        reQueued = await queueSmsBulk(payloads);

        await tx.notification.updateMany({
          where: { id: { in: ids } },
          data: { requeueCount: { increment: 1 } },
        });

        await tx.notification.updateMany({
          where: { id: { in: ids }, requeueCount: { gte: 3 } },
          data: { status: "failed" },
        });
      });
    }

    const failIds = immediateFailures.map((n) => n.id);
    if (failIds.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: failIds } },
        data: { status: "failed" },
      });
    }
  } catch (err) {
    throw createAppError(
      500,
      `notification_reenqueue_failed: ${err?.message || err}`,
    );
  }

  //console.warn(`[dispatch] Re-queued ${reQueued} orphaned SMS job(s).`);
  return reQueued;
};

//updarte notification status to sent or failed based on sms worker result
export const updateNotificationStatus = async (notificationId, status, smsJobId) => {
  if (!notificationId) return;
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { status, smsJobId },
    });
  } catch (err) {
    Logger.error(`[sms-worker] Failed to update notification ${notificationId} status: ${err.message}`);
  }
};