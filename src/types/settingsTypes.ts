/**
 * Interface para as configurações de notificações.
 */
export interface INotifications {
    email: boolean; // Habilitar/desabilitar notificações por email
    push: boolean; // Habilitar/desabilitar notificações push
    deadlineAlerts: boolean; // Habilitar/desabilitar alertas de prazos
    alertDaysBefore: number; // Número de dias antes para enviar alertas
  }
  
  /**
   * Interface para as configurações de aparência.
   */
  export interface IAppearance {
    theme: "light" | "dark" | "system"; // Tema escolhido pelo usuário
    compactMode: boolean; // Modo compacto habilitado/desabilitado
    animations: boolean; // Animações habilitadas/desabilitadas
  }
  
  /**
   * Interface para as configurações de privacidade.
   */
  export interface IPrivacy {
    twoFactorAuth: boolean; // Autenticação em duas etapas habilitada/desabilitada
    activityLog: boolean; // Registro de atividades habilitado/desabilitado
    dataSharing: boolean; // Compartilhamento de dados anônimos habilitado/desabilitado
  }
  
  /**
   * Interface principal para as configurações do usuário.
   */
  export interface IUserSettings {
    userId: string; // ID do usuário associado às configurações
    language: string; // Idioma do sistema (ex.: "pt-BR", "en", "es")
    timezone: string; // Fuso horário do usuário (ex.: "america-sp")
    notifications: INotifications; // Configurações de notificações
    appearance: IAppearance; // Configurações de aparência
    privacy: IPrivacy; // Configurações de privacidade
    createdAt?: Date; // Data de criação das configurações
    updatedAt?: Date; // Data da última atualização
  }