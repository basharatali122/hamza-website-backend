import { Router } from "express";
import {
  createPaymentIntent,
  confirmOrder,
} from "../controller/checkout.controller.js";
import authCheckMiddleware from "../middlewares/auth.middlware.js";

const router = Router();


router.post("/payment-intent", authCheckMiddleware, createPaymentIntent);
router.post("/confirm-order", authCheckMiddleware, confirmOrder);

export default router;