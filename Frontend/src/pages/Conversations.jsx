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
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ChatBubbleOutline } from '@mui/icons-material';

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
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Your Conversations
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {conversations.length === 0 ? (
        <Typography variant="body1">You have no conversations yet.</Typography>
      ) : (
        <List>
          {conversations.map((conversation) => {
            // Determine the other participant
            const otherParticipant = conversation.participants.find((p) => p._id !== user._id);

            // Get the last message time
            const lastMessageTime = conversation.lastMessage?.createdAt
              ? formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })
              : 'No messages yet';

            // Get the last message text
            const lastMessage = conversation.lastMessage
              ? conversation.lastMessage.text
              : 'No messages yet';

            // Determine if there are unread messages
            const unreadCount = conversation.unreadMessages?.[user._id] || 0;

            return (
              <ListItemButton
                key={conversation._id}
                onClick={() => navigate(`/conversations/${conversation._id}`)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  <Badge
                    color="primary"
                    overlap="circular"
                    badgeContent=" "
                    variant={unreadCount > 0 ? 'dot' : undefined}
                  >
                    <Avatar>
                      {otherParticipant.firstName.charAt(0)}
                      {otherParticipant.lastName.charAt(0)}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" sx={{ fontWeight: unreadCount > 0 ? 'bold' : 'normal' }}>
                      {otherParticipant.firstName} {otherParticipant.lastName}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        noWrap
                        sx={{ fontWeight: unreadCount > 0 ? 'bold' : 'normal' }}
                      >
                        {lastMessage}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {lastMessageTime}
                      </Typography>
                    </>
                  }
                  sx={{ pr: 2 }}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" disabled>
                    <ChatBubbleOutline />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItemButton>
            );
          })}
        </List>
      )}
    </Container>
  );
}

export default Conversations;
