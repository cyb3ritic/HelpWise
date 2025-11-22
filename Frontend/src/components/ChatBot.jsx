// components/Chatbot.jsx

import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Box,
  IconButton,
  Drawer,
  TextField,
  List,
  ListItem,
  Avatar,
  Typography,
  Snackbar,
  Alert,
  Paper,
  Stack,
  Tooltip,
  CircularProgress,
  Fade,
  Chip,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  Badge,
  Divider,
  Card,
  CardContent,
  CardActions,
  Button,
  Link
} from '@mui/material';
import {
  Chat as ChatIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as UserIcon,
  Close as CloseIcon,
  DeleteSweep as ClearAllIcon,
  AutoAwesome as AutoAwesomeIcon,
  HelpOutline as HelpOutlineIcon,
  BugReport as BugReportIcon,
  SupportAgent as SupportAgentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Work as WorkIcon,
  Gavel as GavelIcon
} from '@mui/icons-material';
import { styled, alpha, keyframes } from '@mui/material/styles';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const GUEST_STORAGE_KEY = 'chatbot_guest_messages';

// --- Animations ---

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7); }
  70% { box-shadow: 0 0 0 12px rgba(102, 126, 234, 0); }
  100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); }
`;

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

const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
`;

// --- Styled Components ---

const FloatingButton = styled(IconButton)(({ theme }) => ({
  width: 64,
  height: 64,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
  animation: `${float} 3s ease-in-out infinite`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
    transform: 'scale(1.15) rotate(10deg)',
    boxShadow: '0 12px 32px rgba(102, 126, 234, 0.6)',
  },
}));

const GradientAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.15)',
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
    : 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
  padding: theme.spacing(2),
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: theme.palette.mode === 'dark'
      ? `radial-gradient(circle at 20% 30%, ${alpha('#667eea', 0.08)} 0%, transparent 50%),
         radial-gradient(circle at 80% 70%, ${alpha('#764ba2', 0.08)} 0%, transparent 50%)`
      : `radial-gradient(circle at 20% 30%, ${alpha('#667eea', 0.04)} 0%, transparent 50%),
         radial-gradient(circle at 80% 70%, ${alpha('#764ba2', 0.04)} 0%, transparent 50%)`,
    pointerEvents: 'none',
  },
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: alpha('#667eea', 0.3),
    borderRadius: '3px',
    '&:hover': {
      background: alpha('#667eea', 0.5),
    },
  },
}));

const MessageBubble = styled(Paper)(({ theme, sender }) => ({
  padding: theme.spacing(1.5, 2),
  // maxWidth: '75%',
  backgroundColor: sender === 'user'
    ? '#667eea'
    : theme.palette.mode === 'dark'
      ? alpha('#ffffff', 0.1)
      : '#ffffff',
  color: sender === 'user' ? '#ffffff' : theme.palette.text.primary,
  borderRadius: sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
  boxShadow: sender === 'user'
    ? '0 4px 20px rgba(102, 126, 234, 0.4)'
    : '0 2px 12px rgba(0,0,0,0.08)',
  wordWrap: 'break-word',
  animation: `${fadeInUp} 0.3s ease-out`,
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: sender === 'user'
      ? '0 6px 24px rgba(102, 126, 234, 0.5)'
      : '0 4px 16px rgba(0,0,0,0.12)',
  },
}));

const StyledAvatar = styled(Avatar)(({ theme, sender }) => ({
  width: 36,
  height: 36,
  background: sender === 'user'
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  border: `2px solid ${alpha(theme.palette.background.paper, 0.5)}`,
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  background: theme.palette.mode === 'dark'
    ? alpha('#1a1a2e', 0.95)
    : '#ffffff',
  backdropFilter: 'blur(20px)',
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(3),
    backgroundColor: theme.palette.mode === 'dark'
      ? alpha('#ffffff', 0.05)
      : alpha('#667eea', 0.04),
    border: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
    transition: 'all 0.3s ease',
    '& fieldset': {
      border: 'none',
    },
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark'
        ? alpha('#ffffff', 0.08)
        : alpha('#667eea', 0.06),
      border: `2px solid ${alpha('#667eea', 0.3)}`,
    },
    '&.Mui-focused': {
      backgroundColor: theme.palette.background.paper,
      border: `2px solid #667eea`,
      boxShadow: `0 0 0 4px ${alpha('#667eea', 0.1)}`,
    },
  },
}));

const SendButton = styled(IconButton)(({ theme, disabled }) => ({
  width: 48,
  height: 48,
  background: disabled
    ? theme.palette.action.disabledBackground
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: '#ffffff',
  boxShadow: disabled ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: disabled
      ? theme.palette.action.disabledBackground
      : 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
    transform: disabled ? 'none' : 'scale(1.1) rotate(15deg)',
    boxShadow: disabled ? 'none' : '0 6px 20px rgba(102, 126, 234, 0.6)',
  },
  '&:disabled': {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled,
  },
}));

const QuickActionChip = styled(Chip)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? alpha('#ffffff', 0.08)
    : '#ffffff',
  border: `2px solid ${alpha('#667eea', 0.3)}`,
  color: '#667eea',
  fontWeight: 600,
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
  },
}));

const StatusBadge = styled(Box)(({ theme }) => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: '#10b981',
  animation: `${pulse} 2s infinite`,
  border: `2px solid ${theme.palette.background.paper}`,
}));

const HeaderButton = styled(IconButton)(({ theme }) => ({
  color: 'white',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: alpha('#ffffff', 0.15),
    transform: 'scale(1.1)',
  },
}));

const RequestCard = ({ request, onClick }) => (
  <Card
    sx={{
      minWidth: 250,
      mb: 1,
      bgcolor: 'background.paper',
      boxShadow: 2,
      cursor: 'pointer',
      transition: 'transform 0.2s',
      '&:hover': { transform: 'scale(1.02)' }
    }}
    onClick={() => onClick(request._id)}
  >
    <CardContent sx={{ pb: 1 }}>
      <Typography variant="subtitle1" fontWeight="bold" noWrap>
        {request.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" noWrap>
        {request.location} • {request.category}
      </Typography>
      <Chip
        label={request.status}
        size="small"
        color={request.status === 'Open' ? 'success' : 'default'}
        sx={{ mt: 1, height: 20, fontSize: '0.7rem' }}
      />
    </CardContent>
  </Card>
);

const BidCard = ({ bid, onClick }) => (
  <Card
    sx={{
      minWidth: 250,
      mb: 1,
      bgcolor: 'background.paper',
      boxShadow: 2,
      cursor: 'pointer',
      transition: 'transform 0.2s',
      '&:hover': { transform: 'scale(1.02)' }
    }}
    onClick={() => onClick(bid.helpRequestId?._id)}
  >
    <CardContent sx={{ pb: 1 }}>
      <Typography variant="subtitle1" fontWeight="bold" noWrap>
        {bid.helpRequestId?.title || 'Unknown Request'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Bid Amount: ${bid.bidAmount}
      </Typography>
      <Chip
        label={bid.status}
        size="small"
        color={bid.status === 'Accepted' ? 'success' : 'warning'}
        sx={{ mt: 1, height: 20, fontSize: '0.7rem' }}
      />
    </CardContent>
  </Card>
);

function Chatbot() {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isInitialLoadRef = useRef(false);

  const quickActions = [
    {
      label: 'Find Requests',
      value: 'Find requests nearby',
      icon: <WorkIcon />
    },
    {
      label: 'Create Request',
      value: 'I need help with something',
      icon: <AutoAwesomeIcon />
    },
    {
      label: 'My Bids',
      value: 'Show my bids',
      icon: <GavelIcon />
    },
  ];

  // Load chat history when user changes
  useEffect(() => {
    loadChatHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Auto-scroll
  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  // Auto-focus and reload history when opening
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
      // Reset flag to allow history reload when reopening chatbot
      isInitialLoadRef.current = false;
      loadChatHistory();
    }
  }, [open]);

  // Unread count
  useEffect(() => {
    if (!open && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'bot') {
        setUnreadCount((prev) => prev + 1);
      }
    } else {
      setUnreadCount(0);
    }
  }, [messages, open]);

  const loadChatHistory = async () => {
    if (isInitialLoadRef.current) return;

    setIsLoadingHistory(true);

    try {
      if (user) {
        const res = await axios.get('/api/chatbot/history', { withCredentials: true });
        const loadedMessages = res.data.messages || [];
        setMessages(loadedMessages);
        isInitialLoadRef.current = true;

        localStorage.removeItem(GUEST_STORAGE_KEY);

        if (loadedMessages.length > 0) {
          setSnackbar({
            open: true,
            message: `Welcome back! Loaded ${loadedMessages.length} messages`,
            severity: 'success'
          });
        }
      } else {
        const guestMessages = localStorage.getItem(GUEST_STORAGE_KEY);
        if (guestMessages) {
          try {
            const parsed = JSON.parse(guestMessages);
            setMessages(parsed);
            isInitialLoadRef.current = true;
          } catch (e) {
            localStorage.removeItem(GUEST_STORAGE_KEY);
            setMessages([]);
          }
        } else {
          setMessages([]);
          isInitialLoadRef.current = true;
        }
      }
    } catch (err) {
      console.error('Error loading history:', err);

      if (!user) {
        const guestMessages = localStorage.getItem(GUEST_STORAGE_KEY);
        if (guestMessages) {
          try {
            setMessages(JSON.parse(guestMessages));
          } catch (e) {
            setMessages([]);
          }
        } else {
          setMessages([]);
        }
      } else {
        setMessages([]);
        setSnackbar({
          open: true,
          message: 'Failed to load chat history',
          severity: 'error'
        });
      }

      isInitialLoadRef.current = true;
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  const toggleDrawer = () => {
    setOpen((v) => !v);
    if (!open) setUnreadCount(0);
  };

  const handleSendMessage = async (messageText = input) => {
    const text = messageText.trim();
    if (!text || typing) return;

    const userMsg = {
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    if (!user) {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updatedMessages));
    }

    setInput('');
    setTyping(true);

    try {
      const payload = {
        message: text,
        context: !user ? updatedMessages : undefined
      };

      const res = await axios.post('/api/chatbot', payload, { withCredentials: true });

      const botMsg = {
        sender: 'bot',
        text: res.data.message,
        metadata: res.data.metadata,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);

      if (!user) {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(finalMessages));
      }

    } catch (err) {
      console.error('Error sending message:', err);

      const errorMsg = {
        sender: 'bot',
        text: err.response?.data?.msg || 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
        error: true
      };

      const finalMessages = [...updatedMessages, errorMsg];
      setMessages(finalMessages);

      if (!user) {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(finalMessages));
      }

      setSnackbar({
        open: true,
        message: 'Failed to send message',
        severity: 'error'
      });
    } finally {
      setTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (value) => {
    setInput(value);
    handleSendMessage(value);
  };

  const handleCardClick = (requestId) => {
    if (requestId) {
      if (isMobile) setOpen(false);
      navigate(`/requests/${requestId}`);
    }
  };

  const clearHistory = async () => {
    try {
      if (user) {
        await axios.delete('/api/chatbot/history', { withCredentials: true });
        setSnackbar({ open: true, message: 'Chat history cleared', severity: 'success' });
      } else {
        localStorage.removeItem(GUEST_STORAGE_KEY);
        setSnackbar({ open: true, message: 'Chat cleared', severity: 'success' });
      }

      setMessages([]);
      isInitialLoadRef.current = false;
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to clear chat', severity: 'error' });
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // --- Render Logic for Metadata ---
  const renderMetadata = (metadata) => {
    if (!metadata) return null;

    switch (metadata.type) {
      case 'REQUEST_LIST':
        return (
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {metadata.data.map((req) => (
              <RequestCard key={req._id} request={req} onClick={handleCardClick} />
            ))}
          </Box>
        );

      case 'BID_LIST':
        return (
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {metadata.data.map((bid) => (
              <BidCard key={bid._id} bid={bid} onClick={handleCardClick} />
            ))}
          </Box>
        );

      case 'CONFIRMATION':
        return (
          <Box sx={{ mt: 1 }}>
            <Stack direction="row" spacing={1}>
              {metadata.quickReplies.map((reply, idx) => (
                <Button
                  key={idx}
                  variant={reply.value === 'yes' ? 'contained' : 'outlined'}
                  color={reply.value === 'yes' ? 'primary' : 'error'}
                  size="small"
                  onClick={() => handleQuickAction(reply.value)}
                >
                  {reply.label}
                </Button>
              ))}
            </Stack>
          </Box>
        );

      default:
        if (metadata.quickReplies) {
          return (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {metadata.quickReplies.map((reply, idx) => (
                <Chip
                  key={idx}
                  label={reply.label}
                  onClick={() => handleQuickAction(reply.value)}
                  variant="outlined"
                  color="primary"
                  size="small"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </Box>
          );
        }
        return null;
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!open && (
        <Fade in={!open} timeout={500}>
          <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300 }}>
            <Tooltip title="Chat with AI Assistant" placement="left" arrow>
              <Badge
                badgeContent={unreadCount}
                color="error"
                overlap="circular"
                max={99}
              >
                <FloatingButton onClick={toggleDrawer}>
                  <ChatIcon sx={{ fontSize: 32 }} />
                </FloatingButton>
              </Badge>
            </Tooltip>
          </Box>
        </Fade>
      )}

      {/* Chat Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={toggleDrawer}
        variant="temporary"
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: '100%', md: '450px', lg: '500px' },
            height: '100vh',
            maxHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-12px 0 48px rgba(0,0,0,0.15)',
            border: 'none',
          },
        }}
        sx={{ zIndex: 1400 }}
      >
        {/* Header */}
        <GradientAppBar position="static" elevation={0}>
          <Toolbar sx={{ justifyContent: 'space-between', py: 0.9 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <StyledAvatar
                alt="AI Assistant"
                src="/icon_chatbot.png"
                sender="bot"
              >
                <BotIcon sx={{ fontSize: 22 }} />
              </StyledAvatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', letterSpacing: '0.3px' }}>
                  AI Assistant
                </Typography>
                <Stack direction="row" alignItems="center" gap={0.8}>
                  <StatusBadge />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}>
                    {user ? `💾 ${messages.length} saved` : `💬 Guest (${messages.length})`}
                  </Typography>
                </Stack>
              </Box>
            </Box>

            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Clear chat" arrow>
                <HeaderButton onClick={clearHistory} size="small">
                  <ClearAllIcon />
                </HeaderButton>
              </Tooltip>
              <Tooltip title="Close" arrow>
                <HeaderButton onClick={toggleDrawer} size="small">
                  <CloseIcon />
                </HeaderButton>
              </Tooltip>
            </Stack>
          </Toolbar>
        </GradientAppBar>

        {/* Messages Container */}
        <MessagesContainer>
          {isLoadingHistory ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%" flexDirection="column" gap={2}>
              <CircularProgress size={60} thickness={4} sx={{ color: '#667eea' }} />
              <Typography variant="body1" color="text.secondary" fontWeight={600}>
                {user ? 'Loading your conversation...' : 'Loading...'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {/* Welcome Message */}
              {messages.length === 0 && !typing && (
                <Fade in timeout={800}>
                  <Box sx={{ textAlign: 'center', mt: 6, mb: 4, px: 2 }}>
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        margin: '0 auto 20px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: `${float} 3s ease-in-out infinite`,
                      }}
                    >
                      <AutoAwesomeIcon sx={{ fontSize: 50, color: '#667eea' }} />
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
                      Welcome! 👋
                    </Typography>

                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1, lineHeight: 1.7 }}>
                      {user
                        ? 'Logged in! Your messages are saved permanently.'
                        : '👤 Guest mode: Messages saved locally.'}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                      I remember our conversations. Ask me anything!
                    </Typography>

                    <Divider sx={{ mb: 3 }} />

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                      Quick Actions
                    </Typography>

                    <Stack spacing={1.5}>
                      {quickActions.map((action, idx) => (
                        <QuickActionChip
                          key={idx}
                          icon={action.icon}
                          label={action.label}
                          onClick={() => handleQuickAction(action.value)}
                          sx={{ width: '100%', justifyContent: 'flex-start', height: 44, fontSize: '0.9rem' }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Fade>
              )}

              {/* Messages */}
              {messages.map((msg, idx) => (
                <Fade in key={idx} timeout={300}>
                  <ListItem
                    sx={{
                      display: 'flex',
                      flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      mb: 2,
                      px: 0,
                    }}
                  >
                    <StyledAvatar sender={msg.sender} sx={{ mx: 1 }}>
                      {msg.sender === 'user' ? <UserIcon sx={{ fontSize: 20 }} /> : <BotIcon sx={{ fontSize: 20 }} />}
                    </StyledAvatar>

                    <Box sx={{ maxWidth: '75%' }}>
                      <MessageBubble elevation={0} sender={msg.sender}>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                          {msg.text}
                        </Typography>
                        {/* Render Metadata (Cards, Quick Replies) */}
                        {msg.sender === 'bot' && renderMetadata(msg.metadata)}
                      </MessageBubble>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 0.5,
                          ml: msg.sender === 'user' ? 0 : 1,
                          mr: msg.sender === 'user' ? 1 : 0,
                          textAlign: msg.sender === 'user' ? 'right' : 'left',
                          color: 'text.secondary',
                          opacity: 0.7,
                          fontWeight: 500,
                        }}
                      >
                        {formatTime(msg.timestamp)}
                      </Typography>
                    </Box>
                  </ListItem>
                </Fade>
              ))}

              {/* Typing Indicator */}
              {typing && (
                <Fade in timeout={300}>
                  <ListItem sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, px: 0 }}>
                    <StyledAvatar sender="bot" sx={{ mx: 1 }}>
                      <BotIcon sx={{ fontSize: 20 }} />
                    </StyledAvatar>
                    <MessageBubble elevation={0} sender="bot">
                      <Stack direction="row" spacing={0.5}>
                        {[0, 0.2, 0.4].map((delay, i) => (
                          <Box
                            key={i}
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'grey.400',
                              animation: `${bounce} 1.4s infinite ease-in-out`,
                              animationDelay: `${delay}s`,
                            }}
                          />
                        ))}
                      </Stack>
                    </MessageBubble>
                  </ListItem>
                </Fade>
              )}

              <div ref={messagesEndRef} />
            </List>
          )}
        </MessagesContainer>

        {/* Input Area */}
        <InputContainer>
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <StyledTextField
              inputRef={inputRef}
              placeholder="Type your message..."
              multiline
              maxRows={4}
              fullWidth
              variant="outlined"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={typing || isLoadingHistory}
            />

            <Tooltip title="Send message" arrow>
              <span>
                <SendButton
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || typing || isLoadingHistory}
                >
                  {typing ? (
                    <CircularProgress size={24} sx={{ color: 'inherit' }} />
                  ) : (
                    <SendIcon />
                  )}
                </SendButton>
              </span>
            </Tooltip>
          </Stack>

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 1.5,
              color: 'text.secondary',
              fontWeight: 500,
              opacity: 0.7,
            }}
          >
            {user
              ? '💾 Auto-saved • Context-aware AI'
              : '💬 Guest mode • Login to save permanently'}
          </Typography>
        </InputContainer>
      </Drawer>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default Chatbot;
