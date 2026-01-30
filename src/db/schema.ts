import {
  pgTable,
  varchar,
  text,
  uuid,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const governorsTable = pgTable("governors", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  id_num: varchar({ length: 255 }).unique().notNull(),
  name: varchar({ length: 255 }).notNull(),
  college_dep: text().notNull(),
  password: varchar({ length: 255 }).notNull(),
});

export const eventsTable = pgTable("events", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  event_code: uuid().defaultRandom(),
  gov_id: integer().references(() => governorsTable.id),
  name: varchar({ length: 255 }).notNull(),
  date: varchar({ length: 255 }).notNull(),
});

export const studentsTable = pgTable("students", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  id_num: varchar({ length: 255 }).unique().notNull(),
  program: text().notNull(),
  name: varchar({ length: 255 }).notNull(),
  event_id: integer().references(() => eventsTable.id, { onDelete: "cascade" }),
  assigned_by: integer().references(() => governorsTable.id),
  is_assigned: boolean().default(false),
});

export const attendanceLogs = pgTable("attendance_logs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  student_id: integer().references(() => studentsTable.id),
  event_id: integer().references(() => eventsTable.id),
  time_in: timestamp("time_in", { withTimezone: true }).notNull(),
  time_out: timestamp("time_out", { withTimezone: true }),
});

//Define Relations
export const governorsRelations = relations(governorsTable, ({ many }) => ({
  events: many(eventsTable),
  students: many(studentsTable),
}));

export const eventsRelations = relations(eventsTable, ({ one, many }) => ({
  students: many(studentsTable),
  attendanceLogs: many(attendanceLogs),
  governor: one(governorsTable, {
    fields: [eventsTable.gov_id],
    references: [governorsTable.id],
  }),
}));

export const studentsRelation = relations(studentsTable, ({ one, many }) => ({
  attendanceLogs: many(attendanceLogs),
  event: one(eventsTable, {
    fields: [studentsTable.event_id],
    references: [eventsTable.id],
  }),

  assingedBy: one(governorsTable, {
    fields: [studentsTable.assigned_by],
    references: [governorsTable.id],
  }),
}));

export const attendanceLogsRelation = relations(attendanceLogs, ({ one }) => ({
  student: one(studentsTable, {
    fields: [attendanceLogs.student_id],
    references: [studentsTable.id],
  }),
  event: one(eventsTable, {
    fields: [attendanceLogs.event_id],
    references: [eventsTable.id],
  }),
}));
