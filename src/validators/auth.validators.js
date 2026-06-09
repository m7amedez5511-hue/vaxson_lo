import { z } from "zod";

//login schema for user
export const loginSchema = z.object({
  userName: z
    .string({
      required_error: "Name is required",
    })
    .min(2, "Name must be at least 2 characters long").optional(),
    phone: z
    .string({
      required_error: "Phone number is required",
    })
    .regex(/^(\+966|966|0)?5[0-9]{8}$/, "Invalid Saudi Arabia phone number").optional(),
    email: z
    .string({
      required_error: "Email is required",
    })
    .email("Invalid email format")
    .optional(),

  password: z
    .string({
      required_error: "Password is required",
    })
    .min(8, "Password must be at least 8 characters"),
});