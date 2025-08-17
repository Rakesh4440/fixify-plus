import { useState } from 'react';
import { generateDescription } from '../services/ai.js';
import Loader from '../components/Loader.jsx';

export default function PostListing() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    contactNumber: '',
    isCommunityPosted: false,
    type: 'service',
    state: '',
    city: '',
    area: '',
    pincode: '',
    location: ''
  });

  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const token = localStorage.getItem('token');
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  function update(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  function onPhoto(e) {
    const f = e.target.files?.[0];
    if (f) { setPhoto(f); setPreview(URL.createObjectURL(f)); }
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const fd = new FormData();
      // append all text fields as strings
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v ?? '')));
      if (photo) fd.append('photo', photo);

      // send FormData directly (NO manual content-type)
      const res = await fetch(`${API_BASE}/listings`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
        // credentials not needed for JWT header
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'API error');

      alert('Listing created: ' + data._id);

      // reset
      setForm({
        title: '', description: '', category: '', contactNumber: '',
        isCommunityPosted: false, type: 'service',
        state: '', city: '', area: '', pincode: '', location: ''
      });
      setPhoto(null); setPreview(null);
    } catch (e2) {
      alert(e2.message);
    }
  }

  async function onGenerate() {
    setLoadingAI(true);
    try {
      const { text } = await generateDescription({
        title: form.title, category: form.category, keywords: `${form.city} ${form.area}`
      });
      update('description', text);
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Post New Listing</h2>

      <form onSubmit={onSubmit} encType="multipart/form-data" style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
        <input className="input" placeholder="Title" value={form.title} onChange={(e)=>update('title', e.target.value)} required />

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <select className="select" value={form.type} onChange={(e)=>update('type', e.target.value)}>
            <option value="service">Service</option>
            <option value="rental">Rental</option>
          </select>
          <input className="input" placeholder="Category (e.g., maid, plumbing, cook)" value={form.category} onChange={(e)=>update('category', e.target.value)} required />
        </div>

        <input className="input" placeholder="Contact number" value={form.contactNumber} onChange={(e)=>update('contactNumber', e.target.value)} required />

        {/* Address */}
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
          <input className="input" placeholder="State" value={form.state} onChange={(e)=>update('state', e.target.value)} />
          <input className="input" placeholder="City" value={form.city} onChange={(e)=>update('city', e.target.value)} />
          <input className="input" placeholder="Area / Locality" value={form.area} onChange={(e)=>update('area', e.target.value)} />
          <input className="input" placeholder="Pincode" value={form.pincode} onChange={(e)=>update('pincode', e.target.value)} />
        </div>

        <input className="input" placeholder="Landmark / Location (optional)" value={form.location} onChange={(e)=>update('location', e.target.value)} />

        {/* Photo capture */}
        <div className="card">
          <label style={{ display:'block', marginBottom:8, fontWeight:700 }}>Profile Photo (optional)</label>
          <input type="file" accept="image/*" capture="environment" onChange={onPhoto} />
          {preview && <img src={preview} alt="preview" style={{ marginTop: 12, maxWidth: '100%', borderRadius: 12 }} />}
        </div>

        <textarea className="textarea" rows="5" placeholder="Description" value={form.description} onChange={(e)=>update('description', e.target.value)} />

        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button type="button" className="btn" onClick={onGenerate}>Generate Description (AI)</button>
          {loadingAI && <Loader />}
        </div>

        <label style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input type="checkbox" checked={form.isCommunityPosted} onChange={(e)=>update('isCommunityPosted', e.target.checked)} />
          Community-posted
        </label>

        <button className="btn" type="submit">Create Listing</button>
      </form>
    </div>
  );
}
