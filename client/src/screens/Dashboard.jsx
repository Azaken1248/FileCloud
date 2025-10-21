import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import FileCard from "../components/FileCard";
import Breadcrumbs from "../components/Breadcrumbs";
import FolderCard from "../components/FolderCard";
import SearchBar from "../components/SearchBar";
import UploadFiles from "../components/UploadFiles";
import Loader from "../components/Loader";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [_filteredFiles, setFilteredFiles] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [navHistory, setNavHistory] = useState([null]);
  const [navPos, setNavPos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  const [previewFile, setPreviewFile] = useState(null); 

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleUploadSuccess = (newFiles) => {
    console.log("Upload success response:", newFiles);
    const incoming = Array.isArray(newFiles) ? newFiles : [newFiles];

    // normalize incoming items and prefer server-provided parentId/type when present
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

    // merge with existing files, deduplicate by fileId and by (type+fileName+parentId) key
    setFiles((prevFiles) => {
      const mapById = new Map();
      const seenByKey = new Map();

      const makeKey = (it) => `${it.type || 'file'}::${it.fileName}::${it.parentId || 'root'}`;

      // seed with previous files
      for (const it of prevFiles) {
        const id = it.fileId || makeKey(it);
        const key = makeKey(it);
        if (!seenByKey.has(key)) seenByKey.set(key, id);
        mapById.set(id, it);
      }

      // Add incoming folders first, then files to ensure parents exist before children
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

    // After optimistic merge, force a server refresh to ensure all created nested folders
    // are loaded into state (this prevents cases where server-created intermediate folders
    // didn't get returned in the upload response). This will make subfolders appear
    // immediately without requiring the user to manually refresh.
        (async () => {
      try {
        setIsUploading(false);
        // small delay to allow server writes to become consistent
        await new Promise((r) => setTimeout(r, 300));
        const resp = await fetch(`https://api.filecloud.azaken.com/files?username=${username}`, { method: 'GET' });
        const data = await resp.json();
        if (Array.isArray(data)) {
          // replace full lists with authoritative server state (canonicalized)
          canonicalizeAndSet(data);
        }
      } catch (err) {
        console.warn('Failed to refresh files after upload:', err);
      }
    })();
  };

  const openFolder = (folder) => {
    const id = folder.fileId;
    setCurrentFolderId(id);
    const newHist = navHistory.slice(0, navPos + 1);
    newHist.push(id);
    setNavHistory(newHist);
    setNavPos(newHist.length - 1);
  };

  const goUp = () => {
    if (!currentFolderId) return;
    const current = files.find((f) => f.fileId === currentFolderId);
    const parentId = current ? current.parentId || null : null;
    setCurrentFolderId(parentId);
    const newHist = navHistory.slice(0, navPos + 1);
    newHist.push(parentId);
    setNavHistory(newHist);
    setNavPos(newHist.length - 1);
  };

  const username = localStorage.getItem("username"); 

  // Helper to canonicalize and set server data (dedupe and remap parentIds)
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

  // Compute folder sizes (including nested files and subfolders)
  const computeFolderSizes = (items) => {
    // Build a map from id -> children
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

    // precompute for all folder ids
    for (const it of items) {
      if (it.type === 'folder') {
        dfsSize(it.fileId);
      }
    }

    return sizeCache; // map of id -> size in bytes
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
        // remove file locally from files and filteredFiles
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

  // Helper to remove a folder and all of its descendant items from a list
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

  // Called by FolderCard which already asks for confirmation in its UI
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
        // remove folder and its children locally
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

    if (file && file.fileUrl) {
      const fileUrl = file.fileUrl;
  
      window.open(fileUrl, "_blank");
    } else {
      console.error("Invalid file URL");
    }
  };

  console.log(files);

  return (
    <div className="relative">
      <Navbar onToggleSidebar={toggleSidebar} />

      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />

      <div className={`transition-all duration-300 ${isSidebarOpen ? "lg:ml-64" : ""} min-h-screen bg-gray-800 text-white p-6`}>
        <div className="flex items-center justify-center mb-6 gap-4">
          <SearchBar setFilteredFiles={setFilteredFiles} files={files} setIsUploading={setIsUploading} />
        </div>

        {isUploading && (
          <div className="bg-gray-900 p-4 rounded-lg mb-6">
            <UploadFiles onUploadSuccess={handleUploadSuccess} currentFolderId={currentFolderId} />
          </div>
        )}

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

        <div className="flex flex-col gap-4 sm:grid sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-7">
          {(() => {
            const shown = files.filter((f) => (f.parentId || null) === currentFolderId);
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
      </div>
    </div>
  );
};

export default Dashboard;
