import { useMemo } from "react";

const Breadcrumbs = ({ files = [], currentFolderId = null, history = [null], pos = 0, onBack, onForward, onGoTo }) => {
  const path = useMemo(() => {
    const segments = [];
    let cur = currentFolderId;
    while (cur) {
      const item = files.find((f) => f.fileId === cur);
      if (!item) break;
      segments.unshift({ id: item.fileId, name: item.fileName || item.fileName });
      cur = item.parentId || null;
    }
    return [{ id: null, name: "Home" }, ...segments];
  }, [files, currentFolderId]);

  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} disabled={pos <= 0} className="px-2 py-1 border rounded text-sm disabled:opacity-50">◀</button>
        <button onClick={onForward} disabled={pos >= history.length - 1} className="px-2 py-1 border rounded text-sm disabled:opacity-50">▶</button>
      </div>

      <nav className="flex items-center gap-2 text-sm text-gray-300 overflow-x-auto">
        {path.map((seg, idx) => (
          <span key={seg.id ?? "home"} className="flex items-center gap-2">
            <button
              onClick={() => onGoTo(seg.id)}
              className="hover:underline truncate max-w-xs"
              title={seg.name}
            >
              {seg.name}
            </button>
            {idx < path.length - 1 && <span className="opacity-60">/</span>}
          </span>
        ))}
      </nav>
    </div>
  );
};

export default Breadcrumbs;
