/**
 * Server Entry Point
 * Inicia el servidor HTTP
 */

const app = require('./app');
const { connectDatabase } = require('./config/database');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Conectar a la base de datos antes de iniciar el servidor
const startServer = async () => {
  try {
    await connectDatabase();
    
    const server = app.listen(PORT, HOST, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║  Sumsub Onboarding Service                           ║
║  Server running on http://${HOST}:${PORT}           ║
║  Environment: ${process.env.NODE_ENV || 'development'}                        ║
║  Node version: ${process.version}                          ║
╚═══════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = startServer;
