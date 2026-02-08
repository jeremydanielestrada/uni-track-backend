import express from "express";
import {
  uploadStudents,
  getStudentsByEvent,
  authorizedStudent,
  assignStudent,
  scanStudenQr,
} from "../controller/student-controller.js";
import { uploadMiddleware } from "../middleware/student-middlware.js";
import { authenticate } from "../middleware/auth-middleware.js";
import { authorize } from "../middleware/assigned-student-middleware.js";

export const studentRouter = express.Router();

studentRouter.get("/get/:event_id/students", authenticate, getStudentsByEvent);

studentRouter.post(
  "/upload/:event_id",
  authenticate,
  uploadMiddleware,
  uploadStudents,
);

studentRouter.put("/assign", authenticate, assignStudent);

studentRouter.post("/authorize", authorizedStudent);

studentRouter.post("/scan", scanStudenQr);
