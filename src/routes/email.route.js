import { Router } from "express";
import {
  sendVerificationEmail,
  verifyEmailCode,
  verifyEmailLink,
} from "../controller/email.controller.js";

const router = Router();

// Email verification routes
router.post("/send-verification", sendVerificationEmail);
router.post("/verify-email", verifyEmailCode);
router.get("/verify-email/:token", verifyEmailLink);

export default router;