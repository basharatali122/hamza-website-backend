import express from "express";
const router = express.Router();
import withdrawalController from "../controller/withdrawal.controller.js";
import verifyToken from "../middlewares/auth.middlware.js";
import { adminCheck } from "../middlewares/admin.middleware.js";

// User routes
router.post("/request", verifyToken, withdrawalController.requestWithdrawal);
router.get(
  "/my-withdrawals",
  verifyToken,
  withdrawalController.getUserWithdrawals
);

// Admin routes
router.get(
  "/all",
  verifyToken,
 adminCheck,
  withdrawalController.getAllWithdrawals
);
router.put(
  "/:withdrawal_id/status",
  verifyToken,
 adminCheck,
  withdrawalController.updateWithdrawalStatus
);

export default router;
