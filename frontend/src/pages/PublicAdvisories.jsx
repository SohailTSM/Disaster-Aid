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
} from "@mui/material";
import {
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";

const PublicAdvisories = () => {
  // For now using mock data - in production, this would fetch from backend API
  const [advisories] = useState([
    {
      id: 1,
      title: "Flood Alert - Northern Districts",
      content:
        "Heavy rainfall expected in the next 48 hours. Residents in low-lying areas are advised to move to higher ground. Emergency shelters are available at City Hall, Central School, and Community Center.",
      severity: "High",
      createdAt: new Date().toISOString(),
      active: true,
    },
    {
      id: 2,
      title: "Emergency Shelter Locations",
      content:
        "Three emergency shelters have been opened: 1) City Hall (123 Main St) - Capacity 500, 2) Central School (456 School Rd) - Capacity 300, 3) Community Center (789 Community Ave) - Capacity 400. All shelters are equipped with food, water, blankets, and medical supplies.",
      severity: "Medium",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      active: true,
    },
    {
      id: 3,
      title: "Water Supply Advisory",
      content:
        "Boil water before consumption. Water purification tablets are available at all emergency shelters and distribution centers. Expected duration: 3-5 days.",
      severity: "High",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      active: true,
    },
    {
      id: 4,
      title: "Emergency Contact Numbers",
      content:
        "For immediate assistance: Emergency Hotline: 1-800-DISASTER. Medical Emergency: 911. Shelter Information: 1-800-SHELTER. NGO Coordination: 1-800-NGO-HELP.",
      severity: "Low",
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      active: true,
    },
  ]);

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

        {activeAdvisories.length === 0 ? (
          <Alert severity="info" sx={{ mt: 3 }}>
            No active advisories at this time. Please check back regularly for
            updates.
          </Alert>
        ) : (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {activeAdvisories.map((advisory) => (
              <Grid item xs={12} key={advisory.id}>
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
