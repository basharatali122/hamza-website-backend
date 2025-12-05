import Withdrawal from '../models/Withdrawal.js';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import User from '../models/Users.js';
import  sequelize  from '../config/database.js';

class WithdrawalController {
  
  // Request withdrawal
  async requestWithdrawal(req, res) {
    const t = await sequelize.transaction();
    
    try {
      const userId = req.user.id;
      const { amount, bank_name, account_number, account_title, iban } = req.body;
      
      // Validation
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid withdrawal amount'
        });
      }
      
      // Minimum withdrawal check (example: 500 PKR)
      if (amount < 500) {
        return res.status(400).json({
          success: false,
          message: 'Minimum withdrawal amount is PKR 500'
        });
      }
      
      // Get wallet
      const wallet = await Wallet.findOne({ 
        where: { user_id: userId },
        transaction: t 
      });
      
      if (!wallet) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }
      
      // Check sufficient balance
      const totalBalance = parseFloat(wallet.balance) + parseFloat(wallet.bonus_balance);
      if (totalBalance < amount) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance'
        });
      }
      
      // Deduct from wallet (hold the amount)
      let remainingAmount = amount;
      
      if (parseFloat(wallet.balance) >= remainingAmount) {
        wallet.balance = parseFloat(wallet.balance) - remainingAmount;
      } else {
        const balanceUsed = parseFloat(wallet.balance);
        remainingAmount -= balanceUsed;
        wallet.balance = 0;
        wallet.bonus_balance = parseFloat(wallet.bonus_balance) - remainingAmount;
      }
      
      await wallet.save({ transaction: t });
      
      // Create transaction
      const transaction = await Transaction.create({
        user_id: userId,
        transaction_type: 'withdrawal',
        amount: amount,
        payment_method: 'bank_transfer',
        status: 'awaiting_approval',
        transaction_id: `WD-${Date.now()}-${userId}`,
        description: `Withdrawal request: PKR ${amount}`
      }, { transaction: t });
      
      // Create withdrawal request
      const withdrawal = await Withdrawal.create({
        user_id: userId,
        transaction_id: transaction.id,
        amount,
        bank_name,
        account_number,
        account_title,
        iban,
        status: 'awaiting_approval',
        requested_at: new Date()
      }, { transaction: t });
      
      await t.commit();
      
      return res.status(200).json({
        success: true,
        message: 'Withdrawal request submitted successfully. It will be processed within 24 hours.',
        data: {
          withdrawal_id: withdrawal.id,
          amount: amount,
          status: 'awaiting_approval',
          requested_at: withdrawal.requested_at
        }
      });
      
    } catch (error) {
      await t.rollback();
      console.error('Withdrawal request error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process withdrawal request'
      });
    }
  }

  // Get user withdrawals
  async getUserWithdrawals(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, status } = req.query;
      
      const where = { user_id: userId };
      if (status) {
        where.status = status;
      }
      
      const withdrawals = await Withdrawal.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['requested_at', 'DESC']],
        include: [{
          model: Transaction,
          attributes: ['transaction_id', 'status', 'createdAt']
        }]
      });
      
      return res.status(200).json({
        success: true,
        data: withdrawals.rows,
        pagination: {
          total: withdrawals.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(withdrawals.count / parseInt(limit))
        }
      });
      
    } catch (error) {
      console.error('Get withdrawals error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch withdrawals'
      });
    }
  }

  // Admin: Get all withdrawal requests
  async getAllWithdrawals(req, res) {
    try {
      const { page = 1, limit = 20, status = 'awaiting_approval' } = req.query;
      
      const withdrawals = await Withdrawal.findAndCountAll({
        where: status ? { status } : {},
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['requested_at', 'DESC']],
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'email', 'phone']
          },
          {
            model: Transaction,
            attributes: ['transaction_id', 'amount', 'status']
          }
        ]
      });
      
      return res.status(200).json({
        success: true,
        data: withdrawals.rows,
        pagination: {
          total: withdrawals.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(withdrawals.count / parseInt(limit))
        }
      });
      
    } catch (error) {
      console.error('Get all withdrawals error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch withdrawal requests'
      });
    }
  }

  // Admin: Approve/Reject withdrawal
  async updateWithdrawalStatus(req, res) {
    const t = await sequelize.transaction();
    
    try {
      const { withdrawal_id } = req.params;
      const { status, rejection_reason, admin_notes } = req.body;
      const adminId = req.user.id;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }
      
      const withdrawal = await Withdrawal.findByPk(withdrawal_id, {
        include: [{ model: Transaction }],
        transaction: t
      });
      
      if (!withdrawal) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'Withdrawal request not found'
        });
      }
      
      if (withdrawal.status !== 'awaiting_approval') {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Withdrawal already processed'
        });
      }
      
      if (status === 'rejected') {
        // Refund amount to wallet
        const wallet = await Wallet.findOne({ 
          where: { user_id: withdrawal.user_id },
          transaction: t 
        });
        
        wallet.balance = parseFloat(wallet.balance) + parseFloat(withdrawal.amount);
        await wallet.save({ transaction: t });
        
        // Update transaction
        await Transaction.update(
          { status: 'cancelled' },
          { where: { id: withdrawal.transaction_id }, transaction: t }
        );
        
        withdrawal.status = 'rejected';
        withdrawal.rejection_reason = rejection_reason;
      } else {
        withdrawal.status = 'approved';
        withdrawal.approved_at = new Date();
        
        // Update transaction
        await Transaction.update(
          { status: 'completed' },
          { where: { id: withdrawal.transaction_id }, transaction: t }
        );
        
        // Update wallet total_withdrawn
        const wallet = await Wallet.findOne({ 
          where: { user_id: withdrawal.user_id },
          transaction: t 
        });
        wallet.total_withdrawn = parseFloat(wallet.total_withdrawn) + parseFloat(withdrawal.amount);
        await wallet.save({ transaction: t });
      }
      
      withdrawal.approved_by = adminId;
      withdrawal.admin_notes = admin_notes;
      await withdrawal.save({ transaction: t });
      
      await t.commit();
      
      return res.status(200).json({
        success: true,
        message: `Withdrawal ${status} successfully`,
        data: withdrawal
      });
      
    } catch (error) {
      await t.rollback();
      console.error('Update withdrawal status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update withdrawal status'
      });
    }
  }
}

// Export as default
export default new WithdrawalController();