import { describe, it, expect } from 'vitest';
import {
  buildArtistAlbumTree,
  buildArtistFlatTree,
  buildLibraryTree,
  makeArtistNodeId,
  makeAlbumNodeId,
  makeSongNodeId,
  makeFlatSongNodeId,
  countSongsInTree,
  collectAllSongNodes,
} from '../src/utils/tree';
import type { Song } from '../src/types';

const testSongs: Song[] = [
  { id: 's1', title: 'Song A', artist: 'Artist 1', album: 'Album X', trackNumber: 1, duration: 200, genre: 'Rock', year: 2020 },
  { id: 's2', title: 'Song B', artist: 'Artist 1', album: 'Album X', trackNumber: 2, duration: 180, genre: 'Rock', year: 2020 },
  { id: 's3', title: 'Song C', artist: 'Artist 1', album: 'Album Y', trackNumber: 1, duration: 220, genre: 'Rock', year: 2021 },
  { id: 's4', title: 'Song D', artist: 'Artist 2', album: 'Album Z', trackNumber: 1, duration: 190, genre: 'Pop', year: 2019 },
];

describe('tree utilities', () => {
  describe('makeArtistNodeId', () => {
    it('should generate consistent artist node IDs', () => {
      expect(makeArtistNodeId('Artist 1')).toBe('artist:Artist 1');
      expect(makeArtistNodeId('Artist 1')).toBe(makeArtistNodeId('Artist 1'));
    });
  });

  describe('makeAlbumNodeId', () => {
    it('should generate consistent album node IDs including artist', () => {
      expect(makeAlbumNodeId('Artist 1', 'Album X')).toBe('album:Artist 1/Album X');
      expect(makeAlbumNodeId('Artist 1', 'Album X')).toBe(makeAlbumNodeId('Artist 1', 'Album X'));
      expect(makeAlbumNodeId('Artist 1', 'Album X')).not.toBe(makeAlbumNodeId('Artist 2', 'Album X'));
    });
  });

  describe('makeSongNodeId', () => {
    it('should generate song node IDs including artist and album for grouped mode', () => {
      const song = testSongs[0];
      expect(makeSongNodeId(song)).toBe(`song:${song.artist}/${song.album}/${song.id}`);
    });
  });

  describe('makeFlatSongNodeId', () => {
    it('should generate song node IDs including only artist and id for flat mode', () => {
      const song = testSongs[0];
      expect(makeFlatSongNodeId(song)).toBe(`song-flat:${song.artist}/${song.id}`);
    });

    it('should use different prefix from grouped mode to avoid collisions', () => {
      const song = testSongs[0];
      expect(makeFlatSongNodeId(song)).not.toBe(makeSongNodeId(song));
    });
  });

  describe('buildArtistAlbumTree', () => {
    it('should build tree with Artist -> Album -> Song structure', () => {
      const tree = buildArtistAlbumTree(testSongs);

      expect(tree.length).toBe(2);
      expect(tree[0].type).toBe('artist');
      expect(tree[0].name).toBe('Artist 1');
      expect(tree[0].children).toHaveLength(2);

      const albumX = tree[0].children![0];
      expect(albumX.type).toBe('album');
      expect(albumX.name).toBe('Album X');
      expect(albumX.children).toHaveLength(2);
      expect(albumX.children![0].type).toBe('song');
      expect(albumX.children![0].name).toBe('Song A');

      const albumY = tree[0].children![1];
      expect(albumY.type).toBe('album');
      expect(albumY.name).toBe('Album Y');
      expect(albumY.children).toHaveLength(1);

      expect(tree[1].type).toBe('artist');
      expect(tree[1].name).toBe('Artist 2');
      expect(tree[1].children).toHaveLength(1);
      expect(tree[1].children![0].type).toBe('album');
    });

    it('should sort songs within album by track number', () => {
      const tree = buildArtistAlbumTree(testSongs);
      const albumX = tree[0].children![0];
      expect(albumX.children![0].song!.trackNumber).toBe(1);
      expect(albumX.children![1].song!.trackNumber).toBe(2);
    });

    it('should deduplicate songs by ID', () => {
      const duplicateSongs = [...testSongs, testSongs[0]];
      const tree = buildArtistAlbumTree(duplicateSongs);
      const albumX = tree[0].children![0];
      expect(albumX.children).toHaveLength(2);
    });

    it('should generate unique IDs for each node', () => {
      const tree = buildArtistAlbumTree(testSongs);
      const allNodes = [...tree, ...tree.flatMap(n => n.children || []), ...tree.flatMap(n => n.children?.flatMap(c => c.children || []) || [])];
      const ids = allNodes.map(n => n.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('buildArtistFlatTree', () => {
    it('should build tree with Artist -> Song structure (no album layer)', () => {
      const tree = buildArtistFlatTree(testSongs);

      expect(tree.length).toBe(2);
      expect(tree[0].type).toBe('artist');
      expect(tree[0].name).toBe('Artist 1');
      expect(tree[0].children).toHaveLength(3);

      expect(tree[0].children![0].type).toBe('song');
      expect(tree[0].children![1].type).toBe('song');
      expect(tree[0].children![2].type).toBe('song');

      for (const node of tree[0].children!) {
        expect(node.type).not.toBe('album');
      }

      expect(tree[1].type).toBe('artist');
      expect(tree[1].name).toBe('Artist 2');
      expect(tree[1].children).toHaveLength(1);
      expect(tree[1].children![0].type).toBe('song');
    });

    it('should preserve album metadata in song objects', () => {
      const tree = buildArtistFlatTree(testSongs);
      const songs = collectAllSongNodes(tree);
      for (const songNode of songs) {
        expect(songNode.song!.album).toBeDefined();
        expect(songNode.song!.album.length).toBeGreaterThan(0);
      }
    });

    it('should deduplicate songs by ID', () => {
      const duplicateSongs = [...testSongs, testSongs[0], testSongs[2]];
      const tree = buildArtistFlatTree(duplicateSongs);
      expect(tree[0].children).toHaveLength(3);
    });

    it('should generate unique IDs for each node', () => {
      const tree = buildArtistFlatTree(testSongs);
      const allNodes = [...tree, ...tree.flatMap(n => n.children || [])];
      const ids = allNodes.map(n => n.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should use flat-mode song IDs to avoid collision with grouped mode', () => {
      const tree = buildArtistFlatTree(testSongs);
      const songs = collectAllSongNodes(tree);
      for (const songNode of songs) {
        expect(songNode.id).toMatch(/^song-flat:/);
        expect(songNode.id).not.toMatch(/^song:/);
      }
    });
  });

  describe('buildLibraryTree', () => {
    it('should build grouped tree when ignoreAlbumGrouping is false', () => {
      const tree = buildLibraryTree(testSongs, false);
      expect(tree[0].children![0].type).toBe('album');
    });

    it('should build flat tree when ignoreAlbumGrouping is true', () => {
      const tree = buildLibraryTree(testSongs, true);
      expect(tree[0].children![0].type).toBe('song');
    });
  });

  describe('countSongsInTree', () => {
    it('should count all songs in grouped tree', () => {
      const tree = buildArtistAlbumTree(testSongs);
      expect(countSongsInTree(tree)).toBe(4);
    });

    it('should count all songs in flat tree', () => {
      const tree = buildArtistFlatTree(testSongs);
      expect(countSongsInTree(tree)).toBe(4);
    });
  });

  describe('collectAllSongNodes', () => {
    it('should collect all song nodes from grouped tree', () => {
      const tree = buildArtistAlbumTree(testSongs);
      const songs = collectAllSongNodes(tree);
      expect(songs.length).toBe(4);
      for (const song of songs) {
        expect(song.type).toBe('song');
        expect(song.song).toBeDefined();
      }
    });

    it('should collect all song nodes from flat tree', () => {
      const tree = buildArtistFlatTree(testSongs);
      const songs = collectAllSongNodes(tree);
      expect(songs.length).toBe(4);
      for (const song of songs) {
        expect(song.type).toBe('song');
        expect(song.song).toBeDefined();
      }
    });
  });
});
