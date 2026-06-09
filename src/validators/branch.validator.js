import { z } from "zod";

// Schema for creating a new branch
export const createBranchSchema = z.object({
  name: z.string({
    required_error: "Branch name is required",
  }).trim().min(2, "Branch name must be at least 2 characters long"),
  
  email: z.string().email("Invalid email format").optional().nullable(),
  
  phone: z.string().trim()
    .regex(/^(\+966|966|0)?5[0-9]{8}$/, "Invalid Saudi phone format (Ex: 05xxxxxxxx)")
    .optional().nullable(),
  
  // Address Fields
  country: z.string().trim().default("SA"),
  
  city: z.string({
    required_error: "City is required",
  }).trim(),
  
  state: z.string().trim().optional().nullable(),
  
  district: z.string().trim().optional().nullable(),
  
  street: z.string({
    required_error: "Street is required",
  }).trim(),
  
  buildingNo: z.string().trim().optional().nullable(),
  
  unitNo: z.string().trim().optional().nullable(),
  
  zipCode: z.string().trim().optional().nullable(),
  
  latitude: z.number().optional().nullable(),
  
  longitude: z.number().optional().nullable(),
});

// Schema for updating an existing branch
export const updateBranchSchema = createBranchSchema.partial().extend({
  isActive: z.boolean().optional(),
});
