// src/utils/PrivateRoute.jsx
import React, { useContext } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

function PrivateRoute() {
  const { user, loading } = useContext(AuthContext)
  const location = useLocation()

  if (loading) {
    // Optionally render a loading indicator
    return null
  }

  return user ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />
}

export default PrivateRoute
