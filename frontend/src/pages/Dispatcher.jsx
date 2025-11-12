import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
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
  Avatar,
  CircularProgress,
  Divider,
  Chip,
  IconButton
} from '@mui/material';
import {
  People as PeopleIcon,
  LocalShipping as LocalShippingIcon,
  Assignment as AssignmentIcon,
  AccessTime as AccessTimeIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';


// Mock data for the dashboard
const statsData = [
  {
    title: 'Total Requests',
    value: '1,234',
    change: 12.5,
    icon: <AssignmentIcon fontSize="large" />,
    color: 'primary.main'
  },
  {
    title: 'Active Requests',
    value: '45',
    change: -2.3,
    icon: <LocalShippingIcon fontSize="large" />,
    color: 'warning.main'
  },
  {
    title: 'Areas Covered',
    value: '12',
    change: 5.2,
    icon: <PeopleIcon fontSize="large" />,
    color: 'success.main'
  },
  {
    title: 'Avg. Response Time',
    value: '2.5h',
    change: -10.8,
    icon: <AccessTimeIcon fontSize="large" />,
    color: 'info.main'
  }
];

// Mock data for NGOs with their capabilities
const ngos = [
  {
    _id: 'ngo1',
    name: 'Food Relief Foundation',
    contact: '9876543210',
    capabilities: ['Food', 'Clothing']
  },
  {
    _id: 'ngo2',
    name: 'Medical Aid International',
    contact: '9876543211',
    capabilities: ['Medical', 'First Aid']
  },
  {
    _id: 'ngo3',
    name: 'Shelter for All',
    contact: '9876543212',
    capabilities: ['Shelter', 'Clothing']
  },
  {
    _id: 'ngo4',
    name: 'Rapid Response Team',
    contact: '9876543213',
    capabilities: ['Food', 'Medical', 'Shelter', 'Clothing']
  }
];

const recentRequests = [
  {
    id: '#D-12350',
    location: 'Hyderabad, Telangana',
    status: 'New',
    date: '2023-11-12',
    priority: 'High',
    assignedTo: {},
    contactName: 'Rajesh Kumar',
    contactPhone: '9876543210',
    beneficiaries: 25,
    needs: [
      { type: 'Food', items: ['Rice (10kg)', 'Dal (5kg)', 'Cooking Oil (2L)'], quantity: 25, assignedTo: null },
      { type: 'Shelter', items: ['Tents', 'Blankets'], quantity: 10, assignedTo: null }
    ],
    description: 'Urgent supplies needed for flood-affected families in the area.'
  },
  {
    id: '#D-12349',
    location: 'Pune, Maharashtra',
    status: 'New',
    date: '2023-11-12',
    priority: 'High',
    assignedTo: {},
    contactName: 'Dr. Priya Singh',
    contactPhone: '9876543211',
    beneficiaries: 15,
    needs: [
      { type: 'Medical', items: ['First Aid Kits', 'Medicines', 'Masks'], quantity: 15, assignedTo: null },
      { type: 'Food', items: ['Biscuits', 'Water Bottles'], quantity: 15, assignedTo: null }
    ],
    description: 'Medical camp setup required for temporary shelter residents.'
  },
  {
    id: '#D-12348',
    location: 'Mumbai, Maharashtra',
    status: 'Partially Assigned',
    date: '2023-11-12',
    priority: 'High',
    assignedTo: { 'Shelter': 'ngo3' },
    contactName: 'Amit Patel',
    contactPhone: '9876543212',
    beneficiaries: 50,
    needs: [
      { type: 'Shelter', items: ['Tents', 'Blankets', 'Mats'], quantity: 25, assignedTo: 'ngo3' },
      { type: 'Food', items: ['Ready-to-eat meals'], quantity: 50, assignedTo: null }
    ],
    description: 'Temporary shelter and food needed for families displaced by recent floods.'
  }
];

const recentActivity = [
  { id: 1, action: 'Request #D-12345 assigned to NGO A', time: '2 min ago' },
  { id: 2, action: 'New request received from Mumbai', time: '15 min ago' },
  { id: 3, action: 'Request #D-12343 marked as completed', time: '1 hour ago' },
  { id: 4, action: 'NGO B updated status for request #D-12344', time: '3 hours ago' },
  { id: 5, action: 'New volunteer registered', time: '5 hours ago' }
];

export default function Dispatcher() {
  const [allRequests, setAllRequests] = useState(recentRequests);
  const [filteredRequests, setFilteredRequests] = useState(recentRequests);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedNgo, setSelectedNgo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'assigned', 'unassigned', 'partially-assigned'
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [assignments, setAssignments] = useState({});

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
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

  const navigate = useNavigate();

  const handleViewRequest = (request) => {
    navigate(`/request/${request._id || request.id}`, {
      state: { request }
    });
  };

  const handleAssignRequest = () => {
    if (selectedRequest && selectedNgo) {
      // Update the request status and assigned NGO
      setAllRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === selectedRequest.id
            ? { ...req, status: 'Assigned', assignedTo: selectedNgo }
            : req
        )
      );
      handleCloseDialog();
    }
  };

  const handleNeedAssignment = (requestId, needType, ngoId) => {
    setAllRequests(prevRequests =>
      prevRequests.map(req => {
        if (req.id !== requestId) return req;

        const updatedNeeds = req.needs.map(need =>
          need.type === needType ? { ...need, assignedTo: ngoId } : need
        );

        // Update assignedTo with all current assignments
        const newAssignedTo = {};
        updatedNeeds.forEach(need => {
          if (need.assignedTo) {
            newAssignedTo[need.type] = need.assignedTo;
          }
        });

        // Determine status based on assignments
        const totalNeeds = req.needs.length;
        const assignedNeeds = updatedNeeds.filter(n => n.assignedTo).length;
        let status = 'New';

        if (assignedNeeds === totalNeeds) {
          status = 'Fully Assigned';
        } else if (assignedNeeds > 0) {
          status = 'Partially Assigned';
        }

        return {
          ...req,
          needs: updatedNeeds,
          assignedTo: newAssignedTo,
          status: assignedNeeds > 0 ? (assignedNeeds === totalNeeds ? 'Fully Assigned' : 'Partially Assigned') : 'New'
        };
      })
    );
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Filter requests based on status
  useEffect(() => {
    let filtered = [...allRequests];

    if (statusFilter === 'assigned') {
      filtered = filtered.filter(request =>
        request.status === 'Fully Assigned' || request.status === 'Partially Assigned'
      );
    } else if (statusFilter === 'unassigned') {
      filtered = filtered.filter(request => request.status === 'New');
    } else if (statusFilter === 'partially-assigned') {
      filtered = filtered.filter(request => request.status === 'Partially Assigned');
    }

    setFilteredRequests(filtered);
  }, [allRequests, statusFilter]);

  const getStatusChip = (status) => {
    const statusColors = {
      'New': 'primary',
      'Assigned': 'warning',
      'In Progress': 'info',
      'Pending': 'warning',
      'Completed': 'success',
      'Cancelled': 'error',
      'Fully Assigned': 'success',
      'Partially Assigned': 'warning'
    };

    return (
      <Chip
        label={status}
        color={statusColors[status] || 'default'}
        size="small"
      />
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

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
                <MenuItem value="assigned">Assigned</MenuItem>
                <MenuItem value="unassigned">Unassigned</MenuItem>
                <MenuItem value="partially-assigned">Partially Assigned</MenuItem>
              </Select>
            </FormControl>
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
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
                <TableCell>Needs</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.id}</TableCell>
                  <TableCell>
                    {Object.keys(request.assignedTo || {}).length > 0 ? (
                      Object.entries(request.assignedTo).map(([type, ngoId]) => (
                        <Box key={type} sx={{ mb: 0.5 }}>
                          <Chip
                            size="small"
                            label={`${type}: ${ngos.find(n => n._id === ngoId)?.name || ngoId}`}
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        </Box>
                      ))
                    ) : 'Unassigned'}
                  </TableCell>
                  <TableCell>{request.location}</TableCell>
                  <TableCell>N/A</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {request.needs.map((need, idx) => (
                        <Chip
                          key={idx}
                          label={`${need.type} (${need.quantity})`}
                          size="small"
                          color={need.assignedTo ? 'success' : 'default'}
                          variant={need.assignedTo ? 'filled' : 'outlined'}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>{getStatusChip(request.status || 'New')}</TableCell>
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
                        disabled={request.status !== 'New'}
                      >
                        {request.status === 'New' ? 'Assign' : 'Assigned'}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Request to NGO</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Request Details:
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Contact:</strong> {selectedRequest?.contactName} ({selectedRequest?.contactPhone})<br />
              <strong>Location:</strong> {selectedRequest?.location}<br />
              <strong>Beneficiaries:</strong> {selectedRequest?.beneficiaries}<br />
              <strong>Needs:</strong> {selectedRequest?.needs?.join(', ')}
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
            onClick={handleAssignRequest}
            variant="contained"
            disabled={!selectedNgo}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Request Dialog */}
      <Dialog open={viewDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Request Details - {selectedRequest?.id}</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 2 }}>
              {/* Needs Assignment Section */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>Needs Assignment</Typography>
                <Divider sx={{ mb: 2 }} />

                {selectedRequest.needs.map((need, index) => (
                  <Box key={index} sx={{
                    mb: 2,
                    p: 2,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    backgroundColor: need.assignedTo ? '#e8f5e9' : '#fff'
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1">
                        <strong>Type:</strong> {need.type}
                        <Chip
                          label={need.assignedTo ? 'Assigned' : 'Unassigned'}
                          size="small"
                          color={need.assignedTo ? 'success' : 'default'}
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                      {need.assignedTo && (
                        <Chip
                          label={`Assigned to: ${ngos.find(n => n._id === need.assignedTo)?.name || need.assignedTo}`}
                          color="primary"
                          size="small"
                        />
                      )}
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2"><strong>Items:</strong> {need.items.join(', ')}</Typography>
                      <Typography variant="body2"><strong>Quantity:</strong> {need.quantity} people</Typography>
                    </Box>

                    <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                      <InputLabel>Assign to NGO</InputLabel>
                      <Select
                        value={need.assignedTo || ''}
                        label="Assign to NGO"
                        onChange={(e) => handleNeedAssignment(selectedRequest.id, need.type, e.target.value)}
                        disabled={!!need.assignedTo}
                      >
                        <MenuItem value="">
                          <em>Select NGO</em>
                        </MenuItem>
                        {ngos
                          .filter(ngo => ngo.capabilities.includes(need.type))
                          .map((ngo) => (
                            <MenuItem key={ngo._id} value={ngo._id}>
                              {ngo.name} ({ngo.contact})
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>

                    {need.assignedTo && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleNeedAssignment(selectedRequest.id, need.type, null)}
                        sx={{ mt: 1 }}
                      >
                        Unassign
                      </Button>
                    )}
                  </Box>
                ))}
              </Box>
              <Typography variant="h6" gutterBottom>Request Information</Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Request ID</Typography>
                  <Typography variant="body1" gutterBottom>{selectedRequest.id}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                  <Box sx={{ display: 'inline-block' }}>
                    {selectedRequest.status === 'Fully Assigned' ? (
                      <Chip label="Fully Assigned" color="success" size="small" />
                    ) : selectedRequest.status === 'Partially Assigned' ? (
                      <Chip label="Partially Assigned" color="warning" size="small" />
                    ) : (
                      <Chip label="New" size="small" />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Location</Typography>
                  <Typography variant="body1" gutterBottom>{selectedRequest.location}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Request Type</Typography>
                  <Chip
                    label={selectedRequest.type}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Priority</Typography>
                  <Chip
                    label={selectedRequest.priority}
                    size="small"
                    color={selectedRequest.priority === 'High' ? 'error' : 'default'}
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Date</Typography>
                  <Typography variant="body1" gutterBottom>{selectedRequest.date}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Assigned To</Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedRequest.assignedTo || 'Unassigned'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedRequest.description || 'No description available'}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Contact Information</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Contact Person</Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedRequest.contactName || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Contact Number</Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedRequest.contactPhone || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
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
