import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/api";
import { toast } from "react-toastify";
import { useState } from "react";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate("/");
  };

  const handleOpenChangePassword = () => {
    handleClose();
    setChangePasswordOpen(true);
  };

  const handleCloseChangePassword = () => {
    setChangePasswordOpen(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      await authService.changePassword(oldPassword, newPassword);
      toast.success("Password changed successfully");
      handleCloseChangePassword();
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <>
    <AppBar position="static" color="primary">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              fontWeight: 700,
              color: "inherit",
              textDecoration: "none",
              "&:hover": {
                opacity: 0.9,
              },
            }}>
            DisasterAid
          </Typography>

          <Box sx={{ flexGrow: 1, display: "flex", ml: 3 }}>
            <Button
              component={RouterLink}
              to="/"
              sx={{ my: 2, color: "white", display: "block" }}>
              Home
            </Button>

            {!isAuthenticated() && (
              <>
                <Button
                  component={RouterLink}
                  to="/request"
                  sx={{ my: 2, color: "white", display: "block" }}>
                  Request Help
                </Button>
                <Button
                  component={RouterLink}
                  to="/track-status"
                  sx={{ my: 2, color: "white", display: "block" }}>
                  Track Status
                </Button>
                <Button
                  component={RouterLink}
                  to="/advisories"
                  sx={{ my: 2, color: "white", display: "block" }}>
                  Advisories
                </Button>
              </>
            )}

            {isAuthenticated() && user?.role === "dispatcher" && (
              <Button
                component={RouterLink}
                to="/dispatcher"
                sx={{ my: 2, color: "white", display: "block" }}>
                Dashboard
              </Button>
            )}

            {isAuthenticated() && user?.role === "ngo_member" && (
              <Button
                component={RouterLink}
                to="/ngo"
                sx={{ my: 2, color: "white", display: "block" }}>
                Dashboard
              </Button>
            )}

            {isAuthenticated() && user?.role === "admin" && (
              <Button
                component={RouterLink}
                to="/admin"
                sx={{ my: 2, color: "white", display: "block" }}>
                Dashboard
              </Button>
            )}

            {isAuthenticated() && user?.role === "authority" && (
              <Button
                component={RouterLink}
                to="/authority"
                sx={{ my: 2, color: "white", display: "block" }}>
                Dashboard
              </Button>
            )}
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            {isAuthenticated() ? (
              <>
                <IconButton
                  onClick={handleMenu}
                  size="small"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  color="inherit">
                  <Avatar sx={{ bgcolor: "secondary.main" }}>
                    {getInitials(user?.name || "U")}
                  </Avatar>
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={open}
                  onClose={handleClose}>
                  <MenuItem disabled>{user?.name}</MenuItem>
                  <MenuItem disabled>{user?.email}</MenuItem>
                  <MenuItem onClick={handleOpenChangePassword}>Change Password</MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  component={RouterLink}
                  to="/login"
                  color="inherit"
                  sx={{ mx: 1 }}>
                  Login
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="outlined"
                  color="inherit"
                  sx={{ ml: 1 }}>
                  Register Your NGO
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>

    {/* Change Password Dialog */}
    <Dialog
      open={changePasswordOpen}
      onClose={handleCloseChangePassword}
      maxWidth="sm"
      fullWidth>
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Current Password"
            type="password"
            fullWidth
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            autoComplete="current-password"
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Must be at least 6 characters"
            autoComplete="new-password"
          />
          <TextField
            label="Confirm New Password"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseChangePassword} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleChangePassword}
          variant="contained"
          color="primary"
          disabled={loading}>
          {loading ? "Changing..." : "Change Password"}
        </Button>
      </DialogActions>
    </Dialog>
  </>
  );
}
