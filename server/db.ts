import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load .env from project root
dotenv.config({ path: path.join(__dirname, "..", ".env") });

console.log("DATABASE_URL:", process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision the database?");
}

import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { drizzle } from "drizzle-orm/neon-serverless"; 
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });