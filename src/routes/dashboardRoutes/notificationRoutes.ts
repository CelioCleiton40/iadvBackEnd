import { Router } from "express";
import { NotificationController } from "../../controllers/dashboardController/notificationController";

const router = Router();
const notificationController = new NotificationController();

// Agendar lembretes para um agendamento
router.post("/appointments/:appointmentId/reminders", notificationController.scheduleReminders);

// Enviar notificação imediata
router.post("/appointments/:appointmentId/notify", notificationController.sendNotification);

// Processar fila (para cron jobs)
router.post("/process-queue", notificationController.processQueue);

export { router as notificationRoutes };