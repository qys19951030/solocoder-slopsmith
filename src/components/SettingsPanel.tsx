import { useLibraryStore } from '../store/useLibraryStore';
import type { SortField } from '../types';

export function SettingsPanel() {
  const { settings, setViewMode, setSortField, setSortDirection, setIgnoreAlbumGrouping } =
    useLibraryStore();

  return (
    <div className="settings-panel" style={panelStyle}>
      <h3 style={{ marginTop: 0 }}>库浏览设置</h3>

      <div style={groupStyle}>
        <label style={labelStyle}>视图模式</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode('tree')}
            style={getButtonStyle(settings.viewMode === 'tree')}
          >
            树形视图
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={getButtonStyle(settings.viewMode === 'list')}
          >
            列表视图
          </button>
        </div>
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>排序字段</label>
        <select
          value={settings.sortField}
          onChange={(e) => setSortField(e.target.value as SortField)}
          style={selectStyle}
        >
          <option value="title">标题</option>
          <option value="artist">艺术家</option>
          <option value="album">专辑</option>
          <option value="year">年份</option>
          <option value="duration">时长</option>
        </select>
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>排序方向</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setSortDirection('asc')}
            style={getButtonStyle(settings.sortDirection === 'asc')}
          >
            升序
          </button>
          <button
            onClick={() => setSortDirection('desc')}
            style={getButtonStyle(settings.sortDirection === 'desc')}
          >
            降序
          </button>
        </div>
      </div>

      <div style={groupStyle}>
        <label style={toggleLabelStyle}>
          <input
            type="checkbox"
            checked={settings.ignoreAlbumGrouping}
            onChange={(e) => setIgnoreAlbumGrouping(e.target.checked)}
            style={checkboxStyle}
          />
          忽略 Album 分组
          <span style={hintStyle}>
            启用后同一艺术家下直接显示歌曲，不按专辑分层
          </span>
        </label>
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: '#f5f5f5',
  borderRadius: '8px',
  marginBottom: '16px',
};

const groupStyle: React.CSSProperties = {
  marginBottom: '12px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 'bold',
  marginBottom: '6px',
  fontSize: '14px',
};

const toggleLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '14px',
  flexWrap: 'wrap',
};

const hintStyle: React.CSSProperties = {
  fontWeight: 'normal',
  fontSize: '12px',
  color: '#666',
  width: '100%',
  marginLeft: '28px',
};

const checkboxStyle: React.CSSProperties = {
  width: '18px',
  height: '18px',
  cursor: 'pointer',
};

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '14px',
  width: '100%',
};

function getButtonStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 14px',
    borderRadius: '4px',
    border: active ? '1px solid #007bff' : '1px solid #ccc',
    backgroundColor: active ? '#007bff' : 'white',
    color: active ? 'white' : '#333',
    cursor: 'pointer',
    fontSize: '14px',
  };
}
