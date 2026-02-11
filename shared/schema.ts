import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  username: text("username").unique(), // Make optional
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const giveaways = pgTable("giveaways", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: text("status", { enum: ["pending", "completed", "failed"] }).default("pending").notNull(),
  config: jsonb("config").notNull(), // Stores url, mode, rules, etc.
  winners: jsonb("winners"), // Stores result
  accessToken: varchar("access_token").unique(), // Unique token for accessing giveaway
  createdAt: timestamp("created_at").defaultNow(),
});

export const ads = pgTable("ads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url").notNull(),
  active: boolean("active").default(true).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  impressions: integer("impressions").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  firstName: true,
  password: true,
  email: true,
});

export const insertGiveawaySchema = createInsertSchema(giveaways).pick({
  userId: true,
  scheduledFor: true,
  status: true,
  config: true,
});

export const insertAdSchema = createInsertSchema(ads).pick({
  imageUrl: true,
  linkUrl: true,
  active: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGiveaway = z.infer<typeof insertGiveawaySchema>;
export type Giveaway = typeof giveaways.$inferSelect;
export type InsertAd = z.infer<typeof insertAdSchema>;
export type Ad = typeof ads.$inferSelect;
