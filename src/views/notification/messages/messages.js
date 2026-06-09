import { DateTime } from "luxon";
import { Kind } from "../../../utils/notifaction-windows.js";
import { RIYADH_TZ } from "../../../utils/clock.js";


// Format in Riyadh tz — .toISOString() would show the wrong calendar date for
// timestamps stored near UTC midnight (Saudi midnight is UTC+3).
const fmt = (date) =>
  date
    ? DateTime.fromJSDate(new Date(date)).setZone(RIYADH_TZ).toFormat("yyyy-LL-dd")
    : "N/A";

export const driverIdentityMsg = (driverName, expiryDate, kind) =>
  kind === Kind.POST_EXPIRY
    ? `تنبيه عاجل: هوية السائق ${driverName} انتهت بتاريخ ${fmt(expiryDate)}. مضى على الانتهاء أكثر من 45 يوماً. يرجى التجديد فوراً.`
    : `تذكير: هوية السائق ${driverName} ستنتهي بتاريخ ${fmt(expiryDate)}. يرجى التجديد قبل الانتهاء.`;

export const driverLicenseMsg = (driverName, expiryDate, kind) =>
  kind === Kind.POST_EXPIRY
    ? `تنبيه عاجل: رخصة قيادة السائق ${driverName} انتهت بتاريخ ${fmt(expiryDate)}. مضى على الانتهاء أكثر من 45 يوماً. يرجى التجديد فوراً.`
    : `تذكير: رخصة قيادة السائق ${driverName} ستنتهي بتاريخ ${fmt(expiryDate)}. يرجى التجديد قبل الانتهاء.`;

export const carInsuranceMsg = (plateNumber, expiryDate, kind) =>
  kind === Kind.POST_EXPIRY
    ? `تنبيه عاجل: تأمين السيارة رقم (${plateNumber}) انتهى بتاريخ ${fmt(expiryDate)}. مضى على الانتهاء أكثر من 45 يوماً. يرجى التجديد فوراً.`
    : `تذكير: تأمين السيارة رقم (${plateNumber}) سينتهي بتاريخ ${fmt(expiryDate)}. يرجى التجديد قبل الانتهاء.`;

export const carRegistrationMsg = (plateNumber, expiryDate, kind) =>
  kind === Kind.POST_EXPIRY
    ? `تنبيه عاجل: رخصة السيارة رقم (${plateNumber}) انتهت بتاريخ ${fmt(expiryDate)}. مضى على الانتهاء أكثر من 45 يوماً. يرجى التجديد فوراً.`
    : `تذكير: رخصة السيارة رقم (${plateNumber}) ستنتهي بتاريخ ${fmt(expiryDate)}. يرجى التجديد قبل الانتهاء.`;

export const maintStartMsg = (plateNumber, startAt) =>
  `تذكير: موعد بدء صيانة السيارة رقم (${plateNumber}) سيكون بتاريخ ${fmt(startAt)}. المتبقي تقريباً أسبوع. يرجى الاستعداد.`;

export const maintEndMsg = (plateNumber, endAt) =>
  `تذكير: موعد انتهاء صيانة السيارة رقم (${plateNumber}) سيكون بتاريخ ${fmt(endAt)}. المتبقي تقريباً أسبوع.`;

export const maintDueTodayMsg = (plateNumber, endAt) =>
  `إشعار: صيانة السيارة رقم (${plateNumber}) مستحقة اليوم بتاريخ ${fmt(endAt)}.`;

export const orphanedDriverReenqueueMsg = (driverName, docType, kind) =>
  `تذكير: يرجى مراجعة وثائق السائق ${driverName ?? ""} (${docType} - ${kind}).`;
