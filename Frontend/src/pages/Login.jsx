// src/pages/Login.jsx
import React, { useState, useContext } from 'react'
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Link as MuiLink,
  Box 
} from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'

function Login() {
  const navigate = useNavigate()
  const { setUser } = useContext(AuthContext)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const { email, password } = formData

  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    try {
      // Send login request
      await axios.post('/api/users/login', { email, password }, { withCredentials: true })

      // Fetch authenticated user data
      const res = await axios.get('/api/users/me', { withCredentials: true })
      setUser(res.data)

      navigate('/')
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.msg || 'Login failed.')
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Box 
        sx={{
          padding: 4,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Login
        </Typography>
        <form onSubmit={handleSubmit}>
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
          >
            Login
          </Button>
        </form>
        <Grid container justifyContent="flex-end">
          <Grid item>
            <MuiLink component={Link} to="/register" variant="body2">
              Don't have an account? Register
            </MuiLink>
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}

export default Login
