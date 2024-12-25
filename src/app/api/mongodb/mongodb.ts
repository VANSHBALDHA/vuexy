import { MongoClient, Db } from 'mongodb';

const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'vuexy';

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Connect to MongoDB and cache the connection.
 */
export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  if (!uri || !dbName) {
    throw new Error('Please define MONGODB_URI and MONGODB_DB in your .env.local file');
  }

  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }

  db = client.db(dbName);
  return db;
}

/**
 * Close the MongoDB client connection. Use only when needed explicitly.
 */
export async function closeConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
