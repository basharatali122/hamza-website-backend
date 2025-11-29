import { Router } from "express";
import authMiddleware from "../middlewares/auth.middlware.js";
import { adminCheck } from "../middlewares/admin.middleware.js";
import {
  createProductImage,
  getProductImages,
  deleteProductImage,
} from "../controller/productImage.controller.js";

const router = Router();

// Public route: Get all images of a product
router.get("/:productId", getProductImages);

// Protected routes (admin only)
router.post("/", authMiddleware, adminCheck, createProductImage);
router.delete("/:imageId", authMiddleware, adminCheck, deleteProductImage);

export default router;