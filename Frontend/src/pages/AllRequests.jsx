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
  Avatar,
  Paper,
  alpha,
  useTheme,
  Stack,
  Divider,
  TextField,
  InputAdornment,
} from '@mui/material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  AccessTime,
  AttachMoney,
  Person,
  TrendingUp,
  HourglassEmpty,
  Search,
  FilterList,
} from '@mui/icons-material';
import moment from 'moment';

function AllRequests() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
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

    return timeLeft.trim();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return 'success';
      case 'In Progress':
        return 'warning';
      case 'Completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'open' && req.status === 'Open') ||
      (filter === 'closed' && req.status !== 'Open');

    const matchesSearch =
      searchTerm === '' ||
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  if (authLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

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
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Browse Help Requests
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: '700px' }}>
            Find opportunities to help others and earn rewards. Review requests, place competitive
            bids, and collaborate on meaningful projects.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 6 }}>
        {/* Search and Filter */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            borderRadius: 2,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7}>
              <TextField
                fullWidth
                placeholder="Search requests by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={5}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  icon={<FilterList />}
                  label="All"
                  color={filter === 'all' ? 'primary' : 'default'}
                  onClick={() => setFilter('all')}
                  sx={{ fontWeight: filter === 'all' ? 'bold' : 'normal' }}
                />
                <Chip
                  label="Open"
                  color={filter === 'open' ? 'success' : 'default'}
                  onClick={() => setFilter('open')}
                  sx={{ fontWeight: filter === 'open' ? 'bold' : 'normal' }}
                />
                <Chip
                  label="Closed"
                  color={filter === 'closed' ? 'default' : 'default'}
                  onClick={() => setFilter('closed')}
                  sx={{ fontWeight: filter === 'closed' ? 'bold' : 'normal' }}
                />
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {filteredRequests.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              border: `2px dashed ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <HourglassEmpty sx={{ fontSize: 60, color: theme.palette.text.secondary, mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No help requests found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {searchTerm ? 'Try adjusting your search terms' : 'Check back later for new opportunities!'}
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredRequests.map((request) => {
              const timeLeft = calculateTimeLeft(request.responseDeadline);
              const isExpired = timeLeft === 'Expired';

              return (
                <Grid item xs={12} md={6} lg={4} key={request._id}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        boxShadow: theme.shadows[12],
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Chip
                          label={request.status}
                          color={getStatusColor(request.status)}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                        {!isExpired && request.status === 'Open' && (
                          <Chip
                            icon={<AccessTime />}
                            label={timeLeft}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                      </Box>

                      <Typography variant="h6" fontWeight="bold" gutterBottom noWrap>
                        {request.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          display: '-webkit-box',
                          overflow: 'hidden',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 3,
                          minHeight: '60px',
                        }}
                      >
                        {request.description}
                      </Typography>

                      <Divider sx={{ my: 2 }} />

                      <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AttachMoney sx={{ fontSize: 20, color: theme.palette.success.main }} />
                          <Typography variant="body2" fontWeight="600">
                            ${(request.offeredAmount * 0.9).toFixed(2)}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person sx={{ fontSize: 20, color: theme.palette.info.main }} />
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {request.requesterId?.firstName} {request.requesterId?.lastName}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        size="small"
                        onClick={() => handleOpenDialog(request)}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        View Details
                      </Button>
                      {request.status === 'Open' && !isExpired && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleBid(request._id)}
                          sx={{
                            ml: 'auto',
                            textTransform: 'none',
                            fontWeight: 600,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: theme.shadows[6],
                            },
                          }}
                        >
                          Place Bid
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Dialog for Detailed Description */}
        <Dialog
          open={Boolean(selectedRequest)}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            elevation: 0,
            sx: {
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h5" fontWeight="bold">
              {selectedRequest?.title}
            </Typography>
            <Chip
              label={selectedRequest?.status}
              color={getStatusColor(selectedRequest?.status)}
              size="small"
              sx={{ mt: 1, fontWeight: 'bold' }}
            />
          </DialogTitle>

          <DialogContent>
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {selectedRequest?.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Amount Promised (90%)
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    ${(selectedRequest?.offeredAmount * 0.9).toFixed(2)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Time Remaining
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="warning.main">
                    {calculateTimeLeft(selectedRequest?.responseDeadline)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {selectedRequest?.requesterId?.firstName?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight="600">
                      {selectedRequest?.requesterId?.firstName}{' '}
                      {selectedRequest?.requesterId?.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedRequest?.requesterId?.email}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button
              onClick={handleCloseDialog}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Close
            </Button>
            {selectedRequest?.status === 'Open' &&
              calculateTimeLeft(selectedRequest?.responseDeadline) !== 'Expired' && (
                <Button
                  onClick={() => {
                    navigate(`/bid/${selectedRequest._id}`);
                    handleCloseDialog();
                  }}
                  color="primary"
                  variant="contained"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[6],
                    },
                  }}
                >
                  Bid Now
                </Button>
              )}
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default AllRequests;
