import { DataTypes, Model } from "sequelize";
import connection from "../config/database.js";
import { v4 as uuid } from "uuid";


class Role extends Model {}

Role.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: uuid(),
    },
    name: {
      type: DataTypes.STRING(50), // e.g. "admin", "customer", "vendor"
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize: connection,
    modelName: "Role",
    tableName: "roles",
    timestamps: false,
  }
);

export default Role;