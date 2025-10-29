import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import { retryWithBackoff, tryModelsInOrder } from "./gemini";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Hybrid Research Service
 * 
 * Combines multiple FREE Google services for comprehensive research:
 * 1. Gemini with Web Grounding (FREE - cites sources)
 * 2. Google Custom Search API (100 queries/day FREE)
 * 3. Enhanced reasoning analysis
 * 
 * NO ALLOWLIST REQUIRED - All services are publicly available
 */

export interface HybridResearchResult {
  query: string;
  groundedAnalysis: GroundedAnalysisResult;
  customSearchResults: CustomSearchResult[];
  synthesizedInsights: SynthesizedInsights;
  sources: Source[];
  confidence: number;
  timestamp: string;
}

export interface GroundedAnalysisResult {
  analysis: string;
  groundingMetadata?: {
    groundingChunks?: Array<{
      web?: {
        uri?: string;
        title?: string;
      };
    }>;
    groundingSupports?: Array<{
      segment?: {
        startIndex?: number;
        endIndex?: number;
        text?: string;
      };
      groundingChunkIndices?: number[];
      confidenceScores?: number[];
    }>;
    webSearchQueries?: string[];
    searchEntryPoint?: {
      renderedContent?: string;
    };
  };
  model: string;
}

export interface CustomSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  formattedUrl: string;
}

export interface SynthesizedInsights {
  summary: string;
  keyFindings: string[];
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  recommendation: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export interface Source {
  title: string;
  url: string;
  type: 'grounding' | 'custom_search' | 'document';
  relevance: 'high' | 'medium' | 'low';
}

export class HybridResearchService {
  
  /**
   * Main research method - combines all FREE services
   * @param query - The research query
   * @param customSynthesisPrompt - Optional custom prompt for synthesis (for structured schemas)
   */
  async conductResearch(query: string, customSynthesisPrompt?: string): Promise<HybridResearchResult> {
    try {
      console.log(`🔍 Starting hybrid research for: "${query}"`);
      
      // Run searches in parallel for speed
      const [groundedAnalysis, customSearch] = await Promise.all([
        this.geminiWithGrounding(query),
        this.customGoogleSearch(query)
      ]);
      
      // Synthesize all findings with custom prompt if provided
      const synthesizedInsights = await this.synthesizeFindings(
        query,
        groundedAnalysis,
        customSearch,
        customSynthesisPrompt
      );
      
      // Extract and deduplicate sources
      const sources = this.extractSources(groundedAnalysis, customSearch);
      
      // Calculate confidence based on source quality and agreement
      const confidence = this.calculateConfidence(groundedAnalysis, customSearch);
      
      const result: HybridResearchResult = {
        query,
        groundedAnalysis,
        customSearchResults: customSearch,
        synthesizedInsights,
        sources,
        confidence,
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ Hybrid research completed with ${sources.length} sources`);
      return result;
      
    } catch (error) {
      console.error('❌ Hybrid research failed:', error);
      throw error;
    }
  }
  
  /**
   * Gemini with Web Grounding (FREE)
   * Allows Gemini to search the web and cite sources
   */
  private async geminiWithGrounding(query: string): Promise<GroundedAnalysisResult> {
    try {
      console.log('🌐 Searching with Gemini Grounding...');
      
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash", // Flash is faster and still FREE
        config: {
          tools: [{
            googleSearch: {} // Enable web search grounding
          }],
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192
        },
        contents: `Conduct comprehensive research on: ${query}
        
Please provide:
1. Company overview and background
2. Funding history and investors
3. Market position and competitors
4. Team and leadership
5. Recent news and developments
6. Financial health indicators
7. Growth trajectory
8. Risk factors

Be thorough and cite your sources. Include specific facts, numbers, and dates where available.`
      });
      
      // Extract grounding metadata (citations)
      const groundingMetadata = (result as any).candidates?.[0]?.groundingMetadata || {};
      
      console.log(`✅ Grounding completed with ${groundingMetadata.groundingChunks?.length || 0} sources`);
      
      return {
        analysis: result.text || '',
        groundingMetadata,
        model: 'gemini-2.5-flash'
      };
      
    } catch (error) {
      console.error('❌ Gemini grounding failed:', error);
      // Fallback to non-grounded search
      return this.fallbackGeminiSearch(query);
    }
  }
  
  /**
   * Fallback if grounding fails - use standard Gemini
   */
  private async fallbackGeminiSearch(query: string): Promise<GroundedAnalysisResult> {
    console.log('⚠️ Using fallback (no grounding)...');
    
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Provide a comprehensive analysis of: ${query}
      
Based on your training data, provide insights about this company/topic including background, market position, and key considerations.`
    });
    
    return {
      analysis: result.text || '',
      model: 'gemini-2.5-flash (no grounding)'
    };
  }
  
  /**
   * Google Custom Search API (100 queries/day FREE)
   */
  private async customGoogleSearch(query: string): Promise<CustomSearchResult[]> {
    try {
      // Check if API keys are configured
      if (!process.env.GOOGLE_SEARCH_API_KEY || !process.env.GOOGLE_SEARCH_ENGINE_ID) {
        console.log('⚠️ Custom Search API not configured, skipping...');
        return [];
      }
      
      console.log('🔎 Searching with Custom Search API...');
      
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: process.env.GOOGLE_SEARCH_API_KEY,
          cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
          q: query,
          num: 10 // Get top 10 results
        },
        timeout: 10000 // 10 second timeout
      });
      
      const results = response.data.items?.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        displayLink: item.displayLink,
        formattedUrl: item.formattedUrl
      })) || [];
      
      console.log(`✅ Custom search found ${results.length} results`);
      return results;
      
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        console.log('⚠️ Custom Search API quota exceeded (100/day limit)');
      } else {
        console.error('❌ Custom search failed:', error);
      }
      return [];
    }
  }
  
  /**
   * Synthesize findings from all sources using Gemini
   * Accepts custom prompt if provided (for due diligence schema)
   */
  private async synthesizeFindings(
    query: string,
    groundedAnalysis: GroundedAnalysisResult,
    customSearch: CustomSearchResult[],
    customPrompt?: string
  ): Promise<SynthesizedInsights> {
    try {
      console.log('🧠 Synthesizing insights...');
      
      const searchContext = customSearch.map(r => 
        `Title: ${r.title}\nURL: ${r.link}\nSnippet: ${r.snippet}`
      ).join('\n\n');
      
      // Use custom prompt if provided, otherwise use default
      const prompt = customPrompt || `You are an expert analyst. Synthesize the following research into actionable insights:

QUERY: ${query}

GROUNDED ANALYSIS:
${groundedAnalysis.analysis}

ADDITIONAL SEARCH RESULTS:
${searchContext}

Provide a structured analysis in JSON format with:
- summary: Brief overview (2-3 sentences)
- keyFindings: Array of 3-5 key findings
- strengths: Array of 2-4 strengths identified
- weaknesses: Array of 2-4 weaknesses or concerns
- opportunities: Array of 2-3 opportunities
- threats: Array of 2-3 threats or risks
- recommendation: Overall recommendation (1-2 sentences)
- confidenceLevel: "high", "medium", or "low" based on data quality

Return ONLY valid JSON, no markdown or additional text.`;

      // Use retry logic with model fallback for 503 errors
      const insights = await retryWithBackoff(async () => {
        return await tryModelsInOrder(async (model) => {
          console.log(`🤖 Synthesizing with ${model}...`);
          const result = await ai.models.generateContent({
            model,
            config: {
              responseMimeType: "application/json",
              temperature: 0.1, // Lower temperature for structured data
            },
            contents: customPrompt ? `${prompt}

GROUNDED ANALYSIS:
${groundedAnalysis.analysis}

ADDITIONAL SEARCH RESULTS:
${searchContext}` : prompt
          });
          
          return JSON.parse(result.text || '{}');
        });
      });
      
      console.log('✅ Synthesis completed');
      
      return insights;
      
    } catch (error) {
      console.error('❌ Synthesis failed after all retries:', error);
      // Return default structure
      return {
        summary: groundedAnalysis.analysis.substring(0, 300) + '...',
        keyFindings: ['Analysis completed - see full details above'],
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
        recommendation: 'Further investigation recommended',
        confidenceLevel: 'medium'
      };
    }
  }
  
  /**
   * Extract and deduplicate sources from all research
   */
  private extractSources(
    groundedAnalysis: GroundedAnalysisResult,
    customSearch: CustomSearchResult[]
  ): Source[] {
    const sources: Source[] = [];
    const seenUrls = new Set<string>();
    
    // Extract from grounding metadata
    const groundingChunks = groundedAnalysis.groundingMetadata?.groundingChunks || [];
    groundingChunks.forEach((chunk: any) => {
      if (chunk.web?.uri && !seenUrls.has(chunk.web.uri)) {
        sources.push({
          title: chunk.web.title || 'Untitled',
          url: chunk.web.uri,
          type: 'grounding',
          relevance: 'high'
        });
        seenUrls.add(chunk.web.uri);
      }
    });
    
    // Extract from custom search
    customSearch.forEach((result, index) => {
      if (!seenUrls.has(result.link)) {
        sources.push({
          title: result.title,
          url: result.link,
          type: 'custom_search',
          relevance: index < 3 ? 'high' : index < 6 ? 'medium' : 'low'
        });
        seenUrls.add(result.link);
      }
    });
    
    return sources;
  }
  
  /**
   * Calculate confidence based on source quality and data availability
   */
  private calculateConfidence(
    groundedAnalysis: GroundedAnalysisResult,
    customSearch: CustomSearchResult[]
  ): number {
    let confidence = 0;
    
    // Grounding sources add confidence
    const groundingSources = groundedAnalysis.groundingMetadata?.groundingChunks?.length || 0;
    confidence += Math.min(groundingSources * 10, 50); // Max 50 points
    
    // Custom search results add confidence
    confidence += Math.min(customSearch.length * 3, 30); // Max 30 points
    
    // Analysis quality adds confidence
    const analysisLength = groundedAnalysis.analysis.length;
    if (analysisLength > 2000) confidence += 20;
    else if (analysisLength > 1000) confidence += 10;
    
    return Math.min(confidence, 100);
  }
  
  /**
   * Research specific to startup analysis
   */
  async researchStartup(startupName: string, additionalContext?: string): Promise<HybridResearchResult> {
    const query = `${startupName} startup ${additionalContext || ''} funding investors team market competitors financial performance`;
    return this.conductResearch(query);
  }
  
  /**
   * Research specific to market analysis
   */
  async researchMarket(industry: string, marketSegment?: string): Promise<HybridResearchResult> {
    const query = `${industry} ${marketSegment || ''} market size growth trends competitors TAM SAM SOM analysis`;
    return this.conductResearch(query);
  }
  
  /**
   * Research specific to competitor analysis
   */
  async researchCompetitor(companyName: string, industry?: string): Promise<HybridResearchResult> {
    const query = `${companyName} ${industry || ''} company competitive analysis market position strengths weaknesses strategy`;
    return this.conductResearch(query);
  }
  
  /**
   * Quick search - Gemini grounding only (fastest)
   */
  async quickSearch(query: string): Promise<GroundedAnalysisResult> {
    console.log(`⚡ Quick search for: "${query}"`);
    return this.geminiWithGrounding(query);
  }
}

// Export singleton instance
export const hybridResearchService = new HybridResearchService();

