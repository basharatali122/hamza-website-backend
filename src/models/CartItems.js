import { DataTypes, Model } from "sequelize";
import connection from "../config/database.js";
import { v4 as uuid } from "uuid";

// Import Cart and Product models for foreign key references
import Product from "./Products.js";
import Cart from "./Cart.js";

class CartItem extends Model {}

CartItem.init(
  {
    cartItemId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: uuid,
    },
    cartId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Cart, key: "cartId" },
      onDelete: "CASCADE",
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Product, key: "productId" },
      onDelete: "CASCADE",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    sequelize: connection,
    modelName: "CartItem",
    tableName: "cart_items",
    timestamps: true,
    paranoid: true,
  }
);

export default CartItem;