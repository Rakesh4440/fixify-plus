import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;
const API_BASE = (API || '').replace(/\/api$/, '');

/* Ensure +91 for storage/display */
function ensurePlus91(phone) {
  let s = String(phone || '').trim().replace(/\s+/g, '');
  if (!s) return '';
  if (s.startsWith('+91')) return s;
  const digits = s.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length >= 12) return '+' + digits;
  if (digits.length === 10) return '+91' + digits;
  return '+91' + digits.slice(-10);
}

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

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
    description: '',
    photoPath: ''
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  function update(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/listings/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load');
        setForm({
          title: data.title || '',
          type: data.type || 'service',
          category: data.category || '',
          contactNumber: ensurePlus91(data.contactNumber || ''),
          state: data.state || '',
          city: data.city || '',
          area: data.area || '',
          pincode: data.pincode || '',
          isCommunityPosted: !!data.isCommunityPosted,
          description: data.description || '',
          photoPath: data.photoPath || ''
        });
        setPreview(data.photoPath ? (data.photoPath.startsWith('http') ? data.photoPath : `${API_BASE}${data.photoPath}`) : '');
      } catch (e) {
        setMsg('❌ ' + e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function onPickPhoto(e) {
    const file = e.target.files?.[0];
    setPhoto(file || null);
    setPreview(file ? URL.createObjectURL(file) : (form.photoPath ? `${API_BASE}${form.photoPath}` : ''));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');

    const normalizedPhone = ensurePlus91(form.contactNumber);
    if (!form.title || !form.category || !normalizedPhone || !form.type) {
      setMsg('Please fill Title, Category, Contact, and Type.');
      return;
    }

    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries({ ...form, contactNumber: normalizedPhone }).forEach(([k, v]) => {
        if (k !== 'photoPath') fd.append(k, v ?? '');
      });
      if (photo) fd.append('photo', photo);

      const res = await fetch(`${API}/listings/${id}`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to update');

      setMsg('✅ Listing updated!');
      update('contactNumber', normalizedPhone);
      navigate(`/listing/${id}`);
    } catch (err) {
      setMsg('❌ ' + (err.message || 'Error'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div className="wrap">
      <div className="card">
        <h1>Edit Listing</h1>

        <form onSubmit={onSubmit} className="grid">
          <label><span>Title</span>
            <input value={form.title} onChange={(e) => update('title', e.target.value)} required />
          </label>

          <label><span>Type</span>
            <select value={form.type} onChange={(e) => update('type', e.target.value)}>
              <option value="service">Service</option>
              <option value="rental">Rental</option>
            </select>
          </label>

          <label><span>Category</span>
            <input value={form.category} onChange={(e) => update('category', e.target.value)} required />
          </label>

          <label><span>Contact number</span>
            <input
              value={form.contactNumber}
              onChange={(e) => update('contactNumber', e.target.value)}
              onBlur={(e) => update('contactNumber', ensurePlus91(e.target.value))}
              placeholder="+91XXXXXXXXXX"
              required
            />
          </label>

          <div className="row2">
            <label><span>State</span>
              <input value={form.state} onChange={(e) => update('state', e.target.value)} />
            </label>
            <label><span>City</span>
              <input value={form.city} onChange={(e) => update('city', e.target.value)} />
            </label>
          </div>

          <div className="row2">
            <label><span>Area</span>
              <input value={form.area} onChange={(e) => update('area', e.target.value)} />
            </label>
            <label><span>Pincode</span>
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

          <label><span>Description</span>
            <textarea rows="5" value={form.description} onChange={(e) => update('description', e.target.value)} />
          </label>

          <label><span>Replace photo</span>
            <input type="file" accept="image/*" onChange={onPickPhoto} />
            {preview && <img className="preview" src={preview} alt="preview" />}
          </label>

          <div className="actions">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>

          {msg && <div className="note">{msg}</div>}
        </form>
      </div>

      <style>{`
        .wrap { min-height: 100vh; background: #f7f8fb; padding: 32px 16px; }
        .card { max-width: 760px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 8px 30px rgba(20,20,50,0.08); padding: 22px; }
        h1 { margin: 6px 0 14px; font-size: 26px; }
        .grid { display: grid; gap: 12px; }
        label { display: grid; gap: 6px; }
        label > span { font-size: 13px; color: #555; }
        input, select, textarea { padding: 10px 12px; border: 1px solid #e3e6ee; background: #fbfdff; border-radius: 10px; outline: none; font-size: 14px; }
        input:focus, select:focus, textarea:focus { border-color: #6b5cff; box-shadow: 0 0 0 3px rgba(107,92,255,0.15); background: #fff; }
        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .check { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
        .preview { margin-top: 8px; width: 220px; max-width: 100%; border-radius: 12px; border: 1px solid #e3e6ee; }
        .actions { display: flex; gap: 10px; margin-top: 8px; }
        .btn { background: #574bff; color: #fff; border: none; padding: 10px 14px; border-radius: 10px; cursor: pointer; font-weight: 600; }
        .note { margin-top: 10px; padding: 10px 12px; border-radius: 10px; background: #f5f7ff; color: #233; border: 1px solid #e3e6ee; }
        @media (max-width: 640px) { .row2 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
