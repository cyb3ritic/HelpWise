// src/utils/PrivateRoute.jsx
import React, { useContext } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

function PrivateRoute() {
  const { user, loading } = useContext(AuthContext)

  if (loading) {
    // Optionally render a loading indicator
    return null
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export default PrivateRoute
