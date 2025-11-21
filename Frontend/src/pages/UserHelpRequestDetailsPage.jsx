// src/pages/UserHelpRequestDetailsPage.jsx

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
  TextField,
  Snackbar,
  Alert,
  Avatar,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { AccessTime, AttachMoney, Description } from '@mui/icons-material';

function UserHelpRequestDetailsPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [helpRequest, setHelpRequest] = useState(null);
  const [bidder, setBidder] = useState(null); // Changed from bidders to bidder
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for Accept/Reject Dialogs
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState(''); // 'accept' or 'reject'
  const [selectedBidId, setSelectedBidId] = useState(null);

  // State for Update Response Time
  const [openResponseDialog, setOpenResponseDialog] = useState(false);
  const [newResponseDeadline, setNewResponseDeadline] = useState('');

  // Snackbar State
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchHelpRequestAndBidder = async () => {
      try {
        // Fetch the help request details
        const resRequest = await axios.get(`/api/requests/${requestId}`, { withCredentials: true });
        if (!resRequest.data) {
          throw new Error('Help Request not found.');
        }
        setHelpRequest(resRequest.data);

        // Fetch the bidder with the minimum adjusted bid amount
        const resBidder = await axios.get(`/api/requests/${requestId}/bidders`, { withCredentials: true });

        if (resBidder.data.msg) {
          // If there is a message, it means there are no bids
          setBidder(null);
        } else {
          // Since the API returns an array with one bidder
          setBidder(resBidder.data[0]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching help request or bidder:', err);
        setError(err.response?.data?.msg || 'Failed to load details.');
        setLoading(false);
      }
    };

    if (user) {
      fetchHelpRequestAndBidder();
    }
  }, [user, requestId]);

  // Handle Accept/Reject Button Click
  const handleActionClick = (bidId, action) => {
    setSelectedBidId(bidId);
    setDialogAction(action);
    setOpenDialog(true);
  };

  // Confirm Accept/Reject
  const handleConfirmAction = async () => {
    try {
      if (dialogAction === 'accept') {
        await axios.post(`/api/bids/${selectedBidId}/accept`, {}, { withCredentials: true });
        setSnackbar({ open: true, message: 'Bid accepted successfully.', severity: 'success' });
      } else if (dialogAction === 'reject') {
        await axios.post(`/api/bids/${selectedBidId}/reject`, {}, { withCredentials: true });
        setSnackbar({ open: true, message: 'Bid rejected successfully.', severity: 'info' });
      }

      // Refresh bidder and help request
      const resBidder = await axios.get(`/api/requests/${requestId}/bidders`, { withCredentials: true });

      if (resBidder.data.msg) {
        setBidder(null);
      } else {
        setBidder(resBidder.data[0]);
      }

      const resRequest = await axios.get(`/api/requests/${requestId}`, { withCredentials: true });
      setHelpRequest(resRequest.data);

      setOpenDialog(false);
      setSelectedBidId(null);
      setDialogAction('');
    } catch (err) {
      console.error('Error performing action on bid:', err);
      setSnackbar({ open: true, message: err.response?.data?.msg || 'Action failed.', severity: 'error' });
      setOpenDialog(false);
      setSelectedBidId(null);
      setDialogAction('');
    }
  };

  // Cancel Accept/Reject
  const handleCancelAction = () => {
    setOpenDialog(false);
    setSelectedBidId(null);
    setDialogAction('');
  };

  // Handle Update Response Time
  const handleUpdateResponseTime = () => {
    setOpenResponseDialog(true);
  };

  const handleConfirmUpdateResponseTime = async () => {
    try {
      // Validate newResponseDeadline
      if (!newResponseDeadline) {
        throw new Error('Please provide a new response deadline.');
      }

      const response = await axios.put(
        `/api/requests/${requestId}/response-time`,
        { newResponseDeadline },
        { withCredentials: true }
      );

      setSnackbar({ open: true, message: response.data.msg || 'Response deadline updated.', severity: 'success' });
      setHelpRequest({ ...helpRequest, responseDeadline: new Date(newResponseDeadline) });
      setOpenResponseDialog(false);
      setNewResponseDeadline('');
    } catch (err) {
      console.error('Error updating response time:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.msg || 'Failed to update response time.',
        severity: 'error',
      });
      setOpenResponseDialog(false);
    }
  };

  const handleCancelUpdateResponseTime = () => {
    setOpenResponseDialog(false);
    setNewResponseDeadline('');
  };

  // Handle Snackbar Close
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

  const amountPromised = helpRequest.offeredAmount * 0.9;

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 4, width: '100%' }}>
      <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        &larr; Back to My Help Requests
      </Button>
      <Typography variant="h4" gutterBottom>
        Help Request Details
      </Typography>
      <Card variant="outlined" sx={{ mb: 4, width: '100%', boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Chip
              label={helpRequest.status}
              color={
                helpRequest.status === 'Open'
                  ? 'warning'
                  : helpRequest.status === 'In Progress'
                  ? 'info'
                  : helpRequest.status === 'Completed'
                  ? 'success'
                  : helpRequest.status === 'Closed'
                  ? 'default'
                  : 'default'
              }
              sx={{ mr: 1 }}
            />
            <Typography variant="h5">{helpRequest.title}</Typography>
          </Box>
          <Typography variant="body1" gutterBottom>
            {helpRequest.description}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Description sx={{ mr: 0.5 }} fontSize="small" />
            <Typography variant="body2" color="textSecondary">
              Type: {helpRequest.typeOfHelp.name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <AttachMoney sx={{ mr: 0.5 }} fontSize="small" />
            <Typography variant="body2" color="textSecondary">
              Offered Amount: <strong>${helpRequest.offeredAmount.toFixed(2)}</strong>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <AccessTime sx={{ mr: 0.5 }} fontSize="small" />
            <Typography variant="body2" color="textSecondary">
              Response Deadline: {new Date(helpRequest.responseDeadline).toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <AccessTime sx={{ mr: 0.5 }} fontSize="small" />
            <Typography variant="body2" color="textSecondary">
              Work Deadline: {new Date(helpRequest.workDeadline).toLocaleString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h5" gutterBottom>
        Best Bidder
      </Typography>
      {!bidder ? (
        <Typography variant="body1">No bids available for this help request.</Typography>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                boxShadow: 2,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ mr: 1 }}>
                    {bidder.bidderId.firstName.charAt(0)}
                    {bidder.bidderId.lastName.charAt(0)}
                  </Avatar>
                  <Typography variant="h6">
                    {bidder.bidderId.firstName} {bidder.bidderId.lastName}
                  </Typography>
                </Box>
                <Typography variant="body1">
                   Amount Requested: <strong>${bidder.adjustedBidAmount.toFixed(2)}</strong>
                </Typography>
               
                {bidder.message && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    "{bidder.message}"
                  </Typography>
                )}
                <Chip
                  label={bidder.status}
                  color={
                    bidder.status === 'Pending'
                      ? 'warning'
                      : bidder.status === 'Accepted'
                      ? 'success'
                      : bidder.status === 'Declined'
                      ? 'error'
                      : bidder.status === 'Completed'
                      ? 'primary'
                      : 'default'
                  }
                  size="small"
                  sx={{ mt: 1 }}
                />
              </CardContent>
              {bidder.status === 'Pending' && helpRequest.status === 'Open' && (
                <Box sx={{ display: 'flex', justifyContent: 'center', pb: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    sx={{ mr: 1 }}
                    onClick={() => handleActionClick(bidder._id, 'accept')}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleActionClick(bidder._id, 'reject')}
                  >
                    Reject
                  </Button>
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Update Response Time Button */}
      {helpRequest.status === 'Open' && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button variant="contained" color="primary" onClick={handleUpdateResponseTime}>
            Update Response Time
          </Button>
        </Box>
      )}

      {/* Accept/Reject Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCancelAction}
        aria-labelledby="confirm-action-dialog"
      >
        <DialogTitle id="confirm-action-dialog">
          {dialogAction === 'accept' ? 'Accept Bid' : 'Reject Bid'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogAction === 'accept'
              ? 'Are you sure you want to accept this bid? All other bids will be declined.'
              : 'Are you sure you want to reject this bid?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAction} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmAction} color="secondary" autoFocus>
            {dialogAction === 'accept' ? 'Accept' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Response Time Dialog */}
      <Dialog
        open={openResponseDialog}
        onClose={handleCancelUpdateResponseTime}
        aria-labelledby="update-response-dialog"
      >
        <DialogTitle id="update-response-dialog">Update Response Time</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter the new response deadline for this help request.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="newResponseDeadline"
            label="New Response Deadline"
            type="datetime-local"
            fullWidth
            variant="standard"
            value={newResponseDeadline}
            onChange={(e) => setNewResponseDeadline(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelUpdateResponseTime} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmUpdateResponseTime} color="secondary">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default UserHelpRequestDetailsPage;
