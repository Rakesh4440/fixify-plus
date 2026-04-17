import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { getCurrentUser } from '../services/session.js';

export default function Dashboard() {
  const me = useMemo(() => getCurrentUser(), []);
  const [params, setParams] = useSearchParams();
  const activeTab = params.get('tab') || 'overview';
  const selectedSender = params.get('sender') || '';
  const [items, setItems] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminListings, setAdminListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      if (!me?.token) {
        setLoading(false);
        return;
      }

      try {
        const [listingData, bookingData, conversationData] = await Promise.all([
          api('/listings?limit=200&page=1', { token: me.token }),
          api('/bookings/mine', { token: me.token }),
          api('/conversations', { token: me.token })
        ]);

        const all = listingData.items || [];
        const mine = me.role === 'admin'
          ? all
          : all.filter((it) => String(it.postedBy?._id || it.postedBy) === String(me.id));
        setItems(mine);
        setBookings(bookingData.bookings || []);
        setConversations(conversationData.conversations || []);

        if (me.role === 'admin') {
          const [statsRes, usersRes, listingsRes, reportsRes] = await Promise.all([
            api('/admin/stats', { token: me.token }),
            api('/admin/users', { token: me.token }),
            api('/admin/listings', { token: me.token }),
            api('/admin/reports', { token: me.token })
          ]);
          setAdminStats(statsRes.totals);
          setAdminUsers(usersRes.users || []);
          setAdminListings(listingsRes.listings || []);
          setReports(reportsRes.reports || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [me?.token]);

  useEffect(() => {
    if (!selectedSender || !conversations.length) return;

    const match = conversations.find((conversation) =>
      conversation.participants?.some((participant) => String(participant._id) === String(selectedSender))
    );

    if (!match) return;

    (async () => {
      setSelectedConversation(match);
      const data = await api(`/conversations/${match._id}/messages`, { token: me.token });
      setMessages(data.messages || []);
    })();
  }, [conversations, me?.token, selectedSender]);

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
      <div className="results-header">
        <div>
          <h1>Performance Dashboard</h1>
          <p className="muted">Track listings, bookings, conversations, notifications, and admin operations from one place.</p>
        </div>

        <div className="tab-row">
          {['overview', 'bookings', 'messages', ...(me.role === 'admin' ? ['admin'] : [])].map((tab) => (
            <button key={tab} className={activeTab === tab ? 'tab active' : 'tab'} onClick={() => setParams({ tab })}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p className="muted">Loading dashboard insights...</p> : null}
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      {!loading && !error && activeTab === 'overview' ? (
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
            <p className="muted">Tip: listings with location coordinates, images, and fast chat replies convert best.</p>
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
                    <th>Views</th>
                    <th>Bookmarks</th>
                    <th>Reviews</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice(0, 8).map((it) => (
                    <tr key={it._id}>
                      <td>{it.title}</td>
                      <td>{it.type}</td>
                      <td>{it.viewsCount || 0}</td>
                      <td>{it.favoritesCount || 0}</td>
                      <td>{it.reviews?.length || 0}</td>
                      <td><Link to={`/listing/${it._id}`} className="btn ghost">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      ) : null}

      {!loading && !error && activeTab === 'bookings' ? (
        <section className="panel">
          <h3>Booking History</h3>
          {!bookings.length ? <p className="muted">No bookings yet.</p> : (
            <table>
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>{booking.listingId?.title || 'Listing deleted'}</td>
                    <td>{new Date(booking.date).toLocaleString()}</td>
                    <td>{booking.status}</td>
                    <td>{booking.paymentStatus}</td>
                    <td>
                      {String(booking.providerId?._id || booking.providerId) === String(me.id) && booking.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn ghost"
                            onClick={async () => {
                              await api(`/bookings/${booking._id}/status`, {
                                method: 'PATCH',
                                token: me.token,
                                body: { status: 'accepted', paymentStatus: booking.paymentStatus }
                              });
                              window.location.reload();
                            }}
                          >
                            Accept
                          </button>
                          <button
                            className="btn ghost"
                            onClick={async () => {
                              await api(`/bookings/${booking._id}/status`, {
                                method: 'PATCH',
                                token: me.token,
                                body: { status: 'rejected', paymentStatus: booking.paymentStatus }
                              });
                              window.location.reload();
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      {!loading && !error && activeTab === 'messages' ? (
        <section className="panel">
          <h3>Conversations</h3>
          {!conversations.length ? <p className="muted">No conversations yet. Open a listing and start chatting.</p> : (
            <div className="dashboard-chat">
              <ul className="conversation-list">
                {conversations.map((conversation) => (
                  <li key={conversation._id}>
                    <button
                      className={selectedConversation?._id === conversation._id ? 'conversation-btn active' : 'conversation-btn'}
                      onClick={async () => {
                        setSelectedConversation(conversation);
                        const data = await api(`/conversations/${conversation._id}/messages`, { token: me.token });
                        setMessages(data.messages || []);
                      }}
                    >
                      <strong>{conversation.listingId?.title || 'Listing'}</strong>
                      <p className="muted">{conversation.lastMessage || 'No messages yet'}</p>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="chat-window">
                {selectedConversation ? (
                  <>
                    <div className="chat-log">
                      {messages.map((message) => (
                        <div
                          key={message._id}
                          className={String(message.senderId) === String(me.id) ? 'bubble own' : 'bubble'}
                        >
                          {message.text}
                        </div>
                      ))}
                    </div>
                    <form
                      className="chat-form"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!messageDraft.trim()) return;
                        await api(`/conversations/${selectedConversation._id}/messages`, {
                          method: 'POST',
                          token: me.token,
                          body: { text: messageDraft }
                        });
                        const data = await api(`/conversations/${selectedConversation._id}/messages`, { token: me.token });
                        setMessages(data.messages || []);
                        setMessageDraft('');
                      }}
                    >
                      <input value={messageDraft} onChange={(e) => setMessageDraft(e.target.value)} placeholder="Reply here" />
                      <button className="btn">Send</button>
                    </form>
                  </>
                ) : (
                  <p className="muted">Choose a conversation to open the chat UI.</p>
                )}
              </div>
            </div>
          )}
        </section>
      ) : null}

      {!loading && !error && activeTab === 'admin' && me.role === 'admin' ? (
        <>
          <section className="dashboard-grid">
            <article className="kpi-card"><h4>Total Users</h4><p>{adminStats?.users || 0}</p></article>
            <article className="kpi-card"><h4>Total Listings</h4><p>{adminStats?.listings || 0}</p></article>
            <article className="kpi-card"><h4>Total Reviews</h4><p>{adminStats?.reviews || 0}</p></article>
            <article className="kpi-card"><h4>Total Bookings</h4><p>{adminStats?.bookings || 0}</p></article>
          </section>

          <section className="panel">
            <h3>Users</h3>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <button
                        className="btn ghost"
                        onClick={async () => {
                          await api(`/admin/users/${user._id}`, { method: 'DELETE', token: me.token });
                          window.location.reload();
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="panel">
            <h3>Listings & Reports</h3>
            <table>
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Owner</th>
                  <th>Reports</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {adminListings.map((listing) => (
                  <tr key={listing._id}>
                    <td>{listing.title}</td>
                    <td>{listing.postedBy?.name || 'Unknown'}</td>
                    <td>{listing.reportsCount || 0}</td>
                    <td>
                      <button
                        className="btn ghost"
                        onClick={async () => {
                          await api(`/admin/listings/${listing._id}`, { method: 'DELETE', token: me.token });
                          window.location.reload();
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 16 }}>
              <h4>Open Reports</h4>
              {reports.length ? reports.map((report) => (
                <div key={report._id} className="admin-report">
                  <strong>{report.listingId?.title}</strong>
                  <p className="muted">{report.reason}</p>
                  <button
                    className="btn ghost"
                    onClick={async () => {
                      await api(`/admin/reports/${report._id}`, {
                        method: 'PATCH',
                        token: me.token,
                        body: { status: 'reviewed' }
                      });
                      window.location.reload();
                    }}
                  >
                    Mark reviewed
                  </button>
                </div>
              )) : <p className="muted">No open reports.</p>}
            </div>

            <div style={{ marginTop: 16 }}>
              <h4>Review Moderation</h4>
              {adminListings.flatMap((listing) => (listing.reviews || []).map((review) => ({ listing, review }))).slice(0, 10).map(({ listing, review }) => (
                <div key={review._id} className="admin-report">
                  <strong>{listing.title}</strong>
                  <p className="muted">{review.comment || 'No comment'} • {review.rating}/5</p>
                  <button
                    className="btn ghost"
                    onClick={async () => {
                      await api(`/admin/reviews/${listing._id}/${review._id}`, {
                        method: 'PATCH',
                        token: me.token,
                        body: { isHidden: !review.isHidden }
                      });
                      window.location.reload();
                    }}
                  >
                    {review.isHidden ? 'Unhide review' : 'Hide review'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
