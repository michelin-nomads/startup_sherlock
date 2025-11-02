import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { z } from "zod";
import { initDatabaseStorage } from "./storage.database";
import { DocumentProcessor } from "./documentProcessor";
import { authenticate, optionalAuthenticate } from "./authMiddleware"; // Authentication middleware

// Initialize database connection
const storage = initDatabaseStorage(
  process.env.DATABASE_URL || "postgresql://postgres:StartupSherlock2025@localhost:5432/startup_sherlock"
);
import { analyzeStartupDocuments, extractTextFromDocument, generateIndustryBenchmarks, generateBenchmarkMetrics, generateCustomIndustryBenchmarks, generateMarketRecommendation } from "./gemini";
import { enhancedAnalysisService } from "./enhancedAnalysis";
// import { enhancedReasoningService } from "./deepResearch"; // NEW: Deep research capabilities - TODO: Implement this module
import { registerHybridResearchRoutes } from "./hybridResearchRoutes"; // NEW: Hybrid research routes
import { startupDueDiligenceService } from "./startupDueDiligence"; // NEW: Public source due diligence
import { insertStartupSchema, insertDocumentSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit per file
    files: 5, // Max 5 files at once
  },
  fileFilter: (req, file, cb) => {
    // Reject files with path separators in filename
    if (file.originalname.includes('/') || file.originalname.includes('\\') || file.originalname.includes('..')) {
      cb(new Error('Invalid filename'));
      return;
    }
    
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  }
});

const documentProcessor = new DocumentProcessor();

export async function registerRoutes(app: Express): Promise<Server> {
// Health check (public)
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

  // Update user profile (REQUIRES AUTH)
  app.patch("/api/user/profile", authenticate, async (req: Request, res: Response) => {
    try {
      const { displayName } = req.body;
      
      if (!displayName || typeof displayName !== 'string') {
        return res.status(400).json({ error: "displayName is required" });
      }
      
      await storage.updateUserProfile(req.user!.id, {
        displayName: displayName.trim()
      });
      
      console.log(`✅ Updated user profile via API: ${req.user!.email} -> ${displayName}`);
      
      res.json({ success: true, displayName: displayName.trim() });
    } catch (error) {
      console.error("Failed to update user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  
  // Get all startups (REQUIRES AUTH - returns only user's startups)
  app.get("/api/startups", authenticate, async (req: Request, res: Response) => {
    try {
      // SECURITY: Only return startups owned by the authenticated user
      const userStartups = await storage.getStartupsByUser(req.user!.id);
      res.json(userStartups);
    } catch (error) {
      console.error("Failed to fetch user startups:", error);
      res.status(500).json({ error: "Failed to fetch startups" });
    }
  });

  // Get single startup (REQUIRES AUTH + ownership check)
  app.get("/api/startups/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const startup = await storage.getStartup(req.params.id);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found" });
      }
      
      // SECURITY: Verify ownership
      if (startup.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied - you don't own this startup" });
      }
      
      res.json(startup);
    } catch (error) {
      console.error("Failed to fetch startup:", error);
      res.status(500).json({ error: "Failed to fetch startup" });
    }
  });

  // Create new startup (REQUIRES AUTH - automatically links to user)
  app.post("/api/startups", authenticate, async (req: Request, res: Response) => {
    try {
      const validatedData = insertStartupSchema.parse(req.body);
      // SECURITY: Always link to authenticated user, ignore any userId in request
      validatedData.userId = req.user!.id;
      const startup = await storage.createStartup(validatedData);
      res.status(201).json(startup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Failed to create startup:", error);
      res.status(500).json({ error: "Failed to create startup" });
    }
  });

  // Update startup (REQUIRES AUTH + ownership check)
  app.patch("/api/startups/:id", authenticate, async (req: Request, res: Response) => {
    try {
      // SECURITY: First check ownership
      const existing = await storage.getStartup(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Startup not found" });
      }
      if (existing.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied - you don't own this startup" });
      }
      
      const updates = insertStartupSchema.partial().parse(req.body);
      // SECURITY: Prevent userId modification
      delete (updates as any).userId;
      
      const startup = await storage.updateStartup(req.params.id, updates);
      res.json(startup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Failed to update startup:", error);
      res.status(500).json({ error: "Failed to update startup" });
    }
  });

  // Delete startup (REQUIRES AUTH + ownership check)
  app.delete("/api/startups/:id", authenticate, async (req: Request, res: Response) => {
    try {
      // SECURITY: First check ownership
      const existing = await storage.getStartup(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Startup not found" });
      }
      if (existing.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied - you don't own this startup" });
      }
      
      const success = await storage.deleteStartup(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete startup:", error);
      res.status(500).json({ error: "Failed to delete startup" });
    }
  });

  // Upload documents for analysis (REQUIRES AUTH)
  app.post(
    "/api/upload/:startupId?",
    authenticate,
    upload.array('documents', 10) as any,
    async (req, res) => {
      try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
          return res.status(400).json({ error: "No files uploaded" });
      }

      const { startupName, description, industry } = req.body;
      let startupId = req.params.startupId;

      // If startupId provided, verify ownership
      if (startupId) {
        const existing = await storage.getStartup(startupId);
        if (!existing) {
          return res.status(404).json({ error: "Startup not found" });
        }
        // SECURITY: Verify ownership
        if (existing.userId !== req.user!.id) {
          return res.status(403).json({ error: "Access denied - you don't own this startup" });
        }
      } else {
        // Create startup if not provided
        // SECURITY: Always link to authenticated user
        const tempName = startupName || `Startup_${Date.now()}`;
        
        // UNIQUENESS CHECK: Ensure startup name is unique for this user
        const userStartups = await storage.getStartupsByUser(req.user!.id);
        const nameExists = userStartups.some(
          s => s.name.toLowerCase() === tempName.toLowerCase()
        );
        
        if (nameExists) {
          return res.status(400).json({ 
            error: "Duplicate startup name", 
            message: `You already have a startup named "${tempName}". Please use a different name.` 
          });
        }
        
        const newStartup = await storage.createStartup({
          name: tempName,
          description: description || null,
          industry: industry || null,
          stage: null,
          foundedYear: null,
          location: null,
          websiteUrl: null,
          overallScore: null,
          riskLevel: null,
          recommendation: null,
          analysisData: null,
          userId: req.user!.id, // Always link to authenticated user
        });
        startupId = newStartup.id;
      }

      // Get startup details for GCS path
      const startup = await storage.getStartup(startupId);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found" });
      }

      // Process uploaded files
      const processedDocs = [];
      for (const file of files) {
        try {
          // Pass userEmail, startupName, userId, startupId for organized GCS storage
          const processed = await documentProcessor.processUploadedFile(
            file,
            req.user!.email,
            startup.name,
            req.user!.id,
            startupId
          );
          
          // Save document to storage
          const document = await storage.createDocument({
            startupId,
            fileName: processed.originalName,
            fileType: processed.mimeType,
            fileSize: processed.size,
            gcsUrl: processed.gcsUrl || null, // Save GCS URL
            extractedText: processed.extractedText,
            analysisResult: null
          });

          // Save document extraction (large text) to separate table
          if (processed.extractedText) {
            await storage.createDocumentExtraction({
              documentId: document.id,
              extractedText: processed.extractedText,
              wordCount: processed.extractedText.split(/\s+/).length,
              pageCount: null, // Could be extracted from PDF metadata
              extractedData: null,
              extractionMethod: 'pdf-parse',
              language: 'en',
            });
            console.log(`📝 Saved extraction for document: ${document.id}`);
          }

          processedDocs.push({
            id: document.id,
            name: processed.originalName,
            size: processed.size,
            type: processed.mimeType,
            extractedText: processed.extractedText
          });
        } catch (error) {
          console.error('Error processing file:', file.originalname, error);
        }
      }

      res.json({
        startupId,
        uploadedDocuments: processedDocs,
        message: `Successfully uploaded ${processedDocs.length} documents`
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: "Failed to upload documents" });
    }
  });

  // Analyze startup documents (ONLY document analysis)
  // Analyze startup documents (REQUIRES AUTH + ownership check)
  app.post("/api/analyze/:startupId", authenticate, async (req: Request, res: Response) => {
    try {
      const { startupId } = req.params;
      const { startupName, description, industry, useDeepAnalysis = false } = req.body;
      
      console.log('📊 Starting document analysis for startup:', startupId);
      
      // Get startup and its documents
      const startup = await storage.getStartup(startupId);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found" });
      }
      
      // SECURITY: Verify ownership
      if (startup.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied - you don't own this startup" });
      }

      // Update startup name, description, and industry if provided
      if (startupName || description || industry) {
        await storage.updateStartup(startupId, {
          name: startupName || startup.name,
          description: description || startup.description,
          industry: industry || startup.industry
        });
      }

      const documents = await storage.getDocumentsByStartup(startupId);
      if (documents.length === 0) {
        return res.status(400).json({ error: "No documents found for analysis" });
      }

      // Prepare documents for AI analysis
      const documentData = documents.map(doc => ({
        content: doc.extractedText || '',
        type: doc.fileType,
        name: doc.fileName
      }));

      let analysisResult: any;

      // Analyze documents
      analysisResult = await analyzeStartupDocuments(documentData);
      analysisResult.analysisType = 'standard';

      console.log('✅ Document analysis completed');

      // Create analysis record in database
      const analysis = await storage.createAnalysis({
        startupId,
        analysisType: analysisResult.analysisType || 'standard',
        overallScore: analysisResult.overallScore.toString(),
        riskLevel: analysisResult.riskLevel,
        recommendation: analysisResult.recommendation.decision,
        recommendationReasoning: analysisResult.recommendation.reasoning,
        targetInvestmentAmount: analysisResult.recommendation.targetInvestment?.toString(),
        expectedReturnMultiple: analysisResult.recommendation.expectedReturn?.toString(),
        completedAt: new Date(),
      });

      console.log('📊 Created analysis record:', analysis.id);

      // Save analysis metrics to database
      if (analysisResult.metrics) {
        await storage.createAnalysisMetrics({
          analysisId: analysis.id,
          marketSizeScore: analysisResult.metrics.marketSize?.toString(),
          tractionScore: analysisResult.metrics.traction?.toString(),
          teamScore: analysisResult.metrics.team?.toString(),
          productScore: analysisResult.metrics.product?.toString(),
          financialsScore: analysisResult.metrics.financials?.toString(),
          competitionScore: analysisResult.metrics.competition?.toString(),
        });
        console.log('📈 Saved analysis metrics');
      }

      // Save key insights to database
      if (analysisResult.keyInsights && Array.isArray(analysisResult.keyInsights)) {
        for (const insight of analysisResult.keyInsights) {
          await storage.createAnalysisInsight({
            analysisId: analysis.id,
            description: insight,
            importance: 'high',
          });
        }
        console.log(`💡 Saved ${analysisResult.keyInsights.length} insights`);
      }

      // Save risk flags to database
      if (analysisResult.riskFlags && Array.isArray(analysisResult.riskFlags)) {
        for (const flag of analysisResult.riskFlags) {
          await storage.createRiskFlag({
            analysisId: analysis.id,
            startupId,
            severity: flag.type,
            category: flag.category,
            title: flag.category,
            description: flag.description,
            impact: flag.impact,
            status: 'open',
          });
        }
        console.log(`🚩 Saved ${analysisResult.riskFlags.length} risk flags`);
      }

      // Update startup with latest analysis summary
      const updatedStartup = await storage.updateStartup(startupId, {
        overallScore: analysisResult.overallScore,
        riskLevel: analysisResult.riskLevel,
        recommendation: analysisResult.recommendation.decision,
        analysisData: analysisResult
      });

      console.log('✅ All analysis data saved to database');

      res.json({
        startup: updatedStartup,
        analysis: analysisResult,
        analysisId: analysis.id,
        analysisType: analysisResult.analysisType
      });
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: "Failed to analyze startup" });
    }
  });

  // NEW: Separate endpoint for public data analysis
  // Public data analysis (REQUIRES AUTH + ownership check)
  app.post("/api/public-data-analysis/:startupId", authenticate, async (req: Request, res: Response) => {
    try {
      const { startupId } = req.params;
      
      console.log('🌐 Starting public source research for startup:', startupId);
      
      // Get startup
      let startup = await storage.getStartup(startupId);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found" });
      }
      
      // SECURITY: Verify ownership
      if (startup.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied - you don't own this startup" });
      }

      if (!startup.name) {
        return res.status(400).json({ error: "Startup name is required for public data analysis" });
      }

      // Conduct due diligence
      const dueDiligenceResult = await startupDueDiligenceService.conductDueDiligence(startup.name);
      
      console.log('✅ Public source research completed');

      // Save public data sources to database (if available in result)
      const resultWithSources = dueDiligenceResult as any;
      if (resultWithSources.sources && Array.isArray(resultWithSources.sources)) {
        for (const source of resultWithSources.sources) {
          try {
            await storage.createPublicDataSource({
              startupId,
              sourceType: source.type || 'web',
              sourceName: source.name || source.url,
              sourceUrl: source.url,
              dataExtracted: source.data || null,
              extractionDate: new Date(),
              isVerified: source.verified ? 1 : 0,
              confidenceScore: source.confidence?.toString(),
              status: 'active',
            });
          } catch (err) {
            console.error('Failed to save public data source:', err);
          }
        }
        console.log(`🌐 Saved ${resultWithSources.sources.length} public data sources`);
      }

      // Save news articles from recent developments (if available)
      const recentDevAsAny = dueDiligenceResult.recentDevelopments as any;
      if (recentDevAsAny?.newsArticles && Array.isArray(recentDevAsAny.newsArticles)) {
        for (const article of recentDevAsAny.newsArticles) {
          try {
            await storage.createNewsArticle({
              startupId,
              title: article.title || article.headline || 'News Article',
              url: article.url || article.link || '',
              source: article.source || 'Unknown',
              publishedAt: article.date ? new Date(article.date) : null,
              summary: article.summary || article.description || null,
              sentiment: article.sentiment || 'neutral',
              sentimentScore: null,
              relevanceScore: null,
            });
          } catch (err) {
            console.error('Failed to save news article:', err);
          }
        }
        console.log(`📰 Saved ${recentDevAsAny.newsArticles.length} news articles`);
      }

      // Re-fetch startup to get the latest data (in case document analysis completed in parallel)
      startup = await storage.getStartup(startupId);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found after re-fetch" });
      }

      // Update startup with public data - merge with existing analysis data
      const existingAnalysisData = startup.analysisData as any || {};
      const updatedAnalysisData = {
        ...existingAnalysisData,
        publicSourceDueDiligence: dueDiligenceResult,
        lastDueDiligenceAt: new Date().toISOString()
      };

      await storage.updateStartup(startupId, {
        analysisData: updatedAnalysisData
      });

      res.json({
        startupId,
        startupName: startup.name,
        publicData: dueDiligenceResult,
        lastUpdated: new Date().toISOString(),
        success: true
      });
    } catch (error: any) {
      console.error('⚠️ Public source research failed:', error.message);
      res.status(500).json({ 
        error: "Failed to conduct public data analysis",
        message: error.message,
        success: false
      });
    }
  });

  // NEW: Deep Analysis Endpoint (automatic deep reasoning)
  app.post("/api/deep-analyze/:startupId", async (req: Request, res: Response) => {
    try {
      const { startupId } = req.params;
      const { analysisType = 'comprehensive' } = req.body;

      console.log(`⚠️ Deep analysis not yet implemented - using standard analysis for startup: ${startupId}`);

      const startup = await storage.getStartup(startupId);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found" });
      }

      const documents = await storage.getDocumentsByStartup(startupId);
      if (documents.length === 0) {
        return res.status(400).json({ error: "No documents found for analysis" });
      }

      const documentData = documents.map(doc => ({
        content: doc.extractedText || '',
        type: doc.fileType,
        name: doc.fileName
      }));

      // Analyze documents
      const analysisResult = await analyzeStartupDocuments(documentData);

      // Extract scores for storage
      const overallScore = analysisResult.overallScore || 0;
      const riskLevel = analysisResult.riskLevel || 'Medium';
      const recommendation = analysisResult.recommendation?.decision || 'hold';

      // Update startup
      await storage.updateStartup(startupId, {
        overallScore,
        riskLevel,
        recommendation,
        analysisData: {
          ...analysisResult,
          analysisType: 'standard',
          analyzedAt: new Date().toISOString()
        }
      });

      res.json({
        success: true,
        startupId,
        analysisType: 'standard',
        overallScore,
        riskLevel,
        recommendation,
        analysis: analysisResult,
        message: 'Analysis completed successfully (deep analysis not yet implemented)'
      });

    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ 
        error: "Failed to perform analysis",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get startup analysis
  app.get("/api/analysis/:startupId", async (req: Request, res: Response) => {
    try {
      const startup = await storage.getStartup(req.params.startupId);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found" });
      }

      const documents = await storage.getDocumentsByStartup(req.params.startupId);

      // Extract analysis data - handle both old and new structure
      let analysisData = startup.analysisData;
      
      // If analysisData has publicSourceDueDiligence, it means we have the merged structure
      // We need to extract just the document analysis fields (not the publicSourceDueDiligence)
      if (analysisData && typeof analysisData === "object") {
        const { publicSourceDueDiligence, lastDueDiligenceAt, ...documentAnalysis } = analysisData as any;
        
        // Use the document analysis fields for the main analysis
        analysisData = documentAnalysis;
      }

      const response: any = {
        startup,
        documents,
        analysis: analysisData || {}
      };

      // Include enhanced analysis data if available
      if (
        startup.analysisData &&
        typeof startup.analysisData === "object"
      ) {
        if ("publicDataAnalysis" in startup.analysisData) {
          response.publicDataAnalysis = (startup.analysisData as any).publicDataAnalysis;
        }
        if ("discrepancyAnalysis" in startup.analysisData) {
          response.discrepancyAnalysis = (startup.analysisData as any).discrepancyAnalysis;
        }
        if ("overallAssessment" in startup.analysisData) {
          response.overallAssessment = (startup.analysisData as any).overallAssessment;
        }
      }

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  // Get documents for a startup
  app.get("/api/documents/:startupId", async (req: Request, res: Response) => {
    try {
      const documents = await storage.getDocumentsByStartup(req.params.startupId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteDocument(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Generate industry benchmarks using Gemini AI with fallback models
  app.get("/api/benchmarks", async (req: Request, res: Response) => {
    try {
      // Check if benchmarks exist in database
      const existingBenchmarks = await storage.getAllBenchmarks();
      
      // If we have recent benchmarks (less than 7 days old), return them
      if (existingBenchmarks.length > 0) {
        const latestBenchmark = existingBenchmarks[0];
        const isRecent = latestBenchmark.createdAt && 
          (new Date().getTime() - new Date(latestBenchmark.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
        
        if (isRecent) {
          console.log('📊 Returning cached benchmarks from database');
          // Format the benchmarks to match the expected structure
          const formattedBenchmarks = existingBenchmarks.map(b => {
            const metrics = (b.metrics as any) || {};
            return {
              industry: b.industry,
              avgScore: metrics.avgScore || 0,
              ...(typeof metrics === 'object' ? metrics : {})
            };
          });
          return res.json(formattedBenchmarks);
        }
      }

      // Generate new benchmarks
      console.log('🔄 Generating fresh benchmarks...');
      const benchmarks = await generateIndustryBenchmarks();
      
      // Save each benchmark to database
      for (const benchmark of benchmarks) {
        try {
          await storage.createBenchmark({
            industry: benchmark.industry,
            companyStage: null,
            companySize: null,
            metrics: benchmark,
            dataSource: 'Gemini AI',
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          });
        } catch (err) {
          console.error(`Failed to save benchmark for ${benchmark.industry}:`, err);
        }
      }
      
      console.log(`✅ Saved ${benchmarks.length} benchmarks to database`);
      res.json(benchmarks);
    } catch (error) {
      console.error('Benchmarks generation error:', error);
      res.status(500).json({ error: "Failed to generate benchmarks" });
    }
  });

  // Generate custom industry benchmarks based on selected industries and company size
  app.get("/api/benchmarks/custom", async (req: Request, res: Response) => {
    try {
      const { industries, companySize } = req.query;
      
      if (!industries || !companySize) {
        return res.status(400).json({ 
          error: "Missing required parameters: industries and companySize" 
        });
      }

      const industriesArray = Array.isArray(industries) ? industries : [industries];
      const size = companySize as string;

      console.log(`🎯 Generating custom benchmarks for industries: ${industriesArray.join(', ')}, size: ${size}`);
      
      const benchmarks = await generateCustomIndustryBenchmarks(industriesArray as string[], size);
      
      // Save custom benchmarks to database
      for (const benchmark of benchmarks) {
        try {
          await storage.createBenchmark({
            industry: benchmark.industry,
            companyStage: null,
            companySize: size,
            metrics: benchmark,
            dataSource: 'Gemini AI - Custom',
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          });
        } catch (err) {
          console.error(`Failed to save custom benchmark for ${benchmark.industry}:`, err);
        }
      }
      
      console.log(`✅ Saved ${benchmarks.length} custom benchmarks to database`);
      res.json(benchmarks);
    } catch (error) {
      console.error('Custom benchmarks generation error:', error);
      res.status(500).json({ error: "Failed to generate custom benchmarks" });
    }
  });

  // Generate benchmark metrics using Gemini AI with fallback models
app.get("/api/benchmark-metrics", async (req: Request, res: Response) => {
  try {
    const metrics = await generateBenchmarkMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Benchmark metrics generation error:', error);
    res.status(500).json({ error: "Failed to generate benchmark metrics" });
  }
});

// Market trends for analysis comparison
app.get("/api/market-trends", async (req: Request, res: Response) => {
  try {
    const [benchmarks, metrics] = await Promise.all([
      generateIndustryBenchmarks(),
      generateBenchmarkMetrics()
    ]);

    // Generate dynamic recommendation using Gemini
    const recommendation = await generateMarketRecommendation(benchmarks, metrics);

    // Calculate average market trends from benchmarks
    const avgScore = benchmarks.reduce((sum, b) => sum + b.avgScore, 0) / benchmarks.length;
    
    // Create market trend data structure
    const marketTrends = {
      overallScore: Math.round(avgScore),
      metrics: {
        marketSize: Math.round(metrics.marketPenetration.value),
        traction: Math.round(metrics.revenueGrowth.value / 2), // Scale down for 0-100 range
        team: Math.round(metrics.teamExperience.value),
        product: Math.round(metrics.marketPenetration.value * 0.9), // Slightly lower than market penetration
        financials: Math.round(metrics.burnRateEfficiency.value),
        competition: Math.round(100 - metrics.marketPenetration.value * 0.8) // Inverse of market penetration
      },
      recommendation: {
        targetInvestment: recommendation.targetInvestment,
        expectedReturn: recommendation.expectedReturn
      }
    };

    res.json(marketTrends);
  } catch (error) {
    console.error('Market trends generation error:', error);
    res.status(500).json({ error: "Failed to generate market trends" });
  }
});

// Get industry-specific risks
app.get("/api/industry-risks/:industry", async (req: Request, res: Response) => {
  try {
    const { industry } = req.params;
    
    // Return mock industry risks for now
    const industryRisks = {
      risks: [
        {
          type: 'medium',
          category: 'Market Risk',
          description: `${industry} market volatility and competition`,
          impact: 'Moderate impact on growth potential'
        },
        {
          type: 'low',
          category: 'Technology Risk',
          description: 'Standard technology adoption challenges',
          impact: 'Minor impact on implementation timeline'
        }
      ]
    };
    res.json(industryRisks);
  } catch (error) {
    console.error('Industry risks generation error:', error);
    res.status(500).json({ error: "Failed to generate industry risks" });
  }
});

// Enhanced Analysis with Manual Source Input (REQUIRES AUTH + ownership check)
app.post("/api/enhanced-analysis", authenticate, async (req: Request, res: Response) => {
  try {
    const { startupId, websites } = req.body;
    
    // SECURITY: Verify ownership of the startup
    const startup = await storage.getStartup(startupId);
    if (!startup) {
      return res.status(404).json({ error: "Startup not found" });
    }
    if (startup.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied - you don't own this startup" });
    }
    
    if (!startupId) {
      return res.status(400).json({ error: "Startup ID is required" });
    }

    // Get documents (startup already fetched and verified above)
    const documents = await storage.getDocumentsByStartup(startupId);
    if (!documents || documents.length === 0) {
      return res.status(400).json({ error: "No documents found for analysis" });
    }

    // Process documents for analysis
    const processedDocuments = documents.map((doc: any) => ({
      content: doc.extractedText || '',
      type: doc.fileType,
      name: doc.fileName
    }));

    // Perform enhanced analysis with manual source input
    const enhancedAnalysis = await enhancedAnalysisService.performEnhancedAnalysis(
      processedDocuments,
      startup.name,
      websites || []
    );

    // Merge with existing analysis data if it exists
    const existingAnalysisData = startup.analysisData;
    let mergedAnalysisData = enhancedAnalysis;

    if (existingAnalysisData && (existingAnalysisData as any).publicDataAnalysis) {
      // Merge public data analysis
      mergedAnalysisData = {
        ...enhancedAnalysis,
        publicDataAnalysis: {
          ...(existingAnalysisData as any).publicDataAnalysis,
          // Merge discovered sources
          discoveredSources: {
            ...(existingAnalysisData as any).publicDataAnalysis.discoveredSources,
            ...enhancedAnalysis.publicDataAnalysis.discoveredSources
          },
          lastUpdated: new Date().toISOString()
        }
      };
    }

    // Save discrepancies to database if they exist
    if (enhancedAnalysis.discrepancyAnalysis && enhancedAnalysis.discrepancyAnalysis.discrepancies) {
      const discrepancies = enhancedAnalysis.discrepancyAnalysis.discrepancies;
      const analysisId = enhancedAnalysis.analysisId;
      
      // Get or create analysis record
      let dbAnalysisId = analysisId;
      try {
        const dbAnalysis = await storage.createAnalysis({
          startupId,
          analysisType: 'enhanced',
          overallScore: enhancedAnalysis.overallAssessment.overallScore.toString(),
          riskLevel: enhancedAnalysis.overallAssessment.riskLevel,
          recommendation: enhancedAnalysis.overallAssessment.recommendation,
          completedAt: new Date(),
        });
        dbAnalysisId = dbAnalysis.id;
        console.log(`📊 Created enhanced analysis record: ${dbAnalysisId}`);
      } catch (err) {
        console.error('Failed to create analysis record:', err);
      }

      // Save each discrepancy
      for (const disc of discrepancies) {
        try {
          const discAsAny = disc as any;
          await storage.createDiscrepancy({
            analysisId: dbAnalysisId,
            startupId,
            discrepancyType: discAsAny.category || 'general',
            severity: discAsAny.severity || 'medium',
            field: discAsAny.field || null,
            documentValue: typeof discAsAny.documentValue === 'string' ? discAsAny.documentValue : String(discAsAny.documentValue || ''),
            publicValue: typeof discAsAny.publicValue === 'string' ? discAsAny.publicValue : String(discAsAny.publicValue || ''),
            description: discAsAny.description || 'Discrepancy found',
            impact: discAsAny.potentialImpact || discAsAny.impact || null,
            sources: discAsAny.sources || null,
            status: 'open',
          });
        } catch (err) {
          console.error('Failed to save discrepancy:', err);
        }
      }
      console.log(`🚨 Saved ${discrepancies.length} discrepancies to database`);
    }

    // Store enhanced analysis result
    const updateData: any = {
      ...startup,
      analysisData: mergedAnalysisData,
      overallScore: mergedAnalysisData.overallAssessment.overallScore,
      riskLevel: mergedAnalysisData.overallAssessment.riskLevel,
      recommendation: mergedAnalysisData.overallAssessment.recommendation
    };
    // Remove null userId to avoid type errors
    if (updateData.userId === null) {
      delete updateData.userId;
    }
    await storage.updateStartup(startupId, updateData);

    res.json(mergedAnalysisData);
  } catch (error) {
    console.error('Enhanced analysis error:', error);
    res.status(500).json({ error: "Failed to perform enhanced analysis" });
  }
});

  // NEW: Public Source Due Diligence - Extract data from public sources (REQUIRES AUTH + ownership check)
  app.post("/api/due-diligence/:startupId", authenticate, async (req: Request, res: Response) => {
    try {
      const { startupId } = req.params;
      
      console.log(`🔍 Starting public source due diligence for: ${startupId}`);
      
      const startup = await storage.getStartup(startupId);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found" });
      }
      
      // SECURITY: Verify ownership
      if (startup.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied - you don't own this startup" });
      }
      
      // Conduct comprehensive due diligence
      const dueDiligence = await startupDueDiligenceService.conductDueDiligence(startup.name);
      
      // Save due diligence results
      const updatedAnalysisData = {
        ...(startup.analysisData as any || {}),
        publicSourceDueDiligence: dueDiligence,
        lastDueDiligenceAt: new Date().toISOString()
      };
      
      await storage.updateStartup(startupId, {
        analysisData: updatedAnalysisData
      });
      
      res.json({
        success: true,
        startupId,
        startupName: startup.name,
        dueDiligence,
        documentAnalysis: updatedAnalysisData,
        lastDueDiligence: updatedAnalysisData.lastDueDiligenceAt,
        message: 'Public source due diligence completed successfully'
      });
      
    } catch (error) {
      console.error('Due diligence error:', error);
      res.status(500).json({ 
        error: "Failed to conduct due diligence",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get due diligence results (REQUIRES AUTH + ownership check)
  app.get("/api/due-diligence/:startupId", authenticate, async (req: Request, res: Response) => {
    try {
      const { startupId } = req.params;
      
      const startup = await storage.getStartup(startupId);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found" });
      }
      
      // SECURITY: Verify ownership
      if (startup.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied - you don't own this startup" });
      }
      
      const analysisData = startup.analysisData as any;
      const dueDiligence = analysisData?.publicSourceDueDiligence;
      
      if (!dueDiligence) {
        return res.status(404).json({ 
          error: "No due diligence data found",
          message: "Use POST /api/due-diligence/:startupId to generate"
        });
      }
      
      res.json({
        startupId,
        startupName: startup.name,
        dueDiligence,
        lastDueDiligence: analysisData.lastDueDiligenceAt,
        documentAnalysis: analysisData // Include for comparison
      });
      
    } catch (error) {
      console.error('Get due diligence error:', error);
      res.status(500).json({ 
        error: "Failed to retrieve due diligence",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // NEW: Register Hybrid Research Routes (Gemini Grounding + Custom Search)
  registerHybridResearchRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}