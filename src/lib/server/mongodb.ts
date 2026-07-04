import { MongoClient, type Db } from "mongodb"

import { getOptionalEnv, getRequiredEnv } from "@/lib/server/env"

const globalForMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>
}

export async function getMongoDatabase(): Promise<Db> {
  const client = await getMongoClient()

  return client.db(getOptionalEnv("MONGODB_DB", "vision_cafe"))
}

export async function closeMongoConnectionForTests() {
  const clientPromise = globalForMongo.mongoClientPromise

  if (!clientPromise) {
    return
  }

  const client = await clientPromise

  await client.close()
  globalForMongo.mongoClientPromise = undefined
}

async function getMongoClient() {
  if (!globalForMongo.mongoClientPromise) {
    const uri = getRequiredEnv("MONGODB_URI")
    const client = new MongoClient(uri)

    globalForMongo.mongoClientPromise = client.connect()
  }

  return globalForMongo.mongoClientPromise
}
