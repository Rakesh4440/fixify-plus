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

      {/* ================= SEARCH FILTERS ================= */}
      <form className="filters" onSubmit={onSearch}>
        <input
          placeholder="Search keyword…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          <option value="service">Service</option>
          <option value="rental">Rental</option>
        </select>

        <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <input placeholder="Area" value={area} onChange={(e) => setArea(e.target.value)} />
        <input placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} />

        <button className="btn" type="submit">Search</button>
      </form>

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
          display: flex;
          flex-direction: column;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          background: #fff;
          border-bottom: 1px solid #eee;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .topbar h1 {
          margin: 0;
          font-size: 20px;
        }

        nav {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .filters {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
          gap: 10px;
          padding: 14px 16px;
          background: #fff;
          border-bottom: 1px solid #eee;
        }

        input, select {
          padding: 10px 12px;
          border: 1px solid #e3e6ee;
          background: #fbfdff;
          border-radius: 10px;
          outline: none;
          font-size: 14px;
        }

        input:focus, select:focus {
          border-color: #6b5cff;
          box-shadow: 0 0 0 3px rgba(107,92,255,0.15);
          background: #fff;
        }

        .grid {
          padding: 16px;
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        }

        .pager {
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: center;
          padding: 20px 0 30px;
        }

        .empty {
          padding: 40px 16px;
          text-align: center;
        }

        .muted {
          color: #777;
        }

        .btn {
          background: #574bff;
          color: #fff;
          border: none;
          padding: 10px 14px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          text-decoration: none;
        }

        .btn.ghost {
          background: #eef0ff;
          color: #393a7c;
        }

        .lnk {
          color: #333;
          text-decoration: none;
          font-weight: 600;
        }

        @media (max-width: 960px) {
          .filters {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}
