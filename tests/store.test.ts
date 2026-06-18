import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useLibraryStore } from '../src/store/useLibraryStore';
import type { Song } from '../src/types';

const testSongs: Song[] = [
  { id: 's1', title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', trackNumber: 11, duration: 354, genre: 'Rock', year: 1975 },
  { id: 's2', title: 'We Will Rock You', artist: 'Queen', album: 'News of the World', trackNumber: 1, duration: 122, genre: 'Rock', year: 1977 },
  { id: 's3', title: 'Billie Jean', artist: 'Michael Jackson', album: 'Thriller', trackNumber: 6, duration: 294, genre: 'Pop', year: 1982 },
  { id: 's4', title: 'Thriller', artist: 'Michael Jackson', album: 'Thriller', trackNumber: 14, duration: 357, genre: 'Pop', year: 1982 },
  { id: 's5', title: 'Heroes', artist: 'David Bowie', album: 'Heroes', trackNumber: 6, duration: 370, genre: 'Rock', year: 1977 },
];

describe('useLibraryStore', () => {
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

  describe('default behavior', () => {
    it('should have ignoreAlbumGrouping disabled by default', () => {
      const { settings } = useLibraryStore.getState();
      expect(settings.ignoreAlbumGrouping).toBe(false);
    });

    it('should build grouped tree (Artist -> Album -> Song) by default', () => {
      const { getTree } = useLibraryStore.getState();
      const tree = getTree();

      expect(tree[0].type).toBe('artist');
      expect(tree[0].name).toBe('David Bowie');
      expect(tree[0].children![0].type).toBe('album');
    });

    it('should persist settings to localStorage', () => {
      const { setIgnoreAlbumGrouping } = useLibraryStore.getState();
      setIgnoreAlbumGrouping(true);

      const stored = JSON.parse(localStorage.getItem('slopsmith-library-settings') || '{}');
      expect(stored.state.settings.ignoreAlbumGrouping).toBe(true);
    });
  });

  describe('setIgnoreAlbumGrouping', () => {
    it('should update the setting', () => {
      const { settings, setIgnoreAlbumGrouping } = useLibraryStore.getState();
      expect(settings.ignoreAlbumGrouping).toBe(false);

      setIgnoreAlbumGrouping(true);
      expect(useLibraryStore.getState().settings.ignoreAlbumGrouping).toBe(true);

      setIgnoreAlbumGrouping(false);
      expect(useLibraryStore.getState().settings.ignoreAlbumGrouping).toBe(false);
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

  describe('getTree with flat mode', () => {
    beforeEach(() => {
      useLibraryStore.setState({
        settings: {
          viewMode: 'tree',
          sortField: 'title',
          sortDirection: 'asc',
          ignoreAlbumGrouping: true,
        },
      });
    });

    it('should build flat tree (Artist -> Song) with no album layer', () => {
      const { getTree } = useLibraryStore.getState();
      const tree = getTree();

      expect(tree.length).toBe(3);

      const queenNode = tree.find(n => n.name === 'Queen')!;
      expect(queenNode.type).toBe('artist');
      expect(queenNode.children!.length).toBe(2);
      expect(queenNode.children![0].type).toBe('song');
      expect(queenNode.children![1].type).toBe('song');

      for (const child of queenNode.children!) {
        expect(child.type).not.toBe('album');
      }
    });

    it('should preserve album metadata in songs', () => {
      const { getTree } = useLibraryStore.getState();
      const tree = getTree();
      const queenNode = tree.find(n => n.name === 'Queen')!;
      const songs = queenNode.children!;

      expect(songs[0].song!.album).toBeDefined();
      expect(songs[1].song!.album).toBeDefined();
      expect(songs[0].song!.album).not.toBe(songs[1].song!.album);
    });

    it('should apply global sort settings to songs in flat mode', () => {
      const { getTree, setSortField, setSortDirection } = useLibraryStore.getState();

      let tree = getTree();
      let queenSongs = tree.find(n => n.name === 'Queen')!.children!;
      expect(queenSongs[0].name).toBe('Bohemian Rhapsody');
      expect(queenSongs[1].name).toBe('We Will Rock You');

      setSortDirection('desc');
      tree = getTree();
      queenSongs = tree.find(n => n.name === 'Queen')!.children!;
      expect(queenSongs[0].name).toBe('We Will Rock You');
      expect(queenSongs[1].name).toBe('Bohemian Rhapsody');

      setSortField('year');
      setSortDirection('asc');
      tree = getTree();
      queenSongs = tree.find(n => n.name === 'Queen')!.children!;
      expect(queenSongs[0].song!.year).toBe(1975);
      expect(queenSongs[1].song!.year).toBe(1977);

      setSortField('duration');
      setSortDirection('asc');
      tree = getTree();
      queenSongs = tree.find(n => n.name === 'Queen')!.children!;
      expect(queenSongs[0].song!.duration).toBe(122);
      expect(queenSongs[1].song!.duration).toBe(354);
    });

    it('should not affect grouped mode sorting (albums still sort by track number)', () => {
      const { getTree, setIgnoreAlbumGrouping, setSortField } = useLibraryStore.getState();

      setSortField('duration');
      setIgnoreAlbumGrouping(false);

      const tree = getTree();
      const queenNode = tree.find(n => n.name === 'Queen')!;
      const albums = queenNode.children!;

      const operaAlbum = albums.find(a => a.name === 'A Night at the Opera')!;
      expect(operaAlbum.children![0].song!.trackNumber).toBe(11);

      const newsAlbum = albums.find(a => a.name === 'News of the World')!;
      expect(newsAlbum.children![0].song!.trackNumber).toBe(1);
    });
  });

  describe('search and filter', () => {
    it('should work correctly in grouped mode', () => {
      const { setSearchQuery, getTree, getSortedFilteredSongs } = useLibraryStore.getState();

      setSearchQuery('Queen');
      expect(getSortedFilteredSongs().length).toBe(2);

      const tree = getTree();
      expect(tree.length).toBe(1);
      expect(tree[0].name).toBe('Queen');
      expect(tree[0].children!.length).toBe(2);
    });

    it('should work correctly in flat mode', () => {
      const { setIgnoreAlbumGrouping, setSearchQuery, getTree, getSortedFilteredSongs } = useLibraryStore.getState();

      setIgnoreAlbumGrouping(true);
      setSearchQuery('Queen');
      expect(getSortedFilteredSongs().length).toBe(2);

      const tree = getTree();
      expect(tree.length).toBe(1);
      expect(tree[0].name).toBe('Queen');
      expect(tree[0].children!.length).toBe(2);
      expect(tree[0].children![0].type).toBe('song');
    });

    it('should search by album field even in flat mode', () => {
      const { setIgnoreAlbumGrouping, setSearchQuery, getTree, getSortedFilteredSongs } = useLibraryStore.getState();

      setIgnoreAlbumGrouping(true);
      setSearchQuery('Thriller');

      const songs = getSortedFilteredSongs();
      expect(songs.length).toBe(2);
      expect(songs[0].album).toBe('Thriller');

      const tree = getTree();
      expect(tree.length).toBe(1);
      expect(tree[0].children!.length).toBe(2);
      expect(tree[0].children![0].song!.album).toBe('Thriller');
    });
  });

  describe('persistence', () => {
    it('should load ignoreAlbumGrouping setting from localStorage', () => {
      localStorage.setItem(
        'slopsmith-library-settings',
        JSON.stringify({
          state: {
            settings: {
              viewMode: 'tree',
              sortField: 'title',
              sortDirection: 'asc',
              ignoreAlbumGrouping: true,
            },
          },
          version: 0,
        })
      );

      useLibraryStore.persist.rehydrate();

      const { settings } = useLibraryStore.getState();
      expect(settings.ignoreAlbumGrouping).toBe(true);
    });

    it('should persist all settings including ignoreAlbumGrouping', () => {
      const { setIgnoreAlbumGrouping, setSortField, setSortDirection, setViewMode } = useLibraryStore.getState();

      setIgnoreAlbumGrouping(true);
      setSortField('year');
      setSortDirection('desc');
      setViewMode('list');

      const stored = JSON.parse(localStorage.getItem('slopsmith-library-settings') || '{}');
      expect(stored.state.settings.ignoreAlbumGrouping).toBe(true);
      expect(stored.state.settings.sortField).toBe('year');
      expect(stored.state.settings.sortDirection).toBe('desc');
      expect(stored.state.settings.viewMode).toBe('list');
    });
  });

  describe('getSortedFilteredSongs', () => {
    it('should return songs sorted by title asc by default', () => {
      const { getSortedFilteredSongs } = useLibraryStore.getState();
      const songs = getSortedFilteredSongs();
      expect(songs[0].title).toBe('Billie Jean');
      expect(songs[1].title).toBe('Bohemian Rhapsody');
    });

    it('should apply sort field and direction correctly', () => {
      const { getSortedFilteredSongs, setSortField, setSortDirection } = useLibraryStore.getState();

      setSortField('year');
      setSortDirection('desc');

      const songs = getSortedFilteredSongs();
      expect(songs[0].year).toBe(1982);
      expect(songs[songs.length - 1].year).toBe(1975);
    });

    it('should work regardless of ignoreAlbumGrouping setting', () => {
      const { getSortedFilteredSongs, setIgnoreAlbumGrouping, setSortField } = useLibraryStore.getState();

      setSortField('duration');
      setIgnoreAlbumGrouping(true);
      const flatSongs = getSortedFilteredSongs();

      setIgnoreAlbumGrouping(false);
      const groupedSongs = getSortedFilteredSongs();

      expect(flatSongs.map(s => s.id)).toEqual(groupedSongs.map(s => s.id));
    });
  });
});
