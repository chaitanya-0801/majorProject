import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";

import userRoutes from "./routes/userRoutes.js";
import SessionRoutes from "./routes/SessionRoutes.js";
import CurriculumRoutes from "./routes/CurriculumRoutes.js";
import ClassRoutes from "./routes/ClassRoutes.js";
import { seedAdminAccount } from "./scripts/seedAdmin.js";

const app = express();
const PORT = process.env.PORT || 5050;
const MONGODB_URL = process.env.DB_URI;

// 1. Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://attend-ease-dev.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev to avoid blocking legitimate institutional clients
    },
    credentials: true,
  })
);

// 3. Body Parsing & Cookies
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// 4. Static Files
app.use(express.static("public"));
app.use("/uploads", express.static(path.resolve("./public/uploads")));

// 5. Rate Limiting for Sensitive Endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 auth requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again after 15 minutes" },
});
app.use("/users/signin", authLimiter);
app.use("/users/sendmail", authLimiter);

// 6. Database Connection
if (MONGODB_URL) {
  mongoose
    .connect(MONGODB_URL, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(async () => {
      console.log("[Database] Connected successfully to MongoDB");
      try {
        await seedAdminAccount({ closeConnection: false });
      } catch (seedErr) {
        console.warn("[Database] Auto-seeding notice:", seedErr.message);
      }
    })
    .catch((err) => {
      console.error("[Database] MongoDB connection error:", err.message);
    });
} else {
  console.warn("[Database] Warning: DB_URI not configured in .env");
}

// 7. Base & Health Check Routes
app.get("/", (req, res) => {
  res.status(200).json({
    name: "AttendEase API",
    status: "online",
    version: "2.0.0",
    language: "English",
    features: [
      "Smart Geolocation Attendance",
      "Camera Verification",
      "Expiring QR Codes",
      "AI Personalized Curriculum Planning",
      "Deterministic Academic Analytics",
    ],
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// 8. Application Routes
app.use("/users", userRoutes);
app.use("/sessions", SessionRoutes);
app.use("/curriculum", CurriculumRoutes);
app.use("/classes", ClassRoutes);

// 9. Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// 10. Centralized Error Handler
app.use((err, req, res, next) => {
  console.error("[Server Error]", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "An unexpected internal server error occurred",
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Server] AttendEase backend is running on port ${PORT}`);
});

export default app;
