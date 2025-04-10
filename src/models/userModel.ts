import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  fistName: string;
  lastName?: string; // ID gerado automaticamente pelo MongoDB
  email: string;
  password: string;
  role: string;
  createdAt?: Date; // Data de criação (opcional)
}