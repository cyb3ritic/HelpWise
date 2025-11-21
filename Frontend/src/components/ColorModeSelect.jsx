// src/components/ColorModeSelect.jsx
import React, { useContext } from 'react'
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { ColorModeContext } from '../context/ColorModeContext'

function ColorModeSelect(props) {
  const { mode, setMode } = useContext(ColorModeContext)

  const handleChange = (event) => {
    setMode(event.target.value)
  }

  return (
    <FormControl variant="outlined" size="small" {...props}>
      <InputLabel id="color-mode-select-label">Theme</InputLabel>
      <Select
        labelId="color-mode-select-label"
        id="color-mode-select"
        value={mode}
        onChange={handleChange}
        label="Theme"
      >
        <MenuItem value="light">Light</MenuItem>
        <MenuItem value="dark">Dark</MenuItem>
      </Select>
    </FormControl>
  )
}

export default ColorModeSelect
