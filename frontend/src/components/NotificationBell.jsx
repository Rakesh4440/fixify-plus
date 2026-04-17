import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api, buildApiUrl } from '../services/api.js';
import { getCurrentUser } from '../services/session.js';

export default function NotificationBell() {
  const navigate = useNavigate();
  const me = getCurrentUser();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const panelRef = useRef(null);

  const visibleItems = useMemo(() => {
    const seen = new Set();
    return items.filter((item) => {
      if (!item?._id || seen.has(item._id)) return false;
      seen.add(item._id);
      return true;
    }).slice(0, 10);
  }, [items]);

  async function load() {
    if (!me?.token) return;

    try {
      setLoading(true);
      setError('');
      const response = await api('/notifications', { token: me.token });
      const data = response?.data || {};
      setItems(Array.isArray(data?.notifications) ? data.notifications : []);
      setUnread(Number(data?.unreadCount || 0));
    } catch (err) {
      setItems([]);
      setUnread(0);
      setError(err?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id) {
    try {
      const response = await api(`/notifications/${id}/read`, {
        method: 'PATCH',
        token: me.token
      });
      const updated = response?.data;
      setItems((current) => current.map((item) => (
        item._id === id ? { ...item, ...(updated || {}), isRead: true } : item
      )));
      setUnread((count) => Math.max(0, count - 1));
      return updated;
    } catch (err) {
      setError(err?.message || 'Failed to mark notification as read');
      return null;
    }
  }

  async function removeNotification(id) {
    try {
      const existing = items.find((item) => item._id === id);
      await api(`/notifications/${id}`, {
        method: 'DELETE',
        token: me.token
      });
      setItems((current) => current.filter((item) => item._id !== id));
      if (existing && !existing.isRead) {
        setUnread((count) => Math.max(0, count - 1));
      }
    } catch (err) {
      setError(err?.message || 'Failed to delete notification');
    }
  }

  async function openNotification(item) {
    if (!item) return;

    try {
      if (!item.isRead) {
        await markRead(item._id);
      }

      let nextLink = item.link || '';
      if (!nextLink && item.type === 'message' && item.sender?._id) {
        nextLink = `/chat/${item.sender._id}`;
      } else if (!nextLink && item.type === 'booking') {
        nextLink = '/dashboard';
      }

      if (nextLink) {
        navigate(nextLink);
        setOpen(false);
      }
    } catch (err) {
      setError(err?.message || 'Failed to open notification');
    }
  }

  useEffect(() => {
    load();
  }, [me?.token]);

  useEffect(() => {
    if (!me?.token) return undefined;

    const onMouseDown = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onMouseDown);

    const baseUrl = new URL(buildApiUrl('/health'));
    const socket = io(baseUrl.origin, { transports: ['websocket'] });
    socket.emit('join:user', me.id);
    socket.on('notification:new', () => {
      load();
    });

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      socket.disconnect();
    };
  }, [me?.id, me?.token]);

  if (!me?.token) return null;

  return (
    <div className="notif-wrap" ref={panelRef}>
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
                try {
                  await api('/notifications/read-all', { method: 'PATCH', token: me.token });
                  setItems((current) => current.map((item) => ({ ...item, isRead: true })));
                  setUnread(0);
                } catch (err) {
                  setError(err?.message || 'Failed to mark all notifications as read');
                }
              }}
            >
              Mark all read
            </button>
          </div>

          {loading ? <p className="muted">Loading notifications…</p> : null}
          {error ? <p className="muted">{error}</p> : null}

          {!loading && visibleItems.length ? (
            <ul className="notif-list">
              {visibleItems.map((item) => (
                <li key={item._id} className={item.isRead ? 'notif-item' : 'notif-item unread'}>
                  <button
                    type="button"
                    className="notif-content"
                    onClick={() => openNotification(item)}
                  >
                    <strong>{item.title}</strong>
                    <p>{item.message}</p>
                    <p className="muted notif-meta">
                      {item.sender?.name ? `From ${item.sender.name}` : 'System notification'}
                    </p>
                  </button>

                  <div className="notif-actions">
                    {!item.isRead ? (
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() => markRead(item._id)}
                      >
                        Read
                      </button>
                    ) : null}
                    <button
                      className="btn ghost"
                      type="button"
                      aria-label="Delete notification"
                      onClick={() => removeNotification(item._id)}
                    >
                      🗑
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {!loading && !visibleItems.length ? (
            <p className="muted">No notifications</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
