const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const assignmentSchema = new Schema({
  requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  dispatcherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['New', 'In-Progress', 'Closed'], default: 'New' },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  closedAt: { type: Date }
});

module.exports = mongoose.model('Assignment', assignmentSchema);
