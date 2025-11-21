// src/pages/Conversations.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Badge,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { styled } from '@mui/system';

const StyledListItem = styled(ListItemButton)(({ theme }) => ({
  borderRadius: '12px',
  marginBottom: '8px',
  backgroundColor: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: '#f5f5f5',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.08)',
  },
}));

function Conversations() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await axios.get('/api/conversations/user/all', { withCredentials: true });
        setConversations(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        if (err.response) {
          setError(err.response.data.msg || 'Failed to load conversations.');
        } else if (err.request) {
          setError('No response from server. Please try again later.');
        } else {
          setError('An unexpected error occurred.');
        }
        setLoading(false);
      }
    };

    if (user) {
      fetchConversations();
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
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
        Messages
      </Typography>

      {conversations.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2, bgcolor: '#f9f9f9' }}>
          <Typography variant="body1" color="text.secondary">
            No conversations yet. Start a chat by accepting a bid!
          </Typography>
        </Paper>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {conversations.map((conversation) => {
            const otherParticipant = conversation.participants.find((p) => p._id !== user._id);

            // Handle last message logic safely
            // Note: The backend might not be populating lastMessage correctly if it's not set up to do so.
            // Assuming the backend returns a 'lastMessage' object or we need to fetch it.
            // If 'lastMessage' is missing, we might show "Start chatting"

            const lastMsgText = conversation.lastMessage?.content || "No messages yet";
            const lastMsgTime = conversation.updatedAt
              ? formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })
              : '';

            return (
              <StyledListItem
                key={conversation._id}
                onClick={() => navigate(`/conversations/${conversation._id}`)}
                alignItems="flex-start"
              >
                <ListItemAvatar>
                  <Avatar
                    src={otherParticipant?.avatar}
                    sx={{ width: 50, height: 50, mr: 1, bgcolor: '#075e54' }}
                  >
                    {otherParticipant?.firstName?.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {otherParticipant?.firstName} {otherParticipant?.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', ml: 1 }}>
                        {lastMsgTime}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 1,
                        mt: 0.5
                      }}
                    >
                      {lastMsgText}
                    </Typography>
                  }
                />
              </StyledListItem>
            );
          })}
        </List>
      )}
    </Container>
  );
}

export default Conversations;
