import { DataTypes } from 'sequelize';
import  sequelize from '../config/database.js';

const Wallet = sequelize.define('Wallet', {
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
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  bonus_balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
    comment: 'Bonus amount from referrals and top-ups'
  },
  total_earned: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Total earnings from referrals'
  },
  total_withdrawn: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'PKR'
  },
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'frozen'),
    defaultValue: 'active'
  }
}, {
  tableName: 'wallets',
  timestamps: true
});

export default Wallet;