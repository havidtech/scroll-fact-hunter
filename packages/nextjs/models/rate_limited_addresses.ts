import sequelize from "../config/sequelize-setup";
import { DataTypes, Model } from "sequelize";

export class RateLimitedAddresses extends Model {}

RateLimitedAddresses.init(
  {
    wallet_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    retry_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    // Add other attributes as needed
  },
  {
    sequelize,
    modelName: "rate_limited_addresses",
  },
);
