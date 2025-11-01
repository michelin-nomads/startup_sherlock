import { 
  type User, type InsertUser, 
  type Startup, type InsertStartup, 
  type Document, type InsertDocument,
  type Analysis, type InsertAnalysis,
  type AnalysisMetrics, type InsertAnalysisMetrics,
  type AnalysisInsights, type InsertAnalysisInsights,
  type RiskFlag, type InsertRiskFlag,
  type Benchmark, type InsertBenchmark,
  type DocumentExtraction, type InsertDocumentExtraction,
  type PublicDataSource, type InsertPublicDataSource,
  type NewsArticle, type InsertNewsArticle,
  type ResearchSession, type InsertResearchSession,
  type Discrepancy, type InsertDiscrepancy
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Startup methods
  getStartup(id: string): Promise<Startup | undefined>;
  getAllStartups(): Promise<Startup[]>;
  createStartup(startup: InsertStartup): Promise<Startup>;
  updateStartup(id: string, updates: Partial<InsertStartup>): Promise<Startup | undefined>;
  deleteStartup(id: string): Promise<boolean>;
  
  // Document methods
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByStartup(startupId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;

  // Analysis methods
  getAnalysis(id: string): Promise<Analysis | undefined>;
  getAnalysesByStartup(startupId: string): Promise<Analysis[]>;
  getLatestAnalysis(startupId: string): Promise<Analysis | undefined>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  updateAnalysis(id: string, updates: Partial<InsertAnalysis>): Promise<Analysis | undefined>;
  deleteAnalysis(id: string): Promise<boolean>;

  // Analysis Metrics methods
  createAnalysisMetrics(metrics: InsertAnalysisMetrics): Promise<AnalysisMetrics>;
  getAnalysisMetrics(analysisId: string): Promise<AnalysisMetrics | undefined>;
  
  // Analysis Insights methods
  createAnalysisInsight(insight: InsertAnalysisInsights): Promise<AnalysisInsights>;
  getAnalysisInsights(analysisId: string): Promise<AnalysisInsights[]>;
  
  // Risk Flags methods
  createRiskFlag(riskFlag: InsertRiskFlag): Promise<RiskFlag>;
  getRiskFlags(analysisId: string): Promise<RiskFlag[]>;
  getRiskFlagsByStartup(startupId: string): Promise<RiskFlag[]>;
  updateRiskFlagStatus(id: string, status: string): Promise<RiskFlag | undefined>;
  
  // Benchmark methods
  getBenchmark(id: string): Promise<Benchmark | undefined>;
  getBenchmarksByIndustry(industry: string, companyStage?: string): Promise<Benchmark[]>;
  createBenchmark(benchmark: InsertBenchmark): Promise<Benchmark>;
  updateBenchmark(id: string, updates: Partial<InsertBenchmark>): Promise<Benchmark | undefined>;
  deleteBenchmark(id: string): Promise<boolean>;
  getAllBenchmarks(): Promise<Benchmark[]>;

  // Document Extraction methods
  createDocumentExtraction(extraction: InsertDocumentExtraction): Promise<DocumentExtraction>;
  getDocumentExtraction(documentId: string): Promise<DocumentExtraction | undefined>;
  
  // Public Data Source methods
  createPublicDataSource(source: InsertPublicDataSource): Promise<PublicDataSource>;
  getPublicDataSources(startupId: string): Promise<PublicDataSource[]>;
  updatePublicDataSource(id: string, updates: Partial<InsertPublicDataSource>): Promise<PublicDataSource | undefined>;
  
  // News Article methods
  createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle>;
  getNewsArticles(startupId: string): Promise<NewsArticle[]>;
  deleteNewsArticle(id: string): Promise<boolean>;
  
  // Research Session methods
  createResearchSession(session: InsertResearchSession): Promise<ResearchSession>;
  getResearchSessions(startupId: string): Promise<ResearchSession[]>;
  getLatestResearchSession(startupId: string): Promise<ResearchSession | undefined>;
  
  // Discrepancy methods
  createDiscrepancy(discrepancy: InsertDiscrepancy): Promise<Discrepancy>;
  getDiscrepancies(analysisId: string): Promise<Discrepancy[]>;
  getDiscrepanciesByStartup(startupId: string): Promise<Discrepancy[]>;
  updateDiscrepancyStatus(id: string, status: string): Promise<Discrepancy | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private startups: Map<string, Startup>;
  private documents: Map<string, Document>;

  constructor() {
    this.users = new Map();
    this.startups = new Map();
    this.documents = new Map();
  }


  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Startup methods
  async getStartup(id: string): Promise<Startup | undefined> {
    return this.startups.get(id);
  }

  async getAllStartups(): Promise<Startup[]> {
    return Array.from(this.startups.values()).sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  async createStartup(insertStartup: InsertStartup): Promise<Startup> {
    const id = randomUUID();
    const now = new Date();
    const startup: Startup = { 
      id,
      name: insertStartup.name,
      industry: insertStartup.industry ?? null,
      stage: insertStartup.stage ?? null,
      foundedYear: insertStartup.foundedYear ?? null,
      location: insertStartup.location ?? null,
      description: insertStartup.description ?? null,
      websiteUrl: insertStartup.websiteUrl ?? null,
      overallScore: insertStartup.overallScore ?? null,
      riskLevel: insertStartup.riskLevel ?? null,
      recommendation: insertStartup.recommendation ?? null,
      analysisData: insertStartup.analysisData ?? null,
      createdAt: now, 
      updatedAt: now 
    };
    this.startups.set(id, startup);
    return startup;
  }

  async updateStartup(id: string, updates: Partial<InsertStartup>): Promise<Startup | undefined> {
    const existing = this.startups.get(id);
    if (!existing) return undefined;
    
    const updated: Startup = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.startups.set(id, updated);
    return updated;
  }

  async deleteStartup(id: string): Promise<boolean> {
    return this.startups.delete(id);
  }

  // Document methods
  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByStartup(startupId: string): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.startupId === startupId)
      .sort((a, b) => {
        const bTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        const aTime = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        return bTime - aTime;
      });
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      id,
      startupId: insertDocument.startupId ?? null,
      fileName: insertDocument.fileName,
      fileType: insertDocument.fileType,
      fileSize: insertDocument.fileSize ?? null,
      extractedText: insertDocument.extractedText ?? null,
      analysisResult: insertDocument.analysisResult ?? null,
      uploadedAt: new Date()
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document | undefined> {
    const existing = this.documents.get(id);
    if (!existing) return undefined;
    
    const updated: Document = {
      ...existing,
      ...updates
    };
    this.documents.set(id, updated);
    return updated;
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }
}

export const storage = new MemStorage();
