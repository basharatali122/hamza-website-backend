import { DataTypes, Model } from "sequelize";
import connection from "../config/database.js";
import { v4 as uuid } from "uuid";

// Import User and Product models for foreign key references
import User from "./Users.js";
import Product from "./Products.js";

class Wishlist extends Model {}

Wishlist.init(
  {
    wishlistId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: uuid,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "userId",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Product,
        key: "productId",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  },
  {
    sequelize: connection,
    modelName: "Wishlist",
    tableName: "wishlists",
    timestamps: true,
    paranoid: true,
  }
);
export default Wishlist;
