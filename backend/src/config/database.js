const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Use SQLite for zero-config local development.
// Switch to postgres dialect + credentials for production.
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

module.exports = sequelize;
