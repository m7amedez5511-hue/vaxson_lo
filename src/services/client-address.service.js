import ClientAddress from "../models/ClientAddress.js";
import { createAppError } from "../utils/createAppError.js";
import { recordActivity } from "./audit.service.js";

// Create a new address for a client
export const createAddress = async (req, clientId, addressData) => {
  try {
    const address = await ClientAddress.create({
      ...addressData,
      clientId
    });

    // Convert to object and ensure uniform 'id' field
    const addressObj = address.toObject();
    addressObj.id = addressObj._id.toString();
    
    delete addressObj.isDeleted;
    delete addressObj.deletedAt;

    await recordActivity(req, {
      action: "CREATE_CLIENT_ADDRESS",
      module: "ClientAddress",
      recordId: addressObj.id,
      description: `إضافة عنوان جديد للعميل (ID: ${clientId}): ${addressData.city || ""} ${addressData.district || ""}`,
      newData: addressObj
    });

    return addressObj;
  } catch (error) {
    await recordActivity(req, {
      action: "CREATE_CLIENT_ADDRESS",
      module: "ClientAddress",
      description: `فشل في إضافة عنوان للعميل (ID: ${clientId})`,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error;
  }
};

// Get all active addresses for a specific client
export const getClientAddresses = async (clientId) => {
  return await ClientAddress.find({
    clientId,
    isDeleted: false
  })
  .select("-isDeleted -deletedAt")
  .sort({ createdAt: -1 });
};

// Get a single address by ID
export const getAddressById = async (addressId) => {
  const address = await ClientAddress.findOne({
    _id: addressId,
    isDeleted: false
  }).select("-isDeleted -deletedAt");

  if (!address) {
    throw createAppError(404, "address_not_found");
  }

  return address;
};

// Update an existing address
export const updateAddress = async (req, addressId, updateData) => {
  try {
    const oldAddress = await ClientAddress.findOne({ _id: addressId, isDeleted: false });
    if (!oldAddress) throw createAppError(404, "address_not_found");

    const address = await ClientAddress.findOneAndUpdate(
      { _id: addressId, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    ).select("-isDeleted -deletedAt");

    await recordActivity(req, {
      action: "UPDATE_CLIENT_ADDRESS",
      module: "ClientAddress",
      recordId: addressId,
      description: `تعديل عنوان العميل: ${address.city || ""} ${address.district || ""}`,
      oldData: oldAddress,
      newData: address
    });

    return address;
  } catch (error) {
    await recordActivity(req, {
      action: "UPDATE_CLIENT_ADDRESS",
      module: "ClientAddress",
      recordId: addressId,
      description: `فشل في تعديل عنوان العميل`,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error;
  }
};

// Soft delete an address
export const softDeleteAddress = async (req, addressId) => {
  try {
    const address = await ClientAddress.findOneAndUpdate(
      { _id: addressId, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date()
      }
    );

    if (!address) {
      throw createAppError(404, "address_not_found");
    }

    await recordActivity(req, {
      action: "DELETE_CLIENT_ADDRESS",
      module: "ClientAddress",
      recordId: addressId,
      description: `حذف عنوان العميل: ${address.city || ""} ${address.district || ""}`,
      oldData: address,
      status: "SUCCESS"
    });
  } catch (error) {
    await recordActivity(req, {
      action: "DELETE_CLIENT_ADDRESS",
      module: "ClientAddress",
      recordId: addressId,
      description: `فشل في حذف عنوان العميل ${address?.city || ""} ${address?.district || ""}`,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error;
  }
};

// Get archived addresses (optional clientId filter)
export const getArchivedAddresses = async (clientId) => {
  const filter = { isDeleted: true };
  if (clientId) filter.clientId = clientId;
  
  return await ClientAddress.find(filter).sort({ deletedAt: -1 });
};