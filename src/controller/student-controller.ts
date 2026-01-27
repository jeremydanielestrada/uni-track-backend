import { eq, and } from "drizzle-orm";
import { db } from "../index";
import { studentsTable } from "../db/schema";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth-middleware";
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

    return res.json(students);
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
