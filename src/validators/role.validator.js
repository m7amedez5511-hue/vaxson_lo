import z from "zod"

export const roleCreateValidator = z.object({
    name: z.string({
        required_error: "Name is required",
    }).min(2, "Name must be at least 2 characters long"),
    description: z.string().min(5, "description must be at least 5 characters").optional()
})

export const roleUpdateValidator = z.object({
    name: z.string({
        required_error: "Name is required",
    }).min(2, "Name must be at least 2 characters long"),
    description: z.string().min(5, "description must be at least 5 characters").optional(),
    isActive: z.boolean().optional(),
})