// src/pages/Profile.jsx

import React, { useContext } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Avatar,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Stack,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Edit,
  Email,
  Star,
  Build,
  Person,
  Verified,
} from '@mui/icons-material';

function Profile() {
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName?.charAt(0).toUpperCase() || '';
    const lastInitial = lastName?.charAt(0).toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  };

  const stats = [
    { label: 'Reputation Points', value: user.reputationPoints || 0, icon: <Star /> },
    { label: 'Requests Created', value: '0', icon: <Build /> },
    { label: 'Bids Placed', value: '0', icon: <Build /> },
  ];

  return (
    <Box>
      {/* Header Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.9
          )} 0%, ${alpha(theme.palette.secondary.main, 0.8)} 100%)`,
          color: 'white',
          py: 6,
          mb: 4,
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar
              sx={{
                width: 100,
                height: 100,
                fontSize: '2.5rem',
                bgcolor: alpha(theme.palette.common.white, 0.2),
                border: `4px solid ${alpha(theme.palette.common.white, 0.3)}`,
                fontWeight: 'bold',
              }}
            >
              {getInitials(user.firstName, user.lastName)}
            </Avatar>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Typography variant="h3" fontWeight="bold">
                  {user.firstName} {user.lastName}
                </Typography>
                {user.emailVerified && (
                  <Verified sx={{ fontSize: 32, color: theme.palette.success.light }} />
                )}
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Email sx={{ fontSize: 20 }} />
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {user.email}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 6 }}>
        <Grid container spacing={3}>
          {/* Stats Cards */}
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      borderRadius: '50%',
                      width: 56,
                      height: 56,
                      mb: 2,
                      color: theme.palette.primary.main,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Profile Information */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                borderRadius: 2,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">
                  Profile Information
                </Typography>
                <Button
                  component={Link}
                  to="/edit-profile"
                  variant="outlined"
                  startIcon={<Edit />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderWidth: 2,
                    borderRadius: 2,
                    '&:hover': {
                      borderWidth: 2,
                    },
                  }}
                >
                  Edit Profile
                </Button>
              </Stack>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight="600">
                    FIRST NAME
                  </Typography>
                  <Typography variant="body1" fontWeight="500" sx={{ mt: 0.5 }}>
                    {user.firstName}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight="600">
                    LAST NAME
                  </Typography>
                  <Typography variant="body1" fontWeight="500" sx={{ mt: 0.5 }}>
                    {user.lastName}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" fontWeight="600">
                    EMAIL ADDRESS
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Typography variant="body1" fontWeight="500">
                      {user.email}
                    </Typography>
                    {user.emailVerified && (
                      <Chip label="Verified" color="success" size="small" />
                    )}
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" fontWeight="600">
                    REPUTATION POINTS
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Star sx={{ color: theme.palette.warning.main }} />
                    <Typography variant="body1" fontWeight="500">
                      {user.reputationPoints || 0} Points
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Expertise Section */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Areas of Expertise
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {user.expertise && user.expertise.length > 0 ? (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {user.expertise.map((exp) => (
                    <Chip
                      key={exp._id}
                      label={exp.name}
                      color="primary"
                      variant="outlined"
                      icon={<Build />}
                      sx={{
                        fontWeight: 600,
                        borderWidth: 2,
                      }}
                    />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No expertise added yet.
                </Typography>
              )}

              <Button
                component={Link}
                to="/edit-profile"
                variant="text"
                sx={{
                  mt: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Update Expertise
              </Button>
            </Paper>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.05
                )} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Quick Actions
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  component={Link}
                  to="/create-request"
                  variant="contained"
                  size="large"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[6],
                    },
                  }}
                >
                  Create New Request
                </Button>
                <Button
                  component={Link}
                  to="/all-requests"
                  variant="outlined"
                  size="large"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                    borderRadius: 2,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                    },
                  }}
                >
                  Browse Requests
                </Button>
                <Button
                  component={Link}
                  to="/my-bids"
                  variant="outlined"
                  size="large"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                    borderRadius: 2,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                    },
                  }}
                >
                  View My Bids
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Profile;
