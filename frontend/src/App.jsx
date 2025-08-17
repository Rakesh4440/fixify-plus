import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ListingCard from './components/ListingCard.jsx';
import { api } from './services/api.js';

export default function App() {
  const [q, setQ] = useState('');
  const [type, setType] = useState('all'); // all | service | rental
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchListings() {
    setLoading(true);
    try {
      const qs = [];
      if (q) qs.push(`q=${encodeURIComponent(q)}`);
      if (category) qs.push(`category=${encodeURIComponent(category)}`);
      if (type !== 'all') qs.push(`type=${encodeURIComponent(type)}`);
      if (city) qs.push(`city=${encodeURIComponent(city)}`);
      if (area) qs.push(`area=${encodeURIComponent(area)}`);
      if (pincode) qs.push(`pincode=${encodeURIComponent(pincode)}`);
      const query = qs.length ? `?${qs.join('&')}` : '';
      const data = await api(`/listings${query}`);
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchListings(); // initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e) {
    e.preventDefault();
    fetchListings();
  }

  function clearFilters() {
    setQ(''); setCategory(''); setType('all'); setCity(''); setArea(''); setPincode('');
    // re-run
    setTimeout(fetchListings, 0);
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

      {/* Hero */}
      <div className="hero">
        <h1>Find trusted local help & rentals</h1>
        <p className="muted">Community-verified services and peer-to-peer rentals. Call or WhatsApp directly — no middlemen.</p>

        {/* Search / filters */}
        <form onSubmit={onSubmit} className="grid" style={{gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr auto', gap: 10}}>
          <input
            className="input"
            placeholder="Search e.g., plumber, maid, bicycle…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <input
            className="input"
            placeholder="Category (e.g., plumbing, cook)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
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

        <div style={{ marginTop: 10 }}>
          <button className="btn ghost" type="button" onClick={clearFilters}>Clear filters</button>
        </div>
      </div>

      {/* Results */}
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginTop:24 }}>
        <h2 style={{ margin:0 }}>Browse Listings</h2>
        <span className="muted">{loading ? 'Loading…' : `${items.length} result(s)`}</span>
      </div>

      <div className="grid cols-3" style={{ marginTop:16 }}>
        {!loading && items.map(item => (
          <ListingCard key={item._id} item={item} />
        ))}
        {(!loading && items.length === 0) && (
          <div className="card" style={{ gridColumn:'1/-1' }}>
            <b>No results.</b> Try clearing filters or posting a new listing.
          </div>
        )}
      </div>
    </div>
  );
}
