import { asyncHandler } from "../middleware/errorHandler.js";
import * as clientService from "../services/client.service.js";
import * as orderService from "../services/order.service.js";
import { sendResponse } from "../utils/response.js";


// create client
export const createClientController = asyncHandler(async (req, res) => {
  const clientData = req.body;
  const newClient = await clientService.createClient(req, clientData);
  return sendResponse(res, 201, "Client created successfully", newClient);
});

// get all clients
export const getAllClientsController = asyncHandler(async (req, res) => {
  const clients = await clientService.getAllClients(req);
  return sendResponse(res, 200, "Clients fetched successfully", clients);
});

// get archived clients
export const getArchivedClientsController = asyncHandler(async (req, res) => {
  const clients = await clientService.getArchivedClients(req);
  return sendResponse(res, 200, "Archived clients fetched successfully", clients);
});

// get client by id
export const getClientByIdController = asyncHandler(async (req, res) => {
  const client = await clientService.getClientById(req.params.id);
  return sendResponse(res, 200, "Client fetched successfully", client);
});

// get archived client by id
export const getArchivedClientByIdController = asyncHandler(async (req, res) => {
  const client = await clientService.getClientById(req.params.id, true);
  return sendResponse(res, 200, "Archived client fetched successfully", client);
});

// update client
export const updateClientController = asyncHandler(async (req, res) => {
  const updatedClient = await clientService.updateClient(req, req.params.id, req.body);
  return sendResponse(res, 200, "Client updated successfully", updatedClient);
});

// delete client
export const deleteClientController = asyncHandler(async (req, res) => {
  await clientService.deleteClient(req, req.params.id);
  return res.status(204).send();
});

// get client archived orders
export const getClientArchivedOrdersController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await orderService.getArchivedOrders({ ...req.query, clientId: id });
  return sendResponse(res, 200, "Client archived orders fetched successfully", result);
});