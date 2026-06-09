import collectPayloads from "./collectPayloads.js";
import { carInsuranceMsg, carRegistrationMsg } from "../../views/notification/messages/messages.js";
import { findCarsForExpiry } from "../../services/car.service.js";
import { NotificationEntityType, NotificationDocType, NotificationKind } from "@prisma/client";
import { postExpiryWindow, preExpiryWindow } from "../../utils/notifaction-windows.js";
import { ALERT_MONTHS, ELIGIBLE_CAR_STATUSES, POST_EXPIRY_DAYS } from "../../utils/notifaction-policy.js";

export const dispatchCarReminders = async () => {
  const pre  = preExpiryWindow(ALERT_MONTHS);
  const post = postExpiryWindow(POST_EXPIRY_DAYS);
  const cars = await findCarsForExpiry({ pre, post, statuses: ELIGIBLE_CAR_STATUSES });

  // Cars have no phone — Notification rows written for audit only, no SMS dispatched.
  for (const [window, kind] of [
    [pre,  NotificationKind.PRE_EXPIRY],
    [post, NotificationKind.POST_EXPIRY],
  ]) {
    await collectPayloads({
      entities:    cars,
      expiryField: "insuranceExpiryDate",
      entityType:  NotificationEntityType.CAR,
      docType:     NotificationDocType.INSURANCE,
      kind,
      window,
      msgFn:       (c, exp) => carInsuranceMsg(c.plateNumber, exp, kind),
      getId:       (c) => c.id,
      getPhone:    () => null,
      getFKField:  "carId",
    });
    await collectPayloads({
      entities:    cars,
      expiryField: "registrationExpiryDate",
      entityType:  NotificationEntityType.CAR,
      docType:     NotificationDocType.REGISTRATION,
      kind,
      window,
      msgFn:       (c, exp) => carRegistrationMsg(c.plateNumber, exp, kind),
      getId:       (c) => c.id,
      getPhone:    () => null,
      getFKField:  "carId",
    });
  }

  return [];
};


export default dispatchCarReminders;
