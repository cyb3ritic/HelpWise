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
} from '@mui/material';
import dayjs from 'dayjs';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CreateRequest() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    typeOfHelp: '',
    offeredAmount: '',
    responseDeadline: '', // String format for native input
    workDeadline: '',     // String format for native input
  });

  const { title, description, typeOfHelp, offeredAmount, responseDeadline, workDeadline } = formData;

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
      // Kept the route as /api/openai/enhance-description per your request
      const enhanceRes = await axios.post(
        '/api/openai/enhance-description',
        { description },
        { withCredentials: true }
      );

      const enhancedDescription = enhanceRes.data.enhancedDescription;

      setFormData(prev => ({ ...prev, description: enhancedDescription }));

      setSnackbar({ open: true, message: 'Description enhanced successfully!', severity: 'success' });
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

    if (!title || !description || !typeOfHelp || !offeredAmount || !responseDeadline || !workDeadline) {
      setError('Please fill in all fields.');
      return;
    }

    // Compare dates
    if (dayjs(responseDeadline).isAfter(dayjs(workDeadline)) || dayjs(responseDeadline).isSame(dayjs(workDeadline))) {
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

      setSnackbar({ open: true, message: 'Help request created successfully!', severity: 'success' });
      setTimeout(() => navigate('/'), 1000);
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

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
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
      <Box
        sx={{
          padding: 4,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Create Help Request
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Title"
            name="title"
            variant="outlined"
            fullWidth
            value={title}
            onChange={handleChange}
            required
            margin="normal"
          />
          <TextField
            label="Description"
            name="description"
            variant="outlined"
            fullWidth
            multiline
            rows={4}
            value={description}
            onChange={handleChange}
            required
            margin="normal"
            helperText="Click 'Enhance Description' to improve clarity using AI"
          />
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleEnhanceDescription}
            disabled={enhancing || !description}
            sx={{ mt: 1, mb: 2 }}
          >
            {enhancing ? <CircularProgress size={24} /> : 'Enhance Description ✨'}
          </Button>
          <FormControl variant="outlined" fullWidth required margin="normal">
            <InputLabel id="type-of-help-label">Type of Help</InputLabel>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Select
                labelId="type-of-help-label"
                id="type-of-help"
                name="typeOfHelp"
                value={typeOfHelp}
                onChange={handleChange}
                label="Type of Help"
              >
                {typeOfHelpOptions.map((option) => (
                  <MenuItem key={option._id} value={option._id}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
            )}
          </FormControl>
          <TextField
            label="Offered Amount ($)"
            name="offeredAmount"
            variant="outlined"
            fullWidth
            value={offeredAmount}
            onChange={handleChange}
            required
            type="number"
            margin="normal"
            inputProps={{ min: 0, step: '0.01' }}
          />

          <TextField
            label="Response Deadline"
            name="responseDeadline"
            type="datetime-local"
            value={responseDeadline}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
          
          <TextField
            label="Work Deadline"
            name="workDeadline"
            type="datetime-local"
            value={workDeadline}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2, mb: 2 }}
            disabled={loading || processing}
          >
            {processing ? <CircularProgress size={24} /> : 'Create Request'}
          </Button>
        </form>
      </Box>
    </Container>
  );
}

export default CreateRequest;