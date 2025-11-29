import { DataTypes, Model } from "sequelize";
import connection from "../config/database.js";  
import { v4 as uuid } from "uuid";

// import User model for foreign key reference if needed
import User from "./Users.js";

class OAuthAccount extends Model {}

OAuthAccount.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: uuid,
    },
    provider: {
      type: DataTypes.STRING(50), // e.g. "google", "github", "apple"
      allowNull: false,
    },
    providerId: {
      type: DataTypes.STRING(255), // provider’s unique ID (sub)
      allowNull: false,
    },
    accessToken: {
      type: DataTypes.STRING(2000), // use STRING instead of TEXT for portability
      allowNull: true,
    },
    refreshToken: {
      type: DataTypes.STRING(2000),
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize: connection,
    modelName: "OAuthAccount",
    tableName: "oauth_accounts",
    timestamps: true,
    paranoid: true, // soft delete for unlinking
    indexes: [
      {
        unique: true,
        fields: ["provider", "providerId"], // enforce one providerId per provider
      },
    ],
  }
);

export default OAuthAccount;