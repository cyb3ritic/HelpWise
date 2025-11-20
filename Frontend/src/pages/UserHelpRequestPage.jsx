// src/pages/UserHelpRequestsPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function UserHelpRequestsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchUserHelpRequests = async () => {
      try {
        const res = await axios.get('/api/requests/user-requests', { withCredentials: true });
        setHelpRequests(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user help requests:', err);
        setError(err.response?.data?.msg || 'Failed to load help requests.');
        setLoading(false);
      }
    };

    if (user) {
      fetchUserHelpRequests();
    }
  }, [user]);

  const handleDeleteClick = (requestId) => {
    setRequestToDelete(requestId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/requests/${requestToDelete}`, { withCredentials: true });
      // Remove the deleted request from the state
      setHelpRequests((prevRequests) => prevRequests.filter((req) => req._id !== requestToDelete));
      setSnackbar({ open: true, message: 'Help request deleted successfully.', severity: 'success' });
    } catch (err) {
      console.error('Error deleting help request:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.msg || 'Failed to delete help request.',
        severity: 'error',
      });
    } finally {
      setDeleteDialogOpen(false);
      setRequestToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRequestToDelete(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (authLoading || loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Typography variant="h4" gutterBottom>
        My Help Requests
      </Typography>
      {helpRequests.length === 0 ? (
        <Typography variant="body1">You have not created any help requests yet.</Typography>
      ) : (
        <Grid container spacing={3}>
          {helpRequests.map((request) => (
            <Grid item xs={12} sm={6} md={4} key={request._id}>
              <Card
                variant="outlined"
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Chip
                      label={request.status}
                      color={
                        request.status === 'Open'
                          ? 'warning'
                          : request.status === 'In Progress'
                          ? 'info'
                          : request.status === 'Completed'
                          ? 'success'
                          : request.status === 'Closed'
                          ? 'default'
                          : 'default'
                      }
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="h6">{request.title}</Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {request.description.length > 100
                      ? `${request.description.substring(0, 100)}...`
                      : request.description}
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary">
                    Type: {request.typeOfHelp.name}
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary">
                    Offered Amount: ${request.offeredAmount.toFixed(2)}
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary">
                    Promised Amount (90%): ${(request.offeredAmount * 0.9).toFixed(2)}
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary">
                    Response Deadline: {new Date(request.responseDeadline).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate(`/my-requests/${request._id}`)}
                    sx={{ flexGrow: 1, mr: 1 }}
                  >
                    View Bidders
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleDeleteClick(request._id)}
                    sx={{ flexGrow: 1 }}
                  >
                    Delete
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Help Request</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this help request? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default UserHelpRequestsPage;
