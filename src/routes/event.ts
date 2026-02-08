import {
  getAllEventsByCurrentAuthenticatedGovernor,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controller/event-controller.js";

import express from "express";
import { authenticate } from "../middleware/auth-middleware.js";

export const eventRouter = express.Router();

eventRouter.get(
  "/get",
  authenticate,
  getAllEventsByCurrentAuthenticatedGovernor,
);

eventRouter.post("/create", authenticate, createEvent);

eventRouter.put("/update/:id", authenticate, updateEvent);

eventRouter.delete("/delete/:id", authenticate, deleteEvent);
