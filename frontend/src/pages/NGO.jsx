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
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  Divider
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  DirectionsCar as InProgressIcon,
  Warning as HighPriorityIcon,
  People as PeopleIcon,
  LocalHospital as MedicalIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// Sample data for the dashboard
const statsData = [
  { 
    title: 'Total Volunteers', 
    value: '1,234', 
    change: '+12%', 
    isPositive: true,
    icon: <PeopleIcon sx={{ color: 'primary.main' }} />
  },
  { 
    title: 'Active Requests', 
    value: '45', 
    change: '+5', 
    isPositive: true,
    icon: <MedicalIcon sx={{ color: 'error.main' }} />
  },
  { 
    title: 'Areas Covered', 
    value: '12', 
    change: '+2', 
    isPositive: true,
    icon: <LocationIcon sx={{ color: 'success.main' }} />
  },
  { 
    title: 'Avg. Response Time', 
    value: '2.5h', 
    change: '-0.5h', 
    isPositive: false,
    icon: <TimeIcon sx={{ color: 'warning.main' }} />
  }
];

const recentRequests = [
  {
    id: 'REQ-001',
    location: 'Mumbai, Maharashtra',
    type: 'Medical Supplies',
    status: 'In Progress',
    date: '2023-11-10',
    priority: 'High',
    assignedTo: 'Team A'
  },
  {
    id: 'REQ-002',
    location: 'Chennai, Tamil Nadu',
    type: 'Food & Water',
    status: 'Pending',
    date: '2023-11-09',
    priority: 'Medium',
    assignedTo: 'Team B'
  },
  {
    id: 'REQ-003',
    location: 'Kolkata, West Bengal',
    type: 'Shelter',
    status: 'Completed',
    date: '2023-11-08',
    priority: 'High',
    assignedTo: 'Team C'
  },
  {
    id: 'REQ-004',
    location: 'Bangalore, Karnataka',
    type: 'Medical Team',
    status: 'In Progress',
    date: '2023-11-07',
    priority: 'Medium',
    assignedTo: 'Team A'
  },
  {
    id: 'REQ-005',
    location: 'Delhi NCR',
    type: 'Clothing',
    status: 'Pending',
    date: '2023-11-06',
    priority: 'Low',
    assignedTo: 'Unassigned'
  }
];

export default function NGO() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'info';
      case 'Pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'error';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Welcome back, {user?.name || 'User'}!
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Here's what's happening with your disaster relief efforts
          </Typography>
        </Box>
        <Button variant="contained" color="primary" size="large">
          New Request
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        {statsData.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card elevation={0} sx={{ 
              borderRadius: 2,
              height: '100%',
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    {stat.title}
                  </Typography>
                  <Avatar sx={{ 
                    bgcolor: 'action.hover',
                    width: 40,
                    height: 40
                  }}>
                    {stat.icon}
                  </Avatar>
                </Box>
                <Typography variant="h5" fontWeight="bold" mb={1}>
                  {stat.value}
                </Typography>
                <Box display="flex" alignItems="center">
                  {stat.isPositive ? 
                    <ArrowUpIcon color="success" fontSize="small" /> : 
                    <ArrowDownIcon color="error" fontSize="small" />
                  }
                  <Typography 
                    variant="caption" 
                    color={stat.isPositive ? 'success.main' : 'error.main'}
                    ml={0.5}
                  >
                    {stat.change}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" ml={1}>
                    vs last week
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Requests */}
      <Card elevation={0} sx={{ 
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight="bold">
              Recent Requests
            </Typography>
            <Button color="primary">View All</Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Request ID</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentRequests.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {request.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <LocationIcon color="action" fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {request.location}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{request.type}</TableCell>
                    <TableCell>
                      <Chip 
                        label={request.status} 
                        size="small" 
                        color={getStatusColor(request.status)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{request.date}</TableCell>
                    <TableCell>
                      <Chip 
                        label={request.priority} 
                        size="small" 
                        color={getPriorityColor(request.priority)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={request.assignedTo} 
                        size="small" 
                        variant="outlined"
                        color={request.assignedTo === 'Unassigned' ? 'default' : 'primary'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button 
                        size="small" 
                        color="primary"
                        sx={{ textTransform: 'none' }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Recent Activity Section */}
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            height: '100%'
          }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Recent Activity
              </Typography>
              <Stack spacing={2}>
                {[1, 2, 3].map((item) => (
                  <Box key={item}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="subtitle2" fontWeight="medium">
                        New request assigned to your team
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        2h ago
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Request #REQ-00{item + 5} for medical supplies in Pune
                    </Typography>
                    <Divider sx={{ mt: 2 }} />
                  </Box>
                ))}
              </Stack>
              <Button 
                fullWidth 
                size="small" 
                sx={{ mt: 2 }}
                color="primary"
              >
                View All Activity
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            height: '100%'
          }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                {[
                  { icon: <PeopleIcon />, label: 'Manage Volunteers' },
                  { icon: <MedicalIcon />, label: 'Add Supplies' },
                  { icon: <LocationIcon />, label: 'Update Location' },
                  { icon: <TimeIcon />, label: 'Schedule Pickup' }
                ].map((action, index) => (
                  <Grid item xs={6} key={index}>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        height: '100%',
                        flexDirection: 'column',
                        color: 'text.primary',
                        borderColor: 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <Box mb={1} color="primary.main">
                        {action.icon}
                      </Box>
                      <Typography variant="caption">
                        {action.label}
                      </Typography>
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
