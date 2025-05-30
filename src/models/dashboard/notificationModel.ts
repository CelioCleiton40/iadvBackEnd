import { ObjectId } from "mongodb";
import { z } from "zod";

export const AppNotification = z.object({
  appointmentId: z.string(),
  userId: z.string(),
  type: z.enum(['email', 'sms', 'push', 'whatsapp']),
  status: z.enum(['pending', 'sent', 'failed', 'cancelled']),
  scheduledFor: z.date(),
  template: z.string(),
  recipient: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    pushToken: z.string().optional(),
  }),
  content: z.object({
    subject: z.string().optional(),
    message: z.string(),
    variables: z.record(z.any()).optional(),
  }),
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
});

export type NotificationInput = z.infer<typeof AppNotification>;

export interface Notification extends Omit<NotificationInput, 'scheduledFor'> {
  _id?: ObjectId;
  scheduledFor: Date;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  errorMessage?: string;
}
