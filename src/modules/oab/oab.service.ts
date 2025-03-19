import axios from 'axios';
import { env } from '../../config/env';

interface OABValidationResult {
  isValid: boolean;
  name?: string;
  oabNumber?: string;
  state?: string;
  status?: string;
  message?: string;
}

export async function validateOABRegistration(oabNumber: string): Promise<OABValidationResult> {
  try {
    // Extract state from OAB number (format: 123456/UF)
    const parts = oabNumber.split('/');
    if (parts.length !== 2) {
      return { isValid: false, message: 'Invalid OAB number format' };
    }

    const number = parts[0];
    const state = parts[1];

    // Make request to OAB API
    const response = await axios.get(`${env.OAB_API_URL}/advogados/${state}/${number}`, {
      headers: {
        'Authorization': `Bearer ${env.OAB_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // This is a mock implementation since we don't have the actual API structure
    // In a real implementation, you would parse the response according to the API docs
    if (response.status === 200 && response.data) {
      return {
        isValid: true,
        name: response.data.name,
        oabNumber: oabNumber,
        state: state,
        status: response.data.status || 'Active'
      };
    } else {
      return { isValid: false, message: 'OAB registration not found' };
    }
  } catch (error) {
    // Handle different error types
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return { isValid: false, message: 'OAB registration not found' };
      } else if (error.response?.status === 401) {
        return { isValid: false, message: 'Authentication error with OAB API' };
      }
    }
    
    return { isValid: false, message: 'Error validating OAB registration' };
  }
}