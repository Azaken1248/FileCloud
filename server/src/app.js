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
const corsOptions = {
  origin: 'https://filecloud.azaken.com', 
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'], 
  optionsSuccessStatus: 200 
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

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