import { z } from "zod";

// Validação dos dados de um agendamento
export const appointmentSchema = z.object({
  title: z.string().min(3),
  type: z.string(),
  date: z.string(), // Ex: '2025-05-30'
  time: z.string(), // Ex: '10:00'
  client: z.string(),
  case: z.string().optional(),
  description: z.string().optional(),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;
