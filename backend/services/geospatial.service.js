const Organization = require("../models/organization.model");

/**
 * Calculate distance between two points using Haversine formula
 * @param {Array} coord1 - [longitude, latitude]
 * @param {Array} coord2 - [longitude, latitude]
 * @returns {number} - Distance in kilometers
 */
const calculateDistance = (coord1, coord2) => {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Find matching NGOs for a request based on geospatial proximity, availability, and capacity
 * @param {Object} request - The request object with location and needs
 * @param {Object} options - Optional parameters (maxDistance, limit)
 * @returns {Array} - Sorted array of NGOs with distance and availability info
 */
const findMatchingNGOs = async (request, options = {}) => {
  const { maxDistance = 100, limit = 20 } = options; // Default 100km radius, max 20 results

  if (!request.location || !request.location.coordinates) {
    throw new Error("Request must have valid location coordinates");
  }

  const requestCoords = request.location.coordinates;
  const requestNeeds = request.needs || [];

  // Find all verified/approved and non-suspended NGOs using MongoDB geospatial query
  // NGO is valid if: (approved OR verificationStatus is verified) AND not suspended
  const nearbyNGOs = await Organization.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: requestCoords,
        },
        distanceField: "distance",
        maxDistance: maxDistance * 1000, // Convert km to meters
        spherical: true,
        query: {
          $or: [
            { approved: true },
            { verificationStatus: "verified" }
          ],
          suspended: { $ne: true },
        },
      },
    },
    {
      $limit: limit,
    },
  ]);

  // Calculate matching score for each NGO based on availability and capacity
  const scoredNGOs = nearbyNGOs.map((ngo) => {
    const distanceKm = (ngo.distance / 1000).toFixed(1);
    
    // Calculate resource match score
    let totalMatchScore = 0;
    let matchedNeeds = [];
    let availableResources = [];

    requestNeeds.forEach((need) => {
      const offer = ngo.offers?.find((o) => o.type === need.type);
      if (offer) {
        const capacityRatio = Math.min(offer.quantity / need.quantity, 1);
        totalMatchScore += capacityRatio * 10; // Weight each match by capacity (max 10 points per need)
        
        matchedNeeds.push({
          type: need.type,
          requested: need.quantity,
          available: offer.quantity,
          canFulfill: offer.quantity >= need.quantity,
        });

        availableResources.push({
          type: offer.type,
          quantity: offer.quantity,
        });
      }
    });

    // Calculate overall score (higher is better)
    // Distance score: closer is better (inverse relationship)
    const distanceScore = Math.max(0, 100 - parseFloat(distanceKm));
    
    // Availability score: based on how many needs can be fulfilled
    const availabilityScore = totalMatchScore;
    
    // Combined score: 40% distance, 60% availability
    const combinedScore = (distanceScore * 0.4) + (availabilityScore * 0.6);

    return {
      _id: ngo._id,
      name: ngo.name,
      headName: ngo.headName,
      contactEmail: ngo.contactEmail,
      contactPhone: ngo.contactPhone,
      address: ngo.address,
      location: ngo.location,
      offers: ngo.offers,
      distance: parseFloat(distanceKm),
      distanceText: `${distanceKm} km away`,
      matchedNeeds,
      availableResources,
      matchScore: totalMatchScore,
      distanceScore,
      combinedScore: Math.round(combinedScore * 10) / 10,
      canPartiallyFulfill: matchedNeeds.length > 0,
      canFullyFulfill: matchedNeeds.every((m) => m.canFulfill),
    };
  });

  // Sort by combined score (descending) - best matches first
  scoredNGOs.sort((a, b) => b.combinedScore - a.combinedScore);

  return scoredNGOs;
};

/**
 * Find NGOs within a certain radius of a location
 * @param {Array} coordinates - [longitude, latitude]
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Array} - NGOs within the radius
 */
const findNGOsInRadius = async (coordinates, radiusKm = 50) => {
  const ngos = await Organization.find({
    $or: [
      { approved: true },
      { verificationStatus: "verified" }
    ],
    suspended: { $ne: true },
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: coordinates,
        },
        $maxDistance: radiusKm * 1000, // Convert to meters
      },
    },
  });

  // Calculate distances
  return ngos.map((ngo) => {
    const distance = calculateDistance(coordinates, ngo.location.coordinates);
    return {
      ...ngo.toObject(),
      distance,
      distanceText: `${distance} km away`,
    };
  });
};

module.exports = {
  calculateDistance,
  findMatchingNGOs,
  findNGOsInRadius,
};
