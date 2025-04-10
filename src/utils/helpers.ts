import { Request } from 'express';

// Função para gerar um ID único (UUID)
export const generateUniqueId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Função para formatar mensagens de erro padrão
export const formatError = (message: string, details?: any): object => {
  return {
    error: message,
    details: details || null,
  };
};

// Função para verificar se o usuário está autenticado (exemplo simples)
export const isAuthenticated = (req: Request): boolean => {
  return !!(req as any).user; // Type assertion to handle user property on Request object
};

// Função para calcular o tempo decorrido entre duas datas
export const calculateElapsedTime = (startDate: Date, endDate: Date): string => {
  const elapsedMilliseconds = endDate.getTime() - startDate.getTime();
  const seconds = Math.floor(elapsedMilliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours} hour(s)`;
  if (minutes > 0) return `${minutes} minute(s)`;
  return `${seconds} second(s)`;
};

// Função para paginar resultados de consultas ao banco de dados
export const paginateResults = <T>(data: T[], page: number, limit: number): T[] => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  return data.slice(startIndex, endIndex);
};