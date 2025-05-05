import { z, ZodSchema } from "zod";
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/userModel';

// Regex para senha segura: min 8 caracteres, pelo menos uma letra minúscula, uma maiúscula, um número e um símbolo
const strongPassword = z
  .string()
  .min(8, { message: "A senha deve ter pelo menos 8 caracteres" })
  .max(100, { message: "Senha muito longa" })
  .regex(/[a-z]/, { message: "A senha deve conter pelo menos uma letra minúscula" })
  .regex(/[A-Z]/, { message: "A senha deve conter pelo menos uma letra maiúscula" })
  .regex(/[0-9]/, { message: "A senha deve conter pelo menos um número" })
  .regex(/[^a-zA-Z0-9]/, { message: "A senha deve conter pelo menos um caractere especial" });

// Email com mais validações básicas
const safeEmail = z
  .string()
  .email({ message: "Email inválido" })
  .min(5, { message: "Email muito curto" })
  .max(100, { message: "Email muito longo" })
  .refine((val) => !val.includes(" "), { message: "Email não pode conter espaços" });

// Validação para registro
export const registerSchema = z.object({
  email: safeEmail,
  password: strongPassword,
  role: z.enum(["advogado", "procuradoria", "magistrado"], { message: "Tipo de usuário inválido" }),
});

// Validação para login
export const loginSchema = z.object({
  email: safeEmail,
  password: z.string().min(8, { message: "Senha inválida" })
}).strict();


export const validate =
  (schema: ZodSchema<any>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      res.status(400).json({
        error: 'Dados inválidos',
        details: result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }
    next();
  };

// Validação para atualização de usuário
// Regex básica para CPF: 000.000.000-00 ou apenas números
const cpfRegex = /^(\d{3}\.?\d{3}\.?\d{3}-?\d{2})$/;

// Regex para telefone simples (aceita celular com DDD e sem)
const telefoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/;

// Esquema para validação de um advogado
export const advogadoSchema = z.object({
  nome: z
    .string()
    .min(3, { message: "O nome deve ter pelo menos 3 letras" })
    .max(100, { message: "O nome é muito longo" })
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s']+$/, { message: "O nome contém caracteres inválidos" }),

  cpf: z
    .string()
    .regex(cpfRegex, { message: "CPF inválido" }),

  email: z
    .string()
    .email({ message: "Email inválido" })
    .min(5)
    .max(100)
    .refine((val) => !val.includes(" "), { message: "Email não pode conter espaços" }),

  telefone: z
    .string()
    .regex(telefoneRegex, { message: "Telefone inválido" }),

  oab: z
    .string()
    .min(4, { message: "Número da OAB inválido" })
    .max(20, { message: "Número da OAB inválido" }),

  estado: z
    .string()
    .length(2, { message: "Estado deve ser a sigla com 2 letras (ex: RN)" })
    .toUpperCase(),

  especialidade: z
    .string()
    .min(3, { message: "Especialidade muito curta" })
    .max(100, { message: "Especialidade muito longa" }),
});

export const validateRegisterUser = (user: User): string | null => {
  if (!user.firstName.trim()) return "O nome é obrigatório.";
  if (!user.lastName?.trim()) return "O sobrenome é obrigatório.";
  if (!user.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    return "O e-mail fornecido é inválido.";
  }
  if (!user.password || user.password.length < 8) {
    return "A senha deve ter pelo menos 8 caracteres.";
  }
  return null;
};