/**
 * Enhanced Database Storage Layer
 * 
 * Implements IStorage interface with Google Cloud SQL (PostgreSQL)
 * Uses Drizzle ORM with connection pooling
 */

import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, desc, and, isNull, sql } from 'drizzle-orm';
import {
  users,
  startups,
  founders,
  documents,
  documentExtractions,
  analyses,
  analysisMetrics,
  analysisInsights,
  riskFlags,
  publicDataSources,
  newsArticles,
  researchSessions,
  discrepancies,
  benchmarks,
  auditLogs,
  type User,
  type InsertUser,
  type Startup,
  type InsertStartup,
  type Document,
  type InsertDocument,
  type Analysis,
  type InsertAnalysis,
  type RiskFlag,
  type InsertRiskFlag,
} from '@shared/schema.enhanced';
import type { IStorage } from './storage';

export interface DatabaseConfig {
  connectionString: string;
  maxConnections?: number;
  idleTimeout?: number;
  connectTimeout?: number;
}

/**
 * Enhanced Database Storage with Cloud SQL
 */
export class EnhancedDatabaseStorage implements IStorage {
  private db: PostgresJsDatabase;
  private sql: ReturnType<typeof postgres>;

  constructor(config: DatabaseConfig) {
    // Create postgres connection with connection pooling
    this.sql = postgres(config.connectionString, {
      max: config.maxConnections || 20,
      idle_timeout: config.idleTimeout || 30,
      connect_timeout: config.connectTimeout || 10,
      onnotice: () => {}, // Suppress NOTICE messages
    });

    // Initialize Drizzle
    this.db = drizzle(this.sql);

    console.log('✅ Database connection initialized');
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.sql`SELECT 1`;
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.sql.end();
    console.log('✅ Database connection closed');
  }

  // ============================================================================
  // USER METHODS
  // ============================================================================

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db
      .insert(users)
      .values(insertUser)
      .returning();
    
    // Audit log
    await this.createAuditLog({
      tableName: 'users',
      recordId: result[0].id,
      action: 'INSERT',
      newValues: result[0] as any,
    });

    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const existing = await this.getUser(id);
    if (!existing) return undefined;

    const result = await this.db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    // Audit log
    await this.createAuditLog({
      tableName: 'users',
      recordId: id,
      action: 'UPDATE',
      oldValues: existing as any,
      newValues: result[0] as any,
    });

    return result[0];
  }

  // ============================================================================
  // STARTUP METHODS
  // ============================================================================

  async getStartup(id: string): Promise<Startup | undefined> {
    const result = await this.db
      .select()
      .from(startups)
      .where(and(eq(startups.id, id), isNull(startups.deletedAt)))
      .limit(1);
    return result[0];
  }

  async getAllStartups(): Promise<Startup[]> {
    const result = await this.db
      .select()
      .from(startups)
      .where(isNull(startups.deletedAt))
      .orderBy(desc(startups.updatedAt));
    return result;
  }

  async getStartupsByIndustry(industry: string): Promise<Startup[]> {
    const result = await this.db
      .select()
      .from(startups)
      .where(and(eq(startups.industry, industry), isNull(startups.deletedAt)))
      .orderBy(desc(startups.latestOverallScore));
    return result;
  }

  async createStartup(insertStartup: InsertStartup): Promise<Startup> {
    // Generate slug from name
    const slug = insertStartup.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const result = await this.db
      .insert(startups)
      .values({ ...insertStartup, slug })
      .returning();

    // Audit log
    await this.createAuditLog({
      tableName: 'startups',
      recordId: result[0].id,
      action: 'INSERT',
      newValues: result[0] as any,
    });

    return result[0];
  }

  async updateStartup(id: string, updates: Partial<InsertStartup>): Promise<Startup | undefined> {
    const existing = await this.getStartup(id);
    if (!existing) return undefined;

    const result = await this.db
      .update(startups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(startups.id, id))
      .returning();

    // Audit log
    await this.createAuditLog({
      tableName: 'startups',
      recordId: id,
      action: 'UPDATE',
      oldValues: existing as any,
      newValues: result[0] as any,
    });

    return result[0];
  }

  async deleteStartup(id: string): Promise<boolean> {
    const existing = await this.getStartup(id);
    if (!existing) return false;

    // Soft delete
    await this.db
      .update(startups)
      .set({ deletedAt: new Date() })
      .where(eq(startups.id, id));

    // Audit log
    await this.createAuditLog({
      tableName: 'startups',
      recordId: id,
      action: 'DELETE',
      oldValues: existing as any,
    });

    return true;
  }

  // ============================================================================
  // DOCUMENT METHODS
  // ============================================================================

  async getDocument(id: string): Promise<Document | undefined> {
    const result = await this.db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);
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
    const result = await this.db
      .insert(documents)
      .values(insertDocument)
      .returning();

    // Audit log
    await this.createAuditLog({
      tableName: 'documents',
      recordId: result[0].id,
      action: 'INSERT',
      newValues: result[0] as any,
    });

    return result[0];
  }

  async updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document | undefined> {
    const existing = await this.getDocument(id);
    if (!existing) return undefined;

    const result = await this.db
      .update(documents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();

    // Audit log
    await this.createAuditLog({
      tableName: 'documents',
      recordId: id,
      action: 'UPDATE',
      oldValues: existing as any,
      newValues: result[0] as any,
    });

    return result[0];
  }

  async deleteDocument(id: string): Promise<boolean> {
    const existing = await this.getDocument(id);
    if (!existing) return false;

    await this.db.delete(documents).where(eq(documents.id, id));

    // Audit log
    await this.createAuditLog({
      tableName: 'documents',
      recordId: id,
      action: 'DELETE',
      oldValues: existing as any,
    });

    return true;
  }

  // ============================================================================
  // DOCUMENT EXTRACTION METHODS
  // ============================================================================

  async createDocumentExtraction(data: {
    documentId: string;
    extractedText: string;
    pageCount?: number;
    wordCount?: number;
    extractedData?: any;
    entities?: any;
    keywords?: string[];
    extractionMethod?: string;
    ocrConfidence?: number;
  }): Promise<any> {
    const result = await this.db
      .insert(documentExtractions)
      .values(data)
      .returning();
    return result[0];
  }

  async getDocumentExtraction(documentId: string): Promise<any> {
    const result = await this.db
      .select()
      .from(documentExtractions)
      .where(eq(documentExtractions.documentId, documentId))
      .limit(1);
    return result[0];
  }

  // ============================================================================
  // ANALYSIS METHODS
  // ============================================================================

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const result = await this.db
      .insert(analyses)
      .values(insertAnalysis)
      .returning();

    // Update startup with latest analysis
    if (insertAnalysis.status === 'completed') {
      await this.db
        .update(startups)
        .set({
          latestAnalysisId: result[0].id,
          latestOverallScore: result[0].overallScore,
          latestRiskLevel: result[0].riskLevel,
          latestRecommendation: result[0].recommendation,
          latestAnalysisAt: new Date(),
        })
        .where(eq(startups.id, insertAnalysis.startupId));
    }

    // Audit log
    await this.createAuditLog({
      tableName: 'analyses',
      recordId: result[0].id,
      action: 'INSERT',
      newValues: result[0] as any,
    });

    return result[0];
  }

  async getAnalysisByStartup(startupId: string, limit: number = 10): Promise<Analysis[]> {
    const result = await this.db
      .select()
      .from(analyses)
      .where(eq(analyses.startupId, startupId))
      .orderBy(desc(analyses.createdAt))
      .limit(limit);
    return result;
  }

  async getLatestAnalysis(startupId: string): Promise<Analysis | undefined> {
    const result = await this.db
      .select()
      .from(analyses)
      .where(and(eq(analyses.startupId, startupId), eq(analyses.status, 'completed')))
      .orderBy(desc(analyses.createdAt))
      .limit(1);
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

  // ============================================================================
  // RISK FLAG METHODS
  // ============================================================================

  async createRiskFlag(insertRiskFlag: InsertRiskFlag): Promise<RiskFlag> {
    const result = await this.db
      .insert(riskFlags)
      .values(insertRiskFlag)
      .returning();
    return result[0];
  }

  async getRiskFlagsByStartup(startupId: string): Promise<RiskFlag[]> {
    const result = await this.db
      .select()
      .from(riskFlags)
      .where(eq(riskFlags.startupId, startupId))
      .orderBy(desc(riskFlags.createdAt));
    return result;
  }

  async getRiskFlagsByAnalysis(analysisId: string): Promise<RiskFlag[]> {
    const result = await this.db
      .select()
      .from(riskFlags)
      .where(eq(riskFlags.analysisId, analysisId));
    return result;
  }

  // ============================================================================
  // AUDIT LOG METHODS
  // ============================================================================

  private async createAuditLog(data: {
    tableName: string;
    recordId: string;
    action: string;
    oldValues?: any;
    newValues?: any;
    userId?: string;
  }): Promise<void> {
    try {
      await this.db.insert(auditLogs).values({
        tableName: data.tableName,
        recordId: data.recordId,
        action: data.action,
        oldValues: data.oldValues,
        newValues: data.newValues,
        userId: data.userId,
        changedFields: data.oldValues && data.newValues 
          ? Object.keys(data.newValues).filter(key => data.oldValues[key] !== data.newValues[key])
          : [],
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw - audit logging shouldn't break operations
    }
  }

  // ============================================================================
  // SEARCH & ANALYTICS METHODS
  // ============================================================================

  async searchStartups(query: string): Promise<Startup[]> {
    const result = await this.db
      .select()
      .from(startups)
      .where(
        and(
          isNull(startups.deletedAt),
          sql`${startups.name} ILIKE ${`%${query}%`} OR ${startups.description} ILIKE ${`%${query}%`}`
        )
      )
      .orderBy(desc(startups.latestOverallScore))
      .limit(50);
    return result;
  }

  async getTopStartups(limit: number = 10): Promise<Startup[]> {
    const result = await this.db
      .select()
      .from(startups)
      .where(isNull(startups.deletedAt))
      .orderBy(desc(startups.latestOverallScore))
      .limit(limit);
    return result;
  }

  async getStartupStatistics(): Promise<{
    total: number;
    byStage: Record<string, number>;
    byIndustry: Record<string, number>;
    avgScore: number;
  }> {
    const allStartups = await this.getAllStartups();
    
    const byStage: Record<string, number> = {};
    const byIndustry: Record<string, number> = {};
    let totalScore = 0;
    let scoredCount = 0;

    allStartups.forEach(startup => {
      if (startup.stage) {
        byStage[startup.stage] = (byStage[startup.stage] || 0) + 1;
      }
      if (startup.industry) {
        byIndustry[startup.industry] = (byIndustry[startup.industry] || 0) + 1;
      }
      if (startup.latestOverallScore) {
        totalScore += Number(startup.latestOverallScore);
        scoredCount++;
      }
    });

    return {
      total: allStartups.length,
      byStage,
      byIndustry,
      avgScore: scoredCount > 0 ? totalScore / scoredCount : 0,
    };
  }
}

// Singleton instance
let dbInstance: EnhancedDatabaseStorage | null = null;

/**
 * Initialize database connection
 */
export function initDatabase(config: DatabaseConfig): EnhancedDatabaseStorage {
  if (!dbInstance) {
    dbInstance = new EnhancedDatabaseStorage(config);
  }
  return dbInstance;
}

/**
 * Get database instance
 */
export function getDatabase(): EnhancedDatabaseStorage {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

// Export for testing
export { EnhancedDatabaseStorage as _EnhancedDatabaseStorage };

