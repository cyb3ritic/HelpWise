// src/context/ColorModeContext.jsx
import React, { createContext, useState, useMemo, useEffect } from 'react'

export const ColorModeContext = createContext({
  mode: 'light', // default mode
  toggleColorMode: () => {},
  setMode: () => {},
})

export const ColorModeProvider = ({ children }) => {
  // Retrieve initial mode from localStorage or default to 'light'
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('preferred-theme')
    return savedMode ? savedMode : 'light'
  })

  // Update localStorage whenever mode changes
  useEffect(() => {
    localStorage.setItem('preferred-theme', mode)
  }, [mode])

  // Memoize the context value to optimize performance
  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'))
      },
      setMode, // Allows setting the mode directly if needed
    }),
    [mode],
  )

  return (
    <ColorModeContext.Provider value={colorMode}>
      {children}
    </ColorModeContext.Provider>
  )
}
