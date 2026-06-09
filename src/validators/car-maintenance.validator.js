import { z } from "zod";

export const carMaintenanceSchemas = {
  create: z.object({
    reason: z.string().min(1, "reason_required"),
    cost: z.number().min(0, "cost_must_be_positive"),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
  }),

  update: z.object({
    reason: z.string().min(1, "reason_required").optional(),
    cost: z.number().min(0, "cost_must_be_positive").optional(),
    startAt: z.string().datetime().nullable().optional(),
    endAt: z.string().datetime().nullable().optional(),
  }),
};
