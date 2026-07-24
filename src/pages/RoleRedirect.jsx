import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Sends a logged-in user to their role's dashboard.
export default function RoleRedirect() {
  const { role, loading, session } = useAuth()
  if (loading) return <div className="page-loading">Loading...</div>
  if (!session) return <Navigate to="/login" replace />
  switch (role) {
    case 'admin':
      return <Navigate to="/admin" replace />
    case 'doctor':
      return <Navigate to="/doctor" replace />
    case 'receptionist':
      return <Navigate to="/receptionist" replace />
    case 'patient':
      return <Navigate to="/patient" replace />
    default:
      return <div className="page-loading">Setting up your account...</div>
  }
}
