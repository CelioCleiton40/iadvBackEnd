import { z } from 'zod';



export const userProfileSchema = z.object({
  _id: z.string().min(1, '_id é obrigatório'), // Substitui userId por _id
  nomeCompleto: z.string().min(1, 'Nome completo é obrigatório').trim(),
  cpf: z.string().min(11).max(14).regex(/^\d{11}$/, 'CPF inválido'),
  email: z.string().email().trim().toLowerCase(),
  telefone: z.string().min(10).max(15).regex(/^\d+$/, 'Telefone inválido'),
  dataNascimento: z.string().datetime().optional(),
  estadoCivil: z.string().optional(),
  numeroOAB: z.string().optional(),
  seccional: z.string().optional(),
  areasAtuacao: z.string().optional(),
  escritorio: z.string().optional(),
  dataInscricaoOAB: z.string().datetime().optional(),
  situacao: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
}).strict();