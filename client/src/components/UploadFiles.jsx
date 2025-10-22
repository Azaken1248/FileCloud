import { useState, useRef } from "react";
import { FaCloudUploadAlt, FaCheckCircle, FaExclamationCircle, FaTrashAlt, FaBan } from "react-icons/fa";
import FileIcon from "./FileIcon";


const UploadFiles = ({ onUploadSuccess, currentFolderId = null }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const xhrRefs = useRef({});

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    console.log("Selected files:", selectedFiles);
    const newEntries = selectedFiles.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file: f,
      name: f.name,
      size: f.size,
      type: 'file',
      progress: 0,
      status: "queued",
      error: null,
    }));

    setFiles((prev) => [...prev, ...newEntries]);
    setUploadError(null);
  };

  const removeFile = (id) => {
    const ref = xhrRefs.current[id];
    if (ref) {
      try {
        if (Array.isArray(ref)) {
          for (const x of ref) try { x.abort(); } catch (e) {}
        } else {
          ref.abort();
        }
      } catch (e) {}
      delete xhrRefs.current[id];
    }
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileProgress = (id, percent, status) => {
    setFiles((prev) => {
      const updated = prev.map((f) => (f.id === id ? { ...f, progress: percent, status: status || f.status } : f));
      const nums = updated.map((u) => (u.progress === null ? 0 : u.progress || 0));
      const avg = nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;
      setProgress(avg);
      return updated;
    });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    const username = localStorage.getItem("username");
    try {
  const response = await fetch(`https://api.filecloud.azaken.com/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, folderName: newFolderName, parentId: currentFolderId }),
      });
      if (!response.ok) throw new Error("Failed to create folder");
      const data = await response.json();
      const created = data.Item || data;
      setShowFolderModal(false);
      setNewFolderName("");
      setCreatingFolder(false);
      if (typeof onUploadSuccess === "function") {
        onUploadSuccess([created]);
      }
    } catch (err) {
      setCreatingFolder(false);
      alert("Error creating folder: " + err.message);
    }
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      setUploadError("No files selected");
      return;
    }
    setUploading(true);
    setProgress(0);

    const username = localStorage.getItem("username");
    if (!username) {
      setUploadError("Username not found");
      setUploading(false);
      return;
    }

    const uploadSingle = (entry) => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("files", entry.file);
        formData.append("username", username);
        const fileData = { fileName: entry.name, fileSize: entry.size, uploadedAt: new Date().toISOString(), userEmail: username };
        if (entry.relativePath) fileData.relativePath = entry.relativePath;
        formData.append("fileData", JSON.stringify(fileData));
        if (currentFolderId) formData.append("parentId", currentFolderId);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.filecloud.azaken.com/upload`);
        const token = localStorage.getItem("token");
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            updateFileProgress(entry.id, percent, "uploading");
          } else {
            updateFileProgress(entry.id, null, "uploading");
          }
        };

        xhr.onload = () => {
          delete xhrRefs.current[entry.id];
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const resp = JSON.parse(xhr.responseText);
              const val = Array.isArray(resp) && resp.length ? resp[0] : (resp.results && resp.results.length ? resp.results[0] : (resp.Item || resp));
              const normalized = {
                fileId: val.fileId || entry.id,
                fileName: val.fileName || entry.name,
                fileUrl: val.fileUrl || val.Location || "",
                fileSize: typeof val.fileSize === "number" ? val.fileSize : entry.size || 0,
                fileType: val.fileType || entry.file?.type || "",
                uploadedAt: val.uploadedAt || new Date().toISOString(),
                s3Key: val.s3Key || undefined,
                userEmail: val.userEmail || localStorage.getItem("username"),
                parentId: val.parentId || currentFolderId || null,
                type: val.type || 'file',
              };
              updateFileProgress(entry.id, 100, "uploaded");
              resolve({ createdFolders: resp.createdFolders || [], results: [normalized] });
            } catch (e) {
              setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, progress: 100, status: "uploaded" } : f)));
              resolve({});
            }
          } else {
            setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, status: "error", error: `Status ${xhr.status}` } : f)));
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          delete xhrRefs.current[entry.id];
          setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, status: "error", error: "Network error" } : f)));
          reject(new Error("Network error during upload"));
        };

        xhr.onabort = () => {
          delete xhrRefs.current[entry.id];
          setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, status: "canceled", error: "Upload canceled" } : f)));
          reject(new Error("Upload aborted"));
        };

        xhrRefs.current[entry.id] = xhr;
        xhr.send(formData);
      });
    };

    const uploadFolder = async (folderEntry, username) => {
      setFiles((prev) => prev.map((f) => (f.id === folderEntry.id ? { ...f, status: 'uploading', progress: 0 } : f)));

      let created;
      try {
        const response = await fetch(`https://api.filecloud.azaken.com/folders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, folderName: folderEntry.folderName, parentId: currentFolderId }),
        });
        if (!response.ok) throw new Error('Failed to create folder');
        const data = await response.json();
        created = data.Item || data;
      } catch (err) {
        setFiles((prev) => prev.map((f) => (f.id === folderEntry.id ? { ...f, status: 'error', error: err.message } : f)));
        throw err;
      }

      const totalBytes = folderEntry.totalBytes || 0;
      let uploadedBytes = 0;
      const uploadedItems = [];
      const xhrs = [];
      xhrRefs.current[folderEntry.id] = xhrs;

  const folderCreatedFolders = [];
  const uploadPromises = folderEntry.files.map((fileObj, idx) => {
        return new Promise((resolve, reject) => {
          const formData = new FormData();
          formData.append('files', fileObj.file);
          formData.append('username', username);
          const fileData = { fileName: fileObj.name, fileSize: fileObj.size, uploadedAt: new Date().toISOString(), userEmail: username, relativePath: fileObj.relativePath };
          formData.append('fileData', JSON.stringify(fileData));
          formData.append('parentId', created.fileId);

          const xhr = new XMLHttpRequest();
          xhr.open('POST', `https://api.filecloud.azaken.com/upload`);
          const token = localStorage.getItem('token');
          if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

          let lastLoaded = 0;
          xhr.upload.onprogress = (event) => {
            const loaded = event.loaded || 0;
            const delta = loaded - lastLoaded;
            lastLoaded = loaded;
            uploadedBytes += delta > 0 ? delta : 0;
            let percent = totalBytes ? Math.round((uploadedBytes / totalBytes) * 100) : 0;
            percent = Math.min(Math.max(percent, 0), 100);
            setFiles((prev) => prev.map((f) => (f.id === folderEntry.id ? { ...f, uploadedBytes, progress: percent } : f)));
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const resp = JSON.parse(xhr.responseText);
                if (resp && resp.createdFolders && Array.isArray(resp.createdFolders) && resp.createdFolders.length) {
                  folderCreatedFolders.push(...resp.createdFolders);
                }
                const val = Array.isArray(resp) && resp.length ? resp[0] : (resp.results && resp.results.length ? resp.results[0] : (resp.Item || resp));
                const normalized = {
                  fileId: val.fileId || `${created.fileId}-${idx}`,
                  fileName: val.fileName || fileObj.name,
                  fileUrl: val.fileUrl || val.Location || "",
                  fileSize: typeof val.fileSize === 'number' ? val.fileSize : fileObj.size || 0,
                  fileType: val.fileType || fileObj.file.type || '',
                  uploadedAt: val.uploadedAt || new Date().toISOString(),
                  s3Key: val.s3Key || undefined,
                  userEmail: val.userEmail || username,
                  parentId: val.parentId || created.fileId,
                  type: 'file',
                };
                uploadedItems.push(normalized);
                resolve(normalized);
              } catch (e) {
                resolve(null);
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.onabort = () => reject(new Error('Upload aborted'));

          xhrs.push(xhr);
          xhr.send(formData);
        });
      });

  const settled = await Promise.allSettled(uploadPromises);
      delete xhrRefs.current[folderEntry.id];

      const successful = settled.filter((s) => s.status === 'fulfilled').length;
      setFiles((prev) => prev.map((f) => (f.id === folderEntry.id ? { ...f, status: successful === folderEntry.files.length ? 'uploaded' : 'error', progress: 100 } : f)));

      return { created, uploadedItems, createdFolders: folderCreatedFolders };
    };

    try {
  const toUpload = files.slice();
  const promises = toUpload.map((f) => (f.type === 'folder' ? uploadFolder(f, username) : uploadSingle(f)));
  const settled = await Promise.allSettled(promises);

     
      const uploadedItems = [];
      const createdFolderAccumulator = [];

      for (let i = 0; i < settled.length; i++) {
        const s = settled[i];
        const entry = toUpload[i];
        if (s.status !== 'fulfilled') continue;
        const val = s.value;
        if (!val) continue;

        if (entry.type === 'folder') {
          if (val && val.created) {
            const created = val.created;
            const uploaded = val.uploadedItems || [];
            createdFolderAccumulator.push(created);
            uploadedItems.push(...uploaded);
            console.log('Folder upload returned created:', created);
          } else if (Array.isArray(val)) {
            for (const item of val) {
              if (item && item.type === 'folder') createdFolderAccumulator.push(item);
              else if (item) uploadedItems.push(item);
            }
          } else if (val.createdFolders || val.results) {
            const folders = val.createdFolders || [];
            const resultsArr = val.results || [];
            createdFolderAccumulator.push(...folders);
            uploadedItems.push(...resultsArr);
          }
        } else {
          let r = null;
          if (Array.isArray(val) && val.length) r = val[0];
          else if (val.results && Array.isArray(val.results) && val.results.length) r = val.results[0];
          else if (val.Item) r = val.Item;
          else r = val;

          const normalized = {
            fileId: r.fileId || entry.id,
            fileName: r.fileName || entry.name,
            fileUrl: r.fileUrl || r.Location || "",
            fileSize: typeof r.fileSize === "number" ? r.fileSize : entry.size || 0,
            fileType: r.fileType || entry.file.type || "",
            uploadedAt: r.uploadedAt || new Date().toISOString(),
            s3Key: r.s3Key || undefined,
            userEmail: r.userEmail || localStorage.getItem("username"),
            parentId: r.parentId || currentFolderId || null,
            type: r.type || 'file',
          };

          uploadedItems.push(normalized);
        }
      }

      const seen = new Map();
      const pushUnique = (it) => {
        if (!it) return;
        const key = it.fileId ? `id:${it.fileId}` : `key:${(it.type || 'file')}::${it.fileName || ''}::${it.parentId || 'root'}`;
        if (!seen.has(key)) seen.set(key, it);
      };

      for (const f of createdFolderAccumulator) pushUnique(f);

      for (const it of uploadedItems) pushUnique(it);

      const combined = Array.from(seen.values());

      console.log('Upload aggregator createdFolderAccumulator (deduped):', Array.from(seen.values()).filter(x=>x.type==='folder'));
      console.log('Upload aggregator uploadedItems count (deduped):', Array.from(seen.values()).filter(x=>x.type!=='folder').length);
      console.log('Upload aggregator combined items (deduped):', combined);

      if (combined.length && typeof onUploadSuccess === "function") {
        const foldersFirst = [];
        const filesLater = [];
        for (const it of combined) {
          if (it.type === 'folder') foldersFirst.push(it);
          else filesLater.push(it);
        }
        onUploadSuccess([...foldersFirst, ...filesLater]);
      }

      setUploading(false);
      setProgress(100);
    } catch (err) {
      console.error(err);
      setUploading(false);
      setUploadError(err.message || "Upload error");
    }
  };
  

  return (
    <div className="bg-gray-700 text-gray-100 rounded-xl shadow-md p-4 mx-auto w-full max-w-xl">
      <h3 className="text-lg sm:text-xl font-semibold mb-3 text-center">Upload Files or Create Folder</h3>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <label htmlFor="file-upload" className="text-center">
            <input
              id="file-upload"
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <span className="inline-flex items-center gap-2 cursor-pointer text-blue-400 hover:text-blue-300 transition duration-200 ease-in-out text-sm sm:text-base px-3 py-2 border border-transparent rounded-md hover:bg-blue-500/5">
              <FaCloudUploadAlt className="text-2xl sm:text-3xl" />
              <span className="hidden sm:inline">Choose Files</span>
              <span className="sm:hidden">Files</span>
            </span>
          </label>

          <label htmlFor="folder-upload" className="text-center">
            <input
              id="folder-upload"
              type="file"
              multiple
              webkitdirectory="true"
              directory=""
              onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  if (!selected.length) return;
                  const firstRel = selected[0].webkitRelativePath || selected[0].name;
                  const root = firstRel.split('/')[0] || firstRel;
                  const folderId = `${Date.now()}-folder-${Math.random().toString(36).slice(2)}`;
                  const folderFiles = selected.map((f, idx) => ({
                    id: `${folderId}-${idx}`,
                    file: f,
                    name: f.name,
                    size: f.size,
                    relativePath: f.webkitRelativePath || f.name,
                  }));

                  const folderEntry = {
                    id: folderId,
                    type: 'folder',
                    folderName: root,
                    files: folderFiles,
                    totalBytes: folderFiles.reduce((s, x) => s + (x.size || 0), 0),
                    uploadedBytes: 0,
                    progress: 0,
                    status: 'queued',
                    error: null,
                  };

                  setFiles((prev) => [...prev, folderEntry]);
                  setUploadError(null);
              }}
              className="hidden"
            />
            <span className="inline-flex items-center gap-2 cursor-pointer text-blue-400 hover:text-blue-300 transition duration-200 ease-in-out text-sm sm:text-base px-3 py-2 border border-transparent rounded-md hover:bg-blue-500/5">
              <FaCloudUploadAlt className="text-2xl sm:text-3xl" />
              <span className="hidden sm:inline">Choose Folder</span>
              <span className="sm:hidden">Folder</span>
            </span>
          </label>
        </div>

        <div className="flex-shrink-0">
          <button
            type="button"
            className="inline-flex items-center justify-center bg-transparent text-green-300 border border-green-300 hover:text-green-400 text-sm sm:text-base px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300/25"
            onClick={() => setShowFolderModal(true)}
            aria-label="Create Folder"
          >
            + New Folder
          </button>
        </div>
      </div>

      {showFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gray-700 p-6 rounded-lg shadow-lg w-80 flex flex-col gap-4">
            <h4 className="text-lg font-semibold text-center">Create New Folder</h4>
            <input
              type="text"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="px-3 py-2 rounded border border-gray-600 bg-gray-900 text-gray-100"
              autoFocus
            />
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                className="border-2 border-green-500 text-green-300 px-4 py-1 rounded-lg hover:bg-green-500/10"
                onClick={handleCreateFolder}
                disabled={creatingFolder}
              >
                {creatingFolder ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                className="border-2 border-gray-500 text-gray-300 px-4 py-1 rounded-lg hover:bg-gray-500/10"
                onClick={() => { setShowFolderModal(false); setNewFolderName(""); }}
                disabled={creatingFolder}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h4 className="text-lg">Selected Files</h4>
        {Array.isArray(files) && files.length > 0 ? (
          <ul className="space-y-3">
            {files.map((entry) => (
              <li key={entry.id} className="text-sm text-gray-200 bg-gray-700 p-3 rounded-md flex flex-col">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 truncate">
                    <div className="flex-shrink-0">
                      <FileIcon fileName={entry.type === 'folder' ? entry.folderName : entry.name} isFolder={entry.type === 'folder'} size={20} />
                    </div>
                    <div className="truncate">{entry.type === 'folder' ? entry.folderName : entry.name}</div>
                  </div>
                  <div className="ml-2 flex items-center space-x-2">
                    {entry.status !== "uploaded" && (
                      <button
                        onClick={() => removeFile(entry.id)}
                        className="p-1 rounded text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                        aria-label={`Remove ${entry.name}`}
                        title="Remove"
                      >
                        <FaTrashAlt />
                      </button>
                    )}
                    {entry.status === "uploading" && (
                      <button
                        onClick={() => {
                          if (xhrRefs.current[entry.id]) xhrRefs.current[entry.id].abort();
                        }}
                        className="p-1 rounded text-yellow-400 hover:text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        aria-label={`Cancel upload for ${entry.name}`}
                        title="Cancel"
                      >
                        <FaBan />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 w-full">
                  <div className="relative w-full h-2.5 bg-gray-700 rounded-md overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full transition-all duration-300"
                      style={{
                        width: entry.progress === null ? "100%" : `${entry.progress}%`,
                        background: `#10B981`,
                        boxShadow: '0 1px 4px rgba(16,185,129,0.12)'
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-300">
                    <span className="capitalize truncate max-w-[60%]">{entry.status}</span>
                    <span className="ml-2 w-12 text-right">{entry.progress === null ? "..." : `${entry.progress}%`}</span>
                  </div>
                  {entry.error && <div className="text-xs text-red-400 mt-1">{entry.error}</div>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">No files selected.</p>
        )}
      </div>

      {uploading && (
        <div className="mb-6">
          <p className="text-sm text-gray-300">Uploading...</p>
          <div className="relative w-full mt-2">
            <div className="w-full h-2.5 bg-gray-700 rounded-md overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                    style={{
                      width: progress === null ? "100%" : `${progress}%`,
                      background: `#10B981`,
                      boxShadow: '0 2px 6px rgba(16,185,129,0.08)'
                    }}
                  />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-gray-300">
              <div className="truncate">{progress === null ? "Uploading..." : "Upload progress"}</div>
              <div className="w-12 text-right">{progress === null ? "..." : `${progress}%`}</div>
            </div>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="mb-4 p-4 bg-red-600 text-white rounded-md flex items-center space-x-2">
          <FaExclamationCircle />
          <p className="text-sm">{uploadError}</p>
        </div>
      )}

      {!uploading && !uploadError && files.length > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            onClick={handleUpload}
            className="flex-1 w-full sm:w-auto border-2 border-blue-500 text-blue-300 py-3 rounded-lg transition duration-300 ease-in-out hover:bg-blue-500/10 hover:text-blue-300"
          >
            Upload Files
          </button>
        </div>
      )}

      {uploading === false && progress === 100 && !uploadError && (
        <div className="p-4 bg-green-600 text-white rounded-md flex items-center space-x-2">
          <FaCheckCircle />
          <p className="text-sm">Files uploaded successfully!</p>
        </div>
      )}
    </div>
  );
};

export default UploadFiles;
