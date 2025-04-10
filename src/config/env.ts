import dotenv from 'dotenv';
dotenv.config();

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value.trim();
}

export const PORT = (() => {
  const portStr = getRequiredEnv('PORT');
  const port = parseInt(portStr, 10);
  if (isNaN(port) || port <= 0) {
    throw new Error('PORT must be a valid positive number.');
  }
  return port;
})();

export const DATABASE_URL = (() => {
  const url = getRequiredEnv('DATABASE_URL');
  if (!/^mongodb(\+srv)?:\/\//.test(url)) {
    throw new Error('DATABASE_URL must start with "mongodb://" or "mongodb+srv://"');
  }
  return url;
})();

export const JWT_SECRET = (() => {
  const secret = getRequiredEnv('JWT_SECRET');
  if (secret.length < 16) {
    throw new Error('JWT_SECRET must be at least 16 characters long for security reasons.');
  }
  return secret;
})();

if (process.env.NODE_ENV !== 'production') {
  console.log('Environment variables loaded and validated.');
}

export const env = {
  PORT,
  DATABASE_URL,
  JWT_SECRET,
};
