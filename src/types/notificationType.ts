export interface AppNotificationn {
  _id?: string;
  appointmentId: string;
  userId: string;
  type: string;
  status: string;
  scheduledFor: Date;
  template: string;
  recipient: any;
  content: {
    subject?: string;
    message: string;
  };
  retryCount: number;
  maxRetries: number;
}