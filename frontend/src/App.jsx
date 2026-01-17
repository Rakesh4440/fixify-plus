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

  // ✅ USER STATE (UI only)
  const user = JSON.parse(localStorage.getItem('user') || 'null');

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

  function logout() {
    localStorage.removeItem('user');
    window.location.reload();
  }

  return (
    <div className="app">

      {/* ================= NAVBAR ================= */}
      <header className="navbar">
        <div className="nav-left">
          <span className="logo">Fixify+</span>
        </div>

        <nav className="nav-right">
          <Link to="/post" className="btn primary">Post Service</Link>

          {!user ? (
            <>
              <Link to="/login" className="link">Login</Link>
              <Link to="/register" className="link">Register</Link>
            </>
          ) : (
            <div className="user">
              <div className="avatar">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="username">{user.name || 'User'}</span>
              <button onClick={logout} className="logout">Logout</button>
            </div>
          )}
        </nav>
      </header>

      {/* ================= HERO ================= */}
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

            <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <input placeholder="Area" value={area} onChange={(e) => setArea(e.target.value)} />
            <input placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} />

            <button type="submit">Search</button>
          </form>
        </div>
      </section>

      {/* ================= RESULTS ================= */}
      <section className="results">
        {loading ? (
          <p className="muted">Loading listings...</p>
        ) : (
          <div className="grid">
            {items.map(it => <ListingCard key={it._id} item={it} />)}
          </div>
        )}
      </section>

      <Footer />

      {/* ================= STYLES ================= */}
      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(12px);
          padding: 14px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
        }

        .logo {
          font-size: 22px;
          font-weight: 800;
          color: #4f46e5;
        }

        .nav-right {
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .link {
          text-decoration: none;
          font-weight: 600;
          color: #444;
        }

        .btn.primary {
          background: linear-gradient(135deg, #6366f1, #9333ea);
          color: #fff;
          padding: 8px 16px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 700;
        }

        .user {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #ec4899);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .username {
          font-weight: 600;
          font-size: 14px;
        }

        .logout {
          border: none;
          background: #eef2ff;
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
