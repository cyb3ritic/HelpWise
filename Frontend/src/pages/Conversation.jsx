// src/pages/Conversation.jsx

import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Avatar,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  ListItemIcon,
  Tooltip,
  Fade,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Card,
  Stack,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import {
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  DeleteSweep as DeleteSweepIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Chat as ChatIcon,
  DoneAll as DoneAllIcon,
  AccessTime as AccessTimeIcon,
  EmojiEmotions as EmojiIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { styled, alpha, keyframes } from '@mui/material/styles';
import moment from 'moment';

// --- Beautiful Animations ---

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(33, 150, 243, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0);
  }
`;

const bounce = keyframes`
  0%, 80%, 100% { 
    transform: scale(0);
    opacity: 0.5;
  }
  40% { 
    transform: scale(1);
    opacity: 1;
  }
`;

// --- Stunning Styled Components ---

const ChatContainer = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100vh - 140px)',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)'
    : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  borderRadius: theme.spacing(3),
  overflow: 'hidden',
  boxShadow: theme.palette.mode === 'dark'
    ? '0 20px 60px rgba(0, 0, 0, 0.5)'
    : '0 20px 60px rgba(0, 0, 0, 0.15)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  position: 'relative',
  animation: `${fadeInUp} 0.5s ease-out`,
}));

const GlassHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5),
  display: 'flex',
  alignItems: 'center',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(30, 144, 255, 0.15) 0%, rgba(106, 90, 205, 0.15) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
  backdropFilter: 'blur(20px) saturate(180%)',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
}));

const MessagesArea = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  background: 'transparent',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: theme.palette.mode === 'dark'
      ? `radial-gradient(circle at 20% 30%, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 50%),
         radial-gradient(circle at 80% 70%, ${alpha(theme.palette.secondary.main, 0.03)} 0%, transparent 50%)`
      : `radial-gradient(circle at 20% 30%, ${alpha(theme.palette.primary.main, 0.02)} 0%, transparent 50%),
         radial-gradient(circle at 80% 70%, ${alpha(theme.palette.secondary.main, 0.02)} 0%, transparent 50%)`,
    pointerEvents: 'none',
  },
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: alpha(theme.palette.primary.main, 0.3),
    borderRadius: '10px',
    '&:hover': {
      background: alpha(theme.palette.primary.main, 0.5),
    },
  },
}));

const MessageContainer = styled(Box)(({ isSender }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: isSender ? 'flex-end' : 'flex-start',
  width: '100%',
  animation: isSender
    ? `${slideInRight} 0.4s cubic-bezier(0.4, 0, 0.2, 1)`
    : `${slideInLeft} 0.4s cubic-bezier(0.4, 0, 0.2, 1)`,
}));

const MessageBubble = styled(Box)(({ theme, isSender }) => ({
  maxWidth: '70%',
  padding: theme.spacing(1.5, 2.5),
  borderRadius: isSender
    ? '20px 20px 4px 20px'
    : '20px 20px 20px 4px',
  background: isSender
    ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
    : theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.paper, 0.8)
      : '#ffffff',
  color: isSender
    ? theme.palette.primary.contrastText
    : theme.palette.text.primary,
  boxShadow: isSender
    ? `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`
    : theme.palette.mode === 'dark'
      ? '0 4px 20px rgba(0, 0, 0, 0.3)'
      : '0 4px 20px rgba(0, 0, 0, 0.08)',
  wordBreak: 'break-word',
  position: 'relative',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: isSender
      ? `0 6px 30px ${alpha(theme.palette.primary.main, 0.5)}`
      : theme.palette.mode === 'dark'
        ? '0 6px 30px rgba(0, 0, 0, 0.4)'
        : '0 6px 30px rgba(0, 0, 0, 0.12)',
  },
}));

const DateSeparator = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  margin: theme.spacing(3, 0, 2, 0),
  position: 'relative',
  '&::before, &::after': {
    content: '""',
    flex: 1,
    height: '1px',
    background: `linear-gradient(to ${theme.direction === 'rtl' ? 'left' : 'right'}, 
      transparent, 
      ${alpha(theme.palette.divider, 0.3)}, 
      transparent)`,
    margin: 'auto',
  },
}));

const DateChip = styled(Chip)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, 0.6)
    : alpha(theme.palette.primary.main, 0.08),
  color: theme.palette.text.secondary,
  fontWeight: 700,
  fontSize: '0.7rem',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  backdropFilter: 'blur(10px)',
  padding: theme.spacing(0.5, 1),
  margin: theme.spacing(0, 2),
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
}));

const GlassInputArea = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5),
  background: theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, 0.5)
    : alpha('#ffffff', 0.9),
  backdropFilter: 'blur(20px) saturate(180%)',
  display: 'flex',
  alignItems: 'flex-end',
  gap: theme.spacing(1.5),
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.05)',
}));

const ModernInput = styled(InputBase)(({ theme }) => ({
  flex: 1,
  background: theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.default, 0.5)
    : alpha('#f8f9fa', 0.8),
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1.5, 2.5),
  fontSize: '0.95rem',
  border: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:focus-within': {
    border: `2px solid ${theme.palette.primary.main}`,
    background: theme.palette.background.paper,
    boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
  },
  '& textarea': {
    '&::placeholder': {
      opacity: 0.6,
    },
  },
}));

const GradientSendButton = styled(IconButton)(({ theme, disabled }) => ({
  background: disabled
    ? theme.palette.action.disabledBackground
    : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.primary.contrastText,
  width: 52,
  height: 52,
  boxShadow: disabled
    ? 'none'
    : `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: disabled
      ? theme.palette.action.disabledBackground
      : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
    transform: disabled ? 'none' : 'scale(1.08) rotate(15deg)',
    boxShadow: disabled
      ? 'none'
      : `0 6px 30px ${alpha(theme.palette.primary.main, 0.6)}`,
  },
  '&:active': {
    transform: disabled ? 'none' : 'scale(0.95)',
  },
  '&.Mui-disabled': {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled,
  },
}));

const AnimatedAvatar = styled(Avatar)(({ theme, online }) => ({
  width: 46,
  height: 46,
  border: `3px solid ${online ? '#4caf50' : alpha(theme.palette.divider, 0.3)}`,
  boxShadow: online
    ? `0 0 0 4px ${alpha('#4caf50', 0.2)}`
    : '0 2px 8px rgba(0, 0, 0, 0.15)',
  animation: online ? `${pulse} 2s infinite` : 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

const TypingIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.8),
  padding: theme.spacing(1.5, 2),
  background: theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, 0.8)
    : '#ffffff',
  borderRadius: '20px 20px 20px 4px',
  width: 'fit-content',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  backdropFilter: 'blur(10px)',
  '& span': {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    animation: `${bounce} 1.4s infinite ease-in-out both`,
  },
  '& span:nth-of-type(1)': { animationDelay: '-0.32s' },
  '& span:nth-of-type(2)': { animationDelay: '-0.16s' },
}));

const EmptyStateContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  gap: theme.spacing(2),
  animation: `${fadeInUp} 0.6s ease-out`,
}));

function Conversation() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user, loading: authLoading } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const openMenu = Boolean(anchorEl);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convRes, msgsRes] = await Promise.all([
          axios.get(`/api/conversations/${conversationId}`, { withCredentials: true }),
          axios.get(`/api/conversations/${conversationId}/messages`, { withCredentials: true }),
        ]);
        setConversation(convRes.data);
        setMessages(msgsRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.msg || 'Failed to load conversation.');
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user, conversationId]);

  useEffect(() => {
    if (socket && conversationId) {
      socket.emit('joinConversation', conversationId);

      const handleChatMessage = (message) => {
        if (message.conversationId === conversationId) {
          setMessages((prev) => [...prev, message]);
          setOtherUserTyping(false);
        }
      };

      const handleChatCleared = (data) => {
        if (data.conversationId === conversationId) {
          setMessages([]);
        }
      };

      const handleUserTyping = (data) => {
        if (data.conversationId === conversationId && data.userId !== user._id) {
          setOtherUserTyping(true);
          setTimeout(() => setOtherUserTyping(false), 3000);
        }
      };

      socket.on('chatMessage', handleChatMessage);
      socket.on('chatCleared', handleChatCleared);
      socket.on('userTyping', handleUserTyping);

      return () => {
        socket.off('chatMessage', handleChatMessage);
        socket.off('chatCleared', handleChatCleared);
        socket.off('userTyping', handleUserTyping);
      };
    }
  }, [socket, conversationId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherUserTyping]);

  const handleTyping = useCallback(() => {
    if (!typing) {
      setTyping(true);
      socket?.emit('typing', { conversationId, userId: user._id });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 1000);
  }, [typing, socket, conversationId, user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    const messageToSend = newMessage.trim();
    setNewMessage('');

    try {
      await axios.post(
        `/api/conversations/${conversationId}/messages`,
        { message: messageToSend },
        { withCredentials: true }
      );
    } catch (err) {
      console.error('Error sending message:', err);
      setNewMessage(messageToSend);
      setError('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await axios.delete(`/api/conversations/${conversationId}/messages`, {
        withCredentials: true
      });
      setClearDialogOpen(false);
      setAnchorEl(null);
    } catch (err) {
      console.error('Error clearing chat:', err);
      setError('Failed to clear chat. Please try again.');
    }
  };

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
      <Container sx={{ mt: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <Stack alignItems="center" spacing={3}>
          <CircularProgress size={70} thickness={4} />
          <Typography variant="h6" color="text.secondary" fontWeight={500}>
            Loading conversation...
          </Typography>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 8 }}>
        <Fade in>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
        </Fade>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/conversations')}
          sx={{ borderRadius: 2 }}
        >
          Back to Conversations
        </Button>
      </Container>
    );
  }

  if (!conversation) return null;

  const otherParticipant = conversation.participants.find((p) => p._id !== user._id);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: { xs: 1, sm: 3 } }}>
      <Fade in timeout={500}>
        <ChatContainer elevation={10}>
          {/* Glass Header */}
          <GlassHeader>
            <Tooltip title="Back to conversations" arrow>
              <IconButton
                onClick={() => navigate('/conversations')}
                sx={{
                  mr: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateX(-4px)',
                  }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>

            <AnimatedAvatar
              src={otherParticipant?.avatar}
              online={true}
            >
              {otherParticipant?.firstName?.charAt(0)}
            </AnimatedAvatar>

            <Box sx={{ flexGrow: 1, ml: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '0.3px' }}>
                {otherParticipant?.firstName} {otherParticipant?.lastName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.8,
                  fontWeight: 500,
                  color: otherUserTyping ? theme.palette.success.main : 'inherit'
                }}
              >
                {otherUserTyping ? (
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: theme.palette.success.main,
                        animation: `${pulse} 1s infinite`,
                      }}
                    />
                    Typing...
                  </Box>
                ) : (
                  'Active now'
                )}
              </Typography>
            </Box>

            <Tooltip title="More options" arrow>
              <IconButton
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'rotate(90deg)',
                  }
                }}
              >
                <MoreVertIcon />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={() => setAnchorEl(null)}
              PaperProps={{
                sx: {
                  borderRadius: 2,
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                }
              }}
            >
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  setClearDialogOpen(true);
                }}
                sx={{ borderRadius: 1, mx: 0.5 }}
              >
                <ListItemIcon>
                  <DeleteSweepIcon fontSize="small" color="error" />
                </ListItemIcon>
                <Typography color="error" fontWeight={600}>Clear Chat</Typography>
              </MenuItem>
            </Menu>
          </GlassHeader>

          {/* Messages Area */}
          <MessagesArea>
            {messages.length === 0 ? (
              <EmptyStateContainer>
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <ChatIcon sx={{ fontSize: 60, color: theme.palette.primary.main, opacity: 0.7 }} />
                </Box>
                <Typography variant="h5" fontWeight={700} color="text.primary">
                  No messages yet
                </Typography>
                <Typography variant="body1" color="text.secondary" textAlign="center" maxWidth={350}>
                  Start a conversation by sending your first message
                </Typography>
              </EmptyStateContainer>
            ) : (
              <>
                {Object.keys(messageGroups).map((date) => (
                  <React.Fragment key={date}>
                    <DateSeparator>
                      <DateChip
                        label={moment(date).calendar(null, {
                          sameDay: '[Today]',
                          lastDay: '[Yesterday]',
                          lastWeek: 'dddd',
                          sameElse: 'MMM DD, YYYY',
                        })}
                        size="small"
                      />
                    </DateSeparator>
                    {messageGroups[date].map((msg) => {
                      const isSender = msg.sender._id === user._id;
                      return (
                        <MessageContainer key={msg._id} isSender={isSender}>
                          {!isSender && (
                            <Typography
                              variant="caption"
                              sx={{
                                mb: 0.5,
                                ml: 1,
                                fontWeight: 600,
                                color: theme.palette.text.secondary
                              }}
                            >
                              {msg.sender.firstName}
                            </Typography>
                          )}
                          <MessageBubble isSender={isSender}>
                            <Typography
                              variant="body1"
                              sx={{
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.6,
                                mb: 0.5,
                              }}
                            >
                              {msg.content}
                            </Typography>
                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="flex-end"
                              gap={0.5}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.7rem',
                                  opacity: 0.8,
                                  fontWeight: 600,
                                }}
                              >
                                {moment(msg.createdAt).format('h:mm A')}
                              </Typography>
                              {isSender && (
                                <DoneAllIcon
                                  sx={{
                                    fontSize: '1rem',
                                    opacity: 0.8,
                                    color: '#4fc3f7',
                                  }}
                                />
                              )}
                            </Box>
                          </MessageBubble>
                        </MessageContainer>
                      );
                    })}
                  </React.Fragment>
                ))}

                {/* Typing Indicator */}
                {otherUserTyping && (
                  <MessageContainer isSender={false}>
                    <Typography
                      variant="caption"
                      sx={{ mb: 0.5, ml: 1, fontWeight: 600, color: 'text.secondary' }}
                    >
                      {otherParticipant?.firstName}
                    </Typography>
                    <TypingIndicator>
                      <span /><span /><span />
                    </TypingIndicator>
                  </MessageContainer>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </MessagesArea>

          {/* Glass Input Area */}
          <GlassInputArea>
            {conversation.requestId && (conversation.requestId.status === 'Closed' || conversation.requestId.status === 'Completed') ? (
              <Alert severity="info" sx={{ width: '100%' }}>
                This conversation is disabled because the help request is {conversation.requestId.status.toLowerCase()}.
              </Alert>
            ) : (
              <>
                <ModernInput
                  placeholder={`Message ${otherParticipant?.firstName}...`}
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  multiline
                  maxRows={4}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sendingMessage}
                  endAdornment={
                    !isMobile && (
                      <Typography variant="caption" sx={{ opacity: 0.5, mr: 1 }}>
                        Press Enter to send
                      </Typography>
                    )
                  }
                />

                <Tooltip title={newMessage.trim() ? 'Send message' : 'Type a message'} arrow>
                  <span>
                    <GradientSendButton
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                    >
                      {sendingMessage ? (
                        <CircularProgress size={24} sx={{ color: 'inherit' }} />
                      ) : (
                        <SendIcon />
                      )}
                    </GradientSendButton>
                  </span>
                </Tooltip>
              </>
            )}
          </GlassInputArea>
        </ChatContainer>
      </Fade>

      {/* Modern Dialog */}
      <Dialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.3rem' }}>
          Clear Chat History?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.95rem', lineHeight: 1.7 }}>
            This will permanently delete all messages in this conversation. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setClearDialogOpen(false)}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleClearChat}
            variant="contained"
            color="error"
            sx={{ borderRadius: 2, px: 3 }}
            startIcon={<DeleteSweepIcon />}
          >
            Clear Chat
          </Button>
        </DialogActions>
      </Dialog >
    </Container >
  );
}

export default Conversation;
