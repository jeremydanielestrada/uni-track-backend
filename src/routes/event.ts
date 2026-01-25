import {
  getAllEventsByCurrentAuthenticatedGovernor,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controller/event-controller";

import express from "express";
import { authenticate } from "../middleware/auth-middleware";

export const eventRouter = express.Router();

eventRouter.get(
  "/get",
  authenticate,
  getAllEventsByCurrentAuthenticatedGovernor,
);

eventRouter.post("/create", authenticate, createEvent);

eventRouter.put("/update/:id", authenticate, updateEvent);

eventRouter.delete("/delete/:id", authenticate, deleteEvent);
