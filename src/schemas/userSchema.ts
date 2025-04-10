import { z } from "zod";

// Schema para validação de criação de usuário (CreateUserInput)
export const createUserSchema = z.object({
  fistName: z.string().min(1, "O primeiro nome é obrigatório."),
  lastName: z.string().optional(),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  role: z.enum(["admin", "user", "advogado"]).optional(), // ou apenas z.string() se for livre
});