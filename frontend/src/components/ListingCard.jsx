import { Link } from 'react-router-dom';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');

function normalizePhone(phone) {
  if (!phone) return '';
  let d = phone.replace(/\D/g, '');
  if (d.length === 10) return '91' + d;
  if (d.startsWith('91')) return d;
  return d;
}

function categoryColor(cat) {
  switch (cat?.toLowerCase()) {
    case 'plumbing': return 'from-blue-500 to-cyan-400';
    case 'electrical': return 'from-yellow-400 to-orange-400';
    case 'cleaning': return 'from-pink-500 to-rose-400';
    case 'carpentry': return 'from-amber-600 to-yellow-500';
    case 'gardening': return 'from-green-500 to-emerald-400';
    default: return 'from-indigo-500 to-purple-500';
  }
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
    reviews = []
  } = item;

  const rating =
    reviews.length > 0
      ? (reviews.reduce((a, b) => a + (b.rating || 0), 0) / reviews.length).toFixed(1)
      : null;

  const imgSrc = photoPath
    ? photoPath.startsWith('http')
      ? photoPath
      : `${API_BASE}${photoPath}`
    : null;

  return (
    <div className={`card ${categoryColor(category)}`}>
      {/* COLOR BAR */}
      <div className="top-glow" />

      {/* IMAGE */}
      <Link to={`/listing/${_id}`} className="img-wrap">
        {imgSrc ? <img src={imgSrc} alt={title} /> : <div className="no-img">No Image</div>}
        <span className="badge">{category}</span>
      </Link>

      {/* CONTENT */}
      <div className="content">
        <h3>{title}</h3>

        <p className="meta">
          {type} • {[area, city, pincode].filter(Boolean).join(', ')}
        </p>

        <div className="rating">
          {rating ? (
            <>
              <span className="stars">★ {rating}</span>
              <span className="count">({reviews.length})</span>
            </>
          ) : (
            <span className="muted">No ratings yet</span>
          )}
        </div>

        {/* ACTIONS */}
        <div className="actions">
          <a
            href={`https://wa.me/${normalizePhone(contactNumber)}`}
            target="_blank"
            rel="noreferrer"
            className="btn whatsapp"
          >
            WhatsApp
          </a>

          <a href={`tel:${contactNumber}`} className="btn call">
            Call
          </a>

          <Link to={`/listing/${_id}`} className="btn view">
            View
          </Link>
        </div>
      </div>

      {/* STYLES */}
      <style>{`
        .card {
          position: relative;
          background: #fff;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
          transition: all .25s ease;
        }

        .card:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 40px rgba(99,102,241,0.25);
        }

        .top-glow {
          height: 5px;
          background: linear-gradient(90deg, var(--tw-gradient-stops));
        }

        .img-wrap {
          position: relative;
          height: 180px;
          background: #f1f5f9;
          display: block;
        }

        .img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .no-img {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-weight: 600;
        }

        .badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255,255,255,0.95);
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        }

        .content {
          padding: 14px 16px 18px;
        }

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
        }

        .meta {
          font-size: 13px;
          color: #64748b;
          margin: 4px 0;
        }

        .rating {
          display: flex;
          gap: 6px;
          align-items: center;
          margin-top: 6px;
        }

        .stars {
          font-weight: 700;
          color: #f59e0b;
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
          background: #6366f1;
          color: #fff;
        }

        .btn.view {
          background: #eef2ff;
          color: #3730a3;
        }

        .muted {
          color: #94a3b8;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
