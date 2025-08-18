import { useState } from 'react';
import { api } from '../services/api.js';
import { generateDescription, hasAI } from '../services/ai.js';
import Loader from '../components/Loader.jsx';

export default function PostListing() {
  const [form, setForm] = useState({
    title: '', description: '', category: '', contactNumber: '',
    isCommunityPosted: false, type: 'service',
    state: '', city: '', area: '', pincode: '',
  });
  const [photo, setPhoto] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const token = localStorage.getItem('token');

  function update(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append('photo', photo);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/listings`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd
      });
      if (!res.ok) throw new Error((await res.json()).message || 'API error');
      const created = await res.json();
      alert('Listing created: ' + created._id);
    } catch (e) {
      alert(e.message);
    }
  }

  async function onGenerate() {
    setLoadingAI(true);
    try {
      const { text } = await generateDescription({ title: form.title, category: form.category });
      if (text) update('description', text);
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Post New Listing</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 600 }}>
        <input placeholder="Title" value={form.title} onChange={(e) => update('title', e.target.value)} />
        <select value={form.type} onChange={(e) => update('type', e.target.value)}>
          <option value="service">Service</option>
          <option value="rental">Rental</option>
        </select>
        <input placeholder="Category (e.g., plumbing, bicycle)" value={form.category} onChange={(e) => update('category', e.target.value)} />
        <input placeholder="Contact number" value={form.contactNumber} onChange={(e) => update('contactNumber', e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input placeholder="State" value={form.state} onChange={(e) => update('state', e.target.value)} />
          <input placeholder="City" value={form.city} onChange={(e) => update('city', e.target.value)} />
          <input placeholder="Area" value={form.area} onChange={(e) => update('area', e.target.value)} />
          <input placeholder="Pincode" value={form.pincode} onChange={(e) => update('pincode', e.target.value)} />
        </div>
        <label>
          <input type="checkbox" checked={form.isCommunityPosted} onChange={(e) => update('isCommunityPosted', e.target.checked)} />
          {' '}Community-posted
        </label>

        <textarea rows="5" placeholder="Description" value={form.description} onChange={(e) => update('description', e.target.value)} />

        <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {hasAI && <button type="button" onClick={onGenerate}>Generate Description (AI)</button>}
          {loadingAI && <Loader />}
        </div>

        <button type="submit">Create Listing</button>
      </form>
    </div>
  );
}
