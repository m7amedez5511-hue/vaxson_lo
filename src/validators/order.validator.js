import { z } from "zod";

/**
 * Saudi Arabia Phone Regex
 * Supports: 05xxxxxxxx, 5xxxxxxxx, +9665xxxxxxxx, 009665xxxxxxxx
 */
const saudiPhoneRegex = /^(\+966|966|0)?5[0-9]{8}$/;

/**
 * Simplified Address Schema for Orders (independent of ClientAddress)
 */
const orderAddressSchema = z.object({
  details: z.object({
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    district: z.string().trim().optional(),
    street: z.string().trim().optional(),
    buildingNo: z.string().trim().optional(),
    unitNo: z.string().trim().optional(),
    zipCode: z.string().trim().optional(),
  }).optional(),
  location: z.object({
    coordinates: z.array(z.number()).length(2, "Coordinates must be [longitude, latitude]").optional(),
  }).optional(),
});

/**
 * Schema for creating a new Order
 */
export const createOrderSchema = z.object({
  shipmentNumber: z.string({
    required_error: "Shipment number is required",
  }).trim().min(3, "Shipment number must be at least 3 characters"),

  recipientName: z.string({
    required_error: "Recipient name is required",
  }).trim().min(2, "Recipient name must be at least 2 characters"),

  recipientPhone: z.string({
    required_error: "Recipient phone number is required",
  }).regex(saudiPhoneRegex, "Invalid Saudi phone format (Ex: 05xxxxxxxx)"),

  // Hybrid Address logic
  pickupAddressId: z.string().optional().nullable(), // Optional Pickup ID
  pickupAddress: orderAddressSchema.optional(),      // Optional Nested pickup object
  
  deliveryAddress: orderAddressSchema.optional(), // Optional Nested delivery object

  // Relations
  clientId: z.string({
    required_error: "Client ID is required",
  }).uuid("Invalid Client ID format"),

  tripId: z.string().uuid("Invalid Trip ID format").optional().nullable(),

  // Financial (ZATCA Ready)
  subTotal: z.number().nonnegative().optional().nullable(),
  vatRate: z.number().default(15).optional().nullable(),
  vatAmount: z.number().nonnegative().optional().nullable(),
  totalPrice: z.number().nonnegative().optional().nullable(),

  paymentMethod: z.enum(["Cash", "Card", "Prepaid"], {
    error_map: () => ({ message: "Payment method must be Cash, Card, or Prepaid" })
  }).optional().nullable(),

  paymentStatus: z.enum(["Pending", "Paid", "Failed", "Refunded"]).default("Pending").optional().nullable(),

  taxInvoiceNumber: z.string().trim().optional().nullable(),
  qrCode: z.string().trim().optional().nullable(),

  // Cargo Details
  type: z.string().trim().optional().nullable(),
  quantity: z.number().int().positive().default(1),
  weight: z.number().positive().optional().nullable(),
});

/**
 * Schema for updating an existing Order
 * Explicitly listing all fields for maximum clarity
 */
export const updateOrderSchema = z.object({
  shipmentNumber: z.string().trim().min(3).optional().nullable(),
  recipientName: z.string().trim().min(2).optional().nullable(),
  recipientPhone: z.string().regex(saudiPhoneRegex).optional().nullable(),
  
  // Addresses
  pickupAddressId: z.string().optional().nullable(),
  deliveryAddress: orderAddressSchema.optional().nullable(),
  deliveryAddressId: z.string().optional().nullable(), // For switching to an existing ID

  // Relations
  clientId: z.string().uuid().optional().nullable(),
  tripId: z.string().uuid().optional().nullable(),

  // Financial
  subTotal: z.number().nonnegative().optional().nullable(),
  vatRate: z.number().optional().nullable(),
  vatAmount: z.number().nonnegative().optional().nullable(),
  totalPrice: z.number().nonnegative().optional().nullable(),

  paymentMethod: z.enum(["Cash", "Card", "Prepaid"]).optional().nullable(),
  paymentStatus: z.enum(["Pending", "Paid", "Failed", "Refunded"]).optional().nullable(),

  taxInvoiceNumber: z.string().trim().optional().nullable(),
  qrCode: z.string().trim().optional().nullable(),

  // Cargo Details
  type: z.string().trim().optional().nullable(),
  quantity: z.number().int().positive().optional().nullable(),
  weight: z.number().positive().optional().nullable(),

  // Status Management (Update specific)
  currentStatus: z.enum([
    "Created",
    "Assigned",
    "InTransit",
    "Delivered",
    "Returned",
    "Cancelled"
  ]).optional(),
});

/**
 * Specific schema for transferring an order to a new trip
 */
export const transferOrderSchema = z.object({
  tripId: z.string({
    required_error: "New Trip ID is required",
  }).uuid("Invalid Trip ID format"),
});

/**
 * Specific schema for updating order status
 */
export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "Created",
    "Assigned",
    "InTransit",
    "Delivered",
    "Returned",
    "Cancelled"
  ], {
    required_error: "Status is required",
  }),
  reason: z.string().trim().optional(),
});
