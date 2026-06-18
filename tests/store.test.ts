import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useLibraryStore } from '../src/store/useLibraryStore';
import type { Song } from '../src/types';

const externalSongs: Song[] = [
  { id: 'e1', title: 'Enter Sandman', artist: 'Metallica', album: 'Metallica', trackNumber: 1, duration: 332, genre: 'Metal', year: 1991 },
  { id: 'e2', title: 'Nothing Else Matters', artist: 'Metallica', album: 'Metallica', trackNumber: 8, duration: 387, genre: 'Metal', year: 1991 },
  { id: 'e3', title: 'Master of Puppets', artist: 'Metallica', album: 'Master of Puppets', trackNumber: 1, duration: 516, genre: 'Metal', year: 1986 },
  { id: 'e4', title: 'Seven Seas of Rhye', artist: 'Queen', album: 'Queen II', trackNumber: 7, duration: 173, genre: 'Rock', year: 1974 },
  { id: 'e5', title: 'Killer Queen', artist: 'Queen', album: 'Sheer Heart Attack', trackNumber: 2, duration: 179, genre: 'Rock', year: 1974 },
  { id: 'e6', title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', trackNumber: 11, duration: 354, genre: 'Rock', year: 1975 },
  { id: 'e7', title: 'Highway to Hell', artist: 'AC/DC', album: 'Highway to Hell', trackNumber: 1, duration: 209, genre: 'Rock', year: 1979 },
  { id: 'e8', title: 'Back in Black', artist: 'AC/DC', album: 'Back in Black', trackNumber: 1, duration: 255, genre: 'Rock', year: 1980 },
];

const anotherDataset: Song[] = [
  { id: 'a1', title: 'Song A', artist: 'Alpha', album: 'Album 1', trackNumber: 1, duration: 200, genre: 'Pop', year: 2000 },
  { id: 'a2', title: 'Song B', artist: 'Alpha', album: 'Album 1', trackNumber: 2, duration: 210, genre: 'Pop', year: 2000 },
  { id: 'a3', title: 'Song C', artist: 'Beta', album: 'Album 2', trackNumber: 1, duration: 220, genre: 'Pop', year: 2001 },
];

describe('useLibraryStore', () => {
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
  });

  describe('initial state', () => {
    it('should start with empty songs array (no sample data dependency)', () => {
      useLibraryStore.setState({ songs: [], settings: { viewMode: 'tree', sortField: 'title', sortDirection: 'asc', ignoreAlbumGrouping: false }, searchQuery: '', expandedNodes: new Set() });
      const { songs } = useLibraryStore.getState();
      expect(songs).toEqual([]);
      expect(songs.length).toBe(0);
    });

    it('should have ignoreAlbumGrouping disabled by default', () => {
      const { settings } = useLibraryStore.getState();
      expect(settings.ignoreAlbumGrouping).toBe(false);
    });

    it('should return empty tree when no songs', () => {
      const { getTree } = useLibraryStore.getState();
      expect(getTree()).toEqual([]);
    });

    it('should return empty list when no songs', () => {
      const { getSortedFilteredSongs } = useLibraryStore.getState();
      expect(getSortedFilteredSongs()).toEqual([]);
    });
  });

  describe('setSongs - data injection', () => {
    it('should replace all songs with injected dataset', () => {
      const { setSongs, songs } = useLibraryStore.getState();
      expect(songs.length).toBe(0);

      setSongs(externalSongs);
      expect(useLibraryStore.getState().songs.length).toBe(externalSongs.length);
      expect(useLibraryStore.getState().songs[0].id).toBe(externalSongs[0].id);
    });

    it('should clear expanded nodes when data changes to prevent key collisions', () => {
      const { setSongs, expandAll } = useLibraryStore.getState();

      setSongs(externalSongs);
      expandAll();
      expect(useLibraryStore.getState().expandedNodes.size).toBeGreaterThan(0);

      setSongs(anotherDataset);
      expect(useLibraryStore.getState().expandedNodes.size).toBe(0);
    });

    it('should work with multiple different datasets sequentially', () => {
      const { setSongs, getTree, getSortedFilteredSongs } = useLibraryStore.getState();

      setSongs(externalSongs);
      expect(getSortedFilteredSongs().length).toBe(8);
      expect(getTree().length).toBe(3);

      setSongs(anotherDataset);
      expect(getSortedFilteredSongs().length).toBe(3);
      expect(getTree().length).toBe(2);

      setSongs([]);
      expect(getSortedFilteredSongs().length).toBe(0);
      expect(getTree().length).toBe(0);
    });

    it('should create a copy of the input array (not reference)', () => {
      const { setSongs } = useLibraryStore.getState();
      const input = [...externalSongs];

      setSongs(input);
      expect(useLibraryStore.getState().songs).not.toBe(input);

      input.push({ id: 'extra', title: 'Extra', artist: 'Test', album: 'Test', trackNumber: 1, duration: 100, genre: 'Test', year: 2000 });
      expect(useLibraryStore.getState().songs.length).toBe(externalSongs.length);
    });
  });

  describe('ignoreAlbumGrouping with external data', () => {
    beforeEach(() => {
      useLibraryStore.getState().setSongs(externalSongs);
    });

    it('should build grouped tree (Artist -> Album -> Song) with external data', () => {
      const { getTree } = useLibraryStore.getState();
      const tree = getTree();

      expect(tree.length).toBe(3);

      const metallicaNode = tree.find(n => n.name === 'Metallica')!;
      expect(metallicaNode.type).toBe('artist');
      expect(metallicaNode.children!.length).toBe(2);

      const blackAlbum = metallicaNode.children!.find(a => a.name === 'Metallica')!;
      expect(blackAlbum.type).toBe('album');
      expect(blackAlbum.children!.length).toBe(2);
      expect(blackAlbum.children![0].type).toBe('song');
    });

    it('should build flat tree (Artist -> Song) with external data', () => {
      const { setIgnoreAlbumGrouping, getTree } = useLibraryStore.getState();
      setIgnoreAlbumGrouping(true);

      const tree = getTree();
      expect(tree.length).toBe(3);

      const metallicaNode = tree.find(n => n.name === 'Metallica')!;
      expect(metallicaNode.type).toBe('artist');
      expect(metallicaNode.children!.length).toBe(3);

      for (const child of metallicaNode.children!) {
        expect(child.type).toBe('song');
        expect(child.song).toBeDefined();
      }
    });

    it('should preserve album metadata in flat mode', () => {
      const { setIgnoreAlbumGrouping, getTree } = useLibraryStore.getState();
      setIgnoreAlbumGrouping(true);

      const tree = getTree();
      const metallicaNode = tree.find(n => n.name === 'Metallica')!;
      const songs = metallicaNode.children!;

      const albums = new Set(songs.map(s => s.song!.album));
      expect(albums.size).toBe(2);
      expect(albums.has('Metallica')).toBe(true);
      expect(albums.has('Master of Puppets')).toBe(true);
    });

    it('should use same dataset for both tree and list views', () => {
      const { setIgnoreAlbumGrouping, getTree, getSortedFilteredSongs } = useLibraryStore.getState();

      const countSongs = (nodes: any[]): number => {
        let count = 0;
        for (const n of nodes) {
          if (n.type === 'song') count++;
          if (n.children) count += countSongs(n.children);
        }
        return count;
      };

      const listCount = getSortedFilteredSongs().length;
      const treeSongCount = countSongs(getTree());
      expect(treeSongCount).toBe(listCount);

      setIgnoreAlbumGrouping(true);

      const listCountFlat = getSortedFilteredSongs().length;
      const treeSongCountFlat = countSongs(getTree());
      expect(treeSongCountFlat).toBe(listCountFlat);
      expect(listCountFlat).toBe(listCount);
    });
  });

  describe('combined operations - no duplicates or key collisions', () => {
    beforeEach(() => {
      useLibraryStore.getState().setSongs(externalSongs);
    });

    it('flat mode + search + sort should produce unique song nodes with correct keys', () => {
      const { setIgnoreAlbumGrouping, setSearchQuery, setSortField, setSortDirection, getTree } = useLibraryStore.getState();

      setIgnoreAlbumGrouping(true);
      setSearchQuery('Queen');
      setSortField('duration');
      setSortDirection('desc');

      const tree = getTree();
      expect(tree.length).toBe(1);

      const queenNode = tree[0];
      const songIds = new Set<string>();
      const nodeIds = new Set<string>();

      for (const song of queenNode.children!) {
        expect(song.type).toBe('song');
        expect(song.id).toMatch(/^song-flat:/);
        expect(songIds.has(song.song!.id)).toBe(false);
        expect(nodeIds.has(song.id)).toBe(false);
        songIds.add(song.song!.id);
        nodeIds.add(song.id);
      }

      expect(songIds.size).toBe(queenNode.children!.length);
      expect(nodeIds.size).toBe(queenNode.children!.length);
    });

    it('grouped mode + search + sort should produce unique song nodes with correct keys', () => {
      const { setSearchQuery, setSortField, setSortDirection, getTree } = useLibraryStore.getState();

      setSearchQuery('Queen');
      setSortField('year');
      setSortDirection('asc');

      const tree = getTree();
      const songIds = new Set<string>();
      const nodeIds = new Set<string>();

      const collectIds = (nodes: any[]) => {
        for (const n of nodes) {
          expect(nodeIds.has(n.id)).toBe(false);
          nodeIds.add(n.id);
          if (n.type === 'song') {
            expect(songIds.has(n.song!.id)).toBe(false);
            songIds.add(n.song!.id);
          }
          if (n.children) collectIds(n.children);
        }
      };
      collectIds(tree);

      expect(songIds.size).toBe(3);
    });

    it('toggling mode multiple times should not produce duplicate songs', () => {
      const { setIgnoreAlbumGrouping, getTree, getSortedFilteredSongs } = useLibraryStore.getState();

      const initialCount = getSortedFilteredSongs().length;

      for (let i = 0; i < 5; i++) {
        setIgnoreAlbumGrouping(i % 2 === 0);
        expect(getSortedFilteredSongs().length).toBe(initialCount);

        const tree = getTree();
        let treeCount = 0;
        const count = (nodes: any[]) => {
          for (const n of nodes) {
            if (n.type === 'song') treeCount++;
            if (n.children) count(n.children);
          }
        };
        count(tree);
        expect(treeCount).toBe(initialCount);
      }
    });

    it('searching by album name in flat mode returns correct songs with album metadata', () => {
      const { setIgnoreAlbumGrouping, setSearchQuery, getTree, getSortedFilteredSongs } = useLibraryStore.getState();

      setIgnoreAlbumGrouping(true);
      setSearchQuery('Master of Puppets');

      const listSongs = getSortedFilteredSongs();
      expect(listSongs.length).toBe(1);
      expect(listSongs[0].album).toBe('Master of Puppets');
      expect(listSongs[0].title).toBe('Master of Puppets');

      const tree = getTree();
      expect(tree.length).toBe(1);
      expect(tree[0].children!.length).toBe(1);
      expect(tree[0].children![0].song!.album).toBe('Master of Puppets');
    });

    it('all node IDs should be unique across entire tree in both modes', () => {
      const { setIgnoreAlbumGrouping, getTree } = useLibraryStore.getState();

      const checkUniqueIds = () => {
        const tree = getTree();
        const ids = new Set<string>();
        const collect = (nodes: any[]) => {
          for (const n of nodes) {
            expect(ids.has(n.id)).toBe(false);
            ids.add(n.id);
            if (n.children) collect(n.children);
          }
        };
        collect(tree);
        return ids.size;
      };

      const groupedCount = checkUniqueIds();
      expect(groupedCount).toBeGreaterThan(0);

      setIgnoreAlbumGrouping(true);
      const flatCount = checkUniqueIds();
      expect(flatCount).toBeGreaterThan(0);
    });
  });

  describe('persistence isolation', () => {
    it('should NOT persist songs data to localStorage', () => {
      const { setSongs, setIgnoreAlbumGrouping } = useLibraryStore.getState();

      setSongs(externalSongs);
      setIgnoreAlbumGrouping(true);

      const stored = JSON.parse(localStorage.getItem('slopsmith-library-settings') || '{}');

      expect(stored.state.settings).toBeDefined();
      expect(stored.state.settings.ignoreAlbumGrouping).toBe(true);
      expect(stored.state.songs).toBeUndefined();
      expect(stored.state.searchQuery).toBeUndefined();
      expect(stored.state.expandedNodes).toBeUndefined();
    });

    it('should persist all settings but not song data', () => {
      const { setSongs, setViewMode, setSortField, setSortDirection, setIgnoreAlbumGrouping } = useLibraryStore.getState();

      setSongs(externalSongs);
      setViewMode('list');
      setSortField('duration');
      setSortDirection('desc');
      setIgnoreAlbumGrouping(true);

      const stored = JSON.parse(localStorage.getItem('slopsmith-library-settings') || '{}');

      expect(stored.state.settings.viewMode).toBe('list');
      expect(stored.state.settings.sortField).toBe('duration');
      expect(stored.state.settings.sortDirection).toBe('desc');
      expect(stored.state.settings.ignoreAlbumGrouping).toBe(true);

      expect(stored.state.songs).toBeUndefined();
      expect(Object.keys(stored.state).length).toBe(1);
      expect(Object.keys(stored.state)[0]).toBe('settings');
    });

    it('rehydration should restore settings but not songs', () => {
      const { setSongs } = useLibraryStore.getState();
      setSongs(externalSongs);

      localStorage.setItem(
        'slopsmith-library-settings',
        JSON.stringify({
          state: {
            settings: {
              viewMode: 'list',
              sortField: 'year',
              sortDirection: 'desc',
              ignoreAlbumGrouping: true,
            },
          },
          version: 0,
        })
      );

      useLibraryStore.persist.rehydrate();

      const { settings, songs } = useLibraryStore.getState();
      expect(settings.viewMode).toBe('list');
      expect(settings.sortField).toBe('year');
      expect(settings.sortDirection).toBe('desc');
      expect(settings.ignoreAlbumGrouping).toBe(true);

      expect(songs.length).toBe(externalSongs.length);
    });
  });

  describe('search and sort across modes', () => {
    beforeEach(() => {
      useLibraryStore.getState().setSongs(externalSongs);
    });

    it('search results should be identical in both modes', () => {
      const { setIgnoreAlbumGrouping, setSearchQuery, getSortedFilteredSongs } = useLibraryStore.getState();

      setSearchQuery('Queen');

      setIgnoreAlbumGrouping(false);
      const groupedResults = getSortedFilteredSongs().map(s => s.id).sort();

      setIgnoreAlbumGrouping(true);
      const flatResults = getSortedFilteredSongs().map(s => s.id).sort();

      expect(groupedResults).toEqual(flatResults);
    });

    it('sorted order should be consistent in list view across modes', () => {
      const { setIgnoreAlbumGrouping, setSortField, setSortDirection, getSortedFilteredSongs } = useLibraryStore.getState();

      setSortField('duration');
      setSortDirection('asc');

      setIgnoreAlbumGrouping(false);
      const groupedOrder = getSortedFilteredSongs().map(s => s.id);

      setIgnoreAlbumGrouping(true);
      const flatOrder = getSortedFilteredSongs().map(s => s.id);

      expect(groupedOrder).toEqual(flatOrder);
    });

    it('album field is searchable in both modes', () => {
      const { setIgnoreAlbumGrouping, setSearchQuery, getSortedFilteredSongs } = useLibraryStore.getState();

      setSearchQuery('Metallica');

      setIgnoreAlbumGrouping(false);
      const groupedCount = getSortedFilteredSongs().length;

      setIgnoreAlbumGrouping(true);
      const flatCount = getSortedFilteredSongs().length;

      expect(groupedCount).toBe(flatCount);
      expect(groupedCount).toBeGreaterThan(0);

      for (const song of getSortedFilteredSongs()) {
        expect(song.album).toBeDefined();
        expect(song.album.length).toBeGreaterThan(0);
      }
    });

    it('tree view songs in flat mode respect sort settings', () => {
      const { setIgnoreAlbumGrouping, setSortField, setSortDirection, getTree } = useLibraryStore.getState();

      setIgnoreAlbumGrouping(true);

      setSortField('title');
      setSortDirection('asc');
      let tree = getTree();
      let queenSongs = tree.find(n => n.name === 'Queen')!.children!;
      expect(queenSongs[0].name).toBe('Bohemian Rhapsody');
      expect(queenSongs[2].name).toBe('Seven Seas of Rhye');

      setSortDirection('desc');
      tree = getTree();
      queenSongs = tree.find(n => n.name === 'Queen')!.children!;
      expect(queenSongs[0].name).toBe('Seven Seas of Rhye');
      expect(queenSongs[2].name).toBe('Bohemian Rhapsody');

      setSortField('year');
      setSortDirection('asc');
      tree = getTree();
      queenSongs = tree.find(n => n.name === 'Queen')!.children!;
      expect(queenSongs[0].song!.year).toBe(1974);
      expect(queenSongs[2].song!.year).toBe(1975);
    });
  });

  describe('setIgnoreAlbumGrouping', () => {
    beforeEach(() => {
      useLibraryStore.getState().setSongs(externalSongs);
    });

    it('should clear expanded nodes when toggling to prevent key collisions', () => {
      const { setIgnoreAlbumGrouping, toggleNode, getTree } = useLibraryStore.getState();
      const tree = getTree();
      const artistId = tree[0].id;

      toggleNode(artistId);
      expect(useLibraryStore.getState().expandedNodes.has(artistId)).toBe(true);

      setIgnoreAlbumGrouping(true);
      expect(useLibraryStore.getState().expandedNodes.size).toBe(0);
    });

    it('should change tree structure immediately when toggled', () => {
      const { setIgnoreAlbumGrouping, getTree } = useLibraryStore.getState();

      let tree = getTree();
      expect(tree[0].children![0].type).toBe('album');

      setIgnoreAlbumGrouping(true);
      tree = getTree();
      expect(tree[0].children![0].type).toBe('song');

      setIgnoreAlbumGrouping(false);
      tree = getTree();
      expect(tree[0].children![0].type).toBe('album');
    });
  });

  describe('default behavior (backward compatibility)', () => {
    beforeEach(() => {
      useLibraryStore.getState().setSongs(externalSongs);
    });

    it('should build grouped tree by default', () => {
      const { getTree } = useLibraryStore.getState();
      const tree = getTree();
      expect(tree[0].children![0].type).toBe('album');
    });

    it('should sort songs within album by track number in grouped mode', () => {
      const { getTree } = useLibraryStore.getState();
      const tree = getTree();

      const metallicaNode = tree.find(n => n.name === 'Metallica')!;
      const blackAlbum = metallicaNode.children!.find(a => a.name === 'Metallica')!;
      expect(blackAlbum.children![0].song!.trackNumber).toBe(1);
      expect(blackAlbum.children![1].song!.trackNumber).toBe(8);
    });
  });
});
