import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { z } from "zod";
import { storage } from "./storage";
import { DocumentProcessor } from "./documentProcessor";
import { analyzeStartupDocuments, extractTextFromDocument, generateIndustryBenchmarks, generateBenchmarkMetrics, generateCustomIndustryBenchmarks, generateMarketRecommendation } from "./gemini";
import { enhancedAnalysisService } from "./enhancedAnalysis";
import { enhancedReasoningService } from "./deepResearch"; // NEW: Deep research capabilities
import { registerHybridResearchRoutes } from "./hybridResearchRoutes"; // NEW: Hybrid research routes
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
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
  // Get all startups
  app.get("/api/startups", async (req: Request, res: Response) => {
    try {
      const startups = await storage.getAllStartups();
      res.json(startups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch startups" });
    }
  });

  // Get single startup
  app.get("/api/startups/:id", async (req: Request, res: Response) => {
    try {
      const startup = await storage.getStartup(req.params.id);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found" });
      }
      res.json(startup);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch startup" });
    }
  });

  // Create new startup
  app.post("/api/startups", async (req: Request, res: Response) => {
    try {
      const validatedData = insertStartupSchema.parse(req.body);
      const startup = await storage.createStartup(validatedData);
      res.status(201).json(startup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create startup" });
    }
  });

  // Update startup
  app.patch("/api/startups/:id", async (req: Request, res: Response) => {
    try {
      const updates = insertStartupSchema.partial().parse(req.body);
      const startup = await storage.updateStartup(req.params.id, updates);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found" });
      }
      res.json(startup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update startup" });
    }
  });

  // Delete startup
  app.delete("/api/startups/:id", async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteStartup(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Startup not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete startup" });
    }
  });

  // Upload documents for analysis
  app.post(
    "/api/upload/:startupId?",
    upload.array('documents', 10) as any,
    async (req, res) => {
      try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
          return res.status(400).json({ error: "No files uploaded" });
      }

      const { startupName, description, industry } = req.body;
      let startupId = req.params.startupId;

      // Create startup if not provided
      if (!startupId) {
        // Create a temporary startup with a generated name if no name provided
        const tempName = startupName || `Startup_${Date.now()}`;
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
          analysisData: null
        });
        startupId = newStartup.id;
      }

      // Process uploaded files
      const processedDocs = [];
      for (const file of files) {
        try {
          const processed = await documentProcessor.processUploadedFile(file);
          
          // Save document to storage
          const document = await storage.createDocument({
            startupId,
            fileName: processed.originalName,
            fileType: processed.mimeType,
            fileSize: processed.size,
            extractedText: processed.extractedText,
            analysisResult: null
          });

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

  // Analyze startup documents
  app.post("/api/analyze/:startupId", async (req: Request, res: Response) => {
    try {
      const { startupId } = req.params;
      const { startupName, description, industry, useDeepAnalysis = false } = req.body;
      
      // Get startup and its documents
      const startup = await storage.getStartup(startupId);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found" });
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

      // NEW: Use deep analysis if requested
      if (useDeepAnalysis) {
        console.log('🧠 Using enhanced deep reasoning analysis...');
        analysisResult = await enhancedReasoningService.analyzeWithDeepThinking(
          documentData,
          'comprehensive'
        );
        
        // Transform deep analysis to match existing format
        analysisResult = {
          overallScore: analysisResult.overallScore || 0,
          riskLevel: analysisResult.confidenceLevel === 'high' ? 'Low' : 
                     analysisResult.confidenceLevel === 'low' ? 'High' : 'Medium',
          recommendation: {
            decision: analysisResult.investmentThesis?.recommendation?.decision || 'hold',
            reasoning: analysisResult.investmentThesis?.recommendation?.reasoning || '',
            targetInvestment: 0,
            expectedReturn: 0
          },
          metrics: analysisResult.riskAdjustedScores ? {
            marketSize: analysisResult.riskAdjustedScores.market?.baseScore || 0,
            traction: analysisResult.riskAdjustedScores.traction?.baseScore || 0,
            team: analysisResult.riskAdjustedScores.team?.baseScore || 0,
            product: analysisResult.riskAdjustedScores.product?.baseScore || 0,
            financials: analysisResult.riskAdjustedScores.financials?.baseScore || 0,
            competition: 0
          } : { marketSize: 0, traction: 0, team: 0, product: 0, financials: 0, competition: 0 },
          keyInsights: analysisResult.deepInsights?.map((i: any) => i.insight) || [],
          riskFlags: [],
          deepAnalysis: analysisResult, // Store full deep analysis
          analysisType: 'deep_reasoning'
        };
      } else {
        // Standard analysis
        analysisResult = await analyzeStartupDocuments(documentData);
        analysisResult.analysisType = 'standard';
      }

      // Update startup with analysis results
      const updatedStartup = await storage.updateStartup(startupId, {
        overallScore: analysisResult.overallScore,
        riskLevel: analysisResult.riskLevel,
        recommendation: analysisResult.recommendation.decision,
        analysisData: analysisResult
      });

      res.json({
        startup: updatedStartup,
        analysis: analysisResult,
        analysisType: analysisResult.analysisType
      });
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: "Failed to analyze startup" });
    }
  });

  // NEW: Deep Analysis Endpoint (automatic deep reasoning)
  app.post("/api/deep-analyze/:startupId", async (req: Request, res: Response) => {
    try {
      const { startupId } = req.params;
      const { analysisType = 'comprehensive' } = req.body;

      console.log(`🧠 Starting deep analysis for startup: ${startupId}`);

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

      // Perform deep analysis
      const deepAnalysis = await enhancedReasoningService.analyzeWithDeepThinking(
        documentData,
        analysisType as 'comprehensive' | 'financial' | 'market' | 'team'
      );

      // Extract scores for storage
      const overallScore = deepAnalysis.overallScore || 0;
      const riskLevel = deepAnalysis.confidenceLevel === 'high' ? 'Low' : 
                       deepAnalysis.confidenceLevel === 'low' ? 'High' : 'Medium';
      const recommendation = deepAnalysis.investmentThesis?.recommendation?.decision || 'hold';

      // Update startup
      await storage.updateStartup(startupId, {
        overallScore,
        riskLevel,
        recommendation,
        analysisData: {
          ...deepAnalysis,
          analysisType: 'deep_reasoning',
          analyzedAt: new Date().toISOString()
        }
      });

      res.json({
        success: true,
        startupId,
        analysisType,
        overallScore,
        riskLevel,
        recommendation,
        analysis: deepAnalysis,
        message: 'Deep analysis completed successfully'
      });

    } catch (error) {
      console.error('Deep analysis error:', error);
      res.status(500).json({ 
        error: "Failed to perform deep analysis",
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

      const response: any = {
        startup,
        documents,
        analysis: (startup.analysisData as any)?.documentAnalysis || startup.analysisData
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
      const benchmarks = await generateIndustryBenchmarks();
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

// Enhanced Analysis with Manual Source Input
app.post("/api/enhanced-analysis", async (req: Request, res: Response) => {
  try {
    const { startupId, websites } = req.body;
    
    if (!startupId) {
      return res.status(400).json({ error: "Startup ID is required" });
    }

    // Get startup and documents
    const startup = await storage.getStartup(startupId);
    if (!startup) {
      return res.status(404).json({ error: "Startup not found" });
    }

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

    // Store enhanced analysis result
    await storage.updateStartup(startupId, {
      ...startup,
      analysisData: mergedAnalysisData,
      overallScore: mergedAnalysisData.overallAssessment.overallScore,
      riskLevel: mergedAnalysisData.overallAssessment.riskLevel,
      recommendation: mergedAnalysisData.overallAssessment.recommendation
    });

    res.json(mergedAnalysisData);
  } catch (error) {
    console.error('Enhanced analysis error:', error);
    res.status(500).json({ error: "Failed to perform enhanced analysis" });
  }
});

  // NEW: Register Hybrid Research Routes (Gemini Grounding + Custom Search)
  registerHybridResearchRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}