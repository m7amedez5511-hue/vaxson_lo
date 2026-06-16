export const roleSelect = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  isDeleted: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  permissions: {
    where: { isDeleted: false },
    select: {
      id: true,
      permissionId: true,
      roleId: true,
      permission: {
        select: { id: true, name: true, slug: true, module: true },
      },
    },
  },
  users: {
    where: { isDeleted: false },
    select: { id: true, name: true, email: true, userName: true },
  },
};