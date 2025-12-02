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
  Tooltip,
  Divider,
  Stack,
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
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  ErrorOutline as ErrorIcon,
  Map as MapIcon,
  BarChart as BarChartIcon,
} from "@mui/icons-material";
import {
  requestService,
  advisoryService,
  analyticsService,
  assignmentService,
} from "../services/api";
import { toast } from "react-toastify";
import CrisisHeatmap from "../components/CrisisHeatmap";

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
  const [advisories, setAdvisories] = useState([]);
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

  // Evidence and Delivery Proof dialogs
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [deliveryProofDialogOpen, setDeliveryProofDialogOpen] = useState(false);
  const [selectedDeliveryProof, setSelectedDeliveryProof] = useState(null);

  // Priority change dialog
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false);
  const [newPriority, setNewPriority] = useState("");

  // Crisis Load Dashboard state
  const [crisisData, setCrisisData] = useState(null);
  const [crisisLoading, setCrisisLoading] = useState(false);

  // Priority levels constant
  const PRIORITY_LEVELS = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    SOS: "sos",
  };

  // Get color for priority levels
  const getPriorityColor = (priority) => {
    switch (priority) {
      case PRIORITY_LEVELS.SOS:
        return "error";
      case PRIORITY_LEVELS.HIGH:
        return "warning";
      case PRIORITY_LEVELS.MEDIUM:
        return "info";
      case PRIORITY_LEVELS.LOW:
        return "success";
      default:
        return "primary";
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchAdvisories();
    fetchCrisisData();
  }, []);

  const fetchCrisisData = async () => {
    try {
      setCrisisLoading(true);
      const data = await analyticsService.getCrisisLoadDashboard();
      setCrisisData(data);
    } catch (error) {
      console.error("Error fetching crisis data:", error);
      toast.error("Failed to load crisis analytics");
    } finally {
      setCrisisLoading(false);
    }
  };

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

  // Priority change handlers
  const handleChangePriority = () => {
    if (selectedRequest) {
      setNewPriority(selectedRequest.priority || "low");
      setPriorityDialogOpen(true);
    }
  };

  const confirmChangePriority = async () => {
    if (!selectedRequest || !newPriority) return;

    try {
      await requestService.updatePriority(selectedRequest._id, newPriority);

      // Update the selected request
      const updatedRequest = {
        ...selectedRequest,
        priority: newPriority,
        isSoS: newPriority === PRIORITY_LEVELS.SOS,
      };
      setSelectedRequest(updatedRequest);

      // Update in requests list
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req._id === selectedRequest._id
            ? {
                ...req,
                priority: newPriority,
                isSoS: newPriority === PRIORITY_LEVELS.SOS,
              }
            : req
        )
      );

      toast.success(`Priority updated to ${newPriority.toUpperCase()}`);
      setPriorityDialogOpen(false);
    } catch (error) {
      console.error("Error updating priority:", error);
      toast.error("Failed to update priority");
    }
  };

  const fetchAdvisories = async () => {
    try {
      const response = await advisoryService.getAllAdvisories();
      setAdvisories(response.advisories);
    } catch (error) {
      console.error("Error fetching advisories:", error);
      toast.error("Failed to load advisories");
    }
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

  const handleSaveAdvisory = async () => {
    try {
      if (currentAdvisory._id) {
        // Update existing
        await advisoryService.updateAdvisory(currentAdvisory._id, {
          title: currentAdvisory.title,
          content: currentAdvisory.content,
          severity: currentAdvisory.severity,
          active: currentAdvisory.active,
        });
        toast.success("Advisory updated successfully");
      } else {
        // Create new
        await advisoryService.createAdvisory({
          title: currentAdvisory.title,
          content: currentAdvisory.content,
          severity: currentAdvisory.severity,
          active: currentAdvisory.active,
        });
        toast.success("Advisory created successfully");
      }
      handleCloseAdvisoryDialog();
      fetchAdvisories();
    } catch (error) {
      console.error("Error saving advisory:", error);
      toast.error("Failed to save advisory");
    }
  };

  const handleDeleteAdvisory = async (id) => {
    try {
      await advisoryService.deleteAdvisory(id);
      toast.success("Advisory deleted successfully");
      fetchAdvisories();
    } catch (error) {
      console.error("Error deleting advisory:", error);
      toast.error("Failed to delete advisory");
    }
  };

  const handleToggleAdvisory = async (id) => {
    try {
      await advisoryService.toggleAdvisoryStatus(id);
      toast.success("Advisory status updated");
      fetchAdvisories();
    } catch (error) {
      console.error("Error toggling advisory:", error);
      toast.error("Failed to update advisory status");
    }
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

  // Helper function to get color based on coverage percentage
  const getCoverageColor = (coverage) => {
    if (coverage >= 80) return "success";
    if (coverage >= 50) return "warning";
    return "error";
  };

  // Helper function to format resource type for display
  const formatResourceType = (type) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Helper function to get heatmap cell color
  const getHeatmapColor = (value, max) => {
    if (max === 0) return "rgba(76, 175, 80, 0.1)";
    const intensity = Math.min(value / max, 1);
    if (intensity > 0.7) return "rgba(244, 67, 54, 0.7)";
    if (intensity > 0.4) return "rgba(255, 152, 0, 0.5)";
    if (intensity > 0.1) return "rgba(255, 193, 7, 0.3)";
    return "rgba(76, 175, 80, 0.1)";
  };

  const CrisisLoadDashboardPanel = () => {
    if (crisisLoading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!crisisData) {
      return (
        <Alert severity="info">
          No crisis data available. Click refresh to load data.
        </Alert>
      );
    }

    const maxNeed = Math.max(
      ...Object.values(crisisData.needsVsOffers?.needs || {}),
      1
    );

    return (
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}>
          <Typography variant="h5">Crisis Load Dashboard</Typography>
          <Button
            variant="outlined"
            onClick={fetchCrisisData}
            startIcon={<DashboardIcon />}>
            Refresh Data
          </Button>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  Active Requests
                </Typography>
                <Typography variant="h4">
                  {crisisData.summary?.totalActiveRequests || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  Total NGOs
                </Typography>
                <Typography variant="h4">
                  {crisisData.summary?.totalOrganizations || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  Beneficiaries
                </Typography>
                <Typography variant="h4">
                  {crisisData.summary?.totalBeneficiaries || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ bgcolor: "error.light" }}>
              <CardContent>
                <Typography color="error.contrastText" variant="body2">
                  SOS Requests
                </Typography>
                <Typography variant="h4" color="error.contrastText">
                  {crisisData.summary?.sosRequests || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ bgcolor: "warning.light" }}>
              <CardContent>
                <Typography color="warning.contrastText" variant="body2">
                  High Priority
                </Typography>
                <Typography variant="h4" color="warning.contrastText">
                  {crisisData.summary?.highPriorityRequests || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card
              sx={{
                bgcolor:
                  crisisData.summary?.criticalShortages?.length > 0
                    ? "error.main"
                    : "success.main",
              }}>
              <CardContent>
                <Typography sx={{ color: "white" }} variant="body2">
                  Critical Shortages
                </Typography>
                <Typography variant="h4" sx={{ color: "white" }}>
                  {crisisData.summary?.criticalShortages?.length || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Critical Shortages Alert */}
        {crisisData.summary?.criticalShortages?.length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }} icon={<WarningIcon />}>
            <Typography variant="subtitle2">
              Critical Resource Shortages Detected!
            </Typography>
            <Typography variant="body2">
              The following resources have less than 50% coverage:{" "}
              <strong>
                {crisisData.summary.criticalShortages
                  .map(formatResourceType)
                  .join(", ")}
              </strong>
            </Typography>
          </Alert>
        )}

        {/* Needs vs Offers Heatmap */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            <BarChartIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Needs vs Offers by Category
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Resource Type</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Total Needs</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Unassigned</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Assigned</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>NGO Capacity</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Unmet Demand</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Coverage</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {crisisData.resourceTypes?.map((type) => {
                  const needs = crisisData.needsVsOffers?.needs?.[type] || 0;
                  const offers = crisisData.needsVsOffers?.offers?.[type] || 0;
                  const unassigned =
                    crisisData.needsVsOffers?.unassignedNeeds?.[type] || 0;
                  const assigned =
                    crisisData.needsVsOffers?.assignedNeeds?.[type] || 0;
                  const unmet = crisisData.unmetDemand?.[type] || 0;
                  const coverage = crisisData.demandCoverage?.[type] || 0;

                  return (
                    <TableRow
                      key={type}
                      sx={{ bgcolor: getHeatmapColor(needs, maxNeed) }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatResourceType(type)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={needs}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={unassigned}
                          size="small"
                          color="warning"
                          variant={unassigned > 0 ? "filled" : "outlined"}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={assigned}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={offers}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {unmet > 0 ? (
                          <Chip
                            label={unmet}
                            size="small"
                            color="error"
                            icon={<ErrorIcon />}
                          />
                        ) : (
                          <Chip
                            label="0"
                            size="small"
                            color="success"
                            icon={<CompletedIcon />}
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(coverage, 100)}
                            color={getCoverageColor(coverage)}
                            sx={{ width: 60, height: 8, borderRadius: 4 }}
                          />
                          <Typography
                            variant="body2"
                            color={`${getCoverageColor(coverage)}.main`}>
                            {coverage.toFixed(0)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Predicted Shortfalls */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            <TrendingDownIcon
              sx={{ mr: 1, verticalAlign: "middle", color: "error.main" }}
            />
            Predicted Shortfalls (Based on Current Demand Rate)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Projections based on the last 24 hours of incoming requests
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Resource Type</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Current Unmet</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>24 Hours</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>48 Hours</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>72 Hours</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Trend</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {crisisData.resourceTypes?.map((type) => {
                  const current = crisisData.unmetDemand?.[type] || 0;
                  const h24 =
                    crisisData.predictedShortfalls?.["24h"]?.[type] || 0;
                  const h48 =
                    crisisData.predictedShortfalls?.["48h"]?.[type] || 0;
                  const h72 =
                    crisisData.predictedShortfalls?.["72h"]?.[type] || 0;
                  const trend =
                    h72 > current
                      ? "increasing"
                      : h72 < current
                      ? "decreasing"
                      : "stable";

                  return (
                    <TableRow key={type}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatResourceType(type)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={current}
                          size="small"
                          color={current > 0 ? "error" : "success"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={h24}
                          size="small"
                          color={
                            h24 > current
                              ? "error"
                              : h24 > 0
                              ? "warning"
                              : "success"
                          }
                          variant={h24 > 0 ? "filled" : "outlined"}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={h48}
                          size="small"
                          color={
                            h48 > h24
                              ? "error"
                              : h48 > 0
                              ? "warning"
                              : "success"
                          }
                          variant={h48 > 0 ? "filled" : "outlined"}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={h72}
                          size="small"
                          color={
                            h72 > h48
                              ? "error"
                              : h72 > 0
                              ? "warning"
                              : "success"
                          }
                          variant={h72 > 0 ? "filled" : "outlined"}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {trend === "increasing" && (
                          <Tooltip title="Shortfall increasing">
                            <TrendingUpIcon color="error" />
                          </Tooltip>
                        )}
                        {trend === "decreasing" && (
                          <Tooltip title="Shortfall decreasing">
                            <TrendingDownIcon color="success" />
                          </Tooltip>
                        )}
                        {trend === "stable" && (
                          <Tooltip title="Stable">
                            <Chip
                              label="Stable"
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Grid container spacing={3}>
          {/* Location Heatmap */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                <MapIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                Demand Hotspots by Location
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Top 10 areas with highest request volume
              </Typography>
              {crisisData.locationHeatmap?.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>Area</strong>
                        </TableCell>
                        <TableCell align="center">
                          <strong>Requests</strong>
                        </TableCell>
                        <TableCell align="center">
                          <strong>Priority</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {crisisData.locationHeatmap.map((location, index) => (
                        <TableRow
                          key={location.area}
                          sx={{
                            bgcolor:
                              index === 0
                                ? "error.light"
                                : index < 3
                                ? "warning.light"
                                : "transparent",
                            opacity: index === 0 ? 1 : 1 - index * 0.05,
                          }}>
                          <TableCell>
                            <Typography
                              variant="body2"
                              fontWeight={index < 3 ? "bold" : "normal"}>
                              {location.area}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={location.totalRequests}
                              size="small"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                display: "flex",
                                gap: 0.5,
                                justifyContent: "center",
                              }}>
                              {location.priority?.sos > 0 && (
                                <Chip
                                  label={`${location.priority.sos} SOS`}
                                  size="small"
                                  color="error"
                                />
                              )}
                              {location.priority?.high > 0 && (
                                <Chip
                                  label={`${location.priority.high} High`}
                                  size="small"
                                  color="warning"
                                />
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">
                  No location data available
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* NGO Capacity */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                <WarehouseIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                NGO Resource Capacity
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Organizations sorted by total resource capacity
              </Typography>
              {crisisData.ngoCapacity?.length > 0 ? (
                <TableContainer sx={{ maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>Organization</strong>
                        </TableCell>
                        <TableCell align="center">
                          <strong>Total Capacity</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Resources</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {crisisData.ngoCapacity.slice(0, 10).map((ngo) => (
                        <TableRow key={ngo.name}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {ngo.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary">
                              {ngo.address?.substring(0, 30)}...
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={ngo.totalCapacity}
                              size="small"
                              color="success"
                            />
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                              }}>
                              {ngo.offers?.slice(0, 3).map((offer) => (
                                <Chip
                                  key={offer.type}
                                  label={`${formatResourceType(offer.type)}: ${
                                    offer.quantity
                                  }`}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                              {ngo.offers?.length > 3 && (
                                <Chip
                                  label={`+${ngo.offers.length - 3}`}
                                  size="small"
                                />
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">
                  No NGO capacity data available
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Map Visualization */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            <MapIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Crisis Map - Request Hotspots & NGO Locations
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Circles indicate active requests - color shows priority (red=SOS,
            orange=high, yellow=medium, green=low). Circle size reflects urgency
            and demand. Green markers show NGO locations.
          </Typography>
          {crisisData.mapData?.length > 0 ||
          crisisData.ngoMapData?.length > 0 ? (
            <CrisisHeatmap
              requests={crisisData.mapData || []}
              ngos={crisisData.ngoMapData || []}
              height={500}
              showNGOs={true}
              showLegend={true}
            />
          ) : (
            <Box
              sx={{
                height: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "grey.100",
                borderRadius: 1,
              }}>
              <Typography color="text.secondary">
                No location data available. Requests and NGOs need valid
                coordinates to appear on the map.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

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
          <Grid item xs={12} key={advisory._id}>
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
                      onClick={() => handleToggleAdvisory(advisory._id)}>
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenAdvisoryDialog(advisory)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteAdvisory(advisory._id)}>
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
          <Tab icon={<BarChartIcon />} label="Crisis Load Dashboard" />
          <Tab icon={<WarehouseIcon />} label="Shelters & Resources" />
          <Tab icon={<CampaignIcon />} label="Public Advisories" />
        </Tabs>
      </Box>

      {activeTab === 0 && <CrisisMonitoringPanel />}
      {activeTab === 1 && <CrisisLoadDashboardPanel />}
      {activeTab === 2 && <ShelterManagementPanel />}
      {activeTab === 3 && <AdvisoryManagementPanel />}

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
                    Priority
                  </Typography>
                  <Box
                    display="flex"
                    gap={1}
                    alignItems="center"
                    sx={{ mt: 0.5 }}>
                    <Chip
                      label={`${(
                        selectedRequest.priority || "low"
                      ).toUpperCase()}`}
                      color={getPriorityColor(selectedRequest.priority)}
                      size="small"
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleChangePriority}
                      startIcon={<EditIcon />}
                      disabled={selectedRequest.status === "Closed"}>
                      Change
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12}>
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
                              need.assignmentStatus === "completed"
                                ? "Completed"
                                : need.assignmentStatus === "assigned"
                                ? "Assigned"
                                : need.assignmentStatus === "declined"
                                ? "Declined"
                                : "Unassigned"
                            }
                            color={
                              need.assignmentStatus === "completed"
                                ? "primary"
                                : need.assignmentStatus === "assigned"
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
                (need) => need.assignmentStatus === "completed"
              ) && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Some or all needs have been completed by relief organizations.
                </Alert>
              )}

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
          <Button
            onClick={() => setEvidenceDialogOpen(true)}
            variant="outlined"
            sx={{ mr: "auto" }}>
            View Evidence
          </Button>
          <Button
            onClick={async () => {
              // Fetch assignments with completion proof
              try {
                const response =
                  await assignmentService.getAssignmentsByRequest(
                    selectedRequest._id
                  );
                const completedAssignments = response.assignments?.filter(
                  (a) => a.status === "Completed" && a.completionProof
                );
                if (completedAssignments && completedAssignments.length > 0) {
                  setSelectedDeliveryProof(completedAssignments);
                  setDeliveryProofDialogOpen(true);
                } else {
                  toast.info("No delivery proof available yet");
                }
              } catch (error) {
                console.error("Error fetching delivery proofs:", error);
                toast.error("Failed to load delivery proof");
              }
            }}
            variant="outlined">
            View Delivery Proof
          </Button>
          <Button onClick={handleCloseRequestDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Evidence Dialog */}
      <Dialog
        open={evidenceDialogOpen}
        onClose={() => setEvidenceDialogOpen(false)}
        maxWidth="md"
        fullWidth>
        <DialogTitle>Request Evidence</DialogTitle>
        <DialogContent>
          {selectedRequest?.evidence && selectedRequest.evidence.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Images uploaded by the victim at the time of request submission:
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {selectedRequest.evidence.map((img, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 1,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}>
                      <Box
                        component="img"
                        src={img.url}
                        alt={img.originalName || `Evidence ${index + 1}`}
                        sx={{
                          width: "100%",
                          height: 200,
                          objectFit: "cover",
                          borderRadius: 1,
                          mb: 1,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {img.originalName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Uploaded: {new Date(img.uploadedAt).toLocaleString()}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 200,
                color: "text.secondary",
              }}>
              <Typography variant="h6" gutterBottom>
                No Evidence Available
              </Typography>
              <Typography variant="body2">
                The victim did not upload any images with this request.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEvidenceDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delivery Proof Dialog */}
      <Dialog
        open={deliveryProofDialogOpen}
        onClose={() => setDeliveryProofDialogOpen(false)}
        maxWidth="md"
        fullWidth>
        <DialogTitle>Delivery Proof</DialogTitle>
        <DialogContent>
          {selectedDeliveryProof && selectedDeliveryProof.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Proof of delivery uploaded by NGOs:
              </Typography>
              <Stack spacing={3} sx={{ mt: 2 }}>
                {selectedDeliveryProof.map((assignment, index) => (
                  <Paper key={index} elevation={2} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {assignment.organizationId?.name || "NGO"}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {assignment.completionProof?.s3Key ||
                    assignment.completionProof?.imageUrl ? (
                      <Box>
                        <Box
                          component="img"
                          src={assignment.completionProof.imageUrl}
                          alt="Delivery Proof"
                          sx={{
                            width: "100%",
                            maxHeight: 400,
                            objectFit: "contain",
                            borderRadius: 1,
                            mb: 2,
                          }}
                        />
                        {assignment.completionProof.completionNotes && (
                          <Box sx={{ mt: 2 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              gutterBottom>
                              Notes:
                            </Typography>
                            <Typography variant="body1">
                              {assignment.completionProof.completionNotes}
                            </Typography>
                          </Box>
                        )}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mt: 1 }}>
                          Completed:{" "}
                          {new Date(
                            assignment.completionProof.completedAt
                          ).toLocaleString()}
                        </Typography>
                      </Box>
                    ) : (
                      <Alert severity="info">
                        NGO completed the delivery but did not upload proof
                        image.
                      </Alert>
                    )}
                  </Paper>
                ))}
              </Stack>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 200,
                color: "text.secondary",
              }}>
              <Typography variant="h6" gutterBottom>
                No Delivery Proof Available
              </Typography>
              <Typography variant="body2">
                No completed deliveries with proof of delivery yet.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeliveryProofDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Priority Change Dialog */}
      <Dialog
        open={priorityDialogOpen}
        onClose={() => setPriorityDialogOpen(false)}
        maxWidth="xs"
        fullWidth>
        <DialogTitle>Change Request Priority</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Select the new priority level for this request:
            </Typography>
            <FormControl component="fieldset" fullWidth>
              <Stack spacing={1}>
                {Object.values(PRIORITY_LEVELS).map((priority) => (
                  <Button
                    key={priority}
                    variant={
                      newPriority === priority ? "contained" : "outlined"
                    }
                    color={getPriorityColor(priority)}
                    onClick={() => setNewPriority(priority)}
                    fullWidth>
                    {priority.toUpperCase()}
                  </Button>
                ))}
              </Stack>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPriorityDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmChangePriority}
            variant="contained"
            color="primary"
            disabled={
              !newPriority || newPriority === selectedRequest?.priority
            }>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Authority;
