// src/components/Drawer.jsx

import React, { useContext } from 'react';
import {
  Drawer as MUIDrawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tooltip,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AddBoxIcon from '@mui/icons-material/AddBox';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import GavelIcon from '@mui/icons-material/Gavel';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { useTheme } from '@mui/material/styles'; // Import useTheme

function Drawer({ mobileOpen, handleDrawerToggle, drawerWidth }) {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const theme = useTheme(); // Access the current theme

  // Handle user logout
  const handleLogout = async () => {
    try {
      await axios.get('/api/users/logout', { withCredentials: true });
      setUser(null);
      navigate('/');
      handleDrawerToggle();
    } catch (err) {
      console.error(err);
      // Optionally handle error (e.g., show notification)
    }
  };

  // Determine if Drawer is shrunk
  const isShrunk = drawerWidth <= 80;

  // Determine text color based on theme mode
  const textColor = theme.palette.mode === 'dark' ? 'white' : 'black';

  // Drawer Content
  const drawerContent = (
    <div style={{ padding: '16px' }}>
      <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Online Help */}
        <Tooltip title="HelpWise" placement="right">
          <ListItem
            button
            component={Link}
            to="/help"
            onClick={handleDrawerToggle}
            sx={{
              borderRadius: '12px',
              mb: 1,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                transform: 'translateX(4px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <ListItemIcon sx={{ minWidth: '40px', color: theme.palette.primary.main }}>
              <SupportAgentIcon />
            </ListItemIcon>
            {!isShrunk && (
              <ListItemText
                primary="HelpWise"
                primaryTypographyProps={{ fontWeight: 600, color: textColor }}
              />
            )}
          </ListItem>
        </Tooltip>

        {/* Home */}
        <Tooltip title="Home" placement="right">
          <ListItem
            button
            component={Link}
            to="/"
            onClick={handleDrawerToggle}
            sx={{
              borderRadius: '12px',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                transform: 'translateX(4px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <ListItemIcon sx={{ minWidth: '40px', color: theme.palette.primary.main }}>
              <HomeIcon />
            </ListItemIcon>
            {!isShrunk && (
              <ListItemText
                primary="Home"
                primaryTypographyProps={{ fontWeight: 500, color: textColor }}
              />
            )}
          </ListItem>
        </Tooltip>

        {user && (
          <>
            {/* Create Request */}
            <Tooltip title="Create a New Help Request" placement="right">
              <ListItem
                button
                component={Link}
                to="/create-request"
                onClick={handleDrawerToggle}
                sx={{
                  borderRadius: '12px',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemIcon sx={{ minWidth: '40px', color: theme.palette.primary.main }}>
                  <AddBoxIcon />
                </ListItemIcon>
                {!isShrunk && (
                  <ListItemText
                    primary="Create Request"
                    primaryTypographyProps={{ fontWeight: 500, color: textColor }}
                  />
                )}
              </ListItem>
            </Tooltip>

            {/* My Requests */}
            <Tooltip title="My Requests" placement="right">
              <ListItem
                button
                component={Link}
                to="/my-requests"
                onClick={handleDrawerToggle}
                sx={{
                  borderRadius: '12px',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemIcon sx={{ minWidth: '40px', color: theme.palette.primary.main }}>
                  <AssignmentIcon />
                </ListItemIcon>
                {!isShrunk && (
                  <ListItemText
                    primary="My Requests"
                    primaryTypographyProps={{ fontWeight: 500, color: textColor }}
                  />
                )}
              </ListItem>
            </Tooltip>

            {/* All Requests */}
            <Tooltip title="View All Help Requests" placement="right">
              <ListItem
                button
                component={Link}
                to="/all-requests"
                onClick={handleDrawerToggle}
                sx={{
                  borderRadius: '12px',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemIcon sx={{ minWidth: '40px', color: theme.palette.primary.main }}>
                  <ListAltIcon />
                </ListItemIcon>
                {!isShrunk && (
                  <ListItemText
                    primary="All Requests"
                    primaryTypographyProps={{ fontWeight: 500, color: textColor }}
                  />
                )}
              </ListItem>
            </Tooltip>

            {/* My Bids */}
            <Tooltip title="View Your Bids" placement="right">
              <ListItem
                button
                component={Link}
                to="/my-bids"
                onClick={handleDrawerToggle}
                sx={{
                  borderRadius: '12px',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemIcon sx={{ minWidth: '40px', color: theme.palette.primary.main }}>
                  <GavelIcon />
                </ListItemIcon>
                {!isShrunk && (
                  <ListItemText
                    primary="My Bids"
                    primaryTypographyProps={{ fontWeight: 500, color: textColor }}
                  />
                )}
              </ListItem>
            </Tooltip>

            {/* Conversations */}
            <Tooltip title="View Conversations" placement="right">
              <ListItem
                button
                component={Link}
                to="/conversations"
                onClick={handleDrawerToggle}
                sx={{
                  borderRadius: '12px',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemIcon sx={{ minWidth: '40px', color: theme.palette.primary.main }}>
                  <ChatIcon />
                </ListItemIcon>
                {!isShrunk && (
                  <ListItemText
                    primary="Conversations"
                    primaryTypographyProps={{ fontWeight: 500, color: textColor }}
                  />
                )}
              </ListItem>
            </Tooltip>

            {/* Profile */}
            <Tooltip title="View Your Profile" placement="right">
              <ListItem
                button
                component={Link}
                to="/profile"
                onClick={handleDrawerToggle}
                sx={{
                  borderRadius: '12px',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemIcon sx={{ minWidth: '40px', color: theme.palette.primary.main }}>
                  <PersonIcon />
                </ListItemIcon>
                {!isShrunk && (
                  <ListItemText
                    primary="Profile"
                    primaryTypographyProps={{ fontWeight: 500, color: textColor }}
                  />
                )}
              </ListItem>
            </Tooltip>

            {/* Logout */}
            <Tooltip title="Logout" placement="right">
              <ListItem
                button
                onClick={handleLogout}
                sx={{
                  borderRadius: '12px',
                  mt: 2,
                  color: theme.palette.error.main,
                  '&:hover': {
                    backgroundColor: theme.palette.error.light,
                    color: theme.palette.error.dark,
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemIcon sx={{ minWidth: '40px', color: 'inherit' }}>
                  <LogoutIcon />
                </ListItemIcon>
                {!isShrunk && (
                  <ListItemText
                    primary="Logout"
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                )}
              </ListItem>
            </Tooltip>
          </>
        )}
      </List>
    </div>
  );

  return (
    <>
      {/* Temporary Drawer for Mobile */}
      <MUIDrawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </MUIDrawer>

      {/* Permanent Drawer for Desktop */}
      <MUIDrawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            transition: 'width 0.3s',
            overflowX: 'hidden',
          },
        }}
        open
      >
        {drawerContent}
      </MUIDrawer>
    </>
  );
}

export default Drawer;
