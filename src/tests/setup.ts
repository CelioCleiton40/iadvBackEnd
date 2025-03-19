import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.test file if it exists, otherwise from .env
dotenv.config({
  path: path.resolve(process.cwd(), '.env.test'),
});

// Set test environment
process.env.NODE_ENV = 'test';

// Use test database
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'mongodb://localhost:27017/advogados_test';
}

// Global setup
beforeAll(() => {
  // Global setup code if needed
});

// Global teardown
afterAll(() => {
  // Global teardown code if needed
});