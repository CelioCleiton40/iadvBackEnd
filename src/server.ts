import mongoose from 'mongoose';
import { buildApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';

async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(env.DATABASE_URL);
    logger.info('Connected to MongoDB');

    const app = await buildApp();

    // Start the server
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info(`Server is running on http://localhost:${env.PORT}`);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

startServer();