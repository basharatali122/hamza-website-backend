import { DataTypes, Model } from "sequelize";
import connection from "../config/database.js";
import { v4 as uuid } from "uuid";


class Category extends Model {}

Category.init(
  {
    categoryId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: uuid,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize: connection,
    modelName: "Category",
    tableName: "categories",
    timestamps: true,
  }
);

export default Category;