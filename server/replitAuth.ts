// server/replitAuth.ts (auth fully removed for local/dev)
import type { Express, Request, Response, NextFunction } from "express";

export async function setupAuth(_app: Express) {
  return; // no-op
}

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => next();