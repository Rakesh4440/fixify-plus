import { useState } from 'react';
import { api } from '../services/api.js';
import { getCurrentUser } from '../services/session.js';

export default function BookingPanel({ listingId, listingTitle, onBooked }) {
  const me = getCurrentUser();
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!me?.token) {
      setMsg('Please login to book this service.');
      return;
    }

    try {
      setLoading(true);
      setMsg('');
      await api('/bookings', {
        method: 'POST',
        token: me.token,
        body: { listingId, date, notes }
      });
      setMsg(`Booking request sent for ${listingTitle}.`);
      setDate('');
      setNotes('');
      onBooked?.();
    } catch (error) {
      setMsg(error.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel booking-panel">
      <h3>Book Service</h3>
      <form onSubmit={onSubmit} className="booking-form">
        <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
        <textarea
          rows="3"
          placeholder="Preferred time, address notes, or special requests"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button className="btn" disabled={loading}>
          {loading ? 'Booking…' : 'Book Service'}
        </button>
      </form>
      {msg ? <p className="muted">{msg}</p> : null}
    </section>
  );
}

