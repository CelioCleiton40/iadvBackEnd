import { z } from 'zod';

/**
 * Schema Zod para validação de perfil de usuário.
 * Rick's comment: Porque dados inválidos são o caos absoluto no multiverso jurídico.
 */

// Regex para CPF: aceita com ou sem formatação
const cpfRegex = /^(\d{3}\.?\d{3}\.?\d{3}-?\d{2})$/;

// Regex para telefone: aceita vários formatos brasileiros
const telefoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/;

// Regex para OAB: números e letras
const oabRegex = /^[A-Z0-9]{4,20}$/i;

/**
 * Schema para criação/atualização de perfil
 * Rick's comment: Validação que funciona de verdade, não essa bagunça que estava aqui.
 */
export const userProfileSchema = z.object({
  nomeCompleto: z.string()
    .min(3, 'Nome completo deve ter pelo menos 3 caracteres')
    .max(100, 'Nome completo muito longo')
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s'.-]+$/, 'Nome contém caracteres inválidos')
    .transform(val => val.trim().replace(/\s+/g, ' ')),
    
  cpf: z.string()
    .regex(cpfRegex, 'CPF inválido. Use formato: 000.000.000-00 ou 00000000000')
    .transform(val => val.replace(/\D/g, '')), // Remove formatação
    
  email: z.string()
    .email('Email inválido')
    .min(5, 'Email muito curto')
    .max(100, 'Email muito longo')
    .transform(val => val.trim().toLowerCase()),
    
  telefone: z.string()
    .regex(telefoneRegex, 'Telefone inválido. Use formato: (00) 00000-0000')
    .transform(val => val.replace(/\D/g, '')), // Remove formatação
    
  dataNascimento: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida. Use formato: YYYY-MM-DD')
    .optional(),
    
  estadoCivil: z.enum(['Solteiro', 'Casado', 'Divorciado', 'Viúvo', 'União Estável'])
    .optional(),
    
  numeroOAB: z.string()
    .regex(oabRegex, 'Número da OAB inválido')
    .transform(val => val.toUpperCase())
    .optional(),
    
  seccional: z.string()
    .length(2, 'Seccional deve ser a sigla do estado (2 letras)')
    .transform(val => val.toUpperCase())
    .optional(),
    
  areasAtuacao: z.string()
    .min(3, 'Área de atuação muito curta')
    .max(200, 'Área de atuação muito longa')
    .optional(),
    
  escritorio: z.string()
    .min(3, 'Nome do escritório muito curto')
    .max(100, 'Nome do escritório muito longo')
    .optional(),
    
  dataInscricaoOAB: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de inscrição OAB inválida. Use formato: YYYY-MM-DD')
    .optional(),
    
  situacao: z.enum(['Ativo', 'Inativo', 'Suspenso', 'Licenciado'])
    .default('Ativo')
    .optional()
});

/**
 * Schema para atualização parcial do perfil
 * Rick's comment: Porque nem sempre você quer atualizar tudo, óbvio.
 */
export const updateUserProfileSchema = userProfileSchema.partial();

/**
 * Tipos TypeScript derivados dos schemas
 * Rick's comment: TypeScript salvando vidas desde sempre.
 */
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;