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
  Stack,
  Divider,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  AccessTime,
  AttachMoney,
  Description,
  CheckCircle,
  Cancel,
  Person,
  Chat as ChatIcon
} from '@mui/icons-material';

function UserHelpRequestDetailsPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [helpRequest, setHelpRequest] = useState(null);
  const [bidder, setBidder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState(null);

  // State for Accept/Reject Dialogs
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState('');
  const [selectedBidId, setSelectedBidId] = useState(null);

  // State for Complete Dialog
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [completing, setCompleting] = useState(false);

  // State for Cancel Dialog
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // State for Update Response Time
  const [openResponseDialog, setOpenResponseDialog] = useState(false);
  const [newResponseDeadline, setNewResponseDeadline] = useState('');

  // Snackbar State
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchHelpRequestAndBidder = async () => {
      try {
        const resRequest = await axios.get(`/api/requests/${requestId}`, { withCredentials: true });
        if (!resRequest.data) {
          throw new Error('Help Request not found.');
        }
        setHelpRequest(resRequest.data);

        const resBidder = await axios.get(`/api/requests/${requestId}/bidders`, { withCredentials: true });
        if (resBidder.data.msg) {
          setBidder(null);
        } else {
          setBidder(resBidder.data[0]);
        }

        // Fetch conversation if request is In Progress or Completed
        if (resRequest.data.status === 'In Progress' || resRequest.data.status === 'Completed') {
          try {
            const resConv = await axios.get(`/api/conversations/request/${requestId}`, { withCredentials: true });
            setConversationId(resConv.data._id);
          } catch (convErr) {
            console.log('No conversation found yet or error fetching:', convErr);
          }
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

  // Handle Accept Bid (calls the new /accept-bid endpoint)
  const handleAcceptBid = async (bidId) => {
    try {
      const res = await axios.put(
        `/api/requests/${requestId}/accept-bid`,
        { bidId },
        { withCredentials: true }
      );

      if (res.data.conversationId) {
        setConversationId(res.data.conversationId);
      }
      setSnackbar({
        open: true,
        message: '✅ Bid accepted! Request is now In Progress.',
        severity: 'success'
      });

      // Refresh data
      const resRequest = await axios.get(`/api/requests/${requestId}`, { withCredentials: true });
      setHelpRequest(resRequest.data);

      const resBidder = await axios.get(`/api/requests/${requestId}/bidders`, { withCredentials: true });
      if (!resBidder.data.msg) {
        setBidder(resBidder.data[0]);
      }
    } catch (err) {
      console.error('Error accepting bid:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.msg || 'Failed to accept bid',
        severity: 'error'
      });
    }
  };

  // Handle Mark as Completed
  const handleMarkComplete = async () => {
    setCompleting(true);
    try {
      await axios.put(
        `/api/requests/${requestId}/complete`,
        {},
        { withCredentials: true }
      );

      setSnackbar({
        open: true,
        message: '🎉 Request marked as completed successfully!',
        severity: 'success'
      });

      setOpenCompleteDialog(false);

      // Refresh data
      const resRequest = await axios.get(`/api/requests/${requestId}`, { withCredentials: true });
      setHelpRequest(resRequest.data);
    } catch (err) {
      console.error('Error completing request:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.msg || 'Failed to mark as completed',
        severity: 'error'
      });
    } finally {
      setCompleting(false);
    }
  };

  // Handle Cancel Request
  const handleCancelRequest = async () => {
    if (!cancelReason.trim()) {
      setSnackbar({
        open: true,
        message: 'Please provide a cancellation reason',
        severity: 'warning'
      });
      return;
    }

    setCancelling(true);
    try {
      await axios.put(
        `/api/requests/${requestId}/cancel`,
        { reason: cancelReason },
        { withCredentials: true }
      );

      setSnackbar({
        open: true,
        message: 'Request cancelled successfully',
        severity: 'info'
      });

      setOpenCancelDialog(false);
      navigate('/my-requests');
    } catch (err) {
      console.error('Error cancelling request:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.msg || 'Failed to cancel request',
        severity: 'error'
      });
    } finally {
      setCancelling(false);
    }
  };

  // Handle Accept/Reject Button Click (using old bid endpoints)
  const handleActionClick = (bidId, action) => {
    if (action === 'accept') {
      handleAcceptBid(bidId);
    } else {
      setSelectedBidId(bidId);
      setDialogAction(action);
      setOpenDialog(true);
    }
  };

  // Confirm Reject
  const handleConfirmAction = async () => {
    try {
      if (dialogAction === 'reject') {
        await axios.post(`/api/bids/${selectedBidId}/reject`, {}, { withCredentials: true });
        setSnackbar({ open: true, message: 'Bid rejected successfully.', severity: 'info' });
      }

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
      setSnackbar({
        open: true,
        message: err.response?.data?.msg || 'Action failed.',
        severity: 'error'
      });
      setOpenDialog(false);
    }
  };

  const handleCancelAction = () => {
    setOpenDialog(false);
    setSelectedBidId(null);
    setDialogAction('');
  };

  const handleUpdateResponseTime = () => {
    setOpenResponseDialog(true);
  };

  const handleConfirmUpdateResponseTime = async () => {
    try {
      if (!newResponseDeadline) {
        throw new Error('Please provide a new response deadline.');
      }

      const response = await axios.put(
        `/api/requests/${requestId}/response-time`,
        { newResponseDeadline },
        { withCredentials: true }
      );

      setSnackbar({
        open: true,
        message: response.data.msg || 'Response deadline updated.',
        severity: 'success'
      });

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

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'success';
      case 'In Progress': return 'warning';
      case 'Completed': return 'info';
      case 'Closed': return 'error';
      default: return 'default';
    }
  };

  if (authLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        ← Back to My Help Requests
      </Button>

      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Help Request Details
      </Typography>

      <Grid container spacing={3}>
        {/* Request Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {helpRequest.title}
                  </Typography>
                  <Chip
                    label={helpRequest.status}
                    color={getStatusColor(helpRequest.status)}
                    sx={{ mb: 2 }}
                  />
                </Box>

                <Divider />

                <Typography variant="body1">{helpRequest.description}</Typography>

                <Divider />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Type</Typography>
                    <Typography variant="body1">{helpRequest.typeOfHelp.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Offered Amount</Typography>
                    <Typography variant="body1">${helpRequest.offeredAmount.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Response Deadline</Typography>
                    <Typography variant="body2">
                      {new Date(helpRequest.responseDeadline).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Work Deadline</Typography>
                    <Typography variant="body2">
                      {new Date(helpRequest.workDeadline).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Helper Info - Show if In Progress or Completed */}
                {(helpRequest.status === 'In Progress' || helpRequest.status === 'Completed') &&
                  helpRequest.acceptedBidderId && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Person />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Accepted Helper
                          </Typography>
                          <Typography variant="body1" fontWeight="600">
                            {helpRequest.acceptedBidderId.firstName} {helpRequest.acceptedBidderId.lastName}
                          </Typography>
                          {conversationId && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<ChatIcon />}
                              onClick={() => navigate(`/conversations/${conversationId}`)}
                              sx={{ mt: 1 }}
                            >
                              Chat with Helper
                            </Button>
                          )}
                        </Box>
                      </Stack>
                    </Box>
                  )}

                {/* Completed At */}
                {helpRequest.status === 'Completed' && helpRequest.completedAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Completed On</Typography>
                    <Typography variant="body2">
                      {new Date(helpRequest.completedAt).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Actions</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {/* Mark as Completed - Show only if In Progress */}
                {helpRequest.status === 'In Progress' && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() => setOpenCompleteDialog(true)}
                    fullWidth
                  >
                    Mark as Completed
                  </Button>
                )}

                {/* Update Response Time - Show only if Open */}
                {helpRequest.status === 'Open' && (
                  <Button
                    variant="outlined"
                    onClick={handleUpdateResponseTime}
                    fullWidth
                  >
                    Update Response Time
                  </Button>
                )}

                {/* Cancel - Show if Open or In Progress */}
                {(helpRequest.status === 'Open' || helpRequest.status === 'In Progress') && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={() => setOpenCancelDialog(true)}
                    fullWidth
                  >
                    Cancel Request
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Bidder Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Best Bidder</Typography>

              {!bidder ? (
                <Typography variant="body2" color="text.secondary">
                  No bids available for this help request.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar>
                      {bidder.bidderId.firstName.charAt(0)}
                      {bidder.bidderId.lastName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="600">
                        {bidder.bidderId.firstName} {bidder.bidderId.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Credibility: {bidder.bidderId.credibilityPoints || 0} points
                      </Typography>
                    </Box>
                  </Stack>

                  <Box>
                    <Typography variant="caption" color="text.secondary">Amount Requested</Typography>
                    <Typography variant="h6" color="primary">
                      ${bidder.adjustedBidAmount.toFixed(2)}
                    </Typography>
                  </Box>

                  {bidder.message && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Message</Typography>
                      <Typography variant="body2">"{bidder.message}"</Typography>
                    </Box>
                  )}

                  {bidder.status === 'Pending' && helpRequest.status === 'Open' && (
                    <Stack spacing={1}>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleActionClick(bidder._id, 'accept')}
                        fullWidth
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleActionClick(bidder._id, 'reject')}
                        fullWidth
                      >
                        Reject
                      </Button>
                    </Stack>
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Complete Confirmation Dialog */}
      <Dialog open={openCompleteDialog} onClose={() => !completing && setOpenCompleteDialog(false)}>
        <DialogTitle>Mark Request as Completed?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to mark this request as completed? This confirms that the helper has
            successfully completed the work to your satisfaction.
            <br /><br />
            The helper will receive +10 credibility points.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCompleteDialog(false)} disabled={completing}>
            Cancel
          </Button>
          <Button
            onClick={handleMarkComplete}
            color="success"
            variant="contained"
            disabled={completing}
            startIcon={completing ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {completing ? 'Processing...' : 'Confirm Completion'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={openCancelDialog} onClose={() => !cancelling && setOpenCancelDialog(false)}>
        <DialogTitle>Cancel Request?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to cancel this request? This action cannot be undone.
            All pending bids will be rejected.
          </DialogContentText>
          <TextField
            label="Cancellation Reason"
            multiline
            rows={3}
            fullWidth
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)} disabled={cancelling}>
            No, Keep Request
          </Button>
          <Button
            onClick={handleCancelRequest}
            color="error"
            variant="contained"
            disabled={cancelling}
            startIcon={cancelling ? <CircularProgress size={20} /> : <Cancel />}
          >
            {cancelling ? 'Cancelling...' : 'Yes, Cancel Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Bid Dialog */}
      <Dialog open={openDialog} onClose={handleCancelAction}>
        <DialogTitle>Reject Bid</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reject this bid?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAction}>Cancel</Button>
          <Button onClick={handleConfirmAction} color="error" variant="contained">
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Response Time Dialog */}
      <Dialog open={openResponseDialog} onClose={handleCancelUpdateResponseTime}>
        <DialogTitle>Update Response Time</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter the new response deadline for this help request.
          </DialogContentText>
          <TextField
            margin="dense"
            label="New Response Deadline"
            type="datetime-local"
            fullWidth
            value={newResponseDeadline}
            onChange={(e) => setNewResponseDeadline(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelUpdateResponseTime}>Cancel</Button>
          <Button onClick={handleConfirmUpdateResponseTime} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default UserHelpRequestDetailsPage;
