// src/components/Footer.jsx
import React from 'react'
import { Typography, Box, Container } from '@mui/material'

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.background.paper,
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          {'© '}
          {new Date().getFullYear()}
          {' HelpWise. All rights reserved.'}
        </Typography>
      </Container>
    </Box>
  )
}

export default Footer
