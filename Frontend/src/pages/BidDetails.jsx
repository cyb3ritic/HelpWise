// src/pages/BidDetail.jsx
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
} from '@mui/icons-material';
import moment from 'moment';

function BidDetail() {
  const navigate = useNavigate();
  const { bidId } = useParams();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [bid, setBid] = useState(null);
  const [risksAndPreventions, setRisksAndPreventions] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showChatButton, setShowChatButton] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchBidDetail = async () => {
      try {
        // Fetch bid details
        const res = await axios.get(`/api/bids/${bidId}/details`, { withCredentials: true });
        setBid(res.data.bid);

        // Generate risks and preventions
        const { title, description } = res.data.bid.helpRequestId;

        const riskRes = await axios.post(
          '/api/openai/generate-risks',
          { title, description },
          { withCredentials: true }
        );

        setRisksAndPreventions(riskRes.data.risksAndPreventions);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching bid detail:', err);

        if (err.response) {
          setError(err.response.data.msg || 'Failed to load bid details.');
        } else if (err.request) {
          setError('No response from server. Please try again later.');
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

  const handleRead = () => {
    setShowChatButton(true);
  };

  const handleStartChat = async () => {
    try {
      // Check the structure of requesterId
      const requesterId =
        typeof bid.helpRequestId.requesterId === 'object'
          ? bid.helpRequestId.requesterId._id
          : bid.helpRequestId.requesterId;
  
      // Validate that requesterId and user._id are defined
      if (!requesterId || !user._id) {
        throw new Error('User IDs are not properly defined.');
      }
  
      // Create a new conversation
      const conversationRes = await axios.post(
        '/api/conversations',
        { participants: [user._id, requesterId] },
        { withCredentials: true }
      );
  
      const conversationId = conversationRes.data._id;
  
      // Navigate to the Conversation page
      navigate(`/conversations/${conversationId}`);
    } catch (err) {
      console.error('Error starting chat:', err);
  
      if (err.response) {
        console.error('Server Response:', err.response.data);
        setSnackbar({
          open: true,
          message: err.response.data.msg || 'Failed to start chat.',
          severity: 'error',
        });
      } else {
        setSnackbar({
          open: true,
          message: 'An unexpected error occurred while starting the chat.',
          severity: 'error',
        });
      }
    }
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

  if (!bid) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Typography variant="h6">Bid details not found.</Typography>
      </Container>
    );
  }

  // Calculate 90% of the offered amount
  const amountPromised = bid.helpRequestId.offeredAmount * 0.9;

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

      <Button variant="outlined" onClick={() => navigate('/my-bids')} sx={{ mb: 2 }}>
        &larr; Back to My Bids
      </Button>
      <Card
        variant="outlined"
        sx={{
          boxShadow: 3,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Bid Details
          </Typography>
          <Divider sx={{ mb: 4 }} />
          {/* Help Request Details */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Help Request
            </Typography>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Description sx={{ mr: 1 }} />
              {bid.helpRequestId.title}
            </Typography>
            <Typography variant="body1" gutterBottom>
              {bid.helpRequestId.description}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Chip
                label={bid.helpRequestId.typeOfHelp.name}
                color="primary"
                icon={<PlayArrow />}
                sx={{ mr: 1 }}
              />
              <Chip
                label={bid.helpRequestId.status}
                color={
                  bid.helpRequestId.status === 'Open'
                    ? 'warning'
                    : bid.helpRequestId.status === 'In Progress'
                    ? 'info'
                    : bid.helpRequestId.status === 'Completed'
                    ? 'success'
                    : 'default'
                }
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <AttachMoney sx={{ mr: 1 }} />
              <Typography variant="body1">
                Offered Amount: <strong>${amountPromised.toFixed(2)}</strong>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <AccessTime sx={{ mr: 1 }} />
              <Typography variant="body1">
                Response Deadline: {moment(bid.helpRequestId.responseDeadline).format('LLL')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <AccessTime sx={{ mr: 1 }} />
              <Typography variant="body1">
                Work Deadline: {moment(bid.helpRequestId.workDeadline).format('LLL')}
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 4 }} />
          {/* Your Bid Details */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Your Bid
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <AttachMoney sx={{ mr: 1 }} />
              <Typography variant="body1">
                Bid Amount: <strong>${bid.bidAmount.toFixed(2)}</strong>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
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
                icon={
                  bid.status === 'Accepted' ? (
                    <CheckCircle />
                  ) : bid.status === 'Pending' ? (
                    <AccessTime />
                  ) : bid.status === 'Declined' ? (
                    <AccessTime />
                  ) : (
                    <AccessTime />
                  )
                }
              />
            </Box>
            {bid.message && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1">
                  <strong>Your Message:</strong>
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {bid.message}
                </Typography>
              </Box>
            )}
          </Box>
          <Divider sx={{ mb: 4 }} />
          {/* Risk Analysis and Prevention Measures */}
          <Box>
            <Typography variant="h5" gutterBottom>
              Risk Analysis and Prevention Measures
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-line' }}>
              {risksAndPreventions}
            </Typography>
            <Box sx={{ mt: 4 }}>
              {!showChatButton ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleRead}
                  startIcon={<PlayArrow />}
                  sx={{ textTransform: 'none', borderRadius: 2, px: 4, py: 1 }}
                >
                  Read
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleStartChat}
                  startIcon={<Message />}
                  sx={{ textTransform: 'none', borderRadius: 2, px: 4, py: 1 }}
                >
                  Start Chat
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}

export default BidDetail;
