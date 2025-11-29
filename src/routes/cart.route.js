import { Router } from "express";
import authMiddleware from "../middlewares/auth.middlware.js";
import { adminCheck } from "../middlewares/admin.middleware.js";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartSummary,
  moveToWishlist,
  getAllCarts,
  clearUserCart,
  getUserCart,
} from "../controller/cart.controller.js";

const router = Router();

// User routes
router.get("/", authMiddleware, getCart);
router.get("/summary", authMiddleware, getCartSummary);
router.post("/add", authMiddleware, addToCart);
router.put("/update", authMiddleware, updateCartItem);
router.delete("/remove/:cartItemId", authMiddleware, removeCartItem);
router.delete("/clear", authMiddleware, clearCart);
router.post("/move-to-wishlist", authMiddleware, moveToWishlist);

// Admin routes
router.get("/admin/all", authMiddleware, adminCheck, getAllCarts);
router.get("/admin/user/:userId", authMiddleware, adminCheck, getUserCart);
router.delete("/admin/clear/:userId", authMiddleware, adminCheck, clearUserCart);

export default router;