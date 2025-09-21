import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const startups = pgTable("startups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  industry: text("industry"),
  stage: text("stage"),
  foundedYear: integer("founded_year"),
  location: text("location"),
  description: text("description"),
  websiteUrl: text("website_url"),
  overallScore: real("overall_score"),
  riskLevel: text("risk_level"),
  recommendation: text("recommendation"),
  analysisData: json("analysis_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  startupId: varchar("startup_id").references(() => startups.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size"),
  extractedText: text("extracted_text"),
  analysisResult: json("analysis_result"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertStartupSchema = createInsertSchema(startups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertStartup = z.infer<typeof insertStartupSchema>;
export type Startup = typeof startups.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Frontend-specific types for analysis
export interface StartupMetrics {
  marketSize: number;
  traction: number;
  team: number;
  product: number;
  financials: number;
  competition: number;
}

export interface RiskFlag {
  type: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  impact: string;
}

export interface StartupAnalysis {
  startup: Startup;
  metrics: StartupMetrics;
  riskFlags: RiskFlag[];
  benchmarkData: any;
  keyInsights: string[];
  investmentRecommendation: {
    decision: 'strong_buy' | 'buy' | 'hold' | 'pass';
    reasoning: string;
    targetInvestment: number;
    expectedReturn: number;
  };
}