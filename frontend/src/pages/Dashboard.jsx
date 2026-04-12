import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';

function getCurrentUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.id, role: payload.role, token };
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const me = useMemo(() => getCurrentUser(), []);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      if (!me) {
        setLoading(false);
        return;
      }

      try {
        const data = await api('/listings?limit=200&page=1');
        const all = data.items || [];
        const mine = me.role === 'admin' ? all : all.filter((it) => String(it.postedBy) === String(me.id));
        setItems(mine);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [me]);

  const totalListings = items.length;
  const serviceCount = items.filter((it) => it.type === 'service').length;
  const rentalCount = items.filter((it) => it.type === 'rental').length;
  const totalReviews = items.reduce((sum, it) => sum + (it.reviews?.length || 0), 0);

  const avgRating = (() => {
    const ratings = items.flatMap((it) => (it.reviews || []).map((r) => r.rating)).filter(Boolean);
    if (!ratings.length) return '-';
    return (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1);
  })();

  if (!me) {
    return (
      <div className="dashboard-wrap">
        <h1>Dashboard</h1>
        <p className="muted">Please login to view recruiter-ready analytics.</p>
        <Link to="/login" className="btn">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="dashboard-wrap">
      <h1>Performance Dashboard</h1>
      <p className="muted">Track your listing portfolio health and response readiness.</p>

      {loading ? <p className="muted">Loading dashboard insights...</p> : null}
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      {!loading && !error && (
        <>
          <section className="dashboard-grid">
            <article className="kpi-card"><h4>Active Listings</h4><p>{totalListings}</p></article>
            <article className="kpi-card"><h4>Service Listings</h4><p>{serviceCount}</p></article>
            <article className="kpi-card"><h4>Rental Listings</h4><p>{rentalCount}</p></article>
            <article className="kpi-card"><h4>Review Count</h4><p>{totalReviews}</p></article>
          </section>

          <section className="panel">
            <h3>Quality Signals</h3>
            <p className="muted">Average rating across received reviews: <strong>{avgRating}</strong></p>
            <p className="muted">Tip: keep photos and location fields complete to improve conversion.</p>
          </section>

          <section className="panel">
            <h3>Recent Listings</h3>
            {!items.length ? (
              <p className="muted">No listings yet. Post one to start building traction.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Reviews</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice(0, 8).map((it) => (
                    <tr key={it._id}>
                      <td>{it.title}</td>
                      <td>{it.type}</td>
                      <td>{[it.area, it.city].filter(Boolean).join(', ') || '-'}</td>
                      <td>{it.reviews?.length || 0}</td>
                      <td><Link to={`/listing/${it._id}`} className="btn ghost">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
