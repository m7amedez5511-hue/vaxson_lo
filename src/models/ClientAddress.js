import mongoose from 'mongoose';

const ClientAddressSchema = new mongoose.Schema({
  clientId: {
    type: String, // UUID from PostgreSQL
    required: true,
    index: true
  },
  branchName: {
    type: String,
    trim: true,
    default: null
  },
  label: {
    type: String, // e.g., 'Home', 'Main Office', 'Warehouse'
    trim: true,
    default: 'General'
  },
  contactPerson: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true }
  },
  details: {
    country: { type: String, default: 'SA' },
    city: { type: String, required: true },
    state: { type: String },
    district: { type: String },
    street: { type: String, required: true },
    buildingNo: { type: String },
    unitNo: { type: String },
    additionalNo: { type: String },
    zipCode: { type: String },
    apartment: { type: String }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  isValidated: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Create a 2dsphere index for geospatial searches
ClientAddressSchema.index({ location: '2dsphere' });

const ClientAddress = mongoose.model('ClientAddress', ClientAddressSchema);

export default ClientAddress;
