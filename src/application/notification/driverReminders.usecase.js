import collectPayloads from "./collectPayloads.js";
import { driverIdentityMsg, driverLicenseMsg } from "../../views/notification/messages/messages.js";
import { findDriversForExpiry } from "../../services/driver.service.js";
import { NotificationEntityType, NotificationDocType, NotificationKind } from "@prisma/client";
import { postExpiryWindow, preExpiryWindow } from "../../utils/notifaction-windows.js";
import { ALERT_MONTHS, ELIGIBLE_DRIVER_STATUSES, POST_EXPIRY_DAYS } from "../../utils/notifaction-policy.js";

export const dispatchDriverReminders = async () => {
  const pre  = preExpiryWindow(ALERT_MONTHS);
  const post = postExpiryWindow(POST_EXPIRY_DAYS);
  const drivers = await findDriversForExpiry({ pre, post, statuses: ELIGIBLE_DRIVER_STATUSES });

  // Skip drivers without a reachable phone — a Notification row with no SMS would
  // be stuck 'queued' and block the unique key from firing on future runs.
  const reachableDrivers = drivers.filter((d) => d.phone && d.phone.trim().length > 0);

  const smsPayloads = [];

  for (const [window, kind] of [
    [pre,  NotificationKind.PRE_EXPIRY],
    [post, NotificationKind.POST_EXPIRY],
  ]) {
    const identityPayloads = await collectPayloads({
      entities:    reachableDrivers,
      expiryField: "nationalIdExpiry",
      entityType:  NotificationEntityType.DRIVER,
      docType:     NotificationDocType.NATIONAL_ID,
      kind,
      window,
      msgFn:       (d, exp) => driverIdentityMsg(d.name, exp, kind),
      getId:       (d) => d.id,
      getPhone:    (d) => d.phone,
      getFKField:  "driverId",
    });
    const licensePayloads = await collectPayloads({
      entities:    reachableDrivers,
      expiryField: "licenseExpiry",
      entityType:  NotificationEntityType.DRIVER,
      docType:     NotificationDocType.LICENSE,
      kind,
      window,
      msgFn:       (d, exp) => driverLicenseMsg(d.name, exp, kind),
      getId:       (d) => d.id,
      getPhone:    (d) => d.phone,
      getFKField:  "driverId",
    });
    smsPayloads.push(...identityPayloads, ...licensePayloads);
  }

  return smsPayloads;
};

export default dispatchDriverReminders;
