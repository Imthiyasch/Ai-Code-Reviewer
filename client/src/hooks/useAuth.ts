import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export function useAuth() {
  const { user, token, setAuth, logout: storeLogout, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  const loginWithCredential = async (credential: string) => {
    try {
      const res = await api.post('/auth/google', { credential });
      setAuth(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login hook failed:', err);
      throw err;
    }
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    storeLogout();
    navigate('/login');
  };

  return { user, token, isLoggedIn: !!token, loginWithCredential, logout, isAdmin };
}
