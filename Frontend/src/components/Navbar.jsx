// src/components/Navbar.jsx
import React, { useContext, useEffect, useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Button, 
  Badge, 
  Menu, 
  MenuItem, 
  ListItemText 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';

function Navbar({ handleDrawerToggle, toggleDrawerShrink, toggleTheme, drawerWidth, drawerShrink }) {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const theme = useTheme();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications', { withCredentials: true });
      setNotifications(res.data);
      const count = res.data.filter(notif => !notif.read).length;
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Optional: Polling every 30 seconds for new notifications
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const handleNotificationClick = (event) => {
    setAnchorEl(event.currentTarget);
    // Optionally mark notifications as read
    // For simplicity, marking all as read when menu is opened
    markAllAsRead();
  };

  const handleNotificationClose = () => {
    setAnchorEl(null);
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(notif => !notif.read);
      await Promise.all(
        unreadNotifications.map(notif =>
          axios.put(`/api/notifications/${notif._id}/read`, {}, { withCredentials: true })
        )
      );
      setUnreadCount(0);
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notif => ({ ...notif, read: true }))
      );
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        zIndex: theme.zIndex.drawer + 1, // Ensure Navbar is above Drawer
      }}
    >
      <Toolbar>
        {/* Menu button for mobile view */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        {/* Application Title */}
        <Typography 
          variant="h6" 
          component={Link} 
          to="/" 
          sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
        >
          HelpWise
        </Typography>

        {/* Notifications Icon */}
        {user && (
          <>
            <Tooltip title="Notifications" placement="bottom">
              <IconButton color="inherit" onClick={handleNotificationClick}>
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleNotificationClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              {notifications.length === 0 ? (
                <MenuItem disabled>
                  <ListItemText primary="No Notifications" />
                </MenuItem>
              ) : (
                notifications.map(notif => (
                  <MenuItem key={notif._id} onClick={() => navigateToRelatedBid(notif)}>
                    <ListItemText 
                      primary={notif.message} 
                      secondary={new Date(notif.createdAt).toLocaleString()} 
                      sx={{ opacity: notif.read ? 0.6 : 1 }}
                    />
                  </MenuItem>
                ))
              )}
            </Menu>
          </>
        )}

        {/* Shrink/Expand Drawer Icon */}
        <Tooltip title={drawerShrink ? "Expand Drawer" : "Shrink Drawer"} placement="bottom">
          <IconButton
            color="inherit"
            onClick={toggleDrawerShrink}
            sx={{ mr: 2 }}
          >
            {drawerShrink ? <MenuIcon /> : <MenuOpenIcon />}
          </IconButton>
        </Tooltip>

        {/* Theme Toggle Button */}
        <Tooltip title="Toggle Light/Dark Theme" placement="bottom">
          <Button color="inherit" onClick={toggleTheme}>
            {theme.palette.mode === 'light' ? 'Dark Mode' : 'Light Mode'}
          </Button>
        </Tooltip>

        {/* Navigation Links (visible only on larger screens) */}
        {user ? (
          <>
            <Tooltip title="Create a New Help Request" placement="bottom">
              <Button color="inherit" component={Link} to="/create-request" sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
                Create Request
              </Button>
            </Tooltip>
            <Tooltip title="View Your Profile" placement="bottom">
              <Button color="inherit" component={Link} to="/profile" sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
                Profile
              </Button>
            </Tooltip>
            <Tooltip title="View All Help Requests" placement="bottom">
              <Button color="inherit" component={Link} to="/all-requests" sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
                All Requests
              </Button>
            </Tooltip>
            <Tooltip title="Logout" placement="bottom">
              <Button color="inherit" onClick={() => {
                axios.post('/api/users/logout', {}, { withCredentials: true })
                  .then(() => {
                    setUser(null);
                    navigate('/');
                  })
                  .catch(err => console.error(err));
              }} sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
                Logout
              </Button>
            </Tooltip>
          </>
        ) : (
          <>
            <Tooltip title="Login to Your Account" placement="bottom">
              <Button color="inherit" component={Link} to="/login" sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
                Login
              </Button>
            </Tooltip>
            <Tooltip title="Register a New Account" placement="bottom">
              <Button color="inherit" component={Link} to="/register" sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
                Register
              </Button>
            </Tooltip>
          </>
        )}
      </Toolbar>
    </AppBar>
  )
}

export default Navbar;
