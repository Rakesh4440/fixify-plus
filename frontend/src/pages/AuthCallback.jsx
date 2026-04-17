import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { saveSession } from '../services/session.js';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      saveSession(token);
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [navigate, params]);

  return <div className="dashboard-wrap">Signing you in…</div>;
}

