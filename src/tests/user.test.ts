import { FastifyInstance } from 'fastify';
import { buildApp } from '../app';
import { User } from '../modules/user/user.model';
import mongoose from 'mongoose';

describe('User Module', () => {
  let app: FastifyInstance;
  let accessToken: string;
  let userId: string;
  
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
    
    // Create a test user and get token
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
    
    const result = JSON.parse(response.payload);
    accessToken = result.accessToken;
    userId = result.user._id;
  });
  
  describe('GET /user/me', () => {
    it('should get user profile with valid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/user/me',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });
      
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toHaveProperty('_id', userId);
      expect(JSON.parse(response.payload)).toHaveProperty('email', 'test@example.com');
      expect(JSON.parse(response.payload)).not.toHaveProperty('password');
    });
    
    it('should return 401 without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/user/me'
      });
      
      expect(response.statusCode).toBe(401);
    });
  });
  
  describe('PUT /user/me', () => {
    it('should update user profile', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/user/me',
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        payload: {
          name: 'Updated Name'
        }
      });
      
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toHaveProperty('name', 'Updated Name');
      expect(JSON.parse(response.payload)).toHaveProperty('email', 'test@example.com');
    });
    
    it('should not update sensitive fields', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/user/me',
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        payload: {
          role: 'admin',
          isActive: false
        }
      });
      
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toHaveProperty('role', 'client'); // Default role
      expect(JSON.parse(response.payload)).toHaveProperty('isActive', true); // Default value
    });
  });
});