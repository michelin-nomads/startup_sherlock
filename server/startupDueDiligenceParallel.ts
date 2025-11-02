import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { hybridResearchService } from "./hybridResearch";
import { retryWithBackoff, tryModelsInOrder } from "./gemini";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Optimized Parallel Section-Based Due Diligence Service
 * 
 * Splits comprehensive research into smaller, focused sections that run in parallel
 * Each section has its own grounding search and synthesis, reducing total time significantly
 */

export interface SectionResult {
  section: string;
  data: any;
  sources: any[];
  confidence: number;
  completedAt: string;
  duration: number;
}

export interface ParallelDueDiligenceResult {
  // Main structure expected by UI
  synthesizedInsights: {
    data: {
      company_overview: any;
      corporate_structure: any;
      employee_metrics: any;
      funding_history: any;
      financial_health: any;
      market_position: any;
      competitor_analysis: any;
      recent_news_developments: any;
      growth_trajectory: any;
      risk_and_investment_rationale: any;
      ipo_potential: any;
      employee_satisfaction: any;
      customer_feedback: any;
      information_gaps: any[];
    };
    summary: string;
    keyFindings: string[];
    confidence: number;
  };
  sources: any[];
  confidence: number;
  timestamp: string;
  metadata: {
    company_name: string;
    query_date: string;
    total_duration: number;
    sections_completed: number;
    overall_confidence: number;
  };
  // Direct access for backward compatibility (optional)
  company_overview?: any;
  corporate_structure?: any;
  employee_metrics?: any;
  funding_history?: any;
  financial_health?: any;
  market_position?: any;
  competitor_analysis?: any;
  recent_news_developments?: any;
  growth_trajectory?: any;
  risk_and_investment_rationale?: any;
  ipo_potential?: any;
  employee_satisfaction?: any;
  customer_feedback?: any;
  information_gaps?: any[];
}

/**
 * Section-specific prompts optimized for focused research
 */
const SECTION_PROMPTS = {
  company_overview: (startupName: string) => ({
    searchQuery: `${startupName} company overview founders headquarters industry sector description`,
    synthesisPrompt: `Research company overview for ${startupName}. Return JSON with:
{
  "description": "string (under 280 chars)",
  "sector": "string",
  "industry": "string",
  "founded_date": "YYYY-MM-DD or YYYY-MM or YYYY",
  "founders": [{"name":"string","role":"string","background_short":"string","linkedin":"string"}],
  "current_cofounders": [{"name":"string","role":"string"}],
  "current_ceo": {"name":"string","since":"YYYY-MM-DD"},
  "headquarters": {"city":"string","country":"string"},
  "other_offices": [{"city":"string","country":"string"}],
  "website": "string",
  "sources": ["url1","url2"]
}

Prioritize: Crunchbase, LinkedIn, company website, Wikipedia.`
  }),

  corporate_structure: (startupName: string) => ({
    searchQuery: `${startupName} mergers acquisitions subsidiaries parent company corporate structure`,
    synthesisPrompt: `Research corporate structure for ${startupName}. Return JSON with:
{
  "parent_company": "string or null",
  "subsidiaries": [{"name":"string","since":"YYYY-MM"}],
  "mergers": [{"company":"string","date":"YYYY-MM-DD","amount_usd":number,"source":["url"]}],
  "acquisitions": [{"company":"string","date":"YYYY-MM-DD","amount_usd":number,"rationale":"string","source":["url"]}],
  "sources": ["url1","url2"]
}

Prioritize: Crunchbase, TechCrunch, company announcements, SEC filings.`
  }),

  employee_metrics: (startupName: string) => ({
    searchQuery: `${startupName} employees headcount team size hiring growth LinkedIn`,
    synthesisPrompt: `Research employee metrics for ${startupName}. Return JSON with:
{
  "current_employees": {"value":number,"as_of":"YYYY-MM","sources":["url"]},
  "employee_history": [{"year":"YYYY","employees":number,"source":"url"}],
  "department_breakdown": [{"department":"string","employees":number,"source":"url"}],
  "recent_hiring_trend": "string (under 280 chars)",
  "employee_growth_rate_pct": number,
  "hiring_trend": "string",
  "chart_series": {"years":["YYYY"],"employee_counts":[number]},
  "sources": ["url1","url2"]
}

Prioritize: LinkedIn, Crunchbase, company website, Glassdoor.`
  }),

  funding_history: (startupName: string) => ({
    searchQuery: `${startupName} funding rounds Series A B C investors valuation Crunchbase PitchBook`,
    synthesisPrompt: `Research ALL funding history for ${startupName}. Return JSON with:
{
  "total_funding_usd": number,
  "rounds": [{
    "round_type": "Seed|Series A|Series B|etc",
    "amount_usd": number,
    "date": "YYYY-MM-DD",
    "valuation_pre_usd": number|null,
    "valuation_post_usd": number|null,
    "lead_investors": ["string"],
    "participating_investors": ["string"],
    "sources": ["url1","url2"],
    "valuation_source_note": "string|null"
  }],
  "current_valuation_usd": {"value":number|null,"as_of":"YYYY-MM-DD","basis":"string","sources":["url"]},
  "current_investors": [{"name":"string","amount_usd":number|null,"first_invest_date":"YYYY-MM-DD","rounds_participated":["string"],"notable":boolean}],
  "past_investors_exited": [{"investor":"string","exit_reason":"string","exit_date":"YYYY-MM-DD|null","exit_value_usd":number|null,"source":"url"}],
  "notable_vc_investors": [{"name":"string","firm":"string","total_invested_usd":number|null,"sources":["url"]}],
  "sources": ["url1","url2"]
}

CRITICAL: Verify valuations with multiple sources (Crunchbase, PitchBook, CB Insights, TechCrunch, VentureBeat). Include all rounds.`
  }),

  financial_health: (startupName: string) => ({
    searchQuery: `${startupName} revenue financials ARR MRR CAC LTV burn rate profitability`,
    synthesisPrompt: `Research financial health for ${startupName}. Return JSON with:
{
  "annual_revenue": {"latest_year":"YYYY","value_usd":number,"currency":"USD|INR","sources":["url"],"estimate":boolean,"estimate_basis":"string|null"},
  "revenue_history": [{"year":"YYYY","value_usd":number,"sources":["url"],"estimate":boolean}],
  "revenue_growth_rate_pct": {"latest_year":"YYYY","value":number,"sources":["url"],"estimate":boolean},
  "profitability": {"status":"profitable|unprofitable|break-even|unknown","ebitda_usd":number|null,"pat_usd":number|null,"latest_year":"YYYY","sources":["url"]},
  "key_metrics": {
    "ARR_usd": {"value":number|null,"as_of":"YYYY-MM","sources":["url"]},
    "MRR_usd": {"value":number|null,"as_of":"YYYY-MM","sources":["url"]},
    "CAC_usd": {"value":number|null,"sources":["url"]},
    "LTV_usd": {"value":number|null,"sources":["url"]}
  },
  "cash_runway_months": {"value":number|null,"as_of":"YYYY-MM","sources":["url"],"estimate":boolean},
  "burn_rate_monthly_usd": {"value":number|null,"as_of":"YYYY-MM","sources":["url"],"estimate":boolean},
  "chart_series": {"years":["YYYY"],"revenues_usd":[number],"growth_rates_pct":[number]},
  "sources": ["url1","url2"]
}

Prioritize: SEC filings, company announcements, financial news (Bloomberg, Forbes, Reuters).`
  }),

  market_position: (startupName: string) => ({
    searchQuery: `${startupName} market share TAM SAM market position competitive positioning`,
    synthesisPrompt: `Research market position for ${startupName}. Return JSON with:
{
  "TAM_usd": {"value":number|null,"year":"YYYY","sources":["url"]},
  "SAM_usd": number|null,
  "SOM_usd": number|null,
  "market_share_pct": {"value":number|null,"as_of":"YYYY","sources":["url"]},
  "market_ranking": {"rank":number|null,"basis":"string","source":"url"},
  "competitive_positioning": "string (under 280 chars)",
  "competitive_advantages": ["string"],
  "market_trends": ["string"],
  "sources": ["url1","url2"]
}

Prioritize: Industry reports, Gartner, market research firms, company presentations.`
  }),

  competitor_analysis: (startupName: string) => ({
    searchQuery: `${startupName} competitors competitive analysis market competitors`,
    synthesisPrompt: `Research competitors for ${startupName}. Return JSON with:
{
  "top_competitors": [{
    "name":"string",
    "funding_usd":number|null,
    "market_share_pct":number|null,
    "strengths":["string"],
    "weaknesses":["string"],
    "source":["url"]
  }],
  "feature_pricing_comparison": [{
    "competitor":"string",
    "feature_diff":"string",
    "pricing":"string",
    "source":["url"]
  }],
  "startup_strengths": ["string"],
  "startup_weaknesses": ["string"],
  "overall_standing": "string (under 280 chars)",
  "sources": ["url1","url2"]
}

Prioritize: Industry analysis, competitor websites, comparison articles.`
  }),

  recent_news_developments: (startupName: string) => ({
    searchQuery: `${startupName} news 2024 2025 latest developments announcements`,
    synthesisPrompt: `Research recent news for ${startupName} (last 6 months). Return JSON with:
{
  "all_news": [{"date":"YYYY-MM-DD","title":"string","summary":"string","source":"string","url":"string","sentiment":"positive|negative|neutral"}],
  "product_launches": [{"date":"YYYY-MM-DD","title":"string","summary":"string","source":"string","url":"string"}],
  "partnerships": [{"date":"YYYY-MM-DD","title":"string","summary":"string","source":"string","url":"string"}],
  "awards_recognition": [{"date":"YYYY-MM-DD","title":"string","summary":"string","source":"string","url":"string"}],
  "controversies": [{"date":"YYYY-MM-DD","title":"string","summary":"string","source":"string","url":"string","sentiment":"negative"}],
  "funding_announcements": [{"date":"YYYY-MM-DD","title":"string","summary":"string","source":"string","url":"string"}],
  "leadership_changes": [{"date":"YYYY-MM-DD","title":"string","summary":"string","source":"string","url":"string"}],
  "market_expansion": [{"date":"YYYY-MM-DD","title":"string","summary":"string","source":"string","url":"string"}],
  "sources": ["url1","url2"]
}

Prioritize: TechCrunch, VentureBeat, The Information, Forbes, Reuters, company blog.`
  }),

  growth_trajectory: (startupName: string) => ({
    searchQuery: `${startupName} growth trajectory historical growth milestones revenue growth`,
    synthesisPrompt: `Research growth trajectory for ${startupName}. Return JSON with:
{
  "historical_growth": [{"period":"YYYY","metric":"revenue|users|arr|employees","value":number,"unit":"USD|%|users|count","source":"url","estimate":false}],
  "projected_growth": [{"period":"YYYY","metric":"revenue|users|arr","value":number,"unit":"USD|%|users","source":"url","estimate":true,"estimate_basis":"string"}],
  "key_milestones": [{"year":"YYYY","milestone":"string"}],
  "growth_drivers": ["string"],
  "growth_challenges": ["string"],
  "chart_series": {"periods":["YYYY"],"values":[number],"metric":"string"},
  "sources": ["url1","url2"]
}

Prioritize: Company announcements, investor reports, news articles.`
  }),

  risk_and_investment_rationale: (startupName: string) => ({
    searchQuery: `${startupName} investment analysis risks opportunities competitive moats`,
    synthesisPrompt: `Analyze investment rationale for ${startupName}. Return JSON with:
{
  "why_invest": ["string"],
  "why_not_invest": ["string"],
  "key_strengths": ["string"],
  "key_risks": ["string"],
  "competitive_moats": ["string"],
  "risk_level": {"level":"High|Medium|Low","explanation":"string"},
  "recommended_action": "Strong Buy|Buy|Hold|Pass",
  "target_investment_usd": number|null,
  "expected_return_pct": number|null,
  "time_horizon_years": number|null,
  "sources": ["url1","url2"]
}

Prioritize: VC analysis, investment reports, industry analysis.`
  }),

  ipo_potential: (startupName: string) => ({
    searchQuery: `${startupName} IPO potential IPO timeline public offering valuation`,
    synthesisPrompt: `Assess IPO potential for ${startupName}. Return JSON with:
{
  "ipo_likelihood": "High|Medium|Low|Not Likely",
  "estimated_ipo_timeline": "string|null",
  "ipo_readiness_factors": ["string"],
  "estimated_ipo_valuation_usd": number|null,
  "comparable_ipos": [{"company":"string","valuation_usd":number,"year":"YYYY","source":"url"}],
  "market_conditions": "string (under 280 chars)",
  "sources": ["url1","url2"]
}

Prioritize: Financial news, IPO analysis, market reports.`
  }),

  employee_satisfaction: (startupName: string) => ({
    searchQuery: `${startupName} Glassdoor reviews employee satisfaction work culture`,
    synthesisPrompt: `Research employee satisfaction for ${startupName}. Return JSON with:
{
  "glassdoor_rating": {"value":number|null,"as_of":"YYYY-MM","url":"string|null"},
  "reviews_summary": "string (under 280 chars)",
  "top_pros": ["string"],
  "top_cons": ["string"],
  "work_culture": "string (under 280 chars)",
  "leadership_rating": number|null,
  "sources": ["url1","url2"]
}

Prioritize: Glassdoor, LinkedIn, employee reviews.`
  }),

  customer_feedback: (startupName: string) => ({
    searchQuery: `${startupName} customer reviews G2 Trustpilot NPS customer satisfaction`,
    synthesisPrompt: `Research customer feedback for ${startupName}. Return JSON with:
{
  "nps_score": {"value":number|null,"as_of":"YYYY-MM","source":"url|null"},
  "g2_rating": {"value":number|null,"url":"string|null"},
  "trustpilot_rating": {"value":number|null,"url":"string|null"},
  "capterra_rating": {"value":number|null,"url":"string|null"},
  "positive_themes": ["string"],
  "negative_themes": ["string"],
  "common_complaints": ["string"],
  "customer_retention_pct": {"value":number|null,"source":"url|null"},
  "sources": ["url1","url2"]
}

Prioritize: G2, Trustpilot, Capterra, review sites.`
  })
};

export class StartupDueDiligenceParallelService {
  
  /**
   * Conduct due diligence with parallel section research
   * Each section runs independently with its own grounding search
   */
  async conductDueDiligenceParallel(startupName: string): Promise<ParallelDueDiligenceResult> {
    const startTime = Date.now();
    console.log(`🚀 Starting PARALLEL due diligence for: ${startupName}`);
    
    try {
      // Run all sections in parallel
      const sectionResults = await Promise.all([
        this.researchSection(startupName, 'company_overview'),
        this.researchSection(startupName, 'corporate_structure'),
        this.researchSection(startupName, 'employee_metrics'),
        this.researchSection(startupName, 'funding_history'),
        this.researchSection(startupName, 'financial_health'),
        this.researchSection(startupName, 'market_position'),
        this.researchSection(startupName, 'competitor_analysis'),
        this.researchSection(startupName, 'recent_news_developments'),
        this.researchSection(startupName, 'growth_trajectory'),
        this.researchSection(startupName, 'risk_and_investment_rationale'),
        this.researchSection(startupName, 'ipo_potential'),
        this.researchSection(startupName, 'employee_satisfaction'),
        this.researchSection(startupName, 'customer_feedback')
      ]);
      
      // Extract information gaps from all sections
      const informationGaps = this.extractInformationGaps(sectionResults);
      
      // Combine all sources
      const allSources = this.combineSources(sectionResults);
      
      // Calculate overall metrics
      const totalDuration = (Date.now() - startTime) / 1000;
      const overallConfidence = this.calculateOverallConfidence(sectionResults);
      
      // Synthesize final insights
      const synthesizedInsights = await this.synthesizeFinalInsights(startupName, sectionResults);
      
      // Build result in format compatible with existing UI
      // UI expects: publicData.synthesizedInsights.data.company_overview
      const result: ParallelDueDiligenceResult = {
        synthesizedInsights: {
          data: {
            company_overview: this.findSectionData(sectionResults, 'company_overview'),
            corporate_structure: this.findSectionData(sectionResults, 'corporate_structure'),
            employee_metrics: this.findSectionData(sectionResults, 'employee_metrics'),
            funding_history: this.findSectionData(sectionResults, 'funding_history'),
            financial_health: this.findSectionData(sectionResults, 'financial_health'),
            market_position: this.findSectionData(sectionResults, 'market_position'),
            competitor_analysis: this.findSectionData(sectionResults, 'competitor_analysis'),
            recent_news_developments: this.findSectionData(sectionResults, 'recent_news_developments'),
            growth_trajectory: this.findSectionData(sectionResults, 'growth_trajectory'),
            risk_and_investment_rationale: this.findSectionData(sectionResults, 'risk_and_investment_rationale'),
            ipo_potential: this.findSectionData(sectionResults, 'ipo_potential'),
            employee_satisfaction: this.findSectionData(sectionResults, 'employee_satisfaction'),
            customer_feedback: this.findSectionData(sectionResults, 'customer_feedback'),
            information_gaps: informationGaps
          },
          summary: synthesizedInsights.summary,
          keyFindings: synthesizedInsights.keyFindings,
          confidence: overallConfidence
        },
        sources: allSources,
        confidence: overallConfidence,
        timestamp: new Date().toISOString(),
        metadata: {
          company_name: startupName,
          query_date: new Date().toISOString().split('T')[0],
          total_duration: totalDuration,
          sections_completed: sectionResults.length,
          overall_confidence: overallConfidence
        },
        // Also provide direct access for backward compatibility
        company_overview: this.findSectionData(sectionResults, 'company_overview'),
        corporate_structure: this.findSectionData(sectionResults, 'corporate_structure'),
        employee_metrics: this.findSectionData(sectionResults, 'employee_metrics'),
        funding_history: this.findSectionData(sectionResults, 'funding_history'),
        financial_health: this.findSectionData(sectionResults, 'financial_health'),
        market_position: this.findSectionData(sectionResults, 'market_position'),
        competitor_analysis: this.findSectionData(sectionResults, 'competitor_analysis'),
        recent_news_developments: this.findSectionData(sectionResults, 'recent_news_developments'),
        growth_trajectory: this.findSectionData(sectionResults, 'growth_trajectory'),
        risk_and_investment_rationale: this.findSectionData(sectionResults, 'risk_and_investment_rationale'),
        ipo_potential: this.findSectionData(sectionResults, 'ipo_potential'),
        employee_satisfaction: this.findSectionData(sectionResults, 'employee_satisfaction'),
        customer_feedback: this.findSectionData(sectionResults, 'customer_feedback'),
        information_gaps: informationGaps
      };
      
      console.log(`✅ Parallel due diligence completed in ${totalDuration.toFixed(1)}s`);
      return result;
      
    } catch (error) {
      console.error('❌ Parallel due diligence failed:', error);
      throw error;
    }
  }
  
  /**
   * Research a single section with its own grounding search and synthesis
   */
  private async researchSection(
    startupName: string,
    sectionKey: keyof typeof SECTION_PROMPTS
  ): Promise<SectionResult> {
    const sectionStartTime = Date.now();
    
    try {
      console.log(`🔍 Researching section: ${sectionKey} for ${startupName}`);
      
      const { searchQuery, synthesisPrompt } = SECTION_PROMPTS[sectionKey](startupName);
      
      // Conduct research with grounding (parallel with other sections)
      const hybridResult = await hybridResearchService.conductResearch(searchQuery, synthesisPrompt);
      
      // Extract section-specific data from synthesized insights
      // The hybridResult.synthesizedInsights should contain the JSON structured data
      // Use 'any' type since custom prompts return different structures than default SynthesizedInsights
      let sectionData: any = hybridResult.synthesizedInsights || {};
      
      // Handle case where synthesizedInsights is a string (when custom prompt returns raw JSON string)
      if (typeof sectionData === 'string') {
        try {
          sectionData = JSON.parse(sectionData);
        } catch {
          // If parsing fails, check if the string contains JSON
          const jsonMatch = (sectionData as string).match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              sectionData = JSON.parse(jsonMatch[0]);
            } catch {
              sectionData = { raw: sectionData };
            }
          } else {
            sectionData = { raw: sectionData };
          }
        }
      }
      
      // If it's still not an object, check if it has a data field or is structured differently
      if (typeof sectionData !== 'object' || Array.isArray(sectionData)) {
        sectionData = { raw: sectionData };
      }
      
      // Also check if there's structured data in the groundedAnalysis
      if (hybridResult.groundedAnalysis?.analysis) {
        try {
          const analysisText = hybridResult.groundedAnalysis.analysis;
          // Try to extract JSON from the analysis text
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
          if (jsonMatch && Object.keys(sectionData).length < 3) {
            try {
              const parsedFromAnalysis = JSON.parse(jsonMatch[0]);
              // Merge with existing data
              sectionData = { ...parsedFromAnalysis, ...sectionData };
            } catch {
              // Ignore parse errors
            }
          }
        } catch {
          // Ignore errors
        }
      }
      
      const parsedData = sectionData;
      
      const duration = (Date.now() - sectionStartTime) / 1000;
      console.log(`✅ Section ${sectionKey} completed in ${duration.toFixed(1)}s`);
      
      return {
        section: sectionKey,
        data: parsedData,
        sources: hybridResult.sources || [],
        confidence: hybridResult.confidence || 70,
        completedAt: new Date().toISOString(),
        duration
      };
      
    } catch (error) {
      console.error(`❌ Section ${sectionKey} failed:`, error);
      // Return empty result on error
      return {
        section: sectionKey,
        data: {},
        sources: [],
        confidence: 0,
        completedAt: new Date().toISOString(),
        duration: (Date.now() - sectionStartTime) / 1000
      };
    }
  }
  
  /**
   * Find data for a specific section
   */
  private findSectionData(sectionResults: SectionResult[], section: string): any {
    const result = sectionResults.find(r => r.section === section);
    return result?.data || {};
  }
  
  /**
   * Extract information gaps from all sections
   */
  private extractInformationGaps(sectionResults: SectionResult[]): any[] {
    const gaps: any[] = [];
    
    sectionResults.forEach(result => {
      // Check if section data has information_gaps field
      if (result.data?.information_gaps && Array.isArray(result.data.information_gaps)) {
        gaps.push(...result.data.information_gaps);
      }
      
      // Also check for missing critical data
      if (result.confidence < 50) {
        gaps.push({
          question_to_ask: `Need more information about ${result.section}`,
          why_needed: `Low confidence (${result.confidence}%) in ${result.section} data`,
          category: result.section
        });
      }
    });
    
    return gaps;
  }
  
  /**
   * Combine sources from all sections
   */
  private combineSources(sectionResults: SectionResult[]): any[] {
    const allSources: any[] = [];
    const seenUrls = new Set<string>();
    
    sectionResults.forEach(result => {
      result.sources.forEach((source: any) => {
        const url = source.url || source.link || '';
        if (url && !seenUrls.has(url)) {
          seenUrls.add(url);
          allSources.push({
            ...source,
            section: result.section,
            relevance: source.relevance || 'medium'
          });
        }
      });
    });
    
    return allSources;
  }
  
  /**
   * Calculate overall confidence from all sections
   */
  private calculateOverallConfidence(sectionResults: SectionResult[]): number {
    const confidences = sectionResults.map(r => r.confidence).filter(c => c > 0);
    if (confidences.length === 0) return 50;
    
    return Math.round(
      confidences.reduce((sum, c) => sum + c, 0) / confidences.length
    );
  }
  
  /**
   * Synthesize final insights from all sections
   */
  private async synthesizeFinalInsights(
    startupName: string,
    sectionResults: SectionResult[]
  ): Promise<{ summary: string; keyFindings: string[]; confidence: number }> {
    try {
      const sectionsSummary = sectionResults.map(r => 
        `${r.section}: ${r.confidence}% confidence, ${r.sources.length} sources`
      ).join('\n');
      
      const summary = `Comprehensive due diligence for ${startupName} completed across ${sectionResults.length} sections.`;
      const keyFindings = [
        `Research completed across ${sectionResults.length} sections`,
        `Average confidence: ${this.calculateOverallConfidence(sectionResults)}%`,
        `Total sources: ${this.combineSources(sectionResults).length}`
      ];
      
      return {
        summary,
        keyFindings,
        confidence: this.calculateOverallConfidence(sectionResults)
      };
    } catch (error) {
      console.error('❌ Final synthesis failed:', error);
      return {
        summary: `Due diligence completed for ${startupName}`,
        keyFindings: ['Research completed across multiple sections'],
        confidence: 70
      };
    }
  }
  
  /**
   * Research a single section (for progressive loading API)
   */
  async researchSingleSection(
    startupName: string,
    sectionKey: keyof typeof SECTION_PROMPTS
  ): Promise<SectionResult> {
    return this.researchSection(startupName, sectionKey);
  }
}

// Export singleton instance
export const startupDueDiligenceParallelService = new StartupDueDiligenceParallelService();

