import express from 'express';
const router = express.Router();
import walletController from '../controller/wallet.controller.js';
import verifyToken  from '../middlewares/auth.middlware.js';

// Get wallet balance
router.get('/balance', verifyToken, walletController.getBalance);

// Add balance
router.post('/add-balance', verifyToken, walletController.addBalance);

// Get transactions
router.get('/transactions', verifyToken, walletController.getTransactions);

export default router;