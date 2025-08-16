import express from "express";
import multer from "multer";
import { s3, dynamoDB } from "../config/aws.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/upload", upload.single("file"), async (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        const userEmail = username;
        const s3Key = `files/${userEmail}/${Date.now()}_${req.file.originalname}`;

        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: s3Key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        };

        const s3Response = await s3.upload(params).promise();
        const fileUrl = s3Response.Location;

        const fileItem = {
            fileId: Date.now().toString(),
            userEmail,
            fileName: req.file.originalname,
            s3Key,
            fileUrl,
            fileSize: req.file.size,
            fileType: req.file.mimetype,
            uploadedAt: new Date().toISOString(),
        };

        const dynamoParams = {
            TableName: "Files",
            Item: fileItem,
        };

        await dynamoDB.put(dynamoParams).promise();

        res.status(200).json({ message: "File uploaded successfully!", fileUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error uploading file" });
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

        if (!file.s3Key) {
            return res.status(400).json({ error: "File does not have an associated S3 key" });
        }

        const s3Params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: file.s3Key,
        };

        await s3.deleteObject(s3Params).promise();

        const deleteParams = {
            TableName: "Files",
            Key: { fileId },
        };
        await dynamoDB.delete(deleteParams).promise();

        res.status(200).json({ message: "File deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error deleting file" });
    }
});

export default router;