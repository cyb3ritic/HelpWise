// src/pages/Conversations.jsx

import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Paper,
  Fade,
  Stack,
  Chip,
  InputBase,
  IconButton,
  Badge,
  useTheme,
  Alert,
  Tooltip,
  Snackbar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { styled, alpha, keyframes } from '@mui/material/styles';
import {
  Search as SearchIcon,
  Chat as ChatIcon,
  DoneAll as DoneAllIcon,
  Circle as CircleIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
} from '@mui/icons-material';

// --- Beautiful Animations ---

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(76, 175, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// --- Styled Components ---

const PageContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
  animation: `${fadeInUp} 0.6s ease-out`,
}));

const HeaderCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(30, 144, 255, 0.1) 0%, rgba(106, 90, 205, 0.1) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%)',
  backdropFilter: 'blur(20px)',
  boxShadow: theme.palette.mode === 'dark'
    ? '0 8px 32px rgba(0, 0, 0, 0.3)'
    : '0 8px 32px rgba(0, 0, 0, 0.08)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const SearchBar = styled(InputBase)(({ theme }) => ({
  flex: 1,
  backgroundColor: theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, 0.6)
    : alpha(theme.palette.primary.main, 0.04),
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1.5, 2.5),
  fontSize: '0.95rem',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s ease',
  '&:focus-within': {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.primary.main}`,
    boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
  },
}));

const ConversationCard = styled(ListItemButton)(({ theme, unread }) => ({
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(1.5),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, unread ? 0.9 : 0.6)
    : unread ? '#ffffff' : alpha('#ffffff', 0.7),
  border: `1px solid ${unread ? theme.palette.primary.main : alpha(theme.palette.divider, 0.1)}`,
  boxShadow: unread
    ? `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`
    : '0 2px 8px rgba(0, 0, 0, 0.04)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.paper, 1)
      : '#ffffff',
    transform: 'translateY(-4px) scale(1.01)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 12px 40px rgba(0, 0, 0, 0.4)'
      : '0 12px 40px rgba(0, 0, 0, 0.12)',
    border: `1px solid ${theme.palette.primary.main}`,
  },
}));

const OnlineAvatar = styled(Avatar)(({ theme, online }) => ({
  width: 56,
  height: 56,
  border: `3px solid ${online ? '#4caf50' : alpha(theme.palette.divider, 0.2)}`,
  boxShadow: online
    ? `0 0 0 4px ${alpha('#4caf50', 0.2)}`
    : '0 2px 8px rgba(0, 0, 0, 0.1)',
  animation: online ? `${pulse} 2s infinite` : 'none',
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
}));

const EmptyStateContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  textAlign: 'center',
  borderRadius: theme.spacing(3),
  background: theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, 0.4)
    : alpha('#ffffff', 0.6),
  backdropFilter: 'blur(20px)',
  border: `1px dashed ${alpha(theme.palette.divider, 0.2)}`,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
}));

const StatsChip = styled(Chip)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '0.75rem',
  height: 28,
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.primary.contrastText,
  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  width: 48,
  height: 48,
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.primary.contrastText,
  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
    transform: 'scale(1.1)',
    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.6)}`,
  },
  '&:active': {
    transform: 'scale(0.95)',
  },
}));

const LoadingSkeleton = styled(Box)(({ theme }) => ({
  height: 80,
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(1.5),
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(90deg, 
        ${alpha(theme.palette.background.paper, 0.3)} 0%, 
        ${alpha(theme.palette.background.paper, 0.5)} 50%, 
        ${alpha(theme.palette.background.paper, 0.3)} 100%)`
    : `linear-gradient(90deg, 
        ${alpha('#f0f0f0', 0.5)} 0%, 
        ${alpha('#f8f8f8', 0.8)} 50%, 
        ${alpha('#f0f0f0', 0.5)} 100%)`,
  backgroundSize: '1000px 100%',
  animation: `${shimmer} 2s infinite`,
}));

function Conversations() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);
  const theme = useTheme();

  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchConversations = async () => {
    try {
      const res = await axios.get('/api/conversations/user/all', { withCredentials: true });
      setConversations(res.data);
      setFilteredConversations(res.data);
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.response?.data?.msg || 'Failed to load conversations.');
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Search filter
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter((conv) => {
        const otherParticipant = conv.participants.find((p) => p._id !== user._id);
        const fullName = `${otherParticipant?.firstName} ${otherParticipant?.lastName}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
      });
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations, user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setSnackbar({
      open: true,
      message: 'Conversations refreshed!',
      severity: 'success',
    });
  };

  const handleNewMessage = () => {
    navigate('/all-requests');
  };

  if (authLoading || loading) {
    return (
      <PageContainer maxWidth="md">
        <HeaderCard elevation={0}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Messages
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Loading your conversations...
              </Typography>
            </Box>
          </Stack>
        </HeaderCard>
        <Stack spacing={1.5}>
          {[1, 2, 3, 4, 5].map((i) => (
            <LoadingSkeleton key={i} />
          ))}
        </Stack>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer maxWidth="md">
        <Fade in>
          <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
            {error}
          </Alert>
        </Fade>
      </PageContainer>
    );
  }

  const unreadCount = conversations.filter((conv) => conv.unreadCount > 0).length;

  return (
    <PageContainer maxWidth="md">
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Fade in timeout={500}>
        <HeaderCard elevation={0}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography 
                variant="h4" 
                fontWeight={800}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Messages
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            {unreadCount > 0 && (
              <StatsChip
                icon={<CircleIcon sx={{ fontSize: 12 }} />}
                label={`${unreadCount} unread`}
              />
            )}
          </Stack>

          {/* Search Bar with Action Buttons */}
          <Box display="flex" alignItems="center" gap={1}>
            <SearchBar
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={
                <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
              }
            />
            
            {/* Refresh Button */}
            <Tooltip title="Refresh conversations" arrow>
              <ActionButton 
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{
                  '&:hover': {
                    transform: refreshing ? 'none' : 'scale(1.1) rotate(180deg)',
                  },
                }}
              >
                {refreshing ? (
                  <CircularProgress size={24} sx={{ color: 'inherit' }} />
                ) : (
                  <RefreshIcon />
                )}
              </ActionButton>
            </Tooltip>

            {/* New Message Button */}
            <Tooltip title="Browse help requests" arrow>
              <ActionButton 
                onClick={handleNewMessage}
                sx={{
                  '&:hover': {
                    transform: 'scale(1.1) rotate(5deg)',
                  },
                }}
              >
                <AddIcon />
              </ActionButton>
            </Tooltip>
          </Box>
        </HeaderCard>
      </Fade>

      {filteredConversations.length === 0 ? (
        <Fade in timeout={700}>
          <EmptyStateContainer elevation={0}>
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <ChatIcon sx={{ fontSize: 60, color: theme.palette.primary.main, opacity: 0.7 }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={400} mx="auto" mb={3}>
              {searchQuery
                ? 'Try adjusting your search'
                : 'Start chatting by accepting bids or placing bids on help requests'}
            </Typography>
            {!searchQuery && (
              <ActionButton onClick={handleNewMessage} sx={{ mx: 'auto' }}>
                <AddIcon />
              </ActionButton>
            )}
          </EmptyStateContainer>
        </Fade>
      ) : (
        <List sx={{ width: '100%', padding: 0 }}>
          {filteredConversations.map((conversation, index) => {
            const otherParticipant = conversation.participants.find((p) => p._id !== user._id);
            const lastMsgText = conversation.lastMessage?.content || 'Start chatting';
            const lastMsgTime = conversation.updatedAt
              ? formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })
              : '';
            const isUnread = conversation.unreadCount > 0;
            const isOnline = Math.random() > 0.5; // Replace with actual online status

            return (
              <Fade in timeout={300 + index * 50} key={conversation._id}>
                <ConversationCard
                  onClick={() => navigate(`/conversations/${conversation._id}`)}
                  alignItems="flex-start"
                  unread={isUnread}
                >
                  <ListItemAvatar sx={{ minWidth: 72 }}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                      badgeContent={
                        isOnline && (
                          <Box
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              bgcolor: '#4caf50',
                              border: `2px solid ${theme.palette.background.paper}`,
                            }}
                          />
                        )
                      }
                    >
                      <OnlineAvatar
                        src={otherParticipant?.avatar}
                        online={isOnline}
                      >
                        {otherParticipant?.firstName?.charAt(0)}
                      </OnlineAvatar>
                    </Badge>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={isUnread ? 800 : 600}
                          sx={{
                            color: isUnread ? theme.palette.primary.main : 'text.primary',
                          }}
                        >
                          {otherParticipant?.firstName} {otherParticipant?.lastName}
                        </Typography>
                        <Typography
                          variant="caption"
                          color={isUnread ? 'primary' : 'text.secondary'}
                          fontWeight={isUnread ? 700 : 500}
                          sx={{ whiteSpace: 'nowrap', ml: 1, fontSize: '0.7rem' }}
                        >
                          {lastMsgTime}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box display="flex" alignItems="center" gap={0.5}>
                        {conversation.lastMessage?.sender === user._id && (
                          <DoneAllIcon
                            sx={{
                              fontSize: 16,
                              color: '#4fc3f7',
                            }}
                          />
                        )}
                        <Typography
                          variant="body2"
                          color={isUnread ? 'text.primary' : 'text.secondary'}
                          fontWeight={isUnread ? 600 : 400}
                          sx={{
                            display: '-webkit-box',
                            overflow: 'hidden',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 1,
                          }}
                        >
                          {lastMsgText}
                        </Typography>
                        {isUnread && (
                          <Chip
                            label={conversation.unreadCount || 'New'}
                            size="small"
                            sx={{
                              ml: 'auto',
                              height: 22,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                              color: '#fff',
                            }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ConversationCard>
              </Fade>
            );
          })}
        </List>
      )}
    </PageContainer>
  );
}

export default Conversations;
