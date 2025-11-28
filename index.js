// Load environment variables first
import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
dotenv.config();

// Verify required environment variables
const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET"];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(
    "❌ Missing required environment variables:",
    missingVars.join(", ")
  );
  console.error("Please check your .env file and try again.");
  process.exit(1);
}

console.log("✅ Environment variables loaded successfully");

// Initialize express app
const app = express();

// Log environment
console.log(
  `🚀 Starting server in ${process.env.NODE_ENV || "development"} mode`
);

// CORS configuration
const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://gym-app-b.onrender.com",
  "https://gym-app-b.onrender.com/",
  "https://gym-app-f.vercel.app",
  "https://gym-app-f.vercel.app/",
];

const extraOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const allowedOrigins = [...new Set([...defaultOrigins, ...extraOrigins])];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like same-origin requests, mobile apps or curl)
    if (!origin) {
      return callback(null, true);
    }

    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // For development, allow all origins but log a warning
    if (process.env.NODE_ENV !== "production") {
      console.warn(`Allowing non-whitelisted origin in development: ${origin}`);
      return callback(null, true);
    }

    console.error(`CORS blocked: ${origin} not in allowed origins`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true, // Important for cookies, authorization headers with HTTPS
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Content-Length",
    "Accept",
    "Origin",
    "X-Auth-Token",
  ],
  methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "PATCH"],
  optionsSuccessStatus: 200,
  exposedHeaders: ["Content-Length", "X-Foo", "X-Bar"],
  preflightContinue: false,
  maxAge: 86400, // 24 hours
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

// Initialize middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Log all requests with more details
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log("  Headers:", JSON.stringify(req.headers, null, 2));
  console.log("  Query:", JSON.stringify(req.query, null, 2));
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err?.message === "Not allowed by CORS") {
    console.error(
      `❌ CORS rejection for origin: ${req.headers.origin || "unknown"}`
    );
    return res.status(403).json({
      success: false,
      message: "CORS policy does not allow access from this origin",
    });
  }

  console.error("❌ Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;
// user defined package
import connectDB from "./utils/connectDB.js";
// import User from "./models/User.js";
import authRoute from "./routes/authRoute.js";
import planRoute from "./routes/planCategoryRoute.js";
import subscriptionRoute from "./routes/subscriptionRoute.js";
import contactRoute from "./routes/contactRoute.js";
import feedbackRoute from "./routes/feedBackRoute.js";
import adminRoute from "./routes/adminRoute.js";

app.get("/", (req, res) => {
  res.send("Server is running successfully");
});

// API Routes with enhanced logging
const routes = [
  { path: "/api/v1/auth", route: authRoute, name: "Auth" },
  { path: "/api/v1/plan", route: planRoute, name: "Plan" },
  {
    path: "/api/v1/subscription",
    route: subscriptionRoute,
    name: "Subscription",
  },
  { path: "/api/v1/contact", route: contactRoute, name: "Contact" },
  { path: "/api/v1/feedback", route: feedbackRoute, name: "Feedback" },
  { path: "/api/v1/admin", route: adminRoute, name: "Admin" },
];

// Mount all routes with enhanced logging
routes.forEach(({ path, route, name }) => {
  console.log(`🔌 Mounting ${name} routes at: ${path}`);
  // Log all routes in this router
  route.stack.forEach((r) => {
    if (r.route && r.route.path) {
      const methods = Object.keys(r.route.methods)
        .map((method) => method.toUpperCase())
        .join(",");
      console.log(
        `   ${methods.padEnd(7)} ${path}${
          r.route.path === "/" ? "" : r.route.path
        }`
      );
    }
  });

  app.use(path, route);
});

// Add a test route to verify server is running
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Log all registered routes
console.log("\n📡 Server Routes Summary:");
routes.forEach(({ path, name }) => {
  console.log(`   - ${name} API: ${path}`);
});

// Error handling for uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1); // Exit with failure
});

// Error handling for unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1); // Exit with failure
});

const startServer = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await connectDB(process.env.MONGODB_URI);

    // Basic health check endpoint
    app.get("/health", (req, res) => {
      res
        .status(200)
        .json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Start the server
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server is running on ${PORT}`);
      console.log("📡 Available routes:");
      console.log(`   - GET  /health`);
      console.log(`   - GET  /api/v1/auth/...`);
      console.log(`   - GET  /api/v1/plan/...`);
      console.log(`   - GET  /api/v1/subscription/...`);
      console.log(`   - GET  /api/v1/contact/...`);
      console.log(`   - GET  /api/v1/feedback/...`);
      console.log(`   - GET  /api/v1/admin/...`);
    });

    // Handle server errors
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error("❌ Server error:", error);
      }
      process.exit(1);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("SIGTERM received. Shutting down gracefully...");
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
