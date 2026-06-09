import { prisma } from "../lib/prisma.js";
import { createAppError } from "../utils/createAppError.js";

/**
 * Generic CRUD Service using Prisma
 * Provides standard CRUD operations for any model
 * @param example
 *  import * as crud from './services/crud.service.js';

// Create a client
const client = await crud.create('client', { name: 'John', email: 'john@example.com' });

// Get all clients with pagination
const clients = await crud.findAll('client', { page: 1, limit: 10 });

// Update
const updated = await crud.updateById('client', 'id-here', { name: 'Jane' });

// Soft delete
await crud.softDelete('client', 'id-here');
 */

/**
 * Create a new record
 * @param {string} model - Prisma model name (e.g., 'user', 'client', 'branch')
 * @param {Object} data - Data to create
 * @param {Object} options - Additional options (include, select, etc.)
 * @returns {Promise<Object>} Created record
 */
export const create = async (model, data, options = {}) => {
  try {
    const result = await prisma[model].create({
      data,
      ...options,
    });
    return result;
  } catch (error) {
    throw createAppError(400, `Error creating ${model}: ${error.message}`);
  }
};

/**
 * Find all records with filtering, sorting, and pagination
 * @param {string} model - Prisma model name
 * @param {Object} query - Query parameters (filter, sort, page, limit)
 * @param {Object} options - Additional options (include, select, etc.)
 * @returns {Promise<Object>} Records and pagination info
 */
export const findAll = async (model, query = {}, options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      searchFields = [],
      ...filters
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    let where = { ...filters };

    // Add soft delete filter (exclude deleted records by default)
    if (!filters.includeDeleted) {
      where.isDeleted = false;
    }
    delete filters.includeDeleted;

    // Add search functionality
    if (search && searchFields.length > 0) {
      where.OR = searchFields.map((field) => ({
        [field]: {
          contains: search,
          mode: 'insensitive',
        },
      }));
    }

    // Get total count
    const total = await prisma[model].count({ where });

    // Get records
    const records = await prisma[model].findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: {
        [sortBy]: sortOrder,
      },
      ...options,
    });

    return {
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw createAppError(400, `Error fetching ${model}: ${error.message}`);
  }
};

/**
 * Find a single record by ID
 * @param {string} model - Prisma model name
 * @param {string} id - Record ID
 * @param {Object} options - Additional options (include, select, etc.)
 * @returns {Promise<Object>} Found record
 */
export const findById = async (model, id, options = {}) => {
  try {
    const record = await prisma[model].findFirst({
      where: {
        id,
        isDeleted: false,
      },
      ...options,
    });

    if (!record) {
      throw createAppError(404, `${model}_not_found`);
    }

    return record;
  } catch (error) {
    throw createAppError(400, `Error finding ${model}: ${error.message}`);
  }
};

/**
 * Find a single record by custom field
 * @param {string} model - Prisma model name
 * @param {Object} where - Where clause
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Found record or null
 */
export const findOne = async (model, where, options = {}) => {
  try {
    const record = await prisma[model].findFirst({
      where: {
        ...where,
        isDeleted: false,
      },
      ...options,
    });

    return record;
  } catch (error) {
    throw createAppError(400, `Error finding ${model}: ${error.message}`);
  }
};
/**
 * Find a single record by custom field
 * @param {string} model - Prisma model name
 * @param {Object} where - Where clause
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Found record or null
 */
export const fetchOne = async (model, where, options = {}) => {
  try {
    const record = await prisma[model].findFirst({
      where: {
        ...where,
        
      },
      ...options,
    });

    return record;
  } catch (error) {
    throw createAppError(400, `Error finding ${model}: ${error.message}`);
  }
};

/**
 * Update a record by ID
 * @param {string} model - Prisma model name
 * @param {string} id - Record ID
 * @param {Object} data - Data to update
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Updated record
 */
export const updateById = async (model, id, data, options = {}) => {
  try {
    // Check if record exists
    const exists = await prisma[model].findFirst({
      where: { id, isDeleted: false },
    });

    if (!exists) {
      throw createAppError(404, `${model}_not_found`);
    }

    const result = await prisma[model].update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      ...options,
    });

    return result;
  } catch (error) {
    throw createAppError(400, `Error updating ${model}: ${error.message}`);
  }
};

/**
 * Soft delete a record by ID
 * @param {string} model - Prisma model name
 * @param {string} id - Record ID
 * @returns {Promise<Object>} Deleted record
 */
export const softDelete = async (model, id) => {
  try {
    // Check if record exists
    const exists = await prisma[model].findFirst({
      where: { id, isDeleted: false },
    });

    if (!exists) {
      throw createAppError(404, `${model}_not_found`);
    }

    const result = await prisma[model].update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return result;
  } catch (error) {
    throw createAppError(400, `Error deleting ${model}: ${error.message}`);
  }
};

/**
 * Hard delete a record by ID (permanent deletion)
 * @param {string} model - Prisma model name
 * @param {string} id - Record ID
 * @returns {Promise<Object>} Deleted record
 */
export const hardDelete = async (model, id) => {
  try {
    const result = await prisma[model].delete({
      where: { id },
    });

    return result;
  } catch (error) {
    throw createAppError(400, `Error deleting ${model}: ${error.message}`);
  }
};

/**
 * Restore a soft-deleted record
 * @param {string} model - Prisma model name
 * @param {string} id - Record ID
 * @returns {Promise<Object>} Restored record
 */
export const restore = async (model, id) => {
  try {
    const result = await prisma[model].update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        isActive: true,
      },
    });

    return result;
  } catch (error) {
    throw createAppError(400, `Error restoring ${model}: ${error.message}`);
  }
};

/**
 * Count records with filter
 * @param {string} model - Prisma model name
 * @param {Object} where - Where clause
 * @returns {Promise<number>} Count
 */
export const count = async (model, where = {}) => {
  try {
    const result = await prisma[model].count({
      where: {
        ...where,
        isDeleted: false,
      },
    });

    return result;
  } catch (error) {
    throw createAppError(400, `Error counting ${model}: ${error.message}`);
  }
};

/**
 * Check if record exists
 * @param {string} model - Prisma model name
 * @param {Object} where - Where clause
 * @returns {Promise<boolean>} True if exists
 */
export const exists = async (model, where = {}) => {
  try {
    const record = await prisma[model].findFirst({
      where: {
        ...where,
        isDeleted: false,
      },
      select: { id: true },
    });

    return !!record;
  } catch (error) {
    throw createAppError(400, `Error checking ${model}: ${error.message}`);
  }
};

export default {
  create,
  findAll,
  findById,
  findOne,
  updateById,
  softDelete,
  hardDelete,
  restore,
  count,
  exists,
};