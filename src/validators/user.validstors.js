import { z } from "zod";

// Schema for creating a user
export const createUserSchema = z.object({
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
    .email("Invalid email format"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
    branchId: z.string().uuid("Invalid branch ID").optional(),
    roleId: z.string().uuid("Invalid role ID"),
});

// Schema for updating a user

export const updateUserSchema = z.object({
  name: z
    .string({
      required_error: "Name is required",
    })
    .min(2, "Name must be at least 2 characters long"),

  phone: z
    .string({
      required_error: "Phone number is required",
    })
    .regex(/^(\+966|966|0)?5[0-9]{8}$/, "Invalid Saudi Arabia phone number").optional(),

  email: z
    .string({
      required_error: "Email is required",
    })
    .email("Invalid email format").optional(),

  isActive: z.boolean().optional(),
  branchId: z.string().uuid("Invalid branch ID").optional(),
  roleId: z.string().uuid("Invalid role ID").optional(),
});


