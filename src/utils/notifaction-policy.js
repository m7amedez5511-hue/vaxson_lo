import { DriverStatus, CarStatus } from "@prisma/client";

// Suspended and Inactive drivers excluded — reminders only for operationally active drivers.
export const ELIGIBLE_DRIVER_STATUSES = [DriverStatus.Active, DriverStatus.InTrip]
  .filter((s) => typeof s === "string");

// Inactive cars excluded — no operational risk from a non-deployed vehicle.
export const ELIGIBLE_CAR_STATUSES = [CarStatus.Active, CarStatus.InMaintenance, CarStatus.InTrip]
  .filter((s) => typeof s === "string");

export const ALERT_MONTHS = parseInt(process.env.ALERT_MONTHS) || 3;
export const POST_EXPIRY_DAYS = parseInt(process.env.POST_EXPIRY_DAYS) || 45;
export const MAINT_ALERT_DAYS = parseInt(process.env.MAINT_ALERT_DAYS) || 7;
