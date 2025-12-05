import { DataTypes } from 'sequelize';
import  sequelize  from '../config/database.js';

const Withdrawal = sequelize.define('Withdrawal', {
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
  transaction_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'transactions',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  bank_name: {
    type: DataTypes.STRING(100)
  },
  account_number: {
    type: DataTypes.STRING(50)
  },
  account_title: {
    type: DataTypes.STRING(100)
  },
  iban: {
    type: DataTypes.STRING(50)
  },
  status: {
    type: DataTypes.ENUM('awaiting_approval', 'approved', 'rejected', 'processed'),
    defaultValue: 'awaiting_approval'
  },
  requested_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  approved_at: {
    type: DataTypes.DATE
  },
  processed_at: {
    type: DataTypes.DATE
  },
  approved_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Admin',
      key: 'id'
    }
  },
  rejection_reason: {
    type: DataTypes.TEXT
  },
  admin_notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'withdrawals',
  timestamps: true
});

export default Withdrawal;