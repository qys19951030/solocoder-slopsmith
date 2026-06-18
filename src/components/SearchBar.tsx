import { useLibraryStore } from '../store/useLibraryStore';

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useLibraryStore();

  return (
    <div className="search-bar" style={containerStyle}>
      <input
        type="text"
        placeholder="搜索歌曲、艺术家、专辑..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={inputStyle}
        data-testid="search-input"
      />
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  marginBottom: '16px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: '14px',
  border: '1px solid #ccc',
  borderRadius: '6px',
  boxSizing: 'border-box',
};
