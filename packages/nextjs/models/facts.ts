import sequelize from "../config/sequelize-setup";
import { DataTypes, Model } from "sequelize";

export class Facts extends Model {
  declare wallet_address: string;
  declare statement: string;
  declare id: number;

  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  static associate(models: any) {
    // define association here
  }
}

Facts.init(
  {
    wallet_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    statement: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    // Add other attributes as needed
  },
  {
    sequelize,
    modelName: "facts",
  },
);
