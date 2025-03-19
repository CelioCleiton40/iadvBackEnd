import { FastifyInstance } from 'fastify';
import { buildApp } from '../app';
import { User } from '../modules/user/user.model';
import mongoose from 'mongoose';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OAB Module', () => {
  let app: FastifyInstance;
  let accessToken: string;
  
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
        name: 'Test Lawyer',
        email: 'lawyer@example.com',
        password: 'Password123!',
        cpf: '123.456.789-00',
        oabNumber: '123456/SP',
        role: 'lawyer'
      }
    });
    
    const result = JSON.parse(response.payload);
    accessToken = result.accessToken;
    
    // Reset axios mocks
    jest.clearAllMocks();
  });
  
  describe('GET /oab/validate', () => {
    it('should validate a valid OAB number', async () => {
      // Mock the OAB API response
      mockedAxios.get.mockImplementationOnce(() => 
        Promise.resolve({
          status: 200,
          data: {
            name: 'Test Lawyer',
            status: 'Active'
          }
        })
      );
      
      const response = await app.inject({
        method: 'GET',
        url: '/oab/validate?oabNumber=123456/SP',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });
      
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toHaveProperty('isValid', true);
      expect(JSON.parse(response.payload)).toHaveProperty('name', 'Test Lawyer');
      expect(JSON.parse(response.payload)).toHaveProperty('status', 'Active');
      
      // Verify that axios was called with the correct parameters
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/advogados/SP/123456'),
        expect.any(Object)
      );
    });
    
    it('should return invalid for non-existent OAB number', async () => {
      // Mock the OAB API response for not found
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            message: 'OAB registration not found'
          }
        }
      };
      
      // Make axios.isAxiosError return true for our mock error
      mockedAxios.isAxiosError.mockImplementation((error) => {
        return error === axiosError || error.isAxiosError === true;
      });
      
      mockedAxios.get.mockImplementationOnce(() => Promise.reject(axiosError));
      
      const response = await app.inject({
        method: 'GET',
        url: '/oab/validate?oabNumber=999999/SP',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });
      
      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toHaveProperty('error', 'Invalid OAB registration');
      expect(JSON.parse(response.payload)).toHaveProperty('message', 'OAB registration not found');
    });
    
    it('should handle API authentication errors', async () => {
      // Mock the OAB API response for authentication error
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: {
            message: 'Invalid API key'
          }
        }
      };
      
      // Make axios.isAxiosError return true for our mock error
      mockedAxios.isAxiosError.mockImplementation((error) => {
        return error === axiosError || error.isAxiosError === true;
      });
      
      mockedAxios.get.mockImplementationOnce(() => Promise.reject(axiosError));
      
      const response = await app.inject({
        method: 'GET',
        url: '/oab/validate?oabNumber=123456/SP',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });
      
      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toHaveProperty('error', 'Invalid OAB registration');
      expect(JSON.parse(response.payload)).toHaveProperty('message', 'Authentication error with OAB API');
    });
    
    it('should handle network errors', async () => {
      // Mock a network error
      const networkError = new Error('Network Error');
      mockedAxios.get.mockImplementationOnce(() => Promise.reject(networkError));
      
      const response = await app.inject({
        method: 'GET',
        url: '/oab/validate?oabNumber=123456/SP',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });
      
      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toHaveProperty('error', 'Invalid OAB registration');
      expect(JSON.parse(response.payload)).toHaveProperty('message', 'Error validating OAB registration');
    });
    
    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/oab/validate?oabNumber=123456/SP'
      });
      
      expect(response.statusCode).toBe(401);
    });
    
    it('should require OAB number parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/oab/validate',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });
      
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toHaveProperty('error', 'OAB number is required');
    });
  });
});