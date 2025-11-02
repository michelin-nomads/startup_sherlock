/**
 * Database Storage Layer - Compatible with existing schema
 * Uses the original schema but with PostgreSQL instead of in-memory
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, desc, and } from 'drizzle-orm';
import {
  users,
  startups,
  documents,
  analyses,
  analysisMetrics,
  analysisInsights,
  riskFlags,
  benchmarks,
  documentExtractions,
  publicDataSources,
  newsArticles,
  researchSessions,
  discrepancies,
  type User,
  type InsertUser,
  type Startup,
  type InsertStartup,
  type Document,
  type InsertDocument,
  type Analysis,
  type InsertAnalysis,
  type AnalysisMetrics,
  type InsertAnalysisMetrics,
  type AnalysisInsights,
  type InsertAnalysisInsights,
  type RiskFlag,
  type InsertRiskFlag,
  type Benchmark,
  type InsertBenchmark,
  type DocumentExtraction,
  type InsertDocumentExtraction,
  type PublicDataSource,
  type InsertPublicDataSource,
  type NewsArticle,
  type InsertNewsArticle,
  type ResearchSession,
  type InsertResearchSession,
  type Discrepancy,
  type InsertDiscrepancy,
} from '@shared/schema';

export class DatabaseStorage {
  private db;
  private sql;
  private currentUserId: string | null = null;

  constructor(connectionString: string) {
    // Parse connection string or use direct config
    try {
      this.sql = postgres(connectionString, {
        max: 20,
        idle_timeout: 30,
        connect_timeout: 10,
      });
    } catch (error) {
      // Fallback to direct connection config
      this.sql = postgres({
        host: 'localhost',
        port: 5432,
        database: 'startup_sherlock',
        username: 'postgres',
        password: 'StartupSherlock2025',
        max: 20,
        idle_timeout: 30,
        connect_timeout: 10,
      });
    }
    this.db = drizzle(this.sql);
    console.log('✅ Database storage initialized');
  }

  /**
   * Set current user ID for Row-Level Security
   * This should be called at the beginning of each request
   */
  async setCurrentUserId(userId: string | null): Promise<void> {
    this.currentUserId = userId;
    if (userId) {
      // Set PostgreSQL session variable for RLS policies
      await this.sql`SELECT set_config('app.current_user_id', ${userId}, false)`;
    } else {
      // Clear the session variable
      await this.sql`SELECT set_config('app.current_user_id', '', false)`;
    }
  }

  /**
   * Get current user ID (for debugging)
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.sql`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    await this.sql.end();
  }

  // ============================================================================
  // USER METHODS
  // ============================================================================

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Deprecated: kept for backward compatibility
    // Use getUserByEmail instead
    const result = await this.db.select().from(users).where(eq(users.email, username)).limit(1);
    return result[0];
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await this.db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  }

  // ============================================================================
  // STARTUP METHODS
  // ============================================================================

  async getStartup(id: string): Promise<Startup | undefined> {
    const result = await this.db.select().from(startups).where(eq(startups.id, id)).limit(1);
    return result[0];
  }

  async getAllStartups(): Promise<Startup[]> {
    const result = await this.db.select().from(startups).orderBy(desc(startups.updatedAt));
    return result;
  }

  async getStartupsByUser(userId: string): Promise<Startup[]> {
    const result = await this.db
      .select()
      .from(startups)
      .where(eq(startups.userId, userId))
      .orderBy(desc(startups.updatedAt));
    return result;
  }

  async createStartup(insertStartup: InsertStartup): Promise<Startup> {
    const result = await this.db.insert(startups).values(insertStartup).returning();
    return result[0];
  }

  async updateStartup(id: string, updates: Partial<InsertStartup>): Promise<Startup | undefined> {
    const result = await this.db
      .update(startups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(startups.id, id))
      .returning();
    return result[0];
  }

  async deleteStartup(id: string): Promise<boolean> {
    const result = await this.db.delete(startups).where(eq(startups.id, id)).returning();
    return result.length > 0;
  }

  // ============================================================================
  // DOCUMENT METHODS
  // ============================================================================

  async getDocument(id: string): Promise<Document | undefined> {
    const result = await this.db.select().from(documents).where(eq(documents.id, id)).limit(1);
    return result[0];
  }

  async getDocumentsByStartup(startupId: string): Promise<Document[]> {
    const result = await this.db
      .select()
      .from(documents)
      .where(eq(documents.startupId, startupId))
      .orderBy(desc(documents.uploadedAt));
    return result;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const result = await this.db.insert(documents).values(insertDocument).returning();
    return result[0];
  }

  async updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document | undefined> {
    const result = await this.db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, id))
      .returning();
    return result[0];
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await this.db.delete(documents).where(eq(documents.id, id)).returning();
    return result.length > 0;
  }

  // ============================================================================
  // ANALYSIS METHODS
  // ============================================================================

  async getAnalysis(id: string): Promise<Analysis | undefined> {
    const result = await this.db.select().from(analyses).where(eq(analyses.id, id)).limit(1);
    return result[0];
  }

  async getAnalysesByStartup(startupId: string): Promise<Analysis[]> {
    const result = await this.db
      .select()
      .from(analyses)
      .where(eq(analyses.startupId, startupId))
      .orderBy(desc(analyses.createdAt));
    return result;
  }

  async getLatestAnalysis(startupId: string): Promise<Analysis | undefined> {
    const result = await this.db
      .select()
      .from(analyses)
      .where(eq(analyses.startupId, startupId))
      .orderBy(desc(analyses.createdAt))
      .limit(1);
    return result[0];
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const result = await this.db.insert(analyses).values(insertAnalysis).returning();
    return result[0];
  }

  async updateAnalysis(id: string, updates: Partial<InsertAnalysis>): Promise<Analysis | undefined> {
    const result = await this.db
      .update(analyses)
      .set(updates)
      .where(eq(analyses.id, id))
      .returning();
    return result[0];
  }

  async deleteAnalysis(id: string): Promise<boolean> {
    const result = await this.db.delete(analyses).where(eq(analyses.id, id)).returning();
    return result.length > 0;
  }

  // ============================================================================
  // ANALYSIS METRICS METHODS
  // ============================================================================

  async createAnalysisMetrics(insertMetrics: InsertAnalysisMetrics): Promise<AnalysisMetrics> {
    const result = await this.db.insert(analysisMetrics).values(insertMetrics).returning();
    return result[0];
  }

  async getAnalysisMetrics(analysisId: string): Promise<AnalysisMetrics | undefined> {
    const result = await this.db
      .select()
      .from(analysisMetrics)
      .where(eq(analysisMetrics.analysisId, analysisId))
      .limit(1);
    return result[0];
  }

  // ============================================================================
  // ANALYSIS INSIGHTS METHODS
  // ============================================================================

  async createAnalysisInsight(insertInsight: InsertAnalysisInsights): Promise<AnalysisInsights> {
    const result = await this.db.insert(analysisInsights).values(insertInsight).returning();
    return result[0];
  }

  async getAnalysisInsights(analysisId: string): Promise<AnalysisInsights[]> {
    const result = await this.db
      .select()
      .from(analysisInsights)
      .where(eq(analysisInsights.analysisId, analysisId))
      .orderBy(desc(analysisInsights.createdAt));
    return result;
  }

  // ============================================================================
  // RISK FLAGS METHODS
  // ============================================================================

  async createRiskFlag(insertRiskFlag: InsertRiskFlag): Promise<RiskFlag> {
    const result = await this.db.insert(riskFlags).values(insertRiskFlag).returning();
    return result[0];
  }

  async getRiskFlags(analysisId: string): Promise<RiskFlag[]> {
    const result = await this.db
      .select()
      .from(riskFlags)
      .where(eq(riskFlags.analysisId, analysisId))
      .orderBy(desc(riskFlags.createdAt));
    return result;
  }

  async getRiskFlagsByStartup(startupId: string): Promise<RiskFlag[]> {
    const result = await this.db
      .select()
      .from(riskFlags)
      .where(eq(riskFlags.startupId, startupId))
      .orderBy(desc(riskFlags.createdAt));
    return result;
  }

  async updateRiskFlagStatus(id: string, status: string): Promise<RiskFlag | undefined> {
    const result = await this.db
      .update(riskFlags)
      .set({ status })
      .where(eq(riskFlags.id, id))
      .returning();
    return result[0];
  }

  // ============================================================================
  // BENCHMARK METHODS
  // ============================================================================

  async getBenchmark(id: string): Promise<Benchmark | undefined> {
    const result = await this.db.select().from(benchmarks).where(eq(benchmarks.id, id)).limit(1);
    return result[0];
  }

  async getBenchmarksByIndustry(industry: string, companyStage?: string): Promise<Benchmark[]> {
    const conditions = companyStage
      ? and(eq(benchmarks.industry, industry), eq(benchmarks.companyStage, companyStage))
      : eq(benchmarks.industry, industry);

    const result = await this.db
      .select()
      .from(benchmarks)
      .where(conditions!)
      .orderBy(desc(benchmarks.createdAt));
    return result;
  }

  async createBenchmark(insertBenchmark: InsertBenchmark): Promise<Benchmark> {
    const result = await this.db.insert(benchmarks).values(insertBenchmark).returning();
    return result[0];
  }

  async updateBenchmark(id: string, updates: Partial<InsertBenchmark>): Promise<Benchmark | undefined> {
    const result = await this.db
      .update(benchmarks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(benchmarks.id, id))
      .returning();
    return result[0];
  }

  async deleteBenchmark(id: string): Promise<boolean> {
    const result = await this.db.delete(benchmarks).where(eq(benchmarks.id, id)).returning();
    return result.length > 0;
  }

  async getAllBenchmarks(): Promise<Benchmark[]> {
    const result = await this.db.select().from(benchmarks).orderBy(desc(benchmarks.updatedAt));
    return result;
  }

  // ============================================================================
  // DOCUMENT EXTRACTION METHODS
  // ============================================================================

  async createDocumentExtraction(insertExtraction: InsertDocumentExtraction): Promise<DocumentExtraction> {
    const result = await this.db.insert(documentExtractions).values(insertExtraction).returning();
    return result[0];
  }

  async getDocumentExtraction(documentId: string): Promise<DocumentExtraction | undefined> {
    const result = await this.db
      .select()
      .from(documentExtractions)
      .where(eq(documentExtractions.documentId, documentId))
      .limit(1);
    return result[0];
  }

  // ============================================================================
  // PUBLIC DATA SOURCE METHODS
  // ============================================================================

  async createPublicDataSource(insertSource: InsertPublicDataSource): Promise<PublicDataSource> {
    const result = await this.db.insert(publicDataSources).values(insertSource).returning();
    return result[0];
  }

  async getPublicDataSources(startupId: string): Promise<PublicDataSource[]> {
    const result = await this.db
      .select()
      .from(publicDataSources)
      .where(eq(publicDataSources.startupId, startupId))
      .orderBy(desc(publicDataSources.createdAt));
    return result;
  }

  async updatePublicDataSource(id: string, updates: Partial<InsertPublicDataSource>): Promise<PublicDataSource | undefined> {
    const result = await this.db
      .update(publicDataSources)
      .set(updates)
      .where(eq(publicDataSources.id, id))
      .returning();
    return result[0];
  }

  // ============================================================================
  // NEWS ARTICLE METHODS
  // ============================================================================

  async createNewsArticle(insertArticle: InsertNewsArticle): Promise<NewsArticle> {
    const result = await this.db.insert(newsArticles).values(insertArticle).returning();
    return result[0];
  }

  async getNewsArticles(startupId: string): Promise<NewsArticle[]> {
    const result = await this.db
      .select()
      .from(newsArticles)
      .where(eq(newsArticles.startupId, startupId))
      .orderBy(desc(newsArticles.publishedAt));
    return result;
  }

  async deleteNewsArticle(id: string): Promise<boolean> {
    const result = await this.db.delete(newsArticles).where(eq(newsArticles.id, id)).returning();
    return result.length > 0;
  }

  // ============================================================================
  // RESEARCH SESSION METHODS
  // ============================================================================

  async createResearchSession(insertSession: InsertResearchSession): Promise<ResearchSession> {
    const result = await this.db.insert(researchSessions).values(insertSession).returning();
    return result[0];
  }

  async getResearchSessions(startupId: string): Promise<ResearchSession[]> {
    const result = await this.db
      .select()
      .from(researchSessions)
      .where(eq(researchSessions.startupId, startupId))
      .orderBy(desc(researchSessions.createdAt));
    return result;
  }

  async getLatestResearchSession(startupId: string): Promise<ResearchSession | undefined> {
    const result = await this.db
      .select()
      .from(researchSessions)
      .where(eq(researchSessions.startupId, startupId))
      .orderBy(desc(researchSessions.createdAt))
      .limit(1);
    return result[0];
  }

  // ============================================================================
  // DISCREPANCY METHODS
  // ============================================================================

  async createDiscrepancy(insertDiscrepancy: InsertDiscrepancy): Promise<Discrepancy> {
    const result = await this.db.insert(discrepancies).values(insertDiscrepancy).returning();
    return result[0];
  }

  async getDiscrepancies(analysisId: string): Promise<Discrepancy[]> {
    const result = await this.db
      .select()
      .from(discrepancies)
      .where(eq(discrepancies.analysisId, analysisId))
      .orderBy(desc(discrepancies.createdAt));
    return result;
  }

  async getDiscrepanciesByStartup(startupId: string): Promise<Discrepancy[]> {
    const result = await this.db
      .select()
      .from(discrepancies)
      .where(eq(discrepancies.startupId, startupId))
      .orderBy(desc(discrepancies.createdAt));
    return result;
  }

  async updateDiscrepancyStatus(id: string, status: string): Promise<Discrepancy | undefined> {
    const result = await this.db
      .update(discrepancies)
      .set({ status })
      .where(eq(discrepancies.id, id))
      .returning();
    return result[0];
  }
}

// Singleton instance
let dbInstance: DatabaseStorage | null = null;

export function initDatabaseStorage(connectionString: string): DatabaseStorage {
  if (!dbInstance) {
    dbInstance = new DatabaseStorage(connectionString);
  }
  return dbInstance;
}

export function getDatabaseStorage(): DatabaseStorage {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabaseStorage() first.');
  }
  return dbInstance;
}

