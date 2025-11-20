// src/pages/Conversation.jsx

import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Avatar,
  IconButton,
  Paper,
  InputBase,
  Divider,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import io from 'socket.io-client';
import SendIcon from '@mui/icons-material/Send';
import { styled } from '@mui/system';
import moment from 'moment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Initialize socket outside of the component to prevent multiple instances
let socket;

const MessageContainer = styled(Box)(({ isSender }) => ({
  display: 'flex',
  justifyContent: isSender ? 'flex-end' : 'flex-start',
  marginBottom: '12px',
}));

const MessageBubble = styled(Box)(({ theme, isSender }) => ({
  display: 'inline-block',
  padding: '10px 14px',
  borderRadius: '18px',
  backgroundColor: isSender ? theme.palette.primary.main : theme.palette.grey[200],
  color: isSender ? '#fff' : '#000',
  cursor: 'pointer',
  maxWidth: '100%', // Limit the width for better readability
  boxShadow: isSender
    ? '0px 2px 4px rgba(0, 0, 0, 0.2)'
    : '0px 2px 4px rgba(0, 0, 0, 0.1)',
}));

const MessageText = styled(Typography)({
  wordWrap: 'break-word',
  whiteSpace: 'pre-wrap',
});

function Conversation() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [showTimeMessageIds, setShowTimeMessageIds] = useState([]);

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        // Fetch conversation details
        const convRes = await axios.get(`/api/conversations/${conversationId}`, {
          withCredentials: true,
        });
        setConversation(convRes.data);

        // Fetch existing messages
        const msgsRes = await axios.get(
          `/api/conversations/${conversationId}/messages`,
          { withCredentials: true }
        );
        setMessages(msgsRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching conversation:', err);

        if (err.response) {
          setError(err.response.data.msg || 'Failed to load conversation.');
        } else if (err.request) {
          setError('No response from server. Please try again later.');
        } else {
          setError('An unexpected error occurred.');
        }

        setLoading(false);
      }
    };

    if (user) {
      fetchConversation();
    }
  }, [user, conversationId]);

  useEffect(() => {
    if (conversationId && user) {
      // Initialize Socket.IO only once
      if (!socket) {
        socket = io('http://localhost:5000', {
          withCredentials: true, // Ensure cookies are sent
        });

        // Handle connection errors
        socket.on('connect_error', (err) => {
          console.error('Socket connection error:', err.message);
        });

        // Listen for incoming messages
        socket.on('chatMessage', (message) => {
          // Ensure the message is part of this conversation
          if (message.conversationId === conversationId) {
            setMessages((prevMessages) => [...prevMessages, message]);
          }
        });

        // Listen for error messages from the server
        socket.on('errorMessage', (data) => {
          alert(data.msg);
        });
      }

      // Join the conversation room
      socket.emit('joinConversation', conversationId);

      // Clean up on unmount
      return () => {
        if (socket) {
          socket.off('chatMessage');
          socket.off('errorMessage');
          socket.emit('leaveConversation', conversationId);
        }
      };
    }
  }, [conversationId, user]);

  useEffect(() => {
    // Scroll to the latest message
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() !== '') {
      const messageData = {
        conversationId,
        message: newMessage.trim(),
      };

      // Emit the message to the server
      socket.emit('chatMessage', messageData);

      // Clear the input field
      setNewMessage('');
    }
  };

  const handleToggleTimestamp = (messageId) => {
    setShowTimeMessageIds((prev) =>
      prev.includes(messageId) ? prev.filter((id) => id !== messageId) : [...prev, messageId]
    );
  };

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

  if (!conversation) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Typography variant="h6">Conversation not found.</Typography>
      </Container>
    );
  }

  // Determine the other participant
  const otherParticipant = conversation.participants.find((p) => p._id !== user._id);

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => navigate('/conversations')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Avatar sx={{ mr: 1 }}>
          {otherParticipant.firstName.charAt(0)}
          {otherParticipant.lastName.charAt(0)}
        </Avatar>
        <Typography variant="h6">
          {otherParticipant.firstName} {otherParticipant.lastName}
        </Typography>
      </Box>
      <Divider />
      <Box
        sx={{
          p: 2,
          height: '60vh',
          overflowY: 'auto',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          mt: 2,
        }}
      >
        {messages.map((msg) => {
          const isSender = msg.sender._id === user._id;
          const messageTime = moment(msg.createdAt).format('h:mm A');

          return (
            <MessageContainer key={msg._id} isSender={isSender}>
              {!isSender && (
                <Avatar sx={{ mr: 1 }}>
                  {otherParticipant.firstName.charAt(0)}
                  {otherParticipant.lastName.charAt(0)}
                </Avatar>
              )}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isSender ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                }}
              >
                <MessageBubble
                  isSender={isSender}
                  onClick={() => handleToggleTimestamp(msg._id)}
                >
                  <MessageText variant="body1">{msg.content}</MessageText>
                </MessageBubble>
                {showTimeMessageIds.includes(msg._id) && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {messageTime}
                  </Typography>
                )}
              </Box>
            </MessageContainer>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>
      <Paper
        component="form"
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          mt: 2,
        }}
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          multiline
          maxRows={4}
        />
        <Divider sx={{ height: 28, m: 0.5 }} orientation="horizontal" />
        <IconButton
          color="primary"
          sx={{ p: '10px' }}
          onClick={handleSendMessage}
          disabled={newMessage.trim() === ''}
        >
          <SendIcon />
        </IconButton>
      </Paper>
    </Container>
  );
}

export default Conversation;
