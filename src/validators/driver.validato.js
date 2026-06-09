import { z } from "zod";

export const createDriverValidator = z.object({
  name: z
    .string({
      required_error: "Name is required",
    })
    .min(2, "Name must be at least 2 characters long"),
  phone: z
    .string({
      required_error: "Phone number is required",
    })
    .regex(/^(\+966|966|0)?5[0-9]{8}$/, "Invalid Saudi Arabia phone number"),
  email: z
    .string({
      required_error: "Email is required",
    })
    .email("Invalid email format").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  address: z
    .string()
    .min(5, "address must be at least 5 characters")
    .optional(),
  nationality: z
    .string()
    .min(5, "nationality must be at least 5 characters")
    .optional(),
  nationalIdType: z.enum(["NationalID", "Iqama", "Passport"]).optional(),
  gosiNumber: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseType: z.string().optional(),
  licenseExpiry: z.coerce.date().refine((date) => date >= new Date(), {
    message: "License expiry must be today or in the future",
  }).optional(),
  driverCardNumber :z.string().optional(),
  driverCardType:z.enum(["Temporary","Seasonal","Annual","Restricted"]).optional(),
  driverCardExpiry :z.coerce.date().refine((date) => date >= new Date(), {
    message: "License expiry must be today or in the future",
  }).optional(),
  photo: z.string().optional(),
  nationalPhoto: z.string().optional(),
  driverCardPhoto: z.string().optional(),
  branchId: z.string().uuid("Invalid branch ID").optional(),
  
});

//update driver validator
export const updateDriverValidator = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .optional(),
  phone: z
    .string()
    .regex(/^(\+966|966|0)?5[0-9]{8}$/, "Invalid Saudi Arabia phone number")
    .optional(),
  email: z
    .string({
      required_error: "Email is required",
    })
    .email("Invalid email format").optional(),
  address: z
    .string()
    .min(5, "address must be at least 5 characters")
    .optional(),
  nationality: z
    .string()
    .min(5, "nationality must be at least 5 characters")
    .optional(),
  nationalIdType: z.enum(["NationalID", "Iqama", "Passport"]).optional(),
  gosiNumber: z.string().optional(),
  
    
  licenseNumber: z.string().optional(),
  licenseType: z.string().optional(),
  licenseExpiry: z.coerce.date().refine((date) => date >= new Date(), {
    message: "License expiry must be today or in the future",
  }).optional(),
  driverCardNumber :z.string().optional(),
  driverCardType:z.enum(["Temporary","Seasonal","Annual","Restricted"]).optional(),
  driverCardExpiry :z.coerce.date().refine((date) => date >= new Date(), {
    message: "License expiry must be today or in the future",
  }).optional(),
  photo: z.string().optional(),
  nationalPhoto: z.string().optional(),
  driverCardPhoto: z.string().optional(),
  branchId: z.string().uuid("Invalid branch ID").optional(),
  
});