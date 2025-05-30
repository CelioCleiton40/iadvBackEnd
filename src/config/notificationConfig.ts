export interface NotificationTemplate {
  subject?: string;
  message: string;
  variables: string[];
}

export const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  APPOINTMENT_REMINDER_24H: {
    subject: "Lembrete: Agendamento amanhã",
    message: `Olá {{clientName}}, 

Lembramos que você tem um agendamento marcado para amanhã:

📅 Data: {{date}}
🕐 Horário: {{time}}
📋 Tipo: {{type}}
📝 Título: {{title}}

${process.env.NODE_ENV === 'production' ? 'Por favor, confirme sua presença ou entre em contato caso precise remarcar.' : ''}

Atenciosamente,
Equipe de Agendamentos`,
    variables: ['clientName', 'date', 'time', 'type', 'title']
  },
  
  APPOINTMENT_REMINDER_2H: {
    subject: "Lembrete: Seu agendamento é em 2 horas",
    message: `Olá {{clientName}}, 

Seu agendamento será em 2 horas:

🕐 Horário: {{time}}
📋 {{title}}

Não se esqueça!`,
    variables: ['clientName', 'time', 'title']
  },
  
  APPOINTMENT_CONFIRMATION: {
    subject: "Agendamento Confirmado",
    message: `Olá {{clientName}}, 

Seu agendamento foi confirmado com sucesso:

📅 Data: {{date}}
🕐 Horário: {{time}}
📋 Tipo: {{type}}
📝 Título: {{title}}

Até lá!`,
    variables: ['clientName', 'date', 'time', 'type', 'title']
  },
  
  APPOINTMENT_CANCELLED: {
    subject: "Agendamento Cancelado",
    message: `Olá {{clientName}}, 

Informamos que seu agendamento foi cancelado:

📅 Data: {{date}}
🕐 Horário: {{time}}
📝 Título: {{title}}

Entre em contato conosco se precisar reagendar.`,
    variables: ['clientName', 'date', 'time', 'title']
  }
};

export const NOTIFICATION_SETTINGS = {
  REMINDER_INTERVALS: [
    { hours: 24, template: 'APPOINTMENT_REMINDER_24H' },
    { hours: 2, template: 'APPOINTMENT_REMINDER_2H' }
  ],
  MAX_RETRIES: 3,
  RETRY_DELAY_MINUTES: [5, 15, 60], // 5min, 15min, 1h
};