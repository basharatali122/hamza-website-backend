import { DataTypes, Model } from "sequelize";
import connection from "../config/database.js";
import { v4 as uuid } from "uuid";


class ReferralEvent extends Model {}

ReferralEvent.init(
  {
    eventId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: uuid,
    },
    referrerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'userId'
      }
    },
    refereeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'userId'
      }
    },
    eventType: {
      type: DataTypes.ENUM('signup', 'conversion'),
      defaultValue: 'signup'
    },
    tier: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  },
  {
    sequelize: connection,
    modelName: "ReferralEvent",
    tableName: "referral_events",
    timestamps: true,
  }
);
export default ReferralEvent;