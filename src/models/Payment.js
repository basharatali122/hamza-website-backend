import { DataTypes, Model } from "sequelize";
import connection from "../config/database.js";
import { v4 as uuid } from "uuid";

// Import Orders model for foreign key reference
import Order from "./Orders.js";

class Payment extends Model {}

Payment.init(
  {
    paymentId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: uuid,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Order, key: "orderId" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    method: {
      type: DataTypes.ENUM("card", "paypal", "cod"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "completed", "failed"),
      defaultValue: "pending",
    },
  },
  {
    sequelize: connection,
    modelName: "Payment",
    tableName: "payments",
    timestamps: true,
  }
);

export default Payment;