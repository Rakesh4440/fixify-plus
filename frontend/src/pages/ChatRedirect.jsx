import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function ChatRedirect() {
  const navigate = useNavigate();
  const { senderId } = useParams();

  useEffect(() => {
    navigate(`/dashboard?tab=messages${senderId ? `&sender=${senderId}` : ''}`, { replace: true });
  }, [navigate, senderId]);

  return <div className="dashboard-wrap">Opening chat…</div>;
}
