// Payment.js
import { DataTypes } from 'sequelize';
import  sequelize  from '../config/database.js';

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Orders',
      key: 'id'
    }
  },
  transaction_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'transactions',
      key: 'id'
    }
  },
  payment_method: {
    type: DataTypes.ENUM('zindigi', 'wallet', 'card', 'mixed'),
    allowNull: false
  },
  amount_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  wallet_amount_used: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  gateway_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  zindigi_response: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'payments',
  timestamps: true
});

export default Payment;