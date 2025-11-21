// src/components/Navbar.jsx
import React, { useContext, useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Badge,
  Drawer,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tabs,
  Tab,
  Divider,
  Tooltip,
  useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CloseIcon from '@mui/icons-material/Close';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import axios from 'axios';
import moment from 'moment';

function Navbar({ handleDrawerToggle, toggleDrawerShrink, toggleTheme, drawerWidth, drawerShrink }) {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const theme = useTheme();
  const socket = useContext(SocketContext);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

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

  useEffect(() => {
    if (socket) {
      socket.on('newNotification', (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      return () => {
        socket.off('newNotification');
      };
    }
  }, [socket]);

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`, {}, { withCredentials: true });
      setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`/api/notifications/${notificationId}`, { withCredentials: true });
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      // Recalculate unread count if needed, though usually we delete read ones too
      const count = notifications.filter(n => n._id !== notificationId && !n.read).length;
      setUnreadCount(count);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await axios.delete('/api/notifications', { withCredentials: true });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all', {}, { withCredentials: true });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const navigateToRelatedBid = (notif) => {
    if (notif.relatedBid) {
      // Determine route based on notification type or context
      // For simplicity, navigating to bid details or request details
      // Assuming we have a route for bid details
      // navigate(`/my-bids/${notif.relatedBid}`);
      // Or if it's a request owner viewing a bid:
      // navigate(`/requests/${notif.relatedBid.helpRequestId}`);

      // Since we don't have full context here, let's try to navigate to a generic bid page or just close drawer
      // For now, just mark as read and close
      if (!notif.read) markAsRead(notif._id);
      handleDrawerClose();
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (tabValue === 1) return !n.read; // Unread
    if (tabValue === 2) return n.read; // Read
    return true; // All
  });

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
          >
            HelpWise
          </Typography>

          {user && (
            <Tooltip title="Notifications" placement="bottom">
              <IconButton color="inherit" onClick={handleDrawerOpen}>
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={drawerShrink ? "Expand Drawer" : "Shrink Drawer"} placement="bottom">
            <IconButton
              color="inherit"
              onClick={toggleDrawerShrink}
              sx={{ mr: 2 }}
            >
              {drawerShrink ? <MenuIcon /> : <MenuOpenIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Toggle Light/Dark Theme" placement="bottom">
            <Button color="inherit" onClick={toggleTheme}>
              {theme.palette.mode === 'light' ? 'Dark Mode' : 'Light Mode'}
            </Button>
          </Tooltip>

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

      {/* Notification Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerClose}
        PaperProps={{
          sx: { width: 350, maxWidth: '100%' }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          <IconButton onClick={handleDrawerClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 1 }}>
          <Button size="small" startIcon={<DoneAllIcon />} onClick={markAllAsRead} disabled={unreadCount === 0}>
            Mark all read
          </Button>
          <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={clearAllNotifications} disabled={notifications.length === 0}>
            Clear all
          </Button>
        </Box>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" indicatorColor="primary" textColor="primary">
          <Tab label="All" />
          <Tab label={`Unread (${unreadCount})`} />
          <Tab label="Read" />
        </Tabs>
        <List sx={{ overflowY: 'auto', flexGrow: 1 }}>
          {filteredNotifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No notifications</Typography>
            </Box>
          ) : (
            filteredNotifications.map(notif => (
              <React.Fragment key={notif._id}>
                <ListItem
                  alignItems="flex-start"
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={() => deleteNotification(notif._id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                  sx={{
                    bgcolor: notif.read ? 'transparent' : 'action.hover',
                    cursor: 'pointer'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      <NotificationsIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={notif.message}
                    secondary={
                      <React.Fragment>
                        <Typography
                          sx={{ display: 'inline' }}
                          component="span"
                          variant="caption"
                          color="text.primary"
                        >
                          {moment(notif.createdAt).fromNow()}
                        </Typography>
                        {!notif.read && (
                          <Button size="small" sx={{ ml: 1, minWidth: 'auto', p: 0 }} onClick={() => markAsRead(notif._id)}>
                            Mark Read
                          </Button>
                        )}
                      </React.Fragment>
                    }
                    onClick={() => navigateToRelatedBid(notif)}
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))
          )}
        </List>
      </Drawer>
    </>
  );
}

export default Navbar;
