import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ListingCard from './components/ListingCard.jsx';
import Footer from './components/Footer.jsx';

const API = import.meta.env.VITE_API_URL;

export default function App() {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [pages, setPages] = useState(1);
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
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [page]);

  function onSearch(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  return (
    <div className="app">
      {/* NAVBAR */}
      <header className="navbar">
        <h1>Fixify+ 🛠️</h1>
        <nav>
          <Link to="/post" className="btn primary">Post Listing</Link>
          <Link to="/login" className="link">Login</Link>
          <Link to="/register" className="link">Register</Link>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-inner">
          <span className="badge">🚀 Trusted by local professionals</span>

          <h2>
            Find & Book <br />
            <span>Local Services & Rentals</span>
          </h2>

          <p>
            Discover verified professionals for plumbing, cleaning, electrical
            work, rentals, and more — all in one place.
          </p>

          {/* SEARCH BAR */}
          <form className="hero-search" onSubmit={onSearch}>
            <input
              placeholder="Search service (plumber, cook...)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              <option value="service">Service</option>
              <option value="rental">Rental</option>
            </select>

            <input
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <input
              placeholder="Area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />

            <input
              placeholder="Pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
            />

            <button type="submit">Search</button>
          </form>
        </div>
      </section>

      {/* LISTINGS */}
      <section className="results">
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
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </button>
              <span>Page {page} / {pages}</span>
              <button
                disabled={page === pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <p className="muted">No listings found</p>
        )}
      </section>

      <Footer />

      {/* STYLES */}
      <style>{`
        .app {
          background: #f8fafc;
          min-height: 100vh;
        }

        /* NAVBAR */
        .navbar {
          position: sticky;
          top: 0;
          z-index: 10;
          background: #fff;
          padding: 14px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
        }

        .navbar h1 {
          margin: 0;
          font-size: 20px;
        }

        nav {
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .link {
          text-decoration: none;
          color: #333;
          font-weight: 600;
        }

        .btn.primary {
          background: #6366f1;
          color: #fff;
          padding: 8px 14px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 700;
        }

        /* HERO */
        .hero {
          background: linear-gradient(135deg, #eef2ff, #fdf4ff);
          padding: 80px 20px 100px;
          text-align: center;
        }

        .hero-inner {
          max-width: 1000px;
          margin: auto;
        }

        .badge {
          display: inline-block;
          background: #fff;
          padding: 6px 12px;
          border-radius: 999px;
          font-weight: 600;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .hero h2 {
          font-size: 42px;
          margin: 12px 0;
          font-weight: 800;
        }

        .hero h2 span {
          color: #6366f1;
        }

        .hero p {
          color: #555;
          font-size: 16px;
          max-width: 700px;
          margin: 0 auto 30px;
        }

        /* SEARCH */
        .hero-search {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
          gap: 12px;
          background: #fff;
          padding: 16px;
          border-radius: 18px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .hero-search input,
        .hero-search select {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          font-size: 14px;
        }

        .hero-search button {
          background: #4f46e5;
          color: #fff;
          border: none;
          padding: 12px 20px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        /* RESULTS */
        .results {
          padding: 40px 20px;
        }

        .grid {
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        }

        .pager {
          margin-top: 24px;
          display: flex;
          justify-content: center;
          gap: 12px;
        }

        .pager button {
          padding: 8px 14px;
          border-radius: 10px;
          border: none;
          background: #e0e7ff;
          cursor: pointer;
          font-weight: 600;
        }

        .muted {
          text-align: center;
          color: #777;
        }

        @media (max-width: 900px) {
          .hero-search {
            grid-template-columns: 1fr 1fr;
          }

          .hero h2 {
            font-size: 32px;
          }
        }
      `}</style>
    </div>
  );
}
