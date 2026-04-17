export default function SearchSuggestions({ suggestions, onSelect }) {
  if (!suggestions?.length) return null;

  return (
    <div className="suggestion-box">
      {suggestions.map((item) => (
        <button key={item} type="button" className="suggestion-item" onClick={() => onSelect(item)}>
          {item}
        </button>
      ))}
    </div>
  );
}

