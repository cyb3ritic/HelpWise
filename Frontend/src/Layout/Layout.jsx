import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import Navbar from '../components/Navbar';
import Drawer from '../components/Drawer';
import Footer from '../components/Footer';
import Chatbot from '../components/Chatbot';
import { Outlet, useLocation } from 'react-router-dom';

function Layout({ toggleTheme }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerShrink, setDrawerShrink] = useState(false);
  const location = useLocation();

  // Determine Drawer width based on shrink state
  const drawerWidth = drawerShrink ? 80 : 240;

  // Toggle Drawer open/close for mobile
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Toggle Drawer shrink/expand
  const toggleDrawerShrink = () => {
    setDrawerShrink(!drawerShrink);
  };

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />

      {/* Navbar */}
      <Navbar
        handleDrawerToggle={handleDrawerToggle}
        toggleDrawerShrink={toggleDrawerShrink}
        toggleTheme={toggleTheme}
        drawerWidth={drawerWidth}
        drawerShrink={drawerShrink}
      />

      {/* Drawer */}
      <Drawer
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        drawerWidth={drawerWidth}
        drawerShrink={drawerShrink}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: { sm: `${drawerWidth}px` },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Offset for Navbar */}
        <Toolbar />

        {/* Content Wrapper */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            // minHeight: '100vh', // Removed to fix scroll locking
          }}
        >
          {/* Render child routes */}
          <Outlet />
        </Box>

        {/* Footer */}
        <Footer />
      </Box>

      {/* Chatbot Component */}
      <Chatbot />
    </Box>
  );
}

export default Layout;
