import type { Song, TreeNode } from '../types';

export function buildArtistAlbumTree(songs: Song[]): TreeNode[] {
  const artistMap = new Map<string, Map<string, Map<string, Song>>>();
  const seenSongIds = new Set<string>();

  for (const song of songs) {
    if (seenSongIds.has(song.id)) continue;
    seenSongIds.add(song.id);

    if (!artistMap.has(song.artist)) {
      artistMap.set(song.artist, new Map());
    }
    const albumMap = artistMap.get(song.artist)!;
    if (!albumMap.has(song.album)) {
      albumMap.set(song.album, new Map());
    }
    albumMap.get(song.album)!.set(song.id, song);
  }

  const artists: TreeNode[] = [];
  const sortedArtists = Array.from(artistMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  for (const [artistName, albumMap] of sortedArtists) {
    const albums: TreeNode[] = [];
    const sortedAlbums = Array.from(albumMap.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );

    for (const [albumName, songMap] of sortedAlbums) {
      const albumSongs = Array.from(songMap.values());
      const songNodes: TreeNode[] = albumSongs
        .sort((a, b) => a.trackNumber - b.trackNumber)
        .map((song) => ({
          id: makeSongNodeId(song),
          type: 'song' as const,
          name: song.title,
          song,
        }));

      albums.push({
        id: makeAlbumNodeId(artistName, albumName),
        type: 'album',
        name: albumName,
        children: songNodes,
        expanded: false,
      });
    }

    artists.push({
      id: makeArtistNodeId(artistName),
      type: 'artist',
      name: artistName,
      children: albums,
      expanded: false,
    });
  }

  return artists;
}

export function buildArtistFlatTree(songs: Song[]): TreeNode[] {
  const artistMap = new Map<string, Map<string, Song>>();
  const seenSongIds = new Set<string>();

  for (const song of songs) {
    if (seenSongIds.has(song.id)) continue;
    seenSongIds.add(song.id);

    if (!artistMap.has(song.artist)) {
      artistMap.set(song.artist, new Map());
    }
    artistMap.get(song.artist)!.set(song.id, song);
  }

  const artists: TreeNode[] = [];
  const sortedArtists = Array.from(artistMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  for (const [artistName, songMap] of sortedArtists) {
    const artistSongs = Array.from(songMap.values());
    const songNodes: TreeNode[] = artistSongs.map((song) => ({
      id: makeFlatSongNodeId(song),
      type: 'song' as const,
      name: song.title,
      song,
    }));

    artists.push({
      id: makeArtistNodeId(artistName),
      type: 'artist',
      name: artistName,
      children: songNodes,
      expanded: false,
    });
  }

  return artists;
}

export function makeArtistNodeId(artist: string): string {
  return `artist:${artist}`;
}

export function makeAlbumNodeId(artist: string, album: string): string {
  return `album:${artist}/${album}`;
}

export function makeSongNodeId(song: Song): string {
  return `song:${song.artist}/${song.album}/${song.id}`;
}

export function makeFlatSongNodeId(song: Song): string {
  return `song-flat:${song.artist}/${song.id}`;
}

export function buildLibraryTree(
  songs: Song[],
  ignoreAlbumGrouping: boolean
): TreeNode[] {
  if (ignoreAlbumGrouping) {
    return buildArtistFlatTree(songs);
  }
  return buildArtistAlbumTree(songs);
}

export function countSongsInTree(nodes: TreeNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.type === 'song') {
      count++;
    } else if (node.children) {
      count += countSongsInTree(node.children);
    }
  }
  return count;
}

export function collectAllSongNodes(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  for (const node of nodes) {
    if (node.type === 'song') {
      result.push(node);
    } else if (node.children) {
      result.push(...collectAllSongNodes(node.children));
    }
  }
  return result;
}
