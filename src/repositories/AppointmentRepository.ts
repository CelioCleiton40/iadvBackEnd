import { Collection, ObjectId } from "mongodb";
import { connectToDatabase } from "../config/dataBase";
import { Appointment, AppointmentInput } from "../models/dashboard/appointmentModel";

export class AppointmentRepository {
  private collection: Collection<Appointment>;

  constructor() {
    this.initializeCollection();
  }

  private async initializeCollection() {
    const db = await connectToDatabase();
    this.collection = db.collection<Appointment>("appointments");
  }

  private async getCollection(): Promise<Collection<Appointment>> {
    if (!this.collection) {
      await this.initializeCollection();
    }
    return this.collection;
  }

  async create(appointmentData: AppointmentInput): Promise<Appointment> {
    const collection = await this.getCollection();
    const now = new Date();
    
    const appointment: Omit<Appointment, '_id'> = {
      ...appointmentData,
      createdAt: now,
      updatedAt: now,
      status: 'scheduled'
    };

    const result = await collection.insertOne(appointment as Appointment);
    
    return {
      _id: result.insertedId,
      ...appointment
    };
  }

  async findAll(filters?: {
    date?: string;
    client?: string;
    status?: string;
    type?: string;
  }): Promise<Appointment[]> {
    const collection = await this.getCollection();
    const query: any = {};

    if (filters) {
      if (filters.date) query.date = filters.date;
      if (filters.client) query.client = { $regex: filters.client, $options: 'i' };
      if (filters.status) query.status = filters.status;
      if (filters.type) query.type = filters.type;
    }

    return await collection.find(query).sort({ date: 1, time: 1 }).toArray();
  }

  async findById(id: string): Promise<Appointment | null> {
    const collection = await this.getCollection();
    
    if (!ObjectId.isValid(id)) {
      return null;
    }

    return await collection.findOne({ _id: new ObjectId(id) });
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
    const collection = await this.getCollection();
    
    return await collection.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1, time: 1 }).toArray();
  }

  async update(id: string, updateData: Partial<AppointmentInput>): Promise<Appointment | null> {
    const collection = await this.getCollection();
    
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );

    return result;
  }

  async updateStatus(id: string, status: Appointment['status']): Promise<Appointment | null> {
    const collection = await this.getCollection();
    
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status, 
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );

    return result;
  }

  async delete(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    
    if (!ObjectId.isValid(id)) {
      return false;
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  async checkConflict(date: string, time: string, excludeId?: string): Promise<boolean> {
    const collection = await this.getCollection();
    const query: any = { 
      date, 
      time, 
      status: { $ne: 'cancelled' } 
    };

    if (excludeId && ObjectId.isValid(excludeId)) {
      query._id = { $ne: new ObjectId(excludeId) };
    }

    const existingAppointment = await collection.findOne(query);
    return !!existingAppointment;
  }
}