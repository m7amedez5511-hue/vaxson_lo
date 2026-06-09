import { dbLimit } from "../../lib/db-concurrency.js";
import { insertNotification } from "../../services/notification.service.js";

export const collectPayloads = async ({
  entities,
  expiryField,
  entityType,
  docType,
  kind,
  window,
  msgFn,
  getId,
  getPhone,
  getFKField,
}) => {
  const candidates = entities.filter((entity) => {
    const expiryDate = entity[expiryField];
    return expiryDate && expiryDate >= window.from && expiryDate <= window.to;
  });

  const insertPromises = candidates.map((entity) =>
    dbLimit(async () => {
      const expiryDate = entity[expiryField];
      const message = msgFn(entity, expiryDate, kind);

      const result = await insertNotification({
        entityType,
        docType,
        kind,
        targetDate: window.targetDate,
        phone: getPhone(entity),
        message,
        [getFKField]: getId(entity),
      });

      if (result) {
        //console.log(`[${entityType}-${docType}-${kind}] ${message}`);
        return { phone: result.phone, message: result.message, notificationId: result.id };
      }

      return null;
    }),
  );

  const results = await Promise.all(insertPromises);
  return results.filter(Boolean);
};

export default collectPayloads;
