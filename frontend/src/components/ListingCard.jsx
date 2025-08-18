import { Link } from 'react-router-dom';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');

// Normalize a phone string to WhatsApp E.164 for India (+91)
// - strips non-digits
// - removes leading zeros
// - if no country code, prefixes 91
function toE164IN(phone) {
  let d = String(phone || '').replace(/\D/g, '');
  if (!d) return '';
  d = d.replace(/^0+/, '');               // drop leading zeros like 0XXXXXXXXXX
  if (d.startsWith('91') && d.length >= 12) return d; // already has country code
  if (d.length === 10) return '91' + d;   // plain 10-digit → prefix 91
  // fallback: ensure last 10 digits + 91
  return '91' + d.slice(-10);
}

export default function ListingCard({ item }) {
  const {
    _id,
    title,
    category,
    type,
    city,
    area,
    pincode,
    contactNumber,
    photoPath,
    reviews = [],
    isVerified,
  } = item || {};

  const avg =
    reviews.length > 0
      ? (reviews.reduce((a, b) => a + (b.rating || 0), 0) / reviews.length).toFixed(1)
      : null;

  const imgSrc = photoPath
    ? (photoPath.startsWith('http') ? photoPath : `${API_BASE}${photoPath}`)
    : null;

  const waHref = contactNumber
    ? `https://wa.me/${toE164IN(contactNumber)}?text=Hi%2C%20I%20found%20your%20listing%20on%20Fixify%2B%3A%20${encodeURIComponent(
        title || ''
      )}`
    : '#';

  const callHref = contactNumber ? `tel:${contactNumber.replace(/\s/g, '')}` : '#';

  return (
    <div className="card">
      <Link to={`/listing/${_id}`} className="imgWrap">
        {imgSrc ? (
          <img src={imgSrc} alt={title} />
        ) : (
          <div className="imgPlaceholder">No photo</div>
        )}
      </Link>

      <div className="content">
        <div className="titleRow">
          <Link to={`/listing/${_id}`} className="title">
            {title} {isVerified ? '✅' : ''}
          </Link>
        </div>
        <div className="meta">
          <span>{type}</span> • <span>{category}</span>
          {(city || area || pincode) && (
            <> • <span>{[area, city, pincode].filter(Boolean).join(', ')}</span></>
          )}
        </div>

        <div className="ratingRow">
          {avg ? (
            <>
              <span className="stars">{'★'.repeat(Math.round(avg))}{'☆'.repeat(5 - Math.round(avg))}</span>
              <span className="score">{avg}</span>
              <span className="count">({reviews.length})</span>
            </>
          ) : (
            <span className="muted">No ratings yet</span>
          )}
        </div>

        <div className="actions">
          <a className="btn secondary" href={waHref} target="_blank" rel="noreferrer">WhatsApp</a>
          <a className="btn" href={callHref}>Call</a>
          <Link className="btn ghost" to={`/listing/${_id}`}>View</Link>
        </div>
      </div>

      <style jsx>{`
        .card { background:#fff; border-radius:14px; box-shadow:0 6px 22px rgba(0,0,0,0.06); overflow:hidden; display:flex; flex-direction:column; }
        .imgWrap { display:block; height:180px; background:#f6f7fb; }
        img { width:100%; height:180px; object-fit:cover; display:block; }
        .imgPlaceholder { height:180px; display:flex; align-items:center; justify-content:center; color:#888; }
        .content { padding:12px 14px 14px; }
        .titleRow { display:flex; align-items:center; gap:8px; }
        .title { font-weight:600; color:#111; text-decoration:none; }
        .meta { color:#666; font-size:13px; margin-top:2px; }
        .ratingRow { margin-top:6px; display:flex; gap:8px; align-items:center; }
        .stars { color:#f5b301; letter-spacing:1px; }
        .score { font-weight:600; }
        .count, .muted { color:#999; font-size:12px; }
        .actions { margin-top:10px; display:flex; gap:8px; }
        .btn { background:#574bff; color:#fff; text-decoration:none; padding:8px 12px; border-radius:8px; font-size:14px; }
        .btn.secondary { background:#25D366; }
        .btn.ghost { background:#eef; color:#333; }
      `}</style>
    </div>
  );
}
