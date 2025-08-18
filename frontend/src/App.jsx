import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ListingCard from './components/ListingCard.jsx';
import { api } from './services/api.js';

export default function App() {
  // filters
  const [q, setQ] = useState('');
  const [type, setType] = useState('all'); // all | service | rental
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');

  // data + pagination
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit, setLimit] = useState(12); // <-- page size

  const [loading, setLoading] = useState(false);

  async function fetchListings(nextPage = page, nextLimit = limit) {
    setLoading(true);
    try {
      const qs = [];
      if (q) qs.push(`q=${encodeURIComponent(q)}`);
      if (category) qs.push(`category=${encodeURIComponent(category)}`);
      if (type !== 'all') qs.push(`type=${encodeURIComponent(type)}`);
      if (city) qs.push(`city=${encodeURIComponent(city)}`);
      if (area) qs.push(`area=${encodeURIComponent(area)}`);
      if (pincode) qs.push(`pincode=${encodeURIComponent(pincode)}`);
      qs.push(`page=${nextPage}`);
      qs.push(`limit=${nextLimit}`);

      const query = `?${qs.join('&')}`;
      const data = await api(`/listings${query}`);

      setItems(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setPages(data.pages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchListings(1, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchListings(1, limit);
  }

  function clearFilters() {
    setQ(''); setCategory(''); setType('all'); setCity(''); setArea(''); setPincode('');
    setPage(1);
    fetchListings(1, limit);
  }

  function gotoPage(p) {
    if (p < 1 || p > pages || p === page) return;
    setPage(p);
    fetchListings(p, limit);
  }

  function changePageSize(e) {
    const next = parseInt(e.target.value, 10) || 12;
    setLimit(next);
    setPage(1);
    fetchListings(1, next);
  }

  return (
    <div className="container">
      {/* Top nav */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
        <div style={{ fontWeight:800, fontSize:22 }}>
          Fixify+ <span style={{fontSize:18}}>🛠️</span>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:10 }}>
          <Link className="btn ghost" to="/login">Login</Link>
          <Link className="btn" to="/register">Sign up</Link>
          <Link className="btn" to="/post">Post Listing</Link>
        </div>
      </div>

      {/* Hero & Filters */}
      <div className="hero">
        <h1>Find trusted local help & rentals</h1>
        <p className="muted">Community-verified services and peer-to-peer rentals. Call or WhatsApp directly — no middlemen.</p>

        <form onSubmit={onSubmit} className="grid" style={{gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr auto', gap: 10}}>
          <input className="input" placeholder="Search e.g., plumber, maid, bicycle…" value={q} onChange={(e) => setQ(e.target.value)} />
          <input className="input" placeholder="Category (e.g., plumbing, cook)" value={category} onChange={(e) => setCategory(e.target.value)} />
          <input className="input" placeholder="City" value={city} onChange={(e)=>setCity(e.target.value)} />
          <input className="input" placeholder="Area" value={area} onChange={(e)=>setArea(e.target.value)} />
          <input className="input" placeholder="Pincode" value={pincode} onChange={(e)=>setPincode(e.target.value)} />
          <select className="select" value={type} onChange={(e)=>setType(e.target.value)}>
            <option value="all">All types</option>
            <option value="service">Services</option>
            <option value="rental">Rentals</option>
          </select>
          <button className="btn" type="submit">Search</button>
        </form>

        <div style={{ marginTop: 10, display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <button className="btn ghost" type="button" onClick={clearFilters}>Clear filters</button>

          {/* Page size */}
          <div style={{ marginLeft: 'auto' }}>
            <label className="muted" style={{ marginRight: 8 }}>Page size:</label>
            <select className="select" value={limit} onChange={changePageSize}>
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={18}>18</option>
              <option value={24}>24</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results header */}
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginTop:24 }}>
        <h2 style={{ margin:0 }}>Browse Listings</h2>
        <span className="muted">
          {loading ? 'Loading…' : `${total} result(s) • Page ${page} of ${pages}`}
        </span>
      </div>

      {/* Results grid */}
      <div className="grid cols-3" style={{ marginTop:16 }}>
        {!loading && items.map(item => (
          <ListingCard key={item._id} item={item} />
        ))}
        {loading && Array.from({ length: Math.min(limit, 9) }).map((_, i) => (
          <div key={i} className="card" style={{ height: 260, background: 'linear-gradient(90deg,#eee 25%,#f5f5f5 37%,#eee 63%)', backgroundSize: '400% 100%', animation: 'shine 1.2s ease-in-out infinite' }} />
        ))}
        {(!loading && items.length === 0) && (
          <div className="card" style={{ gridColumn:'1/-1' }}>
            <b>No results.</b> Try clearing filters or posting a new listing.
          </div>
        )}
      </div>

      {/* Pager */}
      {pages > 1 && (
        <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'center', margin: '18px 0 32px' }}>
          <button className="btn ghost" disabled={page <= 1} onClick={() => gotoPage(page - 1)}>← Prev</button>
          <span className="pill">Page {page} / {pages}</span>
          <button className="btn ghost" disabled={page >= pages} onClick={() => gotoPage(page + 1)}>Next →</button>
        </div>
      )}

      {/* skeleton animation keyframes */}
      <style>{`
        @keyframes shine {
          0% { background-position: 0% 0; }
          100% { background-position: 135% 0; }
        }
      `}</style>
    </div>
  );
}
