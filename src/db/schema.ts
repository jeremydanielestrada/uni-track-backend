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
  id_num: varchar({ length: 255 }).primaryKey().unique().notNull(),
  college_dep: text().notNull(),
  name: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
});

export const eventsTable = pgTable("events", {
  id: uuid().primaryKey().defaultRandom(),
  gov_id: varchar({ length: 255 })
    .notNull()
    .references(() => governorsTable.id_num),
  name: varchar({ length: 255 }).notNull(),
  date: varchar({ length: 255 }).notNull(),
});

export const studentsTable = pgTable("students", {
  id_num: varchar({ length: 255 }).primaryKey().unique().notNull(),
  program: text().notNull(),
  name: varchar({ length: 255 }).notNull(),
  hours_render: integer().default(0),
  event_id: uuid()
    .notNull()
    .references(() => eventsTable.id),
  assigned_by: varchar({ length: 255 })
    .notNull()
    .references(() => governorsTable.id_num),
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
    references: [governorsTable.id_num],
  }),
}));

export const studentsRelation = relations(studentsTable, ({ one }) => ({
  event: one(eventsTable, {
    fields: [studentsTable.event_id],
    references: [eventsTable.id],
  }),

  assigendBy: one(governorsTable, {
    fields: [studentsTable.assigned_by],
    references: [governorsTable.id_num],
  }),
}));
