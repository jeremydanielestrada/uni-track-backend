import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { governorsTable } from "../db/schema.js";

export interface AuthRequest extends Request {
  governor?: {
    id: number;
    id_num: string;
    name: string;
    college_dep: string;
  };
}

interface Governor {
  id: number;
  id_num: string;
  name: string;
  college_dep: string;
}
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const governor: Governor[] = await db
      .select()
      .from(governorsTable)
      .where(eq(governorsTable.id, decoded.id));

    if (!governor || governor.length === 0) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.governor = governor[0]!;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
