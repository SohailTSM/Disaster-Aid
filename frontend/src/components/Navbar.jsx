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
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

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

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <AppBar position="static" color="primary">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to={
              isAuthenticated()
                ? user?.role === "dispatcher"
                  ? "/dispatcher"
                  : "/ngo"
                : "/"
            }
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
            {!isAuthenticated() && (
              <Button
                component={RouterLink}
                to="/"
                sx={{ my: 2, color: "white", display: "block" }}>
                Request Help
              </Button>
            )}

            {isAuthenticated() && user?.role === "dispatcher" && (
              <Button
                component={RouterLink}
                to="/dispatcher"
                sx={{ my: 2, color: "white", display: "block" }}>
                Dispatcher Dashboard
              </Button>
            )}

            {isAuthenticated() && user?.role === "ngo_member" && (
              <Button
                component={RouterLink}
                to="/ngo"
                sx={{ my: 2, color: "white", display: "block" }}>
                NGO Dashboard
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
  );
}
