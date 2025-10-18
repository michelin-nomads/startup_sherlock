import type { Express, Request, Response } from "express";
import { enhancedReasoningService, deepResearchService } from "./deepResearch";
import { storage } from "./storage";

/**
 * Deep Research Integration Routes
 * 
 * These routes demonstrate how to integrate deep research capabilities
 * into your existing API without user intervention.
 */

export function registerDeepResearchRoutes(app: Express): void {

  /**
   * RECOMMENDED: Enhanced Deep Analysis
   * Uses Gemini 2.5 Pro with enhanced reasoning prompts
   * Works with your existing API key - no special access needed
   */
  app.post("/api/deep-analyze/:startupId", async (req: Request, res: Response) => {
    try {
      const { startupId } = req.params;
      const { analysisType = 'comprehensive' } = req.body;

      console.log(`🧠 Starting deep analysis for startup: ${startupId}`);

      // Get startup and documents
      const startup = await storage.getStartup(startupId);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found" });
      }

      const documents = await storage.getDocumentsByStartup(startupId);
      if (documents.length === 0) {
        return res.status(400).json({ error: "No documents found for analysis" });
      }

      // Prepare documents for analysis
      const documentData = documents.map(doc => ({
        content: doc.extractedText || '',
        type: doc.fileType,
        name: doc.fileName
      }));

      // Perform deep analysis using enhanced reasoning
      const deepAnalysis = await enhancedReasoningService.analyzeWithDeepThinking(
        documentData,
        analysisType as 'comprehensive' | 'financial' | 'market' | 'team'
      );

      // Store results
      await storage.updateStartup(startupId, {
        analysisData: {
          ...(startup.analysisData || {}),
          deepAnalysis,
          deepAnalysisPerformedAt: new Date().toISOString()
        }
      });

      res.json({
        success: true,
        startupId,
        analysisType,
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

  /**
   * Multi-Dimensional Deep Analysis
   * Analyzes startup from financial, market, team perspectives simultaneously
   * Provides most comprehensive insights
   */
  app.post("/api/multi-dimensional-analyze/:startupId", async (req: Request, res: Response) => {
    try {
      const { startupId } = req.params;

      console.log(`🔬 Starting multi-dimensional deep analysis for: ${startupId}`);

      // Get startup and documents
      const startup = await storage.getStartup(startupId);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found" });
      }

      const documents = await storage.getDocumentsByStartup(startupId);
      if (documents.length === 0) {
        return res.status(400).json({ error: "No documents found for analysis" });
      }

      // Prepare documents
      const documentData = documents.map(doc => ({
        content: doc.extractedText || '',
        type: doc.fileType,
        name: doc.fileName
      }));

      // Perform multi-dimensional analysis (runs 4 analyses in parallel)
      const multiDimensionalAnalysis = await enhancedReasoningService.multiDimensionalDeepAnalysis(
        documentData
      );

      // Extract overall score and recommendation from comprehensive analysis
      const overallScore = multiDimensionalAnalysis.comprehensiveAnalysis?.overallScore || 0;
      const recommendation = multiDimensionalAnalysis.comprehensiveAnalysis?.investmentThesis?.recommendation?.decision || 'hold';
      const confidenceLevel = multiDimensionalAnalysis.comprehensiveAnalysis?.confidenceLevel || 'medium';

      // Determine risk level based on scores and red flags
      let riskLevel: 'Low' | 'Medium' | 'High' = 'Medium';
      const financialRedFlags = multiDimensionalAnalysis.detailedDimensions?.financial?.redFlags?.length || 0;
      const teamRedFlags = multiDimensionalAnalysis.detailedDimensions?.team?.redFlags?.length || 0;
      const totalRedFlags = financialRedFlags + teamRedFlags;

      if (totalRedFlags > 3 || overallScore < 60) {
        riskLevel = 'High';
      } else if (totalRedFlags === 0 && overallScore > 80) {
        riskLevel = 'Low';
      }

      // Update startup with comprehensive analysis
      await storage.updateStartup(startupId, {
        overallScore,
        riskLevel,
        recommendation,
        analysisData: {
          ...(startup.analysisData || {}),
          multiDimensionalAnalysis,
          analysisMetadata: {
            type: 'multi_dimensional_deep_research',
            performedAt: new Date().toISOString(),
            confidenceLevel,
            dimensions: ['financial', 'market', 'team', 'comprehensive']
          }
        }
      });

      res.json({
        success: true,
        startupId,
        overallScore,
        riskLevel,
        recommendation,
        confidenceLevel,
        analysis: multiDimensionalAnalysis,
        summary: {
          financialScore: multiDimensionalAnalysis.detailedDimensions?.financial?.overallFinancialScore || 0,
          marketScore: multiDimensionalAnalysis.detailedDimensions?.market?.overallMarketScore || 0,
          teamScore: multiDimensionalAnalysis.detailedDimensions?.team?.overallTeamScore || 0,
          redFlagsCount: totalRedFlags
        },
        message: 'Multi-dimensional deep analysis completed successfully'
      });

    } catch (error) {
      console.error('Multi-dimensional analysis error:', error);
      res.status(500).json({ 
        error: "Failed to perform multi-dimensional analysis",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Discovery Engine Deep Research (Requires Allowlist Access)
   * Only enable this if you have access to Discovery Engine API
   */
  app.post("/api/discovery-research/:startupId", async (req: Request, res: Response) => {
    try {
      const { startupId } = req.params;
      const { query } = req.body;

      // Check if Discovery Engine credentials are configured
      if (!process.env.GOOGLE_CLOUD_PROJECT_ID || 
          !process.env.DISCOVERY_ENGINE_APP_ID || 
          !process.env.GOOGLE_CLOUD_ACCESS_TOKEN) {
        return res.status(503).json({ 
          error: "Discovery Engine not configured",
          message: "This feature requires Google Cloud Discovery Engine API access. Please configure credentials or use /api/deep-analyze instead."
        });
      }

      console.log(`🔬 Starting Discovery Engine research for: ${startupId}`);

      const startup = await storage.getStartup(startupId);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found" });
      }

      // Default query if not provided
      const researchQuery = query || `Conduct comprehensive research on ${startup.name} startup including market analysis, competitive landscape, team background, and financial health.`;

      // Perform deep research using Discovery Engine
      const researchResult = await deepResearchService.conductResearch(researchQuery);

      // Store results
      await storage.updateStartup(startupId, {
        analysisData: {
          ...(startup.analysisData || {}),
          discoveryEngineResearch: researchResult,
          discoveryResearchPerformedAt: new Date().toISOString()
        }
      });

      res.json({
        success: true,
        startupId,
        research: researchResult,
        message: 'Discovery Engine research completed successfully'
      });

    } catch (error) {
      console.error('Discovery Engine research error:', error);
      res.status(500).json({ 
        error: "Failed to perform Discovery Engine research",
        details: error instanceof Error ? error.message : 'Unknown error',
        recommendation: "Consider using /api/deep-analyze or /api/multi-dimensional-analyze instead"
      });
    }
  });

  /**
   * Automatic Deep Analysis on Upload
   * This endpoint uploads documents AND automatically performs deep analysis
   * Perfect for integrating deep research without user intervention
   */
  app.post("/api/upload-and-deep-analyze/:startupId?", async (req: Request, res: Response) => {
    try {
      // Note: This would need to be combined with your existing upload middleware
      // For now, this is a placeholder showing the concept

      const { startupId } = req.params;
      const { autoAnalyze = true, analysisType = 'comprehensive' } = req.body;

      if (!startupId) {
        return res.status(400).json({ error: "Startup ID required" });
      }

      // After documents are uploaded (handled by your existing upload logic)...
      
      if (autoAnalyze) {
        console.log('🤖 Auto-triggering deep analysis after upload...');

        const documents = await storage.getDocumentsByStartup(startupId);
        const documentData = documents.map(doc => ({
          content: doc.extractedText || '',
          type: doc.fileType,
          name: doc.fileName
        }));

        // Automatically run deep analysis
        const deepAnalysis = await enhancedReasoningService.analyzeWithDeepThinking(
          documentData,
          analysisType as any
        );

        await storage.updateStartup(startupId, {
          analysisData: {
            deepAnalysis,
            autoAnalyzed: true,
            analyzedAt: new Date().toISOString()
          }
        });

        res.json({
          success: true,
          startupId,
          documentsUploaded: documents.length,
          analysisCompleted: true,
          analysis: deepAnalysis
        });
      } else {
        res.json({
          success: true,
          startupId,
          analysisCompleted: false,
          message: 'Documents uploaded. Use /api/deep-analyze to run analysis.'
        });
      }

    } catch (error) {
      console.error('Upload and analyze error:', error);
      res.status(500).json({ 
        error: "Failed to upload and analyze",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Get Deep Analysis Results
   * Retrieve existing deep analysis for a startup
   */
  app.get("/api/deep-analysis/:startupId", async (req: Request, res: Response) => {
    try {
      const { startupId } = req.params;

      const startup = await storage.getStartup(startupId);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found" });
      }

      const analysisData = startup.analysisData as any;
      
      const deepAnalysisExists = !!(
        analysisData?.deepAnalysis || 
        analysisData?.multiDimensionalAnalysis ||
        analysisData?.discoveryEngineResearch
      );

      if (!deepAnalysisExists) {
        return res.status(404).json({ 
          error: "No deep analysis found for this startup",
          message: "Use /api/deep-analyze or /api/multi-dimensional-analyze to generate analysis"
        });
      }

      res.json({
        startupId,
        startupName: startup.name,
        deepAnalysis: analysisData.deepAnalysis,
        multiDimensionalAnalysis: analysisData.multiDimensionalAnalysis,
        discoveryEngineResearch: analysisData.discoveryEngineResearch,
        metadata: analysisData.analysisMetadata,
        lastAnalyzed: analysisData.deepAnalysisPerformedAt || 
                      analysisData.analysisMetadata?.performedAt ||
                      startup.updatedAt
      });

    } catch (error) {
      console.error('Get deep analysis error:', error);
      res.status(500).json({ 
        error: "Failed to retrieve deep analysis",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

