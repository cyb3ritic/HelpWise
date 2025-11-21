// src/pages/RequestDetail.jsx
import React, { useEffect, useState, useContext } from 'react'
import { 
  Typography, 
  Button, 
  Box, 
  CircularProgress, 
  Grid, 
  Card, 
  CardContent, 
  CardActions 
} from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'

function RequestDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useContext(AuthContext)

  const [request, setRequest] = useState(null)
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const res = await axios.get(`/api/requests/${id}`, { withCredentials: true })
        setRequest(res.data)
      } catch (err) {
        console.error(err)
        setError('Failed to fetch help request.')
      }
    }

    const fetchBids = async () => {
      try {
        const res = await axios.get(`/api/bids/${id}`, { withCredentials: true })
        setBids(res.data)
      } catch (err) {
        console.error(err)
        // Handle error if necessary
      }
    }

    const fetchData = async () => {
      await fetchRequest()
      await fetchBids()
      setLoading(false)
    }

    fetchData()
  }, [id])

  const handleAccept = async (bidId) => {
    if (!window.confirm('Are you sure you want to accept this bid?')) return

    try {
      await axios.put(`/api/bids/${bidId}/accept`, {}, { withCredentials: true })
      navigate(`/chats/${bidId}`)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.msg || 'Failed to accept bid.')
    }
  }

  const handleDecline = async (bidId) => {
    if (!window.confirm('Are you sure you want to decline this bid?')) return

    try {
      await axios.put(`/api/bids/${bidId}/decline`, {}, { withCredentials: true })
      setBids(bids.filter(bid => bid._id !== bidId))
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.msg || 'Failed to decline bid.')
    }
  }

  if (loading) {
    return (
      <Grid container justifyContent="center" alignItems="center" sx={{ minHeight: '80vh' }}>
        <CircularProgress />
      </Grid>
    )
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Typography color="error" variant="h6" align="center">
          {error}
        </Typography>
      </Container>
    )
  }

  if (!request) {
    return null // Or display a message indicating the request wasn't found
  }

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Box 
        sx={{
          padding: 4,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Typography variant="h4" gutterBottom>
          {request.title}
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Posted by: {request.requesterId ? request.requesterId.name : 'N/A'}
        </Typography>
        <Typography variant="body1" paragraph>
          {request.description}
        </Typography>
        <Typography variant="body2">Type of Help: {request.typeOfHelp ? request.typeOfHelp.name : 'N/A'}</Typography>
        <Typography variant="body2">Offered Amount: ${request.offeredAmount.toFixed(2)}</Typography>
        <Typography variant="body2">Status: {request.status}</Typography>

        {/* Conditionally render components based on request status */}
        {request.status === 'Open' && (
          <Button variant="contained" color="primary" onClick={() => navigate(`/bids/create/${id}`)} sx={{ mt: 2 }}>
            Place a Bid
          </Button>
        )}

        {request.status !== 'Open' && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Bids
            </Typography>
            {bids.length === 0 ? (
              <Typography variant="body1">No bids placed yet.</Typography>
            ) : (
              bids.map((bid) => (
                <Card key={bid._id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6">{bid.bidderId.name}</Typography>
                    <Typography variant="body2">Credibility Points: {bid.bidderId.credibilityPoints}</Typography>
                    <Typography variant="body1">Bid Amount: ${bid.bidAmount.toFixed(2)}</Typography>
                    <Typography variant="body1">Message: {bid.message || 'No message provided.'}</Typography>
                  </CardContent>
                  {request.status === 'Open' && (
                    <CardActions>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => handleAccept(bid._id)}
                        sx={{ mr: 1 }}
                      >
                        Accept
                      </Button>
                      <Button 
                        variant="contained" 
                        color="secondary" 
                        onClick={() => handleDecline(bid._id)}
                      >
                        Decline
                      </Button>
                    </CardActions>
                  )}
                </Card>
              ))
            )}
          </Box>
        )}
      </Box>
    </Container>
  )
}

export default RequestDetail
