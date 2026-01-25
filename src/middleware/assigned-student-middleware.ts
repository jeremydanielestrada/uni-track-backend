import type { Request, Response, NextFunction } from "express";
import { isAssigned } from "../models/student";

export const authorize = (req: Request, res: Response, next: NextFunction) => {
  try {
    const assigned = isAssigned(req.body.id_num);

    if (!assigned) {
      return res.status(401).json({ message: "Student not assigned" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Student not assigned" });
  }
};
