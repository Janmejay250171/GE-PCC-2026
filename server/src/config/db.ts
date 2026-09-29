import mongoose from 'mongoose';
import { config } from './env.js';

let mongodInstance: any = null;

export async function connectDB(): Promise<typeof mongoose> {
  const isAtlas = config.mongodbUri.includes('mongodb+srv://') || config.mongodbUri.includes('@');
  if (isAtlas) {
    console.log('[Database] Connecting to MongoDB Atlas cluster...');
  } else {
    console.log(`[Database] Connecting to MongoDB at ${config.mongodbUri}...`);
  }

  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 10000
    });
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error: any) {
    console.warn(`[Database] Configured MongoDB (${config.mongodbUri.replace(/:[^:@]+@/, ':***@')}) not reachable: ${error.message}`);
    console.warn('[Database] Starting fallback in-memory MongoDB for local execution...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const uri = mongodInstance.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`[Database] Fallback embedded MongoDB connected successfully at ${uri}`);
      return conn;
    } catch (memError) {
      console.error('[Database] Failed to initialize embedded MongoDB:', memError);
      throw error;
    }
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
}

