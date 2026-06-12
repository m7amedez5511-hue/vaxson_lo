import z from "zod"

export const assignPermissionValidator = z.object({
  // roleId comes from req.params.id, NOT the body
  permissionId: z.string({
    required_error: "Permission ID is required",
  }).uuid("Invalid Permission ID format"),
})