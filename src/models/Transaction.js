import { DataTypes } from 'sequelize';
import sequelize  from '../config/database.js';

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  transaction_type: {
    type: DataTypes.ENUM(
      'deposit',           // Balance add
      'withdrawal',        // Withdrawal request
      'purchase',          // Product purchase
      'refund',           // Order refund
      'referral_bonus',   // Referral earnings
      'topup_bonus'       // Bonus on balance add
    ),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_method: {
    type: DataTypes.ENUM('zindigi', 'wallet', 'card', 'bank_transfer'),
    allowNull: false
  },
  payment_gateway_response: {
    type: DataTypes.JSON,
    comment: 'Zindigi API response'
  },
  transaction_id: {
    type: DataTypes.STRING(100),
    unique: true,
    comment: 'Unique transaction reference'
  },
  zindigi_transaction_id: {
    type: DataTypes.STRING(100),
    comment: 'Zindigi payment gateway transaction ID'
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Orders',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled', 'awaiting_approval'),
    defaultValue: 'pending'
  },
  description: {
    type: DataTypes.TEXT
  },
  metadata: {
    type: DataTypes.JSON,
    comment: 'Additional transaction data'
  }
}, {
  tableName: 'transactions',
  timestamps: true
});

export default Transaction;