import { FastifyInstance } from 'fastify';
import { buildApp } from '../app';
import { User } from '../modules/user/user.model';
import mongoose from 'mongoose';

describe('Auth Module', () => {
  let app: FastifyInstance;
  
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/advogados_test');
    
    // Build the app
    app = await buildApp();
  });
  
  afterAll(async () => {
    // Clean up database
    await User.deleteMany({});
    
    // Close database connection
    await mongoose.connection.close();
    
    // Close app
    await app.close();
  });
  
  beforeEach(async () => {
    // Clean up users before each test
    await User.deleteMany({});
  });
  
  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          cpf: '123.456.789-00'
        }
      });
      
      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.payload)).toHaveProperty('accessToken');
      expect(JSON.parse(response.payload)).toHaveProperty('refreshToken');
      expect(JSON.parse(response.payload).user).toHaveProperty('_id');
      expect(JSON.parse(response.payload).user.email).toBe('test@example.com');
    });
    
    it('should return 409 if user already exists', async () => {
      // Create a user first
      await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          cpf: '123.456.789-00'
        }
      });
      
      // Try to create the same user again
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          cpf: '123.456.789-00'
        }
      });
      
      expect(response.statusCode).toBe(409);
      expect(JSON.parse(response.payload)).toHaveProperty('error', 'User already exists');
    });
  });
  
  describe('POST /auth/login', () => {
    it('should login a user with valid credentials', async () => {
      // Register a user first
      await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          cpf: '123.456.789-00'
        }
      });
      
      // Login with the user
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'Password123!'
        }
      });
      
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toHaveProperty('accessToken');
      expect(JSON.parse(response.payload)).toHaveProperty('refreshToken');
    });
    
    it('should return 401 with invalid credentials', async () => {
      // Register a user first
      await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          cpf: '123.456.789-00'
        }
      });
      
      // Try to login with wrong password
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'WrongPassword123!'
        }
      });
      
      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.payload)).toHaveProperty('error', 'Invalid credentials');
    });
  });
});