// src/pages/Home.jsx
import React from 'react'
import { Typography, Container, Box } from '@mui/material'

function Home() {
  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Box 
        sx={{
          padding: 4,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Welcome to HelpWise
        </Typography>
        <Typography variant="body1" paragraph>
          HelpWise connects individuals seeking help with those willing to provide assistance. Whether you need a hand with a project, guidance on a topic, or any other form of support, HelpWise is here to bridge the gap.
        </Typography>
        {/* Add more content as needed */}
      </Box>
    </Container>
  )
}

export default Home
