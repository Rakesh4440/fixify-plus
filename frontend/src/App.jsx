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

  // ✅ USER STATE (frontend only)
  const token = localStorage.getItem('token');
  const userInitial = 'R'; // later can decode from JWT

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
        <div className="brand">
          <div className="logo">F+</div>
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
          {token ? (
            <>
              <div className="avatar">{userInitial}</div>
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

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <span className="badge">🚀 Trusted by local professionals</span>

          <h2>
            Find & Book <br />
            <span>Local Services & Rentals</span>
          </h2>

          <p>
            Discover verified professionals for plumbing, cleaning,
            electrical work, rentals, and more — all in one place.
          </p>

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
    <input
      placeholder="City"
      value={city}
      onChange={(e) => setCity(e.target.value)}
    />
  </div>

  <div className="field">
    <span>📍</span>
    <input
      placeholder="Area"
      value={area}
      onChange={(e) => setArea(e.target.value)}
    />
  </div>

  <div className="field">
    <span>📮</span>
    <input
      placeholder="Pincode"
      value={pincode}
      onChange={(e) => setPincode(e.target.value)}
    />
  </div>

  <button className="search-btn" type="submit">
    Search
  </button>
</form>


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
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Prev
              </button>
              <span>Page {page} / {pages}</span>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)}>
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
          z-index: 20;
          background: #fff;
          padding: 14px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
        }

        .brand {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .logo {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          color: #fff;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-title {
          font-weight: 800;
          font-size: 18px;
        }

        .brand-sub {
          font-size: 12px;
          color: #777;
        }

        .nav-links {
          display: flex;
          gap: 16px;
        }

        .nav-right {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .link {
          text-decoration: none;
          color: #333;
          font-weight: 600;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #4f46e5;
          color: #fff;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logout {
          border: 2px solid #4f46e5;
          background: transparent;
          color: #4f46e5;
          padding: 6px 12px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
        }

        /* HERO */
        .hero {
          background: linear-gradient(135deg, #eef2ff, #fdf4ff);
          padding: 80px 20px 100px;
          text-align: center;
        }

        .hero h2 {
          font-size: 42px;
          font-weight: 800;
        }

        .hero h2 span {
          color: #6366f1;
        }

        .badge {
          background: #fff;
          padding: 6px 14px;
          border-radius: 999px;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 16px;
        }

        .hero-search {
          margin-top: 30px;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
          gap: 12px;
          background: #fff;
          padding: 16px;
          border-radius: 18px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .hero-search {
  align-items: center;
}

.field {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  padding: 10px 12px;
  border-radius: 14px;
}

.field span {
  font-size: 16px;
  opacity: 0.7;
}

.field input,
.field select {
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  width: 100%;
}

.search-btn {
  background: linear-gradient(135deg, #4f46e5, #9333ea);
  color: #fff;
  padding: 12px 22px;
  border-radius: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.search-btn:hover {
  transform: translateY(-1px);
}


        .hero-search input,
        .hero-search select {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .hero-search button {
          background: #4f46e5;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
        }

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
          background: #e0e7ff;
          border: none;
          padding: 8px 14px;
          border-radius: 10px;
          font-weight: 600;
        }

        .muted {
          color: #777;
          text-align: center;
        }

        @media (max-width: 900px) {
          .hero-search {
            grid-template-columns: 1fr 1fr;
          }

          .nav-links {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
