// src/components/Chatbot.jsx

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  IconButton, 
  Drawer, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Typography, 
  Divider, 
  Snackbar, 
  Alert 
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import BotIcon from '@mui/icons-material/SmartToy';
import UserIcon from '@mui/icons-material/Person';
import axios from 'axios'; // Use centralized Axios instance

function Chatbot() {
  const [open, setOpen] = useState(false); // Drawer open state
  const [messages, setMessages] = useState([]); // Chat messages
  const [input, setInput] = useState(''); // User input
  const [typing, setTyping] = useState(false); // Typing indicator
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' }); // Snackbar for errors
  const messagesEndRef = useRef(null); // Reference to scroll to bottom

  // Load conversation history from local storage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save messages to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  // Scroll to the bottom of the chat
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Toggle Drawer
  const toggleDrawer = () => {
    setOpen(!open);
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage = { sender: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);

    setTyping(true); // Show typing indicator

    try {
      const res = await axios.post('/api/chatbot', { message: input.trim() });
      const botMessage = { sender: 'bot', text: res.data.message };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Error sending message to chatbot:', err);
      const errorMessage = 'Sorry, something went wrong. Please try again later.';
      setMessages(prev => [...prev, { sender: 'bot', text: errorMessage }]);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }

    setTyping(false); // Hide typing indicator
    setInput('');
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <IconButton 
        onClick={toggleDrawer} 
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16, 
          backgroundColor: 'primary.main', 
          color: 'white', 
          '&:hover': { backgroundColor: 'primary.dark' },
          zIndex: 1000,
        }}
        aria-label="Open chat"
      >
        <ChatIcon />
      </IconButton>

      {/* Chat Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={toggleDrawer}
        PaperProps={{
          sx: { 
            width: { xs: '100%', sm: 400 }, // Full width on mobile, 400px on desktop
            p: 2,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Help Platform Chatbot
          </Typography>
          <Divider />
          {/* Messages List */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto', mt: 2 }}>
            <List>
              {messages.map((msg, index) => (
                <ListItem 
                  key={index} 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: msg.sender === 'bot' ? 'row' : 'row-reverse',
                    mb: 1,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar>
                      {msg.sender === 'bot' ? <BotIcon /> : <UserIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={msg.text} 
                    sx={{ 
                      textAlign: msg.sender === 'bot' ? 'left' : 'right',
                      backgroundColor: msg.sender === 'bot' ? 'grey.200' : 'primary.light',
                      borderRadius: 2,
                      p: 1,
                      maxWidth: '70%',
                    }} 
                  />
                </ListItem>
              ))}
              {typing && (
                <ListItem sx={{ display: 'flex', flexDirection: 'row' }}>
                  <ListItemAvatar>
                    <Avatar>
                      <BotIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Bot is typing..."
                    sx={{ 
                      textAlign: 'left',
                      color: 'grey.500',
                      fontStyle: 'italic',
                    }}
                  />
                </ListItem>
              )}
              <div ref={messagesEndRef} />
            </List>
          </Box>
          {/* Input Field */}
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Type your message..."
              variant="outlined"
              fullWidth
              multiline
              maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button 
              variant="contained" 
              endIcon={<SendIcon />} 
              onClick={handleSendMessage}
              sx={{ mt: 1, float: 'right' }}
            >
              Send
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Snackbar for Errors */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default Chatbot;
