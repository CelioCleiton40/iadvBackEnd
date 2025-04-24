import { z } from 'zod';
import { ObjectId } from 'mongodb';

// Função auxiliar para validar ObjectId
const objectIdValidator = (value: string) => {
  if (!ObjectId.isValid(value)) {
    throw new Error('ID inválido.');
  }
  return value;
};

export const createCasoSchema = z.object({
  nome: z
    .string({ required_error: "O nome é obrigatório." })
    .min(1, "O nome é obrigatório.")
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚâêîôÂÊÎÔãõÃÕçÇ\s]+$/, "O nome deve conter apenas letras, números ou espaços."),
  descricao: z
    .string({ required_error: "A descrição é obrigatória." })
    .min(1, "A descrição é obrigatória."),
  categoria: z
    .string({ required_error: "A categoria é obrigatória." })
    .min(1, "A categoria é obrigatória.")
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚâêîôÂÊÎÔãõÃÕçÇ\s]+$/, "A categoria deve conter apenas letras, números ou espaços."),
  imagem: z
    .string()
    .url("A imagem deve ser uma URL válida.")
    .optional(), // Aceita apenas URLs válidas
  data: z
    .string()
    .refine((value) => !isNaN(Date.parse(value)), "A data deve ser válida.")
    .optional(), // Data no formato ISO (ex.: "2023-10-05T14:48:00.000Z")
  local: z
    .string()
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚâêîôÂÊÎÔãõÃÕçÇ\s.,-]+$/, "O local deve conter apenas letras, números, espaços ou caracteres como vírgula, ponto ou hífen.")
    .optional(),
  criadoPor: z
    .string()
    .refine(objectIdValidator, "ID de usuário inválido.")
    .optional(), // Validação de ObjectId
  criadoEm: z
    .string()
    .refine((value) => !isNaN(Date.parse(value)), "A data de criação deve ser válida.")
    .optional(),
  atualizadoEm: z
    .string()
    .refine((value) => !isNaN(Date.parse(value)), "A data de atualização deve ser válida.")
    .optional(),
});

// Tipagem gerada automaticamente pelo Zod
export type CreateCasoInput = z.infer<typeof createCasoSchema>;