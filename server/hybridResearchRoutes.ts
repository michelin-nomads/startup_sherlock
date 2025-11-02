import type { Express, Request, Response } from "express";
import { hybridResearchService } from "./hybridResearch";
import { initDatabaseStorage } from "./storage.database";

// Initialize database storage
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}
const storage = initDatabaseStorage(process.env.DATABASE_URL);

/**
 * Hybrid Research Routes
 * 
 * FREE services using:
 * - Gemini with Web Grounding (FREE tier)
 * - Google Custom Search API (100 queries/day FREE)
 * - No allowlist required!
 */

export function registerHybridResearchRoutes(app: Express): void {

  /**
   * Generic research endpoint - searches anything
   * Perfect for testing and general queries
   */
  app.post("/api/hybrid-research/search", async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }
      
      console.log(`🔍 Hybrid research request: "${query}"`);
      
      const startTime = Date.now();
      const result = await hybridResearchService.conductResearch(query);
      const processingTime = Math.floor((Date.now() - startTime) / 1000);

      // Save research session to database
      try {
        await storage.createResearchSession({
          startupId: null,
          query,
          researchType: 'hybrid',
          groundedAnalysis: result.groundedAnalysis,
          customSearchResults: result.customSearchResults,
          synthesizedInsights: result.synthesizedInsights,
          sources: result.sources,
          confidenceScore: result.confidence?.toString(),
          status: 'completed',
          processingTimeSeconds: processingTime,
          completedAt: new Date(),
        });
        console.log(`💾 Saved research session for query: "${query}"`);
      } catch (err) {
        console.error('Failed to save research session:', err);
      }
      
      res.json({
        success: true,
        result,
        message: 'Research completed successfully'
      });
      
    } catch (error) {
      console.error('Hybrid research error:', error);
      res.status(500).json({ 
        error: "Research failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Quick search - Gemini grounding only (fastest)
   * Use this for instant results
   */
  app.post("/api/hybrid-research/quick-search", async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }
      
      console.log(`⚡ Quick search: "${query}"`);
      
      const result = await hybridResearchService.quickSearch(query);
      
      res.json({
        success: true,
        result,
        message: 'Quick search completed'
      });
      
    } catch (error) {
      console.error('Quick search error:', error);
      res.status(500).json({ 
        error: "Quick search failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Startup-specific research
   * Optimized for analyzing startups
   */
  app.post("/api/hybrid-research/startup/:startupId?", async (req: Request, res: Response) => {
    try {
      const { startupId } = req.params;
      const { startupName, additionalContext } = req.body;
      
      if (!startupName && !startupId) {
        return res.status(400).json({ 
          error: "Either startupName or startupId is required" 
        });
      }
      
      let name = startupName;
      
      // If startupId provided, get startup from database
      if (startupId) {
        const startup = await storage.getStartup(startupId);
        if (!startup) {
          return res.status(404).json({ error: "Startup not found" });
        }
        name = startup.name;
      }
      
      console.log(`🚀 Researching startup: "${name}"`);
      
      const startTime = Date.now();
      const result = await hybridResearchService.researchStartup(name, additionalContext);
      const processingTime = Math.floor((Date.now() - startTime) / 1000);

      // Save research session to database
      try {
        const query = additionalContext 
          ? `${name}: ${additionalContext}`
          : `Research startup: ${name}`;
        
        await storage.createResearchSession({
          startupId: startupId || null,
          query,
          researchType: 'startup-analysis',
          groundedAnalysis: result.groundedAnalysis,
          customSearchResults: result.customSearchResults,
          synthesizedInsights: result.synthesizedInsights,
          sources: result.sources,
          confidenceScore: result.confidence?.toString(),
          status: 'completed',
          processingTimeSeconds: processingTime,
          completedAt: new Date(),
        });
        console.log(`💾 Saved research session for startup: "${name}"`);
      } catch (err) {
        console.error('Failed to save research session:', err);
      }
      
      // If startupId provided, also update startup record
      if (startupId) {
        await storage.updateStartup(startupId, {
          analysisData: {
            ...(await storage.getStartup(startupId))?.analysisData,
            hybridResearch: result,
            lastResearchedAt: new Date().toISOString()
          }
        });
      }
      
      res.json({
        success: true,
        startupName: name,
        result,
        message: 'Startup research completed'
      });
      
    } catch (error) {
      console.error('Startup research error:', error);
      res.status(500).json({ 
        error: "Startup research failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Market research endpoint
   * Analyzes market size, trends, competitors
   */
  app.post("/api/hybrid-research/market", async (req: Request, res: Response) => {
    try {
      const { industry, marketSegment } = req.body;
      
      if (!industry) {
        return res.status(400).json({ error: "Industry is required" });
      }
      
      console.log(`📊 Researching market: "${industry}"`);
      
      const result = await hybridResearchService.researchMarket(industry, marketSegment);
      
      res.json({
        success: true,
        industry,
        marketSegment,
        result,
        message: 'Market research completed'
      });
      
    } catch (error) {
      console.error('Market research error:', error);
      res.status(500).json({ 
        error: "Market research failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Competitor research endpoint
   * Analyzes specific competitors
   */
  app.post("/api/hybrid-research/competitor", async (req: Request, res: Response) => {
    try {
      const { companyName, industry } = req.body;
      
      if (!companyName) {
        return res.status(400).json({ error: "Company name is required" });
      }
      
      console.log(`🎯 Researching competitor: "${companyName}"`);
      
      const result = await hybridResearchService.researchCompetitor(companyName, industry);
      
      res.json({
        success: true,
        companyName,
        result,
        message: 'Competitor research completed'
      });
      
    } catch (error) {
      console.error('Competitor research error:', error);
      res.status(500).json({ 
        error: "Competitor research failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Get saved research for a startup
   */
  app.get("/api/hybrid-research/startup/:startupId", async (req: Request, res: Response) => {
    try {
      const { startupId } = req.params;
      
      const startup = await storage.getStartup(startupId);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found" });
      }
      
      const analysisData = startup.analysisData as any;
      const hybridResearch = analysisData?.hybridResearch;
      
      if (!hybridResearch) {
        return res.status(404).json({ 
          error: "No hybrid research found for this startup",
          message: "Use POST /api/hybrid-research/startup/:startupId to generate research"
        });
      }
      
      res.json({
        startupId,
        startupName: startup.name,
        research: hybridResearch,
        lastResearched: analysisData.lastResearchedAt
      });
      
    } catch (error) {
      console.error('Get research error:', error);
      res.status(500).json({ 
        error: "Failed to retrieve research",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Health check for hybrid research
   */
  app.get("/api/hybrid-research/health", (req: Request, res: Response) => {
    const hasSearchApiKey = !!process.env.GOOGLE_SEARCH_API_KEY;
    const hasSearchEngineId = !!process.env.GOOGLE_SEARCH_ENGINE_ID;
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    
    res.json({
      status: "ok",
      features: {
        geminiGrounding: hasGeminiKey ? "available" : "not_configured",
        customSearch: (hasSearchApiKey && hasSearchEngineId) ? "available" : "not_configured",
        quickSearch: hasGeminiKey ? "available" : "not_configured"
      },
      message: hasGeminiKey 
        ? "Hybrid research is ready!" 
        : "Gemini API key required",
      setup: {
        geminiKey: hasGeminiKey ? "✅" : "❌ Set GEMINI_API_KEY",
        customSearchKey: hasSearchApiKey ? "✅" : "⚠️ Optional: Set GOOGLE_SEARCH_API_KEY",
        customSearchId: hasSearchEngineId ? "✅" : "⚠️ Optional: Set GOOGLE_SEARCH_ENGINE_ID"
      }
    });
  });
}

