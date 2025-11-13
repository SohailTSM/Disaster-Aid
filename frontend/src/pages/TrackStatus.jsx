import { useState } from "react";
import { requestService } from "../services/api";
import { toast } from "react-toastify";
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon,
  LocalShipping as TransitIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";

const TrackStatus = () => {
  const [requestId, setRequestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState(null);
  const [assignments, setAssignments] = useState([]);

  const handleSearch = async () => {
    if (!requestId.trim()) {
      toast.error("Please enter a Request ID");
      return;
    }

    try {
      setLoading(true);
      const response = await requestService.getRequestByRequestId(requestId);
      setRequest(response.request);

      // Group assignments by NGO from the request needs
      if (response.request?.needs?.some((need) => need.assignedTo)) {
        const assignmentsByNgo = response.request.needs.reduce((acc, need) => {
          if (need.assignedTo) {
            if (!acc[need.assignedTo]) {
              acc[need.assignedTo] = {
                ngoId: need.assignedTo,
                needs: [],
                status: need.assignmentStatus || "assigned",
              };
            }
            acc[need.assignedTo].needs.push(need);
          }
          return acc;
        }, {});

        setAssignments(Object.values(assignmentsByNgo));
      }

      toast.success("Request found!");
    } catch (error) {
      console.error("Error fetching request:", error);
      toast.error(
        error.response?.data?.message ||
          "Invalid Request ID. Please check and try again."
      );
      setRequest(null);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "New":
        return "default";
      case "Triaged":
        return "info";
      case "In-Progress":
        return "warning";
      case "Closed":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Closed":
        return <CheckCircleIcon />;
      case "In-Progress":
        return <TransitIcon />;
      default:
        return <PendingIcon />;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Track Request Status
        </Typography>
        <Typography
          variant="subtitle1"
          color="text.secondary"
          align="center"
          paragraph>
          Enter your 7-digit Request ID to track the status of your request
        </Typography>

        {/* Search Box */}
        <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
          <TextField
            fullWidth
            label="Request ID"
            placeholder="e.g., 1234567"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            inputProps={{ maxLength: 7 }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} /> : <SearchIcon />
            }
            sx={{ minWidth: 120 }}>
            {loading ? "Searching..." : "Track"}
          </Button>
        </Box>

        {/* Results */}
        {request && (
          <Box>
            {/* Request Info */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}>
                  <Typography variant="h6">
                    Request #{request.requestId}
                  </Typography>
                  <Chip
                    icon={getStatusIcon(request.status)}
                    label={request.status}
                    color={getStatusColor(request.status)}
                  />
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Contact Name
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {request.contactName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {request.addressText}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Requested Needs
                    </Typography>
                    <Box
                      sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                      {request.needs?.map((need, idx) => (
                        <Chip
                          key={idx}
                          label={`${need.type}: ${need.quantity}`}
                          size="small"
                          color={
                            need.assignmentStatus === "assigned"
                              ? "success"
                              : "default"
                          }
                          variant={
                            need.assignmentStatus === "assigned"
                              ? "filled"
                              : "outlined"
                          }
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Current Status */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Status
                </Typography>
                <Box
                  sx={{
                    p: 3,
                    bgcolor:
                      request.status === "Closed"
                        ? "success.light"
                        : request.status === "In-Progress"
                        ? "warning.light"
                        : request.status === "Triaged"
                        ? "info.light"
                        : "grey.100",
                    borderRadius: 2,
                    textAlign: "center",
                  }}>
                  <Chip
                    icon={getStatusIcon(request.status)}
                    label={request.status}
                    color={getStatusColor(request.status)}
                    sx={{ mb: 2, fontSize: "1rem", py: 2.5 }}
                  />

                  {request.status === "New" && (
                    <Box>
                      <Typography variant="body1" paragraph>
                        Your request has been received and logged into our
                        system.
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Our dispatchers are reviewing your request and will
                        assign it to an appropriate relief organization shortly.
                        You will be contacted once an organization is assigned.
                      </Typography>
                    </Box>
                  )}

                  {request.status === "Triaged" && (
                    <Box>
                      <Typography variant="body1" paragraph>
                        Your request is being processed and prioritized.
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Our team has reviewed your needs and is coordinating
                        with relief organizations to fulfill your request. An
                        organization will be assigned soon.
                      </Typography>
                    </Box>
                  )}

                  {request.status === "In-Progress" && (
                    <Box>
                      <Typography variant="body1" paragraph>
                        Relief organizations are actively working on your
                        request!
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Your assigned organization(s) are preparing and
                        coordinating the delivery of supplies. They may contact
                        you for additional details or to confirm delivery
                        arrangements.
                      </Typography>
                    </Box>
                  )}

                  {request.status === "Closed" && (
                    <Box>
                      <Typography
                        variant="body1"
                        paragraph
                        sx={{ fontWeight: "bold", color: "success.dark" }}>
                        Your request has been completed successfully!
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        The relief supplies have been delivered and your request
                        is now closed. We hope the assistance provided has been
                        helpful. Stay safe!
                      </Typography>
                    </Box>
                  )}

                  <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                    Last updated:{" "}
                    {request.updatedAt
                      ? new Date(request.updatedAt).toLocaleString()
                      : new Date(request.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Assigned NGOs */}
            {assignments.length > 0 && request.status !== "Closed" && (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  Good News!
                </Typography>
                <Typography variant="body2">
                  Relief organization(s) have been assigned to your request.
                  They will contact you at the phone number you provided to
                  coordinate delivery.
                </Typography>
              </Alert>
            )}

            {assignments.length === 0 && request.status === "New" && (
              <Alert severity="info">
                Your request is being reviewed. An NGO will be assigned shortly.
              </Alert>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default TrackStatus;
