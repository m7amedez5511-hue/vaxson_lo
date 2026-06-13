import z from "zod"

export const assignPermissionValidator = z.object({
  permissionId: z.string({
    required_error: "Permission ID is required",
  }).uuid("Invalid Permission ID format"),
})

//  bulk assign validator
export const bulkAssignPermissionValidator = z.object({
  permissionIds: z
    .array(
      z.string().uuid("Each permission ID must be a valid UUID")
    )
    .refine(
      (arr) => new Set(arr).size === arr.length,
      { message: "Permission IDs must be unique" }
    ),
})