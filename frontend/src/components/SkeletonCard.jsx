export default function SkeletonCard() {
  return (
    <article className="listing-card skeleton-card" aria-hidden="true">
      <div className="skeleton-media shimmer" />
      <div className="listing-body">
        <div className="skeleton-line shimmer" style={{ width: '78%' }} />
        <div className="skeleton-line shimmer" style={{ width: '52%', marginTop: 10 }} />
        <div className="skeleton-line shimmer" style={{ width: '35%', marginTop: 18 }} />
        <div className="skeleton-actions">
          <div className="skeleton-pill shimmer" />
          <div className="skeleton-pill shimmer" />
          <div className="skeleton-pill shimmer" />
        </div>
      </div>
    </article>
  );
}

