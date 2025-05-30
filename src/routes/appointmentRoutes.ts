import { Router } from "express";
import { AppointmentController } from "../controllers/appointmentController";

const router = Router();
const appointmentController = new AppointmentController();

// Rotas para agendamentos
router.post("/", appointmentController.createAppointment);
router.get("/", appointmentController.getAppointments);
router.get("/range", appointmentController.getAppointmentsByDateRange);
router.get("/:id", appointmentController.getAppointmentById);
router.put("/:id", appointmentController.updateAppointment);
router.patch("/:id/cancel", appointmentController.cancelAppointment);
router.patch("/:id/complete", appointmentController.completeAppointment);
router.delete("/:id", appointmentController.deleteAppointment);

export { router as appointmentRoutes };