const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const requestComponentSchema = new Schema({
  requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
  type: {
    type: String,
    enum: ['rescue', 'food', 'water', 'medical', 'shelter', 'bed', 'first_aid'],
    required: true
  },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
  dispatcherId: { type: Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['New', 'Assigned', 'In-Progress', 'Delivered', 'Closed'],
    default: 'New'
  },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

requestComponentSchema.index({ requestId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('RequestComponent', requestComponentSchema);
