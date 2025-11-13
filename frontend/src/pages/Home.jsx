import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  Warning as WarningIcon,
  LocalHospital as MedicalIcon,
  Restaurant as FoodIcon,
  Home as ShelterIcon,
} from "@mui/icons-material";

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Public home page - show for everyone (logged in or not)
  return (
    <Box
      sx={{
        minHeight: "90vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        py: 8,
      }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box sx={{ textAlign: "center", color: "white", mb: 8 }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{ fontWeight: "bold", mb: 2 }}>
            Disaster Aid Management System
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
            Quick response. Coordinated relief. Saving lives together.
          </Typography>

          {/* Urgent Request Button */}
          <Button
            variant="contained"
            size="large"
            color="error"
            startIcon={<WarningIcon />}
            onClick={() => navigate("/request")}
            sx={{
              py: 2,
              px: 6,
              fontSize: "1.2rem",
              fontWeight: "bold",
              boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: "0 12px 24px rgba(0,0,0,0.4)",
              },
              transition: "all 0.3s ease",
            }}>
            URGENT REQUEST
          </Button>

          <Typography variant="body1" sx={{ mt: 2, opacity: 0.8 }}>
            Need immediate assistance? Submit your request now.
          </Typography>
        </Box>

        {/* Features Section */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: "100%",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
              }}>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <MedicalIcon
                  sx={{ fontSize: 60, color: "error.main", mb: 2 }}
                />
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}>
                  Emergency Relief
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Access medical aid, rescue services, and emergency supplies
                  during disasters.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: "100%",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
              }}>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <FoodIcon sx={{ fontSize: 60, color: "warning.main", mb: 2 }} />
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}>
                  Essential Supplies
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Food, water, shelter, and other critical resources delivered
                  to those in need.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: "100%",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
              }}>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <ShelterIcon sx={{ fontSize: 60, color: "info.main", mb: 2 }} />
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}>
                  Coordinated Response
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Connect with NGOs, dispatchers, and authorities for efficient
                  disaster management.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Additional Actions */}
        <Grid container spacing={3} sx={{ mt: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 4,
                textAlign: "center",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
              }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
                Track Your Request
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Already submitted a request? Track its status using your Request
                ID.
              </Typography>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/track-status")}
                sx={{ mt: 2 }}>
                Track Status
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 4,
                textAlign: "center",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
              }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
                Emergency Advisories
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                View important announcements and safety information from
                authorities.
              </Typography>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/advisories")}
                sx={{ mt: 2 }}>
                View Advisories
              </Button>
            </Paper>
          </Grid>
        </Grid>

        {/* Staff Login */}
        <Box sx={{ textAlign: "center", mt: 6 }}>
          <Typography variant="body1" sx={{ color: "white", mb: 2 }}>
            Are you a dispatcher, NGO member, or authority?
          </Typography>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate("/login")}
            sx={{
              color: "white",
              borderColor: "white",
              "&:hover": {
                borderColor: "white",
                background: "rgba(255, 255, 255, 0.1)",
              },
            }}>
            Login Here
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Home;
