import { useState, useEffect, useRef } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Avatar,
  InputAdornment,
  IconButton,
  Alert,
  Grid,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Divider,
} from "@mui/material";
import {
  PersonAdd,
  Visibility,
  VisibilityOff,
  MyLocation,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

const NEEDS_TYPES = [
  { value: "rescue", label: "Rescue" },
  { value: "food", label: "Food" },
  { value: "water", label: "Water" },
  { value: "medical", label: "Medical" },
  { value: "shelter", label: "Shelter" },
  { value: "baby_supplies", label: "Baby Supplies" },
  { value: "sanitation", label: "Sanitation" },
  { value: "transport", label: "Transport" },
  { value: "power_charging", label: "Power/Charging" },
];

const registerSchema = yup.object().shape({
  ngoName: yup.string().required("NGO name is required"),
  headName: yup.string().required("NGO head name is required"),
  contact: yup.string().required("Contact number is required"),
  address: yup.string().required("Address is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords must match")
    .required("Please confirm your password"),
  selectedOffers: yup.array().min(1, "Please select at least one offer"),
});

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [position, setPosition] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const mapContainerRef = useRef(null);

  const [offersQuantities, setOffersQuantities] = useState({});

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      ngoName: "",
      headName: "",
      contact: "",
      address: "",
      email: "",
      password: "",
      confirmPassword: "",
      selectedOffers: [],
    },
  });

  const selectedOffers = watch("selectedOffers") || [];
  const addressText = watch("address") || "";

  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const initMap = () => {
      if (!mapContainerRef.current) return;

      // Avoid re-initializing if map already exists
      if (map) return;

      try {
        const newMap = window.L.map(mapContainerRef.current).setView(
          [30.3753, 69.3451],
          6
        );

        window.L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 19,
          }
        ).addTo(newMap);

        let currentMarker = null;

        newMap.on("click", (e) => {
          const { lat, lng } = e.latlng;
          setPosition([lng, lat]);

          if (currentMarker) {
            // Update existing marker position
            currentMarker.setLatLng([lat, lng]);
          } else {
            // Create new marker only if none exists
            currentMarker = window.L.marker([lat, lng], {
              draggable: true,
            }).addTo(newMap);

            currentMarker.on("dragend", (event) => {
              const pos = event.target.getLatLng();
              setPosition([pos.lng, pos.lat]);
              reverseGeocode(pos.lat, pos.lng);
            });

            setMarker(currentMarker);
          }
          reverseGeocode(lat, lng);
        });

        setMap(newMap);
      } catch (error) {
        console.error("Map initialization error:", error);
      }
    };

    if (!window.L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (map) {
        map.remove();
        setMap(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      if (data.display_name) {
        setValue("address", data.display_name);
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPosition([longitude, latitude]);

        if (map) {
          map.setView([latitude, longitude], 13);

          // Get all markers on the map
          const markers = [];
          map.eachLayer((layer) => {
            if (layer instanceof window.L.Marker) {
              markers.push(layer);
            }
          });

          if (markers.length > 0) {
            // Update existing marker position
            markers[0].setLatLng([latitude, longitude]);
          } else {
            // Create new marker only if none exists
            const newMarker = window.L.marker([latitude, longitude], {
              draggable: true,
            }).addTo(map);
            newMarker.on("dragend", (event) => {
              const pos = event.target.getLatLng();
              setPosition([pos.lng, pos.lat]);
              reverseGeocode(pos.lat, pos.lng);
            });
            setMarker(newMarker);
          }

          reverseGeocode(latitude, longitude);
        }

        setLocationLoading(false);
      },
      (error) => {
        setLocationError(error.message);
        setLocationLoading(false);
      }
    );
  };

  const handleOfferToggle = (offerValue) => {
    const currentOffers = selectedOffers || [];
    if (currentOffers.includes(offerValue)) {
      setValue(
        "selectedOffers",
        currentOffers.filter((n) => n !== offerValue)
      );
      const newQuantities = { ...offersQuantities };
      delete newQuantities[offerValue];
      setOffersQuantities(newQuantities);
    } else {
      setValue("selectedOffers", [...currentOffers, offerValue]);
      setOffersQuantities({ ...offersQuantities, [offerValue]: 1 });
    }
  };

  const handleQuantityChange = (offerValue, quantity) => {
    setOffersQuantities({
      ...offersQuantities,
      [offerValue]: Math.max(1, parseInt(quantity) || 1),
    });
  };

  const onSubmit = async (data) => {
    try {
      setError("");
      setLoading(true);

      if (!position) {
        throw new Error("Please pin your NGO location on the map");
      }

      if (selectedOffers.length === 0) {
        throw new Error("Please select at least one offer");
      }

      const offers = selectedOffers.map((offerType) => ({
        type: offerType,
        quantity: offersQuantities[offerType] || 1,
      }));

      const userData = {
        name: data.headName,
        email: data.email,
        password: data.password,
        role: "ngo_member",
        organization: {
          name: data.ngoName,
          headName: data.headName,
          contactEmail: data.email,
          contactPhone: data.contact,
          address: data.address,
          location: {
            type: "Point",
            coordinates: position,
          },
          offers: offers,
        },
      };

      await registerUser(userData);
      setSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to register NGO. Please try again."
      );
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom color="success.main">
              ✓ NGO Registration Submitted Successfully!
            </Typography>
            <Typography variant="body1" paragraph sx={{ mt: 3 }}>
              Thank you for registering your NGO with our disaster aid platform.
            </Typography>
            <Typography variant="body1" paragraph>
              Our team will review and verify your information. After
              verification and approval, you will be able to log in using the
              credentials you provided.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              You will receive a notification once your NGO is approved.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate("/login")}
            sx={{ mt: 2 }}>
            Go to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="lg">
      <Box
        sx={{
          marginTop: 4,
          marginBottom: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
        <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
          <PersonAdd />
        </Avatar>
        <Typography component="h1" variant="h5">
          Register Your NGO
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Join our network of NGOs to help disaster victims
        </Typography>

        <Paper elevation={3} sx={{ p: 4, mt: 3, width: "100%" }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Typography variant="h6" gutterBottom>
              NGO Information
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  id="ngoName"
                  label="NGO Name"
                  name="ngoName"
                  autoFocus
                  error={!!errors.ngoName}
                  helperText={errors.ngoName?.message}
                  {...register("ngoName")}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  id="headName"
                  label="Name of NGO Head"
                  name="headName"
                  error={!!errors.headName}
                  helperText={errors.headName?.message}
                  {...register("headName")}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  id="contact"
                  label="Contact Number"
                  name="contact"
                  error={!!errors.contact}
                  helperText={errors.contact?.message}
                  {...register("contact")}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  {...register("email")}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="address"
                  label="Address"
                  name="address"
                  multiline
                  rows={2}
                  value={addressText}
                  onChange={(e) => setValue("address", e.target.value)}
                  error={!!errors.address}
                  helperText={errors.address?.message}
                />
              </Grid>

              <Grid item xs={12}>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      NGO Location *
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<MyLocation />}
                      onClick={handleGetLocation}
                      disabled={locationLoading}>
                      {locationLoading ? "Locating..." : "Use My Location"}
                    </Button>
                  </Box>

                  {locationError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {locationError}
                    </Alert>
                  )}

                  <Box
                    ref={mapContainerRef}
                    sx={{
                      height: 300,
                      width: "100%",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  />
                  <FormHelperText>
                    Click on the map to pin your NGO location or use "Use My
                    Location" button
                  </FormHelperText>
                  {!position && (
                    <FormHelperText error>
                      Please pin your location on the map
                    </FormHelperText>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Services Offered
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Select the services your NGO can provide and specify
                  quantities
                </Typography>

                <FormGroup>
                  <Grid container spacing={2}>
                    {NEEDS_TYPES.map((need) => (
                      <Grid item xs={12} sm={6} md={4} key={need.value}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={selectedOffers.includes(need.value)}
                                onChange={() => handleOfferToggle(need.value)}
                              />
                            }
                            label={need.label}
                          />
                          {selectedOffers.includes(need.value) && (
                            <TextField
                              type="number"
                              size="small"
                              label="Qty"
                              value={offersQuantities[need.value] || 1}
                              onChange={(e) =>
                                handleQuantityChange(need.value, e.target.value)
                              }
                              inputProps={{ min: 1 }}
                              sx={{ width: 80 }}
                            />
                          )}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </FormGroup>
                {errors.selectedOffers && (
                  <FormHelperText error>
                    {errors.selectedOffers.message}
                  </FormHelperText>
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Account Credentials
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  autoComplete="new-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  {...register("password")}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          edge="end">
                          {showConfirmPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading || !position}>
                  {loading ? "Registering NGO..." : "Register NGO"}
                </Button>

                <Box sx={{ textAlign: "center" }}>
                  <Link component={RouterLink} to="/login" variant="body2">
                    Already have an account? Sign in
                  </Link>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
