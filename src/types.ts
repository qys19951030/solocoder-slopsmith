export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  trackNumber: number;
  duration: number;
  genre: string;
  year: number;
}

export type LibraryViewMode = 'tree' | 'list';

export type SortField = 'title' | 'artist' | 'album' | 'year' | 'duration';
export type SortDirection = 'asc' | 'desc';

export interface LibrarySettings {
  viewMode: LibraryViewMode;
  sortField: SortField;
  sortDirection: SortDirection;
  ignoreAlbumGrouping: boolean;
}

export interface TreeNode {
  id: string;
  type: 'artist' | 'album' | 'song';
  name: string;
  children?: TreeNode[];
  song?: Song;
  expanded?: boolean;
}

export interface ListItem {
  key: string;
  song: Song;
}
