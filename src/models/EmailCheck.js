import { DataTypes, Model } from "sequelize";
import connection from "../config/database.js";
import { v4 as uuid } from "uuid";

// Import User model for foreign key reference
import User from "./Users.js";

class EmailCheck extends Model {}

EmailCheck.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuid,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: User,
        key: "userId",
      },
    },
    token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize: connection,
    modelName: "EmailCheck",
    tableName: "email_checks",
    timestamps: true,
  }
);

export default EmailCheck;