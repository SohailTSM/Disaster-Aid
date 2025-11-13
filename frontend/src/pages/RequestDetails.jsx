import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  requestService,
  organizationService,
  assignmentService,
} from "../services/api";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Paper,
  Divider,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
  LocalShipping as LocalShippingIcon,
} from "@mui/icons-material";

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [request, setRequest] = useState(null);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNeed, setSelectedNeed] = useState(null);
  const [selectedNgo, setSelectedNgo] = useState("");
  const [openNgoDialog, setOpenNgoDialog] = useState(false);
  const [assignedNGOs, setAssignedNGOs] = useState({});

  // Load request data when component mounts
  useEffect(() => {
    const loadRequest = async () => {
      try {
        setLoading(true);
        console.log("Loading request with ID:", id);

        // First check if we have the request in location state
        const requestFromState = location.state?.request;

        if (requestFromState) {
          console.log("Using request from location state");
          setRequest(requestFromState);
        } else {
          // Fetch from API
          console.log("Fetching request from API");
          const response = await requestService.getRequestById(id);
          setRequest(response.request);
        }

        // Fetch all NGOs for assignment (we'll filter approved ones in the UI)
        const ngoResponse = await organizationService.getOrganizations();
        console.log("Loaded NGOs:", ngoResponse.organizations);
        setNgos(ngoResponse.organizations || []);

        setLoading(false);
      } catch (err) {
        console.error("Error loading request:", err);
        setError("Failed to load request details");
        toast.error("Failed to load request details");
        setLoading(false);
      }
    };

    loadRequest();
  }, [id, location.state]);

  // Just select the NGO for a need (no API call yet)
  const handleSelectNGO = (ngoId) => {
    if (!ngoId || !selectedNeed) {
      toast.error("Please select an NGO");
      return;
    }

    // Update local assignedNGOs state
    setAssignedNGOs((prev) => ({
      ...prev,
      [selectedNeed.type]: ngoId,
    }));

    const ngoName = ngos.find((ngo) => ngo._id === ngoId)?.name || "NGO";
    toast.success(`Selected ${ngoName} for ${selectedNeed.type}`);
    setOpenNgoDialog(false);
    setSelectedNeed(null);
  };

  const handleViewNGOs = (need) => {
    setSelectedNeed(need);
    setOpenNgoDialog(true);
  };

  const handleAssignAll = async () => {
    try {
      setLoading(true);

      // Group needs by NGO
      const ngoAssignments = {};
      Object.entries(assignedNGOs).forEach(([needType, ngoId]) => {
        if (!ngoAssignments[ngoId]) {
          ngoAssignments[ngoId] = [];
        }
        const need = request.needs.find((n) => n.type === needType);
        if (need) {
          ngoAssignments[ngoId].push(need);
        }
      });

      console.log("Creating assignments for NGOs:", ngoAssignments);

      // Create one assignment per NGO with all their needs
      const assignmentPromises = Object.entries(ngoAssignments).map(
        ([ngoId, needs]) => {
          const ngoName = ngos.find((ngo) => ngo._id === ngoId)?.name || "NGO";
          const needsText = needs
            .map((n) => `${n.type} (${n.quantity})`)
            .join(", ");

          console.log(`Creating assignment for ${ngoName}:`, needsText);

          return assignmentService.createAssignment({
            requestId: request._id,
            organizationId: ngoId,
            notes: `Assigned needs: ${needsText}`,
          });
        }
      );

      await Promise.all(assignmentPromises);

      toast.success(
        `Successfully assigned all needs to ${
          Object.keys(ngoAssignments).length
        } NGO(s)`
      );
      navigate("/dispatcher");
    } catch (err) {
      console.error("Error creating assignments:", err);
      toast.error(
        err.response?.data?.message ||
          "Failed to create assignments. Please try again."
      );
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    try {
      setLoading(true);
      // Update request status to Closed
      await requestService.updateRequest(request._id, { status: "Closed" });
      toast.info("Request has been declined and closed");
      navigate("/dispatcher");
    } catch (err) {
      console.error("Error declining request:", err);
      toast.error("Failed to decline request. Please try again.");
      setLoading(false);
    }
  };

  const getNgoName = (ngoId) => {
    if (!ngoId) return "Not assigned";
    const ngo = ngos.find((n) => n._id === ngoId);
    return ngo ? ngo.name : "Unknown NGO";
  };

  // Check for existing assignments when request loads
  useEffect(() => {
    if (request) {
      const initialAssignments = {};
      request.needs?.forEach((need) => {
        if (need.assignedTo) {
          initialAssignments[need.type] = need.assignedTo;
        }
      });
      setAssignedNGOs(initialAssignments);
    }
  }, [request]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: 2,
        }}>
        <CircularProgress />
        <Typography>Loading request details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/dispatcher")}
          sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (!request) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Request not found
        </Typography>
        <Button
          onClick={() => navigate("/dispatcher")}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  const allNeedsAssigned = request.needs.every(
    (need) => assignedNGOs[need.type]
  );

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button
        onClick={() => navigate("/dispatcher")}
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}>
        Back to Dashboard
      </Button>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Request Details
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                <strong>Request ID:</strong> {request.requestId}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Contact:</strong> {request.contactName}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Phone:</strong> {request.contactPhone}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Priority:</strong> {request.priority}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                <strong>Location:</strong> {request.addressText}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Beneficiaries:</strong>{" "}
                {(request.beneficiaries_adults || 0) +
                  (request.beneficiaries_children || 0) +
                  (request.beneficiaries_elderly || 0)}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Status:</strong> {request.status}
              </Typography>
              <Typography variant="subtitle1">
                <strong>SoS:</strong> {request.isSoS ? "Yes" : "No"}
              </Typography>
            </Grid>
          </Grid>
          {request.specialNeeds && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
              <Typography variant="subtitle2">Special Needs:</Typography>
              <Typography variant="body2">{request.specialNeeds}</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Required Assistance
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Need Type</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {request.needs.map((need, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {need.type}
                        {assignedNGOs[need.type] && (
                          <CheckCircleIcon color="success" fontSize="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{need.quantity}</TableCell>
                    <TableCell>
                      {assignedNGOs[need.type] ? (
                        <Chip
                          icon={<BusinessIcon />}
                          label={getNgoName(assignedNGOs[need.type])}
                          color="primary"
                          size="small"
                        />
                      ) : (
                        <Chip
                          label="Not assigned"
                          color="default"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewNGOs(need)}>
                        {assignedNGOs[need.type] ? "Change NGO" : "Assign NGO"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Assignment Summary */}
          {Object.keys(assignedNGOs).length > 0 && (
            <Box sx={{ mt: 3, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Assignment Summary:
              </Typography>
              {Object.entries(
                Object.entries(assignedNGOs).reduce(
                  (acc, [needType, ngoId]) => {
                    if (!acc[ngoId]) {
                      acc[ngoId] = [];
                    }
                    acc[ngoId].push(needType);
                    return acc;
                  },
                  {}
                )
              ).map(([ngoId, needTypes]) => (
                <Box key={ngoId} sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    <strong>{getNgoName(ngoId)}</strong> will handle:{" "}
                    {needTypes.join(", ")}
                    {needTypes.length > 1 && ` (${needTypes.length} needs)`}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {!allNeedsAssigned && request.needs.length > 0 && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                bgcolor: "warning.lighter",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "warning.main",
              }}>
              <Typography variant="body2" color="warning.dark">
                ⚠️ Please assign an NGO to all needs before proceeding.
                {request.needs.length - Object.keys(assignedNGOs).length}{" "}
                need(s) remaining.
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDecline}
              disabled={loading}>
              Decline Request
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAssignAll}
              disabled={!allNeedsAssigned || loading}
              startIcon={
                loading ? <CircularProgress size={20} /> : <LocalShippingIcon />
              }>
              {loading ? "Assigning..." : "Assign All & Complete"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={openNgoDialog}
        onClose={() => setOpenNgoDialog(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle>
          {selectedNeed &&
            `Assign NGO for ${selectedNeed.type} (${selectedNeed.quantity} needed)`}
        </DialogTitle>
        <DialogContent>
          {selectedNeed && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>NGO Name</TableCell>
                    <TableCell>Capabilities</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ngos
                    .filter(
                      (ngo) =>
                        (ngo.approved ||
                          ngo.verificationStatus === "verified") &&
                        !ngo.suspended &&
                        ngo.offers?.some(
                          (offer) => offer.type === selectedNeed.type
                        )
                    )
                    .map((ngo) => (
                      <TableRow key={ngo._id}>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}>
                            <BusinessIcon color="primary" />
                            {ngo.name}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {ngo.offers
                            ?.filter(
                              (offer) => offer.type === selectedNeed.type
                            )
                            .map((offer, idx) => (
                              <Chip
                                key={idx}
                                label={`${offer.type} (${offer.quantity} available)`}
                                size="small"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant={
                              assignedNGOs[selectedNeed.type] === ngo._id
                                ? "contained"
                                : "outlined"
                            }
                            size="small"
                            onClick={() => handleSelectNGO(ngo._id)}>
                            {assignedNGOs[selectedNeed.type] === ngo._id
                              ? "Selected"
                              : "Select"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  {ngos.filter(
                    (ngo) =>
                      (ngo.approved || ngo.verificationStatus === "verified") &&
                      !ngo.suspended &&
                      ngo.offers?.some(
                        (offer) => offer.type === selectedNeed.type
                      )
                  ).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ py: 2 }}>
                          No NGOs available for {selectedNeed.type}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNgoDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RequestDetails;
