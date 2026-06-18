import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, cleanup, act } from '@testing-library/react';
import { useLibraryStore } from '../src/store/useLibraryStore';
import { TreeView } from '../src/components/TreeView';
import { ListView } from '../src/components/ListView';
import { SettingsPanel } from '../src/components/SettingsPanel';
import { SongDetail } from '../src/components/SongDetail';
import type { Song } from '../src/types';

const externalSongs: Song[] = [
  { id: 'x1', title: 'Enter Sandman', artist: 'Metallica', album: 'Metallica (Black Album)', trackNumber: 1, duration: 332, genre: 'Metal', year: 1991 },
  { id: 'x2', title: 'Nothing Else Matters', artist: 'Metallica', album: 'Metallica (Black Album)', trackNumber: 8, duration: 387, genre: 'Metal', year: 1991 },
  { id: 'x3', title: 'Master of Puppets', artist: 'Metallica', album: 'Master of Puppets', trackNumber: 1, duration: 516, genre: 'Metal', year: 1986 },
  { id: 'x4', title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', trackNumber: 11, duration: 354, genre: 'Rock', year: 1975 },
  { id: 'x5', title: 'We Will Rock You', artist: 'Queen', album: 'News of the World', trackNumber: 1, duration: 122, genre: 'Rock', year: 1977 },
  { id: 'x6', title: 'Billie Jean', artist: 'Michael Jackson', album: 'Thriller', trackNumber: 6, duration: 294, genre: 'Pop', year: 1982 },
  { id: 'x7', title: 'Thriller', artist: 'Michael Jackson', album: 'Thriller', trackNumber: 14, duration: 357, genre: 'Pop', year: 1982 },
];

describe('component integration with external data', () => {
  beforeEach(() => {
    localStorage.clear();
    useLibraryStore.setState({
      songs: [],
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
    cleanup();
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

  describe('TreeView with externally injected data', () => {
    beforeEach(() => {
      act(() => {
        useLibraryStore.getState().setSongs(externalSongs);
      });
    });

    it('should render grouped tree (Artist -> Album -> Song) with external data', () => {
      render(<TreeView />);

      const metallicaArtist = screen.getByTestId('tree-node-artist:Metallica');
      expect(metallicaArtist).toBeInTheDocument();

      fireEvent.click(within(metallicaArtist).getByText('Metallica'));

      const blackAlbum = screen.getByTestId('tree-node-album:Metallica/Metallica (Black Album)');
      expect(blackAlbum).toBeInTheDocument();

      const puppetsAlbum = screen.getByTestId('tree-node-album:Metallica/Master of Puppets');
      expect(puppetsAlbum).toBeInTheDocument();

      fireEvent.click(within(blackAlbum).getByText('Metallica (Black Album)'));
      expect(screen.getByTestId('tree-node-song:Metallica/Metallica (Black Album)/x1')).toBeInTheDocument();
    });

    it('should render flat tree when ignoreAlbumGrouping is enabled (Artist -> Song)', () => {
      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
      });
      render(<TreeView />);

      const metallicaArtist = screen.getByTestId('tree-node-artist:Metallica');
      expect(metallicaArtist).toBeInTheDocument();

      fireEvent.click(within(metallicaArtist).getByText('Metallica'));

      expect(screen.queryByTestId('tree-node-album:Metallica/Metallica (Black Album)')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tree-node-album:Metallica/Master of Puppets')).not.toBeInTheDocument();

      expect(screen.getByTestId('tree-node-song-flat:Metallica/x1')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-song-flat:Metallica/x2')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-song-flat:Metallica/x3')).toBeInTheDocument();
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

      let metallicaArtist = screen.getByTestId('tree-node-artist:Metallica');
      fireEvent.click(within(metallicaArtist).getByText('Metallica'));
      expect(screen.getByTestId('tree-node-album:Metallica/Metallica (Black Album)')).toBeInTheDocument();

      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
      });
      rerender(<TreeView />);

      metallicaArtist = screen.getByTestId('tree-node-artist:Metallica');
      fireEvent.click(within(metallicaArtist).getByText('Metallica'));
      expect(screen.queryByTestId('tree-node-album:Metallica/Metallica (Black Album)')).not.toBeInTheDocument();
      expect(screen.getByTestId('tree-node-song-flat:Metallica/x1')).toBeInTheDocument();
    });

    it('should preserve album metadata when song is selected in flat mode', () => {
      let selectedSong: Song | null = null;
      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
      });

      render(<TreeView onSongSelect={(song) => { selectedSong = song; }} />);

      const metallicaArtist = screen.getByTestId('tree-node-artist:Metallica');
      fireEvent.click(within(metallicaArtist).getByText('Metallica'));

      const songNode = screen.getByTestId('tree-node-song-flat:Metallica/x1');
      fireEvent.click(within(songNode).getByText('Enter Sandman'));

      expect(selectedSong).not.toBeNull();
      expect(selectedSong!.album).toBe('Metallica (Black Album)');
      expect(selectedSong!.trackNumber).toBe(1);
      expect(selectedSong!.year).toBe(1991);
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

    it('should work with search in grouped mode', () => {
      const { rerender } = render(<TreeView />);

      act(() => {
        useLibraryStore.getState().setSearchQuery('Thriller');
      });
      rerender(<TreeView />);

      expect(screen.queryByTestId('tree-node-artist:Metallica')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tree-node-artist:Queen')).not.toBeInTheDocument();
      expect(screen.getByTestId('tree-node-artist:Michael Jackson')).toBeInTheDocument();
    });

    it('should work with search in flat mode', () => {
      const { rerender } = render(<TreeView />);

      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
        useLibraryStore.getState().setSearchQuery('Thriller');
      });
      rerender(<TreeView />);

      expect(screen.queryByTestId('tree-node-artist:Metallica')).not.toBeInTheDocument();
      const mjArtist = screen.getByTestId('tree-node-artist:Michael Jackson');
      fireEvent.click(within(mjArtist).getByText('Michael Jackson'));
      expect(screen.getByTestId('tree-node-song-flat:Michael Jackson/x6')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-song-flat:Michael Jackson/x7')).toBeInTheDocument();
    });
  });

  describe('ListView with externally injected data', () => {
    beforeEach(() => {
      act(() => {
        useLibraryStore.getState().setSongs(externalSongs);
      });
    });

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

      const row = screen.getByTestId('list-song-x1');
      expect(row).toHaveTextContent('Metallica (Black Album)');
    });

    it('should work with search in both modes', () => {
      const { rerender } = render(<ListView />);

      act(() => {
        useLibraryStore.getState().setSearchQuery('Thriller');
      });
      rerender(<ListView />);
      expect(screen.getByTestId('list-song-x6')).toBeInTheDocument();
      expect(screen.queryByTestId('list-song-x1')).not.toBeInTheDocument();

      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
      });
      rerender(<ListView />);
      expect(screen.getByTestId('list-song-x6')).toBeInTheDocument();
      expect(screen.queryByTestId('list-song-x1')).not.toBeInTheDocument();

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
      expect(songs[0]).toHaveAttribute('data-testid', 'list-song-x5');

      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
      });
      rerender(<ListView />);

      songs = screen.getAllByTestId(/^list-song-/);
      expect(songs[0]).toHaveAttribute('data-testid', 'list-song-x5');
    });

    it('list view key should be unique regardless of grouping mode', () => {
      const checkUniqueKeys = () => {
        const rows = screen.getAllByTestId(/^list-song-/);
        const keys = rows.map(r => r.getAttribute('data-testid'));
        const uniqueKeys = new Set(keys);
        expect(uniqueKeys.size).toBe(keys.length);
      };

      const { rerender } = render(<ListView />);
      checkUniqueKeys();

      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
      });
      rerender(<ListView />);
      checkUniqueKeys();
    });
  });

  describe('SongDetail with album metadata', () => {
    it('should display album info for selected song', () => {
      const song = externalSongs[0];
      render(<SongDetail song={song} />);

      expect(screen.getByText('Enter Sandman')).toBeInTheDocument();
      expect(screen.getByText('Metallica (Black Album)')).toBeInTheDocument();
      expect(screen.getByText(/第 1 首/)).toBeInTheDocument();
    });

    it('should show all metadata fields including album', () => {
      render(<SongDetail song={externalSongs[3]} />);

      expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
      expect(screen.getByText('Queen')).toBeInTheDocument();
      expect(screen.getByText('A Night at the Opera')).toBeInTheDocument();
      expect(screen.getByText(/第 11 首/)).toBeInTheDocument();
      expect(screen.getByText('1975')).toBeInTheDocument();
      expect(screen.getByText('Rock')).toBeInTheDocument();
    });
  });

  describe('album search across flat and grouped modes', () => {
    beforeEach(() => {
      act(() => {
        useLibraryStore.getState().setSongs(externalSongs);
      });
    });

    it('search by album name works in grouped mode', () => {
      const { rerender } = render(<ListView />);

      act(() => {
        useLibraryStore.getState().setSearchQuery('Master of Puppets');
      });
      rerender(<ListView />);

      const songs = screen.getAllByTestId(/^list-song-/);
      expect(songs.length).toBe(1);
      expect(songs[0]).toHaveTextContent('Master of Puppets');
      expect(songs[0]).toHaveTextContent('Metallica');
    });

    it('search by album name works in flat mode', () => {
      const { rerender } = render(<ListView />);

      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
        useLibraryStore.getState().setSearchQuery('Master of Puppets');
      });
      rerender(<ListView />);

      const songs = screen.getAllByTestId(/^list-song-/);
      expect(songs.length).toBe(1);
      expect(songs[0]).toHaveTextContent('Master of Puppets');
      expect(songs[0]).toHaveTextContent('Metallica');
    });

    it('search by album returns same count in both modes', () => {
      const { rerender } = render(<ListView />);

      act(() => {
        useLibraryStore.getState().setSearchQuery('Thriller');
      });
      rerender(<ListView />);
      const groupedCount = screen.getAllByTestId(/^list-song-/).length;

      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
      });
      rerender(<ListView />);
      const flatCount = screen.getAllByTestId(/^list-song-/).length;

      expect(groupedCount).toBe(flatCount);
      expect(groupedCount).toBe(2);
    });
  });

  describe('combined operations - flat mode integrity', () => {
    beforeEach(() => {
      act(() => {
        useLibraryStore.getState().setSongs(externalSongs);
      });
    });

    it('toggle + search + sort + toggle back produces consistent results', () => {
      const { rerender } = render(<TreeView />);

      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
        useLibraryStore.getState().setSearchQuery('Metallica');
        useLibraryStore.getState().setSortField('duration');
        useLibraryStore.getState().setSortDirection('desc');
      });
      rerender(<TreeView />);

      const artistNode = screen.getByTestId('tree-node-artist:Metallica');
      fireEvent.click(within(artistNode).getByText('Metallica'));

      const songNodes = screen.getAllByTestId(/^tree-node-song-flat:/);
      expect(songNodes.length).toBe(3);

      const songIds = new Set(songNodes.map(n => n.getAttribute('data-testid')));
      expect(songIds.size).toBe(3);

      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(false);
      });
      rerender(<TreeView />);

      const artistNode2 = screen.getByTestId('tree-node-artist:Metallica');
      fireEvent.click(within(artistNode2).getByText('Metallica'));

      const albumNodes = screen.getAllByTestId(/^tree-node-album:/);
      expect(albumNodes.length).toBe(2);
    });

    it('no key collision between flat and grouped song nodes', () => {
      const { rerender } = render(<TreeView />);

      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(true);
        useLibraryStore.getState().expandAll();
      });
      rerender(<TreeView />);

      const flatNodeIds = new Set(
        Array.from(document.querySelectorAll('[data-testid^="tree-node-song-flat:"]'))
          .map(n => n.getAttribute('data-testid'))
      );

      act(() => {
        useLibraryStore.getState().setIgnoreAlbumGrouping(false);
        useLibraryStore.getState().expandAll();
      });
      rerender(<TreeView />);

      const groupedNodeIds = new Set(
        Array.from(document.querySelectorAll('[data-testid^="tree-node-song:"]'))
          .map(n => n.getAttribute('data-testid'))
      );

      for (const flatId of flatNodeIds) {
        expect(groupedNodeIds.has(flatId)).toBe(false);
      }
    });
  });
});
