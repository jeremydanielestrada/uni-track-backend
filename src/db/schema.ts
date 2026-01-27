import {
  pgTable,
  varchar,
  text,
  uuid,
  boolean,
  integer,
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
  hours_render: integer().default(0),
  event_id: integer().references(() => eventsTable.id),
  assigned_by: integer().references(() => governorsTable.id),
  is_assigned: boolean().default(false),
});

//Define Relations
export const governorsRelations = relations(governorsTable, ({ many }) => ({
  events: many(eventsTable),
  students: many(studentsTable),
}));

export const eventsRelations = relations(eventsTable, ({ one, many }) => ({
  students: many(studentsTable),
  governor: one(governorsTable, {
    fields: [eventsTable.gov_id],
    references: [governorsTable.id],
  }),
}));

export const studentsRelation = relations(studentsTable, ({ one }) => ({
  event: one(eventsTable, {
    fields: [studentsTable.event_id],
    references: [eventsTable.id],
  }),

  assingedBy: one(governorsTable, {
    fields: [studentsTable.assigned_by],
    references: [governorsTable.id],
  }),
}));
