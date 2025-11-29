// backend/config/config.js
import dotenv from "dotenv";
dotenv.config();

const config = {
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  apiBaseUrl: process.env.API_BASE_URL
};
export default config;
