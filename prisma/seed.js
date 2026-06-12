import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Starting seeding process...");

  // 1. Define Permissions
  const permissionsList = [
    // --- User Management ---
    { name: "إضافة مستخدم عادي", slug: "create-user", module: "Users" },
    { name: "عرض المستخدمين", slug: "read-user", module: "Users" },
    { name: "تعديل مستخدم", slug: "update-user", module: "Users" },
    { name: "حذف مستخدم", slug: "delete-user", module: "Users" },
    { name: "عرض بياناتي الشخصية", slug: "read-user-info", module: "Users" },
    { name: "إضافة مدير نظام", slug: "create-admin", module: "Users" },
    { name: "تعديل بيانات مدير", slug: "update-admin", module: "Users" },
    {
      name: "عرض أرشيف مستخدمين محذوفين",
      slug: "read-deleted-user",
      module: "Users",
    },
    { name: "استعادة مستخدم محذوف", slug: "restore-user", module: "Users" },
    {
      name: "إعادة تعيين كلمة مرور مستخدم",
      slug: "reset-user-password",
      module: "Users",
    },
    { name: "تصدير بيانات المستخدمين", slug: "export-user", module: "Users" },

    // --- Role & Permission Management ---
    { name: "إضافة رتبة/دور", slug: "create-role", module: "Roles" },
    { name: "عرض الرتب/الأدوار", slug: "read-role", module: "Roles" },
    { name: "تعديل رتبة", slug: "update-role", module: "Roles" },
    { name: "حذف رتبة", slug: "delete-role", module: "Roles" },
    {
      name: "عرض أرشيف رتب محذوفة",
      slug: "read-deleted-role",
      module: "Roles",
    },
    { name: "استعادة رتبة محذوفة", slug: "restore-role", module: "Roles" },
    { name: "تصدير بيانات الرتب", slug: "export-role", module: "Roles" },
    {
      name: "إدارة صلاحيات الرتب",
      slug: "manage-role-permissions",
      module: "Roles",  
    },
    { name: "عرض الصلاحيات", slug: "read-permission", module: "Permissions" },

    // --- Organization ---
    { name: "إضافة فرع", slug: "create-branch", module: "Branches" },
    { name: "عرض الفروع", slug: "read-branch", module: "Branches" },
    { name: "تعديل فرع", slug: "update-branch", module: "Branches" },
    { name: "حذف فرع", slug: "delete-branch", module: "Branches" },
    {
      name: "عرض أرشيف فروع محذوفة",
      slug: "read-deleted-branch",
      module: "Branches",
    },
    { name: "استعادة فرع محذوف", slug: "restore-branch", module: "Branches" },
    { name: "تصدير بيانات الفروع", slug: "export-branch", module: "Branches" },

    // --- Clients & Addresses ---
    { name: "إضافة عميل", slug: "create-client", module: "Clients" },
    { name: "عرض العملاء", slug: "read-client", module: "Clients" },
    { name: "تعديل عميل", slug: "update-client", module: "Clients" },
    { name: "حذف عميل", slug: "delete-client", module: "Clients" },
    {
      name: "عرض أرشيف عملاء محذوفين",
      slug: "read-deleted-client",
      module: "Clients",
    },
    { name: "استعادة عميل محذوف", slug: "restore-client", module: "Clients" },
    {
      name: "إعادة تعيين كلمة مرور عميل",
      slug: "reset-client-password",
      module: "Clients",
    },
    { name: "تصدير بيانات العملاء", slug: "export-client", module: "Clients" },
    {
      name: "إضافة عنوان عميل",
      slug: "create-client-address",
      module: "Addresses",
    },
    {
      name: "عرض عناوين العملاء",
      slug: "read-client-address",
      module: "Addresses",
    },
    {
      name: "تعديل عنوان عميل",
      slug: "update-client-address",
      module: "Addresses",
    },
    {
      name: "حذف عنوان عميل",
      slug: "delete-client-address",
      module: "Addresses",
    },
    {
      name: "عرض أرشيف عناوين محذوفة",
      slug: "read-deleted-client-address",
      module: "Addresses",
    },

    // --- Assets (Cars & Maintenance) ---
    { name: "إضافة سيارة", slug: "create-car", module: "Cars" },
    { name: "عرض السيارات", slug: "read-car", module: "Cars" },
    { name: "تعديل سيارة", slug: "update-car", module: "Cars" },
    { name: "حذف سيارة", slug: "delete-car", module: "Cars" },
    {
      name: "عرض أرشيف سيارات محذوفة",
      slug: "read-deleted-car",
      module: "Cars",
    },
    { name: "استعادة سيارة محذوفة", slug: "restore-car", module: "Cars" },
    { name: "تصدير بيانات السيارات", slug: "export-car", module: "Cars" },
    { name: "رفع صور سيارة", slug: "create-car-image", module: "Cars" },
    { name: "عرض صور سيارة", slug: "read-car-image", module: "Cars" },
    {
      name: "عرض أرشيف صور سيارة",
      slug: "read-car-image-archive",
      module: "Cars",
    },
    { name: "حذف صور سيارة", slug: "delete-car-image", module: "Cars" },
    {
      name: "إضافة سجل صيانة",
      slug: "create-maintenance",
      module: "Maintenance",
    },
    {
      name: "عرض سجلات الصيانة",
      slug: "read-maintenance",
      module: "Maintenance",
    },
    {
      name: "تعديل سجل صيانة",
      slug: "update-maintenance",
      module: "Maintenance",
    },
    {
      name: "حذف سجل صيانة",
      slug: "delete-maintenance",
      module: "Maintenance",
    },
    {
      name: "عرض أرشيف صيانة محذوفة",
      slug: "read-deleted-maintenance",
      module: "Maintenance",
    },
    {
      name: "استعادة سجل صيانة محذوف",
      slug: "restore-maintenance",
      module: "Maintenance",
    },
    {
      name: "تصدير بيانات الصيانة",
      slug: "export-maintenance",
      module: "Maintenance",
    },

    // --- Drivers ---
    { name: "إضافة سائق", slug: "create-driver", module: "Drivers" },
    { name: "عرض السائقين", slug: "read-driver", module: "Drivers" },
    { name: "تعديل سائق", slug: "update-driver", module: "Drivers" },
    { name: "حذف سائق", slug: "delete-driver", module: "Drivers" },
    {
      name: "عرض أرشيف سائقين محذوفين",
      slug: "read-deleted-driver",
      module: "Drivers",
    },
    { name: "استعادة سائق محذوف", slug: "restore-driver", module: "Drivers" },
    {
      name: "إعادة تعيين كلمة مرور سائق",
      slug: "reset-driver-password",
      module: "Drivers",
    },
    { name: "تصدير بيانات السائقين", slug: "export-driver", module: "Drivers" },
    {
      name: "توليد تقارير السائقين",
      slug: "generate-driver-report",
      module: "Drivers",
    },
    {
      name:"حزف سجل حالة سائق",
      slug:"deleted-driver-Status",
      module:"Drivers"
    },

    // --- Operations (Orders & Trips) ---
    { name: "إضافة طلب/شحنة", slug: "create-order", module: "Orders" },
    { name: "عرض الطلبات", slug: "read-order", module: "Orders" },
    { name: "تعديل طلب", slug: "update-order", module: "Orders" },
    { name: "حذف طلب", slug: "delete-order", module: "Orders" },
    {
      name: "عرض أرشيف طلبات محذوفة",
      slug: "read-deleted-order",
      module: "Orders",
    },
    { name: "استعادة طلب محذوف", slug: "restore-order", module: "Orders" },
    { name: "تصدير بيانات الطلبات", slug: "export-order", module: "Orders" },
    { name: "تحديث حالة الطلب", slug: "update-order-status", module: "Orders" },
    { name: "تحويل طلب لرحلة أخرى", slug: "transfer-order", module: "Orders" },

    { name: "إضافة رحلة", slug: "create-trip", module: "Trips" },
    { name: "عرض الرحلات", slug: "read-trip", module: "Trips" },
    { name: "تعديل رحلة", slug: "update-trip", module: "Trips" },
    { name: "حذف رحلة", slug: "delete-trip", module: "Trips" },
    {
      name: "عرض أرشيف رحلات محذوفة",
      slug: "read-deleted-trip",
      module: "Trips",
    },
    { name: "استعادة رحلة محذوفة", slug: "restore-trip", module: "Trips" },
    { name: "تصدير بيانات الرحلات", slug: "export-trip", module: "Trips" },
    { name: "بدء رحلة", slug: "start-trip", module: "Trips" },
    { name: "إنهاء رحلة", slug: "end-trip", module: "Trips" },
    {
      name: "توليد تقارير الرحلة",
      slug: "generate-trip-report",
      module: "Trips",
    },

    // --- System Logs ---
    { name: "عرض سجلات النظام/الرقابة", slug: "read-audit", module: "Audit" },
  ];

  console.log("🔑 Seeding permissions...");
  const seededPermissions = [];
  for (const perm of permissionsList) {
    let p = await prisma.permission.findFirst({
      where: { slug: perm.slug, isDeleted: false },
    });

    if (p) {
      p = await prisma.permission.update({
        where: { id: p.id },
        data: { name: perm.name, module: perm.module },
      });
    } else {
      p = await prisma.permission.create({
        data: perm,
      });
    }
    seededPermissions.push(p);
  }

  // 2. Create System Admin Role
  console.log("🛡️ Seeding System Admin role...");
  let adminRole = await prisma.role.findFirst({
    where: { name: "مدير النظام", isDeleted: false },
  });

  if (adminRole) {
    adminRole = await prisma.role.update({
      where: { id: adminRole.id },
      data: { description: "صلاحية كاملة لجميع وظائف النظام" },
    });
  } else {
    adminRole = await prisma.role.create({
      data: {
        name: "مدير النظام",
        description: "صلاحية كاملة لجميع وظائف النظام",
      },
    });
  }

  // 3. Link all permissions to Admin Role
  console.log("🔗 Linking permissions to Admin role...");
  for (const perm of seededPermissions) {
    try {
      const existingRP = await prisma.rolePermission.findFirst({
        where: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      });

      if (!existingRP) {
        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: perm.id,
          },
        });
      }
    } catch (err) {
      if (err.code !== "P2002") {
        throw err;
      }
    }
  }

  // 4. Create Admin User
  const adminUserName = process.env.INITIAL_ADMIN_USERNAME || "admin";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "Admin@123";
  const adminPhone = process.env.INITIAL_ADMIN_PHONE || "0500000000";
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@slash.sa";

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.user.findFirst({
    where: { phone: adminPhone, isDeleted: false },
  });

  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        name: "مدير النظام",
        userName: adminUserName,
        email: adminEmail,
        password: hashedPassword,
        roleId: adminRole.id,
        isActive: true,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        name: "مدير النظام",
        userName: adminUserName,
        email: adminEmail,
        phone: adminPhone,
        password: hashedPassword,
        roleId: adminRole.id,
        isActive: true,
      },
    });
  }

  console.log("✅ Seeding completed successfully!");
}
main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
