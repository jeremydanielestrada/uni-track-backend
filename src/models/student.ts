import { eq, and } from "drizzle-orm";
import { db } from "../index.js";
import { studentsTable } from "../db/schema.js";

export const isAssigned = async (student_id: string) => {
  const student = await db
    .select()
    .from(studentsTable)
    .where(
      and(
        eq(studentsTable.is_assigned, true),
        eq(studentsTable.id_num, student_id),
      ),
    )
    .limit(1);

  return student[0]?.is_assigned;
};
