// src/pages/BidDetails.jsx

import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Button,
  Divider,
  Snackbar,
  Alert,
  Stack,
  Paper,
  Grid,
  Fade,
  Skeleton,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  AccessTime,
  AttachMoney,
  Description,
  Message,
  PlayArrow,
  CheckCircle,
  Warning,
  Shield,
  Schedule,
  Cancel,
  ArrowBack,
  Person,
  Info,
  Refresh,
} from '@mui/icons-material';
import moment from 'moment';

function BidDetails() {
  const navigate = useNavigate();
  const { bidId } = useParams();
  const { user, loading: authLoading } = useContext(AuthContext);

  // State management
  const [bid, setBid] = useState(null);
  const [risksAndPreventions, setRisksAndPreventions] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingRisks, setLoadingRisks] = useState(false);
  const [error, setError] = useState('');
  const [showChatButton, setShowChatButton] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch bid details on component mount
  useEffect(() => {
    const fetchBidDetail = async () => {
      try {
        const res = await axios.get(`/api/bids/${bidId}/details`, { withCredentials: true });
        setBid(res.data.bid);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching bid detail:', err);

        if (err.response) {
          setError(err.response.data.msg || 'Failed to load bid details.');
        } else if (err.request) {
          setError('No response from server. Please check your connection.');
        } else {
          setError('An unexpected error occurred.');
        }

        setLoading(false);
      }
    };

    if (user) {
      fetchBidDetail();
    }
  }, [user, bidId]);

  // Generate risk analysis using Gemini API
  const handleGenerateRisks = async () => {
    if (!bid) return;

    setLoadingRisks(true);
    setShowChatButton(false);

    try {
      const { title, description } = bid.helpRequestId;

      const riskRes = await axios.post(
        '/api/gemini/generate-risks',
        { title, description },
        { withCredentials: true }
      );

      setRisksAndPreventions(riskRes.data.risksAndPreventions);
      setShowChatButton(true);
      
      setSnackbar({
        open: true,
        message: 'Risk analysis generated successfully!',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error generating risks:', err);
      
      setSnackbar({
        open: true,
        message: err.response?.data?.msg || 'Failed to generate risk analysis. Please try again.',
        severity: 'error',
      });

      // Fallback message if API fails
      setRisksAndPreventions(
        '⚠️ Risk analysis is currently unavailable.\n\nPlease carefully review:\n• Project requirements and deadlines\n• Communication expectations\n• Payment terms\n• Scope of work\n\nConsider discussing these points with the requester before proceeding.'
      );
      setShowChatButton(true);
    } finally {
      setLoadingRisks(false);
    }
  };

  const handleRead = () => {
    handleGenerateRisks();
  };

  // Handle starting chat with requester
  const handleStartChat = async () => {
    try {
      const requesterId =
        typeof bid.helpRequestId.requesterId === 'object'
          ? bid.helpRequestId.requesterId._id
          : bid.helpRequestId.requesterId;

      if (!requesterId || !user._id) {
        throw new Error('User information is missing.');
      }

      // Create or get existing conversation
      const conversationRes = await axios.post(
        '/api/conversations',
        { participants: [user._id, requesterId] },
        { withCredentials: true }
      );

      const conversationId = conversationRes.data._id;
      navigate(`/conversations/${conversationId}`);
    } catch (err) {
      console.error('Error starting chat:', err);

      setSnackbar({
        open: true,
        message: err.response?.data?.msg || 'Failed to start chat. Please try again.',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleRetryRisks = () => {
    setRisksAndPreventions('');
    setShowChatButton(false);
    handleGenerateRisks();
  };

  // Helper functions for status colors
  const getRequestStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return 'success';
      case 'In Progress':
        return 'warning';
      case 'Completed':
        return 'info';
      case 'Closed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getBidStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Accepted':
        return 'success';
      case 'Rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getBidStatusIcon = (status) => {
    switch (status) {
      case 'Accepted':
        return <CheckCircle />;
      case 'Rejected':
        return <Cancel />;
      default:
        return <AccessTime />;
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
        <Typography variant="body1" sx={{ mt: 2 }} color="text.secondary">
          Loading bid details...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/my-bids')}>
          Back to My Bids
        </Button>
      </Container>
    );
  }

  // No bid found
  if (!bid) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Bid details not found.
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/my-bids')}>
          Back to My Bids
        </Button>
      </Container>
    );
  }

  const amountPromised = bid.helpRequestId.offeredAmount * 0.9;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Back button */}
      <Button
        variant="outlined"
        startIcon={<ArrowBack />}
        onClick={() => navigate('/my-bids')}
        sx={{ mb: 3 }}
      >
        Back to My Bids
      </Button>

      {/* Page title */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Bid Details
      </Typography>

      <Stack spacing={3}>
        {/* Help Request Card */}
        <Fade in timeout={500}>
          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h5"
                fontWeight="bold"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Description color="primary" />
                Help Request Details
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Typography variant="h6" gutterBottom>
                {bid.helpRequestId.title}
              </Typography>

              <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8 }}>
                {bid.helpRequestId.description}
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                <Chip
                  label={bid.helpRequestId.typeOfHelp.name}
                  color="primary"
                  variant="outlined"
                  icon={<Info />}
                />
                <Chip
                  label={bid.helpRequestId.status}
                  color={getRequestStatusColor(bid.helpRequestId.status)}
                />
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AttachMoney color="success" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Offered Amount
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          ${bid.helpRequestId.offeredAmount.toFixed(2)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AttachMoney color="warning" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Amount Promised (90%)
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          ${amountPromised.toFixed(2)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Schedule color="info" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Response Deadline
                        </Typography>
                        <Typography variant="body2" fontWeight="600">
                          {moment(bid.helpRequestId.responseDeadline).format('MMM DD, YYYY h:mm A')}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AccessTime color="error" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Work Deadline
                        </Typography>
                        <Typography variant="body2" fontWeight="600">
                          {moment(bid.helpRequestId.workDeadline).format('MMM DD, YYYY h:mm A')}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Fade>

        {/* Your Bid Card */}
        <Fade in timeout={700}>
          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h5"
                fontWeight="bold"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <AttachMoney color="primary" />
                Your Bid
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Stack spacing={2}>
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Your Bid Amount
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      ${bid.bidAmount.toFixed(2)}
                    </Typography>
                  </Box>
                  <Chip
                    label={bid.status}
                    color={getBidStatusColor(bid.status)}
                    icon={getBidStatusIcon(bid.status)}
                    sx={{ fontWeight: 'bold', px: 1 }}
                  />
                </Box>

                {bid.message && (
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Your Message to Requester:
                    </Typography>
                    <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                      "{bid.message}"
                    </Typography>
                  </Paper>
                )}

                <Box display="flex" alignItems="center" gap={1}>
                  <AccessTime fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Bid placed on: {moment(bid.createdAt).format('MMM DD, YYYY [at] h:mm A')}
                  </Typography>
                </Box>

                {bid.updatedAt && bid.updatedAt !== bid.createdAt && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Refresh fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Last updated: {moment(bid.updatedAt).format('MMM DD, YYYY [at] h:mm A')}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Fade>

        {/* Risk Analysis Card */}
        <Fade in timeout={900}>
          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h5"
                fontWeight="bold"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Warning color="warning" />
                AI Risk Analysis & Prevention Measures
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {!risksAndPreventions && !loadingRisks ? (
                <Box textAlign="center" py={4}>
                  <Shield sx={{ fontSize: 80, color: 'action.disabled', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Get AI-Powered Risk Analysis
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    Generate a comprehensive risk assessment and prevention measures for this project
                    using advanced AI analysis.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleRead}
                    startIcon={<PlayArrow />}
                    sx={{
                      mt: 2,
                      textTransform: 'none',
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                    }}
                  >
                    Generate Risk Analysis
                  </Button>
                </Box>
              ) : loadingRisks ? (
                <Box py={4}>
                  <Stack spacing={2} alignItems="center">
                    <CircularProgress size={60} />
                    <Typography variant="h6" color="text.secondary">
                      Analyzing Project Risks...
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Our AI is reviewing the project details and generating recommendations
                    </Typography>
                    <Box width="100%" maxWidth={400}>
                      <Skeleton variant="text" height={30} />
                      <Skeleton variant="text" height={30} />
                      <Skeleton variant="text" height={30} width="80%" />
                    </Box>
                  </Stack>
                </Box>
              ) : (
                <>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      bgcolor: 'action.hover',
                      borderRadius: 2,
                      mb: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        whiteSpace: 'pre-line',
                        lineHeight: 2,
                        fontFamily: 'system-ui',
                      }}
                    >
                      {risksAndPreventions}
                    </Typography>
                  </Paper>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="large"
                      onClick={handleStartChat}
                      startIcon={<Message />}
                      fullWidth
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        py: 1.5,
                        fontSize: '1rem',
                      }}
                    >
                      Start Chat with Requester
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={handleRetryRisks}
                      startIcon={<Refresh />}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        py: 1.5,
                      }}
                    >
                      Regenerate
                    </Button>
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Fade>
      </Stack>
    </Container>
  );
}

export default BidDetails;
