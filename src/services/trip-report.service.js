import { prisma } from "../lib/prisma.js";
import { createAppError } from "../utils/createAppError.js";
import { getFileUrl } from "../utils/getFileUrl.js";
import fs from "fs/promises";
import path from "path";
import { tripReportSelect } from "../selectors/trip-report.selector.js";
import { formatOrderRow, formatCarDetails } from "../views/reports/trip-manifest/formatter.js";

// Generate a professional Trip Manifest HTML Report
export const generateTripManifest = async (req, tripId, clientId = null) => {
  // 1. Fetch Trip Data with full relations
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, isDeleted: false },
    select: {
      ...tripReportSelect,
      orders: {
        where: clientId ? { clientId } : undefined,
        select: tripReportSelect.orders.select
      }
    },
  });

  if (!trip) throw createAppError(404, "Trip not found");

  // 2. Extract Client Name if clientId is provided
  let clientNameHtml = "";
  if (clientId && trip.orders.length > 0 && trip.orders[0].client) {
    const cName = trip.orders[0].client.name;
    clientNameHtml = `<div class="info-row"><span class="info-label">العميل:</span> <span class="info-value">${cName}</span></div>`;
  }

  const ordersToProcess = trip.orders;

  // 3. Read the HTML template
  const templatePath = path.join(process.cwd(), "src", "views", "reports", "trip-manifest", "index.html");
  let template = await fs.readFile(templatePath, "utf-8");

  // 4. Process dates and basic info
  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-SA');
  
  const startTime = new Date(trip.startTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  const endTime = trip.endTime ? new Date(trip.endTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '---';

  // Calculate stats
  let totalOrders, delivered, returned, inProgress;

  if (clientId) {
    // For specific client, we calculate from filtered orders
    totalOrders = ordersToProcess.length;
    delivered = ordersToProcess.filter(o => o.currentStatus === 'Delivered').length;
    returned = ordersToProcess.filter(o => o.currentStatus === 'Returned' || o.currentStatus === 'Cancelled').length;
    inProgress = totalOrders - delivered - returned;
  } else {
    // For full trip, use pre-calculated DB fields (Best Practice)
    totalOrders = trip.collectedCount || 0;
    delivered = trip.deliveredCount || 0;
    returned = trip.returnedCount || 0;
    inProgress = totalOrders - delivered - returned;
  }

  // 3. Generate HTML Content from Template
  let rowsHtml = "";

  ordersToProcess.forEach((order, index) => {
    const isDelivered = order.currentStatus === 'Delivered';
    const isReturned = order.currentStatus === 'Returned' || order.currentStatus === 'Cancelled';
    const isInProgress = !isDelivered && !isReturned;

    // (Counts are now handled above)

    // Retrieve the most recent reason only for returned/cancelled orders
    let reason = "";
    if (isReturned) {
      if (order.statusHistory && order.statusHistory.length > 0) {
        const sortedHistory = [...order.statusHistory].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const latestStatusWithReason = sortedHistory.find(s => s.reason);
        if (latestStatusWithReason) reason = latestStatusWithReason.reason;
      }
      if (!reason) reason = "مرتجع / ملغي";
    }

    rowsHtml += formatOrderRow(index, order.shipmentNumber, { reason, isDelivered, isReturned, isInProgress });
  });

  const carDetails = formatCarDetails(trip.car);

  // Replace placeholders
  const replacements = {
    "{{tripNumber}}": trip.tripNumber,
    "{{branchName}}": trip.branch?.name || '---',
    "{{clientNameHtml}}": clientNameHtml,
    "{{driverName}}": trip.driver?.name || '---',
    "{{startTime}}": startTime,
    "{{endTime}}": endTime,
    "{{date}}": dateStr,
    "{{carDetails}}": carDetails,
    "{{totalOrders}}": totalOrders.toString(),
    "{{delivered}}": delivered.toString(),
    "{{returned}}": returned.toString(),
    "{{inProgress}}": inProgress.toString(),
    "{{rows}}": rowsHtml,
    "{{notes}}": trip.notes || ""
  };

  Object.entries(replacements).forEach(([key, value]) => {
    template = template.replaceAll(key, value);
  });

  // 4. Save File to Disk
  const filename = `trip-manifest-${trip.tripNumber}-${Date.now()}.html`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "trip-reports");
  
  // Ensure directory exists
  await fs.mkdir(uploadDir, { recursive: true });
  
  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, template, "utf8");

  // 5. Update Trip in Database
  await prisma.trip.update({
    where: { id: tripId },
    data: { reportFile: filename }
  });

  // 6. Return the URL
  return getFileUrl(req, "trip-reports", filename);
};
