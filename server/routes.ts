import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { z } from "zod";
import { storage } from "./storage";
import { DocumentProcessor } from "./documentProcessor";
import { analyzeStartupDocuments, generateIndustryBenchmarks, generateBenchmarkMetrics, generateCustomIndustryBenchmarks, generateChatResponse } from "./gemini";
import { enhancedAnalysisService } from "./enhancedAnalysis";
import { registerHybridResearchRoutes } from "./hybridResearchRoutes"; // NEW: Hybrid research routes
import { startupDueDiligenceService } from "./startupDueDiligence"; // NEW: Public source due diligence
import { exchangeRateService } from "./exchangeRateService"; // NEW: Dynamic exchange rate service
import { insertStartupSchema } from "@shared/schema";

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

// Cache for market trends data (refreshes every hour)
let marketTrendsCache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds (market trends change slowly)

export async function registerRoutes(app: Express): Promise<Server> {
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

  app.get("/api/exchange-rate", async (req: Request, res: Response) => {
    try {
      const rate = await exchangeRateService.refreshIfStale();
      
      res.json({
        rate: rate.rate,
        lastUpdated: rate.lastUpdated,
        source: rate.source,
        message: rate.source === 'api' 
          ? `Live rate from currency API` 
          : `Fallback rate (API unavailable)`
      });
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      const fallbackRate = exchangeRateService.getRate();
      res.json({
        rate: fallbackRate.rate,
        lastUpdated: fallbackRate.lastUpdated,
        source: 'fallback',
        message: 'Using fallback rate due to error'
      });
    }
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

  // Get dashboard summary (optimized lightweight endpoint)
  app.get("/api/dashboard/summary", async (req: Request, res: Response) => {
    try {
      const startups = await storage.getAllStartups();
      
      // Return only essential data for dashboard
      const summary = startups.map((startup: any) => ({
        id: startup.id,
        name: startup.name,
        industry: startup.industry,
        overallScore: startup.overallScore,
        riskLevel: startup.riskLevel,
        recommendation: startup.recommendation,
        createdAt: startup.createdAt,
        // Extract only essential metrics
        metrics: startup.analysisData?.metrics ? {
          marketSize: startup.analysisData.metrics.marketSize || 0,
          traction: startup.analysisData.metrics.traction || 0,
          team: startup.analysisData.metrics.team || 0,
          product: startup.analysisData.metrics.product || 0,
          financials: startup.analysisData.metrics.financials || 0,
          competition: startup.analysisData.metrics.competition || 0
        } : null,
        // Top 3 risk flags only
        topRiskFlags: startup.analysisData?.riskFlags?.slice(0, 3) || [],
        // Investment data only
        investment: {
          targetInvestment: startup.analysisData?.recommendation?.targetInvestment || 0,
          expectedReturn: startup.analysisData?.recommendation?.expectedReturn || 0
        }
      }));
      
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard summary" });
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

  // Analyze startup documents (ONLY document analysis)
  app.post("/api/analyze/:startupId", async (req: Request, res: Response) => {
    try {
      const { startupId } = req.params;
      const { startupName, description, industry, useDeepAnalysis = false } = req.body;
      
      console.log('📊 Starting document analysis for startup:', startupId);
      
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

      // Standard analysis
      analysisResult = await analyzeStartupDocuments(documentData);
      analysisResult.analysisType = 'standard';
      
      console.log('✅ Document analysis completed');

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

  // NEW: Separate endpoint for public data analysis
  app.post("/api/public-data-analysis/:startupId", async (req: Request, res: Response) => {
    try {
      const { startupId } = req.params;
      
      console.log('🌐 Starting public source research for startup:', startupId);
      
      // Get startup
      let startup = await storage.getStartup(startupId);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found" });
      }

      if (!startup.name) {
        return res.status(400).json({ error: "Startup name is required for public data analysis" });
      }

      // Conduct due diligence
      const dueDiligenceResult = await startupDueDiligenceService.conductDueDiligence(startup.name);
      
      console.log('✅ Public source research completed');

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
    // Check cache validity
    const now = Date.now();
    if (marketTrendsCache && (now - marketTrendsCache.timestamp < CACHE_DURATION)) {
      console.log(`✅ Returning cached market trends (age: ${Math.round((now - marketTrendsCache.timestamp) / 1000)}s)`);
      return res.json(marketTrendsCache.data);
    }

    console.log('🔄 Cache expired or empty, generating fresh market trends...');

    const [benchmarks, metrics] = await Promise.all([
      generateIndustryBenchmarks(),
      generateBenchmarkMetrics()
    ]);

    // Calculate average market trends from benchmarks
    const avgScore = benchmarks.reduce((sum, b) => sum + b.avgScore, 0) / benchmarks.length;
    
    // Calculate recommendation directly from data (no AI call needed - saves 3-5 seconds)
    const avgGrowth = benchmarks.reduce((sum, b) => {
      const growthStr = b.growth.replace('%', '').replace('+', '').trim();
      return sum + (parseFloat(growthStr) || 0);
    }, 0) / benchmarks.length;
    
    // Base investment scales with industry performance (₹5Cr to ₹50Cr range)
    const baseInvestment = Math.max(50000000, Math.min(500000000, 
      50000000 + (avgScore - 50) * 1000000 + (avgGrowth * 2000000)
    ));
    
    // Calculate expected return based on score and growth (2x to 6x range)
    const scoreMultiplier = 0.5 + (avgScore / 100);
    const growthMultiplier = Math.min(1.5, avgGrowth / 20);
    const expectedReturn = Math.max(2, Math.min(6, 
      2 + (scoreMultiplier * 2) + (growthMultiplier * 1)
    ));
    
    const recommendation = {
      targetInvestment: Math.round(baseInvestment),
      expectedReturn: Math.round(expectedReturn * 10) / 10 // Round to 1 decimal
    };
    
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

    // Update cache
    marketTrendsCache = {
      data: marketTrends,
      timestamp: now
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

  // NEW: Public Source Due Diligence - Extract data from public sources
  app.post("/api/due-diligence/:startupId", async (req: Request, res: Response) => {
    try {
      const { startupId } = req.params;
      
      console.log(`🔍 Starting public source due diligence for: ${startupId}`);
      
      const startup = await storage.getStartup(startupId);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found" });
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

  // Get due diligence results
  app.get("/api/due-diligence/:startupId", async (req: Request, res: Response) => {
    try {
      const { startupId } = req.params;
      
      const startup = await storage.getStartup(startupId);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found" });
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

  // AI Chatbot endpoint for Q&A
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { startupId, persona, message, context, conversationHistory } = req.body;

      if (!message || !persona) {
        return res.status(400).json({ error: "Message and persona are required" });
      }

      // Build system prompt based on persona
      let systemPrompt = "";
      switch (persona) {
        case "vc":
          systemPrompt = "You are a seasoned Venture Capital analyst with 15+ years of experience. Focus on: scalability, market size, competitive moats, unit economics, burn rate, CAC/LTV ratios, and exit potential. Be analytical, data-driven, and ask tough questions about sustainability.";
          break;
        case "angel":
          systemPrompt = "You are an experienced Angel Investor who backs early-stage founders. Focus on: team quality, founder vision, early traction, MVP validation, product-market fit, and go-to-market strategy. Be supportive but realistic, focus on founder strengths and early signals.";
          break;
        case "combined":
          systemPrompt = "You are an investment advisor combining VC and Angel investor perspectives. Provide balanced analysis considering both metrics AND team quality. Address scalability, financials, team, product, and market opportunity. Give holistic investment recommendations.";
          break;
        default: // general
          systemPrompt = "You are an AI assistant helping analyze startup investments. Provide clear, concise answers about the startup analysis. Be neutral and informative.";
      }

      // Build conversation context
      let conversationContext = `${systemPrompt}\n\n`;
      conversationContext += `STARTUP CONTEXT:\n${JSON.stringify(context, null, 2)}\n\n`;
      
      if (conversationHistory && conversationHistory.length > 0) {
        conversationContext += "PREVIOUS CONVERSATION:\n";
        conversationHistory.forEach((msg: any) => {
          conversationContext += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`;
        });
      }
      
      conversationContext += `\nUser: ${message}\nAssistant:`;

      // Generate response
      const response = await generateChatResponse(conversationContext);

      res.json({ response });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}