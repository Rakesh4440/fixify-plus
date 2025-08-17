import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      const data = await api('/auth/login', { method: 'POST', body: { email, password } });
      localStorage.setItem('token', data.token);
      setMsg('Logged in! Redirecting…');
      setTimeout(() => nav('/'), 600);
    } catch (e) {
      setMsg(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div
        className="card"
        style={{
          maxWidth: 460,
          margin: '48px auto',
          padding: 28,
          textAlign: 'left'
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>
            Welcome back 👋
          </div>
          <div className="muted" style={{ marginTop: 6 }}>
            Log in to post listings, leave reviews, and recommend providers.
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>Email</label>
            <input
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={show ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ paddingRight: 84 }}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="btn ghost"
                style={{
                  position: 'absolute',
                  right: 6,
                  top: 6,
                  padding: '8px 10px',
                  borderRadius: 10
                }}
              >
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          {msg && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                background: msg.startsWith('Logged in') ? '#ecfdf5' : '#fef2f2',
                color: msg.startsWith('Logged in') ? '#065f46' : '#b91c1c',
                fontWeight: 600
              }}
            >
              {msg}
            </div>
          )}
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span className="muted" style={{ fontSize: 12 }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <span className="muted">New here?</span>
          <Link className="btn ghost" to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
