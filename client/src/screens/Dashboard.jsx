import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import FileCard from "../components/FileCard";
import Breadcrumbs from "../components/Breadcrumbs";
import FolderCard from "../components/FolderCard";
import SearchBar from "../components/SearchBar";
import ListRow from "../components/ListRow";
import { FaThLarge, FaList } from 'react-icons/fa';
import UploadFiles from "../components/UploadFiles";
import Loader from "../components/Loader";
import InfoPanel from "../components/InfoPanel";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [_filteredFiles, setFilteredFiles] = useState([]);
  const [searchActive, setSearchActive] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [searchResetSignal, setSearchResetSignal] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [mobileFilesTab, setMobileFilesTab] = useState('recent');
  const [navHistory, setNavHistory] = useState([null]);
  const [navPos, setNavPos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  const [previewFile, setPreviewFile] = useState(null); 
  const [recentActivity, setRecentActivity] = useState([]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };


  const handleUploadSuccess = (newFiles) => {
    console.log("Upload success response:", newFiles);
    const incoming = Array.isArray(newFiles) ? newFiles : [newFiles];

    const normalized = incoming.map((f) => ({
      parentId: (f.parentId !== undefined && f.parentId !== null) ? f.parentId : (currentFolderId || null),
      type: f.type || "file",
      fileId: f.fileId || Math.random().toString(36).slice(2),
      fileName: f.fileName || "unnamed",
      fileUrl: f.fileUrl || f.Location || "",
      filePath: f.filePath || null,
      fileSize: f.fileSize || f.size || 0,
      fileType: f.fileType || "",
      uploadedAt: f.uploadedAt || new Date().toISOString(),
      s3Key: f.s3Key,
      userEmail: f.userEmail || localStorage.getItem("username"),
    }));

    setFiles((prevFiles) => {
      const mapById = new Map();
      const seenByKey = new Map();

      const makeKey = (it) => `${it.type || 'file'}::${it.fileName}::${it.parentId || 'root'}`;

      for (const it of prevFiles) {
        const id = it.fileId || makeKey(it);
        const key = makeKey(it);
        if (!seenByKey.has(key)) seenByKey.set(key, id);
        mapById.set(id, it);
      }

      const incomingFolders = normalized.filter((x) => x.type === 'folder');
      const incomingFiles = normalized.filter((x) => x.type !== 'folder');

      for (const it of [...incomingFolders, ...incomingFiles]) {
        const id = it.fileId || makeKey(it);
        const key = makeKey(it);
        const existingId = seenByKey.get(key);
        if (existingId && existingId !== id) {
          mapById.delete(existingId);
        }
        seenByKey.set(key, id);
        mapById.set(id, it);
      }

      return Array.from(mapById.values());
    });

    setFilteredFiles((prev) => {
      const mapById = new Map();
      const seenByKey = new Map();
      const makeKey = (it) => `${it.type || 'file'}::${it.fileName}::${it.parentId || 'root'}`;
      for (const it of prev) {
        const id = it.fileId || makeKey(it);
        const key = makeKey(it);
        if (!seenByKey.has(key)) seenByKey.set(key, id);
        mapById.set(id, it);
      }
      for (const it of normalized) {
        const id = it.fileId || makeKey(it);
        const key = makeKey(it);
        const existingId = seenByKey.get(key);
        if (existingId && existingId !== id) mapById.delete(existingId);
        seenByKey.set(key, id);
        mapById.set(id, it);
      }
      return Array.from(mapById.values());
    });

        (async () => {
      try {
        setIsUploading(false);
        await new Promise((r) => setTimeout(r, 300));
        const resp = await fetch(`https://api.filecloud.azaken.com/files?username=${username}`, { method: 'GET' });
        const data = await resp.json();
        if (Array.isArray(data)) {
          canonicalizeAndSet(data);
        }
      } catch (err) {
        console.warn('Failed to refresh files after upload:', err);
      }
    })();
  };

  const openFolder = (folder) => {
    const id = folder.fileId;
    setRecentActivity((prev) => {
      const next = [folder, ...prev.filter((p) => p.fileId !== folder.fileId)];
      return next.slice(0, 6);
    });
    if (searchActive) {
      const shown = files.filter((f) => (f.parentId || null) === id);
      setFilteredFiles(shown);
      setSearchActive(false);
      setSearchResetSignal((s) => s + 1);
    }
    setCurrentFolderId(id);
    const newHist = navHistory.slice(0, navPos + 1);
    newHist.push(id);
    setNavHistory(newHist);
    setNavPos(newHist.length - 1);
  };


  const username = localStorage.getItem("username"); 

  const canonicalizeAndSet = (data) => {
    const makeKey = (it) => `${it.type || 'file'}::${it.fileName}::${it.parentId || 'root'}`;
    const groups = new Map();
    for (const it of data) {
      const key = makeKey(it);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(it);
    }

    const canonicalByKey = new Map();
    const idMapping = new Map();

    for (const [key, items] of groups.entries()) {
      let canonical = items[0];
      const folderItem = items.find((x) => x.type === 'folder');
      if (folderItem) canonical = folderItem;
      else if (items.length > 1) {
        items.sort((a, b) => {
          const ta = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
          const tb = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
          return ta - tb;
        });
        canonical = items[0];
      }

      canonicalByKey.set(key, canonical);
      for (const it of items) {
        if (it.fileId && it.fileId !== canonical.fileId) idMapping.set(it.fileId, canonical.fileId);
      }
    }

    const deduped = [];
    for (const canonical of canonicalByKey.values()) {
      const copy = { ...canonical };
      if (copy.parentId && idMapping.has(copy.parentId)) copy.parentId = idMapping.get(copy.parentId);
      deduped.push(copy);
    }

    const canonicalIds = new Set(Array.from(canonicalByKey.values()).map((c) => c.fileId));
    for (const it of data) {
      if (!it.fileId) continue;
      if (canonicalIds.has(it.fileId)) continue;
      const copy = { ...it };
      if (copy.parentId && idMapping.has(copy.parentId)) copy.parentId = idMapping.get(copy.parentId);
      deduped.push(copy);
    }

    setFiles(deduped);
    setFilteredFiles(deduped);
  };

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      if (!username) {
        setError("Username is required");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://api.filecloud.azaken.com/files?username=${username}`, { 
          method: "GET",
        });

        const contentType = response.headers.get("Content-Type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          canonicalizeAndSet(data);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        setError(err.message); 
      } finally {
        setLoading(false); 
      }
    };

    fetchFiles();
  }, [username]);

  const computeFolderSizes = (items) => {
    const childrenMap = new Map();
    for (const it of items) {
      const pid = it.parentId || null;
      if (!childrenMap.has(pid)) childrenMap.set(pid, []);
      childrenMap.get(pid).push(it);
    }

    const sizeCache = new Map();

    const dfsSize = (id) => {
      if (sizeCache.has(id)) return sizeCache.get(id);
      let total = 0;
      const kids = childrenMap.get(id) || [];
      for (const k of kids) {
        if (k.type === 'folder') {
          total += dfsSize(k.fileId);
        } else {
          total += Number(k.fileSize || 0);
        }
      }
      sizeCache.set(id, total);
      return total;
    };

    for (const it of items) {
      if (it.type === 'folder') {
        dfsSize(it.fileId);
      }
    }

    return sizeCache; 
  };

  const handleDelete = async (fileId) => {
    try {
      const confirmation = window.confirm("Are you sure you want to delete this file?");
      if (!confirmation) return;

      const response = await fetch(`https://api.filecloud.azaken.com/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log(result.message);
        setFiles((prev) => prev.filter((f) => f.fileId !== fileId));
        setFilteredFiles((prev) => prev.filter((f) => f.fileId !== fileId));
      } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error deleting file response:', errorData);
          alert('Failed to delete file. Check console for details.');
      }
    } catch (err) {
      console.error('Error during delete operation:', err);
    }
  };

  const removeItemAndChildren = (items, idToRemove) => {
    const toRemove = new Set([idToRemove]);
    let changed = true;

    while (changed) {
      changed = false;
      for (const it of items) {
        if (it.parentId && toRemove.has(it.parentId) && !toRemove.has(it.fileId)) {
          toRemove.add(it.fileId);
          changed = true;
        }
      }
    }

    return items.filter((it) => !toRemove.has(it.fileId));
  };

  const handleDeleteFolder = async (fileId) => {
    try {
      const response = await fetch(`https://api.filecloud.azaken.com/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log(result.message);
        setFiles((prev) => removeItemAndChildren(prev, fileId));
        setFilteredFiles((prev) => removeItemAndChildren(prev, fileId));
      } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error deleting folder response:', errorData);
          alert('Failed to delete folder. Check console for details.');
      }
    } catch (err) {
      console.error('Error during delete folder operation:', err);
    }
  };
  

  const handleDownload = async (file) => {
    console.log(file);
    try {
      if (!file) return;
      setRecentActivity((prev) => {
        const next = [file, ...prev.filter((p) => p.fileId !== file.fileId)];
        return next.slice(0, 6);
      });
      if (file.type === 'folder') {
        const url = `https://api.filecloud.azaken.com/files/${file.fileId}/download`;
        window.open(url, '_blank');
        return;
      }

      if (file && file.fileUrl) {
        const fileUrl = file.fileUrl;
        window.open(fileUrl, "_blank");
        return;
      }

      console.error("Invalid file URL");
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const computeTotalsAndRecent = (items) => {
    let total = 0;
    for (const it of items) {
      if (it.type !== 'folder') total += Number(it.fileSize || 0);
    }
    const recent = items.slice().sort((a,b)=>{
      const ta = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      const tb = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      return tb - ta;
    }).slice(0,6);

    return { totalBytes: total, recentFiles: recent };
  };

  console.log(files);

  const { totalBytes, recentFiles } = computeTotalsAndRecent(files);

  const mergedRecentFiles = (() => {
    const seen = new Set();
    const out = [];
    for (const it of recentActivity) {
      if (it && it.fileId && !seen.has(it.fileId)) {
        out.push(it);
        seen.add(it.fileId);
      }
    }
    for (const it of recentFiles) {
      if (it && it.fileId && !seen.has(it.fileId)) {
        out.push(it);
        seen.add(it.fileId);
      }
    }
    return out.slice(0, 6);
  })();

  const computeTypeBreakdown = (items) => {
    const categories = {
      Images: new Set(['jpg','jpeg','png','gif','svg','webp','heic']),
      Video: new Set(['mp4','mov','mkv','avi','webm']),
      Audio: new Set(['mp3','wav','flac','m4a','aac']),
      Documents: new Set(['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','csv','md']),
      Archives: new Set(['zip','rar','7z','tar','gz']),
      Osu: new Set(['osz','osu','osk','osr','osb']),
      Code: new Set(['js','ts','py','java','rb','go','cpp','c','h','cs','php']),
    };

    const out = {
      Images: 0,
      Video: 0,
      Audio: 0,
      Documents: 0,
      Archives: 0,
      Osu: 0,
      Code: 0,
      Other: 0,
    };

    for (const it of items) {
      if (it.type === 'folder') continue;
      const parts = (it.fileName || '').split('.');
      const ext = parts.length > 1 ? parts.pop().toLowerCase() : 'unknown';
      let found = false;
      for (const [cat, set] of Object.entries(categories)) {
        if (set.has(ext)) {
          out[cat] += Number(it.fileSize || 0);
          found = true;
          break;
        }
      }
      if (!found) out.Other += Number(it.fileSize || 0);
    }

    return [
      { key: 'Images', bytes: out.Images },
      { key: 'Video', bytes: out.Video },
      { key: 'Audio', bytes: out.Audio },
      { key: 'Documents', bytes: out.Documents },
      { key: 'Archives', bytes: out.Archives },
      { key: 'Osu', bytes: out.Osu },
      { key: 'Code', bytes: out.Code },
      { key: 'Other', bytes: out.Other },
    ];
  };

  const computeLargestFiles = (items, count = 5) => {
    const filesOnly = items.filter((i) => i.type !== 'folder');
    filesOnly.sort((a, b) => (Number(b.fileSize || 0) - Number(a.fileSize || 0)));
    return filesOnly.slice(0, count);
  };

  const typeBreakdown = computeTypeBreakdown(files);
  const largestFiles = computeLargestFiles(files, 5);

  return (
    <div className="relative overflow-x-hidden">
      <Navbar onToggleSidebar={toggleSidebar} />

      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />

  <div className={`transition-all duration-300 ${isSidebarOpen ? "lg:ml-64" : ""} min-h-screen bg-gray-800 text-gray-100 p-4 sm:p-6 overflow-x-hidden`}>
      <div className="lg:flex lg:gap-6">
        <div className="hidden lg:block w-72 lg:mr-6 self-start lg:sticky lg:top-5">
          <InfoPanel totalBytes={totalBytes} recentFiles={mergedRecentFiles} typeBreakdown={typeBreakdown} largestFiles={largestFiles} onDownload={handleDownload} onDelete={handleDelete} />
        </div>

        <div className="flex-1">
        <div className="w-full max-w-[1200px] mx-auto">
        <div className="flex items-center justify-center mb-6 gap-4">
          <div className="flex-1 flex items-center justify-center w-screen">
            <SearchBar setFilteredFiles={setFilteredFiles} files={files} setIsUploading={setIsUploading} setSearchActive={setSearchActive} searchResetSignal={searchResetSignal} />
          </div>
        </div>

        <div className="block lg:hidden mb-4">
          <InfoPanel totalBytes={totalBytes} recentFiles={mergedRecentFiles} typeBreakdown={typeBreakdown} largestFiles={largestFiles} onDownload={handleDownload} onDelete={handleDelete} />
        </div>

        {isUploading && (
          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <UploadFiles onUploadSuccess={handleUploadSuccess} currentFolderId={currentFolderId} />
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <Breadcrumbs
          files={files}
          currentFolderId={currentFolderId}
          history={navHistory}
          pos={navPos}
          onBack={() => {
            if (navPos <= 0) return;
            const newPos = navPos - 1;
            setNavPos(newPos);
            setCurrentFolderId(navHistory[newPos]);
          }}
          onForward={() => {
            if (navPos >= navHistory.length - 1) return;
            const newPos = navPos + 1;
            setNavPos(newPos);
            setCurrentFolderId(navHistory[newPos]);
          }}
          onGoTo={(id) => {
            const newHist = navHistory.slice(0, navPos + 1);
            newHist.push(id);
            setNavHistory(newHist);
            setNavPos(newHist.length - 1);
            setCurrentFolderId(id);
          }}
            />

            {currentFolderId === null && (
              <div className="block lg:hidden mt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 flex items-center gap-2">
                    <button
                      onClick={() => setMobileFilesTab('home')}
                      className={`py-2 px-3 rounded ${mobileFilesTab === 'home' ? 'bg-gray-700 text-white' : 'bg-transparent text-gray-300'}`}
                    >Home</button>
                    <button
                      onClick={() => setMobileFilesTab('recent')}
                      className={`py-2 px-3 rounded ${mobileFilesTab === 'recent' ? 'bg-gray-700 text-white' : 'bg-transparent text-gray-300'}`}
                    >Recent</button>
                    <button
                      onClick={() => setMobileFilesTab('top')}
                      className={`py-2 px-3 rounded ${mobileFilesTab === 'top' ? 'bg-gray-700 text-white' : 'bg-transparent text-gray-300'}`}
                    >Top</button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      aria-label="Grid view"
                      className={`p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700/20'}`}
                    >
                      <FaThLarge className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      aria-label="List view"
                      className={`p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700/20'}`}
                    >
                      <FaList className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  {mobileFilesTab === 'recent' && (
                    <div>
                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 gap-3">
                          {mergedRecentFiles.map((f) => (
                            <FileCard key={f.fileId} file={f} onDelete={() => handleDelete(f.fileId)} onDownload={() => handleDownload(f)} />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {mergedRecentFiles.map((f) => (
                            <ListRow key={f.fileId} item={f} onDownload={() => handleDownload(f)} onDelete={() => handleDelete(f.fileId)} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {mobileFilesTab === 'top' && (
                    <div>
                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 gap-3">
                          {largestFiles.map((f) => (
                            <FileCard key={f.fileId} file={f} onDelete={() => handleDelete(f.fileId)} onDownload={() => handleDownload(f)} />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {largestFiles.map((f) => (
                            <ListRow key={f.fileId} item={f} onDownload={() => handleDownload(f)} onDelete={() => handleDelete(f.fileId)} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {mobileFilesTab === 'home' && (
                    <div className="space-y-2">
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

    <div className="hidden lg:flex items-center space-x-2 ml-4">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              title="Grid view"
              className={`p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700/20'}`}
            >
              <FaThLarge className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="List view"
              title="List view"
              className={`p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700/20'}`}
            >
              <FaList className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading && (
            <div className="flex justify-center min-h-screen bg-gray-800">
            <Loader />
          </div>
        )}
    
        {error && <div className="text-center text-red-500">{error}</div>}

        {previewFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-1/2">
              <h2 className="text-2xl mb-4">Preview: {previewFile.fileName}</h2>
              {previewFile.fileType.startsWith("image") && (
                <img src={previewFile.fileUrl} alt="Preview" className="w-full h-auto" />
              )}

              <button
                onClick={() => setPreviewFile(null)}
                className="mt-4 text-red-500 hover:text-red-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}


  {viewMode === 'grid' ? (
          <div className={`${currentFolderId === null && mobileFilesTab !== 'home' ? 'hidden sm:flex' : 'flex'} flex-col gap-4 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5`}>
          {(() => {
            const shown = searchActive ? _filteredFiles : files.filter((f) => (f.parentId || null) === currentFolderId);
            const folders = shown.filter((f) => f.type === "folder");
            const plainFiles = shown.filter((f) => f.type !== "folder");

            if (folders.length === 0 && plainFiles.length === 0) {
              return <div className="col-span-full text-center text-gray-500">No files available</div>;
            }

            return (
              <>
                    {(() => {
                      const sizeMap = computeFolderSizes(files);
                      return folders.map((folder) => (
                        <FolderCard
                          key={folder.fileId}
                          folder={{ ...folder, folderSize: sizeMap.get(folder.fileId) || 0 }}
                          onOpen={openFolder}
                          onDelete={handleDeleteFolder}
                        />
                      ));
                    })()}

                {plainFiles.map((file) => (
                  <FileCard key={file.fileId} file={file} onDelete={() => handleDelete(file.fileId)} onDownload={() => handleDownload(file)} />
                ))}
              </>
            );
          })()}
            </div>
          ) : (
            <div className={`${currentFolderId === null && mobileFilesTab !== 'home' ? 'hidden sm:block' : 'block'} space-y-2`}>
            {(() => {
              const shown = searchActive ? _filteredFiles : files.filter((f) => (f.parentId || null) === currentFolderId);
              const folders = shown.filter((f) => f.type === "folder");
              const plainFiles = shown.filter((f) => f.type !== "folder");

              if (folders.length === 0 && plainFiles.length === 0) {
                return <div className="text-center text-gray-500">No files available</div>;
              }

              return (
                <>
                      {(() => {
                        const sizeMap = computeFolderSizes(files);
                        return folders.map((folder) => (
                          <ListRow key={folder.fileId} item={{ ...folder, folderSize: sizeMap.get(folder.fileId) || 0 }} onOpen={openFolder} onDelete={handleDeleteFolder} />
                        ));
                      })()}

                  {plainFiles.map((file) => (
                    <ListRow key={file.fileId} item={file} onDownload={() => handleDownload(file)} onDelete={() => handleDelete(file.fileId)} />
                  ))}
                </>
              );
            })()}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default Dashboard;
