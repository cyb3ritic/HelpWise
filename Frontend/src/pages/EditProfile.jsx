// src/pages/EditProfile.jsx

import React, { useState, useContext, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import EmailIcon from "@mui/icons-material/Email";
import PointsIcon from "@mui/icons-material/Star";
import ExpertiseIcon from "@mui/icons-material/Build";
import EditIcon from "@mui/icons-material/Edit";

function EditProfile() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);

  const [expertiseOptions, setExpertiseOptions] = useState([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    expertise: [],
  });

  const { firstName, lastName, email, password, expertise } = formData;

  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/api/users/me", { withCredentials: true });
        setFormData({
          firstName: res.data.firstName || "",
          lastName: res.data.lastName || "",
          email: res.data.email || "",
          password: "",
          expertise: res.data.expertise.map((exp) => exp._id) || [],
        });
      } catch (err) {
        console.error(err);
        setSnackbar({
          open: true,
          message: "Failed to fetch user data.",
          severity: "error",
        });
      }
    };

    const fetchExpertise = async () => {
      try {
        const res = await axios.get("/api/type-of-help", {
          withCredentials: true,
        });
        setExpertiseOptions(res.data);
        console.log("Expertise options:", res.data);
      } catch (err) {
        console.error(err);
        setSnackbar({
          open: true,
          message: "Failed to fetch expertise options.",
          severity: "error",
        });
      }
    };

    fetchData();
    fetchExpertise();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleExpertiseChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormData({
      ...formData,
      expertise: typeof value === "string" ? value.split(",") : value,
    });
  };

  const isValidString = (str) => /^[a-zA-Z\s]+$/.test(str);
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
      setSnackbar({
        open: true,
        message: "First name must contain only letters and spaces.",
        severity: "error",
      });
      return;
    }
    if (!lastName || !isValidString(lastName)) {
      setSnackbar({
        open: true,
        message: "Last name must contain only letters and spaces.",
        severity: "error",
      });
      return;
    }
    if (!email.trim() || !isValidEmail(email)) {
      setSnackbar({
        open: true,
        message: "Enter a valid email address.",
        severity: "error",
      });
      return;
    }
    if (password && password.length < 6) {
      setSnackbar({
        open: true,
        message: "Password must be at least 6 characters long.",
        severity: "error",
      });
      return;
    }
    if (expertise.length === 0) {
      setSnackbar({
        open: true,
        message: "Select at least one expertise.",
        severity: "error",
      });
      return;
    }

    try {
      // Prepare data to update (exclude password if not changing)
      const updateData = {
        firstName,
        lastName,
        email,
        expertise,
      };

      if (password) {
        updateData.password = password;
      }

      // Send update request
      const res = await axios.put("/api/users/me", updateData, {
        withCredentials: true,
      });

      // Update AuthContext
      setUser(res.data);

      setSnackbar({
        open: true,
        message: "Profile updated successfully!",
        severity: "success",
      });

      navigate("/profile");
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: err.response?.data?.msg || "Failed to update profile.",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: "", severity: "success" });
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          padding: 4,
          backgroundColor: "background.paper",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Edit Profile
        </Typography>
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
            error={!isValidString(firstName) && firstName !== ""}
            helperText={
              !isValidString(firstName) && firstName !== ""
                ? "Only letters and spaces are allowed."
                : ""
            }
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
            error={!isValidString(lastName) && lastName !== ""}
            helperText={
              !isValidString(lastName) && lastName !== ""
                ? "Only letters and spaces are allowed."
                : ""
            }
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
            error={!isValidEmail(email) && email !== ""}
            helperText={
              !isValidEmail(email) && email !== ""
                ? "Enter a valid email address."
                : ""
            }
          />
          <TextField
            label="Password"
            name="password"
            variant="outlined"
            fullWidth
            value={password}
            onChange={handleChange}
            type="password"
            margin="normal"
            helperText="Leave blank to keep current password."
            error={password.length > 0 && password.length < 6}
          />
          <FormControl
            variant="outlined"
            sx={{ mt: 2, minWidth: 120, width: "100%" }}
            required
          >
            <InputLabel id="expertise-label">Expertise</InputLabel>
            <Select
              labelId="expertise-label"
              multiple
              value={expertise}
              onChange={handleExpertiseChange}
              renderValue={(selected) =>
                selected
                  .map((id) => {
                    const option = expertiseOptions.find(
                      (opt) => opt._id === id
                    );
                    return option ? option.name : "";
                  })
                  .join(", ")
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
          {/* Display error message if any */}
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
            sx={{ mt: 3, mb: 2 }}
            startIcon={<EditIcon />}
          >
            Update Profile
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            fullWidth
            component={Link}
            to="/profile"
            sx={{ mb: 2 }}
          >
            Cancel
          </Button>
        </form>
      </Box>
    </Container>
  );
}

export default EditProfile;
