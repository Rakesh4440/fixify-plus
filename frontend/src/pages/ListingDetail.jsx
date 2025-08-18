import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { summarizeReviews, hasAI } from '../services/ai.js';
import Loader from '../components/Loader.jsx';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');

export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [summary, setSummary] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api(`/listings/${id}`);
        setListing(data);

        if (hasAI && data.reviews?.length) {
          setLoadingAI(true);
          const { text } = await summarizeReviews(data.reviews.map((r) => r.comment));
          setSummary(text);
          setLoadingAI(false);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [id]);

  if (!listing) return <div style={{ padding: 24 }}>Loading...</div>;

  const imgSrc = listing.photoPath
    ? (listing.photoPath.startsWith('http') ? listing.photoPath : `${API_BASE}${listing.photoPath}`)
    : null;

  return (
    <div style={{ padding: 24 }}>
      <h2>{listing.title} {listing.isVerified ? '✅' : ''}</h2>
      <p><b>Type:</b> {listing.type} | <b>Category:</b> {listing.category}</p>
      {(listing.city || listing.area || listing.pincode) && (
        <p><b>Location:</b> {[listing.area, listing.city, listing.pincode].filter(Boolean).join(', ')}</p>
      )}
      <p><b>Contact:</b> {listing.contactNumber}</p>
      {imgSrc && <img src={imgSrc} alt={listing.title} style={{ width: 360, maxWidth: '100%', borderRadius: 12 }} />}
      <p style={{ marginTop: 12 }}>{listing.description}</p>

      <h3>Reviews</h3>
      <ul>
        {listing.reviews?.map((r, i) => (
          <li key={i}><b>{r.rating}/5</b> — {r.comment}</li>
        ))}
      </ul>
      {hasAI && (loadingAI ? <Loader text="Summarizing reviews..." /> : (summary && <p><i>Summary:</i> {summary}</p>))}
    </div>
  );
}
