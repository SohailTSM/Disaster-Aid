import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Alert,
  Chip,
  IconButton,
  Snackbar,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  Block,
  CheckCircleOutline,
  Delete,
  Download,
} from "@mui/icons-material";
import { organizationService, userService } from "../services/api";

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ paddingTop: "20px" }}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function Admin() {
  const [tabValue, setTabValue] = useState(0);
  const [pendingOrgs, setPendingOrgs] = useState([]);
  const [approvedOrgs, setApprovedOrgs] = useState([]);
  const [dispatchers, setDispatchers] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(""); // 'suspend', 'reject', 'delete', 'createUser'
  const [selectedItem, setSelectedItem] = useState(null);
  const [reason, setReason] = useState("");

  // User creation form
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "dispatcher", // or 'authority'
  });

  useEffect(() => {
    if (tabValue === 0) loadPendingOrgs();
    else if (tabValue === 1) loadApprovedOrgs();
    else if (tabValue === 2) loadUsers();
  }, [tabValue]);

  const loadPendingOrgs = async () => {
    try {
      setLoading(true);
      const data = await organizationService.getPendingOrganizations();
      setPendingOrgs(data.organizations || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load pending organizations"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadApprovedOrgs = async () => {
    try {
      setLoading(true);
      const data = await organizationService.getOrganizations(true);
      setApprovedOrgs(data.organizations || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const [dispatcherData, authorityData] = await Promise.all([
        userService.getDispatchers(),
        userService.getAuthorities(),
      ]);
      setDispatchers(dispatcherData.users || []);
      setAuthorities(authorityData.users || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await organizationService.approveOrganization(id);
      setSuccess("Organization approved successfully");
      loadPendingOrgs();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve organization");
    }
  };

  const handleReject = async () => {
    try {
      await organizationService.rejectOrganization(selectedItem._id);
      setSuccess("Organization rejected successfully");
      setOpenDialog(false);
      loadPendingOrgs();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject organization");
    }
  };

  const handleSuspend = async () => {
    try {
      if (dialogType === "suspendOrg") {
        await organizationService.suspendOrganization(selectedItem._id, reason);
        setSuccess("Organization suspended successfully");
        loadApprovedOrgs();
      } else if (dialogType === "suspendUser") {
        await userService.suspendUser(selectedItem._id, reason);
        setSuccess("User suspended successfully");
        loadUsers();
      }
      setOpenDialog(false);
      setReason("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to suspend");
    }
  };

  const handleUnsuspend = async (item, type) => {
    try {
      if (type === "org") {
        await organizationService.unsuspendOrganization(item._id);
        setSuccess("Organization unsuspended successfully");
        loadApprovedOrgs();
      } else if (type === "user") {
        await userService.unsuspendUser(item._id);
        setSuccess("User unsuspended successfully");
        loadUsers();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unsuspend");
    }
  };

  const handleDelete = async () => {
    try {
      if (dialogType === "deleteOrg") {
        await organizationService.deleteOrganization(selectedItem._id);
        setSuccess("Organization deleted successfully");
        loadApprovedOrgs();
      } else if (dialogType === "deleteUser") {
        await userService.deleteUser(selectedItem._id);
        setSuccess("User deleted successfully");
        loadUsers();
      }
      setOpenDialog(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete");
    }
  };

  const handleCreateUser = async () => {
    try {
      if (userForm.role === "dispatcher") {
        await userService.createDispatcher(userForm);
      } else {
        await userService.createAuthority(userForm);
      }
      setSuccess(`${userForm.role} created successfully`);
      setOpenDialog(false);
      setUserForm({ name: "", email: "", password: "", role: "dispatcher" });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    }
  };

  const handleExportIncidents = async () => {
    try {
      const blob = await organizationService.exportIncidents();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "incidents.json";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess("Incidents exported successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to export incidents");
    }
  };

  const openDialogWithType = (type, item = null) => {
    setDialogType(type);
    setSelectedItem(item);
    setOpenDialog(true);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Pending NGOs" />
          <Tab label="Manage NGOs" />
          <Tab label="User Management" />
          <Tab label="Data Retention" />
          <Tab label="Export Data" />
        </Tabs>

        {/* Tab 0: Pending NGOs */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Organization Name</TableCell>
                  <TableCell>Head Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Offers</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingOrgs.map((org) => (
                  <TableRow key={org._id}>
                    <TableCell>{org.name}</TableCell>
                    <TableCell>{org.headName}</TableCell>
                    <TableCell>{org.contactEmail}</TableCell>
                    <TableCell>{org.address}</TableCell>
                    <TableCell>
                      {org.offers?.map((offer, idx) => (
                        <Chip
                          key={idx}
                          label={`${offer.type}: ${offer.quantity}`}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="success"
                        onClick={() => handleApprove(org._id)}
                        title="Approve">
                        <CheckCircle />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => openDialogWithType("rejectOrg", org)}
                        title="Reject">
                        <Cancel />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {pendingOrgs.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No pending organizations
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab 1: Manage NGOs (Suspend/Unsuspend) */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Organization Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {approvedOrgs.map((org) => (
                  <TableRow key={org._id}>
                    <TableCell>{org.name}</TableCell>
                    <TableCell>{org.contactEmail}</TableCell>
                    <TableCell>
                      {org.suspended ? (
                        <Chip label="Suspended" color="error" size="small" />
                      ) : (
                        <Chip label="Active" color="success" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {org.suspended ? (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleOutline />}
                          onClick={() => handleUnsuspend(org, "org")}>
                          Unsuspend
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          color="warning"
                          startIcon={<Block />}
                          onClick={() => openDialogWithType("suspendOrg", org)}>
                          Suspend
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {approvedOrgs.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No approved organizations
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab 2: User Management */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              onClick={() => {
                setUserForm({ ...userForm, role: "dispatcher" });
                openDialogWithType("createDispatcher");
              }}
              sx={{ mr: 1 }}>
              Create Dispatcher
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setUserForm({ ...userForm, role: "authority" });
                openDialogWithType("createAuthority");
              }}>
              Create Authority
            </Button>
          </Box>

          <Typography variant="h6" gutterBottom>
            Dispatchers
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dispatchers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.suspended ? (
                        <Chip label="Suspended" color="error" size="small" />
                      ) : (
                        <Chip label="Active" color="success" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.suspended ? (
                        <Button
                          size="small"
                          onClick={() => handleUnsuspend(user, "user")}>
                          Unsuspend
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          onClick={() =>
                            openDialogWithType("suspendUser", user)
                          }>
                          Suspend
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" gutterBottom>
            Authorities
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {authorities.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.suspended ? (
                        <Chip label="Suspended" color="error" size="small" />
                      ) : (
                        <Chip label="Active" color="success" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.suspended ? (
                        <Button
                          size="small"
                          onClick={() => handleUnsuspend(user, "user")}>
                          Unsuspend
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          onClick={() =>
                            openDialogWithType("suspendUser", user)
                          }>
                          Suspend
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab 3: Data Retention */}
        <TabPanel value={tabValue} index={3}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This section allows permanent deletion of organizations and users.
            This action cannot be undone.
          </Alert>

          <Typography variant="h6" gutterBottom>
            Delete Organizations
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Organization Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {approvedOrgs.map((org) => (
                  <TableRow key={org._id}>
                    <TableCell>{org.name}</TableCell>
                    <TableCell>{org.contactEmail}</TableCell>
                    <TableCell>
                      {org.suspended ? (
                        <Chip label="Suspended" color="error" size="small" />
                      ) : (
                        <Chip label="Active" color="success" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => openDialogWithType("deleteOrg", org)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" gutterBottom>
            Delete Users
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...dispatchers, ...authorities].map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip label={user.role} size="small" />
                    </TableCell>
                    <TableCell>
                      {user.suspended ? (
                        <Chip label="Suspended" color="error" size="small" />
                      ) : (
                        <Chip label="Active" color="success" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => openDialogWithType("deleteUser", user)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab 4: Export Data */}
        <TabPanel value={tabValue} index={4}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Export incident data for analysis and reporting.
          </Alert>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportIncidents}>
            Export Incidents (JSON)
          </Button>
        </TabPanel>
      </Paper>

      {/* Multi-purpose Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {dialogType === "rejectOrg" && "Reject Organization"}
          {dialogType === "suspendOrg" && "Suspend Organization"}
          {dialogType === "suspendUser" && "Suspend User"}
          {dialogType === "deleteOrg" && "Delete Organization"}
          {dialogType === "deleteUser" && "Delete User"}
          {(dialogType === "createDispatcher" ||
            dialogType === "createAuthority") &&
            `Create ${
              userForm.role === "dispatcher" ? "Dispatcher" : "Authority"
            }`}
        </DialogTitle>
        <DialogContent>
          {(dialogType === "rejectOrg" ||
            dialogType === "suspendOrg" ||
            dialogType === "suspendUser") && (
            <>
              <DialogContentText>
                {dialogType === "rejectOrg" &&
                  "Are you sure you want to reject this organization?"}
                {dialogType === "suspendOrg" &&
                  "Please provide a reason for suspending this organization:"}
                {dialogType === "suspendUser" &&
                  "Please provide a reason for suspending this user:"}
              </DialogContentText>
              {(dialogType === "suspendOrg" ||
                dialogType === "suspendUser") && (
                <TextField
                  autoFocus
                  margin="dense"
                  label="Reason"
                  fullWidth
                  multiline
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              )}
            </>
          )}

          {(dialogType === "deleteOrg" || dialogType === "deleteUser") && (
            <DialogContentText>
              Are you sure you want to permanently delete this{" "}
              {dialogType === "deleteOrg" ? "organization" : "user"}? This
              action cannot be undone.
            </DialogContentText>
          )}

          {(dialogType === "createDispatcher" ||
            dialogType === "createAuthority") && (
            <>
              <TextField
                autoFocus
                margin="dense"
                label="Name"
                fullWidth
                value={userForm.name}
                onChange={(e) =>
                  setUserForm({ ...userForm, name: e.target.value })
                }
              />
              <TextField
                margin="dense"
                label="Email"
                type="email"
                fullWidth
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
              />
              <TextField
                margin="dense"
                label="Password"
                type="password"
                fullWidth
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          {dialogType === "rejectOrg" && (
            <Button onClick={handleReject} color="error">
              Reject
            </Button>
          )}
          {(dialogType === "suspendOrg" || dialogType === "suspendUser") && (
            <Button onClick={handleSuspend} color="warning">
              Suspend
            </Button>
          )}
          {(dialogType === "deleteOrg" || dialogType === "deleteUser") && (
            <Button onClick={handleDelete} color="error">
              Delete
            </Button>
          )}
          {(dialogType === "createDispatcher" ||
            dialogType === "createAuthority") && (
            <Button onClick={handleCreateUser} color="primary">
              Create
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}>
        <Alert onClose={() => setError("")} severity="error">
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess("")}>
        <Alert onClose={() => setSuccess("")} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
}
