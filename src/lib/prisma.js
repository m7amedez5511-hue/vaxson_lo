import "dotenv/config";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  max: parseInt(process.env.PG_POOL_MAX ?? "10", 10),
  idleTimeoutMillis: parseInt(process.env.PG_POOL_IDLE_MS ?? "30000", 10),
  connectionTimeoutMillis: parseInt(process.env.PG_POOL_CONNECT_MS ?? "5000", 10),
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const disconnectPrisma = async () => {
  await prisma.$disconnect();
  await pool.end();
};
