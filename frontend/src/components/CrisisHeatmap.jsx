import { useEffect } from "react";
import { MapContainer, TileLayer, Circle, Popup, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Box, Typography, Chip, Stack } from "@mui/material";

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom NGO marker icon
const ngoIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Get color based on priority/urgency
const getUrgencyColor = (priority, isSoS) => {
  if (isSoS || priority === "sos") return "#d32f2f"; // Red for SOS
  if (priority === "high") return "#f57c00"; // Orange for high
  if (priority === "medium") return "#fbc02d"; // Yellow for medium
  return "#4caf50"; // Green for low
};

// Get circle radius based on urgency and needs
const getCircleRadius = (urgencyScore, totalNeeds, beneficiaries) => {
  // Base radius in meters
  const baseRadius = 300;
  // Scale by urgency (1-4)
  const urgencyMultiplier = urgencyScore * 0.5;
  // Scale by total needs (log scale to prevent huge circles)
  const needsMultiplier = Math.log10(totalNeeds + 1) * 0.3;
  // Scale by beneficiaries
  const beneficiaryMultiplier = Math.log10(beneficiaries + 1) * 0.2;
  
  return baseRadius * (1 + urgencyMultiplier + needsMultiplier + beneficiaryMultiplier);
};

// Format resource type for display
const formatResourceType = (type) => {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Component to fit map bounds to markers
const FitBounds = ({ requests, ngos }) => {
  const map = useMap();

  useEffect(() => {
    const allPoints = [
      ...requests.map((r) => [r.lat, r.lng]),
      ...ngos.map((n) => [n.lat, n.lng]),
    ];

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [requests, ngos, map]);

  return null;
};

const CrisisHeatmap = ({ 
  requests = [], 
  ngos = [], 
  height = 500, 
  showNGOs = true,
  showLegend = true,
  centerLat = 17.385, // Default to Hyderabad
  centerLng = 78.4867,
  zoom = 10,
}) => {
  // Calculate map center from data if available
  const calculateCenter = () => {
    const allPoints = [...requests, ...ngos];
    if (allPoints.length === 0) return [centerLat, centerLng];
    
    const avgLat = allPoints.reduce((sum, p) => sum + p.lat, 0) / allPoints.length;
    const avgLng = allPoints.reduce((sum, p) => sum + p.lng, 0) / allPoints.length;
    return [avgLat, avgLng];
  };

  const center = calculateCenter();

  return (
    <Box sx={{ position: "relative" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: `${height}px`, width: "100%", borderRadius: "8px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto-fit bounds */}
        {(requests.length > 0 || ngos.length > 0) && (
          <FitBounds requests={requests} ngos={ngos} />
        )}

        {/* Request circles */}
        {requests.map((request) => {
          const color = getUrgencyColor(request.priority, request.isSoS);
          const radius = getCircleRadius(
            request.urgencyScore,
            request.totalNeeds,
            request.beneficiaries
          );

          return (
            <Circle
              key={request.id}
              center={[request.lat, request.lng]}
              radius={radius}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.35,
                weight: 2,
                opacity: 0.8,
              }}
            >
              <Popup>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Request #{request.requestId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {request.addressText}
                  </Typography>
                  
                  <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: "wrap", gap: 0.5 }}>
                    <Chip
                      label={request.isSoS ? "SOS" : request.priority?.toUpperCase()}
                      size="small"
                      color={
                        request.isSoS ? "error" :
                        request.priority === "high" ? "warning" :
                        request.priority === "medium" ? "info" : "success"
                      }
                    />
                    <Chip label={request.status} size="small" variant="outlined" />
                  </Stack>

                  <Typography variant="body2">
                    <strong>Beneficiaries:</strong> {request.beneficiaries}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Needs:</strong> {request.needTypes.map(formatResourceType).join(", ")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Created: {new Date(request.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              </Popup>
            </Circle>
          );
        })}

        {/* NGO markers */}
        {showNGOs && ngos.map((ngo) => (
          <Marker
            key={ngo.id}
            position={[ngo.lat, ngo.lng]}
            icon={ngoIcon}
          >
            <Popup>
              <Box sx={{ minWidth: 180 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  🏥 {ngo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {ngo.address}
                </Typography>
                <Typography variant="body2">
                  <strong>Total Capacity:</strong> {ngo.totalCapacity}
                </Typography>
                {ngo.offers?.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" fontWeight="bold">Resources:</Typography>
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                      {ngo.offers.slice(0, 4).map((offer) => (
                        <Chip
                          key={offer.type}
                          label={`${formatResourceType(offer.type)}: ${offer.quantity}`}
                          size="small"
                          variant="outlined"
                          color="success"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      {showLegend && (
        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            right: 16,
            bgcolor: "background.paper",
            p: 1.5,
            borderRadius: 1,
            boxShadow: 2,
            zIndex: 1000,
          }}
        >
          <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
            Priority Legend
          </Typography>
          <Stack spacing={0.5}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: "#d32f2f", opacity: 0.7 }} />
              <Typography variant="caption">SOS / Critical</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: "#f57c00", opacity: 0.7 }} />
              <Typography variant="caption">High Priority</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: "#fbc02d", opacity: 0.7 }} />
              <Typography variant="caption">Medium Priority</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: "#4caf50", opacity: 0.7 }} />
              <Typography variant="caption">Low Priority</Typography>
            </Box>
            {showNGOs && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, pt: 0.5, borderTop: "1px solid #eee" }}>
                <Box sx={{ width: 16, height: 16, bgcolor: "#4caf50", borderRadius: "2px" }} />
                <Typography variant="caption">NGO Location</Typography>
              </Box>
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontSize: "0.65rem" }}>
            Circle size = Urgency + Needs
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CrisisHeatmap;
