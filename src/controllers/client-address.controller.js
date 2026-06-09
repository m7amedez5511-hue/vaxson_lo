import { asyncHandler } from "../middleware/errorHandler.js";
import * as addressService from "../services/client-address.service.js";
import { sendResponse } from "../utils/response.js";

// Create a new address for a client
export const createAddressController = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  const addressData = req.body;
  const newAddress = await addressService.createAddress(req, clientId, addressData);

  return sendResponse(res, 201, "Address created successfully", newAddress);
});

// Get all addresses for a specific client
export const getClientAddressesController = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  const addresses = await addressService.getClientAddresses(clientId);

  return sendResponse(res, 200, "Addresses fetched successfully", addresses);
});

// get archived addresses
export const getArchivedAddressesController = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  const addresses = await addressService.getArchivedAddresses(clientId);
  return sendResponse(res, 200, "Archived addresses fetched successfully", addresses);
});

// Update an existing address
export const updateAddressController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedAddress = await addressService.updateAddress(req, id, req.body);

  return sendResponse(res, 200, "Address updated successfully", updatedAddress);
});

/**
 * Soft delete an address
 */
export const deleteAddressController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await addressService.softDeleteAddress(req, id);

  return res.status(204).send();
});
