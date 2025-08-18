import { Link } from 'react-router-dom';

function avgRating(reviews = []) {
  if (!reviews.length) return null;
  const sum = reviews.reduce((s, r) => s + (r.rating || 0), 0);
  return Math.round((sum / reviews.length) * 10) / 10; // 1 decimal
}

// phone helpers
function toDigits(num = '') {
  return String(num).replace(/\D/g, '');
}
function waLink(number, title) {
  const digits = toDigits(number);
  const msg = encodeURIComponent(`Hi! I'm interested in your Fixify+ listing: "${title}". Is it available?`);
  return `https://wa.me/${digits}?text=${msg}`;
}
function telLink(number) {
  return `tel:${toDigits(number)}`;
}

export default function ListingCard({ item }) {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const IMG_BASE = API_BASE.replace(/\/api$/, '');

  const imgSrc = item?.photoPath ? `${IMG_BASE}${item.photoPath}` : null;
  const avg = avgRating(item?.reviews || []);

  const wa = waLink(item.contactNumber, item.title);
  const tel = telLink(item.contactNumber);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Clickable image + text */}
      <Link to={`/listing/${item._id}`} style={{ color: 'inherit', textDecoration: 'none', flex: '1 1 auto' }}>
        {/* Image */}
        <div style={{ height: 180, background: '#f3f4f6', position: 'relative' }}>
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={item.title}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div
              style={{
                position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                color: '#6b7280', fontSize: 13
              }}
            >
              No photo
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {item.title}
            </div>
            {avg ? (
              <span className="pill" title={`${avg} out of 5`} style={{ marginLeft: 'auto' }}>
                ⭐ {avg} <span className="muted">({item.reviews?.length || 0})</span>
              </span>
            ) : (
              <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>No reviews</span>
            )}
          </div>

          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            {item.type} • {item.category}
            {item.city || item.area || item.pincode ? (
              <> • {item.area ? `${item.area}, ` : ''}{item.city || ''}{item.pincode ? ` - ${item.pincode}` : ''}</>
            ) : null}
          </div>
        </div>
      </Link>

      {/* Quick actions (outside the Link so taps don't navigate) */}
      <div style={{ display: 'flex', gap: 8, padding: 12, paddingTop: 0 }}>
        <a
          className="btn"
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          title="Chat on WhatsApp"
          style={{ padding: '6px 10px', fontSize: 13 }}
          onClick={(e) => e.stopPropagation()}
        >
          💬 WhatsApp
        </a>
        <a
          className="btn ghost"
          href={tel}
          title="Call now"
          style={{ padding: '6px 10px', fontSize: 13 }}
          onClick={(e) => e.stopPropagation()}
        >
          📞 Call
        </a>
      </div>
    </div>
  );
}
