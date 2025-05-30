import { Collection, ObjectId } from "mongodb";
import { connectToDatabase } from "../config/dataBase";
import { Notification, NotificationInput } from "../models/dashboard/notificationModel";

export class NotificationRepository {
  private collection: Collection<Notification>;

  constructor() {
    this.initializeCollection();
  }

  private async initializeCollection() {
    const db = await connectToDatabase();
    this.collection = db.collection<Notification>("notifications");
    
    // Criar índices para performance
    await this.collection.createIndex({ appointmentId: 1 });
    await this.collection.createIndex({ scheduledFor: 1, status: 1 });
    await this.collection.createIndex({ userId: 1 });
  }

  private async getCollection(): Promise<Collection<Notification>> {
    if (!this.collection) {
      await this.initializeCollection();
    }
    return this.collection;
  }

  async create(notificationData: NotificationInput): Promise<Notification> {
    const collection = await this.getCollection();
    const now = new Date();
    
    const notification: Omit<Notification, '_id'> = {
      ...notificationData,
      scheduledFor: new Date(notificationData.scheduledFor),
      createdAt: now,
      updatedAt: now,
      retryCount: 0
    };

    const result = await collection.insertOne(notification as Notification);
    
    return {
      _id: result.insertedId,
      ...notification
    };
  }

  async findPendingNotifications(limit: number = 50): Promise<Notification[]> {
    const collection = await this.getCollection();
    const now = new Date();
    
    return await collection.find({
      status: 'pending',
      scheduledFor: { $lte: now },
      retryCount: { $lt: 3 }
    })
    .sort({ scheduledFor: 1 })
    .limit(limit)
    .toArray();
  }

  async findByAppointmentId(appointmentId: string): Promise<Notification[]> {
    const collection = await this.getCollection();
    return await collection.find({ appointmentId }).toArray();
  }

  async updateStatus(
    id: string, 
    status: Notification['status'], 
    errorMessage?: string
  ): Promise<Notification | null> {
    const collection = await this.getCollection();
    
    if (!ObjectId.isValid(id)) return null;

    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === 'sent') {
      updateData.sentAt = new Date();
    }

    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    return result;
  }

  async incrementRetryCount(id: string): Promise<Notification | null> {
    const collection = await this.getCollection();
    
    if (!ObjectId.isValid(id)) return null;

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $inc: { retryCount: 1 },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );

    return result;
  }

  async cancelByAppointmentId(appointmentId: string): Promise<number> {
    const collection = await this.getCollection();
    
    const result = await collection.updateMany(
      { 
        appointmentId,
        status: 'pending'
      },
      { 
        $set: { 
          status: 'cancelled',
          updatedAt: new Date()
        }
      }
    );

    return result.modifiedCount;
  }
}