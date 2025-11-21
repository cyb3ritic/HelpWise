// src/App.jsx
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CreateRequest from './pages/CreateRequest';
import EditProfile from './pages/EditProfile';
import RequestDetail from './pages/RequestDetail';
import UserHelpRequestDetailsPage from './pages/UserHelpRequestDetailsPage';
import UserHelpRequestsPage from './pages/UserHelpRequestPage';
import Conversation from './pages/Conversation';
import AllRequests from './pages/AllRequests';
import BidPage from './pages/BidPage';
import MyBids from './pages/MyBids';
import Conversations from './pages/Conversations';
import BidDetails from './pages/BidDetails';
import PrivateRoute from './utils/PrivateRoute';
import Layout from './Layout/Layout'; // Import Layout
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { getDesignTokens } from './theme';

function App() {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('preferred-theme');
    return savedMode ? savedMode : 'light';
  });

  // Toggle between light and dark modes
  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('preferred-theme', newMode);
      return newMode;
    });
  };

  const theme = createTheme(getDesignTokens(mode));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout toggleTheme={toggleTheme} />}>
          <Route index element={<Home />} />
          <Route path="requests/:id" element={<RequestDetail />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="profile" element={<Profile />} />
            <Route path="create-request" element={<CreateRequest />} />
            <Route path="edit-profile" element={<EditProfile />} />
            <Route path="my-requests" element={<UserHelpRequestsPage />} />
            <Route path="my-requests/:requestId" element={<UserHelpRequestDetailsPage />} />
            <Route path="all-requests" element={<AllRequests />} />
            <Route path="my-bids" element={<MyBids />} />
            <Route path="my-bids/:bidId" element={<BidDetails />} />
            <Route path="conversations" element={<Conversations />} />
            <Route path="conversations/:conversationId" element={<Conversation />} />
            <Route path="bid/:id" element={<BidPage />} />
            {/* Add more protected routes here */}
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
