export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    createdAt: Date;
  }
  
  export interface CreateUserInput {
    firstName: string;
    lastName?: string;
    email: string;
    password: string;
    role: 'admin' | 'user' | 'advogado';
  }
  
  export interface AuthenticatedUser {
    id: string;
    email: string;
  }

  export type UserRole = "advogado" | "procuradoria" | "magistrado";