import { PrismaFeatures } from "../utils/PrismaFeatures.js";
import { prisma } from "../lib/prisma.js";
import { createAppError } from "../utils/createAppError.js";
import { recordActivity } from "./audit.service.js";
import { branchSelect } from "../selectors/branch.selector.js";

// Create a new branch
export const createBranch = async (req, branchData) => {
  try {
    const branch = await prisma.branch.create({
      data: branchData,
      select: branchSelect,
    });

    await recordActivity(req, {
      action: "CREATE_BRANCH",
      module: "Branch",
      recordId: branch.id,
      description: `إنشاء فرع جديد: ${branch.name}`,
      newData: branch
    });

    return branch;
  } catch (error) {
    await recordActivity(req, {
      action: "CREATE_BRANCH",
      module: "Branch",
      description: `فشل في إنشاء فرع جديد: ${branchData.name || "Unknown"}`,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error;
  }
};

// Get all active branches
export const getAllBranches = async (query) => {
    const features = new PrismaFeatures(prisma.branch, query)
    .filter(["city", "isActive"])
    .search(["name", "email", "phone"])
    .sort(["createdAt", "name", "city", "isActive"])
    .paginate();

  features.queryOptions.where = { ...features.queryOptions.where, isDeleted: false };
  features.selectOrInclude(branchSelect);

  const result = await features.exec();

  return result;
};

// Get archived branches
export const getArchivedBranches = async (query) => {
  const features = new PrismaFeatures(prisma.branch, query)
    .filter(["city", "isActive"])
    .search(["name", "email", "phone"])
    .sort(["createdAt", "name", "city", "isActive"])
    .paginate();

  features.queryOptions.where = { ...features.queryOptions.where, isDeleted: true };
  features.selectOrInclude(branchSelect);

  const result = await features.exec();

  return result;
};

// Get a single branch by ID
export const getBranchById = async (id) => {
  const branch = await prisma.branch.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    select: branchSelect,
  });

  if (!branch) {
    throw createAppError(404, "branch_not_found");
  }

  return branch;
};

// Update an existing branch
export const updateBranch = async (req, id, updateData) => {
  try {
    // Check if branch exists
    const existingBranch = await getBranchById(id);

    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: updateData,
      select: branchSelect,
    });

    await recordActivity(req, {
      action: "UPDATE_BRANCH",
      module: "Branch",
      recordId: updatedBranch.id,
      description: `تعديل بيانات الفرع: ${updatedBranch.name}`,
      oldData: existingBranch,
      newData: updatedBranch
    });

    return updatedBranch;
  } catch (error) {
    await recordActivity(req, {
      action: "UPDATE_BRANCH",
      module: "Branch",
      recordId: id,
      description: `فشل في تعديل بيانات الفرع`,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error;
  }
};

// Soft delete a branch
export const softDeleteBranch = async (req, id) => {
  try {
    // Check if branch exists
    const existingBranch = await getBranchById(id);

    await prisma.branch.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false,
      },
    });

    await recordActivity(req, {
      action: "DELETE_BRANCH",
      module: "Branch",
      recordId: id,
      description: `حذف الفرع: ${existingBranch.name}`,
      oldData: existingBranch,
      status: "SUCCESS"
    });
  } catch (error) {
    await recordActivity(req, {
      action: "DELETE_BRANCH",
      module: "Branch",
      recordId: id,
      description: `فشل في حذف الفرع`,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error;
  }
};