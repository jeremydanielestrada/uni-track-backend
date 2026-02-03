import { eq, and } from "drizzle-orm";
import { db } from "../index";
import { studentsTable, eventsTable } from "../db/schema";
import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middleware/auth-middleware";
import { isAssigned } from "../models/student";
import csv from "csv-parser";
import xlsx from "xlsx";
import { Readable } from "stream";

export const getStudentsByEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.governor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { event_id } = req.params;

    if (!event_id || Array.isArray(event_id)) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const eventIdInt = parseInt(event_id, 10);

    if (isNaN(eventIdInt)) {
      return res.status(400).json({ message: "Invalid Event ID" });
    }

    const students = await db
      .select()
      .from(studentsTable)
      .where(
        and(
          eq(studentsTable.event_id, eventIdInt),
          eq(studentsTable.assigned_by, req.governor.id),
        ),
      );

    return res.json({ students: students });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching students" });
  }
};

export const uploadStudents = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.governor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { event_id } = req.params;
    if (!event_id || Array.isArray(event_id)) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const eventIdInt = parseInt(event_id, 10);

    if (isNaN(eventIdInt)) {
      return res.status(400).json({ message: "Invalid Event ID" });
    }

    const students: any[] = [];
    const fileExtension = req.file.originalname.split(".").pop()?.toLowerCase();

    if (fileExtension === "csv") {
      // Parse CSV
      const stream = Readable.from(req.file.buffer.toString());
      await new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on("data", (row) => students.push(row))
          .on("end", resolve)
          .on("error", reject);
      });
    } else if (fileExtension === "xlsx" || fileExtension === "xls") {
      // Parse Excel
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName!];
      students.push(...xlsx.utils.sheet_to_json(sheet!));
    } else {
      return res.status(400).json({ message: "Invalid file format" });
    }

    const existingStudents = await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.event_id, eventIdInt));

    const existingIds = new Set(existingStudents.map((s) => s.id_num));

    const newStudents = students.filter(
      (student) => !existingIds.has(student.id_num),
    );

    if (newStudents.length === 0) {
      return res.status(400).json({ message: "All students already exist" });
    }

    // Insert students into database
    const insertedStudents = await db
      .insert(studentsTable)
      .values(
        newStudents.map((student) => ({
          id_num: student.id_num,
          name: student.name,
          program: student.program,
          event_id: eventIdInt,
          assigned_by: req.governor!.id,
          is_assigned: false,
          hours_render: 0,
        })),
      )
      .returning();

    return res.status(201).json({
      message: `${insertedStudents.length} students uploaded successfully`,
      students: insertedStudents,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error uploading students" });
  }
};

export const assignStudent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.governor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // First, get the current student
    const currentStudent = await db
      .select()
      .from(studentsTable)
      .where(
        and(
          eq(studentsTable.id_num, req.body.id_num),
          eq(studentsTable.event_id, req.body.event_id),
        ),
      )
      .limit(1);

    if (!currentStudent || currentStudent.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Toggle the is_assigned status
    const updatedStudent = await db
      .update(studentsTable)
      .set({ is_assigned: !currentStudent[0]?.is_assigned })
      .where(
        and(
          eq(studentsTable.id_num, req.body.id_num),
          eq(studentsTable.event_id, req.body.event_id),
        ),
      )
      .returning();

    const action = updatedStudent[0]?.is_assigned ? "assigned" : "unassigned";
    return res.json({
      message: `Student ${action} successfully`,
      student: updatedStudent[0],
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating student assignment" });
  }
};

export const authorizedStudent = async (req: any, res: Response) => {
  try {
    const { id_num, event_code } = req.body;
    if (!id_num || !event_code) {
      return res
        .status(400)
        .json({ message: "ID number and event code are required" });
    }

    // Query student with their event
    const studentWithEvent = await db.query.studentsTable.findFirst({
      where: eq(studentsTable.id_num, id_num),
      with: {
        event: true,
      },
    });

    if (!studentWithEvent) {
      return res.status(404).json({ message: "Student not found" });
    }
    // Check if student is assigned
    if (!studentWithEvent.is_assigned) {
      return res.status(403).json({
        message: "Student is not assigned to any event",
        authorized: false,
      });
    }

    // Check if student has an event
    if (!studentWithEvent.event) {
      return res.status(403).json({
        message: "Student has no event assigned",
        authorized: false,
      });
    }

    // Check if event code matches
    if (studentWithEvent.event.event_code !== event_code) {
      return res.status(403).json({
        message: "Student not authorized for this event",
        authorized: false,
      });
    }

    // Student is authorized
    return res.json({
      message: "Student authorized",
      authorized: true,
      student: {
        id_num: studentWithEvent.id_num,
        name: studentWithEvent.name,
        program: studentWithEvent.program,
      },
      event: {
        id: studentWithEvent.event.id,
        name: studentWithEvent.event.name,
        event_code: studentWithEvent.event.event_code,
        date: studentWithEvent.event.date,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error checking student assignment" });
  }
};
