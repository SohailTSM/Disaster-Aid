import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tab,
  Tabs,
  Alert,
  List,
  ListItem,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  LocalShipping as TruckIcon,
  PlayArrow as StartIcon,
  Check as CompleteIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { assignmentService, ngoService } from "../services/api";

const NEED_TYPES = [
  "rescue",
  "food",
  "water",
  "medical",
  "shelter",
  "baby_supplies",
  "sanitation",
  "transport",
  "power_charging",
];

const NGO = () => {
  const [assignments, setAssignments] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);

  // Dialogs
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Decline dialog state
  const [declineReason, setDeclineReason] = useState("");

  // Status update state
  const [newStatus, setNewStatus] = useState("");
  const [deliveryDetails, setDeliveryDetails] = useState({
    estimatedDeliveryTime: "",
    vehicleNumber: "",
    driverName: "",
    driverPhone: "",
    additionalNotes: "",
  });
  const [completionImageFile, setCompletionImageFile] = useState(null);
  const [completionImagePreview, setCompletionImagePreview] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");

  // Resources state
  const [resources, setResources] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, orgRes] = await Promise.all([
        assignmentService.getMyAssignments(),
        ngoService.getMyOrganization(),
      ]);

      setAssignments(assignmentsRes.assignments || []);
      setOrganization(orgRes.organization || null);
      setResources(orgRes.organization?.offers || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptClick = (assignment) => {
    setSelectedAssignment(assignment);
    setAcceptDialogOpen(true);
  };

  const handleAcceptSubmit = async () => {
    try {
      await assignmentService.acceptAssignment(
        selectedAssignment._id,
        false, // No partial acceptance
        [] // Accept all needs
      );
      toast.success("Assignment accepted successfully");
      setAcceptDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Error accepting assignment:", error);
      toast.error(
        error.response?.data?.message || "Failed to accept assignment"
      );
    }
  };

  const handleDeclineClick = (assignment) => {
    setSelectedAssignment(assignment);
    setDeclineReason("");
    setDeclineDialogOpen(true);
  };

  const handleDeclineSubmit = async () => {
    try {
      await assignmentService.declineAssignment(
        selectedAssignment._id,
        declineReason
      );
      toast.success("Assignment declined");
      setDeclineDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Error declining assignment:", error);
      toast.error(
        error.response?.data?.message || "Failed to decline assignment"
      );
    }
  };

  const handleStatusClick = (assignment, status) => {
    setSelectedAssignment(assignment);
    setNewStatus(status);
    setDeliveryDetails({
      estimatedDeliveryTime: "",
      vehicleNumber: "",
      driverName: "",
      driverPhone: "",
      additionalNotes: "",
    });
    setCompletionImageFile(null);
    setCompletionImagePreview("");
    setCompletionNotes("");
    setStatusDialogOpen(true);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setCompletionImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompletionImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStatusSubmit = async () => {
    try {
      // For now, skip image upload and just mark as completed
      // TODO: Implement proper image upload service (AWS S3, Cloudinary, etc.)
      const imageUrl = completionImageFile
        ? `uploaded_${completionImageFile.name}`
        : "";

      const payload = {
        status: newStatus,
        deliveryDetails: newStatus === "In-Transit" ? deliveryDetails : null,
        completionProof:
          newStatus === "Completed"
            ? {
                imageUrl: imageUrl, // Placeholder - not storing actual image data
                completionNotes: completionNotes,
              }
            : null,
      };

      await assignmentService.updateAssignmentStatus(
        selectedAssignment._id,
        payload.status,
        payload.deliveryDetails,
        payload.completionProof
      );

      toast.success("Status updated successfully");
      setStatusDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleResourceUpdate = async () => {
    try {
      await ngoService.updateMyResources(resources);
      toast.success("Resources updated successfully");
      setResourceDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Error updating resources:", error);
      toast.error(
        error.response?.data?.message || "Failed to update resources"
      );
    }
  };

  const addResource = () => {
    setResources([...resources, { type: "food", quantity: 0 }]);
  };

  const removeResource = (index) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const updateResource = (index, field, value) => {
    const updated = [...resources];
    updated[index] = { ...updated[index], [field]: value };
    setResources(updated);
  };

  const incrementResource = (index) => {
    const updated = [...resources];
    updated[index].quantity = (updated[index].quantity || 0) + 1;
    setResources(updated);
  };

  const decrementResource = (index) => {
    const updated = [...resources];
    if (updated[index].quantity > 0) {
      updated[index].quantity = updated[index].quantity - 1;
    }
    setResources(updated);
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "warning",
      Accepted: "info",
      Declined: "error",
      Processing: "primary",
      "In-Transit": "secondary",
      Completed: "success",
    };
    return colors[status] || "default";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const filterAssignments = () => {
    if (currentTab === 0)
      return assignments.filter((a) => a.status === "Pending");
    if (currentTab === 1)
      return assignments.filter((a) =>
        ["Accepted", "Processing", "In-Transit"].includes(a.status)
      );
    if (currentTab === 2)
      return assignments.filter((a) => a.status === "Completed");
    if (currentTab === 3)
      return assignments.filter((a) => a.status === "Declined");
    return assignments;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            NGO Dashboard
          </Typography>
          {organization && (
            <Typography variant="subtitle1" color="text.secondary">
              {organization.name}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => {
            setResources(organization?.offers || []);
            setResourceDialogOpen(true);
          }}>
          Manage Resources
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4">
                {assignments.filter((a) => a.status === "Pending").length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active
              </Typography>
              <Typography variant="h4">
                {
                  assignments.filter((a) =>
                    ["Accepted", "Processing", "In-Transit"].includes(a.status)
                  ).length
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4">
                {assignments.filter((a) => a.status === "Completed").length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Resources
              </Typography>
              <Typography variant="h4">
                {organization?.offers?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
          <Tab
            label={`Pending (${
              assignments.filter((a) => a.status === "Pending").length
            })`}
          />
          <Tab
            label={`Active (${
              assignments.filter((a) =>
                ["Accepted", "Processing", "In-Transit"].includes(a.status)
              ).length
            })`}
          />
          <Tab
            label={`Completed (${
              assignments.filter((a) => a.status === "Completed").length
            })`}
          />
          <Tab
            label={`Declined (${
              assignments.filter((a) => a.status === "Declined").length
            })`}
          />
        </Tabs>
      </Paper>

      {/* Assignments Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Request ID</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Needs</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filterAssignments().length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 3 }}>
                    No assignments found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filterAssignments().map((assignment) => (
                <TableRow key={assignment._id}>
                  <TableCell>
                    {assignment.requestId?.requestId || "N/A"}
                  </TableCell>
                  <TableCell>
                    {assignment.requestId?.addressText || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {assignment.notes
                        ?.split(",")
                        .slice(0, 3)
                        .map((need, idx) => (
                          <Chip key={idx} label={need.trim()} size="small" />
                        ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={assignment.status}
                      color={getStatusColor(assignment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(assignment.createdAt)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {assignment.status === "Pending" && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleAcceptClick(assignment)}>
                            Accept
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={() => handleDeclineClick(assignment)}>
                            Decline
                          </Button>
                        </>
                      )}
                      {assignment.status === "Accepted" && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<StartIcon />}
                          onClick={() =>
                            handleStatusClick(assignment, "Processing")
                          }>
                          Start Processing
                        </Button>
                      )}
                      {assignment.status === "Processing" && (
                        <Button
                          size="small"
                          variant="contained"
                          color="secondary"
                          startIcon={<TruckIcon />}
                          onClick={() =>
                            handleStatusClick(assignment, "In-Transit")
                          }>
                          Mark In-Transit
                        </Button>
                      )}
                      {assignment.status === "In-Transit" && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CompleteIcon />}
                          onClick={() =>
                            handleStatusClick(assignment, "Completed")
                          }>
                          Mark Completed
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Accept Dialog */}
      <Dialog
        open={acceptDialogOpen}
        onClose={() => setAcceptDialogOpen(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle>Accept Assignment</DialogTitle>
        <DialogContent>
          {selectedAssignment && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Request ID:{" "}
                <strong>{selectedAssignment.requestId?.requestId}</strong>
              </Typography>
              <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
                Location: {selectedAssignment.requestId?.addressText}
              </Typography>

              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Assigned Needs:
              </Typography>
              <List dense>
                {selectedAssignment.assignedNeeds?.map((needType) => {
                  const need = selectedAssignment.requestId?.needs?.find(
                    (n) => n.type === needType
                  );
                  return (
                    <ListItem key={needType}>
                      <Typography variant="body2">
                        • {needType} {need ? `(${need.quantity} units)` : ""}
                      </Typography>
                    </ListItem>
                  );
                })}
              </List>

              <Alert severity="info" sx={{ mt: 2 }}>
                Accepting this assignment means you commit to fulfilling all the
                listed needs.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAcceptDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAcceptSubmit}
            variant="contained"
            color="success">
            Accept All Needs
          </Button>
        </DialogActions>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog
        open={declineDialogOpen}
        onClose={() => setDeclineDialogOpen(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle>Decline Assignment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Reason for declining"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeclineDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeclineSubmit}
            variant="contained"
            color="error">
            Decline
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="md"
        fullWidth>
        <DialogTitle>Update Status to {newStatus}</DialogTitle>
        <DialogContent>
          {newStatus === "In-Transit" && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Delivery Details:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Estimated Delivery Time"
                    type="datetime-local"
                    value={deliveryDetails.estimatedDeliveryTime}
                    onChange={(e) =>
                      setDeliveryDetails({
                        ...deliveryDetails,
                        estimatedDeliveryTime: e.target.value,
                      })
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Vehicle Number"
                    value={deliveryDetails.vehicleNumber}
                    onChange={(e) =>
                      setDeliveryDetails({
                        ...deliveryDetails,
                        vehicleNumber: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Driver Name"
                    value={deliveryDetails.driverName}
                    onChange={(e) =>
                      setDeliveryDetails({
                        ...deliveryDetails,
                        driverName: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Driver Phone"
                    value={deliveryDetails.driverPhone}
                    onChange={(e) =>
                      setDeliveryDetails({
                        ...deliveryDetails,
                        driverPhone: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Additional Notes"
                    value={deliveryDetails.additionalNotes}
                    onChange={(e) =>
                      setDeliveryDetails({
                        ...deliveryDetails,
                        additionalNotes: e.target.value,
                      })
                    }
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {newStatus === "Completed" && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Completion Proof:
              </Typography>

              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 2 }}>
                {completionImageFile
                  ? completionImageFile.name
                  : "Upload Image (Optional)"}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Button>

              {completionImagePreview && (
                <Box sx={{ mb: 2, textAlign: "center" }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    gutterBottom>
                    Preview:
                  </Typography>
                  <img
                    src={completionImagePreview}
                    alt="Completion proof preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "200px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                  />
                </Box>
              )}

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Completion Notes"
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                helperText="Add any additional details about the completion"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleStatusSubmit}
            variant="contained"
            disabled={
              newStatus === "In-Transit" && !deliveryDetails.vehicleNumber
            }>
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resource Management Dialog */}
      <Dialog
        open={resourceDialogOpen}
        onClose={() => setResourceDialogOpen(false)}
        maxWidth="md"
        fullWidth>
        <DialogTitle>Manage Resources</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Button
              startIcon={<AddIcon />}
              onClick={addResource}
              variant="outlined"
              sx={{ mb: 2 }}>
              Add Resource
            </Button>

            <List>
              {resources.map((resource, index) => (
                <ListItem
                  key={index}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    mb: 1,
                    display: "flex",
                    gap: 2,
                  }}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={resource.type}
                      label="Type"
                      onChange={(e) =>
                        updateResource(index, "type", e.target.value)
                      }>
                      {NEED_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <IconButton
                      onClick={() => decrementResource(index)}
                      size="small">
                      <RemoveIcon />
                    </IconButton>
                    <TextField
                      type="number"
                      value={resource.quantity}
                      onChange={(e) =>
                        updateResource(
                          index,
                          "quantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                      sx={{ width: 100 }}
                      inputProps={{ min: 0 }}
                    />
                    <IconButton
                      onClick={() => incrementResource(index)}
                      size="small">
                      <AddIcon />
                    </IconButton>
                  </Box>

                  <IconButton
                    onClick={() => removeResource(index)}
                    color="error">
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
              ))}

              {resources.length === 0 && (
                <Alert severity="info">
                  No resources added yet. Click "Add Resource" to start.
                </Alert>
              )}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResourceDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleResourceUpdate} variant="contained">
            Save Resources
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NGO;
