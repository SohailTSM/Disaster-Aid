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
  Chip,
  Box,
  CircularProgress
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  DirectionsCar as InProgressIcon,
  Warning as HighPriorityIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function NGO() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Mock data for demo purposes
  const mockAssignments = [
    {
      id: '1',
      request: {
        contactName: 'John Doe',
        contactPhone: '123-456-7890',
        location: '123 Main St, City',
        needs: ['Food', 'Water', 'Blankets'],
        priority: 'High',
        status: 'Pending',
        createdAt: new Date().toISOString()
      }
    },
    {
      id: '2',
      request: {
        contactName: 'Jane Smith',
        contactPhone: '987-654-3210',
        location: '456 Oak Ave, Town',
        needs: ['Medical Supplies', 'First Aid'],
        priority: 'Medium',
        status: 'In-Progress',
        assignedTo: user?.name || 'Your Organization',
        assignedAt: new Date().toISOString()
      }
    }
  ];

  useEffect(() => {
    // In a real app, you would fetch assignments from your API
    const fetchAssignments = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAssignments(mockAssignments);
      } catch (error) {
        console.error('Error fetching assignments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatus = async (id, status) => {
    try {
      // In a real app, you would update the status via API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAssignments(prev => 
        prev.map(assignment => 
          assignment.id === id 
            ? { 
                ...assignment, 
                request: { 
                  ...assignment.request, 
                  status,
                  ...(status === 'In-Progress' && {
                    assignedTo: user?.name || 'Your Organization',
                    assignedAt: new Date().toISOString()
                  })
                } 
              } 
            : assignment
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      'Pending': { color: 'warning', icon: <PendingIcon fontSize="small" /> },
      'In-Progress': { color: 'info', icon: <InProgressIcon fontSize="small" /> },
      'Completed': { color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
      'High': { color: 'error', icon: <HighPriorityIcon fontSize="small" /> },
      'Medium': { color: 'warning', icon: null },
      'Low': { color: 'success', icon: null }
    };

    const { color, icon } = statusMap[status] || { color: 'default', icon: null };
    
    return (
      <Chip
        icon={icon}
        label={status}
        color={color}
        size="small"
        variant="outlined"
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Aid Request Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {user?.organization || 'Your Organization'}
        </Typography>
      </Box>

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Request ID</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Needs</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.length > 0 ? (
              assignments.map((assignment) => (
                <TableRow key={assignment.id} hover>
                  <TableCell>#{assignment.id}</TableCell>
                  <TableCell>
                    <Box>
                      <div>{assignment.request.contactName}</div>
                      <Typography variant="body2" color="text.secondary">
                        {assignment.request.contactPhone}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{assignment.request.location}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {assignment.request.needs.map((need, idx) => (
                        <Chip 
                          key={idx} 
                          label={need} 
                          size="small" 
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(assignment.request.priority)}
                  </TableCell>
                  <TableCell>
                    {getStatusChip(assignment.request.status)}
                  </TableCell>
                  <TableCell>
                    {assignment.request.assignedTo || 'Unassigned'}
                    {assignment.request.assignedAt && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {new Date(assignment.request.assignedAt).toLocaleString()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      {assignment.request.status === 'Pending' && (
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          onClick={() => updateStatus(assignment.id, 'In-Progress')}
                        >
                          Accept
                        </Button>
                      )}
                      {assignment.request.status === 'In-Progress' && (
                        <Button
                          variant="contained"
                          size="small"
                          color="success"
                          onClick={() => updateStatus(assignment.id, 'Completed')}
                        >
                          Mark Complete
                        </Button>
                      )}
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => {
                          // View details action
                          console.log('View details for:', assignment.id);
                        }}
                      >
                        Details
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No assignments found. Check back later for new requests.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
