import mongoose from "mongoose";
import { disconnectPrisma } from "./prisma.js";
import { closeQueues } from "../queues/sms.queue.js";

let shuttingDown = false;

/**
 * Gracefully release DB pools, Mongo, and BullMQ queue connections.
 * Required on deploy/restart so connections are not left open until idle timeout.
 */
export const shutdown = async (label = "app", server = null) => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`[${label}] Shutting down — closing connections...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  try {
    await closeQueues();
  } catch (err) {
    console.error(`[${label}] BullMQ queue close error:`, err.message);
  }

  try {
    await disconnectPrisma();
  } catch (err) {
    console.error(`[${label}] Prisma disconnect error:`, err.message);
  }

  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
    } catch (err) {
      console.error(`[${label}] MongoDB disconnect error:`, err.message);
    }
  }

  console.log(`[${label}] Shutdown complete.`);
};

export const registerGracefulShutdown = (label, { onShutdown, server } = {}) => {
  const handle = async (signal) => {
    console.log(`[${label}] Received ${signal}.`);
    try {
      if (onShutdown) await onShutdown();
    } catch (err) {
      console.error(`[${label}] Pre-shutdown hook error:`, err.message);
    }
    await shutdown(label, server);
    process.exit(0);
  };

  process.once("SIGTERM", () => handle("SIGTERM"));
  process.once("SIGINT", () => handle("SIGINT"));
};