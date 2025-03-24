import { FastifyInstance } from 'fastify';
import { buildApp } from '../app';
import { User } from '../modules/user/user.model';
import mongoose from 'mongoose';
import axios from 'axios';
import { jest } from '@jest/globals';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DataJud Module', () => {
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
    mockedAxios.get.mockReset();
  });
  
  describe('GET /datajud/search', () => {
    it('should search for cases with valid query', async () => {
      // Mock the DataJud API response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          cases: [
            {
              id: '123',
              number: '0001234-12.2023.8.26.0100',
              court: 'TJSP',
              subject: 'Civil',
              description: 'Test case',
              status: 'Active',
              createdAt: '2023-01-01T00:00:00Z',
              updatedAt: '2023-01-02T00:00:00Z'
            }
          ],
          total: 1,
          page: 1,
          limit: 10
        }
      });
      
      const response = await app.inject({
        method: 'GET',
        url: '/datajud/search?query=test',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });
      
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toHaveProperty('cases');
      expect(JSON.parse(response.payload).cases).toHaveLength(1);
      expect(JSON.parse(response.payload).cases[0]).toHaveProperty('id', '123');
    });
    
    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/datajud/search?query=test'
      });
      
      expect(response.statusCode).toBe(401);
    });
    
    it('should require query parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/datajud/search',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });
      
      expect(response.statusCode).toBe(400);
    });
  });
  
  describe('GET /datajud/cases/:id', () => {
    it('should get case details by ID', async () => {
      // Mock the DataJud API response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: '123',
          number: '0001234-12.2023.8.26.0100',
          court: 'TJSP',
          subject: 'Civil',
          description: 'Test case',
          status: 'Active',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-02T00:00:00Z'
        }
      });
      
      const response = await app.inject({
        method: 'GET',
        url: '/datajud/cases/123',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });
      
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toHaveProperty('id', '123');
      expect(JSON.parse(response.payload)).toHaveProperty('number', '0001234-12.2023.8.26.0100');
    });
    
    it('should handle API errors', async () => {
      // Mock the DataJud API error response
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: {
            message: 'Case not found'
          }
        }
      });
      
      const response = await app.inject({
        method: 'GET',
        url: '/datajud/cases/999',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });
      
      expect(response.statusCode).toBe(500);
    });
  });
  
  describe('GET /datajud/cases/:id/documents', () => {
    it('should get case documents', async () => {
      // Mock the DataJud API response
      mockedAxios.get.mockResolvedValueOnce({
        data: [
          {
            id: 'doc1',
            caseId: '123',
            title: 'Initial Petition',
            type: 'petition',
            content: 'Document content',
            createdAt: '2023-01-01T00:00:00Z'
          }
        ]
      });
      
      const response = await app.inject({
        method: 'GET',
        url: '/datajud/cases/123/documents',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });
      
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toBeInstanceOf(Array);
      expect(JSON.parse(response.payload)[0]).toHaveProperty('id', 'doc1');
      expect(JSON.parse(response.payload)[0]).toHaveProperty('title', 'Initial Petition');
    });
  });
  
  describe('GET /datajud/magistrate', () => {
    it('should get magistrate details', async () => {
      // Mock the DataJud API response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: 'mag1',
          name: 'Judge Name',
          court: 'TJSP',
          position: 'Judge'
        }
      });
      
      const response = await app.inject({
        method: 'GET',
        url: '/datajud/magistrate?id=mag1',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });
      
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toHaveProperty('id', 'mag1');
      expect(JSON.parse(response.payload)).toHaveProperty('name', 'Judge Name');
    });
    
    it('should require id parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/datajud/magistrate',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });
      
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toHaveProperty('error', 'Magistrate ID is required');
    });
  });
});