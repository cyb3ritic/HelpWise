// src/pages/AllRequests.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Chip,
  Box,
} from '@mui/material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AccessTime, AttachMoney } from '@mui/icons-material';
import moment from 'moment';

function AllRequests() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get('/api/requests', { withCredentials: true });
        setRequests(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching help requests:', err);
        setError('Failed to load help requests.');
        setLoading(false);
      }
    };

    // Only fetch if user is authenticated
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const handleOpenDialog = (request) => {
    setSelectedRequest(request);
  };

  const handleCloseDialog = () => {
    setSelectedRequest(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleBid = (requestId) => {
    navigate(`/bid/${requestId}`);
  };

  const calculateTimeLeft = (deadline) => {
    const now = moment();
    const end = moment(deadline);
    const duration = moment.duration(end.diff(now));

    if (duration.asMilliseconds() <= 0) {
      return 'Expired';
    }

    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();

    let timeLeft = '';
    if (days > 0) timeLeft += `${days}d `;
    if (hours > 0) timeLeft += `${hours}h `;
    if (minutes >= 0) timeLeft += `${minutes}m`;

    return timeLeft;
  };

  if (authLoading || loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
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
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Typography variant="h4" gutterBottom>
        All Help Requests
      </Typography>
      {error && (
        <Typography color="error" variant="body1" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      {requests.length === 0 ? (
        <Typography variant="body1">No help requests available at the moment.</Typography>
      ) : (
        <Grid container spacing={3}>
          {requests.map((request) => (
            <Grid item xs={12} sm={6} md={4} key={request._id}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  boxShadow: 3,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {request.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    {request.description.length > 100
                      ? `${request.description.substring(0, 100)}...`
                      : request.description}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Chip label={request.typeOfHelp.name} color="primary" size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccessTime sx={{ mr: 0.5 }} fontSize="small" />
                    <Typography variant="body2" color="textSecondary">
                      Response Time Left:{' '}
                      <strong>{calculateTimeLeft(request.responseDeadline)}</strong>
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachMoney sx={{ mr: 0.5 }} fontSize="small" />
                    <Typography variant="body2" color="textSecondary">
                      Offered Amount:{' '}
                      <strong>${(request.offeredAmount * 0.9).toFixed(2)}</strong>
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <Button
                    size="small"
                    onClick={() => handleOpenDialog(request)}
                    sx={{ textTransform: 'none' }}
                  >
                    View Details
                  </Button>
                  {request.status === 'Open' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => handleBid(request._id)}
                      sx={{ textTransform: 'none' }}
                    >
                      Bid
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog for Detailed Description */}
      <Dialog
        open={Boolean(selectedRequest)}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        aria-labelledby="request-dialog-title"
      >
        <DialogTitle id="request-dialog-title">{selectedRequest?.title}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {selectedRequest?.description}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Chip label={selectedRequest?.typeOfHelp.name} color="primary" size="small" />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AccessTime sx={{ mr: 0.5 }} fontSize="small" />
            <Typography variant="body2" color="textSecondary">
              Response Time Left:{' '}
              <strong>{calculateTimeLeft(selectedRequest?.responseDeadline)}</strong>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AttachMoney sx={{ mr: 0.5 }} fontSize="small" />
            <Typography variant="body2" color="textSecondary">
              Offered Amount:{' '}
              <strong>${(selectedRequest?.offeredAmount * 0.9).toFixed(2)}</strong>
            </Typography>
          </Box>
          <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 2 }}>
            Created By: {selectedRequest?.requesterId.firstName} {selectedRequest?.requesterId.lastName} (
            {selectedRequest?.requesterId.email})
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary" sx={{ textTransform: 'none' }}>
            Close
          </Button>
          {selectedRequest?.status === 'Open' && (
            <Button
              onClick={() => {
                navigate(`/bid/${selectedRequest._id}`);
                handleCloseDialog();
              }}
              color="primary"
              variant="contained"
              sx={{ textTransform: 'none' }}
            >
              Bid Now
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AllRequests;
