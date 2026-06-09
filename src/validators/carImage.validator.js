import { z } from "zod";

// Body schema - simplified (no nested 'body' property)
export const addCarImagesSchema = z.object({
  stage: z.enum(["BEFORE", "AFTER", "GENERAL"]).default("GENERAL").optional(),
  maintenanceId: z.string().uuid().optional().nullable().or(z.literal('')),
});

// Params schemas
export const carIdSchema = z.object({
  id: z.string().uuid(),
});

export const imageIdSchema = z.object({
  imageId: z.string().uuid(),
});
