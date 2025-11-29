import { Router } from "express";
import categoryController from "../controller/category.controller.js";
import authMiddleware from "../middlewares/auth.middlware.js";

const router = Router();

// Protected Routes
router.post("/", authMiddleware, categoryController.createCategory);

// Public Routes
router.get("/", categoryController.getCategories);
router.get("/:id", categoryController.getCategoryById);

export default router;