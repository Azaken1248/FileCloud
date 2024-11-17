import express from "express";
import bodyParser from "body-parser";
import AWS from "aws-sdk";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dynamoDBService = new AWS.DynamoDB();

app.use(cors());
app.use(bodyParser.json());


const tableExists = async () => {
  const params = {
    TableName: "Users",
    AttributeDefinitions: [
      { AttributeName: "email", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "email", KeyType: "HASH" }, 
    ],
    BillingMode: "PAY_PER_REQUEST", 
  };

  try {
    const existingTables = await dynamoDBService.listTables().promise();
    if (!existingTables.TableNames.includes("Users")) {
      console.log("Table 'Users' does not exist. Creating it...");
      await dynamoDBService.createTable(params).promise();
      console.log("Table 'Users' created successfully.");
    } else {
      console.log("Table 'Users' already exists.");
    }
  } catch (err) {
    console.error("Error ensuring table exists:", err);
    throw err;
  }
};


app.use(async (_req, res, next) => {
  try {
    await tableExists();
    next();
  } catch (err) {
    res.status(500).json({ error: "Error ensuring table exists" });
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

    res.json({ message: "Login successful!", token });
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


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
