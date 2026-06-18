import { useLibraryStore } from '../store/useLibraryStore';
import type { Song } from '../types';

interface ListViewProps {
  onSongSelect?: (song: Song) => void;
}

export function ListView({ onSongSelect }: ListViewProps) {
  const { getSortedFilteredSongs } = useLibraryStore();
  const songs = getSortedFilteredSongs();

  return (
    <div className="list-view">
      <div style={headerStyle}>
        <div style={colStyle('# ')}>#</div>
        <div style={colStyle('标题')}>标题</div>
        <div style={colStyle('艺术家')}>艺术家</div>
        <div style={colStyle('专辑')}>专辑</div>
        <div style={colStyle('年份')}>年份</div>
        <div style={{ ...colStyle('时长'), textAlign: 'right' }}>时长</div>
      </div>
      <div style={listContainerStyle}>
        {songs.map((song, index) => (
          <div
            key={`list-song-${song.id}`}
            data-testid={`list-song-${song.id}`}
            onClick={() => onSongSelect?.(song)}
            style={{
              ...rowStyle,
              backgroundColor: index % 2 === 0 ? '#fafafa' : 'white',
            }}
          >
            <div style={colStyle(String(index + 1))}>{index + 1}</div>
            <div style={colStyle(song.title)}>{song.title}</div>
            <div style={colStyle(song.artist)}>{song.artist}</div>
            <div style={colStyle(song.album)}>{song.album}</div>
            <div style={colStyle(String(song.year))}>{song.year}</div>
            <div style={{ ...colStyle(formatDuration(song.duration)), textAlign: 'right' }}>
              {formatDuration(song.duration)}
            </div>
          </div>
        ))}
        {songs.length === 0 && (
          <div style={emptyStyle}>没有匹配的歌曲</div>
        )}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const headerStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '40px 2fr 1.5fr 1.5fr 80px 80px',
  gap: '12px',
  padding: '10px 12px',
  backgroundColor: '#f0f0f0',
  fontWeight: 'bold',
  fontSize: '13px',
  borderBottom: '2px solid #ddd',
  borderRadius: '6px 6px 0 0',
};

const listContainerStyle: React.CSSProperties = {
  border: '1px solid #e0e0e0',
  borderTop: 'none',
  borderRadius: '0 0 6px 6px',
  maxHeight: '600px',
  overflowY: 'auto',
};

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '40px 2fr 1.5fr 1.5fr 80px 80px',
  gap: '12px',
  padding: '8px 12px',
  cursor: 'pointer',
  fontSize: '14px',
  borderBottom: '1px solid #f0f0f0',
  alignItems: 'center',
};

function colStyle(_content: string): React.CSSProperties {
  return {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

const emptyStyle: React.CSSProperties = {
  padding: '40px',
  textAlign: 'center',
  color: '#999',
  fontSize: '14px',
};
