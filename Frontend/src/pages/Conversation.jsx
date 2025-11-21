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
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import SendIcon from '@mui/icons-material/Send';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { styled } from '@mui/system';
import moment from 'moment';

// --- Styled Components ---

const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '85vh',
  backgroundColor: '#e5ddd5', // WhatsApp-like background color
  backgroundImage: 'url("https://www.transparenttextures.com/patterns/subtle-white-feathers.png")', // Subtle pattern
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
}));

const Header = styled(Paper)(({ theme }) => ({
  padding: '10px 16px',
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#075e54', // WhatsApp teal
  color: '#fff',
  borderRadius: 0,
}));

const MessagesArea = styled(Box)({
  flexGrow: 1,
  overflowY: 'auto',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
});

const MessageContainer = styled(Box)(({ isSender }) => ({
  display: 'flex',
  justifyContent: isSender ? 'flex-end' : 'flex-start',
  marginBottom: '8px',
  width: '100%', // Ensure container takes full width
}));

const MessageBubble = styled(Box)(({ theme, isSender }) => ({
  maxWidth: '70%',
  padding: '8px 12px',
  borderRadius: '8px',
  backgroundColor: isSender ? '#dcf8c6' : '#fff', // WhatsApp sender/receiver colors
  color: '#303030',
  boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
  position: 'relative',
  fontSize: '0.95rem',
  lineHeight: 1.4,
  wordBreak: 'break-word', // Fix for long words
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    [isSender ? 'right' : 'left']: '-8px',
    width: 0,
    height: 0,
    border: '8px solid transparent',
    borderTopColor: isSender ? '#dcf8c6' : '#fff',
    [isSender ? 'borderLeft' : 'borderRight']: 'none',
    marginTop: '8px',
  },
}));

const DateSeparator = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  margin: '16px 0',
  '& span': {
    backgroundColor: '#e1f3fb',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    color: '#555',
    boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
  },
});

const InputArea = styled(Box)(({ theme }) => ({
  padding: '10px',
  backgroundColor: '#f0f0f0',
  display: 'flex',
  alignItems: 'center',
}));

const StyledInput = styled(InputBase)(({ theme }) => ({
  flex: 1,
  backgroundColor: '#fff',
  borderRadius: '20px',
  padding: '8px 16px',
  marginRight: '10px',
  fontSize: '1rem',
}));

function Conversation() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user, loading: authLoading } = useContext(AuthContext);
  const socket = useContext(SocketContext);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Menu State
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convRes, msgsRes] = await Promise.all([
          axios.get(`/api/conversations/${conversationId}`, { withCredentials: true }),
          axios.get(`/api/conversations/${conversationId}/messages`, { withCredentials: true })
        ]);
        setConversation(convRes.data);
        setMessages(msgsRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load conversation.');
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user, conversationId]);

  // Socket Logic
  useEffect(() => {
    if (socket && conversationId) {
      socket.emit('joinConversation', conversationId);

      const handleChatMessage = (message) => {
        if (message.conversationId === conversationId) {
          setMessages((prev) => [...prev, message]);
        }
      };

      const handleChatCleared = (data) => {
        if (data.conversationId === conversationId) {
          setMessages([]);
        }
      };

      socket.on('chatMessage', handleChatMessage);
      socket.on('chatCleared', handleChatCleared);

      return () => {
        socket.off('chatMessage', handleChatMessage);
        socket.off('chatCleared', handleChatCleared);
      };
    }
  }, [socket, conversationId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await axios.post(
        `/api/conversations/${conversationId}/messages`,
        { message: newMessage.trim() },
        { withCredentials: true }
      );
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleClearChat = async () => {
    try {
      await axios.delete(`/api/conversations/${conversationId}/messages`, { withCredentials: true });
      // State update handled by socket event 'chatCleared'
      handleCloseMenu();
    } catch (err) {
      console.error('Error clearing chat:', err);
      alert('Failed to clear chat.');
    }
  };

  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  // Helper to group messages by date
  const groupMessagesByDate = (msgs) => {
    const groups = {};
    msgs.forEach((msg) => {
      const date = moment(msg.createdAt).format('YYYY-MM-DD');
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  if (authLoading || loading) {
    return (
      <Container sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) return <Container sx={{ mt: 8 }}><Typography color="error">{error}</Typography></Container>;
  if (!conversation) return null;

  const otherParticipant = conversation.participants.find((p) => p._id !== user._id);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <ChatContainer>
        {/* Header */}
        <Header elevation={2}>
          <IconButton onClick={() => navigate('/conversations')} sx={{ color: '#fff', mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Avatar src={otherParticipant?.avatar} sx={{ mr: 2 }}>
            {otherParticipant?.firstName?.charAt(0)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {otherParticipant?.firstName} {otherParticipant?.lastName}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {otherParticipant?.email}
            </Typography>
          </Box>
          <IconButton onClick={handleMenuClick} sx={{ color: '#fff' }}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleCloseMenu}
          >
            <MenuItem onClick={handleClearChat}>
              <ListItemIcon>
                <DeleteSweepIcon fontSize="small" />
              </ListItemIcon>
              Clear Chat
            </MenuItem>
          </Menu>
        </Header>

        {/* Messages */}
        <MessagesArea>
          {Object.keys(messageGroups).map((date) => (
            <React.Fragment key={date}>
              <DateSeparator>
                <span>{moment(date).calendar(null, {
                  sameDay: '[Today]',
                  lastDay: '[Yesterday]',
                  lastWeek: 'dddd',
                  sameElse: 'MMMM Do YYYY'
                })}</span>
              </DateSeparator>
              {messageGroups[date].map((msg) => {
                const isSender = msg.sender._id === user._id;
                return (
                  <MessageContainer key={msg._id} isSender={isSender}>
                    <MessageBubble isSender={isSender}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          textAlign: 'right',
                          mt: 0.5,
                          fontSize: '0.7rem',
                          color: 'text.secondary',
                          opacity: 0.7
                        }}
                      >
                        {moment(msg.createdAt).format('h:mm A')}
                      </Typography>
                    </MessageBubble>
                  </MessageContainer>
                );
              })}
            </React.Fragment>
          ))}
          <div ref={messagesEndRef} />
        </MessagesArea>

        {/* Input */}
        <InputArea>
          <StyledInput
            placeholder="Type a message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            multiline
            maxRows={4}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            sx={{
              bgcolor: '#075e54',
              color: '#fff',
              '&:hover': { bgcolor: '#128c7e' },
              '&.Mui-disabled': { bgcolor: '#ccc', color: '#fff' }
            }}
          >
            <SendIcon />
          </IconButton>
        </InputArea>
      </ChatContainer>
    </Container>
  );
}

export default Conversation;
