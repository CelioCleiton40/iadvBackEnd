import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined. Please check your .env file.');
}

const client = new MongoClient(DATABASE_URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
});

let isConnected = false;

async function connectToDatabase() {
  if (!isConnected) {
    try {
      await client.connect();
      isConnected = true;
      console.log('Conexão bem-sucedida com o MongoDB!');
    } catch (error) {
      console.error('Erro ao conectar ao MongoDB:', error);
      throw error;
    }
  }
  return client.db();
}

async function disconnectFromDatabase() {
  try {
    await client.close();
    isConnected = false;
    console.log('Desconectado do MongoDB.');
  } catch (error) {
    console.error('Erro ao desconectar do MongoDB:', error);
    throw error;
  }
}

export { client, connectToDatabase, disconnectFromDatabase };
