import { z } from 'zod';

/**
 * Schema para validação das configurações de notificações.
 * Rick's comment: Porque notificações mal configuradas são o inferno na Terra.
 */
export const notificationsSchema = z.object({
  email: z.boolean().default(true),
  push: z.boolean().default(true),
  deadlineAlerts: z.boolean().default(true),
  alertDaysBefore: z.number().int().min(1).max(30).default(3)
});

/**
 * Schema para validação das configurações de aparência.
 * Rick's comment: Porque UI feia é crime contra a humanidade.
 */
export const appearanceSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  compactMode: z.boolean().default(false),
  animations: z.boolean().default(true)
});

/**
 * Schema para validação das configurações de privacidade.
 * Rick's comment: Privacidade não é opcional, é obrigatória.
 */
export const privacySchema = z.object({
  twoFactorAuth: z.boolean().default(false),
  activityLog: z.boolean().default(true),
  dataSharing: z.boolean().default(false)
});

/**
 * Schema principal para validação das configurações do usuário.
 * Rick's comment: Validação completa porque dados inválidos são o caos.
 */
export const userSettingsSchema = z.object({
  language: z.string().min(2).max(10).default('pt-BR'),
  timezone: z.string().min(1).max(50).default('America/Sao_Paulo'),
  notifications: notificationsSchema,
  appearance: appearanceSchema,
  privacy: privacySchema
}).strict();

/**
 * Schema para atualização parcial das configurações.
 * Rick's comment: Porque nem sempre você quer atualizar tudo, óbvio.
 */
export const updateUserSettingsSchema = userSettingsSchema.partial();

/**
 * Tipos TypeScript derivados dos schemas.
 * Rick's comment: TypeScript salvando vidas desde sempre.
 */
export type UserSettingsInput = z.infer<typeof userSettingsSchema>;
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
export type NotificationsSettings = z.infer<typeof notificationsSchema>;
export type AppearanceSettings = z.infer<typeof appearanceSchema>;
export type PrivacySettings = z.infer<typeof privacySchema>;