import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const journals = pgTable("journals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  mood: integer("mood").notNull(), // 1-5 scale (1: rough, 2: low, 3: okay, 4: good, 5: great)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const moods = pgTable("moods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(), // 1-5 scale
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mindfulnessSessions = pgTable("mindfulness_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  audioUrl: text("audio_url").notNull(),
  imageUrl: text("image_url").notNull(),
  duration: integer("duration").notNull(), // in seconds
  isPremium: boolean("is_premium").default(false).notNull(),
});

// Zod schemas for insert operations
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertJournalSchema = createInsertSchema(journals).pick({
  userId: true,
  title: true,
  content: true,
  mood: true,
});

export const insertMoodSchema = createInsertSchema(moods).pick({
  userId: true,
  rating: true,
  note: true,
});

export const insertMindfulnessSessionSchema = createInsertSchema(mindfulnessSessions).pick({
  title: true,
  description: true,
  audioUrl: true,
  imageUrl: true,
  duration: true,
  isPremium: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Journal = typeof journals.$inferSelect;
export type InsertJournal = z.infer<typeof insertJournalSchema>;

export type Mood = typeof moods.$inferSelect;
export type InsertMood = z.infer<typeof insertMoodSchema>;

export type MindfulnessSession = typeof mindfulnessSessions.$inferSelect;
export type InsertMindfulnessSession = z.infer<typeof insertMindfulnessSessionSchema>;
