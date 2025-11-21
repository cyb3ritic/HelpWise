import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Box,
  Snackbar,
  Alert,
  Link as MuiLink,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function Register() {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const [expertiseOptions, setExpertiseOptions] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    expertise: [],
  });
  const { firstName, lastName, email, password, expertise } = formData;

  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // OTP States
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [otp, setOtp] = useState(''); // We'll treat this as a string of 6 digits
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    const fetchExpertise = async () => {
      try {
        const res = await axios.get('/api/type-of-help', { withCredentials: true });
        setExpertiseOptions(res.data);
      } catch (err) {
        console.error(err);
        setSnackbar({ open: true, message: 'Failed to fetch expertise options.', severity: 'error' });
      }
    };
    fetchExpertise();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleExpertiseChange = (event) => {
    const { value } = event.target;
    setFormData({
      ...formData,
      expertise: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const isValidString = (str) => /^[a-zA-Z]+$/.test(str);
  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Trim firstName and lastName before validation and submission
    const trimmedData = {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
    };

    const { firstName, lastName, email, password, expertise } = trimmedData;

    // Frontend Validation
    if (!firstName || !isValidString(firstName)) {
      setSnackbar({ open: true, message: 'First name must be a valid string.', severity: 'error' });
      return;
    }
    if (!lastName || !isValidString(lastName)) {
      setSnackbar({ open: true, message: 'Last name must be a valid string.', severity: 'error' });
      return;
    }
    if (!email.trim() || !isValidEmail(email)) {
      setSnackbar({ open: true, message: 'Enter a valid email address.', severity: 'error' });
      return;
    }
    if (!password || password.length < 6) {
      setSnackbar({ open: true, message: 'Password must be at least 6 characters long.', severity: 'error' });
      return;
    }

    try {
      // Send trimmed data to the backend
      await axios.post('/api/users/register', { firstName, lastName, email, password, expertise }, { withCredentials: true });

      // Show OTP input to the user for email verification
      setAwaitingVerification(true);
      setResendTimer(60); // Start 60s countdown
      setSnackbar({ open: true, message: 'OTP sent to your email. Please verify.', severity: 'success' });
    } catch (err) {
      console.error(err.response);
      setSnackbar({ open: true, message: err.response?.data?.msg || 'Registration failed.', severity: 'error' });
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setSnackbar({ open: true, message: 'Enter the 6-digit OTP.', severity: 'error' });
      return;
    }

    try {
      await axios.post('/api/users/verify-otp', { email, otp }, { withCredentials: true });
      // After verification, fetch current user and set auth
      const res = await axios.get('/api/users/me', { withCredentials: true });
      setUser(res.data);
      setSnackbar({ open: true, message: 'Email verified and logged in!', severity: 'success' });
      navigate('/');
    } catch (err) {
      console.error(err.response);
      setSnackbar({ open: true, message: err.response?.data?.msg || 'OTP verification failed.', severity: 'error' });
    }
  };

  const handleResendOTP = async () => {
    try {
      await axios.post('/api/users/resend-otp', { email }, { withCredentials: true });
      setSnackbar({ open: true, message: 'A new OTP was sent to your email.', severity: 'success' });
      setResendTimer(60);
    } catch (err) {
      console.error(err.response);
      setSnackbar({ open: true, message: err.response?.data?.msg || 'Failed to resend OTP.', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: '', severity: '' });
  };

  // Helper to handle OTP input change
  const handleOtpChange = (index, value) => {
    if (!/^[0-9]*$/.test(value)) return;

    const newOtp = otp.split('');
    // Ensure array is long enough
    while (newOtp.length < 6) newOtp.push('');

    newOtp[index] = value;
    const otpString = newOtp.join('').substring(0, 6);
    setOtp(otpString);

    // Auto-focus next
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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
        <Typography variant="h4" align="center" gutterBottom>
          Register
        </Typography>

        {!awaitingVerification ? (
          <form onSubmit={handleSubmit}>
            <TextField
              label="First Name"
              name="firstName"
              variant="outlined"
              fullWidth
              value={firstName}
              onChange={handleChange}
              required
              margin="normal"
              error={!isValidString(firstName)}
              helperText={!isValidString(firstName) ? 'Only alphabets and spaces are allowed.' : ''}
            />
            <TextField
              label="Last Name"
              name="lastName"
              variant="outlined"
              fullWidth
              value={lastName}
              onChange={handleChange}
              required
              margin="normal"
              error={!isValidString(lastName)}
              helperText={!isValidString(lastName) ? 'Only alphabets and spaces are allowed.' : ''}
            />
            <TextField
              label="Email"
              name="email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={handleChange}
              required
              type="email"
              margin="normal"
              error={!isValidEmail(email)}
              helperText={!isValidEmail(email) ? 'Enter a valid email address.' : ''}
            />
            <TextField
              label="Password"
              name="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={handleChange}
              required
              type="password"
              margin="normal"
              helperText="Enter a strong password (at least 6 characters)."
            />
            <FormControl variant="outlined" sx={{ mt: 2, minWidth: 120, width: '100%' }}>
              <InputLabel id="expertise-label">Expertise</InputLabel>
              <Select
                labelId="expertise-label"
                multiple
                value={expertise}
                onChange={handleExpertiseChange}
                renderValue={(selected) =>
                  selected.map((id) => {
                    const option = expertiseOptions.find((opt) => opt._id === id);
                    return option ? option.name : '';
                  }).join(', ')
                }
                label="Expertise"
              >
                {expertiseOptions.map((option) => (
                  <MenuItem key={option._id} value={option._id}>
                    <Checkbox checked={expertise.indexOf(option._id) > -1} />
                    <ListItemText primary={option.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2, mb: 2 }}>
              Register
            </Button>
          </form>
        ) : (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Verify Your Email
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Enter the 6-digit code sent to <strong>{email}</strong>
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
              {[...Array(6)].map((_, index) => (
                <TextField
                  key={index}
                  id={`otp-${index}`}
                  variant="outlined"
                  inputProps={{
                    maxLength: 1,
                    style: { textAlign: 'center', fontSize: '1.5rem', padding: '10px', width: '20px' },
                  }}
                  value={otp[index] || ''}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  sx={{ width: '50px' }}
                />
              ))}
            </Box>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleVerifyOTP}
              disabled={otp.length !== 6}
              sx={{ mb: 2, py: 1.5, fontSize: '1rem' }}
            >
              Verify Email
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Didn't receive code?
              </Typography>
              <Button
                variant="text"
                onClick={handleResendOTP}
                disabled={resendTimer > 0}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
              </Button>
            </Box>
          </Box>
        )}

        <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
          <Grid item>
            <MuiLink component={Link} to="/login" variant="body2">
              Already have an account? Login
            </MuiLink>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default Register;