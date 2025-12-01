const asyncHandler = require("express-async-handler");
const Request = require("../models/request.model");
const Organization = require("../models/organization.model");
const Assignment = require("../models/assignment.model");

// Resource categories
const RESOURCE_TYPES = [
  "rescue",
  "food",
  "water",
  "medical",
  "shelter",
  "baby_supplies",
  "sanitation",
  "transport",
  "power_charging",
];

// GET /api/analytics/crisis-load - Get crisis load dashboard data
const getCrisisLoadDashboard = asyncHandler(async (req, res) => {
  // Get all active requests (not closed)
  const activeRequests = await Request.find({
    status: { $ne: "Closed" },
  });

  // Get all verified/approved organizations
  const organizations = await Organization.find({
    $or: [{ approved: true }, { verificationStatus: "verified" }],
    suspended: { $ne: true },
  });

  // Calculate total needs by category
  const totalNeeds = {};
  const unassignedNeeds = {};
  const assignedNeeds = {};

  RESOURCE_TYPES.forEach((type) => {
    totalNeeds[type] = 0;
    unassignedNeeds[type] = 0;
    assignedNeeds[type] = 0;
  });

  activeRequests.forEach((request) => {
    request.needs?.forEach((need) => {
      if (RESOURCE_TYPES.includes(need.type)) {
        totalNeeds[need.type] += need.quantity || 0;
        if (need.assignmentStatus === "assigned") {
          assignedNeeds[need.type] += need.quantity || 0;
        } else {
          unassignedNeeds[need.type] += need.quantity || 0;
        }
      }
    });
  });

  // Calculate total offers by category from NGOs
  const totalOffers = {};
  RESOURCE_TYPES.forEach((type) => {
    totalOffers[type] = 0;
  });

  organizations.forEach((org) => {
    org.offers?.forEach((offer) => {
      if (RESOURCE_TYPES.includes(offer.type)) {
        totalOffers[offer.type] += offer.quantity || 0;
      }
    });
  });

  // Calculate unmet demand (needs - offers)
  const unmetDemand = {};
  const demandCoverage = {};
  RESOURCE_TYPES.forEach((type) => {
    const need = totalNeeds[type];
    const offer = totalOffers[type];
    unmetDemand[type] = Math.max(0, need - offer);
    demandCoverage[type] = need > 0 ? Math.min(100, (offer / need) * 100) : 100;
  });

  // Calculate predicted shortfalls based on trends
  // Using simple projection: if current unmet demand continues, predict 24h, 48h, 72h shortfalls
  const recentRequests = await Request.find({
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    status: { $ne: "Closed" },
  });

  const recentNeedsRate = {};
  RESOURCE_TYPES.forEach((type) => {
    recentNeedsRate[type] = 0;
  });

  recentRequests.forEach((request) => {
    request.needs?.forEach((need) => {
      if (RESOURCE_TYPES.includes(need.type)) {
        recentNeedsRate[need.type] += need.quantity || 0;
      }
    });
  });

  // Predicted shortfalls (assuming current rate continues)
  const predictedShortfalls = {
    "24h": {},
    "48h": {},
    "72h": {},
  };

  RESOURCE_TYPES.forEach((type) => {
    const dailyRate = recentNeedsRate[type];
    const currentStock = totalOffers[type];
    
    predictedShortfalls["24h"][type] = Math.max(0, (dailyRate * 1) - currentStock + unmetDemand[type]);
    predictedShortfalls["48h"][type] = Math.max(0, (dailyRate * 2) - currentStock + unmetDemand[type]);
    predictedShortfalls["72h"][type] = Math.max(0, (dailyRate * 3) - currentStock + unmetDemand[type]);
  });

  // Heatmap data: requests by location (aggregate by area)
  const locationHeatmap = {};
  activeRequests.forEach((request) => {
    const area = request.addressText?.split(",")[0]?.trim() || "Unknown";
    if (!locationHeatmap[area]) {
      locationHeatmap[area] = {
        totalRequests: 0,
        needs: {},
        priority: { low: 0, medium: 0, high: 0, sos: 0 },
      };
      RESOURCE_TYPES.forEach((type) => {
        locationHeatmap[area].needs[type] = 0;
      });
    }
    locationHeatmap[area].totalRequests++;
    locationHeatmap[area].priority[request.priority || "low"]++;
    
    request.needs?.forEach((need) => {
      if (RESOURCE_TYPES.includes(need.type)) {
        locationHeatmap[area].needs[need.type] += need.quantity || 0;
      }
    });
  });

  // Convert to array and sort by total requests
  const locationHeatmapArray = Object.entries(locationHeatmap)
    .map(([area, data]) => ({ area, ...data }))
    .sort((a, b) => b.totalRequests - a.totalRequests)
    .slice(0, 10); // Top 10 areas

  // Map data: individual requests with coordinates for map visualization
  const mapData = activeRequests
    .filter((r) => r.location?.coordinates?.length === 2)
    .map((request) => {
      const [lng, lat] = request.location.coordinates;
      const totalNeeds = request.needs?.reduce((sum, n) => sum + (n.quantity || 0), 0) || 1;
      
      // Calculate urgency score (higher = more urgent)
      let urgencyScore = 1;
      if (request.priority === "sos" || request.isSoS) urgencyScore = 4;
      else if (request.priority === "high") urgencyScore = 3;
      else if (request.priority === "medium") urgencyScore = 2;
      
      return {
        id: request._id,
        requestId: request.requestId,
        lat,
        lng,
        priority: request.priority || "low",
        isSoS: request.isSoS || request.priority === "sos",
        status: request.status,
        addressText: request.addressText,
        totalNeeds,
        needTypes: request.needs?.map((n) => n.type) || [],
        urgencyScore,
        beneficiaries: (request.beneficiaries_adults || 0) + 
                       (request.beneficiaries_children || 0) + 
                       (request.beneficiaries_elderly || 0),
        createdAt: request.createdAt,
      };
    });

  // NGO locations for map
  const ngoMapData = organizations
    .filter((org) => org.location?.coordinates?.length === 2)
    .map((org) => {
      const [lng, lat] = org.location.coordinates;
      const totalCapacity = org.offers?.reduce((sum, o) => sum + (o.quantity || 0), 0) || 0;
      
      return {
        id: org._id,
        name: org.name,
        lat,
        lng,
        address: org.address,
        totalCapacity,
        offers: org.offers || [],
      };
    });

  // NGO capacity heatmap
  const ngoCapacity = organizations.map((org) => {
    const totalCapacity = org.offers?.reduce((sum, o) => sum + (o.quantity || 0), 0) || 0;
    return {
      name: org.name,
      address: org.address,
      totalCapacity,
      offers: org.offers || [],
    };
  }).sort((a, b) => b.totalCapacity - a.totalCapacity);

  // Summary statistics
  const summary = {
    totalActiveRequests: activeRequests.length,
    totalOrganizations: organizations.length,
    totalBeneficiaries: activeRequests.reduce(
      (sum, r) =>
        sum +
        (r.beneficiaries_adults || 0) +
        (r.beneficiaries_children || 0) +
        (r.beneficiaries_elderly || 0),
      0
    ),
    sosRequests: activeRequests.filter((r) => r.isSoS || r.priority === "sos").length,
    highPriorityRequests: activeRequests.filter((r) => r.priority === "high").length,
    criticalShortages: RESOURCE_TYPES.filter((type) => demandCoverage[type] < 50),
  };

  res.json({
    summary,
    needsVsOffers: {
      categories: RESOURCE_TYPES,
      needs: totalNeeds,
      offers: totalOffers,
      unassignedNeeds,
      assignedNeeds,
    },
    unmetDemand,
    demandCoverage,
    predictedShortfalls,
    locationHeatmap: locationHeatmapArray,
    mapData,
    ngoMapData,
    ngoCapacity,
    resourceTypes: RESOURCE_TYPES,
  });
});

// GET /api/analytics/resource-trend - Get resource demand trends over time
const getResourceTrend = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  const daysCount = parseInt(days);

  const trends = [];
  
  for (let i = daysCount - 1; i >= 0; i--) {
    const startOfDay = new Date();
    startOfDay.setDate(startOfDay.getDate() - i);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const dayRequests = await Request.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const dayNeeds = {};
    RESOURCE_TYPES.forEach((type) => {
      dayNeeds[type] = 0;
    });

    dayRequests.forEach((request) => {
      request.needs?.forEach((need) => {
        if (RESOURCE_TYPES.includes(need.type)) {
          dayNeeds[need.type] += need.quantity || 0;
        }
      });
    });

    trends.push({
      date: startOfDay.toISOString().split("T")[0],
      requests: dayRequests.length,
      needs: dayNeeds,
    });
  }

  res.json({ trends, resourceTypes: RESOURCE_TYPES });
});

module.exports = {
  getCrisisLoadDashboard,
  getResourceTrend,
};
