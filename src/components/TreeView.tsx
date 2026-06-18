import { useLibraryStore } from '../store/useLibraryStore';
import type { TreeNode, Song } from '../types';

interface TreeViewProps {
  onSongSelect?: (song: Song) => void;
}

export function TreeView({ onSongSelect }: TreeViewProps) {
  const { getTree, toggleNode, expandAll, collapseAll, settings } = useLibraryStore();
  const tree = getTree();

  return (
    <div className="tree-view">
      <div style={toolbarStyle}>
        <button onClick={expandAll} style={toolBtnStyle}>全部展开</button>
        <button onClick={collapseAll} style={toolBtnStyle}>全部折叠</button>
        <span style={statusStyle}>
          {settings.ignoreAlbumGrouping ? '扁平模式' : '专辑分组模式'}
        </span>
      </div>
      <div className="tree-container" style={treeContainerStyle}>
        {tree.map((node) => (
          <TreeNodeComponent
            key={node.id}
            node={node}
            depth={0}
            onToggle={toggleNode}
            onSongSelect={onSongSelect}
          />
        ))}
      </div>
    </div>
  );
}

interface TreeNodeComponentProps {
  node: TreeNode;
  depth: number;
  onToggle: (id: string) => void;
  onSongSelect?: (song: Song) => void;
}

function TreeNodeComponent({ node, depth, onToggle, onSongSelect }: TreeNodeComponentProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = node.expanded ?? false;

  const handleClick = () => {
    if (node.type === 'song' && node.song && onSongSelect) {
      onSongSelect(node.song);
    } else if (hasChildren) {
      onToggle(node.id);
    }
  };

  const icon = node.type === 'song' ? '🎵' : node.type === 'album' ? '💿' : '🎤';
  const caret = hasChildren ? (isExpanded ? '▼' : '▶') : '  ';

  return (
    <div className="tree-node" data-testid={`tree-node-${node.id}`}>
      <div
        className={`tree-node-row ${node.type}`}
        onClick={handleClick}
        style={{
          ...rowStyle,
          paddingLeft: `${depth * 20 + 8}px`,
          cursor: hasChildren || onSongSelect ? 'pointer' : 'default',
        }}
      >
        <span style={caretStyle}>{caret}</span>
        <span style={iconStyle}>{icon}</span>
        <span style={nameStyle}>{node.name}</span>
        {node.type !== 'song' && node.children && (
          <span style={countStyle}>({node.children.length})</span>
        )}
        {node.type === 'song' && node.song && (
          <span style={metaStyle}>
            {formatDuration(node.song.duration)}
          </span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div className="tree-children">
          {node.children!.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              depth={depth + 1}
              onToggle={onToggle}
              onSongSelect={onSongSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '12px',
  alignItems: 'center',
};

const toolBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  backgroundColor: 'white',
  cursor: 'pointer',
  fontSize: '13px',
};

const statusStyle: React.CSSProperties = {
  marginLeft: 'auto',
  fontSize: '12px',
  color: '#666',
  fontStyle: 'italic',
};

const treeContainerStyle: React.CSSProperties = {
  border: '1px solid #e0e0e0',
  borderRadius: '6px',
  padding: '8px 0',
  backgroundColor: 'white',
  maxHeight: '600px',
  overflowY: 'auto',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '4px 8px',
  gap: '6px',
  fontSize: '14px',
  minHeight: '28px',
};

const caretStyle: React.CSSProperties = {
  width: '16px',
  fontSize: '10px',
  color: '#999',
  flexShrink: 0,
};

const iconStyle: React.CSSProperties = {
  fontSize: '14px',
  flexShrink: 0,
};

const nameStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const countStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#999',
  flexShrink: 0,
};

const metaStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
  flexShrink: 0,
  marginLeft: '8px',
};
