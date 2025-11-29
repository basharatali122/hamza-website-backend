import { DataTypes, Model } from "sequelize";
import connection from "../config/database.js";
import { v4 as uuid } from "uuid";

class User extends Model {
  toJSON() {
    const values = { ...this.get() };
    delete values.password; 
    return values;
  }
}

User.init(
  {
    userId: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: uuid,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    role: {
      type: DataTypes.ENUM("customer", "admin", "vendor"),
      allowNull: false,
      defaultValue: "customer",
    },
    // 🔥 NEW REFERRAL FIELDS
    referralCode: {
      type: DataTypes.STRING(10),
      unique: true,
      allowNull: true,
    },
    referredBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'userId'
      }
    },
    referralCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    referralLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    // new fields for team depth tracking
    // Add to User model
teamDepth: {
  type: DataTypes.INTEGER,
  defaultValue: 0, // How deep in the referral chain
},
directReferrals: {
  type: DataTypes.INTEGER,
  defaultValue: 0, // Count of direct referrals
},
teamSize: {
  type: DataTypes.INTEGER,
  defaultValue: 0, // Total team size including indirect
},
teamStructure: {
  type: DataTypes.JSON,
  defaultValue: {} // Optional: Store team hierarchy
}
  },
  {
    sequelize: connection,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    paranoid: true,
  }
);

export default User;