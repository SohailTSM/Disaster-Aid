import { useEffect, useState } from 'react';
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
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { requestService, organizationService, assignmentService } from '../services/api';

export default function Dispatcher() {
  const [requests, setRequests] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedNgo, setSelectedNgo] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([loadRequests(), loadNGOs()]);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await requestService.getRequests();
      setRequests(data);
    } catch (err) {
      console.error('Error loading requests:', err);
      throw err;
    }
  };

  const loadNGOs = async () => {
    try {
      const data = await organizationService.getOrganizations(true);
      setNgos(data);
    } catch (err) {
      console.error('Error loading NGOs:', err);
      throw err;
    }
  };

  const handleOpenDialog = (request) => {
    setSelectedRequest(request);
    setSelectedNgo('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleAssign = async () => {
    if (!selectedRequest || !selectedNgo) return;
    
    try {
      await assignmentService.createAssignment({
        requestId: selectedRequest._id,
        organizationId: selectedNgo,
      });
      await loadRequests();
      handleCloseDialog();
    } catch (err) {
      console.error('Error assigning request:', err);
      setError('Failed to assign request. Please try again.');
    }
  };

  const getStatusChip = (status) => {
    const statusColors = {
      'New': 'primary',
      'Assigned': 'warning',
      'In Progress': 'info',
      'Completed': 'success',
      'Cancelled': 'error'
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
        <Typography variant="h6" gutterBottom>All Requests</Typography>
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
              {requests.map((request) => (
                <TableRow key={request._id}>
                  <TableCell>{request._id.substring(0, 6)}...</TableCell>
                  <TableCell>
                    <div>{request.contactName}</div>
                    <div>{request.contactPhone}</div>
                  </TableCell>
                  <TableCell>{request.location}</TableCell>
                  <TableCell>{request.beneficiaries}</TableCell>
                  <TableCell>
                    {request.needs.map((need) => (
                      <Chip 
                        key={need} 
                        label={need} 
                        size="small" 
                        sx={{ mr: 0.5, mb: 0.5 }} 
                      />
                    ))}
                  </TableCell>
                  <TableCell>{getStatusChip(request.status || 'New')}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => handleOpenDialog(request)}
                      disabled={request.status !== 'New'}
                    >
                      {request.status === 'New' ? 'Assign' : 'Assigned'}
                    </Button>
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
            onClick={handleAssign} 
            variant="contained"
            disabled={!selectedNgo}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
