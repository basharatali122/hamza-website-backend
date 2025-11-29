import { Router } from "express";
import authMiddleware from "../middlewares/auth.middlware.js";
import { adminCheck } from "../middlewares/admin.middleware.js";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
} from "../controller/order.controller.js";

const router = Router();

// ===== User Routes =====
router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, getUserOrders);
router.get("/:orderId", authMiddleware, getOrderById);
router.put("/:orderId/cancel", authMiddleware, cancelOrder);

// ===== Admin Routes =====
router.get("/admin/all", authMiddleware, adminCheck, getAllOrders);
router.put("/admin/:orderId/status", authMiddleware, adminCheck, updateOrderStatus);

export default router;