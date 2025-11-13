import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Alert,
  Grid,
  FormHelperText,
  Chip,
  CircularProgress,
  Stack,
  Divider,
  Radio,
  RadioGroup,
  FormLabel,
  IconButton,
} from "@mui/material";
import {
  MyLocation,
  SignalCellularAlt,
  BatteryFull,
  Warning,
  Close as CloseIcon,
  CloudUpload,
} from "@mui/icons-material";
import { requestService } from "../services/api";

const NEEDS_OPTIONS = [
  { value: "rescue", label: "Rescue" },
  { value: "food", label: "Food" },
  { value: "water", label: "Water" },
  { value: "medical", label: "Medical Assistance" },
  { value: "shelter", label: "Shelter" },
  { value: "baby_supplies", label: "Baby Supplies" },
  { value: "sanitation", label: "Sanitation" },
  { value: "transport", label: "Transport" },
  { value: "power_charging", label: "Power/Charging" },
];

const requestSchema = yup.object().shape({
  contactName: yup.string().required("Name is required"),
  contactPhone: yup
    .string()
    .matches(/^[0-9]{10}$/, "Phone number must be 10 digits")
    .required("Phone number is required"),
  preferredCommunication: yup
    .string()
    .oneOf(["call", "sms"], "Please select a communication method")
    .required("Communication method is required"),
  language: yup.string().required("Preferred language is required"),
  addressText: yup.string().required("Address is required"),
  additionalAddressDetails: yup.string(),
  beneficiaries_children: yup
    .number()
    .typeError("Please enter a valid number")
    .min(0, "Cannot be negative")
    .integer("Must be a whole number")
    .required("Required"),
  beneficiaries_adults: yup
    .number()
    .typeError("Please enter a valid number")
    .min(0, "Cannot be negative")
    .integer("Must be a whole number")
    .required("Required"),
  beneficiaries_elderly: yup
    .number()
    .typeError("Please enter a valid number")
    .min(0, "Cannot be negative")
    .integer("Must be a whole number")
    .required("Required"),
  selectedNeeds: yup
    .array()
    .min(1, "Please select at least one need")
    .required("Please select at least one need"),
  specialNeeds: yup.string(),
});

export default function RequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [position, setPosition] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const mapContainerRef = useRef(null);

  const [batteryLevel, setBatteryLevel] = useState(null);
  const [networkStrength, setNetworkStrength] = useState(null);

  const [needsQuantities, setNeedsQuantities] = useState({});
  const [evidenceFiles, setEvidenceFiles] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm({
    resolver: yupResolver(requestSchema),
    defaultValues: {
      contactName: "",
      contactPhone: "",
      preferredCommunication: "call",
      language: "English",
      addressText: "",
      additionalAddressDetails: "",
      beneficiaries_children: 0,
      beneficiaries_adults: 0,
      beneficiaries_elderly: 0,
      selectedNeeds: [],
      specialNeeds: "",
    },
  });

  const selectedNeeds = watch("selectedNeeds") || [];
  const addressText = watch("addressText") || "";

  const initializeMap = () => {
    if (!mapContainerRef.current) return;

    // Avoid re-initializing if map already exists
    if (map) return;

    try {
      const newMap = window.L.map(mapContainerRef.current).setView(
        [20.5937, 78.9629],
        5
      );

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(newMap);

      const newMarker = window.L.marker([20.5937, 78.9629], {
        draggable: true,
      }).addTo(newMap);

      newMarker.on("dragend", function (e) {
        const pos = e.target.getLatLng();
        setPosition([pos.lng, pos.lat]);
        reverseGeocode(pos.lat, pos.lng);
      });

      newMap.on("click", function (e) {
        newMarker.setLatLng(e.latlng);
        setPosition([e.latlng.lng, e.latlng.lat]);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      setMap(newMap);
      setMarker(newMarker);

      requestCurrentLocation(newMap, newMarker);
    } catch (error) {
      console.error("Map initialization error:", error);
    }
  };

  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!window.L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initializeMap;
      document.body.appendChild(script);
    } else {
      initializeMap();
    }

    return () => {
      if (map) {
        map.remove();
        setMap(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestCurrentLocation = (mapInstance, markerInstance) => {
    setLocationLoading(true);
    setLocationError("");

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const latlng = [latitude, longitude];

          mapInstance.setView(latlng, 15);
          markerInstance.setLatLng(latlng);
          setPosition([longitude, latitude]);
          reverseGeocode(latitude, longitude);
          setLocationLoading(false);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setLocationError(
            "Unable to get your location. Please pin your location manually on the map."
          );
          setLocationLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser");
      setLocationLoading(false);
    }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();

      if (data.display_name) {
        setValue("addressText", data.display_name);
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
  };

  const handleRetryLocation = () => {
    if (map && marker) {
      requestCurrentLocation(map, marker);
    }
  };

  useEffect(() => {
    if ("getBattery" in navigator) {
      navigator
        .getBattery()
        .then((battery) => {
          const updateBattery = () => {
            setBatteryLevel(Math.round(battery.level * 100));
          };

          updateBattery();
          battery.addEventListener("levelchange", updateBattery);

          return () => {
            battery.removeEventListener("levelchange", updateBattery);
          };
        })
        .catch((err) => {
          console.error("Battery API error:", err);
        });
    }
  }, []);

  useEffect(() => {
    if (
      "connection" in navigator ||
      "mozConnection" in navigator ||
      "webkitConnection" in navigator
    ) {
      const connection =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;

      const updateNetwork = () => {
        if (connection.effectiveType) {
          const strengthMap = {
            "slow-2g": 25,
            "2g": 50,
            "3g": 75,
            "4g": 100,
          };
          setNetworkStrength(strengthMap[connection.effectiveType] || 0);
        }
      };

      updateNetwork();
      connection.addEventListener("change", updateNetwork);

      return () => {
        connection.removeEventListener("change", updateNetwork);
      };
    }
  }, []);

  const handleNeedToggle = (needType) => {
    const currentSelected = [...selectedNeeds];
    const index = currentSelected.indexOf(needType);

    if (index > -1) {
      currentSelected.splice(index, 1);
      const newQuantities = { ...needsQuantities };
      delete newQuantities[needType];
      setNeedsQuantities(newQuantities);
    } else {
      currentSelected.push(needType);
    }

    setValue("selectedNeeds", currentSelected);
  };

  const handleQuantityChange = (needType, value) => {
    setNeedsQuantities({
      ...needsQuantities,
      [needType]: value,
    });
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const isUnder10MB = file.size <= 10 * 1024 * 1024; // 10MB limit
      return (isImage || isVideo) && isUnder10MB;
    });

    if (validFiles.length !== files.length) {
      alert(
        "Some files were skipped. Only images and videos under 10MB are allowed."
      );
    }

    setEvidenceFiles((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    try {
      setError("");
      setLoading(true);

      if (!position) {
        throw new Error("Please pin your location on the map");
      }

      const totalBeneficiaries =
        (data.beneficiaries_children || 0) +
        (data.beneficiaries_adults || 0) +
        (data.beneficiaries_elderly || 0);

      if (totalBeneficiaries === 0) {
        throw new Error("Please specify at least one beneficiary");
      }

      // Convert needs array to include quantities
      const needsWithQuantities = data.selectedNeeds.map((needType) => ({
        type: needType,
        quantity: needsQuantities[needType] || totalBeneficiaries, // Default to total beneficiaries if not specified
      }));

      const requestData = {
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        preferredCommunication: data.preferredCommunication,
        language: data.language,
        location: {
          type: "Point",
          coordinates: position,
        },
        addressText: data.addressText,
        additionalAddressDetails: data.additionalAddressDetails || "",
        needs: needsWithQuantities,
        beneficiaries_children: data.beneficiaries_children || 0,
        beneficiaries_adults: data.beneficiaries_adults || 0,
        beneficiaries_elderly: data.beneficiaries_elderly || 0,
        specialNeeds: data.specialNeeds || "",
      };

      if (batteryLevel !== null) {
        requestData.deviceBattery = batteryLevel;
      }
      if (networkStrength !== null) {
        requestData.deviceNetwork = networkStrength;
      }

      // Handle file uploads if any
      if (evidenceFiles.length > 0) {
        // For now, we'll store file names. In production, you'd upload to cloud storage
        requestData.evidence = evidenceFiles.map((file) => file.name);
        // TODO: Implement actual file upload to cloud storage (AWS S3, Cloudinary, etc.)
      }

      const response = await requestService.createRequest(requestData);

      // Store the requestId from the response
      setSubmittedRequestId(response.requestId);
      setSubmitted(true);
      reset();
      setPosition(null);
      setNeedsQuantities({});
      setEvidenceFiles([]);
    } catch (err) {
      console.error("Request submission error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to submit request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom color="success.main">
              ✓ Request Submitted Successfully!
            </Typography>
            {submittedRequestId && (
              <Box
                sx={{ my: 3, p: 2, bgcolor: "primary.light", borderRadius: 2 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  color="primary.contrastText">
                  Your Request ID
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: "bold",
                    letterSpacing: 2,
                    fontFamily: "monospace",
                    color: "primary.contrastText",
                  }}>
                  {submittedRequestId}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mt: 1, color: "primary.contrastText" }}>
                  Please save this Request ID for future reference and tracking
                </Typography>
              </Box>
            )}
            <Typography color="text.secondary" paragraph>
              Thank you for reaching out. Your request has been received and our
              team will contact you shortly.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => {
              setSubmitted(false);
              setSubmittedRequestId(null);
            }}>
            Submit Another Request
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Request for Help
        </Typography>

        <Typography
          variant="subtitle1"
          color="text.secondary"
          align="center"
          paragraph>
          Please fill out this form to request assistance.
        </Typography>

        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "center",
            gap: 2,
            flexWrap: "wrap",
          }}>
          {batteryLevel !== null && (
            <Chip
              icon={<BatteryFull />}
              label={`Battery: ${batteryLevel}%`}
              color={
                batteryLevel < 20
                  ? "error"
                  : batteryLevel < 50
                  ? "warning"
                  : "success"
              }
              variant="outlined"
            />
          )}
          {networkStrength !== null && (
            <Chip
              icon={<SignalCellularAlt />}
              label={`Network: ${networkStrength}%`}
              color={
                networkStrength < 50
                  ? "error"
                  : networkStrength < 75
                  ? "warning"
                  : "success"
              }
              variant="outlined"
            />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Your Name"
                {...register("contactName")}
                error={!!errors.contactName}
                helperText={errors.contactName?.message}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                {...register("contactPhone")}
                error={!!errors.contactPhone}
                helperText={
                  errors.contactPhone?.message || "10-digit phone number"
                }
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Preferred Language"
                {...register("language")}
                error={!!errors.language}
                helperText={errors.language?.message}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormLabel component="legend" required>
                Preferred Communication Method
              </FormLabel>
              <RadioGroup
                row
                value={watch("preferredCommunication")}
                onChange={(e) =>
                  setValue("preferredCommunication", e.target.value)
                }>
                <FormControlLabel
                  value="call"
                  control={<Radio />}
                  label="Phone Call"
                />
                <FormControlLabel
                  value="sms"
                  control={<Radio />}
                  label="SMS/Text"
                />
              </RadioGroup>
              {errors.preferredCommunication && (
                <FormHelperText error>
                  {errors.preferredCommunication.message}
                </FormHelperText>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Location
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Pin your location on the map:
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={
                      locationLoading ? (
                        <CircularProgress size={16} />
                      ) : (
                        <MyLocation />
                      )
                    }
                    onClick={handleRetryLocation}
                    disabled={locationLoading}>
                    {locationLoading
                      ? "Getting Location..."
                      : "Use Current Location"}
                  </Button>
                </Stack>

                {locationError && (
                  <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
                    {locationError}
                  </Alert>
                )}

                <Box
                  ref={mapContainerRef}
                  sx={{
                    height: 400,
                    width: "100%",
                    border: "2px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    mb: 2,
                  }}
                />

                {position && (
                  <Typography variant="caption" color="text.secondary">
                    Coordinates: {position[1].toFixed(6)},{" "}
                    {position[0].toFixed(6)}
                  </Typography>
                )}
              </Box>

              <TextField
                fullWidth
                label="Address / Landmark"
                {...register("addressText")}
                value={addressText}
                onChange={(e) => setValue("addressText", e.target.value)}
                error={!!errors.addressText}
                helperText={
                  errors.addressText?.message || "Auto-filled from map"
                }
                required
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Address Details (Optional)"
                {...register("additionalAddressDetails")}
                placeholder="Floor number, building name, nearby landmarks, etc."
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Number of Beneficiaries
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Children (0-17 years)"
                {...register("beneficiaries_children")}
                error={!!errors.beneficiaries_children}
                helperText={errors.beneficiaries_children?.message}
                required
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Adults (18-64 years)"
                {...register("beneficiaries_adults")}
                error={!!errors.beneficiaries_adults}
                helperText={errors.beneficiaries_adults?.message}
                required
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Elderly (65+ years)"
                {...register("beneficiaries_elderly")}
                error={!!errors.beneficiaries_elderly}
                helperText={errors.beneficiaries_elderly?.message}
                required
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Type of Assistance Needed
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Select all that apply and specify quantity:
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormGroup>
                {NEEDS_OPTIONS.map((option) => {
                  const isSelected = selectedNeeds.includes(option.value);
                  return (
                    <Box
                      key={option.value}
                      sx={{
                        mb: 2,
                        p: 2,
                        border: "1px solid",
                        borderColor: isSelected ? "primary.main" : "divider",
                        borderRadius: 1,
                        bgcolor: isSelected ? "action.selected" : "transparent",
                      }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleNeedToggle(option.value)}
                              />
                            }
                            label={
                              <Typography variant="body1">
                                {option.label}
                              </Typography>
                            }
                          />
                        </Grid>
                        {isSelected && (
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              type="number"
                              size="small"
                              label={`Quantity of ${option.label}`}
                              value={needsQuantities[option.value] || ""}
                              onChange={(e) =>
                                handleQuantityChange(
                                  option.value,
                                  e.target.value
                                )
                              }
                              inputProps={{ min: 0 }}
                              helperText="Approximate quantity needed"
                            />
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  );
                })}
                {errors.selectedNeeds && (
                  <FormHelperText error>
                    {errors.selectedNeeds.message}
                  </FormHelperText>
                )}
              </FormGroup>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Additional Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Special Needs or Additional Notes"
                {...register("specialNeeds")}
                multiline
                rows={4}
                helperText="Any additional information that may help us"
              />
            </Grid>

            {/* Evidence Upload Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Evidence (Optional)
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Upload images or videos to help us understand your situation
                better (Max 10MB per file)
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  fullWidth>
                  Upload Images/Videos
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                  />
                </Button>

                {evidenceFiles.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Uploaded Files ({evidenceFiles.length}):
                    </Typography>
                    <Stack spacing={1}>
                      {evidenceFiles.map((file, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 1,
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 1,
                          }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}>
                            <Typography variant="body2">
                              {file.type.startsWith("image/") ? "🖼️" : "🎥"}
                            </Typography>
                            <Typography
                              variant="body2"
                              noWrap
                              sx={{ maxWidth: 300 }}>
                              {file.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveFile(index)}
                            color="error">
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading || !position}
                fullWidth
                sx={{ mt: 2 }}>
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
              {!position && (
                <FormHelperText error sx={{ textAlign: "center", mt: 1 }}>
                  Please pin your location on the map before submitting
                </FormHelperText>
              )}
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}
