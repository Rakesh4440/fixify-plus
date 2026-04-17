import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, buildApiUrl } from '../services/api.js';
import { summarizeReviews, hasAI } from '../services/ai.js';
import Loader from '../components/Loader.jsx';
import BookingPanel from '../components/BookingPanel.jsx';
import ChatPanel from '../components/ChatPanel.jsx';
import { getCurrentUser } from '../services/session.js';

const rawApiUrl = import.meta.env.VITE_API_URL || '';
const API_BASE = rawApiUrl.replace(/\/api\/?$/, '');

function toE164IN(phone) {
  let d = String(phone || '').replace(/\D/g, '');
  if (!d) return '';
  d = d.replace(/^0+/, '');
  if (d.startsWith('91') && d.length >= 12) return d;
  if (d.length === 10) return '91' + d;
  return '91' + d.slice(-10);
}

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const me = useMemo(() => getCurrentUser(), []);
  const [listing, setListing] = useState(null);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [summary, setSummary] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [bookingRefreshKey, setBookingRefreshKey] = useState(0);

  async function load() {
    const data = await api(`/listings/${id}`, { token: me?.token });
    setListing(data);

    if (hasAI && (data.reviews?.length || 0) > 0) {
      setLoadingAI(true);
      try {
        const visibleReviews = data.reviews.filter((review) => !review.isHidden);
        const { text } = await summarizeReviews(visibleReviews.map((r) => r.comment));
        setSummary(text);
      } finally {
        setLoadingAI(false);
      }
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
  }, [id]);

  if (error) return <div style={{ padding: 24, color: 'crimson' }}>{error}</div>;
  if (!listing) return <div style={{ padding: 24 }}>Loading...</div>;

  const reviewListingId = listing?._id || id;
  const imgSrc = listing.photoPath
    ? (listing.photoPath.startsWith('http') ? listing.photoPath : `${API_BASE}${listing.photoPath}`)
    : null;

  const ownerId = listing.postedBy?._id || listing.postedBy;
  const meOwns = !!me && (String(ownerId) === String(me.id) || me.role === 'admin');

  const waHref = listing.contactNumber
    ? `https://wa.me/${toE164IN(listing.contactNumber)}?text=Hi%2C%20I%20found%20your%20listing%20on%20Fixify%2B%3A%20${encodeURIComponent(listing.title || '')}`
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
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div className="detail-grid">
        <section className="panel detail-panel">
          <div className="detail-heading">
            <div>
              <h2 style={{ marginBottom: 8 }}>
                {listing.title} {listing.isVerified ? '✅' : ''}
              </h2>
              <p className="muted">
                {listing.type} • {listing.category} • {listing.viewsCount || 0} views • {listing.favoritesCount || 0} bookmarks
              </p>
            </div>

            <div className="detail-top-actions">
              <button
                className="btn ghost"
                disabled={!me?.token || favoriteBusy}
                onClick={async () => {
                  if (!me?.token) return alert('Please login to bookmark listings.');
                  try {
                    setFavoriteBusy(true);
                    await api(`/auth/favorites/${listing._id}`, {
                      method: 'POST',
                      token: me.token
                    });
                    await load();
                  } finally {
                    setFavoriteBusy(false);
                  }
                }}
              >
                {listing.isFavorite ? 'Bookmarked' : 'Bookmark'}
              </button>
              <button
                className="btn ghost"
                disabled={!me?.token}
                onClick={async () => {
                  if (!me?.token) return alert('Please login to report listings.');
                  if (!reportReason.trim()) {
                    setReportMessage('Add a short report reason first.');
                    return;
                  }
                  try {
                    await api(`/listings/${listing._id}/report`, {
                      method: 'POST',
                      token: me.token,
                      body: { reason: reportReason }
                    });
                    setReportMessage('Thanks. Your report has been submitted.');
                    setReportReason('');
                  } catch (err) {
                    setReportMessage(err.message || 'Could not submit report');
                  }
                }}
              >
                Report
              </button>
            </div>
          </div>

          {(listing.city || listing.area || listing.pincode) && (
            <p style={{ color: '#555' }}>
              <b>Location:</b> {[listing.area, listing.city, listing.pincode].filter(Boolean).join(', ')}
            </p>
          )}

          <p style={{ color: '#555' }}>
            <b>Provider:</b> {listing.postedBy?.name || 'Community member'} • <b>Contact:</b> {listing.contactNumber}
          </p>

          {imgSrc ? (
            <img
              src={imgSrc}
              alt={listing.title}
              style={{ width: '100%', maxWidth: 640, borderRadius: 16, margin: '12px 0' }}
            />
          ) : null}

          <p style={{ marginTop: 12 }}>{listing.description}</p>

          <div style={{ display: 'flex', gap: 10, margin: '12px 0', flexWrap: 'wrap' }}>
            <a className="btn secondary" href={waHref} target="_blank" rel="noreferrer">WhatsApp</a>
            <a className="btn" href={callHref}>Call</a>
            {meOwns ? (
              <>
                <Link className="btn ghost" to={`/listing/${id}/edit`}>Edit</Link>
                <button className="btn danger" onClick={onDelete}>Delete</button>
              </>
            ) : null}
          </div>

          <div className="report-box">
            <input
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Report reason: spam, fake contact, incorrect listing..."
            />
            {reportMessage ? <p className="muted">{reportMessage}</p> : null}
          </div>

          <h3 style={{ marginTop: 20 }}>Reviews</h3>
          {listing.reviews?.filter((review) => !review.isHidden).length ? (
            <ul style={{ paddingLeft: 18 }}>
              {listing.reviews.filter((review) => !review.isHidden).map((r) => (
                <li key={r._id} style={{ margin: '6px 0' }}>
                  <b>{r.rating}/5</b> — {r.comment}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#777' }}>No reviews yet.</p>
          )}

          <div style={{ marginTop: 12 }}>
            <form
              onSubmit={async (e)=> {
                e.preventDefault();
                if (!me?.token) return alert('Please login to add a review.');
                if (!reviewListingId) return alert('Listing id is missing. Please refresh and try again.');
                try {
                  setSavingReview(true);
                  const reviewPath = `/listings/${reviewListingId}/reviews`;
                  console.log('[reviews] Submitting review', {
                    listingId: reviewListingId,
                    reviewPath,
                    reviewUrl: buildApiUrl(reviewPath),
                    rating
                  });
                  await api(reviewPath, {
                    method: 'POST',
                    token: me.token,
                    body: { rating, comment }
                  });
                  setComment('');
                  await load();
                  alert('Thanks for your review!');
                } catch (err) {
                  alert(err.message || 'Failed to add review');
                } finally {
                  setSavingReview(false);
                }
              }}
              className="reviewBox"
            >
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
                  >★</button>
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

          {hasAI && (loadingAI ? <Loader text="Summarizing reviews..." /> : (summary && <p style={{ marginTop: 12, fontStyle: 'italic' }}>Summary: {summary}</p>))}
        </section>

        <aside className="detail-side">
          <BookingPanel listingId={listing._id} listingTitle={listing.title} onBooked={() => setBookingRefreshKey((value) => value + 1)} />
          <ChatPanel key={`${listing._id}-${bookingRefreshKey}`} listingId={listing._id} providerId={ownerId} />
        </aside>
      </div>

      <style>{`
        .detail-grid { display:grid; grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr); gap:16px; align-items:start; }
        .detail-panel { padding:20px; }
        .detail-heading { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
        .detail-top-actions { display:flex; gap:8px; flex-wrap:wrap; }
        .detail-side { display:grid; gap:16px; }
        .report-box { display:grid; gap:8px; margin-top:12px; }
        .report-box input { padding:10px 12px; border:1px solid #e3e6ee; border-radius:10px; background:#fbfdff; }
        .reviewBox { display:grid; gap:8px; max-width:560px; margin-top:8px }
        .reviewBox textarea { padding:10px 12px; border:1px solid #e3e6ee; border-radius:10px; background:#fbfdff; outline:none; font-size:14px; }
        .reviewBox textarea:focus { border-color:#6b5cff; box-shadow:0 0 0 3px rgba(107,92,255,.15); background:#fff; }
        .stars { display:flex; align-items:center; gap:2px; }
        .star { background:transparent; border:none; font-size:22px; color:#c7c7c7; cursor:pointer; padding:0; line-height:1; }
        .star.on { color:#f5b301; }
        .btn.danger { background:#e53935 }
        @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
