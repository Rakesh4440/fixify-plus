import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Footer from './Footer.jsx';
import NotificationBell from './NotificationBell.jsx';
import { clearSession, getCurrentUser } from '../services/session.js';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [me, setMe] = useState(() => getCurrentUser());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    setMe(getCurrentUser());
  }, [location.pathname]);

  return (
    <div className="page-shell">
      <header className="navbar">
        <div className="brand">
          <Link to="/" className="logo-chip">F+</Link>
          <div>
            <div className="brand-title">Fixify+</div>
            <div className="brand-sub">Local Services, Rentals, Bookings & Chat</div>
          </div>
        </div>

        <nav className="nav-links">
          <Link to="/" className="link">Home</Link>
          <Link to="/post" className="link">Post Service</Link>
          <Link to="/dashboard" className="link">Dashboard</Link>
          {me?.role === 'admin' ? <Link to="/dashboard?tab=admin" className="link">Admin</Link> : null}
        </nav>

        <div className="nav-right">
          <button className="theme-btn" type="button" onClick={() => setTheme((value) => value === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
          <NotificationBell />

          {me ? (
            <>
              <div className="avatar">{me.role?.[0]?.toUpperCase() || 'U'}</div>
              <button
                className="logout"
                onClick={() => {
                  clearSession();
                  setMe(null);
                  navigate('/');
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="link">Login</Link>
              <Link to="/register" className="link">Register</Link>
            </>
          )}
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

