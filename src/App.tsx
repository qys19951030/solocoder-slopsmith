import { useState, useEffect } from 'react';
import { useLibraryStore } from './store/useLibraryStore';
import { SettingsPanel } from './components/SettingsPanel';
import { SearchBar } from './components/SearchBar';
import { TreeView } from './components/TreeView';
import { ListView } from './components/ListView';
import { SongDetail } from './components/SongDetail';
import { loadSongs, type SongDataSource } from './data/songLoader';
import type { Song } from './types';

interface AppProps {
  dataSource?: SongDataSource;
}

function App({ dataSource }: AppProps) {
  const { settings, getSortedFilteredSongs, getTree, setSongs } = useLibraryStore();
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const songs = await loadSongs(dataSource);
        if (!cancelled) {
          setSongs(songs);
          setIsLoading(false);
          setLoadError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [dataSource, setSongs]);

  const totalSongs = useLibraryStore((state) => state.songs.length);
  const filteredSongs = getSortedFilteredSongs().length;
  const tree = getTree();
  const artistCount = tree.length;

  if (isLoading) {
    return (
      <div style={appStyle}>
        <header style={headerStyle}>
          <h1 style={h1Style}>🎵 SlopSmith 音乐库</h1>
        </header>
        <p>加载中...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={appStyle}>
        <header style={headerStyle}>
          <h1 style={h1Style}>🎵 SlopSmith 音乐库</h1>
        </header>
        <div style={{ padding: '24px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '8px' }}>
          <h3 style={{ color: '#c33', marginTop: 0 }}>加载歌曲数据失败</h3>
          <p style={{ color: '#633' }}>{loadError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={appStyle}>
      <header style={headerStyle}>
        <h1 style={h1Style}>🎵 SlopSmith 音乐库</h1>
        <div style={statsStyle}>
          <span>共 {totalSongs} 首歌曲</span>
          <span>•</span>
          <span>{artistCount} 位艺术家</span>
          <span>•</span>
          <span>当前显示 {filteredSongs} 首</span>
        </div>
      </header>

      <div style={mainStyle}>
        <div style={leftPaneStyle}>
          <SettingsPanel />
          <SearchBar />
          <div style={viewContainerStyle}>
            {settings.viewMode === 'tree' ? (
              <TreeView onSongSelect={setSelectedSong} />
            ) : (
              <ListView onSongSelect={setSelectedSong} />
            )}
          </div>
        </div>

        <div style={rightPaneStyle}>
          <h3 style={{ marginTop: 0 }}>歌曲详情</h3>
          <SongDetail song={selectedSong} />
        </div>
      </div>
    </div>
  );
}

const appStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '20px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  color: '#333',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '20px',
  paddingBottom: '16px',
  borderBottom: '2px solid #eee',
};

const h1Style: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '24px',
};

const statsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  fontSize: '14px',
  color: '#666',
};

const mainStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
};

const leftPaneStyle: React.CSSProperties = {
  flex: 2,
  minWidth: 0,
};

const rightPaneStyle: React.CSSProperties = {
  flex: 1,
  minWidth: '280px',
  position: 'sticky',
  top: '20px',
  alignSelf: 'flex-start',
};

const viewContainerStyle: React.CSSProperties = {
  backgroundColor: 'white',
};

export default App;
