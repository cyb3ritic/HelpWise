// src/pages/MyBids.jsx
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
  CardActions,
  Avatar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { AccessTime, AttachMoney, Description } from '@mui/icons-material';
import moment from 'moment';

function MyBids() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyBids = async () => {
      try {
        // Fetch all bids made by the user
        const res = await axios.get('/api/bids/user-bids', { withCredentials: true });

        // Validate that res.data is an array
        if (Array.isArray(res.data)) {
          setBids(res.data);
        } else if (res.data && Array.isArray(res.data.bids)) {
          setBids(res.data.bids);
        } else {
          // Unexpected response structure
          console.error('Unexpected API response:', res.data);
          setError('Unexpected response from server.');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching bids:', err);

        // Handle different error responses
        if (err.response) {
          // Server responded with a status other than 2xx
          setError(err.response.data.msg || 'Failed to load your bids.');
        } else if (err.request) {
          // Request was made but no response received
          setError('No response from server. Please try again later.');
        } else {
          // Something else caused the error
          setError('An unexpected error occurred.');
        }

        setLoading(false);
      }
    };

    if (user) {
      fetchMyBids();
    }
  }, [user]);

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
      <Typography variant="h4" gutterBottom>
        My Bids
      </Typography>
      {bids.length === 0 ? (
        <Typography variant="body1">You have not placed any bids yet.</Typography>
      ) : (
        <Grid container spacing={3}>
          {bids.map((bid) => (
            <Grid item xs={12} sm={6} md={4} key={bid._id}>
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
                  {/* Help Request Title */}
                  <Typography variant="h6" gutterBottom>
                    {bid.helpRequestId.title}
                  </Typography>

                  {/* Help Request Description */}
                  <Typography variant="body2" color="textSecondary">
                    {bid.helpRequestId.description.length > 100
                      ? `${bid.helpRequestId.description.substring(0, 100)}...`
                      : bid.helpRequestId.description}
                  </Typography>

                  {/* Type of Help */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Description sx={{ mr: 0.5 }} fontSize="small" />
                    <Typography variant="body2" color="textSecondary">
                      {bid.helpRequestId.typeOfHelp.name}
                    </Typography>
                  </Box>

                  {/* Bid Amount */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <AttachMoney sx={{ mr: 0.5 }} fontSize="small" />
                    <Typography variant="body2" color="textSecondary">
                      Bid Amount: <strong>${bid.bidAmount.toFixed(2)}</strong>
                    </Typography>
                  </Box>

                  {/* Response Deadline */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <AccessTime sx={{ mr: 0.5 }} fontSize="small" />
                    <Typography variant="body2" color="textSecondary">
                      Response Deadline:{' '}
                      {moment(bid.helpRequestId.responseDeadline).format('MMM DD, YYYY')}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
                  {/* Bid Status Chip */}
                  <Chip
                    label={bid.status}
                    color={
                      bid.status === 'Accepted'
                        ? 'success'
                        : bid.status === 'Declined'
                        ? 'error'
                        : bid.status === 'Pending'
                        ? 'warning'
                        : 'default'
                    }
                    size="small"
                  />
                  {/* View Details Button */}
                  <Button
                    variant="contained"
                    size="small"
                    color="primary"
                    onClick={() => navigate(`/my-bids/${bid._id}`)}
                    sx={{ textTransform: 'none' }}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default MyBids;
