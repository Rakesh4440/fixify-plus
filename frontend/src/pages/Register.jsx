import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';

export default function Register() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: ''
  });

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  function update(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  const mismatch = form.password && form.confirm && form.password !== form.confirm;

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');
    if (mismatch) {
      setMsg('Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      await api('/auth/register', {
        method: 'POST',
        body: { name: form.name, email: form.email, phone: form.phone, password: form.password }
      });
      setMsg('Registered! Redirecting to login…');
      setTimeout(() => nav('/login'), 800);
    } catch (e) {
      setMsg(e.message || 'Could not register');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div
        className="card"
        style={{
          maxWidth: 520,
          margin: '48px auto',
          padding: 28,
          textAlign: 'left'
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>
            Create your account ✨
          </div>
          <div className="muted" style={{ marginTop: 6 }}>
            Join Fixify+ to post community listings, recommend providers, and leave reviews.
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>Full name</label>
            <input
              className="input"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
            />
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>Email</label>
              <input
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>Phone</label>
              <input
                className="input"
                type="tel"
                placeholder="10-digit number"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                autoComplete="tel"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                placeholder="Create a password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                autoComplete="new-password"
                required
                style={{ paddingRight: 96 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="btn ghost"
                style={{ position: 'absolute', right: 6, top: 6, padding: '8px 10px', borderRadius: 10 }}
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>Confirm password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-type password"
                value={form.confirm}
                onChange={(e) => update('confirm', e.target.value)}
                autoComplete="new-password"
                required
                style={{ paddingRight: 96 }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="btn ghost"
                style={{ position: 'absolute', right: 6, top: 6, padding: '8px 10px', borderRadius: 10 }}
              >
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
            {mismatch && (
              <div style={{ marginTop: 6, color: '#b91c1c', fontWeight: 600, fontSize: 13 }}>
                Passwords do not match
              </div>
            )}
          </div>

          <button className="btn" type="submit" disabled={loading || mismatch}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          {msg && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                background: msg.startsWith('Registered') ? '#ecfdf5' : '#fef2f2',
                color: msg.startsWith('Registered') ? '#065f46' : '#b91c1c',
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
          <span className="muted">Already have an account?</span>
          <Link className="btn ghost" to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
