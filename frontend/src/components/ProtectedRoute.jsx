import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Guards a route so it's only reachable by an authenticated user,
// and optionally only by a specific role (e.g. 'admin').
const ProtectedRoute = ({ children, requireRole }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (requireRole && user.role !== requireRole) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;
