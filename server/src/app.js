import express from "express";
import bodyParser from "body-parser";
import AWS from "aws-sdk";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import path from "path";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const dynamoDBService = new AWS.DynamoDB();

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(cors());
app.use(bodyParser.json());

const ensureTableExists = async () => {
  const paramsUsersTable = {
    TableName: "Users",
    AttributeDefinitions: [
      { AttributeName: "email", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "email", KeyType: "HASH" }, 
    ],
    BillingMode: "PAY_PER_REQUEST",
  };

  const paramsFilesTable = {
    TableName: "Files",
    AttributeDefinitions: [
      { AttributeName: "fileId", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "fileId", KeyType: "HASH" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  };

  try {
    const existingTables = await dynamoDBService.listTables().promise();
    if (!existingTables.TableNames.includes("Users")) {
      console.log("Table 'Users' does not exist. Creating it...");
      await dynamoDBService.createTable(paramsUsersTable).promise();
      console.log("Table 'Users' created successfully.");
    } else {
      console.log("Table 'Users' already exists.");
    }

    if (!existingTables.TableNames.includes("Files")) {
      console.log("Table 'Files' does not exist. Creating it...");
      await dynamoDBService.createTable(paramsFilesTable).promise();
      console.log("Table 'Files' created successfully.");
    } else {
      console.log("Table 'Files' already exists.");
    }
  } catch (err) {
    console.error("Error ensuring tables exist:", err);
    throw err;
  }
};

app.use(async (_req, res, next) => {
  try {
    await ensureTableExists();
    next();
  } catch (err) {
    res.status(500).json({ error: "Error ensuring tables exist" });
  }
});

const createToken = (email) => {
  return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const params = {
    TableName: "Users",
    Item: {
      email,
      name,
      password: hashedPassword,
    },
  };

  try {
    await dynamoDB.put(params).promise();
    res.status(201).json({ message: "User created successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creating user" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const params = {
    TableName: "Users",
    Key: { email },
  };

  try {
    const user = await dynamoDB.get(params).promise();

    if (!user.Item) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.Item.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = createToken(email);

    res.json({ message: "Login successful!", token, username: user.Item.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error logging in" });
  }
});

app.get("/protected", (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(403).json({ error: "Token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ message: "Access granted", email: decoded.email });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// File upload route
// File upload route
app.post("/upload", upload.single("file"), async (req, res) => {
  const { username } = req.body; // Extract username from the form data
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    // Assuming 'username' is the key you want to use
    const userEmail = username; // Here, you can use the username directly

    // Generate a unique key for the file on S3
    const s3Key = `files/${userEmail}/${Date.now()}_${req.file.originalname}`;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key, // Store the S3 key here
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    // Upload file to S3
    const s3Response = await s3.upload(params).promise();
    const fileUrl = s3Response.Location;

    // Store file metadata in DynamoDB, including the S3 key
    const fileItem = {
      fileId: Date.now().toString(),
      userEmail,
      fileName: req.file.originalname,
      s3Key, // Store the S3 key here
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



// Get user files route
app.get("/files", async (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const params = {
      TableName: "Files",
      FilterExpression: "userEmail = :username",  // Filter by username
      ExpressionAttributeValues: {
        ":username": username,
      },
    };

    const result = await dynamoDB.scan(params).promise();  // Use scan instead of query

    console.log("DynamoDB result:", JSON.stringify(result, null, 2));

    if (result.Items && Array.isArray(result.Items)) {
      res.status(200).json(result.Items);  // Return the files
    } else {
      res.status(404).json({ error: "No files found for the user" });
    }
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ error: "Error fetching files" });
  }
});

app.delete("/files/:fileId", async (req, res) => {
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

    // Check if the file has the s3Key property
    if (!file.s3Key) {
      return res.status(400).json({ error: "File does not have an associated S3 key" });
    }

    // Delete from S3
    const s3Params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: file.s3Key,
    };

    await s3.deleteObject(s3Params).promise();

    // Delete from DynamoDB
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






app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
