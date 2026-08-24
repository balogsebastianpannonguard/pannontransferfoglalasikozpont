import { MongoClient, Db, Collection } from "mongodb";
import type { Document } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB || "pannontransferfoglalasikozpont";

if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(uri);
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getCollection<TSchema extends Document = Document>(name: string): Promise<Collection<TSchema>> {
  const { db } = await connectToDatabase();
  return db.collection<TSchema>(name);
}

export async function testDatabaseConnection() {
  try {
    const { db } = await connectToDatabase();
    await db.command({ ping: 1 });
    return { success: true, message: "Adatbázis kapcsolat rendben van." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Ismeretlen adatbázis hiba.",
    };
  }
}
