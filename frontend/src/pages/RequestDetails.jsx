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
  TextField,
  IconButton,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
  LocalShipping as LocalShippingIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
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

  // Edit/Delete need states
  const [editingNeed, setEditingNeed] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editNeedType, setEditNeedType] = useState("");
  const [editNeedQuantity, setEditNeedQuantity] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [needToDelete, setNeedToDelete] = useState(null);

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

  const handleEditNeed = (need, index) => {
    setEditingNeed({ ...need, index });
    setEditNeedType(need.type);
    setEditNeedQuantity(need.quantity);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      await requestService.updateNeed(request._id, editingNeed.index, {
        type: editNeedType,
        quantity: editNeedQuantity,
      });

      // Refresh request data
      const response = await requestService.getRequestById(id);
      setRequest(response.request);
      toast.success("Need updated successfully");
      setEditDialogOpen(false);
      setEditingNeed(null);
    } catch (err) {
      console.error("Error updating need:", err);
      toast.error(err.response?.data?.message || "Failed to update need");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNeed = (need, index) => {
    setNeedToDelete({ ...need, index });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteNeed = async () => {
    try {
      setLoading(true);
      await requestService.deleteNeed(request._id, needToDelete.index);

      // Refresh request data
      const response = await requestService.getRequestById(id);
      setRequest(response.request);

      // Remove from assignedNGOs if it was selected
      const newAssignedNGOs = { ...assignedNGOs };
      delete newAssignedNGOs[needToDelete.type];
      setAssignedNGOs(newAssignedNGOs);

      toast.success("Need deleted successfully");
      setDeleteDialogOpen(false);
      setNeedToDelete(null);
    } catch (err) {
      console.error("Error deleting need:", err);
      toast.error(err.response?.data?.message || "Failed to delete need");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAll = async () => {
    try {
      setLoading(true);

      // Get only the unassigned/declined needs that have an NGO selected
      const needsToAssign = request.needs.filter(
        (need) =>
          (need.assignmentStatus === "unassigned" ||
            need.assignmentStatus === "declined") &&
          assignedNGOs[need.type]
      );

      if (needsToAssign.length === 0) {
        toast.info("No needs selected for assignment");
        setLoading(false);
        return;
      }

      // Group needs by NGO
      const ngoAssignments = {};
      needsToAssign.forEach((need) => {
        const ngoId = assignedNGOs[need.type];
        if (!ngoAssignments[ngoId]) {
          ngoAssignments[ngoId] = [];
        }
        ngoAssignments[ngoId].push(need.type);
      });

      console.log("Creating assignments for NGOs:", ngoAssignments);

      // Create one assignment per NGO with their specific needs
      const assignmentPromises = Object.entries(ngoAssignments).map(
        ([ngoId, needTypes]) => {
          const ngoName = ngos.find((ngo) => ngo._id === ngoId)?.name || "NGO";
          const needsText = needTypes.join(", ");

          console.log(`Creating assignment for ${ngoName}:`, needsText);

          return assignmentService.createAssignment({
            requestId: request._id,
            organizationId: ngoId,
            assignedNeeds: needTypes,
            notes: `Assigned needs: ${needsText}`,
          });
        }
      );

      await Promise.all(assignmentPromises);

      toast.success(
        `Successfully assigned ${needsToAssign.length} need(s) to ${
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

  // Check if all unassigned and not-declined needs have been selected for assignment
  const unassignedNeeds =
    request?.needs?.filter(
      (need) =>
        need.assignmentStatus === "unassigned" ||
        need.assignmentStatus === "declined"
    ) || [];

  const allNeedsAssigned = unassignedNeeds.every(
    (need) => assignedNGOs[need.type]
  );

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
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {request.needs.map((need, index) => {
                  const isAssigned = need.assignmentStatus === "assigned";
                  const isDeclined = need.assignmentStatus === "declined";
                  const canEdit = !isAssigned;

                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}>
                          {need.type}
                          {isAssigned && (
                            <CheckCircleIcon color="success" fontSize="small" />
                          )}
                          {isDeclined && (
                            <WarningIcon color="warning" fontSize="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{need.quantity}</TableCell>
                      <TableCell>
                        {isAssigned && (
                          <Chip label="Assigned" color="success" size="small" />
                        )}
                        {isDeclined && (
                          <Chip label="Declined" color="warning" size="small" />
                        )}
                        {!isAssigned && !isDeclined && (
                          <Chip
                            label={
                              assignedNGOs[need.type] ? "Selected" : "Available"
                            }
                            color={assignedNGOs[need.type] ? "info" : "default"}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {isAssigned && need.assignedTo ? (
                          <Chip
                            icon={<BusinessIcon />}
                            label={getNgoName(need.assignedTo)}
                            color="primary"
                            size="small"
                          />
                        ) : assignedNGOs[need.type] ? (
                          <Chip
                            icon={<BusinessIcon />}
                            label={getNgoName(assignedNGOs[need.type])}
                            color="info"
                            size="small"
                            variant="outlined"
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
                        <Box sx={{ display: "flex", gap: 1 }}>
                          {!isAssigned && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleViewNGOs(need)}>
                              {assignedNGOs[need.type] ? "Change" : "Select"}{" "}
                              NGO
                            </Button>
                          )}
                          {canEdit && (
                            <>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEditNeed(need, index)}
                                title="Edit need">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteNeed(need, index)}
                                title="Delete need"
                                disabled={request.needs.length === 1}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
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

          {!allNeedsAssigned && unassignedNeeds.length > 0 && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                bgcolor: "info.lighter",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "info.main",
              }}>
              <Typography variant="body2" color="info.dark">
                ℹ️ You can assign individual needs to NGOs or select multiple
                needs and assign them together.
                {unassignedNeeds.length -
                  Object.keys(assignedNGOs).filter((key) =>
                    unassignedNeeds.some((n) => n.type === key)
                  ).length}{" "}
                need(s) remaining unassigned.
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
              disabled={Object.keys(assignedNGOs).length === 0 || loading}
              startIcon={
                loading ? <CircularProgress size={20} /> : <LocalShippingIcon />
              }>
              {loading ? "Assigning..." : "Assign Selected Needs"}
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

      {/* Edit Need Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle>Edit Need</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Need Type</InputLabel>
              <Select
                value={editNeedType}
                label="Need Type"
                onChange={(e) => setEditNeedType(e.target.value)}>
                <MenuItem value="rescue">Rescue</MenuItem>
                <MenuItem value="food">Food</MenuItem>
                <MenuItem value="water">Water</MenuItem>
                <MenuItem value="medical">Medical Assistance</MenuItem>
                <MenuItem value="shelter">Shelter</MenuItem>
                <MenuItem value="baby_supplies">Baby Supplies</MenuItem>
                <MenuItem value="sanitation">Sanitation</MenuItem>
                <MenuItem value="transport">Transport</MenuItem>
                <MenuItem value="power_charging">Power/Charging</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="number"
              label="Quantity"
              value={editNeedQuantity}
              onChange={(e) => setEditNeedQuantity(parseInt(e.target.value))}
              inputProps={{ min: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            color="primary"
            disabled={!editNeedType || editNeedQuantity < 1}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Need Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm">
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to delete this need?
          </Alert>
          {needToDelete && (
            <Typography variant="body1">
              <strong>Need Type:</strong> {needToDelete.type}
              <br />
              <strong>Quantity:</strong> {needToDelete.quantity}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteNeed} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RequestDetails;
