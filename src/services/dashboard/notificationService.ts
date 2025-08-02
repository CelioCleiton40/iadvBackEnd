import { NotificationRepository } from "../../repositories/notificationRepository";
import { AppointmentRepository } from "../../repositories/AppointmentRepository"; // Corrigido nome do arquivo para minúsculo inicial
import { AppNotification, NotificationInput } from "../../models/dashboard/notificationModel";
import { Appointment } from "../../models/dashboard/appointmentModel";
import {
  NOTIFICATION_TEMPLATES,
  NOTIFICATION_SETTINGS,
  NotificationTemplate
} from "../../config/notificationConfig";
import {
  NotificationProvider,
  EmailProvider,
  SMSProvider,
  PushProvider
} from "./notificationProviders";
import { AppNotificationn } from "../../types/notificationType"; // Verificar se "AppNotificationn" com dois 'n' está correto

export class NotificationService {
  private notificationRepository = new NotificationRepository();
  private appointmentRepository = new AppointmentRepository();
  private providers = new Map<string, NotificationProvider>([
    ['email', new EmailProvider()],
    ['sms', new SMSProvider()],
    ['push', new PushProvider()]
  ]);

  async scheduleReminders(
    appointment: Appointment,
    userPreferences: {
      email?: string;
      phone?: string;
      pushToken?: string;
      enabledTypes: ('email' | 'sms' | 'push')[];
    }
  ): Promise<void> {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);

    for (const interval of NOTIFICATION_SETTINGS.REMINDER_INTERVALS) {
      const scheduledFor = new Date(appointmentDateTime.getTime() - interval.hours * 60 * 60 * 1000);
      if (scheduledFor <= new Date()) continue;

      for (const type of userPreferences.enabledTypes) {
        const recipient: any = {};

        if (type === 'email' && userPreferences.email) recipient.email = userPreferences.email;
        if (type === 'sms' && userPreferences.phone) recipient.phone = userPreferences.phone;
        if (type === 'push' && userPreferences.pushToken) recipient.pushToken = userPreferences.pushToken;

        if (Object.keys(recipient).length === 0) continue;

        const template = NOTIFICATION_TEMPLATES[interval.template];
        const content = this.processTemplate(template, appointment);

        const notificationData: NotificationInput = {
          appointmentId: appointment._id!.toString(),
          userId: appointment.client,
          type,
          status: 'pending',
          scheduledFor,
          template: interval.template,
          recipient,
          content,
          retryCount: 0,
          maxRetries: NOTIFICATION_SETTINGS.MAX_RETRIES
        };

        await this.notificationRepository.create(notificationData);
      }
    }
  }

  async sendImmediateNotification(
    appointment: Appointment,
    templateName: string,
    recipient: { email?: string; phone?: string; pushToken?: string },
    type: 'email' | 'sms' | 'push'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const template = NOTIFICATION_TEMPLATES[templateName];
      if (!template) return { success: false, error: 'Template não encontrado' };

      const content = this.processTemplate(template, appointment);

      const notificationData: NotificationInput = {
        appointmentId: appointment._id!.toString(),
        userId: appointment.client,
        type,
        status: 'pending',
        scheduledFor: new Date(),
        template: templateName,
        recipient,
        content,
        retryCount: 0,
        maxRetries: 1
      };

      const notification = await this.notificationRepository.create(notificationData);
      return await this.sendNotification({
        ...notification,
        _id: notification._id?.toString()
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async processNotificationQueue(): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    const pendingNotifications = await this.notificationRepository.findPendingNotifications(50);

    let successful = 0;
    let failed = 0;

    for (const notification of pendingNotifications) {
      const result = await this.sendNotification({
        ...notification,
        _id: notification._id?.toString()
      });

      if (result.success) {
        successful++;
        await this.notificationRepository.updateStatus(notification._id!.toString(), 'sent');
      } else {
        failed++;
        await this.handleFailedNotification({
          ...notification,
          _id: notification._id?.toString()
        }, result.error);
      }
    }

    return {
      processed: pendingNotifications.length,
      successful,
      failed
    };
  }

  async cancelNotifications(appointmentId: string): Promise<number> {
    return this.notificationRepository.cancelByAppointmentId(appointmentId);
  }

  private async sendNotification(notification: AppNotificationn): Promise<{ success: boolean; error?: string }> {
    const provider = this.providers.get(notification.type);
    if (!provider) return { success: false, error: `Provedor não encontrado: ${notification.type}` };
    return await provider.send(notification);
  }

  private async handleFailedNotification(notification: AppNotificationn, error?: string): Promise<void> {
    await this.notificationRepository.incrementRetryCount(notification._id!.toString());

    if (notification.retryCount + 1 >= notification.maxRetries) {
      await this.notificationRepository.updateStatus(notification._id!.toString(), 'failed', error);
    } else {
      const retryDelay = NOTIFICATION_SETTINGS.RETRY_DELAY_MINUTES[notification.retryCount] || 60;
      const newScheduledFor = new Date(Date.now() + retryDelay * 60 * 1000);
      console.log(`Reagendando notificação ${notification._id} para ${newScheduledFor}`);
      // Aqui você pode salvar a nova data no banco se desejar
    }
  }

  private processTemplate(template: NotificationTemplate, appointment: Appointment): {
    subject?: string;
    message: string;
  } {
    const variables: Record<string, string> = {
      clientName: String(appointment.client),
      date: new Date(appointment.date).toLocaleDateString('pt-BR'),
      time: appointment.time,
      type: appointment.type,
      title: appointment.title,
      description: appointment.description || '',
      case: appointment.case || ''
    };

    let processedMessage = template.message;
    let processedSubject = template.subject;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedMessage = processedMessage.replace(regex, value);
      if (processedSubject) {
        processedSubject = processedSubject.replace(regex, value);
      }
    });

    return {
      subject: processedSubject,
      message: processedMessage
    };
  }
}
