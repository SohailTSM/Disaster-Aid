import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  LinearProgress,
  CircularProgress,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Warehouse as WarehouseIcon,
  PriorityHigh as PriorityIcon,
  Campaign as CampaignIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AssignmentLate as UrgentIcon,
  CheckCircle as CompletedIcon,
  HourglassEmpty as PendingIcon,
  LocalShipping as InProgressIcon,
} from "@mui/icons-material";
import { requestService } from "../services/api";
import { toast } from "react-toastify";

const Authority = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    triaged: 0,
    inProgress: 0,
    closed: 0,
  });

  // Advisory state
  const [advisories, setAdvisories] = useState([
    {
      id: 1,
      title: "Flood Alert - Northern Districts",
      content:
        "Heavy rainfall expected. Residents advised to move to higher ground.",
      severity: "High",
      createdAt: new Date().toISOString(),
      active: true,
    },
    {
      id: 2,
      title: "Emergency Shelter Locations",
      content:
        "Three emergency shelters opened at City Hall, Central School, and Community Center.",
      severity: "Medium",
      createdAt: new Date().toISOString(),
      active: true,
    },
  ]);
  const [advisoryDialog, setAdvisoryDialog] = useState(false);
  const [currentAdvisory, setCurrentAdvisory] = useState(null);

  // Shelter/Resource state
  const [shelters, setShelters] = useState([
    {
      id: 1,
      name: "Central Community Shelter",
      location: "123 Main St",
      capacity: 500,
      occupied: 320,
      resources: {
        food: 1000,
        water: 2000,
        blankets: 400,
        medical: 50,
      },
    },
    {
      id: 2,
      name: "East District Shelter",
      location: "456 East Ave",
      capacity: 300,
      occupied: 180,
      resources: {
        food: 500,
        water: 1000,
        blankets: 200,
        medical: 30,
      },
    },
  ]);
  const [shelterDialog, setShelterDialog] = useState(false);
  const [currentShelter, setCurrentShelter] = useState(null);

  // Request details dialog state
  const [requestDialog, setRequestDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loadingRequestDetails, setLoadingRequestDetails] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await requestService.getRequests();
      setRequests(response.requests);

      // Calculate stats
      const newStats = {
        total: response.requests.length,
        new: response.requests.filter((r) => r.status === "New").length,
        triaged: response.requests.filter((r) => r.status === "Triaged").length,
        inProgress: response.requests.filter((r) => r.status === "In-Progress")
          .length,
        closed: response.requests.filter((r) => r.status === "Closed").length,
      };
      setStats(newStats);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Request details handlers
  const handleViewRequest = async (request) => {
    try {
      setLoadingRequestDetails(true);
      setRequestDialog(true);
      // Fetch full request details including populated needs
      const response = await requestService.getRequestById(request._id);
      setSelectedRequest(response.request);
    } catch (error) {
      console.error("Error fetching request details:", error);
      toast.error("Failed to load request details");
      setRequestDialog(false);
    } finally {
      setLoadingRequestDetails(false);
    }
  };

  const handleCloseRequestDialog = () => {
    setRequestDialog(false);
    setSelectedRequest(null);
  };

  // Advisory handlers
  const handleOpenAdvisoryDialog = (advisory = null) => {
    setCurrentAdvisory(
      advisory || {
        title: "",
        content: "",
        severity: "Medium",
        active: true,
      }
    );
    setAdvisoryDialog(true);
  };

  const handleCloseAdvisoryDialog = () => {
    setAdvisoryDialog(false);
    setCurrentAdvisory(null);
  };

  const handleSaveAdvisory = () => {
    if (currentAdvisory.id) {
      // Update existing
      setAdvisories(
        advisories.map((a) =>
          a.id === currentAdvisory.id ? currentAdvisory : a
        )
      );
      toast.success("Advisory updated successfully");
    } else {
      // Create new
      setAdvisories([
        ...advisories,
        {
          ...currentAdvisory,
          id: Date.now(),
          createdAt: new Date().toISOString(),
        },
      ]);
      toast.success("Advisory created successfully");
    }
    handleCloseAdvisoryDialog();
  };

  const handleDeleteAdvisory = (id) => {
    setAdvisories(advisories.filter((a) => a.id !== id));
    toast.success("Advisory deleted successfully");
  };

  const handleToggleAdvisory = (id) => {
    setAdvisories(
      advisories.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
    toast.success("Advisory status updated");
  };

  // Shelter handlers
  const handleOpenShelterDialog = (shelter = null) => {
    setCurrentShelter(
      shelter || {
        name: "",
        location: "",
        capacity: 0,
        occupied: 0,
        resources: {
          food: 0,
          water: 0,
          blankets: 0,
          medical: 0,
        },
      }
    );
    setShelterDialog(true);
  };

  const handleCloseShelterDialog = () => {
    setShelterDialog(false);
    setCurrentShelter(null);
  };

  const handleSaveShelter = () => {
    if (currentShelter.id) {
      setShelters(
        shelters.map((s) => (s.id === currentShelter.id ? currentShelter : s))
      );
      toast.success("Shelter updated successfully");
    } else {
      setShelters([...shelters, { ...currentShelter, id: Date.now() }]);
      toast.success("Shelter added successfully");
    }
    handleCloseShelterDialog();
  };

  const handleDeleteShelter = (id) => {
    setShelters(shelters.filter((s) => s.id !== id));
    toast.success("Shelter removed successfully");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "New":
        return <UrgentIcon color="error" />;
      case "Triaged":
        return <PendingIcon color="info" />;
      case "In-Progress":
        return <InProgressIcon color="warning" />;
      case "Closed":
        return <CompletedIcon color="success" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "New":
        return "error";
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

  // Tab Panels
  const CrisisMonitoringPanel = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Crisis Overview
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Requests
                  </Typography>
                  <Typography variant="h4">{stats.total}</Typography>
                </Box>
                <DashboardIcon color="primary" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    New
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {stats.new}
                  </Typography>
                </Box>
                <UrgentIcon color="error" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Triaged
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {stats.triaged}
                  </Typography>
                </Box>
                <PendingIcon color="info" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    In Progress
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {stats.inProgress}
                  </Typography>
                </Box>
                <InProgressIcon color="warning" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Completed
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.closed}
                  </Typography>
                </Box>
                <CompletedIcon color="success" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Requests Table */}
      <Paper>
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <Typography variant="h6">All Disaster Requests</Typography>
          <Button variant="outlined" onClick={fetchRequests}>
            Refresh
          </Button>
        </Box>
        {loading ? (
          <LinearProgress />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Request ID</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Needs</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow key={request._id} hover>
                      <TableCell>
                        <Button
                          variant="text"
                          color="primary"
                          onClick={() => handleViewRequest(request)}
                          sx={{
                            textTransform: "none",
                            fontWeight: "bold",
                            "&:hover": {
                              textDecoration: "underline",
                            },
                          }}>
                          {request.requestId}
                        </Button>
                      </TableCell>
                      <TableCell>{request.contactName}</TableCell>
                      <TableCell>{request.addressText}</TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {request.needs?.slice(0, 3).map((need, idx) => (
                            <Chip key={idx} label={need.type} size="small" />
                          ))}
                          {request.needs?.length > 3 && (
                            <Chip
                              label={`+${request.needs.length - 3}`}
                              size="small"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(request.status)}
                          label={request.status}
                          color={getStatusColor(request.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );

  const ShelterManagementPanel = () => (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}>
        <Typography variant="h5">Shelter & Resource Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenShelterDialog()}>
          Add Shelter
        </Button>
      </Box>

      <Grid container spacing={3}>
        {shelters.map((shelter) => (
          <Grid item xs={12} md={6} key={shelter.id}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    mb: 2,
                  }}>
                  <Box>
                    <Typography variant="h6">{shelter.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {shelter.location}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenShelterDialog(shelter)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteShelter(shelter.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}>
                    <Typography variant="body2">Occupancy</Typography>
                    <Typography variant="body2">
                      {shelter.occupied} / {shelter.capacity}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(shelter.occupied / shelter.capacity) * 100}
                    color={
                      shelter.occupied / shelter.capacity > 0.9
                        ? "error"
                        : shelter.occupied / shelter.capacity > 0.7
                        ? "warning"
                        : "success"
                    }
                  />
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Resources Available:
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      Food: {shelter.resources.food}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      Water: {shelter.resources.water}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      Blankets: {shelter.resources.blankets}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      Medical: {shelter.resources.medical}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const AdvisoryManagementPanel = () => (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}>
        <Typography variant="h5">Public Advisories</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenAdvisoryDialog()}>
          Create Advisory
        </Button>
      </Box>

      <Grid container spacing={2}>
        {advisories.map((advisory) => (
          <Grid item xs={12} key={advisory.id}>
            <Card variant={advisory.active ? "elevation" : "outlined"}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                  }}>
                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}>
                      <Typography variant="h6">{advisory.title}</Typography>
                      <Chip
                        label={advisory.severity}
                        color={
                          advisory.severity === "High"
                            ? "error"
                            : advisory.severity === "Medium"
                            ? "warning"
                            : "info"
                        }
                        size="small"
                      />
                      <Chip
                        label={advisory.active ? "Active" : "Inactive"}
                        color={advisory.active ? "success" : "default"}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" paragraph>
                      {advisory.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(advisory.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleAdvisory(advisory.id)}>
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenAdvisoryDialog(advisory)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteAdvisory(advisory.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Authority Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Monitor crisis situations, manage resources, and issue public advisories
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<DashboardIcon />} label="Crisis Monitoring" />
          <Tab icon={<WarehouseIcon />} label="Shelters & Resources" />
          <Tab icon={<CampaignIcon />} label="Public Advisories" />
        </Tabs>
      </Box>

      {activeTab === 0 && <CrisisMonitoringPanel />}
      {activeTab === 1 && <ShelterManagementPanel />}
      {activeTab === 2 && <AdvisoryManagementPanel />}

      {/* Advisory Dialog */}
      <Dialog
        open={advisoryDialog}
        onClose={handleCloseAdvisoryDialog}
        maxWidth="md"
        fullWidth>
        <DialogTitle>
          {currentAdvisory?.id ? "Edit Advisory" : "Create Advisory"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Title"
              value={currentAdvisory?.title || ""}
              onChange={(e) =>
                setCurrentAdvisory({
                  ...currentAdvisory,
                  title: e.target.value,
                })
              }
              fullWidth
            />
            <TextField
              label="Content"
              value={currentAdvisory?.content || ""}
              onChange={(e) =>
                setCurrentAdvisory({
                  ...currentAdvisory,
                  content: e.target.value,
                })
              }
              multiline
              rows={4}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                value={currentAdvisory?.severity || "Medium"}
                label="Severity"
                onChange={(e) =>
                  setCurrentAdvisory({
                    ...currentAdvisory,
                    severity: e.target.value,
                  })
                }>
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdvisoryDialog}>Cancel</Button>
          <Button onClick={handleSaveAdvisory} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Shelter Dialog */}
      <Dialog
        open={shelterDialog}
        onClose={handleCloseShelterDialog}
        maxWidth="md"
        fullWidth>
        <DialogTitle>
          {currentShelter?.id ? "Edit Shelter" : "Add Shelter"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Shelter Name"
              value={currentShelter?.name || ""}
              onChange={(e) =>
                setCurrentShelter({ ...currentShelter, name: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Location"
              value={currentShelter?.location || ""}
              onChange={(e) =>
                setCurrentShelter({
                  ...currentShelter,
                  location: e.target.value,
                })
              }
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Capacity"
                  type="number"
                  value={currentShelter?.capacity || 0}
                  onChange={(e) =>
                    setCurrentShelter({
                      ...currentShelter,
                      capacity: parseInt(e.target.value) || 0,
                    })
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Currently Occupied"
                  type="number"
                  value={currentShelter?.occupied || 0}
                  onChange={(e) =>
                    setCurrentShelter({
                      ...currentShelter,
                      occupied: parseInt(e.target.value) || 0,
                    })
                  }
                  fullWidth
                />
              </Grid>
            </Grid>
            <Typography variant="subtitle2" gutterBottom>
              Resources Available:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Food"
                  type="number"
                  value={currentShelter?.resources?.food || 0}
                  onChange={(e) =>
                    setCurrentShelter({
                      ...currentShelter,
                      resources: {
                        ...currentShelter.resources,
                        food: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Water"
                  type="number"
                  value={currentShelter?.resources?.water || 0}
                  onChange={(e) =>
                    setCurrentShelter({
                      ...currentShelter,
                      resources: {
                        ...currentShelter.resources,
                        water: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Blankets"
                  type="number"
                  value={currentShelter?.resources?.blankets || 0}
                  onChange={(e) =>
                    setCurrentShelter({
                      ...currentShelter,
                      resources: {
                        ...currentShelter.resources,
                        blankets: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Medical Supplies"
                  type="number"
                  value={currentShelter?.resources?.medical || 0}
                  onChange={(e) =>
                    setCurrentShelter({
                      ...currentShelter,
                      resources: {
                        ...currentShelter.resources,
                        medical: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseShelterDialog}>Cancel</Button>
          <Button onClick={handleSaveShelter} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Details Dialog */}
      <Dialog
        open={requestDialog}
        onClose={handleCloseRequestDialog}
        maxWidth="md"
        fullWidth>
        <DialogTitle>Request Details #{selectedRequest?.requestId}</DialogTitle>
        <DialogContent>
          {loadingRequestDetails ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : selectedRequest ? (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Contact Name
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedRequest.contactName}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Contact Phone
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedRequest.contactPhone}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedRequest.addressText}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    icon={getStatusIcon(selectedRequest.status)}
                    label={selectedRequest.status}
                    color={getStatusColor(selectedRequest.status)}
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(selectedRequest.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Needs Assignment Status
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>Need Type</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Quantity</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Status</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Assigned To</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRequest.needs?.map((need, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{need.type}</TableCell>
                        <TableCell>{need.quantity}</TableCell>
                        <TableCell>
                          <Chip
                            label={
                              need.assignmentStatus === "assigned"
                                ? "Assigned"
                                : need.assignmentStatus === "declined"
                                ? "Declined"
                                : "Unassigned"
                            }
                            color={
                              need.assignmentStatus === "assigned"
                                ? "success"
                                : need.assignmentStatus === "declined"
                                ? "error"
                                : "default"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {need.assignedTo ? (
                            <Chip
                              label={need.assignedTo.name || "NGO"}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Not assigned
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {selectedRequest.needs?.some(
                (need) => need.assignmentStatus === "assigned"
              ) && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Some or all needs have been assigned to relief organizations.
                </Alert>
              )}

              {selectedRequest.needs?.every(
                (need) => need.assignmentStatus === "unassigned"
              ) && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  No needs have been assigned yet. Dispatchers are working on
                  assigning organizations.
                </Alert>
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRequestDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Authority;
