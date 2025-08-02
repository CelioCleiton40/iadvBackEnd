// Utilitários para testes
// Helpers reutilizáveis porque DRY também se aplica a testes

import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { UserPayload } from '../../src/security/jwt';
import { User } from '../../src/models/userModel';
import { ProcessoSlim } from '../../src/types/ProcessoSlim';
import { Appointment } from '../../src/models/dashboard/appointmentModel';

// Mock de Request do Express
export const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  ...overrides
});

// Mock de Response do Express
export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis()
  };
  return res;
};

// Mock de usuário autenticado
export const createMockUser = (overrides: Partial<UserPayload> = {}): UserPayload => ({
  userId: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  role: 'advogado',
  ...overrides
});

// Mock de usuário completo
export const createMockUserComplete = (overrides: Partial<User> = {}): User => ({
  _id: new ObjectId('507f1f77bcf86cd799439011'),
  firstName: 'João',
  lastName: 'Silva',
  email: 'test@example.com',
  password: '$2b$10$hashedpassword',
  role: 'advogado',
  createdAt: new Date('2024-01-01'),
  ...overrides
});

// Mock de processo
export const createMockProcesso = (overrides: Partial<ProcessoSlim> = {}): ProcessoSlim => ({
  numeroProcesso: '1234567-89.2024.8.26.0001',
  tribunal: 'TJSP',
  classe: 'Procedimento Comum Cível',
  grau: '1º Grau',
  dataAjuizamento: '2024-01-15',
  ultimaAtualizacao: '2024-01-20T10:30:00Z',
  assuntos: ['Direito Administrativo'],
  ultimoAndamento: {
    dataHora: '2024-01-20T10:30:00Z',
    descricao: 'Processo distribuído'
  },
  ...overrides
});

// Mock de agendamento
export const createMockAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  _id: new ObjectId('507f1f77bcf86cd799439012'),
  title: 'Audiência de Conciliação',
  type: 'audiencia',
  date: '2024-12-25',
  time: '14:00',
  client: 'João Silva',
  case: '1234567-89.2024.1.23.4567',
  description: 'Audiência de conciliação no processo X',
  status: 'scheduled',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

// Mock de coleção MongoDB
export const createMockCollection = () => ({
  findOne: jest.fn(),
  find: jest.fn().mockReturnValue({
    toArray: jest.fn().mockResolvedValue([]),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis()
  }),
  insertOne: jest.fn().mockResolvedValue({ insertedId: '507f1f77bcf86cd799439011' }),
  updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  countDocuments: jest.fn().mockResolvedValue(0)
});

// Mock de banco de dados
export const createMockDatabase = () => ({
  collection: jest.fn().mockReturnValue(createMockCollection())
});

// Função para aguardar promises em testes
export const waitFor = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Validador de email para testes
export const isValidEmail = (email: string): boolean => 
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Gerador de dados aleatórios para testes
export const generateRandomString = (length: number = 10): string => 
  Math.random().toString(36).substring(2, length + 2);

export const generateRandomEmail = (): string => 
  `${generateRandomString(8)}@test.com`;

export const generateRandomCPF = (): string => {
  const randomDigits = () => Math.floor(Math.random() * 10);
  return `${randomDigits()}${randomDigits()}${randomDigits()}.${randomDigits()}${randomDigits()}${randomDigits()}.${randomDigits()}${randomDigits()}${randomDigits()}-${randomDigits()}${randomDigits()}`;
};

// Matcher customizado para datas
export const expectDateToBeRecent = (date: Date | string, maxAgeMs: number = 5000): void => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  expect(diff).toBeLessThan(maxAgeMs);
};

// Função para testar erros assíncronos
export const expectAsyncError = async (fn: () => Promise<any>, expectedMessage?: string): Promise<void> => {
  try {
    await fn();
    throw new Error('Expected function to throw an error');
  } catch (error) {
    if (expectedMessage && error instanceof Error) {
      expect(error.message).toContain(expectedMessage);
    }
  }
};