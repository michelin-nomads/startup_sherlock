import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, real, json, numeric, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firebaseUid: text("firebase_uid").notNull().unique(), // Firebase User ID
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  role: text("role").default("analyst"), // analyst, admin, investor
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const startups = pgTable("startups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // Link to user who created it
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
  gcsUrl: text("gcs_url"), // Google Cloud Storage URL
  extractedText: text("extracted_text"),
  analysisResult: json("analysis_result"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

// New tables for normalized data
export const analyses = pgTable("analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  startupId: varchar("startup_id").notNull().references(() => startups.id),
  analysisType: text("analysis_type").notNull(),
  overallScore: numeric("overall_score"),
  riskLevel: text("risk_level"),
  recommendation: text("recommendation"),
  recommendationReasoning: text("recommendation_reasoning"),
  targetInvestmentAmount: numeric("target_investment_amount"),
  expectedReturnMultiple: numeric("expected_return_multiple"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const analysisMetrics = pgTable("analysis_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  analysisId: varchar("analysis_id").notNull().references(() => analyses.id),
  marketSizeScore: numeric("market_size_score"),
  tractionScore: numeric("traction_score"),
  teamScore: numeric("team_score"),
  productScore: numeric("product_score"),
  financialsScore: numeric("financials_score"),
  competitionScore: numeric("competition_score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const analysisInsights = pgTable("analysis_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  analysisId: varchar("analysis_id").notNull().references(() => analyses.id),
  category: text("category"),
  title: text("title"),
  description: text("description").notNull(),
  importance: text("importance"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const riskFlags = pgTable("risk_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  analysisId: varchar("analysis_id").notNull().references(() => analyses.id),
  startupId: varchar("startup_id").notNull().references(() => startups.id),
  severity: text("severity").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  impact: text("impact"),
  status: text("status").default(sql`'open'`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const benchmarks = pgTable("benchmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  industry: text("industry").notNull(),
  companyStage: text("company_stage"),
  companySize: text("company_size"),
  metrics: json("metrics").notNull(),
  dataSource: text("data_source"),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Document extractions - Large text storage
export const documentExtractions = pgTable("document_extractions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id),
  extractedText: text("extracted_text"),
  pageCount: integer("page_count"),
  wordCount: integer("word_count"),
  extractedData: json("extracted_data"),
  extractionMethod: text("extraction_method"),
  language: text("language").default(sql`'en'`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Public data sources
export const publicDataSources = pgTable("public_data_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  startupId: varchar("startup_id").notNull().references(() => startups.id),
  sourceType: text("source_type"),
  sourceName: text("source_name"),
  sourceUrl: text("source_url"),
  dataExtracted: json("data_extracted"),
  extractionDate: timestamp("extraction_date").defaultNow(),
  isVerified: integer("is_verified").default(sql`0`), // boolean as integer
  confidenceScore: numeric("confidence_score"),
  status: text("status").default(sql`'active'`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// News articles
export const newsArticles = pgTable("news_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  startupId: varchar("startup_id").notNull().references(() => startups.id),
  title: text("title").notNull(),
  url: text("url").notNull(),
  source: text("source"),
  publishedAt: timestamp("published_at"),
  summary: text("summary"),
  sentiment: text("sentiment"),
  sentimentScore: numeric("sentiment_score"),
  relevanceScore: numeric("relevance_score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Research sessions
export const researchSessions = pgTable("research_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  startupId: varchar("startup_id").references(() => startups.id),
  query: text("query").notNull(),
  researchType: text("research_type"),
  groundedAnalysis: json("grounded_analysis"),
  customSearchResults: json("custom_search_results"),
  synthesizedInsights: json("synthesized_insights"),
  sources: json("sources"),
  confidenceScore: numeric("confidence_score"),
  status: text("status").default(sql`'completed'`),
  processingTimeSeconds: integer("processing_time_seconds"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Discrepancies
export const discrepancies = pgTable("discrepancies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  analysisId: varchar("analysis_id").notNull().references(() => analyses.id),
  startupId: varchar("startup_id").notNull().references(() => startups.id),
  discrepancyType: text("discrepancy_type").notNull(),
  severity: text("severity").notNull(),
  field: text("field"),
  documentValue: text("document_value"),
  publicValue: text("public_value"),
  description: text("description").notNull(),
  impact: text("impact"),
  sources: json("sources"),
  status: text("status").default(sql`'open'`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export const insertStartupSchema = createInsertSchema(startups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  userId: z.string().optional(), // Make userId optional for backward compatibility
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  createdAt: true,
});

export const insertAnalysisMetricsSchema = createInsertSchema(analysisMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertAnalysisInsightsSchema = createInsertSchema(analysisInsights).omit({
  id: true,
  createdAt: true,
});

export const insertRiskFlagSchema = createInsertSchema(riskFlags).omit({
  id: true,
  createdAt: true,
});

export const insertBenchmarkSchema = createInsertSchema(benchmarks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentExtractionSchema = createInsertSchema(documentExtractions).omit({
  id: true,
  createdAt: true,
});

export const insertPublicDataSourceSchema = createInsertSchema(publicDataSources).omit({
  id: true,
  createdAt: true,
});

export const insertNewsArticleSchema = createInsertSchema(newsArticles).omit({
  id: true,
  createdAt: true,
});

export const insertResearchSessionSchema = createInsertSchema(researchSessions).omit({
  id: true,
  createdAt: true,
});

export const insertDiscrepancySchema = createInsertSchema(discrepancies).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertStartup = z.infer<typeof insertStartupSchema>;
export type Startup = typeof startups.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysisMetrics = z.infer<typeof insertAnalysisMetricsSchema>;
export type AnalysisMetrics = typeof analysisMetrics.$inferSelect;
export type InsertAnalysisInsights = z.infer<typeof insertAnalysisInsightsSchema>;
export type AnalysisInsights = typeof analysisInsights.$inferSelect;
export type InsertRiskFlag = z.infer<typeof insertRiskFlagSchema>;
export type RiskFlag = typeof riskFlags.$inferSelect;
export type InsertBenchmark = z.infer<typeof insertBenchmarkSchema>;
export type Benchmark = typeof benchmarks.$inferSelect;
export type InsertDocumentExtraction = z.infer<typeof insertDocumentExtractionSchema>;
export type DocumentExtraction = typeof documentExtractions.$inferSelect;
export type InsertPublicDataSource = z.infer<typeof insertPublicDataSourceSchema>;
export type PublicDataSource = typeof publicDataSources.$inferSelect;
export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type InsertResearchSession = z.infer<typeof insertResearchSessionSchema>;
export type ResearchSession = typeof researchSessions.$inferSelect;
export type InsertDiscrepancy = z.infer<typeof insertDiscrepancySchema>;
export type Discrepancy = typeof discrepancies.$inferSelect;

// Frontend-specific types for analysis
export interface StartupMetrics {
  marketSize: number;
  traction: number;
  team: number;
  product: number;
  financials: number;
  competition: number;
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