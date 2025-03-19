import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost:27017/advogados',
  
  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-in-production',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Rate limiting
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  RATE_LIMIT_TIME_WINDOW: process.env.RATE_LIMIT_TIME_WINDOW || '1m',
  
  // OAB API
  OAB_API_URL: process.env.OAB_API_URL || 'https://api.oab.org.br/v1',
  OAB_API_KEY: process.env.OAB_API_KEY || '',
  
  // DataJud API
  DATAJUD_API_URL: process.env.DATAJUD_API_URL || 'https://datajud-wiki.cnj.jus.br/api-publica/acesso',
  DATAJUD_API_KEY: process.env.DATAJUD_API_KEY || ''
};