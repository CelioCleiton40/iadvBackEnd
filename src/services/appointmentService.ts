import { AppointmentRepository } from "../repositories/AppointmentRepository";
import { Appointment, AppointmentInput, appointmentSchema } from "../models/dashboard/appointmentModel";

export class AppointmentService {
  private appointmentRepository: AppointmentRepository;

  constructor() {
    this.appointmentRepository = new AppointmentRepository();
  }

  async createAppointment(appointmentData: AppointmentInput): Promise<{
    success: boolean;
    data?: Appointment;
    error?: string;
  }> {
    try {
      // Validar dados de entrada
      const validatedData = appointmentSchema.parse(appointmentData);

      // Verificar conflito de horário
      const hasConflict = await this.appointmentRepository.checkConflict(
        validatedData.date,
        validatedData.time
      );

      if (hasConflict) {
        return {
          success: false,
          error: "Já existe um agendamento para este horário"
        };
      }

      // Validar data e hora
      const dateTimeValidation = this.validateDateTime(validatedData.date, validatedData.time);
      if (!dateTimeValidation.valid) {
        return {
          success: false,
          error: dateTimeValidation.error
        };
      }

      const appointment = await this.appointmentRepository.create(validatedData);

      return {
        success: true,
        data: appointment
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao criar agendamento"
      };
    }
  }

  async getAppointments(filters?: {
    date?: string;
    client?: string;
    status?: string;
    type?: string;
  }): Promise<Appointment[]> {
    return await this.appointmentRepository.findAll(filters);
  }

  async getAppointmentById(id: string): Promise<Appointment | null> {
    return await this.appointmentRepository.findById(id);
  }

  async getAppointmentsByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
    return await this.appointmentRepository.findByDateRange(startDate, endDate);
  }

  async updateAppointment(id: string, updateData: Partial<AppointmentInput>): Promise<{
    success: boolean;
    data?: Appointment;
    error?: string;
  }> {
    try {
      // Verificar se o agendamento existe
      const existingAppointment = await this.appointmentRepository.findById(id);
      if (!existingAppointment) {
        return {
          success: false,
          error: "Agendamento não encontrado"
        };
      }

      // Validar dados parciais se fornecidos
      if (updateData.date || updateData.time) {
        const date = updateData.date || existingAppointment.date;
        const time = updateData.time || existingAppointment.time;

        // Verificar conflito de horário (excluindo o próprio agendamento)
        const hasConflict = await this.appointmentRepository.checkConflict(date, time, id);
        if (hasConflict) {
          return {
            success: false,
            error: "Já existe um agendamento para este horário"
          };
        }

        // Validar nova data e hora
        const dateTimeValidation = this.validateDateTime(date, time);
        if (!dateTimeValidation.valid) {
          return {
            success: false,
            error: dateTimeValidation.error
          };
        }
      }

      const updatedAppointment = await this.appointmentRepository.update(id, updateData);

      return {
        success: true,
        data: updatedAppointment!
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao atualizar agendamento"
      };
    }
  }

  async cancelAppointment(id: string): Promise<{
    success: boolean;
    data?: Appointment;
    error?: string;
  }> {
    try {
      const appointment = await this.appointmentRepository.updateStatus(id, 'cancelled');
      
      if (!appointment) {
        return {
          success: false,
          error: "Agendamento não encontrado"
        };
      }

      return {
        success: true,
        data: appointment
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao cancelar agendamento"
      };
    }
  }

  async completeAppointment(id: string): Promise<{
    success: boolean;
    data?: Appointment;
    error?: string;
  }> {
    try {
      const appointment = await this.appointmentRepository.updateStatus(id, 'completed');
      
      if (!appointment) {
        return {
          success: false,
          error: "Agendamento não encontrado"
        };
      }

      return {
        success: true,
        data: appointment
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao completar agendamento"
      };
    }
  }

  async deleteAppointment(id: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const deleted = await this.appointmentRepository.delete(id);
      
      if (!deleted) {
        return {
          success: false,
          error: "Agendamento não encontrado"
        };
      }

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao deletar agendamento"
      };
    }
  }

  private validateDateTime(date: string, time: string): { valid: boolean; error?: string } {
    // Validar formato da data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return { valid: false, error: "Formato de data inválido. Use YYYY-MM-DD" };
    }

    // Validar formato da hora (HH:MM)
    const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(time)) {
      return { valid: false, error: "Formato de hora inválido. Use HH:MM" };
    }

    // Verificar se a data não é no passado
    const appointmentDate = new Date(`${date}T${time}`);
    const now = new Date();
    
    if (appointmentDate < now) {
      return { valid: false, error: "Não é possível agendar para datas/horários passados" };
    }

    return { valid: true };
  }
}