import { prisma }        from "../lib/prisma.js";
import { createAppError } from "../utils/createAppError.js";
import { getFileUrl }     from "../utils/getFileUrl.js";
import fs                 from "fs/promises";
import path               from "path";
import {
  formatTripRow,
  formatEmptyRow,
  formatReportDate,
  formatGeneratedAt,
} from "../views/reports/driver-manifest/driver-formatter.js";

// ─── Generate Driver Daily HTML Report ────────────────────────────────────────
export const generateDriverDailyReport = async (req, driverId, date) => {
  // 1. Date range
  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay   = new Date(`${date}T23:59:59.999Z`);

  // 2. Verify driver
  const driver = await prisma.driver.findFirst({
    where:  { id: driverId, isDeleted: false },
    select: { id: true, name: true, branch: { select: { name: true } } },
  });
  if (!driver) throw createAppError(404, "Driver not found");

  // 3. Fetch trips + orders
  const tripsRaw = await prisma.trip.findMany({
    where: {
      driverId,
      isDeleted: false,
      startTime: { gte: startOfDay, lte: endOfDay },
    },
    select: {
      tripNumber: true,
      status:     true,
      car: { select: { plateNumber: true, plateLetters: true } },
      orders: {
        where:  { isDeleted: false },
        select: { shipmentNumber: true, currentStatus: true },
      },
    },
    orderBy: { startTime: "asc" },
  });

  // 4. Aggregate stats
  const allOrders      = tripsRaw.flatMap((t) => t.orders);
  const totalTrips     = tripsRaw.length;
  const totalOrders    = allOrders.length;
  const totalDelivered = allOrders.filter((o) => o.currentStatus === "Delivered").length;
  const totalReturned  = allOrders.filter((o) => o.currentStatus === "Returned").length;

  // 5. Build per-trip rows
  const trips = tripsRaw.map((trip) => ({
    tripNumber:        trip.tripNumber,
    plate:             `${trip.car?.plateLetters ?? ""} ${trip.car?.plateNumber ?? ""}`.trim(),
    totalOrders:       trip.orders.length,
    totalDelivered:    trip.orders.filter((o) => o.currentStatus === "Delivered").length,
    totalNotDelivered: trip.orders.filter((o) => o.currentStatus !== "Delivered").length,
    tripStatus:        trip.status ?? "InTransit",
  }));

  // 6. Read HTML template
  const templatePath = path.join(
    process.cwd(), "src", "views", "reports", "driver-manifest", "driver-report.html"
  );
  let template = await fs.readFile(templatePath, "utf-8");

  // 7. Generate rows HTML
  const rowsHtml = trips.length > 0
    ? trips.map((trip, idx) => formatTripRow(idx, trip)).join("")
    : formatEmptyRow();

  // 8. Replace placeholders
  const replacements = {
    "{{branchName}}":    driver.branch?.name ?? "—",
    "{{driverName}}":    driver.name,
    "{{reportDate}}":    formatReportDate(date),
    "{{generatedAt}}":   formatGeneratedAt(),
    "{{totalOrders}}":   totalOrders.toString(),
    "{{totalTrips}}":    totalTrips.toString(),
    "{{totalDelivered}}": totalDelivered.toString(),
    "{{totalReturned}}": totalReturned.toString(),
    "{{rows}}":          rowsHtml,
  };

  Object.entries(replacements).forEach(([key, value]) => {
    template = template.replaceAll(key, value);
  });

  // 9. Save file to disk
  const filename  = `driver-report-${driverId}-${date}-${Date.now()}.html`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "driver-reports");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), template, "utf8");

  // 10. Return URL via shared utility
  return { reportUrl: getFileUrl(req, "driver-reports", filename), filename };
};