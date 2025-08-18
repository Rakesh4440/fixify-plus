import { useEffect, useMemo, useState } from 'react';
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
  const [error, setError] = useState('');

  // review inputs
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  // AI summary
  const [summary, setSummary] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  async function load() {
    const data = await api(`/listings/${id}`);
    setListing(data);

    if (hasAI && (data.reviews?.length || 0) > 0) {
      setLoadingAI(true);
      const { text } = await summarizeReviews(data.reviews.map((r) => r.comment));
      setSummary(text);
      setLoadingAI(false);
    } else {
      setSummary('');
    }
  }

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        setError(e.message || 'Failed to load');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <div style={{ padding: 24, color: 'crimson' }}>{error}</div>;
  if (!listing) return <div style={{ padding: 24 }}>Loading...</div>;

  const imgSrc = listing.photoPath
    ? (listing.photoPath.startsWith('http') ? listing.photoPath : `${API_BASE}${listing.photoPath}`)
    : null;

  const meOwns =
    !!me && (String(listing.postedBy?._id || listing.postedBy) === String(me.id) || me.role === 'admin');

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

  async function submitReview(e) {
    e.preventDefault();
    if (!me?.token) return alert('Please login to add a review.');
    try {
      setSavingReview(true);
      await api(`/listings/${id}/reviews`, {
        method: 'POST',
        token: me.token,
        body: { rating, comment }
      });
      setComment('');
      await load(); // refresh reviews + summary
      alert('Thanks for your review!');
    } catch (err) {
      alert(err.message || 'Failed to add review');
    } finally {
      setSavingReview(false);
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
        {meOwns && (
          <>
            <Link className="btn ghost" to={`/listing/${id}/edit`}>Edit</Link>
            <button className="btn danger" onClick={onDelete}>Delete</button>
          </>
        )}
      </div>

      <h3 style={{ marginTop: 20 }}>Reviews</h3>
      {listing.reviews?.length ? (
        <ul style={{ paddingLeft: 18 }}>
          {listing.reviews.map((r, i) => (
            <li key={i} style={{ margin: '6px 0' }}>
              <b>{r.rating}/5</b> — {r.comment}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: '#777' }}>No reviews yet.</p>
      )}

      {/* Leave a review (logged in users) */}
      <div style={{ marginTop: 12 }}>
        <form onSubmit={submitReview} className="reviewBox">
          <div className="stars">
            {[1,2,3,4,5].map((v) => (
              <button
                key={v}
                type="button"
                className={(hover || rating) >= v ? 'star on' : 'star'}
                onMouseEnter={() => setHover(v)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(v)}
                aria-label={`${v} star`}
              >
                ★
              </button>
            ))}
            <span style={{ marginLeft: 8, color: '#555' }}>{rating}/5</span>
          </div>
          <textarea
            rows="3"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share a quick note about your experience…"
          />
          <button className="btn" disabled={savingReview}>
            {savingReview ? 'Submitting…' : 'Submit review'}
          </button>
        </form>
      </div>

      {/* AI summary */}
      {hasAI && (
        loadingAI ? (
          <Loader text="Summarizing reviews..." />
        ) : (
          summary && (
            <p style={{ marginTop: 12, fontStyle: 'italic' }}>
              Summary: {summary}
            </p>
          )
        )
      )}

      <style>{`
        .btn { background:#574bff; color:#fff; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; text-decoration:none }
        .btn.ghost { background:#eef; color:#222 }
        .btn.danger { background:#e53935 }
        .reviewBox { display:grid; gap:8px; max-width:560px; margin-top:8px }
        .reviewBox textarea {
          padding:10px 12px; border:1px solid #e3e6ee; border-radius:10px;
          background:#fbfdff; outline:none; font-size:14px;
        }
        .reviewBox textarea:focus {
          border-color:#6b5cff; box-shadow:0 0 0 3px rgba(107,92,255,.15); background:#fff;
        }
        .stars { display:flex; align-items:center; gap:2px; }
        .star {
          background:transparent; border:none; font-size:22px; color:#c7c7c7; cursor:pointer;
          padding:0; line-height:1;
        }
        .star.on { color:#f5b301; }
      `}</style>
    </div>
  );
}
