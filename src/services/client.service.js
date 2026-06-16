import { createAppError } from "../utils/createAppError.js";
import * as addressService from "./client-address.service.js";
import { prisma } from "../lib/prisma.js";
import { PrismaFeatures } from "../utils/PrismaFeatures.js";
import { recordActivity } from "./audit.service.js";
import { clientSelect } from "../selectors/client.selector.js";

// create client
export const createClient = async (req, clientData) => {
  try {
    const newClient = await prisma.client.create({
      data: clientData,
      select: clientSelect,
    });

    await recordActivity(req, {
      action: "CREATE_CLIENT",
      module: "Client",
      recordId: newClient.id,
      description: `إضافة عميل جديد: ${newClient.name}`,
      newData: newClient
    });

    return newClient;
  } catch (error) {
    await recordActivity(req, {
      action: "CREATE_CLIENT",
      module: "Client",
      description: `فشل في إضافة عميل جديد: ${clientData.name || "Unknown"}`,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error;
  }
};

// get all clients
export const getAllClients = async (req) => {
  const features = new PrismaFeatures(prisma.client, req.query)
    .filter(["isActive", "city", "nationality"])
    .search(["name", "email", "phone"])
    .sort(["createdAt", "name", "isActive"])
    .paginate();

  features.queryOptions.where = { ...features.queryOptions.where, isDeleted: false };
  features.selectOrInclude(clientSelect);

  const result = await features.exec();

  return result;
};

// get archived clients
export const getArchivedClients = async (req) => {
  const features = new PrismaFeatures(prisma.client, req.query)
    .filter(["isActive", "city", "nationality"])
    .search(["name", "email", "phone"])
    .sort(["createdAt", "name", "isActive"])
    .paginate();

  features.queryOptions.where = { ...features.queryOptions.where, isDeleted: true };
  features.selectOrInclude(clientSelect);

  const result = await features.exec();

  return result;
};

// get client by id
export const getClientById = async (clientId, includeDeleted = false) => {
  const where = { id: clientId };
  if (!includeDeleted) where.isDeleted = false;

  const client = await prisma.client.findFirst({
    where,
    select: clientSelect,
  });

  if (!client) {
    throw createAppError(404, "client_not_found");
  }

  // Fetch addresses from MongoDB (handle archived if needed)
  client.addresses = includeDeleted 
    ? await addressService.getArchivedAddresses(clientId) 
    : await addressService.getClientAddresses(clientId);

  return client;
};

// update client
export const updateClient = async (req, clientId, updateData) => {
  try {
    // Check if client exists and is not deleted
    const existingClient = await prisma.client.findFirst({
      where: { id: clientId, isDeleted: false },
    });

    if (!existingClient) {
      throw createAppError(404, "client_not_found");
    }

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: updateData,
      select: clientSelect,
    });

    await recordActivity(req, {
      action: "UPDATE_CLIENT",
      module: "Client",
      recordId: updatedClient.id,
      description: `تعديل بيانات العميل: ${updatedClient.name}`,
      oldData: existingClient,
      newData: updatedClient
    });

    return updatedClient;
  } catch (error) {
    await recordActivity(req, {
      action: "UPDATE_CLIENT",
      module: "Client",
      recordId: clientId,
      description: `فشل في تعديل بيانات العميل`,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error;
  }
};

// delete client
export const deleteClient = async (req, clientId) => {
  try {
    // Check if client exists and is not deleted
    const existingClient = await prisma.client.findFirst({
      where: { id: clientId, isDeleted: false },
    });

    if (!existingClient) {
      throw createAppError(404, "client_not_found");
    }

    await prisma.client.update({
      where: { id: clientId },
      data: {
        isActive: false,
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await recordActivity(req, {
      action: "DELETE_CLIENT",
      module: "Client",
      recordId: clientId,
      description: `حذف العميل: ${existingClient.name}`,
      oldData: existingClient,
      status: "SUCCESS"
    });

  } catch (error) {
    await recordActivity(req, {
      action: "DELETE_CLIENT",
      module: "Client",
      recordId: clientId,
      description: `فشل في حذف العميل`,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error;
  }
};