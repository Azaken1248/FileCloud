import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { ensureTableExists } from "./utils/tableManager.js";
import authRoutes from "./routes/authRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import { protectedRoute } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;


app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

app.use(async (_req, res, next) => {
  try {
    await ensureTableExists();
    next();
  } catch (err) {
    res.status(500).json({ error: "Error ensuring tables exist" });
  }
});

app.use("/", authRoutes);
app.use("/", fileRoutes);

app.get("/protected", protectedRoute, (req, res) => {
  res.json({ message: "Access granted", email: req.user.email });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});