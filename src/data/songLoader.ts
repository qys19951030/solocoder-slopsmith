import type { Song } from '../types';
import { sampleSongs } from './songs';

export type SongDataSource = () => Promise<Song[]> | Song[];

export async function loadSongs(source?: SongDataSource): Promise<Song[]> {
  if (source) {
    const result = source();
    const songs = result instanceof Promise ? await result : result;
    return [...songs];
  }
  return [...sampleSongs];
}

export function loadSongsSync(source?: SongDataSource): Song[] {
  if (source) {
    const result = source();
    if (result instanceof Promise) {
      throw new Error('loadSongsSync does not support async data sources');
    }
    return [...result];
  }
  return [...sampleSongs];
}
