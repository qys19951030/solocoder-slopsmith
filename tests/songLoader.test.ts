import { describe, it, expect } from 'vitest';
import { loadSongs, loadSongsSync, type SongDataSource } from '../src/data/songLoader';
import { sampleSongs } from '../src/data/songs';
import type { Song } from '../src/types';

const externalSongs: Song[] = [
  { id: 'ext1', title: 'External Song 1', artist: 'External Artist', album: 'Ext Album', trackNumber: 1, duration: 100, genre: 'Test', year: 2024 },
  { id: 'ext2', title: 'External Song 2', artist: 'External Artist', album: 'Ext Album', trackNumber: 2, duration: 200, genre: 'Test', year: 2024 },
];

describe('songLoader - unified data loading', () => {
  describe('loadSongs (async)', () => {
    it('should fall back to sampleSongs when no source is provided', async () => {
      const result = await loadSongs();
      expect(result.length).toBe(sampleSongs.length);
      expect(result[0].id).toBe(sampleSongs[0].id);
    });

    it('should return a copy, not a reference to sampleSongs', async () => {
      const result = await loadSongs();
      expect(result).not.toBe(sampleSongs);
      result.push({ id: 'temp', title: 'Temp', artist: 'Temp', album: 'Temp', trackNumber: 1, duration: 1, genre: 'Temp', year: 2000 });
      expect(sampleSongs.length).toBeGreaterThan(0);
      const reloaded = await loadSongs();
      expect(reloaded.length).toBe(sampleSongs.length);
    });

    it('should use injected sync data source', async () => {
      const syncSource: SongDataSource = () => externalSongs;
      const result = await loadSongs(syncSource);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('ext1');
      expect(result[1].id).toBe('ext2');
    });

    it('should use injected async data source', async () => {
      const asyncSource: SongDataSource = async () => {
        await new Promise((r) => setTimeout(r, 10));
        return externalSongs;
      };
      const result = await loadSongs(asyncSource);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('ext1');
    });

    it('should propagate errors from failing data sources', async () => {
      const failingSource: SongDataSource = () => {
        throw new Error('Network error');
      };
      await expect(loadSongs(failingSource)).rejects.toThrow('Network error');
    });

    it('should propagate async errors', async () => {
      const failingAsyncSource: SongDataSource = async () => {
        throw new Error('Async fetch failed');
      };
      await expect(loadSongs(failingAsyncSource)).rejects.toThrow('Async fetch failed');
    });

    it('should return a copy of injected data (not reference)', async () => {
      const mutable = [...externalSongs];
      const source: SongDataSource = () => mutable;
      const result = await loadSongs(source);
      expect(result).not.toBe(mutable);

      result.push({ id: 'new', title: 'X', artist: 'X', album: 'X', trackNumber: 1, duration: 1, genre: 'X', year: 2000 });
      const result2 = await loadSongs(source);
      expect(result2.length).toBe(2);
    });
  });

  describe('loadSongsSync', () => {
    it('should fall back to sampleSongs when no source is provided', () => {
      const result = loadSongsSync();
      expect(result.length).toBe(sampleSongs.length);
    });

    it('should use injected sync data source', () => {
      const syncSource: SongDataSource = () => externalSongs;
      const result = loadSongsSync(syncSource);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('ext1');
    });

    it('should throw when given an async source', () => {
      const asyncSource: SongDataSource = async () => externalSongs;
      expect(() => loadSongsSync(asyncSource)).toThrow(/does not support async/);
    });

    it('should propagate errors', () => {
      const failingSource: SongDataSource = () => {
        throw new Error('Sync error');
      };
      expect(() => loadSongsSync(failingSource)).toThrow('Sync error');
    });
  });

  describe('fallback and injected data follow same structure', () => {
    it('fallback data can be used to build tree and list views', async () => {
      const songs = await loadSongs();
      expect(songs.every((s) => !!s.id && !!s.title && !!s.artist && !!s.album)).toBe(true);
    });

    it('injected external data can be used to build tree and list views', async () => {
      const songs = await loadSongs(() => externalSongs);
      expect(songs.every((s) => !!s.id && !!s.title && !!s.artist && !!s.album)).toBe(true);
    });
  });
});
