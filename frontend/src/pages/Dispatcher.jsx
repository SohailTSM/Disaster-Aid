import { useEffect, useState, useContext } from 'react';
// Removed unused router hooks: useParams, useNavigate, Link, useLocation
import { requestService, organizationService, assignmentService } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
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
  // Avatar, // Not used
  CircularProgress,
  Divider,
  Chip,
  // IconButton, // Not used
  Alert // Added Alert for error handling
} from '@mui/material';
import {
  People as PeopleIcon,
  LocalShipping as LocalShippingIcon,
  Assignment as AssignmentIcon,
  AccessTime as AccessTimeIcon,
  // ArrowUpward as ArrowUpwardIcon, // Not used
  // ArrowDownward as ArrowDownwardIcon, // Not used
  // MoreVert as MoreVertIcon, // Not used
  // CheckCircle as CheckCircleIcon, // Not used
  // Pending as PendingIcon, // Not used
  // Error as ErrorIcon, // Not used
  Add as AddIcon,
  // Search as SearchIcon, // Not used
  // FilterList as FilterListIcon, // Not used
  Refresh as RefreshIcon
} from '@mui/icons-material';


// Status mapping for requests
const REQUEST_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Priority levels
const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case REQUEST_STATUS.ASSIGNED:
      return 'info';
    case REQUEST_STATUS.IN_PROGRESS:
      return 'warning';
    case REQUEST_STATUS.COMPLETED:
      return 'success';
    case REQUEST_STATUS.CANCELLED:
      return 'error';
    case REQUEST_STATUS.PENDING:
    default:
      return 'default';
  }
};

// Helper function to render a status chip
const getStatusChip = (status) => {
  const label = status ? status.replace('_', ' ') : 'Pending';
  return (
    <Chip
      label={label}
      color={getStatusColor(status)}
      size="small"
      sx={{ textTransform: 'capitalize' }}
    />
  );
};

export default function Dispatcher() {
  const { user } = useContext(AuthContext);
  const [allRequests, setAllRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedNgo, setSelectedNgo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  // Stats data is initialized but not rendered in the provided JSX.
  // Kept for completeness.
  const [statsData, setStatsData] = useState([
    { title: 'Total Requests', value: '0', change: 0, icon: <AssignmentIcon fontSize="large" />, color: 'primary.main' },
    { title: 'Active Requests', value: '0', change: 0, icon: <LocalShippingIcon fontSize="large" />, color: 'warning.main' },
    { title: 'Areas Covered', value: '0', change: 0, icon: <PeopleIcon fontSize="large" />, color: 'success.main' },
    { title: 'Avg. Response Time', value: '0h', change: 0, icon: <AccessTimeIcon fontSize="large" />, color: 'info.main' }
  ]);
  // recentActivity is initialized but not rendered. Kept for completeness.
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all requests
        const requests = await requestService.getRequests();
        setAllRequests(requests);
        setFilteredRequests(requests);
        
        // Fetch all NGOs
        const ngoList = await organizationService.getOrganizations();
        setNgos(ngoList);
        
        // Update stats
        updateStats(requests);
        
        // Fetch recent activity (you might need to implement this endpoint)
        // const activity = await activityService.getRecentActivity();
        // setRecentActivity(activity);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data. Please try again.');
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []); // Empty dependency array ensures this runs once on mount

  const updateStats = (requests) => {
    if (!requests) return;
    
    const totalRequests = requests.length;
    const activeRequests = requests.filter(
      req => req.status !== REQUEST_STATUS.COMPLETED && req.status !== REQUEST_STATUS.CANCELLED
    ).length;
    
    // Calculate unique areas (simplified)
    const areas = new Set(requests.map(req => req.location?.city || 'Unknown'));
    
    // Update stats
    setStatsData([
      { ...statsData[0], value: totalRequests.toString() },
      { ...statsData[1], value: activeRequests.toString() },
      { ...statsData[2], value: areas.size.toString() },
      statsData[3] // Keep response time as is for now
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
    setSelectedNgo('');
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
        status: 'assigned', // This is the assignment status
        notes: `Assigned to ${ngos.find(ngo => ngo._id === selectedNgo)?.name || 'NGO'}`
      };
      
      await assignmentService.createAssignment(assignmentData);
      
      // Update request status
      const updatedRequest = await requestService.updateRequest(selectedRequest._id, {
        status: REQUEST_STATUS.ASSIGNED, // This is the request status
        updatedBy: user._id
      });
      
      // Update local state
      const updatedRequests = allRequests.map(req => 
        req._id === updatedRequest._id ? updatedRequest : req
      );
      
      setAllRequests(updatedRequests);
      // setFilteredRequests(updatedRequests); // Let the useEffect handle filtering
      updateStats(updatedRequests);
      
      toast.success('Successfully assigned request to NGO');
      handleCloseDialog();
      
    } catch (error) {
      console.error('Error assigning request:', error);
      toast.error(error.response?.data?.message || 'Failed to assign request');
    } finally {
      setLoading(false);
    }
  };
  
  // This function is not called by any UI element in the fixed code,
  // but it's valid logic if you add buttons to change status.
  const handleStatusChange = async (requestId, newStatus) => {
    try {
      setLoading(true);
      
      const updatedRequest = await requestService.updateRequestStatus(requestId, { 
        status: newStatus,
        updatedBy: user._id 
      });
      
      // Update local state
      const updatedRequests = allRequests.map(req => 
        req._id === updatedRequest._id ? updatedRequest : req
      );
      
      setAllRequests(updatedRequests);
      updateStats(updatedRequests);
      toast.success(`Request status updated to ${newStatus}`);
      
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error(error.response?.data?.message || 'Failed to update request status');
    } finally {
      setLoading(false);
    }
  };
  
  // Centralized filter logic
  const filterRequests = (status) => {
    setStatusFilter(status);
    
    if (status === 'all') {
      setFilteredRequests(allRequests);
      return;
    }
    
    const filtered = allRequests.filter(request => {
      if (status === 'active') {
        return request.status === REQUEST_STATUS.ASSIGNED || 
               request.status === REQUEST_STATUS.IN_PROGRESS;
      }
      return request.status === status;
    });
    
    setFilteredRequests(filtered);
  };
  
  // Filter requests based on status (runs when allRequests or statusFilter changes)
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredRequests(allRequests);
      return;
    }
    
    const filtered = allRequests.filter(request => {
      if (statusFilter === 'active') {
        return request.status === REQUEST_STATUS.ASSIGNED || 
               request.status === REQUEST_STATUS.IN_PROGRESS;
      }
      return request.status === statusFilter;
    });
    
    setFilteredRequests(filtered);
  }, [allRequests, statusFilter]);
  
  // Loading state for initial fetch
  if (loading && allRequests.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">Dispatcher Dashboard</Typography>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" component="h2">Recent Requests</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Filter by Status"
              >
                <MenuItem value="all">All Requests</MenuItem>
                <MenuItem value={REQUEST_STATUS.PENDING}>Pending</MenuItem>
                <MenuItem value="active">Active (Assigned/In Progress)</MenuItem>
                <MenuItem value={REQUEST_STATUS.COMPLETED}>Completed</MenuItem>
                <MenuItem value={REQUEST_STATUS.CANCELLED}>Cancelled</MenuItem>
              </Select>
            </FormControl>
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()} // Simple refresh
              variant="outlined"
            >
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
              {filteredRequests.map((request) => (
                <TableRow key={request._id}>
                  <TableCell>{request._id.substring(0, 8)}...</TableCell>
                  <TableCell>{request.contactName || 'N/A'}</TableCell>
                  <TableCell>{request.location?.city || request.location?.address || 'N/A'}</TableCell>
                  <TableCell>{request.beneficiaries || 'N/A'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {request.items?.map((item, idx) => (
                        <Chip
                          key={item._id || idx}
                          label={`${item.name} (${item.quantity})`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>{getStatusChip(request.status)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewRequest(request)}
                      >
                        View
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleOpenDialog(request)}
                        disabled={request.status !== REQUEST_STATUS.PENDING}
                      >
                        {request.status === REQUEST_STATUS.PENDING ? 'Assign' : 'Assigned'}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Assign NGO Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Request to NGO</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Request Details:
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Contact:</strong> {selectedRequest?.contactName} ({selectedRequest?.contactPhone})<br />
              <strong>Location:</strong> {selectedRequest?.location?.address}<br />
              <strong>Beneficiaries:</strong> {selectedRequest?.beneficiaries}<br />
              <strong>Items:</strong> {selectedRequest?.items?.map(item => `${item.name} (${item.quantity})`).join(', ') || 'N/A'}
            </Typography>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="ngo-select-label">Select NGO</InputLabel>
              <Select
                labelId="ngo-select-label"
                value={selectedNgo}
                label="Select NGO"
                onChange={(e) => setSelectedNgo(e.target.value)}
              >
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
            disabled={!selectedNgo || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Request Dialog */}
      <Dialog open={viewDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest ? (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    #{selectedRequest.requestId || selectedRequest._id?.substring(0, 8)} - {selectedRequest.location?.address}
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    {getStatusChip(selectedRequest.status)}
                    <Chip 
                      label={selectedRequest.priority || 'Medium'} 
                      color={
                        selectedRequest.priority === PRIORITY_LEVELS.HIGH || selectedRequest.priority === PRIORITY_LEVELS.URGENT 
                          ? 'error' : 'default'
                      }
                      variant="outlined"
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>
                </Box>
                <Box textAlign="right">
                  <Typography variant="caption" color="textSecondary" display="block">
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
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                        Request Information
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Box mb={2}>
                        <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                        <Typography variant="body1" paragraph>
                          {selectedRequest.description || 'No description provided'}
                        </Typography>
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">Contact Name</Typography>
                          <Typography variant="body1">
                            {selectedRequest.contactName || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">Contact Phone</Typography>
                          <Typography variant="body1">
                            {selectedRequest.contactPhone || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="textSecondary">Email</Typography>
                          <Typography variant="body1">
                            {selectedRequest.contactEmail || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">Beneficiaries</Typography>
                          <Typography variant="body1">
                            {selectedRequest.beneficiaries || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="textSecondary">Location</Typography>
                          <Typography variant="body1">
                            {selectedRequest.location?.address || 'N/A'}
                            {selectedRequest.location?.city && `, ${selectedRequest.location.city}`}
                            {selectedRequest.location?.state && `, ${selectedRequest.location.state}`}
                            {selectedRequest.location?.pincode && ` - ${selectedRequest.location.pincode}`}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                          Required Items
                        </Typography>
                        {selectedRequest.status !== REQUEST_STATUS.COMPLETED && (
                          <Button 
                            size="small" 
                            variant="outlined" 
                            startIcon={<AddIcon />}
                            onClick={() => {
                              toast.info('Add items functionality would be implemented here');
                            }}
                          >
                            Add Items
                          </Button>
                        )}
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      
                      {selectedRequest.items?.length > 0 ? (
                        <Box>
                          {selectedRequest.items.map((item, index) => (
                            <Box 
                              key={item._id || index} 
                              mb={2} 
                              p={1.5} 
                              bgcolor="grey.50" 
                              borderRadius={1}
                              border="1px solid"
                              borderColor="divider"
                            >
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box>
                                  <Typography variant="subtitle2">
                                    {item.name} - {item.quantity} {item.unit || 'units'}
                                  </Typography>
                                  {item.description && (
                                    <Typography variant="body2" color="textSecondary" paragraph>
                                      {item.description}
                                    </Typography>
                                  )}
                                  <Typography variant="caption" color="textSecondary">
                                    Category: {item.category || 'General'}
                                  </Typography>
                                </Box>
                                
                                <Box>
                                  {/* Item status chip (if item has its own status) */}
                                  {item.status && getStatusChip(item.status)}
                                </Box>
                              </Box>
                              
                              {/* This logic was for Model 2 (item-level assignment).
                                In Model 1, the whole request is assigned.
                                We'll show the main assignment details in the 'Assignments' card below.
                              */}
                              
                              {/* Button to assign a single item (Model 2 logic) */}
                              {/* {selectedRequest.status === REQUEST_STATUS.PENDING && (
                                <Box mt={1} display="flex" justifyContent="flex-end">
                                  <Button 
                                    size="small" 
                                    variant="outlined"
                                    onClick={() => {
                                      // This re-uses the main dialog
                                      setSelectedRequest(selectedRequest);
                                      setSelectedNgo('');
                                      setDialogOpen(true);
                                      setViewDialogOpen(false);
                                    }}
                                  >
                                    Assign NGO
                                  </Button>
                                </Box>
                              )}
                              */}
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Box textAlign="center" py={2}>
                          <Typography color="textSecondary">No items added to this request</Typography>
                          {selectedRequest.status !== REQUEST_STATUS.COMPLETED && (
                            <Button 
                              size="small" 
                              variant="text" 
                              startIcon={<AddIcon />}
                              onClick={() => {
                                toast.info('Add items functionality would be implemented here');
                              }}
                              sx={{ mt: 1 }}
                            >
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
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
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
                              borderRadius={1}
                            >
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                  <Typography variant="subtitle2">
                                    {assignment.organization?.name || 'NGO'}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    Assigned by: {assignment.assignedBy?.name || 'System'}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {formatDate(assignment.assignedAt)}
                                  </Typography>
                                </Box>
                                {getStatusChip(assignment.status)}
                              </Box>
                              
                              {assignment.notes && (
                                <Box mt={1} pt={1} borderTop="1px dashed" borderColor="divider">
                                  <Typography variant="body2">
                                    {assignment.notes}
                                  </Typography>
                                </Box>
                              )}
                              
                              {assignment.updatedAt !== assignment.createdAt && (
                                <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                                  Last updated: {formatDate(assignment.updatedAt)}
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
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}