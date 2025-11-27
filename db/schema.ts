import { text, integer, pgTable, timestamp, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const branches = pgTable('branches', {
  id: text('id').primaryKey(),
  branch_name: text('branch_name').notNull().unique(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at')
});

export const students = pgTable('students', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  phone: text('phone'),
  branch_id: text('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
  semester: integer('semester'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at')
});

export const rooms = pgTable('rooms', {
  id: text('id').primaryKey(),
  rows: integer('rows').notNull(),
  cols: integer('cols').notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at')
});

export const subjects = pgTable('subjects', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at')
});

export const seatingPlans = pgTable('seating_plans', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  exam_date: text('exam_date'),
  description: text('description'),
  allocation_data: text('allocation_data').notNull(), // JSON stored as text
  total_students: integer('total_students').notNull().default(0),
  total_rooms: integer('total_rooms').notNull().default(0),
  data_source: text('data_source').notNull().default('existing'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at')
});

