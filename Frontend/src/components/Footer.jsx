// src/components/Footer.jsx
import React from 'react'
import { Typography, Box, Container } from '@mui/material'

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="sm">
        <Typography variant="body1" align="center">
          HelpWise © {new Date().getFullYear()}
        </Typography>
      </Container>
    </Box>
  )
}

export default Footer
