import { prisma } from "../lib/prisma.js";
import { formatSaudiDate } from "../utils/date.utils.js";

// Fetch general counts for the dashboard
const getStatsCounts = async () => {
  const [clients, orders, trips, cars, drivers] = await Promise.all([
    prisma.client.count({ where: { isDeleted: false } }),
    prisma.order.count({ where: { isDeleted: false } }),
    prisma.trip.count({ where: { isDeleted: false } }),
    prisma.car.count({ where: { isDeleted: false } }),
    prisma.driver.count({ where: { isDeleted: false } }),
  ]);
  return { clients, orders, trips, cars, drivers };
};

// Fetch alerts for items expiring within a date range
const getDashboardAlerts = async (now, limitDate) => {
  const [expiringCarsRaw, expiringDriversRaw, upcomingMaintRaw] = await Promise.all([
    prisma.car.findMany({
      where: {
        isDeleted: false,
        OR: [
          { insuranceExpiryDate: { gte: now, lte: limitDate } },
          { registrationExpiryDate: { gte: now, lte: limitDate } }
        ]
      },
      select: { id: true, plateNumber: true, plateLetters: true, insuranceExpiryDate: true, registrationExpiryDate: true },
      take: 5,
      orderBy: { insuranceExpiryDate: "asc" }
    }),
    prisma.driver.findMany({
      where: {
        isDeleted: false,
        OR: [
          { licenseExpiry: { gte: now, lte: limitDate } },
          { nationalIdExpiry: { gte: now, lte: limitDate } }
        ]
      },
      select: { id: true, name: true, licenseExpiry: true, nationalIdExpiry: true },
      take: 5,
      orderBy: { licenseExpiry: "asc" }
    }),
    prisma.carMaintenanceHistory.findMany({
      where: { isDeleted: false, startAt: { gte: now, lte: limitDate } },
      include: { car: { select: { plateNumber: true, plateLetters: true } } },
      take: 5,
      orderBy: { startAt: "asc" }
    })
  ]);

  // Helper to calculate days remaining
  const getDaysDiff = (target) => {
    if (!target) return null;
    return Math.ceil((new Date(target) - now) / (1000 * 60 * 60 * 24));
  };

  // Map to include user-friendly messages
  const expiringCars = expiringCarsRaw.map(car => {
    const insDays = getDaysDiff(car.insuranceExpiryDate);
    const regDays = getDaysDiff(car.registrationExpiryDate);
    let message = "";
    if (insDays !== null && insDays <= 90) message = `تأمين السيارة ينتهي خلال ${insDays} يوم`;
    else if (regDays !== null && regDays <= 90) message = `استمارة السيارة تنتهي خلال ${regDays} يوم`;
    
    return { ...car, message };
  });

  const expiringDrivers = expiringDriversRaw.map(driver => {
    const licDays = getDaysDiff(driver.licenseExpiry);
    const idDays = getDaysDiff(driver.nationalIdExpiry);
    let message = "";
    if (licDays !== null && licDays <= 90) message = `رخصة السائق تنتهي خلال ${licDays} يوم`;
    else if (idDays !== null && idDays <= 90) message = `هوية السائق تنتهي خلال ${idDays} يوم`;
    
    return { ...driver, message };
  });

  const upcomingMaint = upcomingMaintRaw.map(maint => {
    const days = getDaysDiff(maint.startAt);
    return {
      ...maint,
      message: `صيانة مجدولة تبدأ خلال ${days} يوم (${maint.reason})`
    };
  });

  return { expiringCars, expiringDrivers, upcomingMaint };
};

// Fetch progress of active trips
const getActiveTripsProgress = async () => {
  const activeTripsRaw = await prisma.trip.findMany({
    where: { status: "InProgress", isDeleted: false },
    select: {
      id: true,
      tripNumber: true,
      title: true,
      orders: {
        where: { isDeleted: false },
        select: { currentStatus: true }
      }
    },
    take: 10
  });

  return activeTripsRaw.map(trip => {
    const total = trip.orders.length;
    const delivered = trip.orders.filter(o => o.currentStatus === "Delivered").length;
    return {
      id: trip.id,
      tripNumber: trip.tripNumber,
      title: trip.title,
      progress: total > 0 ? Math.round((delivered / total) * 100) : 0
    };
  });
};

// Fetch last login security info
const getLastLogin = async (userId) => {
  const log = await prisma.activityLog.findFirst({
    where: { userId, action: "LOGIN_SUCCESS" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, requestMeta: true }
  });

  return {
    lastLogin: formatSaudiDate(log?.createdAt),
    requestMeta: log?.requestMeta || null
  };
};

// Main function to orchestrate dashboard summary
export const getDashboardSummary = async (userId) => {
  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime());
  ninetyDaysFromNow.setDate(now.getDate() + 90);

  const [stats, alerts, activeTrips, accountSecurity] = await Promise.all([
    getStatsCounts(),
    getDashboardAlerts(now, ninetyDaysFromNow),
    getActiveTripsProgress(),
    getLastLogin(userId)
  ]);

  return { stats, alerts, activeTrips, accountSecurity };
};