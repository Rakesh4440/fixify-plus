import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { api, buildApiUrl } from '../services/api.js';
import { getCurrentUser } from '../services/session.js';

export default function ChatPanel({ listingId, providerId }) {
  const me = getCurrentUser();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!me?.token || !listingId || !providerId || String(providerId) === String(me.id)) return;

    let active = true;

    async function bootstrap() {
      setLoading(true);
      try {
        const convoRes = await api('/conversations', {
          method: 'POST',
          token: me.token,
          body: { listingId }
        });
        if (!active) return;
        setConversation(convoRes.conversation);

        const msgRes = await api(`/conversations/${convoRes.conversation._id}/messages`, { token: me.token });
        if (!active) return;
        setMessages(msgRes.messages || []);

        const baseUrl = new URL(buildApiUrl('/health'));
        const socket = io(baseUrl.origin, { transports: ['websocket'] });
        socket.emit('join:user', me.id);
        socket.on('message:new', (incoming) => {
          if (String(incoming.conversationId) === String(convoRes.conversation._id)) {
            setMessages((prev) => prev.some((item) => item._id === incoming._id) ? prev : [...prev, incoming]);
          }
        });
        socketRef.current = socket;
      } catch (_error) {
        // Keep chat panel soft-failing to avoid breaking the listing page.
      } finally {
        if (active) setLoading(false);
      }
    }

    bootstrap();

    return () => {
      active = false;
      socketRef.current?.disconnect();
    };
  }, [listingId, me?.id, me?.token, providerId]);

  if (!me?.token || !providerId || String(providerId) === String(me?.id)) return null;

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || !conversation) return;

    const payload = {
      conversationId: conversation._id,
      listingId,
      senderId: me.id,
      receiverId: providerId,
      text: text.trim()
    };

    setMessages((prev) => [
      ...prev,
      {
        ...payload,
        _id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString()
      }
    ]);
    socketRef.current?.emit('chat:send', payload);
    setText('');
  }

  return (
    <section className="panel chat-panel">
      <h3>Chat with provider</h3>
      {loading ? <p className="muted">Opening conversation…</p> : null}
      <div className="chat-log">
        {messages.length ? messages.map((message) => (
          <div key={message._id} className={String(message.senderId) === String(me.id) ? 'bubble own' : 'bubble'}>
            {message.text}
          </div>
        )) : <p className="muted">Start a conversation to ask about availability or pricing.</p>}
      </div>

      <form onSubmit={sendMessage} className="chat-form">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" />
        <button className="btn" type="submit">Send</button>
      </form>
    </section>
  );
}
