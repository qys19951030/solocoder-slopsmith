import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, cleanup, act } from '@testing-library/react';
import { useLibraryStore } from '../src/store/useLibraryStore';
import { TreeView } from '../src/components/TreeView';
import { ListView } from '../src/components/ListView';
import { SettingsPanel } from '../src/components/SettingsPanel';
import type { Song } from '../src/types';

const testSongs: Song[] = [
  { id: 's1', title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', trackNumber: 11, duration: 354, genre: 'Rock', year: 1975 },
  { id: 's2', title: 'We Will Rock You', artist: 'Queen', album: 'News of the World', trackNumber: 1, duration: 122, genre: 'Rock', year: 1977 },
  { id: 's3', title: 'Billie Jean', artist: 'Michael Jackson', album: 'Thriller', trackNumber: 6, duration: 294, genre: 'Pop', year: 1982 },
];

describe('component integration', () => {
  beforeEach(() => {
    localStorage.clear();
    useLibraryStore.setState({
      songs: testSongs,
      settings: {
        viewMode: 'tree',
        sortField: 'title',
        sortDirection: 'asc',
        ignoreAlbumGrouping: false,
      },
      searchQuery: '',
      expandedNodes: new Set<string>(),
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('SettingsPanel', () => {
    it('should render the ignore album grouping toggle', () => {
      render(<SettingsPanel />);
      const checkbox = screen.getByLabelText(/忽略 Album 分组/);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should toggle ignoreAlbumGrouping when clicked', () => {
      render(<SettingsPanel />);
      const checkbox = screen.getByLabelText(/忽略 Album 分组/) as HTMLInputElement;

      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
      expect(useLibraryStore.getState().settings.ignoreAlbumGrouping).toBe(true);

      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(false);
      expect(useLibraryStore.getState().settings.ignoreAlbumGrouping).toBe(false);
    });

    it('should show hint text explaining the feature', () => {
      render(<SettingsPanel />);
      expect(screen.getByText(/启用后同一艺术家下直接显示歌曲，不按专辑分层/)).toBeInTheDocument();
    });
  });

  describe('TreeView', () => {
    it('should render grouped tree by default (Artist -> Album -> Song)', () => {
      render(<TreeView />);

      const queenArtist = screen.getByTestId('tree-node-artist:Queen');
      expect(queenArtist).toBeInTheDocument();

      fireEvent.click(within(queenArtist).getByText('Queen'));

      const operaAlbum = screen.getByTestId('tree-node-album:Queen/A Night at the Opera');
      expect(operaAlbum).toBeInTheDocument();

      const newsAlbum = screen.getByTestId('tree-node-album:Queen/News of the World');
      expect(newsAlbum).toBeInTheDocument();

      fireEvent.click(within(operaAlbum).getByText('A Night at the Opera'));
      expect(screen.getByTestId('tree-node-song:Queen/A Night at the Opera/s1')).toBeInTheDocument();
    });

    it('should render flat tree when ignoreAlbumGrouping is enabled (Artist -> Song)', () => {
      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
      });
      render(<TreeView />);

      const queenArtist = screen.getByTestId('tree-node-artist:Queen');
      expect(queenArtist).toBeInTheDocument();

      fireEvent.click(within(queenArtist).getByText('Queen'));

      expect(screen.queryByTestId('tree-node-album:Queen/A Night at the Opera')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tree-node-album:Queen/News of the World')).not.toBeInTheDocument();

      expect(screen.getByTestId('tree-node-song-flat:Queen/s1')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-song-flat:Queen/s2')).toBeInTheDocument();
    });

    it('should show mode indicator in toolbar', () => {
      const { rerender } = render(<TreeView />);
      expect(screen.getByText('专辑分组模式')).toBeInTheDocument();

      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
      });
      rerender(<TreeView />);
      expect(screen.getByText('扁平模式')).toBeInTheDocument();
    });

    it('should rebuild tree immediately when setting is toggled', () => {
      const { rerender } = render(<TreeView />);

      let queenArtist = screen.getByTestId('tree-node-artist:Queen');
      fireEvent.click(within(queenArtist).getByText('Queen'));
      expect(screen.getByTestId('tree-node-album:Queen/A Night at the Opera')).toBeInTheDocument();

      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
      });
      rerender(<TreeView />);

      queenArtist = screen.getByTestId('tree-node-artist:Queen');
      fireEvent.click(within(queenArtist).getByText('Queen'));
      expect(screen.queryByTestId('tree-node-album:Queen/A Night at the Opera')).not.toBeInTheDocument();
      expect(screen.getByTestId('tree-node-song-flat:Queen/s1')).toBeInTheDocument();
    });

    it('should preserve album metadata when song is selected in flat mode', () => {
      let selectedSong: Song | null = null;
      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
      });

      render(<TreeView onSongSelect={(song) => { selectedSong = song; }} />);

      const queenArtist = screen.getByTestId('tree-node-artist:Queen');
      fireEvent.click(within(queenArtist).getByText('Queen'));

      const songNode = screen.getByTestId('tree-node-song-flat:Queen/s1');
      fireEvent.click(within(songNode).getByText('Bohemian Rhapsody'));

      expect(selectedSong).not.toBeNull();
      expect(selectedSong!.album).toBe('A Night at the Opera');
      expect(selectedSong!.trackNumber).toBe(11);
    });

    it('should have no duplicate node IDs in either mode', () => {
      const checkUniqueIds = () => {
        const allNodes = document.querySelectorAll('[data-testid^="tree-node-"]');
        const ids = Array.from(allNodes).map(n => n.getAttribute('data-testid'));
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      };

      render(<TreeView />);
      act(() => {
        useLibraryStore.getState().expandAll();
      });
      checkUniqueIds();

      cleanup();

      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
      });
      render(<TreeView />);
      act(() => {
        useLibraryStore.getState().expandAll();
      });
      checkUniqueIds();
    });
  });

  describe('ListView', () => {
    it('should show album column regardless of grouping setting', () => {
      const { rerender } = render(<ListView />);
      expect(screen.getByText('专辑')).toBeInTheDocument();

      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
      });
      rerender(<ListView />);
      expect(screen.getByText('专辑')).toBeInTheDocument();
    });

    it('should display album data for each song in list view', () => {
      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
      });
      render(<ListView />);

      const row = screen.getByTestId('list-song-s1');
      expect(row).toHaveTextContent('A Night at the Opera');
    });

    it('should work with search in both modes', () => {
      const { rerender } = render(<ListView />);
      act(() => {
        useLibraryStore.getState().setSearchQuery('Thriller');
      });
      rerender(<ListView />);
      expect(screen.getByTestId('list-song-s3')).toBeInTheDocument();
      expect(screen.queryByTestId('list-song-s1')).not.toBeInTheDocument();

      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
      });
      rerender(<ListView />);
      expect(screen.getByTestId('list-song-s3')).toBeInTheDocument();
      expect(screen.queryByTestId('list-song-s1')).not.toBeInTheDocument();

      act(() => {
        useLibraryStore.getState().setSearchQuery('');
      });
    });

    it('should work with sorting in both modes', () => {
      const { rerender } = render(<ListView />);

      act(() => {
        useLibraryStore.getState().setSortField('duration');
        useLibraryStore.getState().setSortDirection('asc');
      });
      rerender(<ListView />);

      let songs = screen.getAllByTestId(/^list-song-/);
      expect(songs[0]).toHaveAttribute('data-testid', 'list-song-s2');

      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
      });
      rerender(<ListView />);

      songs = screen.getAllByTestId(/^list-song-/);
      expect(songs[0]).toHaveAttribute('data-testid', 'list-song-s2');
    });
  });

  describe('search integration', () => {
    it('should filter tree correctly in grouped mode', () => {
      const { rerender } = render(<TreeView />);
      act(() => {
        useLibraryStore.getState().setSearchQuery('Thriller');
      });
      rerender(<TreeView />);

      expect(screen.queryByTestId('tree-node-artist:Queen')).not.toBeInTheDocument();
      expect(screen.getByTestId('tree-node-artist:Michael Jackson')).toBeInTheDocument();
    });

    it('should filter tree correctly in flat mode', () => {
      const { rerender } = render(<TreeView />);
      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
      });
      rerender(<TreeView />);
      act(() => {
        useLibraryStore.getState().setSearchQuery('Thriller');
      });
      rerender(<TreeView />);

      expect(screen.queryByTestId('tree-node-artist:Queen')).not.toBeInTheDocument();
      const mjArtist = screen.getByTestId('tree-node-artist:Michael Jackson');
      fireEvent.click(within(mjArtist).getByText('Michael Jackson'));
      expect(screen.getByTestId('tree-node-song-flat:Michael Jackson/s3')).toBeInTheDocument();
    });
  });
});
