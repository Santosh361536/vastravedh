import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; // or show a spinner
  return user ? children : <Navigate to="/signin" replace />;
}
