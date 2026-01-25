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
    const events = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.gov_id, req.governor.id_num));

    if (events.length === 0) {
      return res
        .status(404)
        .json({ message: "No events found for this governor" });
    }

    return res.json(events);
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
        gov_id: req.governor.id_num,
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

    if (!id) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    if (!name || !date) {
      return res.status(400).json({ message: "Name and date are required" });
    }

    const event = await db
      .update(eventsTable)
      .set({
        name,
        date,
      })
      .where(
        and(
          eq(eventsTable.id, id as string),
          eq(eventsTable.gov_id, req.governor.id_num),
        ),
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

    if (!id) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    await db
      .delete(eventsTable)
      .where(
        and(
          eq(eventsTable.id, id as string),
          eq(eventsTable.gov_id, req.governor.id_num),
        ),
      );

    return res.json({ message: "Event deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting event" });
  }
};
