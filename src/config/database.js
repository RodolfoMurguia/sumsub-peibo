/**
 * Database Configuration
 * Configuración de conexión a MongoDB usando Mongoose
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongo:27017/sumsub-onboarding';

/**
 * Conecta a la base de datos MongoDB
 * @returns {Promise<void>}
 */
const connectDatabase = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(MONGODB_URI, options);

    console.log(`${new Date().toISOString()} - [DATABASE] Successfully connected to MongoDB`);
    console.log(`${new Date().toISOString()} - [DATABASE] URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);

    // Event listeners
    mongoose.connection.on('error', (err) => {
      console.error(`${new Date().toISOString()} - [DATABASE] MongoDB connection error:`, err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn(`${new Date().toISOString()} - [DATABASE] MongoDB disconnected`);
    });

    mongoose.connection.on('reconnected', () => {
      console.log(`${new Date().toISOString()} - [DATABASE] MongoDB reconnected`);
    });

  } catch (error) {
    console.error(`${new Date().toISOString()} - [DATABASE] Failed to connect to MongoDB:`, error.message);
    throw error;
  }
};

/**
 * Desconecta de la base de datos MongoDB
 * @returns {Promise<void>}
 */
const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    console.log(`${new Date().toISOString()} - [DATABASE] Disconnected from MongoDB`);
  } catch (error) {
    console.error(`${new Date().toISOString()} - [DATABASE] Error disconnecting from MongoDB:`, error.message);
    throw error;
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
};





/**
 * Database Configuration
 * Configuración de conexión a MongoDB usando Mongoose
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongo:27017/sumsub-onboarding';

/**
 * Conecta a la base de datos MongoDB
 * @returns {Promise<void>}
 */
const connectDatabase = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(MONGODB_URI, options);

    console.log(`${new Date().toISOString()} - [DATABASE] Successfully connected to MongoDB`);
    console.log(`${new Date().toISOString()} - [DATABASE] URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);

    // Event listeners
    mongoose.connection.on('error', (err) => {
      console.error(`${new Date().toISOString()} - [DATABASE] MongoDB connection error:`, err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn(`${new Date().toISOString()} - [DATABASE] MongoDB disconnected`);
    });

    mongoose.connection.on('reconnected', () => {
      console.log(`${new Date().toISOString()} - [DATABASE] MongoDB reconnected`);
    });

  } catch (error) {
    console.error(`${new Date().toISOString()} - [DATABASE] Failed to connect to MongoDB:`, error.message);
    throw error;
  }
};

/**
 * Desconecta de la base de datos MongoDB
 * @returns {Promise<void>}
 */
const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    console.log(`${new Date().toISOString()} - [DATABASE] Disconnected from MongoDB`);
  } catch (error) {
    console.error(`${new Date().toISOString()} - [DATABASE] Error disconnecting from MongoDB:`, error.message);
    throw error;
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
};




