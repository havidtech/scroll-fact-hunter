// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Sequelize } = require("sequelize");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require("../config/config"); // Adjust path if needed
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pg = require("pg");

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];


const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging,
  dialectModule: pg,
});

module.exports = sequelize;
