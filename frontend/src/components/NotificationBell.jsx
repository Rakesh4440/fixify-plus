import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { getCurrentUser } from '../services/session.js';

export default function NotificationBell() {
  const me = getCurrentUser();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  async function load() {
    if (!me?.token) return;
    try {
      const data = await api('/notifications', { token: me.token });
      setItems(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch (_err) {
      // Silent by design so navbar stays resilient.
    }
  }

  useEffect(() => {
    load();
  }, [me?.token]);

  if (!me?.token) return null;

  return (
    <div className="notif-wrap">
      <button className="notif-btn" type="button" onClick={() => setOpen((value) => !value)}>
        <span aria-hidden="true">🔔</span>
        {unread ? <span className="notif-count">{unread}</span> : null}
      </button>

      {open ? (
        <div className="notif-panel">
          <div className="notif-header">
            <strong>Notifications</strong>
            <button
              className="btn ghost"
              type="button"
              onClick={async () => {
                await api('/notifications/read-all', { method: 'PATCH', token: me.token });
                load();
              }}
            >
              Mark all read
            </button>
          </div>

          {items.length ? (
            <ul className="notif-list">
              {items.map((item) => (
                <li key={item._id} className={item.isRead ? 'notif-item' : 'notif-item unread'}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.message}</p>
                  </div>
                  {!item.isRead ? (
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={async () => {
                        await api(`/notifications/${item._id}/read`, { method: 'PATCH', token: me.token });
                        load();
                      }}
                    >
                      Read
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No notifications yet.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

