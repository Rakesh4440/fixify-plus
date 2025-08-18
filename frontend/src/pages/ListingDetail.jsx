import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { summarizeReviews, hasAI } from '../services/ai.js';
import Loader from '../components/Loader.jsx';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');

function getUserFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.id, role: payload.role, token };
  } catch {
    return null;
  }
}

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const me = useMemo(() => getUserFromToken(), []);
  const [listing, setListing] = useState(null);
  const [summary, setSummary] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api(`/listings/${id}`);
        setListing(data);

        if (hasAI && data.reviews?.length) {
          setLoadingAI(true);
          const { text } = await summarizeReviews(data.reviews.map((r) => r.comment));
          setSummary(text);
          setLoadingAI(false);
        }
      } catch (e) {
        setError(e.message || 'Failed to load');
      }
    })();
  }, [id]);

  if (error) return <div style={{ padding: 24, color: 'crimson' }}>{error}</div>;
  if (!listing) return <div style={{ padding: 24 }}>Loading...</div>;

  const imgSrc = listing.photoPath
    ? (listing.photoPath.startsWith('http') ? listing.photoPath : `${API_BASE}${listing.photoPath}`)
    : null;

  const isOwner =
    !!me &&
    (String(listing.postedBy?._id || listing.postedBy) === String(me.id) || me.role === 'admin');

  const waHref = listing.contactNumber
    ? `https://wa.me/${listing.contactNumber.replace(/\D/g, '')}?text=Hi%2C%20I%20found%20your%20listing%20on%20Fixify%2B%3A%20${encodeURIComponent(
        listing.title || ''
      )}`
    : '#';
  const callHref = listing.contactNumber ? `tel:${listing.contactNumber.replace(/\s/g, '')}` : '#';

  async function onDelete() {
    if (!confirm('Delete this listing?')) return;
    try {
      await api(`/listings/${id}`, { method: 'DELETE', token: me?.token });
      alert('Deleted');
      navigate('/');
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 8 }}>
        {listing.title} {listing.isVerified ? '✅' : ''}
      </h2>

      {(listing.city || listing.area || listing.pincode) && (
        <p style={{ color: '#555' }}>
          <b>Location:</b> {[listing.area, listing.city, listing.pincode].filter(Boolean).join(', ')}
        </p>
      )}

      <p style={{ color: '#555' }}>
        <b>Type:</b> {listing.type} • <b>Category:</b> {listing.category}
      </p>

      <p><b>Contact:</b> {listing.contactNumber}</p>

      {imgSrc && (
        <img
          src={imgSrc}
          alt={listing.title}
          style={{ width: '100%', maxWidth: 560, borderRadius: 12, margin: '12px 0' }}
        />
      )}

      <p style={{ marginTop: 12 }}>{listing.description}</p>

      <div style={{ display: 'flex', gap: 10, margin: '12px 0' }}>
        <a className="btn" href={waHref} target="_blank" rel="noreferrer">WhatsApp</a>
        <a className="btn" href={callHref}>Call</a>
        {isOwner && (
          <>
            <Link className="btn ghost" to={`/listing/${id}/edit`}>Edit</Link>
            <button className="btn danger" onClick={onDelete}>Delete</button>
          </>
        )}
      </div>

      <h3>Reviews</h3>
      <ul>
        {listing.reviews?.map((r, i) => (
          <li key={i}><b>{r.rating}/5</b> — {r.comment}</li>
        ))}
      </ul>

      {hasAI && (loadingAI ? <Loader text="Summarizing reviews..." /> : (summary && <p><i>Summary:</i> {summary}</p>))}

      <style>{`
        .btn { background:#574bff; color:#fff; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; text-decoration:none }
        .btn.ghost { background:#eef; color:#222 }
        .btn.danger { background:#e53935 }
      `}</style>
    </div>
  );
}
