import { z } from "zod";

// Schema for creating a client address
export const createAddressSchema = z.object({
  branchName: z.string().trim().nullable().optional(),
  label: z.string().trim().optional().default("General"),
  contactPerson: z.object({
    name: z.string().trim().optional(),
    phone: z.string().trim()
      .regex(/^(\+966|966|0)?5[0-9]{8}$/, "Invalid Saudi phone format (Ex: 05xxxxxxxx)")
      .optional(),
  }).optional(),
  details: z.object({
    country: z.string().default("SA"),
    city: z.string({
      required_error: "City is required",
    }).trim(),
    state: z.string().trim().optional(),
    district: z.string().trim().optional(),
    street: z.string({
      required_error: "Street is required",
    }).trim(),
    buildingNo: z.string().trim().optional(),
    unitNo: z.string().trim().optional(),
    additionalNo: z.string().trim().optional(),
    zipCode: z.string().trim().optional(),
    apartment: z.string().trim().optional(),
  }),
  location: z.object({
    coordinates: z.array(z.number()).length(2, "Coordinates must be [longitude, latitude]"),
  }),
});

// Schema for updating a client address
export const updateAddressSchema = z.object({
  branchName: z.string().trim().nullable().optional(),
  label: z.string().trim().optional(),
  contactPerson: z.object({
    name: z.string().trim().optional(),
    phone: z.string().trim()
      .regex(/^(\+966|966|0)?5[0-9]{8}$/, "Invalid Saudi phone format (Ex: 05xxxxxxxx)")
      .optional(),
  }).optional(),
  details: z.object({
    country: z.string().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    district: z.string().trim().optional(),
    street: z.string().trim().optional(),
    buildingNo: z.string().trim().optional(),
    unitNo: z.string().trim().optional(),
    additionalNo: z.string().trim().optional(),
    zipCode: z.string().trim().optional(),
    apartment: z.string().trim().optional(),
  }).optional(),
  location: z.object({
    coordinates: z.array(z.number()).length(2).optional(),
  }).optional(),
  isValidated: z.boolean().optional(),
});
