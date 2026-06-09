/**
 * Driver Report HTML Formatters
 * Encapsulates HTML fragment generation to keep services clean.
 */

const STATUS_MAP = {
  Delivered: "تم التوصيل",
  Returned: "مرتجع",
  InTransit: "جاري التسليم",
  Assigned: "معيّن",
  Created: "جديد",
  Cancelled: "ملغي",
};

export const formatTripStatus = (status) => STATUS_MAP[status] ?? status ?? "—";

export const formatTripRow = (index, trip) => {
  const rowBg = index % 2 === 0 ? "#fff" : "#f7f7f7";

  return `
    <tr style="background:${rowBg}">
      <td style="color:#999">${index + 1}</td>
      <td style="font-weight:600;font-size:11px;color:#333">${trip.tripNumber ?? "—"}</td>
      <td>
        <span style="display:inline-block;border:1.5px solid #ccc;border-radius:4px;
                     padding:2px 10px;font-size:11px;font-weight:700;">
          ${trip.plate ?? "—"}
        </span>
      </td>
      <td><strong>${trip.totalOrders ?? 0}</strong></td>
      <td><strong>${trip.totalDelivered ?? 0}</strong></td>
      <td><strong>${trip.totalNotDelivered ?? 0}</strong></td>
      <td>
        <span style="display:inline-block;border:1.5px solid #ccc;border-radius:20px;
                     padding:3px 12px;font-size:11px;font-weight:700;color:#333;">
          ${formatTripStatus(trip.tripStatus)}
        </span>
      </td>
    </tr>
  `;
};

export const formatEmptyRow = () => `
  <tr>
    <td colspan="7" style="text-align:center;color:#aaa;padding:40px">
      لا توجد بيانات
    </td>
  </tr>
`;

export const formatReportDate = (dateStr) => (dateStr ?? "").replace(/-/g, "/");

export const formatGeneratedAt = () =>
  new Date().toLocaleString("ar-EG", {
    timeZone: "Asia/Riyadh",
    year:     "numeric",
    month:    "2-digit",
    day:      "2-digit",
    hour:     "2-digit",
    minute:   "2-digit",
  });
