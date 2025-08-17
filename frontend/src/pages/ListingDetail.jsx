import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { summarizeReviews } from '../services/ai.js';
import Loader from '../components/Loader.jsx';

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function avgRating(reviews = []) {
  if (!reviews.length) return null;
  const sum = reviews.reduce((s, r) => s + (r.rating || 0), 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

// helpers for phone links
function toDigits(num = '') {
  return String(num).replace(/\D/g, ''); // keep only 0-9
}
function waLink(number, title) {
  const digits = toDigits(number);
  const msg = encodeURIComponent(`Hi! I'm interested in your Fixify+ listing: "${title}". Is it available?`);
  return `https://wa.me/${digits}?text=${msg}`;
}
function telLink(number) {
  const digits = toDigits(number);
  return `tel:${digits}`;
}

export default function ListingDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [listing, setListing] = useState(null);
  const [summary, setSummary] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [endorsed, setEndorsed] = useState(false);
  const [endorseCount, setEndorseCount] = useState(0);

  // review form
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(null);
  const [comment, setComment] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const token = localStorage.getItem('token');
  const currentUserId = decodeJwt(token || '')?.id || null;

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const IMG_BASE = API_BASE.replace(/\/api$/, '');

  async function load() {
    try {
      const data = await api(`/listings/${id}`);
      setListing(data);
      setEndorseCount(data.endorsements?.length || 0);

      if (currentUserId) {
        const mine = (data.endorsements || []).some((u) => String(u) === String(currentUserId));
        setEndorsed(mine);
        const myReview = (data.reviews || []).find((r) => String(r.user) === String(currentUserId));
        if (myReview) {
          setRating(myReview.rating || 5);
          setComment(myReview.comment || '');
        }
      }

      if (data.reviews?.length) {
        setLoadingAI(true);
        const { text } = await summarizeReviews(data.reviews.map((r) => r.comment));
        setSummary(text);
        setLoadingAI(false);
      } else {
        setSummary('');
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!listing) return <div style={{ padding: 24 }}>Loading...</div>;
  const avg = avgRating(listing.reviews);
  const isOwner = listing?.postedBy?._id && currentUserId && String(listing.postedBy._id) === String(currentUserId);

  async function toggleEndorse() {
    if (!token) return alert('Please login to recommend.');
    try {
      const res = await api(`/listings/${id}/endorse`, { method: 'POST', token });
      setEndorsed(res.action === 'added');
      setEndorseCount(res.endorsements);
      setListing((prev) => ({ ...prev, isVerified: res.isVerified }));
    } catch (e) {
      alert(e.message);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!token) return alert('Please login to add a review.');
    try {
      setSavingReview(true);
      await api(`/listings/${id}/reviews`, {
        method: 'POST',
        token,
        body: { rating, comment }
      });
      setSavingReview(false);
      await load();
    } catch (e) {
      setSavingReview(false);
      alert(e.message);
    }
  }

  async function onDelete() {
    if (!token) return alert('Please login.');
    if (!isOwner) return alert('Only the owner can delete this listing.');
    const ok = confirm('Delete this listing? This cannot be undone.');
    if (!ok) return;
    try {
      await api(`/listings/${id}`, { method: 'DELETE', token });
      alert('Listing deleted.');
      nav('/'); // go back to home
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Photo */}
      {listing.photoPath && (
        <img
          src={`${IMG_BASE}${listing.photoPath}`}
          alt={listing.title}
          style={{ width: '100%', maxWidth: 740, borderRadius: 16, marginBottom: 16, objectFit: 'cover' }}
        />
      )}

      {/* Title + Rating + Verified */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>
          {listing.title} {listing.isVerified ? '✅' : ''}
        </h2>
        {avg ? (
          <div className="pill" title={`${avg} out of 5`}>
            <span style={{ marginRight: 6 }}>⭐ {avg}</span>
            <span className="muted">({listing.reviews?.length || 0})</span>
          </div>
        ) : (
          <div className="pill">No reviews yet</div>
        )}
      </div>

      {/* Contact CTAs */}
      <div style={{ display: 'flex', gap: 10, margin: '14px 0 18px' }}>
        {/* WhatsApp FIRST as requested */}
        <a
          className="btn"
          href={waLink(listing.contactNumber, listing.title)}
          target="_blank"
          rel="noopener noreferrer"
          title="Chat on WhatsApp"
        >
          💬 WhatsApp
        </a>
        <a
          className="btn ghost"
          href={telLink(listing.contactNumber)}
          title="Call now"
        >
          📞 Call
        </a>
      </div>

      <p>
        <b>Type:</b> {listing.type} | <b>Category:</b> {listing.category}
      </p>
      <p>
        <b>Contact:</b> {listing.contactNumber}
      </p>
      <p>
        <b>Address:</b> {listing.area ? `${listing.area}, ` : ''}{listing.city || '—'} {listing.pincode ? `- ${listing.pincode}` : ''}
      </p>
      {listing.description && <p>{listing.description}</p>}

      {/* Quick stats */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '12px 0 18px' }}>
        <span className="pill">👍 {endorseCount}</span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button className="btn" onClick={toggleEndorse}>
          {endorsed ? '👍 Recommended' : '👍 Recommend'}
        </button>

        {isOwner && (
          <>
            <a className="btn ghost" href={`/listing/${listing._id}/edit`}>Edit Listing</a>
            <button className="btn" onClick={onDelete}>Delete</button>
          </>
        )}
      </div>

      {/* Review form */}
      <div className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>Leave a review</h3>
        <form onSubmit={submitReview} style={{ display: 'grid', gap: 10, maxWidth: 560 }}>
          <div style={{ display: 'flex', gap: 6, fontSize: 22 }}>
            {[1,2,3,4,5].map((i) => (
              <span
                key={i}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setRating(i)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title={`${i} star${i>1?'s':''}`}
              >
                {(hover || rating) >= i ? '★' : '☆'}
              </span>
            ))}
            <span className="muted" style={{ marginLeft: 8 }}>{rating}/5</span>
          </div>
          <textarea
            className="textarea"
            placeholder="Share your experience (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button className="btn" type="submit" disabled={savingReview}>
            {savingReview ? 'Saving…' : 'Submit Review'}
          </button>
        </form>
      </div>

      {/* Reviews */}
      <h3>Reviews</h3>
      <ul>
        {listing.reviews?.map((r, i) => (
          <li key={i} style={{ marginBottom: 6 }}>
            <b>{r.rating}/5</b> — {r.comment || <span className="muted">No comment</span>}
          </li>
        ))}
        {(!listing.reviews || listing.reviews.length === 0) && (
          <li className="muted">No reviews yet. Be the first!</li>
        )}
      </ul>

      {loadingAI ? <Loader text="Summarizing reviews..." /> : summary && <p><i>Summary:</i> {summary}</p>}
    </div>
  );
}
