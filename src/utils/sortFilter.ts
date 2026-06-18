import type { Song, SortField, SortDirection } from '../types';

export function sortSongs(
  songs: Song[],
  field: SortField,
  direction: SortDirection
): Song[] {
  const sorted = [...songs].sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'artist':
        comparison = a.artist.localeCompare(b.artist);
        break;
      case 'album':
        comparison = a.album.localeCompare(b.album);
        break;
      case 'year':
        comparison = a.year - b.year;
        break;
      case 'duration':
        comparison = a.duration - b.duration;
        break;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

export function filterSongs(songs: Song[], query: string): Song[] {
  if (!query.trim()) {
    return songs;
  }

  const lowerQuery = query.toLowerCase();
  return songs.filter(
    (song) =>
      song.title.toLowerCase().includes(lowerQuery) ||
      song.artist.toLowerCase().includes(lowerQuery) ||
      song.album.toLowerCase().includes(lowerQuery) ||
      song.genre.toLowerCase().includes(lowerQuery)
  );
}
