import sequelize from "../config/sequelize-setup";
import { DataTypes, Model } from "sequelize";

export class RateLimitedAddresses extends Model {
  declare wallet_address: string;
  declare retry_at: Date;
  declare id: number;
}

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
