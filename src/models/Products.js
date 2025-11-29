import { DataTypes, Model } from "sequelize";
import connection from "../config/database.js";
import { v4 as uuid } from "uuid";

// Category model for foreign key reference
import Category from "./Category.js";
// Vendor model for foreign key reference
import Vendor from "./Vendors.js";

class Product extends Model {}

Product.init(
  {
    productId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: uuid, // UUIDv4
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    originalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Category, key: "categoryId" },
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: true, 
      references: { model: Vendor, key: "vendorId" },
    },
  },
  {
    sequelize: connection,
    modelName: "Product",
    tableName: "products",
    timestamps: true,
    paranoid: true, 
  }
);

export default Product;