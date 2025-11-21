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
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import BotIcon from '@mui/icons-material/SmartToy';
import UserIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const GUEST_STORAGE_KEY = 'chatbot_guest_messages';

function Chatbot() {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
    { label: 'Get Help', value: 'I need help with the platform' },
    { label: 'Report Issue', value: 'I want to report an issue' },
    { label: 'Contact Support', value: 'How can I contact support?' },
  ];

  // ==========================================
  // LOAD CHAT HISTORY WHEN USER CHANGES
  // ==========================================
  useEffect(() => {
    console.log('[FRONTEND] User state:', user ? `Logged in (${user.id})` : 'Guest');
    loadChatHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Auto-scroll
  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  // Auto-focus
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
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

  /**
   * Load chat history based on authentication status
   * - Authenticated: Load from MongoDB database
   * - Guest: Load from browser localStorage
   */
  const loadChatHistory = async () => {
    if (isInitialLoadRef.current) {
      console.log('[FRONTEND] Already loaded, skipping duplicate load');
      return;
    }

    setIsLoadingHistory(true);
    console.log('[FRONTEND] 🔄 Loading chat history...');
    
    try {
      if (user) {
        // ========== AUTHENTICATED USER ==========
        console.log('[FRONTEND] 🔐 User is authenticated, fetching from database...');
        
        const res = await axios.get('/api/chatbot/history', { 
          withCredentials: true 
        });
        
        const loadedMessages = res.data.messages || [];
        setMessages(loadedMessages);
        isInitialLoadRef.current = true;
        
        console.log(`[FRONTEND] ✅ Loaded ${loadedMessages.length} messages from database`);
        
        // Clear guest data if any
        localStorage.removeItem(GUEST_STORAGE_KEY);
        
        if (loadedMessages.length > 0) {
          setSnackbar({
            open: true,
            message: `Welcome back! Loaded ${loadedMessages.length} messages from your history.`,
            severity: 'success'
          });
        }
      } else {
        // ========== GUEST USER ==========
        console.log('[FRONTEND] 👤 Guest mode, loading from localStorage...');
        
        const guestMessages = localStorage.getItem(GUEST_STORAGE_KEY);
        if (guestMessages) {
          try {
            const parsed = JSON.parse(guestMessages);
            setMessages(parsed);
            isInitialLoadRef.current = true;
            console.log(`[FRONTEND] ✅ Loaded ${parsed.length} messages from localStorage`);
          } catch (e) {
            console.error('[FRONTEND] ❌ Error parsing localStorage:', e);
            localStorage.removeItem(GUEST_STORAGE_KEY);
            setMessages([]);
          }
        } else {
          console.log('[FRONTEND] 📭 No guest messages found');
          setMessages([]);
          isInitialLoadRef.current = true;
        }
      }
    } catch (err) {
      console.error('[FRONTEND] ❌ Error loading history:', err);
      
      // Fallback for guests
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
          message: 'Failed to load chat history. Please refresh.',
          severity: 'error'
        });
      }
      
      isInitialLoadRef.current = true;
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  const toggleDrawer = () => {
    setOpen((v) => !v);
    if (!open) setUnreadCount(0);
  };

  /**
   * Send message to chatbot
   * - For authenticated users: Backend fetches history from DB automatically
   * - For guests: Send full context from localStorage
   */
  const handleSendMessage = async (messageText = input) => {
    const text = messageText.trim();
    if (!text || typing) return;

    const userMsg = { 
      sender: 'user', 
      text, 
      timestamp: new Date().toISOString() 
    };

    console.log('\n========================================');
    console.log('[FRONTEND] 📤 Sending message:', text.substring(0, 50) + '...');
    console.log('[FRONTEND] User status:', user ? `Logged in (${user.id})` : 'Guest');

    // Update UI optimistically
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    
    // Save guest messages to localStorage immediately
    if (!user) {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updatedMessages));
      console.log('[FRONTEND] 💾 Saved guest message to localStorage');
    }

    setInput('');
    setTyping(true);

    try {
      const payload = {
        message: text,
        // IMPORTANT: Only send context for GUEST users
        // Authenticated users have their context fetched from DB automatically
        context: !user ? updatedMessages : undefined
      };

      console.log(`[FRONTEND] 📡 Sending to backend... Context size: ${user ? 'DB will provide' : updatedMessages.length}`);

      const res = await axios.post('/api/chatbot', payload, { 
        withCredentials: true 
      });
      
      const botMsg = { 
        sender: 'bot', 
        text: res.data.message, 
        timestamp: new Date().toISOString() 
      };

      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);

      console.log(`[FRONTEND] ✅ Received response`);
      console.log(`[FRONTEND] Total messages now: ${finalMessages.length}`);

      // Save guest messages
      if (!user) {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(finalMessages));
        console.log('[FRONTEND] 💾 Saved bot response to localStorage');
      } else {
        console.log('[FRONTEND] ✅ Message saved to database by backend');
      }

      console.log('========================================\n');

    } catch (err) {
      console.error('[FRONTEND] ❌ Error sending message:', err);
      
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
        message: 'Failed to send message. Please try again.', 
        severity: 'error' 
      });
      
      console.log('========================================\n');
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

  const handleQuickAction = (action) => {
    setInput(action.value);
    handleSendMessage(action.value);
  };

  /**
   * Clear chat history
   */
  const clearHistory = async () => {
    console.log('[FRONTEND] 🗑️ Clearing chat history...');
    
    try {
      if (user) {
        // Authenticated: Delete from database
        await axios.delete('/api/chatbot/history', { withCredentials: true });
        console.log('[FRONTEND] ✅ Deleted from database');
        setSnackbar({ 
          open: true, 
          message: 'Chat history cleared from database', 
          severity: 'success' 
        });
      } else {
        // Guest: Clear localStorage
        localStorage.removeItem(GUEST_STORAGE_KEY);
        console.log('[FRONTEND] ✅ Cleared from localStorage');
        setSnackbar({ 
          open: true, 
          message: 'Chat cleared', 
          severity: 'success' 
        });
      }
      
      setMessages([]);
      isInitialLoadRef.current = false;
    } catch (err) {
      console.error('[FRONTEND] ❌ Error clearing:', err);
      setSnackbar({ 
        open: true, 
        message: 'Failed to clear chat', 
        severity: 'error' 
      });
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!open && (
        <Fade in={!open} timeout={300}>
          <Tooltip title="Chat with us" placement="left">
            <Badge
              badgeContent={unreadCount}
              color="error"
              overlap="circular"
              sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300 }}
            >
              <IconButton
                onClick={toggleDrawer}
                sx={{
                  width: 64,
                  height: 64,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                    transform: 'scale(1.1)',
                    boxShadow: '0 6px 25px rgba(0,0,0,0.2)',
                  },
                }}
              >
                <ChatIcon sx={{ fontSize: 32 }} />
              </IconButton>
            </Badge>
          </Tooltip>
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
            width: { xs: '100%', sm: '100%', md: '50%', lg: '40%', xl: '35%' },
            height: '100vh',
            maxHeight: '100vh',
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
          },
        }}
        sx={{ zIndex: 1400 }}
      >
        {/* Header */}
        <AppBar
          position="static"
          elevation={0}
          sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                alt="Help Assistant Bot"
                src="/icon_chatbot.png"
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <BotIcon sx={{ color: 'white', fontSize: 24 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                  Help Assistant
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#4ade80',
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.5 },
                      },
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    {user ? `💾 ${messages.length} saved in DB` : `💬 Guest (${messages.length})`}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Clear chat">
                <IconButton onClick={clearHistory} size="small" sx={{ color: 'white' }}>
                  <ClearAllIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Close">
                <IconButton onClick={toggleDrawer} size="small" sx={{ color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Messages Container */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            bgcolor: '#f5f7fa',
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.03), transparent 50%), radial-gradient(circle at 80% 80%, rgba(120, 119, 198, 0.03), transparent 50%)',
            p: 2,
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '3px' },
          }}
        >
          {isLoadingHistory ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                {user ? 'Loading your conversation from database...' : 'Loading...'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {/* Welcome Message */}
              {messages.length === 0 && !typing && (
                <Fade in timeout={800}>
                  <Box sx={{ textAlign: 'center', mt: 4, mb: 3 }}>
                    <Avatar
                      alt="Help Assistant Bot"
                      src="/icon_chatbot.png"
                      sx={{
                        width: 80,
                        height: 80,
                        margin: '0 auto 16px',
                        boxShadow: '0 4px 20px rgba(102,126,234,0.3)',
                      }}
                    >
                      <BotIcon sx={{ fontSize: 48 }} />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                      Welcome to Help Platform! 👋
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, px: 2 }}>
                      {user 
                        ? '✅ Logged in! Your messages are saved in database permanently.' 
                        : '👤 Guest mode: Messages saved in browser (not synced across devices).'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, px: 2 }}>
                      I remember everything we discuss. Ask me anything!
                    </Typography>

                    <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" sx={{ gap: 1 }}>
                      {quickActions.map((action, idx) => (
                        <Chip
                          key={idx}
                          label={action.label}
                          onClick={() => handleQuickAction(action)}
                          sx={{
                            bgcolor: 'white',
                            border: '1px solid',
                            borderColor: 'primary.main',
                            color: 'primary.main',
                            fontWeight: 500,
                            '&:hover': { bgcolor: 'primary.main', color: 'white' },
                            transition: 'all 0.3s ease',
                          }}
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
                    <Avatar
                      sx={{
                        bgcolor: msg.sender === 'user' ? 'primary.main' : 'grey.300',
                        width: 36,
                        height: 36,
                        mx: 1,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                    >
                      {msg.sender === 'user' ? <UserIcon sx={{ fontSize: 20 }} /> : <BotIcon sx={{ fontSize: 20 }} />}
                    </Avatar>

                    <Box sx={{ maxWidth: '75%' }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          bgcolor: msg.sender === 'user' ? 'primary.main' : 'white',
                          color: msg.sender === 'user' ? 'white' : 'text.primary',
                          borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                          border: msg.error ? '1px solid #ef4444' : 'none',
                          wordWrap: 'break-word',
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.95rem' }}>
                          {msg.text}
                        </Typography>
                      </Paper>
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
                    <Avatar sx={{ bgcolor: 'grey.300', width: 36, height: 36, mx: 1 }}>
                      <BotIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        bgcolor: 'white',
                        borderRadius: '18px 18px 18px 4px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                      }}
                    >
                      <Stack direction="row" spacing={0.5}>
                        {[0, 0.2, 0.4].map((delay, i) => (
                          <Box
                            key={i}
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'grey.400',
                              animation: 'bounce 1.4s infinite ease-in-out',
                              animationDelay: `${delay}s`,
                              '@keyframes bounce': {
                                '0%, 80%, 100%': { transform: 'scale(0)' },
                                '40%': { transform: 'scale(1)' },
                              },
                            }}
                          />
                        ))}
                      </Stack>
                    </Paper>
                  </ListItem>
                </Fade>
              )}

              <div ref={messagesEndRef} />
            </List>
          )}
        </Box>

        {/* Input Area */}
        <Box
          sx={{
            p: 2,
            bgcolor: 'white',
            borderTop: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <TextField
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '24px',
                  bgcolor: '#f5f7fa',
                  '& fieldset': { borderColor: 'transparent' },
                  '&:hover fieldset': { borderColor: 'primary.main' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: '2px' },
                },
              }}
            />
            <IconButton
              onClick={handleSendMessage}
              disabled={!input.trim() || typing || isLoadingHistory}
              sx={{
                bgcolor: input.trim() && !typing && !isLoadingHistory ? 'primary.main' : 'grey.300',
                color: 'white',
                width: 48,
                height: 48,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: input.trim() && !typing && !isLoadingHistory ? 'primary.dark' : 'grey.400',
                  transform: input.trim() && !typing && !isLoadingHistory ? 'scale(1.1)' : 'none',
                },
                '&:disabled': { bgcolor: 'grey.300', color: 'grey.500' },
              }}
            >
              {typing ? <CircularProgress size={24} sx={{ color: 'white' }} /> : <SendIcon />}
            </IconButton>
          </Stack>

          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, color: 'text.secondary', opacity: 0.6 }}>
            {user 
              ? '💾 All messages auto-saved to database • Context-aware AI' 
              : '💬 Guest mode • Saved in browser only • Login to save permanently'}
          </Typography>
        </Box>
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
          sx={{ width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default Chatbot;
