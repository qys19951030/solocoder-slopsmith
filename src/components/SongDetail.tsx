import type { Song } from '../types';

interface SongDetailProps {
  song: Song | null;
}

export function SongDetail({ song }: SongDetailProps) {
  if (!song) {
    return (
      <div className="song-detail" style={emptyStyle}>
        <p>选择一首歌曲查看详情</p>
      </div>
    );
  }

  return (
    <div className="song-detail" style={detailStyle} data-testid="song-detail">
      <h2 style={titleStyle}>{song.title}</h2>
      <div style={metaRowStyle}>
        <span style={labelStyle}>艺术家:</span>
        <span>{song.artist}</span>
      </div>
      <div style={metaRowStyle}>
        <span style={labelStyle}>专辑:</span>
        <span>{song.album}</span>
      </div>
      <div style={metaRowStyle}>
        <span style={labelStyle}>曲目:</span>
        <span>第 {song.trackNumber} 首</span>
      </div>
      <div style={metaRowStyle}>
        <span style={labelStyle}>年份:</span>
        <span>{song.year}</span>
      </div>
      <div style={metaRowStyle}>
        <span style={labelStyle}>流派:</span>
        <span>{song.genre}</span>
      </div>
      <div style={metaRowStyle}>
        <span style={labelStyle}>时长:</span>
        <span>{formatDuration(song.duration)}</span>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}分${secs}秒`;
}

const emptyStyle: React.CSSProperties = {
  padding: '24px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  color: '#999',
  textAlign: 'center',
};

const detailStyle: React.CSSProperties = {
  padding: '20px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  border: '1px solid #e0e0e0',
};

const titleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: '16px',
  fontSize: '20px',
  color: '#333',
};

const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '8px',
  fontSize: '14px',
};

const labelStyle: React.CSSProperties = {
  fontWeight: 'bold',
  color: '#666',
  minWidth: '60px',
};
