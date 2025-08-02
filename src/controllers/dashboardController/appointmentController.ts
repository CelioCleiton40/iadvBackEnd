import { Request, Response } from "express";
import { AppointmentService } from "../../services/dashboard/appointmentService";

export class AppointmentController {
  private appointmentService: AppointmentService;

  constructor() {
    this.appointmentService = new AppointmentService();
  }

  // Criar agendamento
  createAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.appointmentService.createAppointment(req.body);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: "Agendamento criado com sucesso",
          data: result.data
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

  // Listar agendamentos
  getAppointments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { date, client, status, type } = req.query;
      
      const filters = {
        date: date as string,
        client: client as string,
        status: status as string,
        type: type as string
      };

      // Remover filtros vazios
      Object.keys(filters).forEach(key => {
        if (!filters[key as keyof typeof filters]) {
          delete filters[key as keyof typeof filters];
        }
      });

      const appointments = await this.appointmentService.getAppointments(
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.status(200).json({
        success: true,
        data: appointments,
        count: appointments.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  };

  // Obter agendamento por ID
  getAppointmentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const appointment = await this.appointmentService.getAppointmentById(id);

      if (!appointment) {
        res.status(404).json({
          success: false,
          message: "Agendamento não encontrado"
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: appointment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  };

  // Obter agendamentos por período
  getAppointmentsByDateRange = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: "startDate e endDate são obrigatórios"
        });
        return;
      }

      const appointments = await this.appointmentService.getAppointmentsByDateRange(
        startDate as string,
        endDate as string
      );

      res.status(200).json({
        success: true,
        data: appointments,
        count: appointments.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  };

  // Atualizar agendamento
  updateAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.appointmentService.updateAppointment(id, req.body);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Agendamento atualizado com sucesso",
          data: result.data
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

  // Cancelar agendamento
  cancelAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.appointmentService.cancelAppointment(id);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Agendamento cancelado com sucesso",
          data: result.data
        });
      } else {
        res.status(404).json({
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

  // Completar agendamento
  completeAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.appointmentService.completeAppointment(id);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Agendamento marcado como concluído",
          data: result.data
        });
      } else {
        res.status(404).json({
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

  // Deletar agendamento
  deleteAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.appointmentService.deleteAppointment(id);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Agendamento deletado com sucesso"
        });
      } else {
        res.status(404).json({
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
}