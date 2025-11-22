// src/pages/Home.jsx

import React, { useContext, useState, useEffect } from 'react';
import {
  Typography,
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  Avatar,
  Chip,
  Paper,
  useTheme,
  alpha,
  Divider,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  Handshake,
  RequestQuote,
  Forum,
  Verified,
  Speed,
  Security,
  TrendingUp,
  People,
  Assignment,
  ArrowForward,
  EmojiEvents,
  CheckCircle,
  AttachMoney,
  AccessTime,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

function Home() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/stats/dashboard');
        setStats(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching stats:', err);
        // Fallback to default values if API fails
        setStats({
          activeUsers: 0,
          completedProjects: 0,
          averageRating: '0.0',
          supportAvailable: '24/7',
          averageResponseTime: 'N/A',
          satisfactionRate: '0%',
        });
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const features = [
    {
      icon: <RequestQuote sx={{ fontSize: 40 }} />,
      title: 'Post Requests',
      description:
        'Create detailed help requests with your requirements, budget, and timeline. Get multiple competitive bids from qualified helpers.',
    },
    {
      icon: <People sx={{ fontSize: 40 }} />,
      title: 'Find Helpers',
      description:
        'Browse through skilled individuals ready to assist. Review profiles, ratings, and past work to find the perfect match.',
    },
    {
      icon: <Forum sx={{ fontSize: 40 }} />,
      title: 'Real-time Chat',
      description:
        'Communicate directly with helpers through our integrated messaging system. Discuss details and clarify requirements instantly.',
    },
    {
      icon: <Verified sx={{ fontSize: 40 }} />,
      title: 'Secure Bidding',
      description:
        'Transparent bidding system ensures fair pricing. Review all bids, compare offers, and choose the best fit for your needs.',
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Safe & Secure',
      description:
        'Your data and transactions are protected. User verification and rating system ensure trustworthy interactions.',
    },
    {
      icon: <Speed sx={{ fontSize: 40 }} />,
      title: 'Quick Responses',
      description:
        'Get responses within hours. Our active community of helpers is ready to bid on your requests immediately.',
    },
  ];

  // Dynamic stats array using real data
  const statsData = stats ? [
    { 
      number: stats.activeUsers > 0 ? `${stats.activeUsers}+` : '0', 
      label: 'Active Users', 
      icon: <People /> 
    },
    { 
      number: stats.completedProjects > 0 ? `${stats.completedProjects}+` : '0', 
      label: 'Completed Projects', 
      icon: <CheckCircle /> 
    },
    { 
      number: `${stats.averageRating}/5`, 
      label: 'Average Rating', 
      icon: <EmojiEvents /> 
    },
    { 
      number: stats.supportAvailable, 
      label: 'Support Available', 
      icon: <AccessTime /> 
    },
  ] : [];

  const howItWorks = [
    {
      step: '1',
      title: 'Create Your Request',
      description:
        'Sign up and post your help request with detailed requirements, budget range, and preferred timeline.',
      icon: <Assignment />,
    },
    {
      step: '2',
      title: 'Review Bids',
      description:
        'Receive multiple bids from interested helpers. Compare their profiles, experience, and proposed rates.',
      icon: <TrendingUp />,
    },
    {
      step: '3',
      title: 'Connect & Collaborate',
      description:
        'Choose your helper and start working together. Use our chat system to stay connected throughout the process.',
      icon: <Handshake />,
    },
  ];

  const benefits = [
    'No upfront fees - Pay only when satisfied',
    'Verified helpers with ratings and reviews',
    'Secure payment processing',
    'Dedicated customer support',
    'Money-back guarantee',
    'Easy dispute resolution',
  ];

  // Stats skeleton loader component
  const StatsSkeleton = () => (
    <Grid container spacing={3} sx={{ mt: 4 }}>
      {[1, 2, 3, 4].map((index) => (
        <Grid item xs={6} md={3} key={index}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              textAlign: 'center',
              bgcolor: alpha(theme.palette.common.white, 0.15),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`,
              borderRadius: 3,
            }}
          >
            <Skeleton variant="circular" width={24} height={24} sx={{ mx: 'auto', mb: 1 }} />
            <Skeleton variant="text" width="60%" sx={{ mx: 'auto', mb: 1 }} />
            <Skeleton variant="text" width="80%" sx={{ mx: 'auto' }} />
          </Paper>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box>
      {/* Hero Section - Different for logged in/out users */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.9
          )} 0%, ${alpha(theme.palette.secondary.main, 0.8)} 100%)`,
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box textAlign="center" mb={4}>
            {user ? (
              <>
                <Typography
                  variant="h2"
                  component="h1"
                  gutterBottom
                  fontWeight="bold"
                  sx={{
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    mb: 2,
                    textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  }}
                >
                  Welcome Back, {user.firstName}! 👋
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 4,
                    opacity: 0.95,
                    maxWidth: '800px',
                    mx: 'auto',
                    fontSize: { xs: '1.1rem', md: '1.5rem' },
                    fontWeight: 400,
                  }}
                >
                  Ready to collaborate? Explore new requests or manage your existing projects.
                </Typography>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  justifyContent="center"
                >
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/my-requests')}
                    sx={{
                      bgcolor: 'white',
                      color: theme.palette.primary.main,
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.common.white, 0.95),
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Browse Requests
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/create-request')}
                    sx={{
                      borderColor: 'white',
                      borderWidth: 2,
                      color: 'white',
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: 'white',
                        borderWidth: 2,
                        bgcolor: alpha(theme.palette.common.white, 0.15),
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Post a Request
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/my-bids')}
                    sx={{
                      borderColor: 'white',
                      borderWidth: 2,
                      color: 'white',
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: 'white',
                        borderWidth: 2,
                        bgcolor: alpha(theme.palette.common.white, 0.15),
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    My Bids
                  </Button>
                </Stack>
              </>
            ) : (
              <>
                <Typography
                  variant="h2"
                  component="h1"
                  gutterBottom
                  fontWeight="bold"
                  sx={{
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    mb: 2,
                    textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  }}
                >
                  Welcome to HelpWise
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 4,
                    opacity: 0.95,
                    maxWidth: '800px',
                    mx: 'auto',
                    fontSize: { xs: '1.1rem', md: '1.5rem' },
                    fontWeight: 400,
                  }}
                >
                  Connecting people who need help with those who can provide it.
                  Your trusted platform for collaborative problem-solving.
                </Typography>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  justifyContent="center"
                >
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/register')}
                    sx={{
                      bgcolor: 'white',
                      color: theme.palette.primary.main,
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.common.white, 0.95),
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Get Started Free
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/login')}
                    sx={{
                      borderColor: 'white',
                      borderWidth: 2,
                      color: 'white',
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: 'white',
                        borderWidth: 2,
                        bgcolor: alpha(theme.palette.common.white, 0.15),
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Sign In
                  </Button>
                </Stack>
              </>
            )}
          </Box>

          {/* Stats Section with Real Data */}
          {loading ? (
            <StatsSkeleton />
          ) : (
            <Grid container spacing={3} sx={{ mt: 4 }}>
              {statsData.map((stat, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      bgcolor: alpha(theme.palette.common.white, 0.15),
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        bgcolor: alpha(theme.palette.common.white, 0.2),
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'inline-flex',
                        mb: 1,
                        color: 'white',
                        opacity: 0.9,
                      }}
                    >
                      {stat.icon}
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="white" gutterBottom>
                      {stat.number}
                    </Typography>
                    <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
                      {stat.label}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" mb={6}>
          <Chip label="FEATURES" color="primary" sx={{ mb: 2, fontWeight: 'bold', px: 2 }} />
          <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
            Why Choose HelpWise?
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: '700px', mx: 'auto', fontSize: '1.1rem' }}
          >
            Our platform is designed to make finding and offering help seamless, secure, and
            efficient for everyone involved.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  p: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[12],
                    borderColor: theme.palette.primary.main,
                    '& .feature-icon': {
                      transform: 'scale(1.1) rotate(5deg)',
                    },
                  },
                }}
              >
                <CardContent>
                  <Avatar
                    className="feature-icon"
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      width: 64,
                      height: 64,
                      mb: 2,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box
        sx={{
          bgcolor: alpha(
            theme.palette.primary.main,
            theme.palette.mode === 'dark' ? 0.08 : 0.03
          ),
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Chip label="HOW IT WORKS" color="primary" sx={{ mb: 2, fontWeight: 'bold', px: 2 }} />
            <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
              Get Started in 3 Simple Steps
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: '700px', mx: 'auto', fontSize: '1.1rem' }}
            >
              Our streamlined process makes it easy to get the help you need or offer your expertise
              to others.
            </Typography>
          </Box>

          <Grid container spacing={4} alignItems="stretch">
            {howItWorks.map((item, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    p: 3,
                    border: `2px solid ${alpha(theme.palette.divider, 0.5)}`,
                    borderRadius: 3,
                    position: 'relative',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.shadows[8],
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -24,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      boxShadow: theme.shadows[6],
                    }}
                  >
                    {item.step}
                  </Box>
                  <CardContent sx={{ pt: 4 }}>
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        width: 56,
                        height: 56,
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      {item.icon}
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {item.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Benefits Section with Real Platform Highlights */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Why Thousands Choose HelpWise
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.1rem' }}>
              Join a thriving community where expertise meets opportunity. Whether you're seeking
              help or offering your skills, HelpWise provides the perfect platform for meaningful
              collaborations.
            </Typography>
            <Stack spacing={2} sx={{ mt: 3 }}>
              {benefits.map((benefit, index) => (
                <Stack direction="row" spacing={2} alignItems="center" key={index}>
                  <CheckCircle sx={{ color: theme.palette.success.main, fontSize: 24 }} />
                  <Typography variant="body1" fontWeight="500">
                    {benefit}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            {loading ? (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  borderRadius: 3,
                }}
              >
                <Skeleton variant="text" width="60%" height={40} />
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={3}>
                  {[1, 2, 3, 4].map((i) => (
                    <Grid item xs={6} key={i}>
                      <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    theme.palette.mode === 'dark' ? 0.1 : 0.05
                  )} 0%, ${alpha(
                    theme.palette.secondary.main,
                    theme.palette.mode === 'dark' ? 0.1 : 0.05
                  )} 100%)`,
                }}
              >
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Platform Highlights
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                        borderRadius: 2,
                      }}
                    >
                      <AttachMoney
                        sx={{ fontSize: 32, color: theme.palette.success.main, mb: 1 }}
                      />
                      <Typography variant="h6" fontWeight="bold">
                        90%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Helper Earning Rate
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                        borderRadius: 2,
                      }}
                    >
                      <Speed sx={{ fontSize: 32, color: theme.palette.primary.main, mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        {stats?.averageResponseTime || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Avg Response Time
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                        borderRadius: 2,
                      }}
                    >
                      <Verified sx={{ fontSize: 32, color: theme.palette.info.main, mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        100%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Verified Users
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                        borderRadius: 2,
                      }}
                    >
                      <EmojiEvents sx={{ fontSize: 32, color: theme.palette.warning.main, mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        {stats?.satisfactionRate || '0%'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Satisfaction Rate
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* CTA Section - Only for non-logged in users */}
      {!user && (
        <Box sx={{ py: 8 }}>
          <Container maxWidth="md">
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, md: 6 },
                textAlign: 'center',
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  theme.palette.mode === 'dark' ? 0.2 : 0.1
                )} 0%, ${alpha(
                  theme.palette.secondary.main,
                  theme.palette.mode === 'dark' ? 0.2 : 0.1
                )} 100%)`,
                border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                borderRadius: 3,
              }}
            >
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Ready to Get Started?
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3, maxWidth: '600px', mx: 'auto', fontSize: '1.1rem', lineHeight: 1.7 }}
              >
                Join our growing community of helpers and seekers. Whether you need assistance or
                want to offer your skills, HelpWise is the platform for you.
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="center"
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  Sign Up Now
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Login
                </Button>
              </Stack>
            </Paper>
          </Container>
        </Box>
      )}
    </Box>
  );
}

export default Home;
