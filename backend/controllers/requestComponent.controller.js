const asyncHandler = require("express-async-handler");
const RequestComponent = require("../models/requestComponent.model");
const Request = require("../models/request.model");

const generateComponents = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const request = await Request.findById(requestId);
  if (!request) {
    res.status(404);
    throw new Error("Request not found");
  }
  const components = [];
  for (const need of request.needs) {
    const comp = new RequestComponent({
      requestId,
      type: need.type,
      quantity: need.quantity,
      status: "New",
    });
    components.push(comp);
  }
  await RequestComponent.insertMany(components);
  res.status(201).json({ message: "Components created", components });
});

const listComponents = asyncHandler(async (req, res) => {
  const { requestId, organizationId, status } = req.query;
  const filter = {};
  if (requestId) filter.requestId = requestId;
  if (organizationId) filter.organizationId = organizationId;
  if (status) filter.status = status;
  const comps = await RequestComponent.find(filter)
    .populate("organizationId")
    .populate("requestId");
  res.json({ components: comps });
});

const assignComponent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { organizationId, notes } = req.body;
  const dispatcherId = req.user._id;
  const comp = await RequestComponent.findById(id);
  if (!comp) {
    res.status(404);
    throw new Error("Component not found");
  }
  comp.organizationId = organizationId;
  comp.dispatcherId = dispatcherId;
  comp.status = "Assigned";
  if (notes) comp.notes = notes;
  await comp.save();
  res.json({ message: "Component assigned", component: comp });
});

const updateComponentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const comp = await RequestComponent.findById(id);
  if (!comp) {
    res.status(404);
    throw new Error("Component not found");
  }
  if (status) comp.status = status;
  if (notes) comp.notes = notes;
  comp.updatedAt = new Date();
  await comp.save();

  // Auto-close main request if all components are delivered/closed
  const components = await RequestComponent.find({ requestId: comp.requestId });
  if (components.every((c) => ["Delivered", "Closed"].includes(c.status))) {
    const reqDoc = await Request.findById(comp.requestId);
    if (reqDoc) {
      reqDoc.status = "Closed";
      await reqDoc.save();
    }
  }

  res.json({ message: "Component updated", component: comp });
});

module.exports = {
  generateComponents,
  listComponents,
  assignComponent,
  updateComponentStatus,
};
