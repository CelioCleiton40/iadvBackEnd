

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string; // Adicionando para validação
}

export interface LoginData {
  email: string;
  password: string;
}
 
  export interface AuthResponse {
    token: string;
  }
  