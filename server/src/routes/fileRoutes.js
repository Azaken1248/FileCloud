import express from "express";
import multer from "multer";
import { s3, dynamoDB } from "../config/aws.js";
import crypto from "crypto";
import path from "path";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 200 * 1024 * 1024, fieldSize: 50 * 1024 * 1024 } });

const generateId = () => crypto.randomBytes(12).toString("hex");

const hasS3Key = (val) => typeof val === 'string' && val.trim() !== '';

const getContentType = (file) => {
    if (file.mimetype) return file.mimetype;
    const ext = path.extname(file.originalname || "").toLowerCase();
    switch (ext) {
        case ".jpg":
        case ".jpeg":
            return "image/jpeg";
        case ".png":
            return "image/png";
        case ".gif":
            return "image/gif";
        case ".pdf":
            return "application/pdf";
        case ".txt":
            return "text/plain";
        default:
            return "application/octet-stream";
    }
};

router.post("/upload", (req, res, next) => {
    upload.any()(req, res, function (err) {
        if (err) {
            console.error('Multer error on upload:', err && err.message);
            if (err.code === 'LIMIT_FILE_SIZE') {
                res.status(413).json({ error: 'File too large', details: err.message });
                return;
            }
            res.status(400).json({ error: 'Upload error', details: err.message });
            return;
        }
        next();
    });
}, async (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    const files = [];
    if (req.files && req.files.length) files.push(...req.files);
    if (req.file) files.push(req.file);

    if (!files.length) {
        return res.status(400).json({ error: "No files uploaded" });
    }

    const userEmail = username;
    const results = [];
    const createdFolders = [];

    const folderCache = new Map();

    for (const file of files) {
        try {
            const fileId = generateId();
            let clientFileData = {};
            try {
                clientFileData = req.body.fileData ? JSON.parse(req.body.fileData) : {};
            } catch (e) {
                clientFileData = {};
            }

            const relativePath = clientFileData.relativePath || null;
            const fileNameForKey = relativePath ? relativePath.replace(/[^a-zA-Z0-9._\/-]/g, "_") : (file.originalname || "unnamed");
            const safeName = (fileNameForKey || "unnamed").replace(/[^a-zA-Z0-9._-]/g, "_");
            const s3Key = `files/${userEmail}/${Date.now()}_${fileId}_${safeName}`;

            const contentType = getContentType(file);

            const params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: s3Key,
                Body: file.buffer,
                ContentType: contentType,
            };

            const s3Response = await s3.upload(params).promise();
            const fileUrl = s3Response.Location;

            let parentId = req.body.parentId || null;
            let storedFilePath = relativePath || null;

            if (relativePath && relativePath.includes('/')) {
                let pathInside = relativePath;
                if (parentId) {
                    try {
                        const parentGet = await dynamoDB.get({ TableName: 'Files', Key: { fileId: parentId } }).promise();
                        const parentItem = parentGet.Item;
                        if (parentItem && parentItem.fileName) {
                            const first = relativePath.split('/')[0];
                            if (first === parentItem.fileName) {
                                pathInside = relativePath.split('/').slice(1).join('/');
                            }
                        }
                    } catch (e) {
                       //ignore erros here
                    }
                }

                const parts = pathInside.split('/');
                if (parts.length > 1) {
                    const dirs = parts.slice(0, -1);
                    let currentParent = parentId; 
                    let pathSoFar = '';
                    for (let i = 0; i < dirs.length; i++) {
                        const dirName = dirs[i];
                        pathSoFar = pathSoFar ? `${pathSoFar}/${dirName}` : dirName;
                        const cacheKey = `${currentParent || 'root'}::${pathSoFar}`;

                        let existing = folderCache.get(cacheKey);
                        if (!existing) {
                            const scanParams = {
                                TableName: 'Files',
                                FilterExpression: 'userEmail = :u and parentId = :pid and fileName = :name and #t = :t',
                                ExpressionAttributeValues: {
                                    ':u': userEmail,
                                    ':pid': currentParent || null,
                                    ':name': dirName,
                                    ':t': 'folder',
                                },
                                ExpressionAttributeNames: {
                                    '#t': 'type',
                                },
                            };

                            let found = await dynamoDB.scan(scanParams).promise();
                            existing = (found.Items && found.Items.length) ? found.Items[0] : null;

                            if (!existing) {
                                const newFolderId = generateId();
                                const folderItem = {
                                    fileId: newFolderId,
                                    userEmail,
                                    fileName: dirName,
                                    parentId: currentParent || null,
                                    type: 'folder',
                                    filePath: pathSoFar,
                                    uploadedAt: new Date().toISOString(),
                                };
                                await dynamoDB.put({ TableName: 'Files', Item: folderItem }).promise();
                                existing = folderItem;
                                createdFolders.push(folderItem);
                                console.log('Created folder metadata for upload:', folderItem);
                            }


                            folderCache.set(cacheKey, existing);
                        }

                        currentParent = existing.fileId;
                    }

                    parentId = currentParent;
                    storedFilePath = pathInside;
                }
            }

            const fileItem = {
                fileId,
                userEmail,
                fileName: (storedFilePath && storedFilePath.includes('/')) ? storedFilePath.split('/').pop() : (storedFilePath || file.originalname),
                filePath: storedFilePath || null,
                s3Key,
                fileUrl,
                fileSize: file.size,
                fileType: contentType,
                parentId,
                type: "file",
                uploadedAt: new Date().toISOString(),
            };

            const dynamoParams = {
                TableName: "Files",
                Item: fileItem,
            };

            await dynamoDB.put(dynamoParams).promise();

            results.push(fileItem);
        } catch (err) {
            console.error("Error uploading file:", err);
            results.push({ fileName: file.originalname, success: false, error: err.message || "upload error" });
        }
    }

    const dedupedFolders = [];
    const processedKeys = new Set();

    for (const f of createdFolders) {
        if (!f) continue;
        const parent = f.parentId || null;
        const key = `${f.type || 'folder'}::${f.fileName}::${parent}`;
        if (processedKeys.has(key)) continue;
        processedKeys.add(key);

        const scanParams = {
            TableName: 'Files',
            FilterExpression: 'userEmail = :u and parentId = :pid and fileName = :name and #t = :t',
            ExpressionAttributeValues: {
                ':u': f.userEmail,
                ':pid': parent,
                ':name': f.fileName,
                ':t': 'folder',
            },
            ExpressionAttributeNames: { '#t': 'type' },
        };

        let found = await dynamoDB.scan(scanParams).promise();
        let items = (found.Items && found.Items.length) ? found.Items.slice() : [];
        while (found.LastEvaluatedKey) {
            found = await dynamoDB.scan({ ...scanParams, ExclusiveStartKey: found.LastEvaluatedKey }).promise();
            if (found.Items && found.Items.length) items.push(...found.Items);
        }

        if (items.length <= 1) {
            if (items.length === 1) dedupedFolders.push(items[0]);
            continue;
        }

        items.sort((a, b) => {
            const atA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
            const atB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
            return atA - atB;
        });
        const canonical = items[0];
        const duplicates = items.slice(1);

        for (const dup of duplicates) {
            try {

                const childScan = {
                    TableName: 'Files',
                    FilterExpression: 'parentId = :pid',
                    ExpressionAttributeValues: { ':pid': dup.fileId },
                };
                let childRes = await dynamoDB.scan(childScan).promise();
                let children = (childRes.Items && childRes.Items.length) ? childRes.Items.slice() : [];
                while (childRes.LastEvaluatedKey) {
                    childRes = await dynamoDB.scan({ ...childScan, ExclusiveStartKey: childRes.LastEvaluatedKey }).promise();
                    if (childRes.Items && childRes.Items.length) children.push(...childRes.Items);
                }


                for (const child of children) {
                    try {
                        await dynamoDB.update({
                            TableName: 'Files',
                            Key: { fileId: child.fileId },
                            UpdateExpression: 'set parentId = :p',
                            ExpressionAttributeValues: { ':p': canonical.fileId },
                        }).promise();
                    } catch (err) {
                        console.error('Error reparenting child', child.fileId, err);
                    }
                }

                try {
                    await dynamoDB.delete({ TableName: 'Files', Key: { fileId: dup.fileId } }).promise();
                } catch (err) {
                    console.error('Error deleting duplicate folder', dup.fileId, err);
                }
            } catch (err) {
                console.error('Error during dedupe for duplicate', dup.fileId, err);
            }
        }

        dedupedFolders.push(canonical);
    }


    const mapping = {};
    for (const f of createdFolders) {
        const parent = f.parentId || null;
        const canonical = dedupedFolders.find((d) => d.fileName === f.fileName && (d.parentId || null) === parent && d.userEmail === f.userEmail);
        if (canonical && canonical.fileId !== f.fileId) mapping[f.fileId] = canonical.fileId;
    }

    for (const r of results) {
        if (r && r.parentId && mapping[r.parentId]) {
            r.parentId = mapping[r.parentId];
        }
    }

    console.log('Upload handler returning createdFolders (deduped global):', dedupedFolders.length, 'results:', results.length);
    res.status(200).json({ createdFolders: dedupedFolders, results });
});

router.post("/folders", async (req, res) => {
    const { username, folderName, parentId } = req.body;
    if (!username || !folderName) {
        return res.status(400).json({ error: "username and folderName are required" });
    }

    try {
        const folderId = generateId();
        const folderItem = {
            fileId: folderId,
            userEmail: username,
            fileName: folderName,
            parentId: parentId || null,
            type: "folder",
            uploadedAt: new Date().toISOString(),
        };

        const params = {
            TableName: "Files",
            Item: folderItem,
        };

        await dynamoDB.put(params).promise();

        res.status(201).json({ Item: folderItem });
    } catch (err) {
        console.error("Error creating folder:", err);
        res.status(500).json({ error: "Error creating folder" });
    }
});

router.get("/files", async (req, res) => {
    const username = req.query.username;

    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    try {
        const params = {
            TableName: "Files",
            FilterExpression: "userEmail = :username",
            ExpressionAttributeValues: {
                ":username": username,
            },
        };

        const result = await dynamoDB.scan(params).promise();

        if (result.Items && Array.isArray(result.Items)) {
            res.status(200).json(result.Items);
        } else {
            res.status(404).json({ error: "No files found for the user" });
        }
    } catch (err) {
        console.error("Error fetching files:", err);
        res.status(500).json({ error: "Error fetching files" });
    }
});

router.delete("/files/:fileId", async (req, res) => {
    const { fileId } = req.params;

    const params = {
        TableName: "Files",
        Key: { fileId },
    };
    try {
        const result = await dynamoDB.get(params).promise();
        const file = result.Item;

        if (!file) {
            return res.status(404).json({ error: "File not found" });
        }

        if (file.type === 'folder') {
            const collectDescendants = async (rootId) => {
                const descendants = [];
                const stack = [rootId];

                while (stack.length) {
                    const parent = stack.pop();
                    const scanParams = {
                        TableName: 'Files',
                        FilterExpression: 'parentId = :pid',
                        ExpressionAttributeValues: {
                            ':pid': parent,
                        },
                    };

                    let scanned = await dynamoDB.scan(scanParams).promise();
                    if (scanned.Items && scanned.Items.length) {
                        for (const it of scanned.Items) {
                            descendants.push(it);
                            if (it.type === 'folder') stack.push(it.fileId);
                        }
                    }

                    while (scanned.LastEvaluatedKey) {
                        scanned = await dynamoDB.scan({ ...scanParams, ExclusiveStartKey: scanned.LastEvaluatedKey }).promise();
                        if (scanned.Items && scanned.Items.length) {
                            for (const it of scanned.Items) {
                                descendants.push(it);
                                if (it.type === 'folder') stack.push(it.fileId);
                            }
                        }
                    }
                }

                return descendants;
            };

            const descendants = await collectDescendants(fileId);

            for (const desc of descendants) {
                if (hasS3Key(desc.s3Key)) {
                    try {
                        await s3.deleteObject({ Bucket: process.env.S3_BUCKET_NAME, Key: desc.s3Key }).promise();
                    } catch (err) {
                        console.error('Error deleting descendant S3 object:', err);
                    }
                }
            }

            for (const desc of descendants) {
                try {
                    await dynamoDB.delete({ TableName: 'Files', Key: { fileId: desc.fileId } }).promise();
                } catch (err) {
                    console.error('Error deleting descendant metadata:', err);
                }
            }

            try {
                await dynamoDB.delete({ TableName: 'Files', Key: { fileId } }).promise();
            } catch (err) {
                console.error('Error deleting folder metadata:', err);
                return res.status(500).json({ error: 'Error deleting folder metadata' });
            }

            return res.status(200).json({ message: `Folder deleted; ${descendants.length} descendant item(s) removed` });
        }

        if (hasS3Key(file.s3Key)) {
            try {
                const s3Params = {
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: file.s3Key,
                };
                await s3.deleteObject(s3Params).promise();
            } catch (err) {
                console.error("Error deleting S3 object:", err);
            }
        }

        try {
            await dynamoDB.delete({ TableName: 'Files', Key: { fileId } }).promise();
            return res.status(200).json({ message: 'File deleted successfully' });
        } catch (err) {
            console.error('Error deleting metadata:', err);
            return res.status(500).json({ error: 'Error deleting file metadata' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error deleting file" });
    }
});

export default router;