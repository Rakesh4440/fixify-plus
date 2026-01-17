import { Link } from 'react-router-dom';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');

// Normalize phone for WhatsApp (India)
function toE164IN(phone) {
  let d = String(phone || '').replace(/\D/g, '');
  if (!d) return '';
  d = d.replace(/^0+/, '');
  if (d.startsWith('91') && d.length >= 12) return d;
  if (d.length === 10) return '91' + d;
  return '91' + d.slice(-10);
}

export default function ListingCard({ item }) {
  if (!item) return null;

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
  } = item;

  const avg =
    reviews.length > 0
      ? (
          reviews.reduce((a, b) => a + (b.rating || 0), 0) / reviews.length
        ).toFixed(1)
      : null;

  const imgSrc = photoPath
    ? photoPath.startsWith('http')
      ? photoPath
      : `${API_BASE}${photoPath}`
    : null;

  const waHref = contactNumber
    ? `https://wa.me/${toE164IN(contactNumber)}`
    : '#';

  const callHref = contactNumber
    ? `tel:${contactNumber.replace(/\s/g, '')}`
    : '#';

  return (
    <div className="card">
      {/* IMAGE */}
      <Link to={`/listing/${_id}`} className="imgWrap">
        {imgSrc ? (
          <img src={imgSrc} alt={title} />
        ) : (
          <div className="placeholder">No Image</div>
        )}
        <span className="pill">{category}</span>
      </Link>

      {/* CONTENT */}
      <div className="content">
        <div className="titleRow">
          <h3>{title}</h3>
          {isVerified && <span className="verified">✔</span>}
        </div>

        <p className="meta">
          {type} • {[area, city, pincode].filter(Boolean).join(', ')}
        </p>

        <div className="rating">
          {avg ? (
            <>
              <span className="stars">
                {'★'.repeat(Math.round(avg))}
                {'☆'.repeat(5 - Math.round(avg))}
              </span>
              <span className="score">{avg}</span>
              <span className="count">({reviews.length})</span>
            </>
          ) : (
            <span className="muted">No ratings yet</span>
          )}
        </div>

        {/* ACTIONS */}
        <div className="actions">
          <a href={waHref} target="_blank" rel="noreferrer" className="btn whatsapp">
            WhatsApp
          </a>
          <a href={callHref} className="btn call">
            Call
          </a>
          <Link to={`/listing/${_id}`} className="btn ghost">
            View
          </Link>
        </div>
      </div>

      {/* STYLES */}
      <style>{`
        .card {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
          overflow: hidden;
          transition: transform .2s ease, box-shadow .2s ease;
          display: flex;
          flex-direction: column;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.12);
        }

        .imgWrap {
          position: relative;
          height: 180px;
          background: #f1f5f9;
          display: block;
        }

        .imgWrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .placeholder {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-weight: 600;
        }

        .pill {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #eef2ff;
          color: #3730a3;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .content {
          padding: 14px 16px 16px;
        }

        .titleRow {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }

        .verified {
          color: #16a34a;
          font-size: 14px;
        }

        .meta {
          margin: 4px 0;
          font-size: 13px;
          color: #64748b;
        }

        .rating {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
        }

        .stars {
          color: #facc15;
          letter-spacing: 1px;
        }

        .score {
          font-weight: 700;
          font-size: 14px;
        }

        .count {
          font-size: 12px;
          color: #64748b;
        }

        .actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .btn {
          flex: 1;
          text-align: center;
          padding: 8px 10px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
        }

        .btn.whatsapp {
          background: #22c55e;
          color: #fff;
        }

        .btn.call {
          background: #4f46e5;
          color: #fff;
        }

        .btn.ghost {
          background: #eef2ff;
          color: #3730a3;
        }

        .muted {
          font-size: 13px;
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
