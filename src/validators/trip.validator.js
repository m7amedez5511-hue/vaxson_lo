import { z } from "zod";
import { Prisma } from "@prisma/client";

const tripTypeEnum = z.enum(["Scheduled", "InProgress", "Completed", "Cancelled"]);
export const tripValidator = {
  createTrip: z.object({
    tripNumber: z.string().optional(),
    title: z
      .string({
        required_error: "title is required",
      })
      .min(3, "title must be at least 3 characters long"),
    driverId: z
      .string({
        required_error: "Driver ID is required",
      })
      .uuid("Invalid Driver ID format"),
    carId: z
      .string({
        required_error: "Car ID is required",
      })
      .uuid("Invalid Car ID format"),
    startTime: z
      .string({
        required_error: "startTime ID is required",
      })
      .datetime({ offset: true })
      .or(z.date())
      .transform((val) => new Date(val))
      .optional(),
    endTime: z
      .string()
      .datetime({ offset: true })
      .or(z.date())
      .transform((val) => new Date(val))
      .optional(),
    collectedCount: z.number().default(0).optional(),
    deliveredCount: z.number().default(0).optional(),
    returnedCount: z.number().default(0).optional(),
    totalCashCollected: z
      .union([z.string(), z.number()])
      .transform((val) => new Prisma.Decimal(val))
      .refine((val) => !isNaN(val.toNumber()), {
        message: "Invalid decimal number",
      })
      .optional(),
    endReason: z.string().min(2, "end reson atleast 2 characters").optional(),
    notes: z.string().min(2, "end reson atleast 2 characters").optional(),
    status: tripTypeEnum.optional(),
    branchId: z.string().uuid("Invalid branch ID").optional(),
  }),
  updateTrip: z.object({
    title: z
      .string({
        required_error: "title is required",
      })
      .min(3, "title must be at least 3 characters long").optional(),
    driverId: z
      .string({
        required_error: "Driver ID is required",
      })
      .uuid("Invalid Driver ID format")
      .optional(),
    carId: z
      .string({
        required_error: "Car ID is required",
      })
      .uuid("Invalid Car ID format")
      .optional(),
    endTime: z
      .string()
      .datetime({ offset: true })
      .or(z.date())
      .transform((val) => new Date(val))
      .optional(),
    collectedCount: z.number().default(0).optional(),
    deliveredCount: z.number().default(0).optional(),
    returnedCount: z.number().default(0).optional(),
    totalCashCollected: z
      .union([z.string(), z.number()])
      .transform((val) => new Prisma.Decimal(val))
      .refine((val) => !isNaN(val.toNumber()), {
        message: "Invalid decimal number",
      })
      .optional(),
    endReason: z.string().min(2, "end reson atleast 2 characters").optional(),
    notes: z.string().min(2, "end reson atleast 2 characters").optional(),
    status: tripTypeEnum.optional(),
    branchId: z.string().uuid("Invalid branch ID").optional(),
  }),
};
