import { DataTypes, Model } from "sequelize";
import connection from "../config/database.js";
import { v4 as uuid } from "uuid";

// Import User model for foreign key reference
import User from "./Users.js";

class Cart extends Model {}


Cart.init(
  {
    cartId: {
      type: DataTypes.UUID,
      defaultValue: uuid,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: User, key: "userId" },
    },
     status: {
      type: DataTypes.ENUM("active", "completed"),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    sequelize: connection,
    modelName: "Cart",
    tableName: "Carts",
    timestamps: true,
    paranoid: true,
  }
);


export default Cart;