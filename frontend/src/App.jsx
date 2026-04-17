import { useEffect, useRef, useState } from 'react';
import ListingCard from './components/ListingCard.jsx';
import SkeletonCard from './components/SkeletonCard.jsx';
import SearchSuggestions from './components/SearchSuggestions.jsx';
import { api } from './services/api.js';
import { getCurrentUser } from './services/session.js';

const quickFilters = [
  { label: 'Emergency Electrician', q: 'electrician' },
  { label: 'House Cleaning', q: 'cleaning' },
  { label: 'Bike Rentals', q: 'bike', type: 'rental' },
  { label: 'Plumbing', q: 'plumber', type: 'service' }
];

export default function App() {
  const me = getCurrentUser();
  const sentinelRef = useRef(null);
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
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [nearby, setNearby] = useState(null);

  async function load(nextPage = 1, replace = true) {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        ...(q && { q }),
        ...(type && { type }),
        ...(city && { city }),
        ...(area && { area }),
        ...(pincode && { pincode }),
        ...(nearby?.lat ? { nearLat: nearby.lat } : {}),
        ...(nearby?.lng ? { nearLng: nearby.lng } : {}),
        page: String(nextPage),
        limit: '8'
      });

      const data = await api(`/listings?${params.toString()}`, { token: me?.token });
      setItems((current) => (replace ? (data.items || []) : [...current, ...(data.items || [])]));
      setPages(data.pages || 1);
      setTotal(data.total || 0);
      setPage(nextPage);
    } catch (err) {
      setError(err.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, true);
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await api(`/listings/suggestions?q=${encodeURIComponent(q)}`);
        setSuggestions(data.suggestions || []);
      } catch (_err) {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !loading && page < pages) {
        load(page + 1, false);
      }
    }, { rootMargin: '220px' });

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading, page, pages, q, type, city, area, pincode, nearby]);

  function onSearch(e) {
    e.preventDefault();
    load(1, true);
  }

  function applyQuickFilter(filter) {
    setQ(filter.q || '');
    setType(filter.type || '');
    setTimeout(() => load(1, true), 0);
  }

  return (
    <>
      <section className="hero-section">
        <div className="hero">
          <div className="hero-content">
            <span className="badge">Production-ready local marketplace UX</span>
            <h1>
              Discover trusted neighborhood help in <span>minutes</span>
            </h1>
            <p>
              Search by location, see nearby providers, book services, chat instantly, and track performance from a recruiter-ready dashboard.
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
              <span>Visible cards</span>
              <strong>{items.length}</strong>
            </div>
            <div className="metric-card">
              <span>Search mode</span>
              <strong>{nearby ? 'Nearby' : 'Global'}</strong>
            </div>
          </div>
        </div>

        <form className="hero-search" onSubmit={onSearch}>
          <div className="field field-stack">
            <div className="field-inline">
              <span>🔍</span>
              <input
                placeholder="Search service, category, or area"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <SearchSuggestions
              suggestions={suggestions}
              onSelect={(value) => {
                setQ(value);
                setSuggestions([]);
                setTimeout(() => load(1, true), 0);
              }}
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

          <div className="search-actions">
            <button className="search-btn" type="submit">Search</button>
            <button
              className="btn ghost"
              type="button"
              onClick={() => {
                navigator.geolocation?.getCurrentPosition(
                  (position) => {
                    setNearby({
                      lat: position.coords.latitude,
                      lng: position.coords.longitude
                    });
                    setTimeout(() => load(1, true), 0);
                  },
                  () => setError('Unable to get your location right now.')
                );
              }}
            >
              Nearby
            </button>
          </div>
        </form>
      </section>

      <section className="results-section">
        <div className="results-header">
          <h2>Featured Listings</h2>
          <p>{loading && !items.length ? 'Refreshing listings...' : `${total} listings found`}</p>
        </div>

        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

        <div className="grid">
          {items.map((it) => (
            <ListingCard key={it._id} item={it} />
          ))}
          {loading && !items.length ? Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />) : null}
        </div>

        {!loading && !items.length && !error ? (
          <p className="muted">No listings found.</p>
        ) : null}

        {page < pages ? <div ref={sentinelRef} style={{ height: 10 }} /> : null}
      </section>

      <section className="trust-strip">
        <article>
          <h3>Fast discovery</h3>
          <p>Autocomplete, nearby sorting, and infinite loading keep the marketplace easy to browse.</p>
        </article>
        <article>
          <h3>Direct conversion</h3>
          <p>WhatsApp and Call buttons remain intact while bookings and chat add stronger lead capture.</p>
        </article>
        <article>
          <h3>Operational depth</h3>
          <p>Admin oversight, analytics, notifications, and reporting now support a more production-ready workflow.</p>
        </article>
      </section>
    </>
  );
}
