// server.js
import express from "express";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

config();

const app = express();
const port = process.env.PORT || 3000;

// Import database and routes
import { db } from "./src/models/index.js";
import authRoutes from "./src/routes/auth.route.js";
import userRoutes from "./src/routes/user.route.js";
import cartRoutes from "./src/routes/cart.route.js";
import checkoutRoutes from "./src/routes/checkout.route.js";
import emailCheckRoutes from "./src/routes/email.route.js";
import orderRoutes from "./src/routes/order.route.js";
import productRoutes from "./src/routes/product.route.js";
import productImageRoutes from "./src/routes/productImage.route.js";
import vendorRoutes from "./src/routes/vendor.route.js";
import referralRoutes from "./src/routes/referral.route.js";
import wishlistRoutes from "./src/routes/wishlist.route.js";
import categoryRoutes from "./src/routes/category.route.js";
import teamDepth from "./src/routes/team.route.js";

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",

];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

// Rate Limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: {
//     error: "Too many requests from this IP, please try again later.",
//   },
// });

// app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    await db.connection.authenticate();
    res.status(200).json({
      status: "OK",
      database: "connected",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes with consistent prefix
app.use("/api/auth", authRoutes, emailCheckRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/email", emailCheckRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/product", productRoutes);
app.use("/api/product-images", productImageRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/referral", referralRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/team", teamDepth);

// API Documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "E-commerce API Server",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      products: "/api/product",
      cart: "/api/cart",
      orders: "/api/orders",
      vendors: "/api/vendors",
      categories: "/api/category",
      team: "/api/team",
    },
    health: "/health",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.redirect("/api");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);

  // CORS error
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "CORS policy violation",
      message: "Origin not allowed",
    });
  }

  // Rate limit error
  if (err.status === 429) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      message: "Too many requests, please try again later.",
    });
  }
  // 404 Error Handler
  app.use("*", (req, res, next) => {
    res.status(404).json({
      error: "Route not found",
      path: req.originalUrl,
      method: req.method,
    });
  });
  // Sequelize errors
  if (err.name?.includes("Sequelize")) {
    const sequelizeError = handleSequelizeError(err);
    return res.status(sequelizeError.status).json(sequelizeError.response);
  }

  // Default error
  const status = err.status || 500;
  const response = {
    error: "Internal Server Error",
    ...(process.env.NODE_ENV !== "production" && {
      message: err.message,
      stack: err.stack,
    }),
  };

  res.status(status).json(response);
});

// Sequelize error handler
const handleSequelizeError = (err) => {
  if (err.name === "SequelizeValidationError") {
    return {
      status: 400,
      response: {
        error: "Validation Error",
        details: err.errors.map((e) => ({
          field: e.path,
          message: e.message,
        })),
      },
    };
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return {
      status: 409,
      response: {
        error: "Duplicate Entry",
        message: "Resource already exists",
        field: err.errors[0]?.path,
      },
    };
  }

  if (err.name === "SequelizeDatabaseError") {
    return {
      status: 400,
      response: {
        error: "Database Error",
        message: "Invalid operation",
      },
    };
  }

  return {
    status: 500,
    response: {
      error: "Database Error",
      message:
        process.env.NODE_ENV !== "production"
          ? err.message
          : "Internal server error",
    },
  };
};

// Database synchronization with better error handling
const syncDatabase = async () => {
  try {
    console.log("Starting database synchronization...");

    const syncOptions = {
      force: process.env.DB_FORCE_SYNC === "true",
      alter: process.env.DB_ALTER_SYNC === "true",
    };

    await db.connection.sync({alter: true, force: false});

    console.log("Database synchronized successfully");
    console.log(`Sync options:`, syncOptions);
  } catch (error) {
    console.error(" Database synchronization failed:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    if (error.original) {
      console.error("Original error:", error.original);
    }

    process.exit(1);
  }
};

// Graceful shutdown handlers
const shutdown = async (signal) => {
  console.log(`\n${signal} received: shutting down gracefully...`);

  try {
    // Close database connection
    await db.connection.close();
    console.log(" Database connection closed");

    // Exit process
    setTimeout(() => {
      console.log(" Server shutdown complete");
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Unhandled rejection handler
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Uncaught exception handler
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    await syncDatabase();

    const server = app.listen(port, () => {
      console.log(`
 Server running at http://localhost:${port}
 Environment: ${process.env.NODE_ENV || "development"}
 Started at: ${new Date().toISOString()}
 Database: ${process.env.DB_NAME}
      `);
    });

    // Server error handler
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use`);
      } else {
        console.error("Server error:", error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
