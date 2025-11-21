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
  CardActions,
  CircularProgress,
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import PointsIcon from '@mui/icons-material/Star';
import ExpertiseIcon from '@mui/icons-material/Build';

function Profile() {
  const { user } = useContext(AuthContext);

  // Debugging: Inspect user properties
  console.log(user);

  if (!user) {
    // Display a loading spinner while user data is being fetched
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Function to generate initials from firstName and lastName
  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName?.charAt(0).toUpperCase() || '';
    const lastInitial = lastName?.charAt(0).toUpperCase() || '';
    return `${firstInitial}${lastInitial}` || 'U'; // 'U' stands for 'User' as a default
  };

  // Safely access the user's first and last names
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const userName = `${firstName} ${lastName}`.trim() || 'User';
  const initials = getInitials(firstName, lastName);

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Card
        sx={{
          padding: 3,
          borderRadius: 3,
          boxShadow: 3,
          backgroundColor: 'background.paper',
        }}
      >
        <Grid container spacing={4}>
          {/* Avatar Section */}
          <Grid item xs={12} sm={4} md={3}>
            <Box display="flex" justifyContent="center">
              <Avatar
                alt={userName}
                src={user.profilePicture} // Ensure `profilePicture` exists in user data
                sx={{ width: 120, height: 120, bgcolor: 'primary.main', fontSize: 40 }}
              >
                {/* Display initials if profilePicture is not available */}
                {!user.profilePicture && initials}
              </Avatar>
            </Box>
          </Grid>

          {/* User Information */}
          <Grid item xs={12} sm={8} md={9}>
            <CardContent>
              <Typography variant="h4" component="div" gutterBottom>
                {userName}
              </Typography>
              <Box display="flex" alignItems="center" mb={1}>
                <EmailIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="body1" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" mb={2}>
                <PointsIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="body1" color="text.secondary">
                  Credibility Points: {user.credibilityPoints}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" mb={2}>
                <ExpertiseIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="body1" color="text.secondary" sx={{ mr: 1 }}>
                  Expertise:
                </Typography>
                {user.expertise && user.expertise.length > 0 ? (
                  user.expertise.map((exp) => (
                    <Chip
                      key={exp._id}
                      label={exp.name}
                      variant="outlined"
                      color="primary"
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No expertise listed.
                  </Typography>
                )}
              </Box>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                component={Link}
                to="/edit-profile"
              >
                Edit Profile
              </Button>
            </CardActions>
          </Grid>
        </Grid>
      </Card>
    </Container>
  );
}

export default Profile;
