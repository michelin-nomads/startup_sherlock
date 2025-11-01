/**
 * Enhanced Database Schema for Startup Sherlock
 * 
 * Designed for scalability, performance, and maintainability
 * Uses Google Cloud SQL (PostgreSQL) + Cloud Storage
 */

import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  integer, 
  real, 
  json, 
  jsonb,
  boolean,
  uuid,
  numeric,
  inet,
  index,
  unique,
  check
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ============================================================================
// CORE TABLES
// ============================================================================

/**
 * Users table - Authentication and profile
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: varchar("full_name", { length: 255 }),
  role: varchar("role", { length: 50 }).default("analyst"),
  organization: varchar("organization", { length: 255 }),
  isActive: boolean("is_active").default(true),
  emailVerified: boolean("email_verified").default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  emailIdx: index("idx_users_email").on(table.email),
  usernameIdx: index("idx_users_username").on(table.username),
}));

/**
 * Startups table - Core startup information
 */
export const startups = pgTable("startups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).unique(),
  description: text("description"),
  
  // Basic Info
  industry: varchar("industry", { length: 200 }),
  subIndustry: varchar("sub_industry", { length: 200 }),
  stage: varchar("stage", { length: 100 }),
  foundedYear: integer("founded_year"),
  location: varchar("location", { length: 255 }),
  countryCode: varchar("country_code", { length: 3 }),
  
  // Contact & Links
  websiteUrl: text("website_url"),
  linkedinUrl: text("linkedin_url"),
  crunchbaseUrl: text("crunchbase_url"),
  
  // Current Status
  status: varchar("status", { length: 50 }).default("active"),
  employeeCount: integer("employee_count"),
  
  // Latest Analysis Summary (denormalized for performance)
  latestOverallScore: numeric("latest_overall_score", { precision: 5, scale: 2 }),
  latestRiskLevel: varchar("latest_risk_level", { length: 50 }),
  latestRecommendation: varchar("latest_recommendation", { length: 50 }),
  latestAnalysisId: uuid("latest_analysis_id"),
  latestAnalysisAt: timestamp("latest_analysis_at", { withTimezone: true }),
  
  // Metadata
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  nameIdx: index("idx_startups_name").on(table.name),
  slugIdx: index("idx_startups_slug").on(table.slug),
  industryIdx: index("idx_startups_industry").on(table.industry),
  stageIdx: index("idx_startups_stage").on(table.stage),
  scoreIdx: index("idx_startups_score").on(table.latestOverallScore),
}));

/**
 * Founders table - Team member information
 */
export const founders = pgTable("founders", {
  id: uuid("id").primaryKey().defaultRandom(),
  startupId: uuid("startup_id").notNull().references(() => startups.id, { onDelete: "cascade" }),
  
  fullName: varchar("full_name", { length: 255 }).notNull(),
  title: varchar("title", { length: 200 }),
  role: varchar("role", { length: 100 }),
  
  // Background
  linkedinUrl: text("linkedin_url"),
  email: varchar("email", { length: 255 }),
  bio: text("bio"),
  education: jsonb("education"),
  previousCompanies: jsonb("previous_companies"),
  
  // Verification
  verified: boolean("verified").default(false),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verificationSource: text("verification_source"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  startupIdx: index("idx_founders_startup").on(table.startupId),
  verifiedIdx: index("idx_founders_verified").on(table.verified),
}));

/**
 * Documents table - Document metadata (files in Cloud Storage)
 */
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  startupId: uuid("startup_id").notNull().references(() => startups.id, { onDelete: "cascade" }),
  
  // File Info
  fileName: varchar("file_name", { length: 500 }).notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(),
  fileSize: integer("file_size"), // bytes
  
  // Cloud Storage Reference
  gcsBucket: varchar("gcs_bucket", { length: 255 }),
  gcsPath: text("gcs_path"),
  gcsUrl: text("gcs_url"),
  
  // Processing Status
  status: varchar("status", { length: 50 }).default("uploaded"),
  processingStartedAt: timestamp("processing_started_at", { withTimezone: true }),
  processingCompletedAt: timestamp("processing_completed_at", { withTimezone: true }),
  processingError: text("processing_error"),
  
  // Document Classification
  documentCategory: varchar("document_category", { length: 100 }),
  documentType: varchar("document_type", { length: 100 }),
  
  // Metadata
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  startupIdx: index("idx_documents_startup").on(table.startupId, table.uploadedAt),
  statusIdx: index("idx_documents_status").on(table.status),
  categoryIdx: index("idx_documents_category").on(table.documentCategory),
}));

/**
 * Document Extractions - Separated for large text content
 */
export const documentExtractions = pgTable("document_extractions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  
  // Extracted Content
  extractedText: text("extracted_text"),
  pageCount: integer("page_count"),
  wordCount: integer("word_count"),
  
  // Structured Extraction
  extractedData: jsonb("extracted_data"),
  entities: jsonb("entities"),
  keywords: text("keywords").array(),
  
  // OCR/Processing Details
  extractionMethod: varchar("extraction_method", { length: 100 }),
  ocrConfidence: numeric("ocr_confidence", { precision: 5, scale: 2 }),
  language: varchar("language", { length: 10 }).default("en"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  documentIdx: index("idx_extractions_document").on(table.documentId),
}));

// ============================================================================
// ANALYSIS TABLES
// ============================================================================

/**
 * Analyses - Main analysis records
 */
export const analyses = pgTable("analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  startupId: uuid("startup_id").notNull().references(() => startups.id, { onDelete: "cascade" }),
  
  // Analysis Info
  analysisType: varchar("analysis_type", { length: 100 }).notNull(),
  analysisVersion: varchar("analysis_version", { length: 50 }),
  
  // Scores
  overallScore: numeric("overall_score", { precision: 5, scale: 2 }).notNull(),
  confidenceScore: numeric("confidence_score", { precision: 5, scale: 2 }),
  
  // Risk Assessment
  riskLevel: varchar("risk_level", { length: 50 }),
  riskScore: numeric("risk_score", { precision: 5, scale: 2 }),
  
  // Recommendation
  recommendation: varchar("recommendation", { length: 50 }),
  recommendationReasoning: text("recommendation_reasoning"),
  targetInvestmentAmount: numeric("target_investment_amount", { precision: 15, scale: 2 }),
  expectedReturnMultiple: numeric("expected_return_multiple", { precision: 8, scale: 2 }),
  investmentHorizonMonths: integer("investment_horizon_months"),
  
  // Processing Details
  status: varchar("status", { length: 50 }).default("processing"),
  processingTimeSeconds: integer("processing_time_seconds"),
  modelUsed: varchar("model_used", { length: 100 }),
  
  // Document References
  documentIds: uuid("document_ids").array(),
  
  // Metadata
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => ({
  startupIdx: index("idx_analyses_startup").on(table.startupId, table.createdAt),
  typeIdx: index("idx_analyses_type").on(table.analysisType),
  scoreIdx: index("idx_analyses_score").on(table.overallScore),
  statusIdx: index("idx_analyses_status").on(table.status),
}));

/**
 * Analysis Metrics - Detailed scoring
 */
export const analysisMetrics = pgTable("analysis_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id").notNull().references(() => analyses.id, { onDelete: "cascade" }),
  
  // Core Metrics (0-100 each)
  marketSizeScore: numeric("market_size_score", { precision: 5, scale: 2 }),
  marketGrowthScore: numeric("market_growth_score", { precision: 5, scale: 2 }),
  tractionScore: numeric("traction_score", { precision: 5, scale: 2 }),
  teamScore: numeric("team_score", { precision: 5, scale: 2 }),
  productScore: numeric("product_score", { precision: 5, scale: 2 }),
  technologyScore: numeric("technology_score", { precision: 5, scale: 2 }),
  financialsScore: numeric("financials_score", { precision: 5, scale: 2 }),
  competitionScore: numeric("competition_score", { precision: 5, scale: 2 }),
  businessModelScore: numeric("business_model_score", { precision: 5, scale: 2 }),
  
  // Detailed Financial Metrics
  revenueGrowthRate: numeric("revenue_growth_rate", { precision: 8, scale: 2 }),
  customerAcquisitionCost: numeric("customer_acquisition_cost", { precision: 12, scale: 2 }),
  lifetimeValue: numeric("lifetime_value", { precision: 12, scale: 2 }),
  burnRate: numeric("burn_rate", { precision: 12, scale: 2 }),
  runwayMonths: integer("runway_months"),
  
  // Market Metrics
  tam: numeric("tam", { precision: 15, scale: 2 }),
  sam: numeric("sam", { precision: 15, scale: 2 }),
  som: numeric("som", { precision: 15, scale: 2 }),
  marketSharePercentage: numeric("market_share_percentage", { precision: 5, scale: 2 }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  analysisIdx: index("idx_metrics_analysis").on(table.analysisId),
}));

/**
 * Analysis Insights - Key findings
 */
export const analysisInsights = pgTable("analysis_insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id").notNull().references(() => analyses.id, { onDelete: "cascade" }),
  
  category: varchar("category", { length: 100 }),
  title: varchar("title", { length: 500 }),
  description: text("description").notNull(),
  
  // Prioritization
  importance: varchar("importance", { length: 50 }),
  confidence: varchar("confidence", { length: 50 }),
  
  // Evidence
  sourceType: varchar("source_type", { length: 100 }),
  sourceReferences: jsonb("source_references"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  analysisIdx: index("idx_insights_analysis").on(table.analysisId),
  categoryIdx: index("idx_insights_category").on(table.category),
  importanceIdx: index("idx_insights_importance").on(table.importance),
}));

/**
 * Risk Flags - Identified risks and red flags
 */
export const riskFlags = pgTable("risk_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id").notNull().references(() => analyses.id, { onDelete: "cascade" }),
  startupId: uuid("startup_id").notNull().references(() => startups.id, { onDelete: "cascade" }),
  
  severity: varchar("severity", { length: 50 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  impact: text("impact"),
  
  // Evidence & Sources
  evidence: jsonb("evidence"),
  sources: jsonb("sources"),
  
  // Status
  status: varchar("status", { length: 50 }).default("open"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolutionNotes: text("resolution_notes"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  analysisIdx: index("idx_risk_flags_analysis").on(table.analysisId),
  startupIdx: index("idx_risk_flags_startup").on(table.startupId, table.severity),
}));

// ============================================================================
// PUBLIC DATA & RESEARCH TABLES
// ============================================================================

/**
 * Public Data Sources - Tracked verification sources
 */
export const publicDataSources = pgTable("public_data_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  startupId: uuid("startup_id").notNull().references(() => startups.id, { onDelete: "cascade" }),
  
  sourceType: varchar("source_type", { length: 100 }),
  sourceName: varchar("source_name", { length: 255 }),
  sourceUrl: text("source_url"),
  
  // Data Extracted
  dataExtracted: jsonb("data_extracted"),
  extractionDate: timestamp("extraction_date", { withTimezone: true }).defaultNow(),
  
  // Verification
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  confidenceScore: numeric("confidence_score", { precision: 5, scale: 2 }),
  
  // Metadata
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  status: varchar("status", { length: 50 }).default("active"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  startupIdx: index("idx_public_sources_startup").on(table.startupId),
  typeIdx: index("idx_public_sources_type").on(table.sourceType),
  verifiedIdx: index("idx_public_sources_verified").on(table.isVerified),
}));

/**
 * News Articles - Media coverage tracking
 */
export const newsArticles = pgTable("news_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  startupId: uuid("startup_id").notNull().references(() => startups.id, { onDelete: "cascade" }),
  
  title: varchar("title", { length: 1000 }).notNull(),
  url: text("url").notNull().unique(),
  source: varchar("source", { length: 255 }),
  author: varchar("author", { length: 255 }),
  
  publishedAt: timestamp("published_at", { withTimezone: true }),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow(),
  
  // Content
  summary: text("summary"),
  fullText: text("full_text"),
  
  // Sentiment Analysis
  sentiment: varchar("sentiment", { length: 50 }),
  sentimentScore: numeric("sentiment_score", { precision: 5, scale: 2 }),
  
  // Relevance
  relevanceScore: numeric("relevance_score", { precision: 5, scale: 2 }),
  keywords: text("keywords").array(),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  startupIdx: index("idx_news_startup").on(table.startupId, table.publishedAt),
  sentimentIdx: index("idx_news_sentiment").on(table.sentiment),
  publishedIdx: index("idx_news_published").on(table.publishedAt),
}));

/**
 * Research Sessions - Hybrid research tracking
 */
export const researchSessions = pgTable("research_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  startupId: uuid("startup_id").references(() => startups.id, { onDelete: "cascade" }),
  
  query: text("query").notNull(),
  researchType: varchar("research_type", { length: 100 }),
  
  // Results
  groundedAnalysis: jsonb("grounded_analysis"),
  customSearchResults: jsonb("custom_search_results"),
  synthesizedInsights: jsonb("synthesized_insights"),
  sources: jsonb("sources"),
  
  confidenceScore: numeric("confidence_score", { precision: 5, scale: 2 }),
  
  // Processing
  status: varchar("status", { length: 50 }).default("processing"),
  processingTimeSeconds: integer("processing_time_seconds"),
  
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => ({
  startupIdx: index("idx_research_startup").on(table.startupId, table.createdAt),
  typeIdx: index("idx_research_type").on(table.researchType),
}));

/**
 * Discrepancies - Track data inconsistencies
 */
export const discrepancies = pgTable("discrepancies", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id").notNull().references(() => analyses.id, { onDelete: "cascade" }),
  startupId: uuid("startup_id").notNull().references(() => startups.id, { onDelete: "cascade" }),
  
  discrepancyType: varchar("discrepancy_type", { length: 100 }),
  severity: varchar("severity", { length: 50 }),
  category: varchar("category", { length: 100 }),
  
  // The Discrepancy
  claimedValue: text("claimed_value"),
  claimedSource: varchar("claimed_source", { length: 255 }),
  verifiedValue: text("verified_value"),
  verifiedSource: varchar("verified_source", { length: 255 }),
  
  description: text("description").notNull(),
  impactAssessment: text("impact_assessment"),
  
  // Status
  status: varchar("status", { length: 50 }).default("open"),
  resolutionNotes: text("resolution_notes"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  analysisIdx: index("idx_discrepancies_analysis").on(table.analysisId),
  startupIdx: index("idx_discrepancies_startup").on(table.startupId, table.severity),
  statusIdx: index("idx_discrepancies_status").on(table.status),
}));

// ============================================================================
// SUPPORT TABLES
// ============================================================================

/**
 * Benchmarks - Industry benchmark cache
 */
export const benchmarks = pgTable("benchmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  industry: varchar("industry", { length: 200 }).notNull(),
  companyStage: varchar("company_stage", { length: 100 }),
  companySize: varchar("company_size", { length: 100 }),
  
  // Benchmark Metrics
  metrics: jsonb("metrics").notNull(),
  
  // Metadata
  dataSource: varchar("data_source", { length: 255 }),
  sampleSize: integer("sample_size"),
  
  validFrom: timestamp("valid_from", { withTimezone: true }).defaultNow(),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  industryIdx: index("idx_benchmarks_industry").on(table.industry, table.companyStage),
}));

/**
 * Audit Logs - Complete audit trail
 */
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Action Details
  tableName: varchar("table_name", { length: 100 }).notNull(),
  recordId: uuid("record_id").notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  
  // Changes
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  changedFields: text("changed_fields").array(),
  
  // Context
  userId: uuid("user_id").references(() => users.id),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  tableIdx: index("idx_audit_table").on(table.tableName, table.createdAt),
  recordIdx: index("idx_audit_record").on(table.recordId),
  userIdx: index("idx_audit_user").on(table.userId, table.createdAt),
}));

// ============================================================================
// ZODS SCHEMAS FOR VALIDATION
// ============================================================================

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
  deletedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
  updatedAt: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertRiskFlagSchema = createInsertSchema(riskFlags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Startup = typeof startups.$inferSelect;
export type InsertStartup = z.infer<typeof insertStartupSchema>;

export type Founder = typeof founders.$inferSelect;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type DocumentExtraction = typeof documentExtractions.$inferSelect;

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;

export type AnalysisMetric = typeof analysisMetrics.$inferSelect;
export type AnalysisInsight = typeof analysisInsights.$inferSelect;

export type RiskFlag = typeof riskFlags.$inferSelect;
export type InsertRiskFlag = z.infer<typeof insertRiskFlagSchema>;

export type PublicDataSource = typeof publicDataSources.$inferSelect;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type ResearchSession = typeof researchSessions.$inferSelect;
export type Discrepancy = typeof discrepancies.$inferSelect;
export type Benchmark = typeof benchmarks.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

// ============================================================================
// FRONTEND-SPECIFIC TYPES (Compatibility)
// ============================================================================

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

