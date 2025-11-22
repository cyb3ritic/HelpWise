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
  useMediaQuery,
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Handle user logout
  const handleLogout = async () => {
    try {
      await axios.get('/api/users/logout', { withCredentials: true });
      setUser(null);
      navigate('/');
      if (isMobile) handleDrawerToggle();
    } catch (err) {
      console.error(err);
      // Optionally handle error (e.g., show notification)
    }
  };

  const handleItemClick = () => {
    if (isMobile) {
      handleDrawerToggle();
    }
  };

  // Determine if Drawer is shrunk
  const isShrunk = drawerWidth <= 80;

  // Determine text color based on theme mode
  const textColor = theme.palette.mode === 'dark' ? 'white' : 'black';

  // Drawer Content
  const drawerContent = (
    <div>
      <List>
        {/* Online Help */}
        <Tooltip title="HelpWise" placement="right">
          <ListItem
            button
            component={Link}
            to="/help"
            onClick={handleItemClick}
          >
            <ListItemIcon>
              <SupportAgentIcon />
            </ListItemIcon>
            {!isShrunk && (
              <ListItemText primary="HelpWise" sx={{ color: textColor }} />
            )}
          </ListItem>
        </Tooltip>

        {/* Home */}
        <Tooltip title="Home" placement="right">
          <ListItem
            button
            component={Link}
            to="/"
            onClick={handleItemClick}
          >
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            {!isShrunk && (
              <ListItemText primary="Home" sx={{ color: textColor }} />
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
                onClick={handleItemClick}
              >
                <ListItemIcon>
                  <AddBoxIcon />
                </ListItemIcon>
                {!isShrunk && (
                  <ListItemText primary="Create Request" sx={{ color: textColor }} />
                )}
              </ListItem>
            </Tooltip>

            {/* My Requests */}
            <Tooltip title="My Requests" placement="right">
              <ListItem
                button
                component={Link}
                to="/my-requests"
                onClick={handleItemClick}
              >
                <ListItemIcon>
                  <AssignmentIcon />
                </ListItemIcon>
                {!isShrunk && (
                  <ListItemText primary="My Requests" sx={{ color: textColor }} />
                )}
              </ListItem>
            </Tooltip>

            {/* All Requests */}
            <Tooltip title="View All Help Requests" placement="right">
              <ListItem
                button
                component={Link}
                to="/all-requests"
                onClick={handleItemClick}
              >
                <ListItemIcon>
                  <ListAltIcon />
                </ListItemIcon>
                {!isShrunk && (
                  <ListItemText primary="All Requests" sx={{ color: textColor }} />
                )}
              </ListItem>
            </Tooltip>

            {/* My Bids */}
            <Tooltip title="View Your Bids" placement="right">
              <ListItem
                button
                component={Link}
                to="/my-bids"
                onClick={handleItemClick}
              >
                <ListItemIcon>
                  <GavelIcon />
                </ListItemIcon>
                {!isShrunk && (
                  <ListItemText primary="My Bids" sx={{ color: textColor }} />
                )}
              </ListItem>
            </Tooltip>

            {/* Conversations */}
            <Tooltip title="View Conversations" placement="right">
              <ListItem
                button
                component={Link}
                to="/conversations"
                onClick={handleItemClick}
              >
                <ListItemIcon>
                  <ChatIcon />
                </ListItemIcon>
                {!isShrunk && (
                  <ListItemText primary="Conversations" sx={{ color: textColor }} />
                )}
              </ListItem>
            </Tooltip>

            {/* Profile */}
            <Tooltip title="View Your Profile" placement="right">
              <ListItem
                button
                component={Link}
                to="/profile"
                onClick={handleItemClick}
              >
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                {!isShrunk && (
                  <ListItemText primary="Profile" sx={{ color: textColor }} />
                )}
              </ListItem>
            </Tooltip>

            {/* Logout */}
            <Tooltip title="Logout" placement="right">
              <ListItem button onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                {!isShrunk && (
                  <ListItemText primary="Logout" sx={{ color: textColor }} />
                )}
              </ListItem>
            </Tooltip>
          </>
        )}
      </List>
      <Divider />
      {/* Add more navigation links or sections here */}
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
