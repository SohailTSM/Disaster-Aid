const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const organizationSchema = new Schema({
  name: { type: String, required: true },
  contactEmail: { type: String },
  contactPhone: { type: String },
  verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  },
  address: { type: String },
  createdAt: { type: Date, default: Date.now }
});

organizationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Organization', organizationSchema);
