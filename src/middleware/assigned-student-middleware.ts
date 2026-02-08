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
    const { id_num } = req.body;

    if (!id_num) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const assigned = await isAssigned(id_num);

    if (!assigned) {
      return res.status(401).json({ message: "Student not assigned" });
    }

    // Set the assigned student in the request
    req.assigned_student = {
      id_num: id_num,
    };

    next();
  } catch (error) {
    console.error("Authorization error:", error);
    return res.status(401).json({ message: "Student not assigned" });
  }
};
