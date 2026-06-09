import { prisma } from "../lib/prisma.js";

const hashLockKey = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

export const withPgAdvisoryLock = async (lockName, fn) => {
  const lockKey = hashLockKey(lockName);
  const rows = await prisma.$queryRawUnsafe(`SELECT pg_try_advisory_lock(${lockKey}) AS locked`);
  const locked = Array.isArray(rows) && rows[0]?.locked === true;

  if (!locked) {
    //console.log(`[lock] "${lockName}" is already running on another instance, skipping.`);
    return null;
  }

  try {
    return await fn();
  } finally {
    await prisma.$executeRawUnsafe(`SELECT pg_advisory_unlock(${lockKey})`);
  }
};
