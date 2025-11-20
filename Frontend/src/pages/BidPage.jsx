// src/pages/BidPage.jsx

import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Button,
  TextField,
  Snackbar,
  Alert,
  Chip,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import moment from 'moment';

function BidPage() {
  const { id } = useParams(); // Help Request ID from URL
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [helpRequest, setHelpRequest] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [timeRemaining, setTimeRemaining] = useState('');
  const [hasUserBid, setHasUserBid] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Help Request Details
        const resRequest = await axios.get(`/api/requests/${id}`, { withCredentials: true });

        if (!resRequest.data) {
          throw new Error('Help Request not found.');
        }

        setHelpRequest(resRequest.data);

        // Fetch Bids for this Help Request
        const resBids = await axios.get(`/api/bids/${id}`, { withCredentials: true });
        setBids(resBids.data);

        // Check if the user has already placed a bid
        const userHasBid = resBids.data.some((bid) => bid.bidderId._id === user._id);
        setHasUserBid(userHasBid);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load help request details.');
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [id, user]);

  useEffect(() => {
    // Update time remaining every second
    const timer = setInterval(() => {
      if (helpRequest) {
        const now = moment();
        const end = moment(helpRequest.responseDeadline);
        const duration = moment.duration(end.diff(now));

        if (duration.asMilliseconds() <= 0) {
          setTimeRemaining('Expired');
        } else {
          const days = Math.floor(duration.asDays());
          const hours = duration.hours();
          const minutes = duration.minutes();
          const seconds = duration.seconds();

          let timeString = '';
          if (days > 0) timeString += `${days}d `;
          if (hours > 0) timeString += `${hours}h `;
          if (minutes > 0) timeString += `${minutes}m `;
          if (seconds >= 0) timeString += `${seconds}s`;

          setTimeRemaining(timeString);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [helpRequest]);

  const handleBidSubmit = async (e) => {
    e.preventDefault();

    // Input Validation
    if (!bidAmount || bidAmount <= 0) {
      setError('Please enter a valid bid amount.');
      return;
    }

    try {
      if (hasUserBid) {
        // Update existing bid
        const existingBid = bids.find((bid) => bid.bidderId._id === user._id);
        const res = await axios.put(
          `/api/bids/${existingBid._id}`,
          { bidAmount: parseFloat(bidAmount) },
          { withCredentials: true }
        );
        // Update bids in state
        setBids((prevBids) =>
          prevBids.map((bid) => (bid._id === existingBid._id ? res.data : bid))
        );
        setSnackbar({ open: true, message: 'Bid updated successfully!', severity: 'success' });
      } else {
        // Place a new bid
        const res = await axios.post(
          '/api/bids',
          {
            helpRequestId: id,
            bidAmount: parseFloat(bidAmount),
            message: bidMessage.trim() || undefined,
          },
          { withCredentials: true }
        );
        // Update Bids List
        setBids((prevBids) => [res.data, ...prevBids]);
        setHasUserBid(true);
        setSnackbar({ open: true, message: 'Bid placed successfully!', severity: 'success' });
      }

      // Reset Form Fields
      setBidAmount('');
      setBidMessage('');
      setError('');
    } catch (err) {
      console.error('Error placing/updating bid:', err);
      setError(err.response?.data?.msg || 'Failed to place/update bid.');
      setSnackbar({
        open: true,
        message: err.response?.data?.msg || 'Failed to place/update bid.',
        severity: 'error',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && !snackbar.open) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Container>
    );
  }

  // Calculate Amount Promised (90% of Offered Amount)
  const amountPromised = helpRequest.offeredAmount * 0.9;

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      {/* Help Request Details */}
      <Card variant="outlined" sx={{ mb: 4, boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {helpRequest.title}
          </Typography>
          <Typography variant="body1" gutterBottom>
            {helpRequest.description}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Chip label={helpRequest.typeOfHelp.name} color="primary" size="small" />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AttachMoneyIcon sx={{ mr: 0.5 }} fontSize="small" />
            <Typography variant="body2" color="textSecondary">
              Amount Promised (90%): <strong>${amountPromised.toFixed(2)}</strong>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AccessTimeIcon sx={{ mr: 0.5 }} fontSize="small" />
            <Typography variant="body2" color="textSecondary">
              Response Deadline: <strong>{moment(helpRequest.responseDeadline).format('LLL')}</strong>
            </Typography>
          </Box>
          {timeRemaining && helpRequest.status === 'Open' && (
            <Typography variant="body2" color="error">
              Time Remaining: {timeRemaining}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Place or Update Bid */}
      {helpRequest.status === 'Open' && timeRemaining !== 'Expired' && (
        <Box component="form" onSubmit={handleBidSubmit} sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {hasUserBid ? 'Update Your Bid' : 'Place a New Bid'}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Bid Amount ($)"
                type="number"
                variant="outlined"
                fullWidth
                required
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                inputProps={{ min: 0, step: '0.01' }}
                error={!!error && bidAmount <= 0}
                helperText={bidAmount <= 0 ? 'Bid amount must be greater than 0.' : ''}
              />
            </Grid>
            {!hasUserBid && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Message (Optional)"
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={2}
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                />
              </Grid>
            )}
          </Grid>
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            disabled={!bidAmount || bidAmount <= 0}
          >
            {hasUserBid ? 'Update Bid' : 'Submit Bid'}
          </Button>
        </Box>
      )}

      {/* Current Bids */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Current Bids ({bids.length})
        </Typography>
        {bids.length === 0 ? (
          <Typography variant="body1">No bids yet. Be the first to bid!</Typography>
        ) : (
          <Grid container spacing={2}>
            {bids.map((bid) => (
              <Grid item xs={12} sm={6} key={bid._id}>
                <Card
                  variant="outlined"
                  sx={{
                    boxShadow: 1,
                    borderRadius: 2,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    },
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle1">
                      {bid.bidderId?.firstName} {bid.bidderId?.lastName}
                    </Typography>
                    <Typography variant="body1">Bid Amount: ${bid.bidAmount.toFixed(2)}</Typography>
                    {bid.message && (
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        "{bid.message}"
                      </Typography>
                    )}
                    <Chip
                      label={bid.status}
                      color={
                        bid.status === 'Pending'
                          ? 'warning'
                          : bid.status === 'Accepted'
                          ? 'success'
                          : bid.status === 'Declined'
                          ? 'error'
                          : bid.status === 'Completed'
                          ? 'primary'
                          : 'default'
                      }
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}

export default BidPage;
