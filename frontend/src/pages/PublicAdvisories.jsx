import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { advisoryService } from "../services/api";
import { toast } from "react-toastify";

const PublicAdvisories = () => {
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdvisories();
  }, []);

  const fetchAdvisories = async () => {
    try {
      setLoading(true);
      const response = await advisoryService.getActiveAdvisories();
      setAdvisories(response.advisories);
    } catch (error) {
      console.error("Error fetching advisories:", error);
      toast.error("Failed to load advisories");
    } finally {
      setLoading(false);
    }
  };

  const activeAdvisories = advisories.filter((a) => a.active);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "High":
        return "error";
      case "Medium":
        return "warning";
      case "Low":
        return "info";
      default:
        return "default";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "High":
        return <ErrorIcon />;
      case "Medium":
        return <WarningIcon />;
      case "Low":
        return <InfoIcon />;
      default:
        return <InfoIcon />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Emergency Advisories
        </Typography>
        <Typography
          variant="subtitle1"
          color="text.secondary"
          align="center"
          paragraph>
          Important announcements and safety information from disaster
          management authorities
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : activeAdvisories.length === 0 ? (
          <Alert severity="info" sx={{ mt: 3 }}>
            No active advisories at this time. Please check back regularly for
            updates.
          </Alert>
        ) : (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {activeAdvisories.map((advisory) => (
              <Grid item xs={12} key={advisory._id}>
                <Card
                  variant="outlined"
                  sx={{
                    borderLeft: 6,
                    borderLeftColor:
                      advisory.severity === "High"
                        ? "error.main"
                        : advisory.severity === "Medium"
                        ? "warning.main"
                        : "info.main",
                  }}>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}>
                      {getSeverityIcon(advisory.severity)}
                      <Typography variant="h5" component="h2">
                        {advisory.title}
                      </Typography>
                      <Chip
                        label={advisory.severity}
                        color={getSeverityColor(advisory.severity)}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    <Typography
                      variant="body1"
                      paragraph
                      sx={{ whiteSpace: "pre-line" }}>
                      {advisory.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Posted: {new Date(advisory.createdAt).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Box sx={{ mt: 4, p: 2, bgcolor: "info.lighter", borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            For immediate emergency assistance, please call 911 or contact your
            local emergency services.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default PublicAdvisories;
