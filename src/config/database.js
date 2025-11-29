

import { config } from "dotenv";
import { Sequelize } from "sequelize";
import pg from "pg";

// Load environment variables
config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || "postgres",
    dialectModule: pg,
    logging: false,
    dialectOptions: {
      ssl: {
        require: process.env.DB_SSL_REQUIRE === "true",
        rejectUnauthorized: process.env.DB_SSL_REJECT === "true"
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    if (error.parent) {
      console.error("Parent error:", error.parent.message);
      console.error("Error code:", error.parent.code);
    }
  }
})();

// Graceful shutdown
const shutdown = async () => {
  try {
    await sequelize.close();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export default sequelize;
