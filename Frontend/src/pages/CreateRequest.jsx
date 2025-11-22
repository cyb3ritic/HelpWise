// src/pages/CreateRequest.jsx

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Grid,
  alpha,
  useTheme,
  Stack,
  Chip,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  AutoAwesome,
  Send,
  Assignment,
  AttachMoney,
  CalendarToday,
  Category,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CreateRequest() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    typeOfHelp: '',
    offeredAmount: '',
    responseDeadline: '',
    workDeadline: '',
  });

  const { title, description, typeOfHelp, offeredAmount, responseDeadline, workDeadline } =
    formData;

  const [error, setError] = useState('');
  const [typeOfHelpOptions, setTypeOfHelpOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchTypeOfHelp = async () => {
      try {
        const res = await axios.get('/api/type-of-help', { withCredentials: true });
        setTypeOfHelpOptions(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching TypeOfHelp:', err);
        setError('Failed to load Type of Help options.');
        setLoading(false);
      }
    };
    fetchTypeOfHelp();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleEnhanceDescription = async () => {
    if (!description || description.length < 10) {
      setError('Description must be at least 10 characters to enhance.');
      return;
    }

    setEnhancing(true);
    setError('');
    try {
      const enhanceRes = await axios.post(
        '/api/openai/enhance-description',
        { description },
        { withCredentials: true }
      );
      const enhancedDescription = enhanceRes.data.enhancedDescription;
      setFormData((prev) => ({ ...prev, description: enhancedDescription }));
      setSnackbar({
        open: true,
        message: '✨ Description enhanced successfully!',
        severity: 'success',
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || 'Failed to enhance description.');
      setSnackbar({
        open: true,
        message: err.response?.data?.msg || 'Failed to enhance description.',
        severity: 'error',
      });
    } finally {
      setEnhancing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !title ||
      !description ||
      !typeOfHelp ||
      !offeredAmount ||
      !responseDeadline ||
      !workDeadline
    ) {
      setError('Please fill in all fields.');
      return;
    }

    if (
      dayjs(responseDeadline).isAfter(dayjs(workDeadline)) ||
      dayjs(responseDeadline).isSame(dayjs(workDeadline))
    ) {
      setError('Response Deadline must be before Work Deadline.');
      return;
    }

    setProcessing(true);
    setError('');
    try {
      await axios.post(
        '/api/requests',
        { title, description, typeOfHelp, offeredAmount, responseDeadline, workDeadline },
        { withCredentials: true }
      );
      setSnackbar({
        open: true,
        message: '🎉 Help request created successfully!',
        severity: 'success',
      });
      setTimeout(() => navigate('/requests'), 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || 'Failed to create help request.');
      setSnackbar({
        open: true,
        message: err.response?.data?.msg || 'Failed to create help request.',
        severity: 'error',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
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
          <Stack direction="row" alignItems="center" spacing={2}>
            <Assignment sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h3" fontWeight="bold">
                Create Help Request
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
                Describe what you need help with and let skilled helpers bid on your request
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ pb: 6 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            borderRadius: 3,
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Title */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                  Request Title
                </Typography>
                <TextField
                  name="title"
                  value={title}
                  onChange={handleChange}
                  fullWidth
                  required
                  placeholder="e.g., Need help with React project"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                  Detailed Description
                </Typography>
                <TextField
                  name="description"
                  value={description}
                  onChange={handleChange}
                  fullWidth
                  required
                  multiline
                  rows={6}
                  placeholder="Provide detailed information about your request, including requirements, expectations, and any specific guidelines..."
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                <Button
                  onClick={handleEnhanceDescription}
                  disabled={enhancing || description.length < 10}
                  startIcon={enhancing ? <CircularProgress size={20} /> : <AutoAwesome />}
                  sx={{
                    mt: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    px: 3,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                    },
                  }}
                >
                  {enhancing ? 'Enhancing...' : 'Enhance with AI ✨'}
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              {/* Type of Help */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                  Category
                </Typography>
                <FormControl fullWidth required>
                  <Select
                    name="typeOfHelp"
                    value={typeOfHelp}
                    onChange={handleChange}
                    displayEmpty
                    startAdornment={
                      <InputAdornment position="start">
                        <Category sx={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    }
                    sx={{
                      borderRadius: 2,
                    }}
                  >
                    <MenuItem value="" disabled>
                      Select category
                    </MenuItem>
                    {typeOfHelpOptions.map((option) => (
                      <MenuItem key={option._id} value={option._id}>
                        {option.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Offered Amount */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                  Budget Amount
                </Typography>
                <TextField
                  name="offeredAmount"
                  type="number"
                  value={offeredAmount}
                  onChange={handleChange}
                  fullWidth
                  required
                  placeholder="Enter amount"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoney />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Helper receives 90% (${offeredAmount ? (offeredAmount * 0.9).toFixed(2) : '0.00'})
                </Typography>
              </Grid>

              {/* Response Deadline */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                  Response Deadline
                </Typography>
                <TextField
                  name="responseDeadline"
                  type="datetime-local"
                  value={responseDeadline}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarToday />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Last date to receive bids
                </Typography>
              </Grid>

              {/* Work Deadline */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                  Work Deadline
                </Typography>
                <TextField
                  name="workDeadline"
                  type="datetime-local"
                  value={workDeadline}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarToday />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Expected completion date
                </Typography>
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={processing}
                    endIcon={processing ? <CircularProgress size={20} /> : <Send />}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      fontSize: '1rem',
                      borderRadius: 2,
                      textTransform: 'none',
                      boxShadow: theme.shadows[4],
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[8],
                      },
                    }}
                  >
                    {processing ? 'Creating Request...' : 'Create Request'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/requests')}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      fontSize: '1rem',
                      borderRadius: 2,
                      textTransform: 'none',
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                      },
                    }}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Info Box
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 3,
            bgcolor: alpha(theme.palette.info.main, 0.05),
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom color="info.main">
            💡 Tips for Creating a Great Request
          </Typography>
          <Stack spacing={1} component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              Be specific about your requirements and expected deliverables
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Set realistic deadlines to attract quality helpers
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Use the AI enhancement to improve your description clarity
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Include budget that reflects the complexity of your request
            </Typography>
          </Stack>
        </Paper> */}
      </Container>
    </Box>
  );
}

export default CreateRequest;
