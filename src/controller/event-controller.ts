import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth-middleware";
import { eq, and } from "drizzle-orm";
import { db } from "../index";
import { eventsTable } from "../db/schema";

export const getAllEventsByCurrentAuthenticatedGovernor = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (!req.governor) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const events = await db.query.eventsTable.findMany({
      where: eq(eventsTable.gov_id, req.governor.id),
      with: {
        students: true,
      },
    });

    if (events.length === 0) {
      return res
        .status(404)
        .json({ message: "No events found for this governor" });
    }

    return res.json({ events: events });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching events" });
  }
};

export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.governor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, date } = req.body;

    const event = await db
      .insert(eventsTable)
      .values({
        name,
        date,
        gov_id: req.governor.id,
      })
      .returning();

    return res.status(201).json(event[0]);
  } catch (error) {
    return res.status(500).json({ message: "Error creating event" });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.governor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const { name, date } = req.body;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    if (!name || !date) {
      return res.status(400).json({ message: "Name and date are required" });
    }

    const intId = parseInt(id, 10);

    const event = await db
      .update(eventsTable)
      .set({
        name,
        date,
      })
      .where(
        and(eq(eventsTable.id, intId), eq(eventsTable.gov_id, req.governor.id)),
      )
      .returning();

    if (event.length === 0) {
      return res
        .status(404)
        .json({ message: "Event not found or unauthorized" });
    }

    return res.json(event[0]);
  } catch (error) {
    return res.status(500).json({ message: "Error updating event" });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.governor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const intId = parseInt(id, 10);

    await db
      .delete(eventsTable)
      .where(
        and(eq(eventsTable.id, intId), eq(eventsTable.gov_id, req.governor.id)),
      );

    return res.json({ message: "Event deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting event" });
  }
};
