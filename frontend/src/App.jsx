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
      ...(q ? { q } : {}),
      ...(type ? { type } : {}),
      ...(city ? { city } : {}),
      ...(area ? { area } : {}),
      ...(pincode ? { pincode } : {}),
      page: String(page),
      limit: '12'
    });

    const res = await fetch(`${API}/listings?${params.toString()}`);
    const data = await res.json();

    setItems(data.items || []);
    setPages(data.pages || 1);
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

  return (
    <div className="wrap">
      {/* ================= NAVBAR ================= */}
      <header className="topbar">
        <h1>Fixify+ 🛠️</h1>
        <nav>
          <Link to="/post" className="btn">Post Listing</Link>
          <Link to="/login" className="lnk">Login</Link>
          <Link to="/register" className="lnk">Register</Link>
        </nav>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="hero">
        <span className="hero-badge">Trusted Local Marketplace</span>

        <h2>
          Find Trusted <span>Local Services</span><br />
          & Community Rentals
        </h2>

        <p>
          Discover verified professionals for plumbing, cleaning,
          electrical work, rentals, and more — all in one place.
        </p>

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

          <button className="btn">Search</button>
        </form>
      </section>

      {/* ================= LISTINGS ================= */}
      {loading ? (
        <p className="muted" style={{ padding: '16px' }}>Loading listings…</p>
      ) : items.length ? (
        <>
          <div className="grid">
            {items.map((it) => (
              <ListingCard key={it._id} item={it} />
            ))}
          </div>

          <div className="pager">
            <button
              className="btn ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </button>

            <span>Page {page} / {pages}</span>

            <button
              className="btn ghost"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="empty">
          <h3>No results</h3>
          <p className="muted">
            Try changing filters or post the first listing in your area.
          </p>
          <Link to="/post" className="btn">Post a listing</Link>
        </div>
      )}

      {/* ================= FOOTER ================= */}
      <Footer />

      {/* ================= STYLES ================= */}
      <style>{`
        .wrap {
          min-height: 100vh;
          background: #f7f8fb;
        }

        /* NAVBAR */
        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          background: #fff;
          border-bottom: 1px solid #eee;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        nav {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        /* HERO */
        .hero {
          margin: 20px;
          padding: 50px 30px;
          border-radius: 28px;
          background: linear-gradient(
            135deg,
            #eef2ff 0%,
            #ffffff 40%,
            #e0f2fe 100%
          );
          text-align: center;
        }

        .hero-badge {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 999px;
          background: #eef2ff;
          color: #3730a3;
          font-weight: 700;
          font-size: 13px;
          margin-bottom: 14px;
        }

        .hero h2 {
          font-size: 42px;
          line-height: 1.2;
          margin: 10px 0;
          color: #0f172a;
        }

        .hero h2 span {
          color: #4f46e5;
        }

        .hero p {
          max-width: 700px;
          margin: 0 auto 24px;
          color: #64748b;
          font-size: 16px;
        }

        .hero-search {
          max-width: 900px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr auto;
          gap: 12px;
          background: #fff;
          padding: 14px;
          border-radius: 18px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
        }

        /* COMMON */
        input, select {
          padding: 12px 14px;
          border: 1px solid #e3e6ee;
          border-radius: 12px;
          font-size: 14px;
        }

        .grid {
          padding: 24px;
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        }

        .pager {
          display: flex;
          justify-content: center;
          gap: 12px;
          padding: 20px 0 30px;
        }

        .btn {
          background: #4f46e5;
          color: #fff;
          border: none;
          padding: 10px 16px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
        }

        .btn.ghost {
          background: #eef2ff;
          color: #3730a3;
        }

        .lnk {
          color: #333;
          font-weight: 600;
          text-decoration: none;
        }

        .muted {
          color: #64748b;
        }

        @media (max-width: 900px) {
          .hero h2 {
            font-size: 30px;
          }
          .hero-search {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
