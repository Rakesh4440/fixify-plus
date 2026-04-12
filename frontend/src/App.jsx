import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ListingCard from './components/ListingCard.jsx';
import Footer from './components/Footer.jsx';

const API = import.meta.env.VITE_API_URL;

const quickFilters = [
  { label: 'Emergency Electrician', q: 'electrician' },
  { label: 'House Cleaning', q: 'cleaning' },
  { label: 'Bike Rentals', q: 'bike', type: 'rental' },
  { label: 'Plumbing', q: 'plumber', type: 'service' }
];

function decodeUserToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { token, role: payload.role, id: payload.id };
  } catch {
    return null;
  }
}

export default function App() {
  const me = useMemo(() => decodeUserToken(), []);

  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);

    const params = new URLSearchParams({
      ...(q && { q }),
      ...(type && { type }),
      ...(city && { city }),
      ...(area && { area }),
      ...(pincode && { pincode }),
      page,
      limit: 12
    });

    const res = await fetch(`${API}/listings?${params}`);
    const data = await res.json();

    setItems(data.items || []);
    setPages(data.pages || 1);
    setTotal(data.total || 0);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function onSearch(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  function applyQuickFilter(filter) {
    setQ(filter.q || '');
    setType(filter.type || '');
    setPage(1);

    setTimeout(() => {
      load();
    }, 0);
  }

  return (
    <div className="page-shell">
      <header className="navbar">
        <div className="brand">
          <div className="logo-chip">F+</div>
          <div>
            <div className="brand-title">Fixify+</div>
            <div className="brand-sub">Local Services & Rentals</div>
          </div>
        </div>

        <nav className="nav-links">
          <Link to="/" className="link">Home</Link>
          <Link to="/post" className="link">Post Service</Link>
          <Link to="/dashboard" className="link">Dashboard</Link>
        </nav>

        <div className="nav-right">
          {me ? (
            <>
              <div className="avatar">{me.role?.[0]?.toUpperCase() || 'U'}</div>
              <button
                className="logout"
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.reload();
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="link">Login</Link>
              <Link to="/register" className="link">Register</Link>
            </>
          )}
        </div>
      </header>

      <section className="hero-section">
        <div className="hero">
          <div className="hero-content">
            <span className="badge">🚀 Production-ready local marketplace UX</span>
            <h1>
              Book trusted local help in <span>minutes</span>
            </h1>
            <p>
              Discover nearby professionals, compare options, and connect instantly through call or WhatsApp.
            </p>

            <div className="quick-filters">
              {quickFilters.map((filter) => (
                <button key={filter.label} type="button" className="quick-chip" onClick={() => applyQuickFilter(filter)}>
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hero-metrics">
            <div className="metric-card">
              <span>Total listings</span>
              <strong>{total}</strong>
            </div>
            <div className="metric-card">
              <span>Available cities</span>
              <strong>{new Set(items.map((it) => it.city).filter(Boolean)).size || '-'}</strong>
            </div>
            <div className="metric-card">
              <span>Community posts</span>
              <strong>{items.filter((it) => it.isCommunityPosted).length}</strong>
            </div>
          </div>
        </div>

        <form className="hero-search" onSubmit={onSearch}>
          <div className="field">
            <span>🔍</span>
            <input
              placeholder="Search service (plumber, cook...)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="field">
            <span>🧰</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              <option value="service">Service</option>
              <option value="rental">Rental</option>
            </select>
          </div>

          <div className="field">
            <span>🏙️</span>
            <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>

          <div className="field">
            <span>📍</span>
            <input placeholder="Area" value={area} onChange={(e) => setArea(e.target.value)} />
          </div>

          <div className="field">
            <span>📮</span>
            <input placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} />
          </div>

          <button className="search-btn" type="submit">Search</button>
        </form>
      </section>

      <section className="results-section">
        <div className="results-header">
          <h2>Featured Listings</h2>
          <p>{loading ? 'Refreshing listings...' : `${total} listings found`}</p>
        </div>

        {loading ? (
          <p className="muted">Loading listings...</p>
        ) : items.length ? (
          <>
            <div className="grid">
              {items.map((it) => (
                <ListingCard key={it._id} item={it} />
              ))}
            </div>

            <div className="pager">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
              <span>Page {page} / {pages}</span>
              <button disabled={page === pages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </>
        ) : (
          <p className="muted">No listings found.</p>
        )}
      </section>

      <section className="trust-strip">
        <article>
          <h3>Fast discovery</h3>
          <p>Optimized filtering with category, city, area, and pincode targeting.</p>
        </article>
        <article>
          <h3>Direct conversion</h3>
          <p>Integrated click-to-call and WhatsApp CTAs for higher lead response rates.</p>
        </article>
        <article>
          <h3>Community-ready</h3>
          <p>Supports verified providers and neighborhood-posted opportunities.</p>
        </article>
      </section>

      <Footer />
    </div>
  );
}
