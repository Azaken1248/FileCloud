import { useMemo } from "react";
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          disabled={pos <= 0}
          className="px-3 py-2 border rounded text-sm disabled:opacity-50 touch-manipulation"
          aria-label="Back"
        >
          <FaArrowLeft />
        </button>
        <button
          onClick={onForward}
          disabled={pos >= history.length - 1}
          className="px-3 py-2 border rounded text-sm disabled:opacity-50 touch-manipulation"
          aria-label="Forward"
        >
          <FaArrowRight />
        </button>
      </div>

      <nav className="flex-1 min-w-0 mt-2 sm:mt-0">
        <div className="flex items-center gap-2 text-sm text-gray-300 overflow-x-auto whitespace-nowrap">
          {path.map((seg, idx) => (
            <span key={seg.id ?? "home"} className="flex items-center gap-2 whitespace-nowrap">
              <button
                onClick={() => onGoTo(seg.id)}
                className="hover:underline truncate max-w-[16rem] text-sm"
                title={seg.name}
              >
                {seg.name}
              </button>
              {idx < path.length - 1 && <span className="opacity-60">/</span>}
            </span>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Breadcrumbs;
