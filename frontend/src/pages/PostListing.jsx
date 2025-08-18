import { useState } from 'react';
import { generateDescription, hasAI } from '../services/ai.js';

/* Ensure a phone string starts with +91 (India) for storage/display */
function ensurePlus91(phone) {
  let s = String(phone || '').trim().replace(/\s+/g, '');
  if (!s) return '';
  if (s.startsWith('+91')) return s;
  const digits = s.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length >= 12) return '+' + digits; // e.g. 9198...
  if (digits.length === 10) return '+91' + digits;                         // 10-digit local
  // Fallback: last 10 digits +91
  return '+91' + digits.slice(-10);
}

export default function PostListing() {
  const [form, setForm] = useState({
    title: '',
    type: 'service',
    category: '',
    contactNumber: '',
    state: '',
    city: '',
    area: '',
    pincode: '',
    isCommunityPosted: false,
    description: ''
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const token = localStorage.getItem('token');
  const API = import.meta.env.VITE_API_URL;

  function update(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function onPickPhoto(e) {
    const file = e.target.files?.[0];
    setPhoto(file || null);
    setPreview(file ? URL.createObjectURL(file) : '');
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');

    // normalize phone to always start with +91
    const normalizedPhone = ensurePlus91(form.contactNumber);

    if (!form.title || !form.category || !normalizedPhone || !form.type) {
      setMsg('Please fill Title, Category, Contact, and Type.');
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      Object.entries({ ...form, contactNumber: normalizedPhone }).forEach(([k, v]) =>
        fd.append(k, v)
      );
      if (photo) fd.append('photo', photo);

      const res = await fetch(`${API}/listings`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to create listing');

      setMsg('✅ Listing created!');
      // reset the file preview (keep form values so user can post similar again)
      setPhoto(null);
      setPreview('');
      // reflect normalized phone in the input for clarity
      update('contactNumber', normalizedPhone);
    } catch (err) {
      setMsg('❌ ' + (err.message || 'Error'));
    } finally {
      setSubmitting(false);
    }
  }

  async function onGenerate() {
    setLoadingAI(true);
    try {
      const { text } = await generateDescription({
        title: form.title,
        category: form.category,
        keywords: ''
      });
      if (text) update('description', text);
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <div className="wrap">
      <div className="card">
        <h1>Post New Listing</h1>

        <form onSubmit={onSubmit} className="grid">
          <label>
            <span>Title</span>
            <input
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g., Reliable Cook for Mornings"
              required
            />
          </label>

          <label>
            <span>Type</span>
            <select value={form.type} onChange={(e) => update('type', e.target.value)}>
              <option value="service">Service</option>
              <option value="rental">Rental</option>
            </select>
          </label>

          <label>
            <span>Category</span>
            <input
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              placeholder="e.g., cook, plumber, bicycle"
              required
            />
          </label>

          <label>
            <span>Contact number</span>
            <input
              value={form.contactNumber}
              onChange={(e) => update('contactNumber', e.target.value)}
              onBlur={(e) => update('contactNumber', ensurePlus91(e.target.value))}
              placeholder="+91XXXXXXXXXX (auto +91)"
              required
            />
          </label>

          <div className="row2">
            <label>
              <span>State</span>
              <input value={form.state} onChange={(e) => update('state', e.target.value)} />
            </label>
            <label>
              <span>City</span>
              <input value={form.city} onChange={(e) => update('city', e.target.value)} />
            </label>
          </div>

          <div className="row2">
            <label>
              <span>Area</span>
              <input value={form.area} onChange={(e) => update('area', e.target.value)} />
            </label>
            <label>
              <span>Pincode</span>
              <input value={form.pincode} onChange={(e) => update('pincode', e.target.value)} />
            </label>
          </div>

          <label className="check">
            <input
              type="checkbox"
              checked={form.isCommunityPosted}
              onChange={(e) => update('isCommunityPosted', e.target.checked)}
            />
            <span>Community-posted</span>
          </label>

          <label>
            <span>Description</span>
            <textarea
              rows="5"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Short details about the service or item…"
            />
          </label>

          <label>
            <span>Photo</span>
            <input type="file" accept="image/*" onChange={onPickPhoto} />
            {preview && <img className="preview" src={preview} alt="preview" />}
          </label>

          <div className="actions">
            {hasAI && (
              <button type="button" className="btn ghost" onClick={onGenerate} disabled={loadingAI}>
                {loadingAI ? 'Generating…' : 'Generate Description (AI)'}
              </button>
            )}
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Listing'}
            </button>
          </div>

          {msg && <div className="note">{msg}</div>}
        </form>
      </div>

      <style>{`
        .wrap {
          min-height: 100vh;
          background: radial-gradient(1200px 600px at 20% -10%, #e9e7ff 0%, transparent 60%),
                      radial-gradient(1200px 600px at 120% 10%, #e7f8ff 0%, transparent 60%),
                      #f7f8fb;
          padding: 32px 16px;
        }
        .card {
          max-width: 760px;
          margin: 0 auto;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(20,20,50,0.08);
          padding: 22px 22px 26px;
        }
        h1 { margin: 6px 0 14px; font-size: 26px; }
        .grid { display: grid; gap: 12px; }
        label { display: grid; gap: 6px; }
        label > span { font-size: 13px; color: #555; }
        input, select, textarea {
          padding: 10px 12px; border: 1px solid #e3e6ee; background: #fbfdff;
          border-radius: 10px; outline: none; font-size: 14px;
        }
        input:focus, select:focus, textarea:focus {
          border-color: #6b5cff; box-shadow: 0 0 0 3px rgba(107,92,255,0.15); background: #fff;
        }
        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .check { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
        .preview { margin-top: 8px; width: 220px; max-width: 100%; border-radius: 12px; border: 1px solid #e3e6ee; }
        .actions { display: flex; gap: 10px; margin-top: 8px; }
        .btn { background: #574bff; color: #fff; border: none; padding: 10px 14px; border-radius: 10px; cursor: pointer; font-weight: 600; }
        .btn.ghost { background: #eef0ff; color: #393a7c; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .note { margin-top: 10px; padding: 10px 12px; border-radius: 10px; background: #f5f7ff; color: #233; border: 1px solid #e3e6ee; }
        @media (max-width: 640px) { .row2 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
