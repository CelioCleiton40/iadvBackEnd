import * as cron from 'node-cron';
import { NotificationService } from '../services/dashboard/notificationService';

export class NotificationScheduler {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  start(): void {
    // Processar fila a cada 5 minutos
    cron.schedule('*/5 * * * *', async () => {
      console.log(' Processando fila de notificações...');
      try {
        const result = await this.notificationService.processNotificationQueue();
        console.log(` Processadas: ${result.processed}, Enviadas: ${result.successful}, Falharam: ${result.failed}`);
      } catch (error) {
        console.error(' Erro ao processar fila de notificações:', error);
      }
    });

    console.log(' Scheduler de notificações iniciado');
  }
}