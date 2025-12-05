import express from 'express';
const router = express.Router();
import paymentController from '../controller/payment.controller.js';
import  verifyToken  from '../middlewares/auth.middlware.js';

// Initiate payment
router.post('/initiate', verifyToken, paymentController.initiatePayment);

// Payment callback (webhook)
router.post('/callback', paymentController.handlePaymentCallback);

// Verify payment
router.get('/verify/:transaction_id', verifyToken, paymentController.verifyPayment);

export default router;