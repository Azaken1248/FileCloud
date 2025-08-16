import express from "express";
import bcrypt from "bcryptjs";
import { dynamoDB } from "../config/aws.js";
import { createToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
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

router.post("/login", async (req, res) => {
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

export default router;