// routes/vendor.routes.js
import { Router } from "express";
import {
  createVendor,
  getVendors,
  getVendorById,
} from "../controller/vendor.controller.js";
import authMiddleware from "../middlewares/auth.middlware.js";

const router = Router();

// Create a new vendor
router.post("/", authMiddleware, createVendor);

// Get all vendors
router.get("/", getVendors);

// Get vendor by ID
router.get("/:id", getVendorById);

export default router;