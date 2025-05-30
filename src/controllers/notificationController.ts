import { Request, Response } from "express";
import { NotificationService } from "../services/notificationService";
import { AppointmentService } from "../services/appointmentService";

export class NotificationController {
  private notificationService: NotificationService;
  private appointmentService: AppointmentService;

  constructor() {
    this.notificationService = new NotificationService();
    this.appointmentService = new AppointmentService();
  }

  // Agendar lembretes para um agendamento
  scheduleReminders = async (req: Request, res: Response): Promise<void> => {
    try {
      const { appointmentId } = req.params;
      const { email, phone, pushToken, enabledTypes } = req.body;

      const appointment = await this.appointmentService.getAppointmentById(appointmentId);
      
      if (!appointment) {
        res.status(404).json({
          success: false,
          message: "Agendamento não encontrado"
        });
        return;
      }

      await this.notificationService.scheduleReminders(appointment, {
        email,
        phone,
        pushToken,
        enabledTypes: enabledTypes || ['email']
      });

      res.status(200).json({
        success: true,
        message: "Lembretes agendados com sucesso"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  };

  // Enviar notificação imediata
  sendNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { appointmentId } = req.params;
      const { templateName, recipient, type } = req.body;

      const appointment = await this.appointmentService.getAppointmentById(appointmentId);
      
      if (!appointment) {
        res.status(404).json({
          success: false,
          message: "Agendamento não encontrado"
        });
        return;
      }

      const result = await this.notificationService.sendImmediateNotification(
        appointment,
        templateName,
        recipient,
        type
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Notificação enviada com sucesso"
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  };

  // Processar fila de notificações (endpoint para cron job)
  processQueue = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.notificationService.processNotificationQueue();

      res.status(200).json({
        success: true,
        message: "Fila processada com sucesso",
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  };
}