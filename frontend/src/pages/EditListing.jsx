import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export default function EditListing() {
  const { id } = useParams();
  const nav = useNavigate();
  const token = localStorage.getItem('token');
  const userId = decodeJwt(token || '')?.id;

  const [data, setData] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const IMG_BASE = API_BASE.replace(/\/api$/, '');

  useEffect(() => {
    (async () => {
      try {
        const item = await api(`/listings/${id}`);
        setData(item);
        if (!item?.postedBy?._id || String(item.postedBy._id) !== String(userId)) {
          console.warn('Not the owner of this listing');
        }
      } catch (e) {
        alert(e.message);
      }
    })();
  }, [id, userId]);

  function update(k, v) {
    setData((p) => ({ ...p, [k]: v }));
  }

  function onPhoto(e) {
    const f = e.target.files?.[0];
    if (f) {
      setPhoto(f);
      setPreview(URL.createObjectURL(f));
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      let body;

      if (photo) {
        body = new FormData();
        const keys = [
          'title', 'description', 'category', 'contactNumber', 'type',
          'state', 'city', 'area', 'pincode', 'location',
          'serviceType', 'availability', 'rentalDurationUnit', 'itemCondition'
        ];
        keys.forEach((k) => {
          if (typeof data[k] !== 'undefined' && data[k] !== null) body.append(k, data[k]);
        });
        body.append('isCommunityPosted', data.isCommunityPosted ? 'true' : 'false');
        body.append('photo', photo);
      } else {
        body = {
          title: data.title,
          description: data.description,
          category: data.category,
          contactNumber: data.contactNumber,
          type: data.type,
          state: data.state,
          city: data.city,
          area: data.area,
          pincode: data.pincode,
          location: data.location,
          serviceType: data.serviceType,
          availability: data.availability,
          rentalDurationUnit: data.rentalDurationUnit,
          itemCondition: data.itemCondition,
          isCommunityPosted: !!data.isCommunityPosted
        };
      }

      const updated = await api(`/listings/${id}`, { method: 'PUT', token, body });
      alert('Listing updated!');
      nav(`/listing/${updated._id}`);
    } catch (e) {
      alert(e.message);
    }
  }

  async function onDelete() {
    if (!token) return alert('Please login.');
    const ok = confirm('Delete this listing? This cannot be undone.');
    if (!ok) return;
    try {
      await api(`/listings/${id}`, { method: 'DELETE', token });
      alert('Listing deleted.');
      nav('/');
    } catch (e) {
      alert(e.message);
    }
  }

  if (!data) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>Edit Listing</h2>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <a className="btn ghost" href={`/listing/${data._id}`}>View</a>
          <button className="btn" onClick={onDelete}>Delete</button>
        </div>
      </div>

      {/* current or new preview */}
      {preview ? (
        <img src={preview} alt="new" style={{ width: '100%', borderRadius: 12, marginBottom: 12 }} />
      ) : data.photoPath ? (
        <img src={`${IMG_BASE}${data.photoPath}`} alt={data.title} style={{ width: '100%', borderRadius: 12, marginBottom: 12 }} />
      ) : null}

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input className="input" value={data.title || ''} onChange={(e)=>update('title', e.target.value)} placeholder="Title" />
        <textarea className="textarea" value={data.description || ''} onChange={(e)=>update('description', e.target.value)} placeholder="Description" />

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <input className="input" value={data.category || ''} onChange={(e)=>update('category', e.target.value)} placeholder="Category" />
          <select className="select" value={data.type || 'service'} onChange={(e)=>update('type', e.target.value)}>
            <option value="service">Service</option>
            <option value="rental">Rental</option>
          </select>
        </div>

        <input className="input" value={data.contactNumber || ''} onChange={(e)=>update('contactNumber', e.target.value)} placeholder="Contact number" />

        {/* address */}
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
          <input className="input" value={data.state || ''} onChange={(e)=>update('state', e.target.value)} placeholder="State" />
          <input className="input" value={data.city || ''} onChange={(e)=>update('city', e.target.value)} placeholder="City" />
          <input className="input" value={data.area || ''} onChange={(e)=>update('area', e.target.value)} placeholder="Area / Locality" />
          <input className="input" value={data.pincode || ''} onChange={(e)=>update('pincode', e.target.value)} placeholder="Pincode" />
        </div>

        <input className="input" value={data.location || ''} onChange={(e)=>update('location', e.target.value)} placeholder="Landmark / Location (optional)" />

        <label>Replace Photo (optional):{' '}
          <input type="file" accept="image/*" capture="environment" onChange={onPhoto} />
        </label>

        <label style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input
            type="checkbox"
            checked={!!data.isCommunityPosted}
            onChange={(e)=>update('isCommunityPosted', e.target.checked)}
          />
          Community-posted
        </label>

        <button className="btn" type="submit">Save Changes</button>
      </form>
    </div>
  );
}
