export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    createdAt: Date;
  }
  
  export interface CreateUserInput {
    fistName: string;
    lastName?: string;
    email: string;
    password: string;
    role: 'admin' | 'user' | 'advogado';
  }
  
  export interface AuthenticatedUser {
    id: string;
    email: string;
  }