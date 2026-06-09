import { prisma } from "../lib/prisma.js";
import { UAParser } from "ua-parser-js";
import { PrismaFeatures } from "../utils/PrismaFeatures.js";


/**
 * Logs a system-wide activity/audit entry into the database.
 * This function records what actions were performed, by whom, and from where.
 * 
 * @param {Object} req - The Express request object (used to extract IP, user agent, etc.)
 * @param {Object} params - The audit details
 * @param {string} params.action - The type of action performed (e.g., 'CREATE_ORDER', 'UPDATE_DRIVER')
 * @param {string} params.module - The system module affected (e.g., 'Order', 'Driver', 'Trip')
 * @param {string|number} params.recordId - The ID of the record being modified/created
 * @param {string} params.description - A human-readable description of the action (Supports Arabic)
 * @param {Object} [params.oldData] - The state of the record before the action (optional)
 * @param {Object} [params.newData] - The state of the record after the action (optional)
 * @param {string} [params.status='SUCCESS'] - The status of the action (SUCCESS or FAILED)
 * @param {string} [params.errorMessage] - The error message if the action failed
 * @returns {Promise<Object |null>} The created activity log entry or null on failure
 */
export const recordActivity = async (req, { action, module, recordId, userId, description, oldData, newData, status, errorMessage }) => {
  try {
    // 1. Extract IP Address (Direct or via Proxy like Nginx)
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "Unknown";

    // 2. Parse User Agent to get Device, OS, and Browser info
    const ua = new UAParser(req.headers['user-agent']);
    const deviceDetails = ua.getResult();

    // 3. Construct Request Metadata Object for professional auditing
    const requestMeta = {
      ip: ipAddress,
      method: req.method,
      url: req.originalUrl,
      device: {
        browser: `${deviceDetails.browser.name || "Unknown"} ${deviceDetails.browser.version || ""}`.trim(),
        os: `${deviceDetails.os.name || "Unknown"} ${deviceDetails.os.version || ""}`.trim(),
        deviceType: deviceDetails.device.type || "Desktop",
        vendor: deviceDetails.device.vendor || ""
      }
    };

    // 4. Save to Database using centralized prisma client
    const logEntry = await prisma.activityLog.create({
      data: {
        userId: userId || req.user?.id, // Prioritize explicit userId, then req.user.id
        action,
        module,
        recordId: String(recordId),
        description,
        oldData: oldData || null,
        newData: newData || null,
        status: status || "SUCCESS",
        errorMessage: errorMessage || null,
        requestMeta
      }
    });

    return logEntry;
  } catch (error) {
    // Fail silently to ensure the main transaction is not interrupted by logging errors
    console.error("[AuditService] Failed to record activity log:", error);
    return null;
  }
};


// Retrieves a paginated list of activity logs with advanced filtering.

export const getAllActivities = async (query = {}) => {
  const features = new PrismaFeatures(prisma.activityLog, query)
    .filter()
    .sort()
    .paginate()
    .search(["action", "module"]); // Fields on the model itself

  // Handle Relation filtering for User Name (accepts ?userName= or ?name=)
  const searchName = query.userName || query.name;
  if (searchName) {
    features.queryOptions.where.user = {
      OR: [
        { name: { contains: searchName, mode: "insensitive" } },
        { userName: { contains: searchName, mode: "insensitive" } }
      ]
      
    };
    // Remove them so Prisma doesn't look for these columns in ActivityLog
    delete features.queryOptions.where.userName;
    delete features.queryOptions.where.name;
  }

  // Handle Date range filters
  if (query.fromDate || query.toDate) {
    features.queryOptions.where.createdAt = {};
    if (query.fromDate) features.queryOptions.where.createdAt.gte = new Date(query.fromDate);
    if (query.toDate) features.queryOptions.where.createdAt.lte = new Date(query.toDate);
    
    // Remove them to prevent Prisma errors
    delete features.queryOptions.where.fromDate;
    delete features.queryOptions.where.toDate;
  }

  // Include user data
  features.queryOptions.include = {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        role: {
          select: { name: true }
        },
        branch: {
          select: { name: true, city: true }
        }
      },
    },
  };

  return await features.exec();
};

// Retrieves a single activity log by ID with full user details and operation metadata.

export const getActivityById = async (id) => {
  return await prisma.activityLog.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          role: {
            select: { name: true }
          },
          branch: {
            select: { name: true, city: true }
          }
        }
      }
    }
  });
};
