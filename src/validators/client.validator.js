import { z } from "zod";

// Schema for creating a client
export const createClientSchema = z.object({
  name: z.string({
    required_error: "Name is required",
  }).min(2, "Name must be at least 2 characters long"),
  
  phone: z.string({
    required_error: "Phone number is required",
  }).regex(/^(\+966|966|0)?5[0-9]{8}$/, "Invalid Saudi phone format (Ex: 05xxxxxxxx)"),
  

  email: z.string().email("Invalid email format").optional(),

  
  clientType: z.enum(["Individual", "Corporate"]).optional(),
});

// Schema for updating a client
 
export const updateClientSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string()
    .regex(/^(\+966|966|0)?5[0-9]{8}$/, "Invalid Saudi phone format (Ex: 05xxxxxxxx)")
    .optional(),
  email: z.string().email("Invalid email format").optional(),
  clientType: z.enum(["Individual", "Corporate"]).optional(),
  isActive: z.boolean().optional(),
});
