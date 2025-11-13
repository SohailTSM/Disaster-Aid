import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  requestService,
  organizationService,
  assignmentService,
} from "../services/api";
import { AuthContext } from "../contexts/AuthContext";
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
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  Alert,
} from "@mui/material";
import {
  People as PeopleIcon,
  LocalShipping as LocalShippingIcon,
  Assignment as AssignmentIcon,
  AccessTime as AccessTimeIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";

// Status mapping for requests (must match backend model)
const REQUEST_STATUS = {
  NEW: "New",
  TRIAGED: "Triaged",
  IN_PROGRESS: "In-Progress",
  CLOSED: "Closed",
};

// Priority levels
const PRIORITY_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "";
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case REQUEST_STATUS.TRIAGED:
      return "info";
    case REQUEST_STATUS.IN_PROGRESS:
      return "warning";
    case REQUEST_STATUS.CLOSED:
      return "success";
    case REQUEST_STATUS.NEW:
    default:
      return "default";
  }
};

// Helper function to render a status chip
const getStatusChip = (status) => {
  const label = status ? status.replace("_", " ") : "Pending";
  return (
    <Chip
      label={label}
      color={getStatusColor(status)}
      size="small"
      sx={{ textTransform: "capitalize" }}
    />
  );
};

export default function Dispatcher() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [allRequests, setAllRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedNgo, setSelectedNgo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Add Needs dialog state
  const [addNeedsDialogOpen, setAddNeedsDialogOpen] = useState(false);
  const [newNeed, setNewNeed] = useState({
    type: "",
    quantity: 1,
  });

  // Edit/Delete need states
  const [editingNeed, setEditingNeed] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editNeedType, setEditNeedType] = useState("");
  const [editNeedQuantity, setEditNeedQuantity] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [needToDelete, setNeedToDelete] = useState(null);

  // NGO assignment for individual needs
  const [assignNeedDialogOpen, setAssignNeedDialogOpen] = useState(false);
  const [selectedNeedForAssignment, setSelectedNeedForAssignment] =
    useState(null);
  const [selectedNgoForNeed, setSelectedNgoForNeed] = useState("");

  // Stats data is initialized but not rendered in the provided JSX.
  // Kept for completeness.
  const [statsData, setStatsData] = useState([
    {
      title: "Total Requests",
      value: "0",
      change: 0,
      icon: <AssignmentIcon fontSize="large" />,
      color: "primary.main",
    },
    {
      title: "Active Requests",
      value: "0",
      change: 0,
      icon: <LocalShippingIcon fontSize="large" />,
      color: "warning.main",
    },
    {
      title: "Areas Covered",
      value: "0",
      change: 0,
      icon: <PeopleIcon fontSize="large" />,
      color: "success.main",
    },
    {
      title: "Avg. Response Time",
      value: "0h",
      change: 0,
      icon: <AccessTimeIcon fontSize="large" />,
      color: "info.main",
    },
  ]);
  // recentActivity is initialized but not rendered. Kept for completeness.
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all requests
        const requestsData = await requestService.getRequests();
        const requests = requestsData.requests || [];
        setAllRequests(requests);
        setFilteredRequests(requests);

        // Fetch all NGOs
        const ngoData = await organizationService.getOrganizations();
        const ngoList = ngoData.organizations || [];
        setNgos(ngoList);

        // Update stats
        updateStats(requests);

        // Fetch recent activity (you might need to implement this endpoint)
        // const activity = await activityService.getRecentActivity();
        // setRecentActivity(activity);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data. Please try again.");
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures this runs once on mount

  const updateStats = (requests) => {
    if (!requests || !Array.isArray(requests)) return;

    const totalRequests = requests.length;
    const activeRequests = requests.filter(
      (req) => req.status !== REQUEST_STATUS.CLOSED
    ).length;

    // Calculate unique areas (simplified)
    const areas = new Set(requests.map((req) => req.addressText || "Unknown"));

    // Update stats
    setStatsData([
      { ...statsData[0], value: totalRequests.toString() },
      { ...statsData[1], value: activeRequests.toString() },
      { ...statsData[2], value: areas.size.toString() },
      statsData[3], // Keep response time as is for now
    ]);
  };

  const handleOpenDialog = (request) => {
    setSelectedRequest(request);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setViewDialogOpen(false);
    setSelectedRequest(null);
    setSelectedNgo("");
  };

  const handleAssignNGO = async () => {
    if (!selectedRequest || !selectedNgo) return;

    try {
      setLoading(true);

      // Create assignment
      const assignmentData = {
        requestId: selectedRequest._id,
        organizationId: selectedNgo,
        assignedBy: user._id,
        status: "assigned", // This is the assignment status
        notes: `Assigned to ${
          ngos.find((ngo) => ngo._id === selectedNgo)?.name || "NGO"
        }`,
      };

      await assignmentService.createAssignment(assignmentData);

      // Update request status
      const updatedRequest = await requestService.updateRequest(
        selectedRequest._id,
        {
          status: REQUEST_STATUS.TRIAGED, // This is the request status
          updatedBy: user._id,
        }
      );

      // Update local state
      const updatedRequests = allRequests.map((req) =>
        req._id === updatedRequest._id ? updatedRequest : req
      );

      setAllRequests(updatedRequests);
      // setFilteredRequests(updatedRequests); // Let the useEffect handle filtering
      updateStats(updatedRequests);

      toast.success("Successfully assigned request to NGO");
      handleCloseDialog();
    } catch (error) {
      console.error("Error assigning request:", error);
      toast.error(error.response?.data?.message || "Failed to assign request");
    } finally {
      setLoading(false);
    }
  };

  // This function is not called by any UI element in the fixed code,
  // but it's valid logic if you add buttons to change status.
  const handleStatusChange = async (requestId, newStatus) => {
    try {
      setLoading(true);

      const updatedRequest = await requestService.updateRequestStatus(
        requestId,
        {
          status: newStatus,
          updatedBy: user._id,
        }
      );

      // Update local state
      const updatedRequests = allRequests.map((req) =>
        req._id === updatedRequest._id ? updatedRequest : req
      );

      setAllRequests(updatedRequests);
      updateStats(updatedRequests);
      toast.success(`Request status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating request status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update request status"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle adding needs to a request
  const handleAddNeed = async () => {
    if (!newNeed.type || newNeed.quantity < 1) {
      toast.error("Please select a need type and enter a valid quantity");
      return;
    }

    try {
      setLoading(true);

      // Get current needs
      const currentNeeds = selectedRequest.needs || [];

      // Check if the need type already exists
      const existingNeedIndex = currentNeeds.findIndex(
        (need) => need.type === newNeed.type
      );

      let updatedNeeds;
      if (existingNeedIndex !== -1) {
        // Update existing need quantity
        updatedNeeds = currentNeeds.map((need, index) =>
          index === existingNeedIndex
            ? { ...need, quantity: need.quantity + newNeed.quantity }
            : need
        );
        toast.success(`Updated ${newNeed.type} quantity`);
      } else {
        // Add new need
        updatedNeeds = [...currentNeeds, newNeed];
        toast.success("Need added successfully");
      }

      // Update the request with new needs array
      const response = await requestService.updateRequest(selectedRequest._id, {
        needs: updatedNeeds,
      });

      // Update local state
      const updatedRequest = response.request;
      const updatedRequests = allRequests.map((req) =>
        req._id === updatedRequest._id ? updatedRequest : req
      );

      setAllRequests(updatedRequests);
      setSelectedRequest(updatedRequest);

      // Reset form
      setNewNeed({ type: "", quantity: 1 });
      setAddNeedsDialogOpen(false);
    } catch (error) {
      console.error("Error adding need:", error);
      toast.error(error.response?.data?.message || "Failed to add need");
    } finally {
      setLoading(false);
    }
  };

  // Handle editing a need
  const handleEditNeed = (need, index) => {
    setEditingNeed({ ...need, index });
    setEditNeedType(need.type);
    setEditNeedQuantity(need.quantity);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      await requestService.updateNeed(selectedRequest._id, editingNeed.index, {
        type: editNeedType,
        quantity: editNeedQuantity,
      });

      // Refresh request data
      const response = await requestService.getRequestById(selectedRequest._id);
      const updatedRequest = response.request;

      const updatedRequests = allRequests.map((req) =>
        req._id === updatedRequest._id ? updatedRequest : req
      );

      setAllRequests(updatedRequests);
      setSelectedRequest(updatedRequest);

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

  // Handle deleting a need
  const handleDeleteNeed = (need, index) => {
    setNeedToDelete({ ...need, index });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteNeed = async () => {
    try {
      setLoading(true);
      await requestService.deleteNeed(selectedRequest._id, needToDelete.index);

      // Refresh request data
      const response = await requestService.getRequestById(selectedRequest._id);
      const updatedRequest = response.request;

      const updatedRequests = allRequests.map((req) =>
        req._id === updatedRequest._id ? updatedRequest : req
      );

      setAllRequests(updatedRequests);
      setSelectedRequest(updatedRequest);

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

  // Handle assigning an NGO to a specific need
  const handleAssignNeedToNGO = (need, index) => {
    setSelectedNeedForAssignment({ ...need, index });
    setSelectedNgoForNeed("");
    setAssignNeedDialogOpen(true);
  };

  const confirmAssignNeedToNGO = async () => {
    if (!selectedNgoForNeed) {
      toast.error("Please select an NGO");
      return;
    }

    try {
      setLoading(true);

      // Create assignment for this specific need
      await assignmentService.createAssignment({
        requestId: selectedRequest._id,
        organizationId: selectedNgoForNeed,
        assignedNeeds: [selectedNeedForAssignment.type],
        notes: `Assigned ${selectedNeedForAssignment.type} (${selectedNeedForAssignment.quantity} units)`,
      });

      // Refresh request data to show updated assignment status
      const response = await requestService.getRequestById(selectedRequest._id);
      const updatedRequest = response.request;

      const updatedRequests = allRequests.map((req) =>
        req._id === updatedRequest._id ? updatedRequest : req
      );

      setAllRequests(updatedRequests);
      setSelectedRequest(updatedRequest);

      const ngoName =
        ngos.find((ngo) => ngo._id === selectedNgoForNeed)?.name || "NGO";
      toast.success(`Assigned ${selectedNeedForAssignment.type} to ${ngoName}`);

      setAssignNeedDialogOpen(false);
      setSelectedNeedForAssignment(null);
      setSelectedNgoForNeed("");
    } catch (err) {
      console.error("Error assigning need:", err);
      toast.error(err.response?.data?.message || "Failed to assign need");
    } finally {
      setLoading(false);
    }
  };

  // Centralized filter logic
  const filterRequests = (status) => {
    setStatusFilter(status);

    if (status === "all") {
      setFilteredRequests(Array.isArray(allRequests) ? allRequests : []);
      return;
    }

    const filtered = (Array.isArray(allRequests) ? allRequests : []).filter(
      (request) => {
        return request.status === status;
      }
    );

    setFilteredRequests(filtered);
  };

  // Filter requests based on status (runs when allRequests or statusFilter changes)
  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredRequests(Array.isArray(allRequests) ? allRequests : []);
      return;
    }

    const filtered = (Array.isArray(allRequests) ? allRequests : []).filter(
      (request) => {
        return request.status === statusFilter;
      }
    );

    setFilteredRequests(filtered);
  }, [allRequests, statusFilter]);

  // Loading state for initial fetch
  if (loading && allRequests.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // Handle opening the "View" dialog
  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  // Error state
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
        <Typography variant="h4" component="h1">
          Dispatcher Dashboard
        </Typography>
      </Box>

      {/* Stats Grid (Data is ready, but UI was missing) */}
      {/* <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsData.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>{stat.title}</Typography>
                <Typography variant="h4">{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      */}

      <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            flexWrap: "wrap",
            gap: 2,
          }}>
          <Typography variant="h6" component="h2">
            Recent Requests
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Filter by Status">
                <MenuItem value="all">All Requests</MenuItem>
                <MenuItem value={REQUEST_STATUS.NEW}>New</MenuItem>
                <MenuItem value={REQUEST_STATUS.TRIAGED}>Triaged</MenuItem>
                <MenuItem value={REQUEST_STATUS.IN_PROGRESS}>
                  In Progress
                </MenuItem>
                <MenuItem value={REQUEST_STATUS.CLOSED}>Closed</MenuItem>
              </Select>
            </FormControl>
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()} // Simple refresh
              variant="outlined">
              Refresh
            </Button>
          </Box>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Beneficiaries</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(filteredRequests) &&
              filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell>{request.requestId || "N/A"}</TableCell>
                    <TableCell>{request.contactName || "N/A"}</TableCell>
                    <TableCell>{request.addressText || "N/A"}</TableCell>
                    <TableCell>
                      {(request.beneficiaries_adults || 0) +
                        (request.beneficiaries_children || 0) +
                        (request.beneficiaries_elderly || 0) || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {request.needs?.map((need, idx) => (
                          <Chip
                            key={idx}
                            label={`${need.type}: ${need.quantity}`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>{getStatusChip(request.status)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewRequest(request)}>
                          View
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 3 }}>
                      No requests found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Assign NGO Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth>
        <DialogTitle>Assign Request to NGO</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Request Details:
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Contact:</strong> {selectedRequest?.contactName} (
              {selectedRequest?.contactPhone})<br />
              <strong>Location:</strong> {selectedRequest?.addressText}
              <br />
              <strong>Beneficiaries:</strong>{" "}
              {(selectedRequest?.beneficiaries_adults || 0) +
                (selectedRequest?.beneficiaries_children || 0) +
                (selectedRequest?.beneficiaries_elderly || 0)}
              <br />
              <strong>Needs:</strong>{" "}
              {selectedRequest?.needs
                ?.map((need) => `${need.type} (${need.quantity})`)
                .join(", ") || "N/A"}
            </Typography>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="ngo-select-label">Select NGO</InputLabel>
              <Select
                labelId="ngo-select-label"
                value={selectedNgo}
                label="Select NGO"
                onChange={(e) => setSelectedNgo(e.target.value)}>
                {ngos.map((ngo) => (
                  <MenuItem key={ngo._id} value={ngo._id}>
                    {ngo.name} ({ngo.contact})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleAssignNGO} // Corrected function call
            variant="contained"
            disabled={!selectedNgo || loading}>
            {loading ? <CircularProgress size={24} /> : "Assign"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Request Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth>
        <DialogTitle>Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest ? (
            <Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
                mb={2}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    #{selectedRequest.requestId || "N/A"} -{" "}
                    {selectedRequest.addressText || "No address"}
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    {getStatusChip(selectedRequest.status)}
                    <Chip
                      label={selectedRequest.priority || "Medium"}
                      color={
                        selectedRequest.priority === PRIORITY_LEVELS.HIGH ||
                        selectedRequest.priority === PRIORITY_LEVELS.URGENT
                          ? "error"
                          : "default"
                      }
                      variant="outlined"
                      size="small"
                      sx={{ textTransform: "capitalize" }}
                    />
                  </Box>
                </Box>
                <Box textAlign="right">
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    display="block">
                    Created: {formatDate(selectedRequest.createdAt)}
                  </Typography>
                  {selectedRequest.updatedAt !== selectedRequest.createdAt && (
                    <Typography variant="caption" color="textSecondary">
                      Updated: {formatDate(selectedRequest.updatedAt)}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        gutterBottom
                        sx={{ fontWeight: "medium" }}>
                        Request Information
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      <Box mb={2}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Description
                        </Typography>
                        <Typography variant="body1" paragraph>
                          {selectedRequest.description ||
                            "No description provided"}
                        </Typography>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Contact Name
                          </Typography>
                          <Typography variant="body1">
                            {selectedRequest.contactName || "N/A"}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Contact Phone
                          </Typography>
                          <Typography variant="body1">
                            {selectedRequest.contactPhone || "N/A"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Email
                          </Typography>
                          <Typography variant="body1">
                            {selectedRequest.contactEmail || "N/A"}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Beneficiaries
                          </Typography>
                          <Typography variant="body1">
                            Adults: {selectedRequest.beneficiaries_adults || 0},
                            Children:{" "}
                            {selectedRequest.beneficiaries_children || 0},
                            Elderly:{" "}
                            {selectedRequest.beneficiaries_elderly || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Location
                          </Typography>
                          <Typography variant="body1">
                            {selectedRequest.addressText || "N/A"}
                            {selectedRequest.additionalAddressDetails &&
                              `, ${selectedRequest.additionalAddressDetails}`}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={2}>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: "medium" }}>
                          Required Needs
                        </Typography>
                        {selectedRequest.status !== REQUEST_STATUS.CLOSED && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => setAddNeedsDialogOpen(true)}>
                            Add Needs
                          </Button>
                        )}
                      </Box>
                      <Divider sx={{ mb: 2 }} />

                      {selectedRequest.needs?.length > 0 ? (
                        <Box>
                          {selectedRequest.needs.map((need, index) => {
                            const isAssigned =
                              need.assignmentStatus === "assigned";
                            const isDeclined =
                              need.assignmentStatus === "declined";
                            const canEdit = !isAssigned;

                            return (
                              <Box
                                key={index}
                                mb={2}
                                p={1.5}
                                bgcolor="grey.50"
                                borderRadius={1}
                                border="1px solid"
                                borderColor="divider">
                                <Box
                                  display="flex"
                                  justifyContent="space-between"
                                  alignItems="flex-start">
                                  <Box flex={1}>
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      gap={1}
                                      mb={0.5}>
                                      <Typography variant="subtitle2">
                                        {need.type} - {need.quantity} units
                                      </Typography>
                                      {isAssigned && (
                                        <CheckCircleIcon
                                          color="success"
                                          fontSize="small"
                                        />
                                      )}
                                      {isDeclined && (
                                        <WarningIcon
                                          color="warning"
                                          fontSize="small"
                                        />
                                      )}
                                    </Box>

                                    {/* Status Chip */}
                                    <Box display="flex" gap={1} mb={1}>
                                      {isAssigned && (
                                        <Chip
                                          label="Assigned"
                                          color="success"
                                          size="small"
                                        />
                                      )}
                                      {isDeclined && (
                                        <Chip
                                          label="Declined - Reassign"
                                          color="warning"
                                          size="small"
                                        />
                                      )}
                                      {!isAssigned && !isDeclined && (
                                        <Chip
                                          label="Available"
                                          color="default"
                                          size="small"
                                          variant="outlined"
                                        />
                                      )}
                                    </Box>

                                    {/* Show assigned NGO */}
                                    {isAssigned && need.assignedTo && (
                                      <Box
                                        display="flex"
                                        alignItems="center"
                                        gap={0.5}>
                                        <BusinessIcon
                                          fontSize="small"
                                          color="primary"
                                        />
                                        <Typography
                                          variant="caption"
                                          color="text.secondary">
                                          {ngos.find(
                                            (n) => n._id === need.assignedTo
                                          )?.name || "NGO"}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>

                                  {/* Action Buttons */}
                                  <Box display="flex" gap={0.5}>
                                    {!isAssigned && (
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() =>
                                          handleAssignNeedToNGO(need, index)
                                        }>
                                        Assign
                                      </Button>
                                    )}
                                    {canEdit && (
                                      <>
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={() =>
                                            handleEditNeed(need, index)
                                          }
                                          title="Edit need">
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() =>
                                            handleDeleteNeed(need, index)
                                          }
                                          title="Delete need"
                                          disabled={
                                            selectedRequest.needs.length === 1
                                          }>
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </>
                                    )}
                                  </Box>
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      ) : (
                        <Box textAlign="center" py={2}>
                          <Typography color="textSecondary">
                            No items added to this request
                          </Typography>
                          {selectedRequest.status !==
                            REQUEST_STATUS.COMPLETED && (
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<AddIcon />}
                              onClick={() => {
                                toast.info(
                                  "Add items functionality would be implemented here"
                                );
                              }}
                              sx={{ mt: 1 }}>
                              Add Items
                            </Button>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>

                  {/* Assignments Section */}
                  {selectedRequest.assignments?.length > 0 && (
                    <Card variant="outlined" sx={{ mt: 2 }}>
                      <CardContent>
                        <Typography
                          variant="subtitle1"
                          gutterBottom
                          sx={{ fontWeight: "medium" }}>
                          Assignments
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Stack spacing={2}>
                          {selectedRequest.assignments.map((assignment) => (
                            <Box
                              key={assignment._id}
                              p={1.5}
                              border="1px solid"
                              borderColor="divider"
                              borderRadius={1}>
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center">
                                <Box>
                                  <Typography variant="subtitle2">
                                    {assignment.organization?.name || "NGO"}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="textSecondary">
                                    Assigned by:{" "}
                                    {assignment.assignedBy?.name || "System"}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="textSecondary">
                                    {formatDate(assignment.assignedAt)}
                                  </Typography>
                                </Box>
                                {getStatusChip(assignment.status)}
                              </Box>

                              {assignment.notes && (
                                <Box
                                  mt={1}
                                  pt={1}
                                  borderTop="1px dashed"
                                  borderColor="divider">
                                  <Typography variant="body2">
                                    {assignment.notes}
                                  </Typography>
                                </Box>
                              )}

                              {assignment.updatedAt !==
                                assignment.createdAt && (
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                  display="block"
                                  mt={1}>
                                  Last updated:{" "}
                                  {formatDate(assignment.updatedAt)}
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Stack>

                        {/* This section was from the broken merge.
                          It tried to add assignment logic *within* the view dialog.
                          This logic is now handled by the main "Assign" button in the table.
                        */}
                      </CardContent>
                    </Card>
                  )}
                </Grid>
              </Grid>

              {/* This entire Box was the start of the duplicated dialog content. Removed. */}
            </Box>
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="40vh">
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add Needs Dialog */}
      <Dialog
        open={addNeedsDialogOpen}
        onClose={() => setAddNeedsDialogOpen(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle>Add Need to Request</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Add a new need to request #{selectedRequest?.requestId}
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="need-type-label">Need Type</InputLabel>
              <Select
                labelId="need-type-label"
                value={newNeed.type}
                label="Need Type"
                onChange={(e) =>
                  setNewNeed({ ...newNeed, type: e.target.value })
                }>
                <MenuItem value="rescue">Rescue</MenuItem>
                <MenuItem value="food">Food</MenuItem>
                <MenuItem value="water">Water</MenuItem>
                <MenuItem value="medical">Medical</MenuItem>
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
              value={newNeed.quantity}
              onChange={(e) =>
                setNewNeed({
                  ...newNeed,
                  quantity: parseInt(e.target.value) || 1,
                })
              }
              inputProps={{ min: 1 }}
              helperText="Enter the quantity needed"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddNeedsDialogOpen(false);
              setNewNeed({ type: "", quantity: 1 });
            }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddNeed}
            variant="contained"
            disabled={!newNeed.type || newNeed.quantity < 1 || loading}>
            {loading ? <CircularProgress size={24} /> : "Add Need"}
          </Button>
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

      {/* Assign Need to NGO Dialog */}
      <Dialog
        open={assignNeedDialogOpen}
        onClose={() => setAssignNeedDialogOpen(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle>Assign Need to NGO</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Assign <strong>{selectedNeedForAssignment?.type}</strong> (
              {selectedNeedForAssignment?.quantity} units) to an NGO
            </Typography>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="ngo-assign-label">Select NGO</InputLabel>
              <Select
                labelId="ngo-assign-label"
                value={selectedNgoForNeed}
                label="Select NGO"
                onChange={(e) => setSelectedNgoForNeed(e.target.value)}>
                {ngos
                  .filter(
                    (ngo) =>
                      (ngo.approved || ngo.verificationStatus === "verified") &&
                      !ngo.suspended &&
                      ngo.offers?.some(
                        (offer) =>
                          offer.type === selectedNeedForAssignment?.type
                      )
                  )
                  .map((ngo) => (
                    <MenuItem key={ngo._id} value={ngo._id}>
                      <Box>
                        <Typography variant="body2">{ngo.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ngo.offers
                            ?.filter(
                              (offer) =>
                                offer.type === selectedNeedForAssignment?.type
                            )
                            .map((offer) => `${offer.quantity} available`)
                            .join(", ")}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {ngos.filter(
              (ngo) =>
                (ngo.approved || ngo.verificationStatus === "verified") &&
                !ngo.suspended &&
                ngo.offers?.some(
                  (offer) => offer.type === selectedNeedForAssignment?.type
                )
            ).length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No NGOs available for {selectedNeedForAssignment?.type}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignNeedDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmAssignNeedToNGO}
            variant="contained"
            disabled={!selectedNgoForNeed || loading}>
            {loading ? <CircularProgress size={24} /> : "Assign"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
