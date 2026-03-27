import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function DashboardEntry() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (user.role === 'admin') {
      navigate('/admin-dashboard', { replace: true });
    } else {
      navigate('/faculty-dashboard', { replace: true });
    }
  }, [user, navigate]);

  return null;
}
