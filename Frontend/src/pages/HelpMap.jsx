import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Button,
  alpha,
  useTheme
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Fix leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to dynamically update map center
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13);
  }, [center, map]);
  return null;
}

function HelpMap() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null); // Default to null initially
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [requests, setRequests] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLoadingLoc(false);
        },
        (err) => {
          console.error(err);
          setError('Could not get your location. Defaulting to a general map view.');
          // Defaulting to a central location if denied
          setLocation({ lat: 39.8283, lng: -98.5795 }); // USA center
          setLoadingLoc(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLocation({ lat: 39.8283, lng: -98.5795 });
      setLoadingLoc(false);
    }
  }, []);

  useEffect(() => {
    if (location && !error) {
      const fetchNearby = async () => {
        setLoadingReqs(true);
        try {
          // Default radius is 10km
          const res = await axios.get(`/api/requests/nearby?lat=${location.lat}&lng=${location.lng}&radius=10`, { withCredentials: true });
          setRequests(res.data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingReqs(false);
        }
      };
      fetchNearby();
    }
  }, [location, error]);

  if (loadingLoc) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, ${alpha(theme.palette.secondary.main, 0.8)} 100%)`,
          color: 'white',
          py: 4,
          mb: 4,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Help Map
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Discover open help requests within 10 kilometers of your current location.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 6 }}>
        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper elevation={3} sx={{ height: '70vh', width: '100%', borderRadius: 3, overflow: 'hidden' }}>
          <MapContainer center={[location.lat, location.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={[location.lat, location.lng]} />
            
            {/* User Location Marker */}
            <Marker position={[location.lat, location.lng]}>
              <Popup>
                <Typography variant="subtitle2" fontWeight="bold">You are here</Typography>
              </Popup>
            </Marker>

            {/* Request Markers */}
            {requests.map((req) => (
              req.location && req.location.coordinates && req.location.coordinates.length === 2 && (
                <Marker key={req._id} position={[req.location.coordinates[1], req.location.coordinates[0]]}>
                  <Popup>
                    <Box sx={{ minWidth: 150 }}>
                      <Typography variant="subtitle1" fontWeight="bold" noWrap>{req.title}</Typography>
                      <Typography variant="body2" color="success.main" fontWeight="bold" sx={{ mb: 1 }}>
                        Budget: ${(req.offeredAmount * 0.9).toFixed(2)}
                      </Typography>
                      <Button 
                        variant="contained" 
                        size="small" 
                        fullWidth 
                        onClick={() => navigate(`/bid/${req._id}`)}
                      >
                        View & Bid
                      </Button>
                    </Box>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </Paper>
      </Container>
    </Box>
  );
}

export default HelpMap;
