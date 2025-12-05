import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import User from '../models/Users.js';
import sequelize  from '../config/database.js';

class WalletController {
  
  // Get user wallet balance
  async getBalance(req, res) {
    try {
      const userId = req.user.id;
      
      let wallet = await Wallet.findOne({ where: { user_id: userId } });
      
      // Create wallet if doesn't exist
      if (!wallet) {
        wallet = await Wallet.create({ user_id: userId });
      }
      
      return res.status(200).json({
        success: true,
        data: {
          balance: parseFloat(wallet.balance),
          bonus_balance: parseFloat(wallet.bonus_balance),
          total_balance: parseFloat(wallet.balance) + parseFloat(wallet.bonus_balance),
          total_earned: parseFloat(wallet.total_earned),
          total_withdrawn: parseFloat(wallet.total_withdrawn),
          currency: wallet.currency,
          status: wallet.status
        }
      });
      
    } catch (error) {
      console.error('Get balance error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch wallet balance'
      });
    }
  }

  // Add balance with bonus
  async addBalance(req, res) {
    const t = await sequelize.transaction();
    
    try {
      const userId = req.user.id;
      const { amount, payment_method, zindigi_transaction_id } = req.body;
      
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid amount'
        });
      }
      
      // Get wallet
      let wallet = await Wallet.findOne({ 
        where: { user_id: userId },
        transaction: t 
      });
      
      if (!wallet) {
        wallet = await Wallet.create({ user_id: userId }, { transaction: t });
      }
      
      // Calculate bonus (10% example)
      const bonusPercentage = 10; // You can fetch from settings
      const bonusAmount = (amount * bonusPercentage) / 100;
      
      // Update wallet
      wallet.balance = parseFloat(wallet.balance) + parseFloat(amount);
      wallet.bonus_balance = parseFloat(wallet.bonus_balance) + parseFloat(bonusAmount);
      await wallet.save({ transaction: t });
      
      // Create deposit transaction
      const depositTransaction = await Transaction.create({
        user_id: userId,
        transaction_type: 'deposit',
        amount: amount,
        payment_method: payment_method || 'zindigi',
        zindigi_transaction_id,
        status: 'completed',
        transaction_id: `DEP-${Date.now()}-${userId}`,
        description: `Balance added: PKR ${amount}`
      }, { transaction: t });
      
      // Create bonus transaction
      if (bonusAmount > 0) {
        await Transaction.create({
          user_id: userId,
          transaction_type: 'topup_bonus',
          amount: bonusAmount,
          payment_method: 'bonus',
          status: 'completed',
          transaction_id: `BONUS-${Date.now()}-${userId}`,
          description: `${bonusPercentage}% bonus on balance add`
        }, { transaction: t });
      }
      
      await t.commit();
      
      return res.status(200).json({
        success: true,
        message: `Balance added successfully! You received PKR ${bonusAmount} bonus`,
        data: {
          amount_added: amount,
          bonus_received: bonusAmount,
          new_balance: parseFloat(wallet.balance),
          new_bonus_balance: parseFloat(wallet.bonus_balance),
          transaction_id: depositTransaction.transaction_id
        }
      });
      
    } catch (error) {
      await t.rollback();
      console.error('Add balance error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add balance'
      });
    }
  }

  // Get transaction history
  async getTransactions(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, type } = req.query;
      
      const where = { user_id: userId };
      if (type) {
        where.transaction_type = type;
      }
      
      const transactions = await Transaction.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['createdAt', 'DESC']],
        include: [{
          model: User,
          attributes: ['id', 'username', 'email']
        }]
      });
      
      return res.status(200).json({
        success: true,
        data: transactions.rows,
        pagination: {
          total: transactions.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(transactions.count / parseInt(limit))
        }
      });
      
    } catch (error) {
      console.error('Get transactions error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions'
      });
    }
  }
}

// Export as default
export default new WalletController();