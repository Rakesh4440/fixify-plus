import { Link } from 'react-router-dom';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');

function toE164IN(phone) {
  let d = String(phone || '').replace(/\D/g, '');
  if (!d) return '';
  d = d.replace(/^0+/, '');
  if (d.startsWith('91') && d.length >= 12) return d;
  if (d.length === 10) return `91${d}`;
  return `91${d.slice(-10)}`;
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
    isVerified
  } = item || {};

  const avg = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const imgSrc = photoPath
    ? (photoPath.startsWith('http') ? photoPath : `${API_BASE}${photoPath}`)
    : null;

  const waHref = contactNumber
    ? `https://wa.me/${toE164IN(contactNumber)}?text=Hi%2C%20I%20found%20your%20listing%20on%20Fixify%2B%3A%20${encodeURIComponent(title || '')}`
    : '#';

  const callHref = contactNumber ? `tel:${contactNumber.replace(/\s/g, '')}` : '#';

  return (
    <article className="listing-card">
      <Link to={`/listing/${_id}`} className="listing-media">
        {imgSrc ? <img src={imgSrc} alt={title} /> : <div className="img-placeholder">No photo</div>}
      </Link>

      <div className="listing-body">
        <Link to={`/listing/${_id}`} className="listing-title">
          {title} {isVerified ? '✅' : ''}
        </Link>

        <div className="listing-meta">
          <span>{type}</span> • <span>{category}</span>
          {(city || area || pincode) ? <> • <span>{[area, city, pincode].filter(Boolean).join(', ')}</span></> : null}
        </div>

        <div className="rating-row">
          {avg ? (
            <>
              <span className="stars">{'★'.repeat(Math.round(avg))}{'☆'.repeat(5 - Math.round(avg))}</span>
              <strong>{avg}</strong>
              <span className="muted">({reviews.length})</span>
            </>
          ) : (
            <span className="muted">No ratings yet</span>
          )}
        </div>

        <div className="listing-actions">
          <a className="btn secondary" href={waHref} target="_blank" rel="noreferrer">WhatsApp</a>
          <a className="btn" href={callHref}>Call</a>
          <Link className="btn ghost" to={`/listing/${_id}`}>View</Link>
        </div>
      </div>
    </article>
  );
}
