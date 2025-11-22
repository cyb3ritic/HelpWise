// src/pages/Profile.jsx

import React, { useContext, useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Avatar,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Stack,
  Divider,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  LinearProgress,
  Alert,
  Snackbar,
  Tooltip,
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Edit,
  Email,
  Star,
  Build,
  Verified,
  AutoFixHigh,
  Twitter,
  GitHub,
  Close,
  CheckCircle,
  Language,
  LocationOn,
  Code,
  ForkRight,
  TrendingUp,
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import axios from 'axios';

// Animations
const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled Components
const EnhanceButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  fontWeight: 700,
  padding: '14px 40px',
  borderRadius: '12px',
  textTransform: 'none',
  fontSize: '1rem',
  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.35)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
    transform: 'translateY(-3px)',
    boxShadow: '0 12px 32px rgba(102, 126, 234, 0.5)',
  },
}));

const EnhanceCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)'
    : 'linear-gradient(135deg, rgba(102, 126, 234, 0.06) 0%, rgba(118, 75, 162, 0.06) 100%)',
  border: `2px solid ${alpha('#667eea', 0.15)}`,
  borderRadius: '20px',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  animation: `${fadeIn} 0.6s ease-out`,
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: '0 16px 48px rgba(102, 126, 234, 0.2)',
    border: `2px solid ${alpha('#667eea', 0.4)}`,
  },
}));

const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: '16px',
  background: theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, 0.6)
    : '#ffffff',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  animation: `${fadeIn} 0.5s ease-out`,
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 16px 40px rgba(0, 0, 0, 0.4)'
      : '0 16px 40px rgba(102, 126, 234, 0.15)',
    border: `1px solid ${theme.palette.primary.main}`,
  },
}));

const RepoCard = styled(Card)(({ theme }) => ({
  height: '100%',
  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  borderRadius: '16px',
  background: theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, 0.5)
    : '#ffffff',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 32px rgba(102, 126, 234, 0.12)',
  },
}));

function Profile() {
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  // Enhancement Dialog State
  const [enhanceDialogOpen, setEnhanceDialogOpen] = useState(false);
  const [twitterUsername, setTwitterUsername] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceProgress, setEnhanceProgress] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName?.charAt(0).toUpperCase() || '';
    const lastInitial = lastName?.charAt(0).toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  };

  // Get profile picture URL with fallback logic
  const getProfilePictureUrl = () => {
    // Priority 1: Saved profile picture from database
    if (user.profilePicture) {
      return user.profilePicture;
    }
    
    // Priority 2: GitHub avatar from enhanced profile
    if (user.enhancedProfile?.github?.avatarUrl) {
      return user.enhancedProfile.github.avatarUrl;
    }
    
    // Priority 3: Twitter profile image from enhanced profile
    if (user.enhancedProfile?.twitter?.profileImageUrl) {
      return user.enhancedProfile.twitter.profileImageUrl.replace('_normal', '_400x400');
    }
    
    // Priority 4: UI Avatars - Generated from name (fallback)
    const firstName = encodeURIComponent(user.firstName || '');
    const lastName = encodeURIComponent(user.lastName || '');
    return `https://ui-avatars.com/api/?name=${firstName}+${lastName}&size=400&background=667eea&color=ffffff&bold=true&font-size=0.4`;
  };

  const stats = [
    { 
      label: 'Credibility Points', 
      value: user.credibilityPoints || 0, 
      icon: <Star sx={{ fontSize: 32 }} />,
      color: '#f59e0b',
    },
    { 
      label: 'GitHub Repositories', 
      value: user.enhancedProfile?.github?.publicRepos || 0, 
      icon: <GitHub sx={{ fontSize: 32 }} />,
      color: '#6366f1',
    },
    { 
      label: user.enhancedProfile?.twitter ? 'Twitter Followers' : 'GitHub Followers',
      value: user.enhancedProfile?.twitter?.followersCount || user.enhancedProfile?.github?.followers || 0, 
      icon: user.enhancedProfile?.twitter ? <Twitter sx={{ fontSize: 32 }} /> : <TrendingUp sx={{ fontSize: 32 }} />,
      color: user.enhancedProfile?.twitter ? '#1DA1F2' : '#10b981',
    },
  ];

  // Handle Profile Enhancement
  const handleEnhanceProfile = async () => {
    if (!twitterUsername && !githubUrl) {
      setSnackbar({
        open: true,
        message: '⚠️ Please provide at least one profile URL',
        severity: 'warning',
      });
      return;
    }

    setEnhancing(true);
    setEnhanceProgress(10);

    try {
      const response = await axios.post(
        '/api/users/enhance-profile',
        {
          twitterUsername: twitterUsername.trim(),
          githubUrl: githubUrl.trim(),
        },
        { withCredentials: true }
      );

      setEnhanceProgress(100);

      setTimeout(() => {
        setEnhancing(false);
        setEnhanceDialogOpen(false);
        setSnackbar({
          open: true,
          message: '✅ Profile enhanced successfully! Refreshing...',
          severity: 'success',
        });
        setTwitterUsername('');
        setGithubUrl('');
        setEnhanceProgress(0);
        
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Enhancement error:', error);
      setEnhancing(false);
      setEnhanceProgress(0);
      setSnackbar({
        open: true,
        message: error.response?.data?.msg || 'Failed to enhance profile. Please try again.',
        severity: 'error',
      });
    }
  };

  React.useEffect(() => {
    if (enhancing && enhanceProgress < 90) {
      const timer = setTimeout(() => {
        setEnhanceProgress((prev) => prev + 10);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [enhancing, enhanceProgress]);

  return (
    <Box sx={{ minHeight: '100vh', pb: 8 }}>
      {/* Professional Header Section */}
      <Box
        sx={{
          position: 'relative',
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.95
          )} 0%, ${alpha(theme.palette.secondary.main, 0.85)} 100%)`,
          color: 'white',
          py: { xs: 4, md: 8 },
          mb: 6,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 20% 50%, ${alpha('#fff', 0.1)} 0%, transparent 50%),
                         radial-gradient(circle at 80% 80%, ${alpha('#fff', 0.08)} 0%, transparent 50%)`,
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center">
            {/* Profile Picture with Real Image */}
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                src={getProfilePictureUrl()}
                alt={`${user.firstName} ${user.lastName}`}
                sx={{
                  width: { xs: 100, md: 120 },
                  height: { xs: 100, md: 120 },
                  fontSize: '3rem',
                  bgcolor: alpha(theme.palette.common.white, 0.15),
                  border: `4px solid ${alpha(theme.palette.common.white, 0.3)}`,
                  fontWeight: 'bold',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  '& img': {
                    objectFit: 'cover',
                  },
                }}
              >
                {getInitials(user.firstName, user.lastName)}
              </Avatar>
              
              {/* Source Badge (Optional) */}
              {user.profilePictureSource && (
                <Tooltip title={`Image from ${user.profilePictureSource}`} arrow>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'background.paper',
                      boxShadow: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${alpha('#fff', 0.5)}`,
                    }}
                  >
                    {user.profilePictureSource === 'github' && <GitHub fontSize="small" sx={{ color: '#333' }} />}
                    {user.profilePictureSource === 'twitter' && <Twitter fontSize="small" sx={{ color: '#1DA1F2' }} />}
                  </Box>
                </Tooltip>
              )}
            </Box>

            <Box flexGrow={1}>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5} flexWrap="wrap">
                <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                  {user.firstName} {user.lastName}
                </Typography>
                {user.isVerified && (
                  <Tooltip title="Verified Account" arrow>
                    <Verified sx={{ fontSize: 36, color: '#10b981' }} />
                  </Tooltip>
                )}
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <Email sx={{ fontSize: 20, opacity: 0.9 }} />
                <Typography variant="body1" sx={{ opacity: 0.95, fontWeight: 500 }}>
                  {user.email}
                </Typography>
              </Stack>

              {user.bio && (
                <Typography 
                  variant="body1" 
                  sx={{ 
                    opacity: 0.9, 
                    maxWidth: 700, 
                    lineHeight: 1.7,
                    mb: 2,
                  }}
                >
                  {user.bio}
                </Typography>
              )}

              <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1}>
                {user.location && (
                  <Chip
                    icon={<LocationOn />}
                    label={user.location}
                    sx={{ 
                      bgcolor: alpha('#fff', 0.25), 
                      color: 'white',
                      fontWeight: 600,
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                )}
                {user.twitterUsername && (
                  <Chip
                    icon={<Twitter />}
                    label={`@${user.twitterUsername}`}
                    component="a"
                    href={`https://twitter.com/${user.twitterUsername}`}
                    target="_blank"
                    clickable
                    sx={{ 
                      bgcolor: alpha('#1DA1F2', 0.25), 
                      color: 'white',
                      fontWeight: 600,
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        bgcolor: alpha('#1DA1F2', 0.35),
                      }
                    }}
                  />
                )}
                {user.githubUrl && (
                  <Chip
                    icon={<GitHub />}
                    label="GitHub Profile"
                    component="a"
                    href={user.githubUrl}
                    target="_blank"
                    clickable
                    sx={{ 
                      bgcolor: alpha('#fff', 0.25), 
                      color: 'white',
                      fontWeight: 600,
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        bgcolor: alpha('#fff', 0.35),
                      }
                    }}
                  />
                )}
                {user.website && (
                  <Chip
                    icon={<Language />}
                    label="Website"
                    component="a"
                    href={user.website}
                    target="_blank"
                    clickable
                    sx={{ 
                      bgcolor: alpha('#fff', 0.25), 
                      color: 'white',
                      fontWeight: 600,
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        bgcolor: alpha('#fff', 0.35),
                      }
                    }}
                  />
                )}
              </Stack>
            </Box>

            <Button
              component={Link}
              to="/edit-profile"
              variant="outlined"
              startIcon={<Edit />}
              sx={{
                color: 'white',
                borderColor: alpha('#fff', 0.5),
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                py: 1.5,
                borderRadius: 3,
                borderWidth: 2,
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  borderColor: '#fff',
                  bgcolor: alpha('#fff', 0.15),
                  borderWidth: 2,
                },
              }}
            >
              Edit Profile
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {/* AI Enhancement Banner */}
          <Grid item xs={12}>
            <EnhanceCard elevation={0}>
              <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md="auto">
                    <Box
                      sx={{
                        width: 90,
                        height: 90,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                        animation: `${pulse} 2.5s infinite ease-in-out`,
                        mx: { xs: 'auto', md: 0 },
                      }}
                    >
                      <AutoFixHigh sx={{ fontSize: 44, color: 'white' }} />
                    </Box>
                  </Grid>

                  <Grid item xs={12} md>
                    <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.5px' }}>
                      AI-Powered Profile Enhancement
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8, mb: 0 }}>
                      Automatically import your professional data from Twitter and GitHub. 
                      Our AI extracts skills, projects, profile picture, and creates a comprehensive profile instantly.
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md="auto">
                    <EnhanceButton
                      fullWidth={theme.breakpoints.down('md')}
                      startIcon={<AutoFixHigh />}
                      onClick={() => setEnhanceDialogOpen(true)}
                    >
                      Enhance Profile
                    </EnhanceButton>
                  </Grid>
                </Grid>
              </CardContent>
            </EnhanceCard>
          </Grid>

          {/* Stats Cards */}
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <StatsCard elevation={0}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(stat.color, 0.1),
                      borderRadius: '50%',
                      width: 72,
                      height: 72,
                      mb: 2.5,
                      color: stat.color,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Typography variant="h3" fontWeight={800} gutterBottom sx={{ letterSpacing: '-1px' }}>
                    {stat.value.toLocaleString()}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" fontWeight={600}>
                    {stat.label}
                  </Typography>
                </CardContent>
              </StatsCard>
            </Grid>
          ))}

          {/* Profile Information */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 3,
                animation: `${fadeIn} 0.6s ease-out`,
              }}
            >
              <Typography variant="h5" fontWeight={800} gutterBottom>
                Profile Information
              </Typography>
              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                    FIRST NAME
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>
                    {user.firstName}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                    LAST NAME
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>
                    {user.lastName}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                    EMAIL ADDRESS
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                    <Typography variant="body1" fontWeight={600}>
                      {user.email}
                    </Typography>
                    {user.isVerified && (
                      <Chip label="Verified" color="success" size="small" sx={{ fontWeight: 700 }} />
                    )}
                  </Stack>
                </Grid>

                {user.enhancedProfile?.github?.languages && user.enhancedProfile.github.languages.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5} mb={1.5}>
                      PROGRAMMING LANGUAGES
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1, gap: 1 }}>
                      {user.enhancedProfile.github.languages.slice(0, 10).map((lang) => (
                        <Chip 
                          key={lang} 
                          label={lang} 
                          icon={<Code />}
                          sx={{ 
                            fontWeight: 600,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                          }} 
                        />
                      ))}
                    </Stack>
                  </Grid>
                )}

                {user.enhancedProfile?.twitter && !user.enhancedProfile.twitter.error && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                      TWITTER BIO
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.7 }}>
                      {user.enhancedProfile.twitter.description || 'No bio available'}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>

          {/* Expertise Section */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 3,
                height: '100%',
                animation: `${fadeIn} 0.7s ease-out`,
              }}
            >
              <Typography variant="h6" fontWeight={800} gutterBottom>
                Areas of Expertise
              </Typography>
              <Divider sx={{ mb: 2.5 }} />

              {user.expertise && user.expertise.length > 0 ? (
                <Stack direction="row" flexWrap="wrap" gap={1.5}>
                  {user.expertise.map((exp) => (
                    <Chip
                      key={exp._id}
                      label={exp.name}
                      icon={<Build />}
                      sx={{
                        fontWeight: 600,
                        py: 2,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                        border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      }}
                    />
                  ))}
                </Stack>
              ) : (
                <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={500}>
                    No expertise added yet. Update your profile to showcase your skills.
                  </Typography>
                </Alert>
              )}
            </Paper>
          </Grid>

          {/* GitHub Repositories */}
          {user.enhancedProfile?.github?.repositories && user.enhancedProfile.github.repositories.length > 0 && (
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: 3,
                  animation: `${fadeIn} 0.8s ease-out`,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5" fontWeight={800}>
                    Top GitHub Repositories
                  </Typography>
                  <Chip 
                    icon={<GitHub />}
                    label={`${user.enhancedProfile.github.publicRepos} Total`}
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2.5}>
                  {user.enhancedProfile.github.repositories.slice(0, 6).map((repo) => (
                    <Grid item xs={12} sm={6} md={4} key={repo.name}>
                      <RepoCard 
                        elevation={0}
                        onClick={() => window.open(repo.url, '_blank')}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="start" mb={1.5}>
                            <Typography variant="h6" fontWeight={700} noWrap sx={{ flexGrow: 1, pr: 1 }}>
                              {repo.name}
                            </Typography>
                            <Chip 
                              label={`⭐ ${repo.stars}`} 
                              size="small"
                              sx={{ 
                                fontWeight: 700,
                                bgcolor: alpha('#f59e0b', 0.1),
                                color: '#f59e0b',
                              }}
                            />
                          </Stack>
                          
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 2, 
                              minHeight: 40,
                              lineHeight: 1.6,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {repo.description || 'No description available'}
                          </Typography>
                          
                          <Stack direction="row" spacing={1} alignItems="center">
                            {repo.language && (
                              <Chip 
                                label={repo.language} 
                                size="small"
                                icon={<Code />}
                                sx={{ 
                                  fontWeight: 600,
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                }}
                              />
                            )}
                            {repo.forks > 0 && (
                              <Chip 
                                label={`${repo.forks}`}
                                size="small"
                                icon={<ForkRight />}
                                sx={{ fontWeight: 600 }}
                              />
                            )}
                          </Stack>
                        </CardContent>
                      </RepoCard>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>

      {/* Enhancement Dialog */}
      <Dialog
        open={enhanceDialogOpen}
        onClose={() => !enhancing && setEnhanceDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.2)',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AutoFixHigh sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Typography variant="h5" fontWeight={800}>
              Enhance Your Profile
            </Typography>
          </Stack>
          <IconButton onClick={() => !enhancing && setEnhanceDialogOpen(false)} disabled={enhancing}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2, pb: 3 }}>
          {enhancing ? (
            <Box sx={{ py: 5 }}>
              <Stack spacing={4} alignItems="center">
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: `${pulse} 1.5s infinite ease-in-out`,
                    boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
                  }}
                >
                  <AutoFixHigh sx={{ fontSize: 56, color: 'white' }} />
                </Box>

                <Typography variant="h5" fontWeight={700} textAlign="center">
                  Enhancing Your Profile...
                </Typography>

                <Box sx={{ width: '100%' }}>
                  <LinearProgress
                    variant="determinate"
                    value={enhanceProgress}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      bgcolor: alpha('#667eea', 0.15),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 6,
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                      },
                    }}
                  />
                  <Typography variant="h6" color="text.secondary" textAlign="center" mt={2} fontWeight={700}>
                    {enhanceProgress}%
                  </Typography>
                </Box>

                <Stack spacing={2} sx={{ width: '100%' }}>
                  {enhanceProgress >= 20 && (
                    <Stack direction="row" spacing={2} alignItems="center">
                      <CheckCircle sx={{ color: 'success.main', fontSize: 24 }} />
                      <Typography variant="body1" fontWeight={600}>Connecting to APIs...</Typography>
                    </Stack>
                  )}
                  {enhanceProgress >= 50 && (
                    <Stack direction="row" spacing={2} alignItems="center">
                      <CheckCircle sx={{ color: 'success.main', fontSize: 24 }} />
                      <Typography variant="body1" fontWeight={600}>Extracting profile data...</Typography>
                    </Stack>
                  )}
                  {enhanceProgress >= 80 && (
                    <Stack direction="row" spacing={2} alignItems="center">
                      <CheckCircle sx={{ color: 'success.main', fontSize: 24 }} />
                      <Typography variant="body1" fontWeight={600}>Updating your profile...</Typography>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </Box>
          ) : (
            <Stack spacing={3}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={600}>
                  Import your professional data from Twitter or GitHub to automatically enhance your profile.
                </Typography>
              </Alert>

              <TextField
                fullWidth
                label="Twitter Username (Optional)"
                placeholder="@username or username"
                value={twitterUsername}
                onChange={(e) => setTwitterUsername(e.target.value)}
                InputProps={{
                  startAdornment: <Twitter sx={{ mr: 1.5, color: '#1DA1F2', fontSize: 24 }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              <TextField
                fullWidth
                label="GitHub Profile URL (Recommended)"
                placeholder="https://github.com/your-username"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                InputProps={{
                  startAdornment: <GitHub sx={{ mr: 1.5, fontSize: 24 }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button
            onClick={() => setEnhanceDialogOpen(false)}
            disabled={enhancing}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            Cancel
          </Button>
          <EnhanceButton
            onClick={handleEnhanceProfile}
            disabled={enhancing || (!twitterUsername && !githubUrl)}
            startIcon={enhancing ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <AutoFixHigh />}
          >
            {enhancing ? 'Enhancing...' : 'Start Enhancement'}
          </EnhanceButton>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Profile;
