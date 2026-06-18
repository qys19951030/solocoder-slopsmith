import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Song,
  LibrarySettings,
  LibraryViewMode,
  SortField,
  SortDirection,
  TreeNode,
} from '../types';
import { sampleSongs } from '../data/songs';
import { buildLibraryTree } from '../utils/tree';
import { sortSongs, filterSongs } from '../utils/sortFilter';

interface LibraryState {
  songs: Song[];
  settings: LibrarySettings;
  searchQuery: string;
  expandedNodes: Set<string>;

  setViewMode: (mode: LibraryViewMode) => void;
  setSortField: (field: SortField) => void;
  setSortDirection: (dir: SortDirection) => void;
  setIgnoreAlbumGrouping: (ignore: boolean) => void;
  setSearchQuery: (query: string) => void;

  toggleNode: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  getFilteredSongs: () => Song[];
  getSortedFilteredSongs: () => Song[];
  getTree: () => TreeNode[];
}

const defaultSettings: LibrarySettings = {
  viewMode: 'tree',
  sortField: 'title',
  sortDirection: 'asc',
  ignoreAlbumGrouping: false,
};

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      songs: sampleSongs,
      settings: defaultSettings,
      searchQuery: '',
      expandedNodes: new Set<string>(),

      setViewMode: (mode) =>
        set((state) => ({
          settings: { ...state.settings, viewMode: mode },
        })),

      setSortField: (field) =>
        set((state) => ({
          settings: { ...state.settings, sortField: field },
        })),

      setSortDirection: (dir) =>
        set((state) => ({
          settings: { ...state.settings, sortDirection: dir },
        })),

      setIgnoreAlbumGrouping: (ignore) =>
        set((state) => ({
          settings: { ...state.settings, ignoreAlbumGrouping: ignore },
          expandedNodes: new Set<string>(),
        })),

      setSearchQuery: (query) => set({ searchQuery: query }),

      toggleNode: (nodeId) =>
        set((state) => {
          const newExpanded = new Set(state.expandedNodes);
          if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
          } else {
            newExpanded.add(nodeId);
          }
          return { expandedNodes: newExpanded };
        }),

      expandAll: () => {
        const tree = get().getTree();
        const allIds = new Set<string>();
        const collect = (nodes: TreeNode[]) => {
          for (const node of nodes) {
            if (node.type !== 'song') {
              allIds.add(node.id);
              if (node.children) {
                collect(node.children);
              }
            }
          }
        };
        collect(tree);
        set({ expandedNodes: allIds });
      },

      collapseAll: () => set({ expandedNodes: new Set<string>() }),

      getFilteredSongs: () => {
        const { songs, searchQuery } = get();
        return filterSongs(songs, searchQuery);
      },

      getSortedFilteredSongs: () => {
        const { settings, searchQuery, songs } = get();
        const filtered = filterSongs(songs, searchQuery);
        return sortSongs(filtered, settings.sortField, settings.sortDirection);
      },

      getTree: () => {
        const { settings, searchQuery, songs, expandedNodes } = get();
        const filtered = filterSongs(songs, searchQuery);

        let result = buildLibraryTree(filtered, settings.ignoreAlbumGrouping);

        const applySortToTree = (nodes: TreeNode[]): TreeNode[] => {
          return nodes.map((node) => {
            if (node.type === 'song') return node;
            if (!node.children) return node;

            let sortedChildren: TreeNode[];
            if (node.type === 'album') {
              sortedChildren = [...node.children].sort((a, b) => {
                if (!a.song || !b.song) return 0;
                return a.song.trackNumber - b.song.trackNumber;
              });
            } else if (
              node.type === 'artist' &&
              settings.ignoreAlbumGrouping &&
              node.children.length > 0 &&
              node.children[0].type === 'song'
            ) {
              const songNodes = node.children.filter(
                (n): n is TreeNode & { song: Song } => n.type === 'song' && !!n.song
              );
              const sortedSongs = sortSongs(
                songNodes.map((n) => n.song),
                settings.sortField,
                settings.sortDirection
              );
              const songMap = new Map(songNodes.map((n) => [n.song.id, n]));
              sortedChildren = sortedSongs
                .map((s) => songMap.get(s.id))
                .filter((n): n is TreeNode & { song: Song } => !!n);
            } else {
              sortedChildren = applySortToTree(node.children);
            }

            return {
              ...node,
              children: sortedChildren,
              expanded: expandedNodes.has(node.id),
            };
          });
        };

        result = applySortToTree(result);

        return result;
      },
    }),
    {
      name: 'slopsmith-library-settings',
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);
