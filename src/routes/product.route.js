import { Router } from "express";
import multer from "multer";
import authMiddleware from "../middlewares//auth.middlware.js";
import { adminCheck } from "../middlewares/admin.middleware.js";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controller/product.controller.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = Router();

// Public routes
router.get("/", getAllProducts);
router.get("/:productId", getProductById);

// Protected routes (admin/vendor)
router.post(
  "/",
  authMiddleware,
  adminCheck,
  upload.array("images", 5),
  createProduct
);

router.put(
  "/:productId",
  authMiddleware,
  adminCheck,
  upload.array("images", 5),
  updateProduct
);

router.delete("/:productId", authMiddleware, adminCheck, deleteProduct);

export default router;