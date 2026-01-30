import express from "express";
import {
  uploadStudents,
  getStudentsByEvent,
} from "../controller/student-controller";
import { uploadMiddleware } from "../middleware/student-middlware";
import { authenticate } from "../middleware/auth-middleware";

export const studentRouter = express.Router();

studentRouter.get("/get/:event_id/students", authenticate, getStudentsByEvent);

studentRouter.post(
  "/upload/:event_id",
  authenticate,
  uploadMiddleware,
  uploadStudents,
);
