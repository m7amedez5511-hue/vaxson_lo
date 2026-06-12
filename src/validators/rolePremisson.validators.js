import z from "zod"
export const assignPermissionValidator = z.object({
    roleId: z.string({
        required_error: "Role ID is required",
    }).uuid("Invalid Role ID format"),
    permissionId: z.string({
        required_error: "Permission ID is required",
    }).uuid("Invalid Permission ID format"),
})