import mongoose from 'mongoose';

const OrderAddressSchema = new mongoose.Schema({
  // details of the delivery location (Recipient)
  details: {
    country: { type: String, default: 'SA' },
    city: { type: String, required: true },
    district: { type: String },
    street: { type: String, required: true },
    buildingNo: { type: String },
    unitNo: { type: String },
    zipCode: { type: String }
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
  }
}, {
  timestamps: true
});

OrderAddressSchema.index({ location: '2dsphere' });

const OrderAddress = mongoose.model('OrderAddress', OrderAddressSchema);

export default OrderAddress;
