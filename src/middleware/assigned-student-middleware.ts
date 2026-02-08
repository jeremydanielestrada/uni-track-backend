import type { Request, Response, NextFunction } from "express";
import { isAssigned } from "../models/student.js";

export interface StudentRequest extends Request {
  assigned_student?: {
    id_num: string;
  };
}

export const authorize = async (
  req: StudentRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const assigned = await isAssigned(req.body.id_num);

    if (!assigned) {
      return res.status(401).json({ message: "Student not assigned" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Student not assigned" });
  }
};
