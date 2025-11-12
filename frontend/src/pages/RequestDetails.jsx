import { useState, useEffect } from 'react';
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
  Grid
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';

// Mock data for the request
const mockRequest = {
  id: 'REQ-12345',
  contactName: 'John Doe',
  contactPhone: '+1 (555) 123-4567',
  location: '123 Main St, Anytown, CA 90210',
  beneficiaries: 150,
  status: 'Active',
  type: 'Flood Relief',
  priority: 'High',
  date: '2023-11-13',
  notes: 'Urgent supplies needed for flood-affected families. Many homes are underwater and people have lost everything.',
  needs: [
    {
      type: 'Food',
      quantity: 150,
      items: ['Ready-to-eat meals', 'Bottled water', 'Snacks'],
      assignedTo: 'ngo1'
    },
    {
      type: 'Shelter',
      quantity: 50,
      items: ['Tents', 'Blankets', 'Sleeping bags'],
      assignedTo: 'ngo3'
    },
    {
      type: 'Medical',
      quantity: 30,
      items: ['First aid kits', 'Medicines', 'Hygiene kits'],
      assignedTo: null
    }
  ]
};

// Mock NGO data
const mockNGOs = [
  { id: 'ngo1', name: 'Food Relief Foundation' },
  { id: 'ngo2', name: 'Medical Aid International' },
  { id: 'ngo3', name: 'Shelter for All' },
  { id: 'ngo4', name: 'Rapid Response Team' }
];

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [request, setRequest] = useState(location.state?.request || null);
  const [loading, setLoading] = useState(!location.state?.request);
  const [error, setError] = useState('');
  const [assignedNGOs, setAssignedNGOs] = useState({});
  const [selectedNeed, setSelectedNeed] = useState(null);
  const [openNgoDialog, setOpenNgoDialog] = useState(false);

  const handleViewNGOs = (need) => {
    setSelectedNeed(need);
    setOpenNgoDialog(true);
  };

  const handleAssignNGO = (ngoId) => {
    if (!selectedNeed) return;

    setAssignedNGOs(prev => ({
      ...prev,
      [selectedNeed.type]: ngoId,
    }));

    setRequest(prev => ({
      ...prev,
      needs: prev.needs.map(need =>
        need.type === selectedNeed.type
          ? { ...need, assignedTo: ngoId }
          : need
      ),
    }));

    setOpenNgoDialog(false);
  };

  const handleAssignAll = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/dispatcher');
    } catch (err) {
      console.error('Error updating request:', err);
      setError('Failed to update request. Please try again.');
    }
  };

  const handleDecline = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/dispatcher');
    } catch (err) {
      console.error('Error declining request:', err);
      setError('Failed to decline request. Please try again.');
    }
  };

  const getNgoName = (ngoId) => {
    if (!ngoId) return 'Not assigned';
    const ngo = mockNGOs.find(n => n.id === ngoId);
    return ngo ? ngo.name : 'Unknown NGO';
  };

  useEffect(() => {
    if (location.state?.request) {
      const requestData = location.state.request;
      setRequest(requestData);
      const initialAssignments = {};
      requestData.needs?.forEach(need => {
        if (need.assignedTo) {
          initialAssignments[need.type] = need.assignedTo;
        }
      });
      setAssignedNGOs(initialAssignments);
      setLoading(false);
      return;
    }

    const fetchRequest = async () => {
      try {
        setTimeout(() => {
          setRequest(mockRequest);
          const initialAssignments = {};
          mockRequest.needs.forEach(need => {
            if (need.assignedTo) {
              initialAssignments[need.type] = need.assignedTo;
            }
          });
          setAssignedNGOs(initialAssignments);
          setLoading(false);
        }, 500);
      } catch (err) {
        setError('Failed to load request details');
        console.error('Error:', err);
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, location.state]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography color="error" gutterBottom>Error: {error}</Typography>
        <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (!request) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>Request not found</Typography>
        <Button component={Link} to="/dispatcher" startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  const allNeedsAssigned = request.needs.every(need => assignedNGOs[need.type]);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button component={Link} to="/dispatcher" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Back to Dashboard
      </Button>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Request Details</Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1"><strong>Request ID:</strong> {request.id}</Typography>
              <Typography variant="subtitle1"><strong>Contact:</strong> {request.contactName}</Typography>
              <Typography variant="subtitle1"><strong>Phone:</strong> {request.contactPhone}</Typography>
              <Typography variant="subtitle1"><strong>Type:</strong> {request.type}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1"><strong>Location:</strong> {request.location}</Typography>
              <Typography variant="subtitle1"><strong>Beneficiaries:</strong> {request.beneficiaries}</Typography>
              <Typography variant="subtitle1"><strong>Status:</strong> {request.status}</Typography>
              <Typography variant="subtitle1"><strong>Priority:</strong> {request.priority}</Typography>
            </Grid>
          </Grid>
          {request.notes && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2">Notes:</Typography>
              <Typography variant="body2">{request.notes}</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Required Assistance</Typography>
          <Divider sx={{ mb: 2 }} />
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Need</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {request.needs.map((need, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {need.type}
                        {assignedNGOs[need.type] && <CheckCircleIcon color="success" fontSize="small" />}
                      </Box>
                    </TableCell>
                    <TableCell>{need.items.join(', ')}</TableCell>
                    <TableCell align="right">{need.quantity}</TableCell>
                    <TableCell>
                      {assignedNGOs[need.type] ? (
                        <Chip icon={<BusinessIcon />} label={getNgoName(assignedNGOs[need.type])} color="primary" size="small" />
                      ) : (
                        <Chip label="Not assigned" color="default" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="outlined" size="small" onClick={() => handleViewNGOs(need)}>
                        {assignedNGOs[need.type] ? 'Change NGO' : 'Assign NGO'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" color="error" onClick={handleDecline}>
              Decline Request
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAssignAll}
              disabled={!allNeedsAssigned}
              startIcon={<LocalShippingIcon />}
            >
              Assign All & Complete
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={openNgoDialog} onClose={() => setOpenNgoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedNeed && `Assign NGO for ${selectedNeed.type} (${selectedNeed.quantity} needed)`}</DialogTitle>
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
                  {mockNGOs.map((ngo) => (
                    <TableRow key={ngo.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BusinessIcon color="primary" />
                          {ngo.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {['Food', 'Shelter', 'Medical'].map(capability => (
                          <Chip key={capability} label={capability} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleAssignNGO(ngo.id)}
                        >
                          {assignedNGOs[selectedNeed.type] === ngo.id ? 'Assigned' : 'Assign'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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