import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { hybridResearchService } from "./hybridResearch";
import { retryWithBackoff, tryModelsInOrder } from "./gemini";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Startup Due Diligence Service
 * 
 * Comprehensive public data research for startups focusing on:
 * - Company overview & team
 * - Funding & investors
 * - Financials & growth
 * - Market position & competitors
 * - Risks & opportunities
 * - IPO potential
 * - Employee & customer satisfaction
 */

export interface DueDiligenceResult {
  companyOverview: CompanyOverview;
  teamAndLeadership: TeamAndLeadership;
  corporateStructure: CorporateStructure;
  employeeMetrics: EmployeeMetrics;
  fundingHistory: FundingHistory;
  financialHealth: FinancialHealth;
  marketPosition: MarketPosition;
  competitorAnalysis: CompetitorAnalysis;
  recentDevelopments: RecentDevelopments;
  growthTrajectory: GrowthTrajectory;
  riskAnalysis: RiskAnalysis;
  investmentRationale: InvestmentRationale;
  ipoAnalysis: IPOAnalysis;
  employeeSatisfaction: EmployeeSatisfaction;
  customerFeedback: CustomerFeedback;
  needToAsk: string[];
  recommendations: string[];
  metadata: ResearchMetadata;
}

export interface CompanyOverview {
  name: string;
  description: string;
  sector: string;
  industry: string;
  foundedYear: string;
  founders: string[];
  headquarters: string;
  otherLocations: string[];
  website: string;
  confidence: number;
}

export interface TeamAndLeadership {
  founders: Array<{
    name: string;
    role: string;
    background: string;
    linkedinUrl?: string;
  }>;
  keyExecutives: Array<{
    name: string;
    title: string;
    joinedYear: string;
    background: string;
  }>;
  boardMembers: Array<{
    name: string;
    company: string;
    role: string;
  }>;
  teamSize: number;
  confidence: number;
}

export interface CorporateStructure {
  hasMergers: boolean;
  mergers: Array<{
    company: string;
    year: string;
    amount?: string;
  }>;
  hasAcquisitions: boolean;
  acquisitions: Array<{
    company: string;
    year: string;
    amount?: string;
    rationale: string;
  }>;
  parentCompany: string | null;
  subsidiaries: string[];
  confidence: number;
}

export interface EmployeeMetrics {
  totalEmployees: number;
  employeeGrowth: string;
  keyDepartments: Array<{
    department: string;
    size: number;
  }>;
  hiringTrends: string;
  confidence: number;
}

export interface FundingHistory {
  totalFunding: string;
  lastRoundType: string;
  lastRoundAmount: string;
  lastRoundDate: string;
  valuation: string;
  rounds: Array<{
    round: string;
    amount: string;
    date: string;
    valuation?: string;
    leadInvestors: string[];
  }>;
  currentInvestors: Array<{
    name: string;
    type: string;
    notable: boolean;
  }>;
  pastInvestors: Array<{
    name: string;
    exitReason: string;
    exitDate: string;
  }>;
  confidence: number;
}

export interface FinancialHealth {
  revenue: string;
  revenueGrowth: string;
  revenueHistory: Array<{
    year: string;
    revenue: string;
    growth: string;
  }>;
  profitability: string;
  burnRate: string;
  runway: string;
  keyMetrics: Array<{
    metric: string;
    value: string;
    trend: string;
  }>;
  confidence: number;
}

export interface MarketPosition {
  marketSize: string;
  marketShare: string;
  ranking: string;
  positioning: string;
  competitiveAdvantages: string[];
  marketTrends: string[];
  confidence: number;
}

export interface CompetitorAnalysis {
  directCompetitors: Array<{
    name: string;
    funding: string;
    marketShare: string;
    strengths: string[];
    weaknesses: string[];
  }>;
  competitiveComparison: {
    vsCompetitor1: string;
    vsCompetitor2: string;
    overallPosition: string;
  };
  confidence: number;
}

export interface RecentDevelopments {
  recentNews: Array<{
    title: string;
    date: string;
    source: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    summary: string;
  }>;
  productLaunches: string[];
  partnerships: string[];
  awards: string[];
  confidence: number;
}

export interface GrowthTrajectory {
  historicalGrowth: string;
  projectedGrowth: string;
  growthDrivers: string[];
  challenges: string[];
  milestones: Array<{
    year: string;
    milestone: string;
  }>;
  confidence: number;
}

export interface RiskAnalysis {
  highRisks: Array<{
    risk: string;
    impact: string;
    mitigation: string;
  }>;
  mediumRisks: Array<{
    risk: string;
    impact: string;
  }>;
  lowRisks: string[];
  overallRiskLevel: 'Low' | 'Medium' | 'High';
  confidence: number;
}

export interface InvestmentRationale {
  whyInvest: string[];
  whyNotInvest: string[];
  keyConsiderations: string[];
  recommendedAction: 'Strong Buy' | 'Buy' | 'Hold' | 'Pass';
  targetInvestment: string;
  expectedReturn: string;
  timeHorizon: string;
  confidence: number;
}

export interface IPOAnalysis {
  ipoPotential: 'High' | 'Medium' | 'Low' | 'Not Likely';
  estimatedTimeline: string;
  ipoReadiness: string;
  marketConditions: string;
  comparableIPOs: string[];
  estimatedValuation: string;
  confidence: number;
}

export interface EmployeeSatisfaction {
  glassdoorRating: string;
  employeeReviews: string;
  pros: string[];
  cons: string[];
  workCulture: string;
  leadershipRating: string;
  confidence: number;
}

export interface CustomerFeedback {
  npsScore: string;
  customerRating: string;
  positiveReviews: string[];
  negativeReviews: string[];
  commonComplaints: string[];
  customerRetention: string;
  confidence: number;
}

export interface ResearchMetadata {
  researchedAt: string;
  timeTakenSeconds: number;
  overallConfidence: number;
  sources: Array<{
    name: string;
    url: string;
    relevance: 'high' | 'medium' | 'low';
    dataExtracted: string[];
  }>;
  prioritySources: string[];
  dataQuality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export class StartupDueDiligenceService {
  
  /**
   * Comprehensive startup due diligence research
   */
  async conductDueDiligence(startupName: string): Promise<DueDiligenceResult> {
    const startTime = Date.now();
    
    console.log(`🔍 Starting comprehensive due diligence for: ${startupName}`);
    
    try {
      // Build comprehensive research prompt
      const researchPrompt = this.buildDueDiligencePrompt(startupName);
      
      // Conduct research with priority sources
      const hybridResult = await hybridResearchService.conductResearch(researchPrompt);
      
      // Structure the research into due diligence format
      const dueDiligence = await this.structureDueDiligence(
        startupName,
        hybridResult,
        startTime
      );
      
      console.log(`✅ Due diligence completed in ${dueDiligence.metadata.timeTakenSeconds}s`);
      
      return dueDiligence;
      
    } catch (error) {
      console.error('❌ Due diligence failed:', error);
      throw error;
    }
  }
  
  /**
   * Build comprehensive prompt focusing on all 14 points + priority sources
   */
  private buildDueDiligencePrompt(startupName: string): string {
    return `Conduct comprehensive due diligence research on ${startupName} startup. Prioritize information from Crunchbase, TechCrunch, Forbes, LinkedIn, Tracxn, Reddit, Sequoia Capital, EquityBee, Wikipedia, YourStory, Clay.com, BetterCreating, YouTube, Buildd.com, AngelOne, LiveMint, Smart-Investing.in, Money Rediff, Morgan Stanley, and TheOrg.

CRITICAL: Provide detailed, factual information with specific numbers, dates, and sources. If information is not available, explicitly state "Information not publicly available" rather than making assumptions.

Research the following:

1. COMPANY OVERVIEW:
   - What does ${startupName} do? (detailed description)
   - Sector and specific industry
   - When was it founded? (exact date if available)
   - Who founded it? (all founders with backgrounds)
   - Current co-founders and their roles
   - Headquarters location and all other office locations

2. CORPORATE STRUCTURE:
   - Has ${startupName} merged with any companies? (details: company, year, amount)
   - Has ${startupName} acquired any companies? (details: company, year, amount, rationale)
   - Does ${startupName} have a parent company?
   - Does ${startupName} have any subsidiaries?

3. EMPLOYEE METRICS:
   - Total number of employees (current)
   - Employee growth trend over the years
   - Key department sizes (engineering, sales, etc.)
   - Recent hiring trends

4. FUNDING HISTORY (CRITICAL - BE VERY SPECIFIC):
   - Total funding raised to date
   - All funding rounds (Seed, Series A, B, C, etc.) with:
     * Round type
     * Amount raised
     * Date
     * Valuation (pre-money and post-money if available)
     * Lead investors for each round
   - Current valuation
   - Current investors and their investment amounts
   - Past investors who exited and WHY they exited (very important)
   - Notable investors from YC, Sequoia, a16z, etc.

5. FINANCIAL HEALTH:
   - Annual revenue (latest available)
   - Revenue history (year-by-year for last 3-5 years)
   - Revenue growth rate (%)
   - Profitability status (EBITDA, PAT, etc.)
   - Key financial metrics (ARR, MRR, CAC, LTV, etc.)
   - Cash runway

6. MARKET POSITION:
   - Total addressable market (TAM) size 
   - Market share percent
   - Market ranking (e.g., #3 in the space)
   - Competitive positioning

7. COMPETITOR ANALYSIS:
   - Top 3-5 direct competitors
   - Competitive comparison (feature-by-feature, pricing, market share)
   - ${startupName}'s strengths vs competitors
   - ${startupName}'s weaknesses vs competitors
   - Where does ${startupName} stand overall?

8. RECENT NEWS & DEVELOPMENTS:
   - Recent news articles (last 6 months) with dates and sources
   - Recent product launches
   - Recent partnerships or collaborations
   - Awards or recognition received
   - Any controversies or negative news

9. GROWTH TRAJECTORY:
   - Historical growth metrics
   - Growth rate trends
   - Key milestones achieved (with years)
   - Future growth projections
   - Growth drivers and challenges

10. RISK FACTORS & INVESTMENT RATIONALE:
    WHY TO INVEST:
    - Key strengths and advantages
    - Growth potential
    - Market opportunity
    - Team quality
    - Competitive moats
    
    WHY NOT TO INVEST:
    - Key risks and concerns
    - Competition threats
    - Market challenges
    - Regulatory risks
    - Financial concerns
    
    RISK LEVEL: High/Medium/Low (with detailed explanation)

11. IPO POTENTIAL:
    - IPO likelihood and timeline
    - IPO readiness factors
    - Comparable company IPOs
    - Estimated IPO valuation
    - Market conditions for IPO

12. EMPLOYEE SATISFACTION:
    - Glassdoor rating (if available)
    - Employee reviews summary
    - Top 3 pros from employee reviews
    - Top 3 cons from employee reviews
    - Work culture insights
    - Leadership ratings

13. CUSTOMER FEEDBACK:
    - NPS score (if available)
    - Customer ratings (G2, Capterra, Trustpilot, etc.)
    - Positive customer feedback themes
    - Negative customer feedback themes
    - Customer retention rate
    - Common complaints

14. INFORMATION GAPS:
    List specific questions that need to be asked to the company where:
    - Public information is not available
    - Information is unclear or contradictory
    - More details are needed for investment decision

IMPORTANT INSTRUCTIONS:
- Provide specific numbers, dates, and facts (not vague statements)
- Cite sources for key claims (especially financial data)
- If information is not available, say "Not publicly available" explicitly
- Focus on recent data (last 1-2 years primarily)
- Include both positive and negative information
- Be objective and balanced in analysis

Return comprehensive, structured information with maximum detail and confidence.`;
  }
  
  /**
   * Structure hybrid research into due diligence format using AI
   */
  private async structureDueDiligence(
    startupName: string,
    hybridResult: any,
    startTime: number
  ): Promise<DueDiligenceResult> {
    try {
      const structuringPrompt = `You are a financial analyst structuring due diligence data. Convert the following research into a structured JSON format.

RESEARCH DATA:
${JSON.stringify(hybridResult, null, 2)}

Convert this into the following JSON structure (return ONLY valid JSON, no markdown):

{
  "companyOverview": {
    "name": "${startupName}",
    "description": "string",
    "sector": "string",
    "industry": "string",
    "foundedYear": "string",
    "founders": ["string"],
    "headquarters": "string",
    "otherLocations": ["string"],
    "website": "string",
    "confidence": number (0-100)
  },
  "teamAndLeadership": {
    "founders": [{"name": "string", "role": "string", "background": "string", "linkedinUrl": "string"}],
    "keyExecutives": [{"name": "string", "title": "string", "joinedYear": "string", "background": "string"}],
    "boardMembers": [{"name": "string", "company": "string", "role": "string"}],
    "teamSize": number,
    "confidence": number
  },
  "corporateStructure": {
    "hasMergers": boolean,
    "mergers": [{"company": "string", "year": "string", "amount": "string"}],
    "hasAcquisitions": boolean,
    "acquisitions": [{"company": "string", "year": "string", "amount": "string", "rationale": "string"}],
    "parentCompany": "string or null",
    "subsidiaries": ["string"],
    "confidence": number
  },
  "employeeMetrics": {
    "totalEmployees": number,
    "employeeGrowth": "string",
    "keyDepartments": [{"department": "string", "size": number}],
    "hiringTrends": "string",
    "confidence": number
  },
  "fundingHistory": {
    "totalFunding": "string",
    "lastRoundType": "string",
    "lastRoundAmount": "string",
    "lastRoundDate": "string",
    "valuation": "string",
    "rounds": [{"round": "string", "amount": "string", "date": "string", "valuation": "string", "leadInvestors": ["string"]}],
    "currentInvestors": [{"name": "string", "type": "string", "notable": boolean}],
    "pastInvestors": [{"name": "string", "exitReason": "string", "exitDate": "string"}],
    "confidence": number
  },
  "financialHealth": {
    "revenue": "string",
    "revenueGrowth": "string",
    "RevenueGrowthRate": string
    "revenueHistory": [{"year": "string", "revenue": "string", "growth": "string"}],
    "ebitda": "string",
    "pat": "string",
    "burnRate": "string",
    "runway": "string",
    "keyMetrics": [{"metric": "string", "value": "string", "trend": "string"}],
    "confidence": number
  },
  "marketPosition": {
    "marketSize": "string",
    "marketShare": "string",
    "ranking": "string",
    "positioning": "string",
    "competitiveAdvantages": ["string"],
    "marketTrends": ["string"],
    "confidence": number
  },
  "competitorAnalysis": {
    "directCompetitors": [{"name": "string", "funding": "string", "marketShare": "string", "strengths": ["string"], "weaknesses": ["string"]}],
    "competitiveComparison": {"vsCompetitor1": "string", "vsCompetitor2": "string", "overallPosition": "string"},
    "confidence": number
  },
  "recentDevelopments": {
    "recentNews": [{"title": "string", "date": "string", "source": "string", "sentiment": "positive|negative|neutral", "summary": "string"}],
    "productLaunches": ["string"],
    "partnerships": ["string"],
    "awards": ["string"],
    "confidence": number
  },
  "growthTrajectory": {
    "historicalGrowth": "string",
    "projectedGrowth": "string",
    "growthDrivers": ["string"],
    "challenges": ["string"],
    "milestones": [{"year": "string", "milestone": "string"}],
    "confidence": number
  },
  "riskAnalysis": {
    "highRisks": [{"risk": "string", "impact": "string", "mitigation": "string"}],
    "mediumRisks": [{"risk": "string", "impact": "string"}],
    "lowRisks": ["string"],
    "overallRiskLevel": "Low|Medium|High",
    "confidence": number
  },
  "investmentRationale": {
    "whyInvest": ["string"],
    "whyNotInvest": ["string"],
    "keyConsiderations": ["string"],
    "recommendedAction": "Strong Buy|Buy|Hold|Pass",
    "targetInvestment": "string",
    "expectedReturn": "string",
    "timeHorizon": "string",
    "confidence": number
  },
  "ipoAnalysis": {
    "ipoPotential": "High|Medium|Low|Not Likely",
    "estimatedTimeline": "string",
    "ipoReadiness": "string",
    "marketConditions": "string",
    "comparableIPOs": ["string"],
    "estimatedValuation": "string",
    "confidence": number
  },
  "employeeSatisfaction": {
    "glassdoorRating": "string",
    "employeeReviews": "string",
    "pros": ["string"],
    "cons": ["string"],
    "workCulture": "string",
    "leadershipRating": "string",
    "confidence": number
  },
  "customerFeedback": {
    "npsScore": "string",
    "customerRating": "string",
    "positiveReviews": ["string"],
    "negativeReviews": ["string"],
    "commonComplaints": ["string"],
    "customerRetention": "string",
    "confidence": number
  },
  "needToAsk": ["string"],
  "recommendations": ["string"]
}

IMPORTANT:
- Extract ALL available information from the research
- Use empty string or empty arrays when data is missing
- Calculate confidence based on data quality and completeness
- Be specific with numbers and dates
- Include all sources found in the research`;

      // Use retry logic with model fallback for 503 errors
      const structured = await retryWithBackoff(async () => {
        return await tryModelsInOrder(async (model) => {
          console.log(`🤖 Structuring due diligence with ${model}...`);
          const result = await ai.models.generateContent({
            model,
            config: {
              responseMimeType: "application/json",
              temperature: 0.3, // Lower temperature for more factual structuring
            },
            contents: structuringPrompt
          });
          
          return JSON.parse(result.text || '{}');
        });
      });
      
      // Calculate metadata
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const sources = this.extractPrioritySources(hybridResult.sources || []);
      const overallConfidence = this.calculateOverallConfidence(structured);
      
      structured.metadata = {
        researchedAt: new Date().toISOString(),
        timeTakenSeconds: timeTaken,
        overallConfidence,
        sources,
        prioritySources: this.getPrioritySourcesUsed(sources),
        dataQuality: this.assessDataQuality(overallConfidence)
      };
      
      return structured as DueDiligenceResult;
      
    } catch (error) {
      console.error('❌ Failed to structure due diligence after all retries:', error);
      throw error;
    }
  }
  
  /**
   * Extract and categorize sources
   */
  private extractPrioritySources(sources: any[]): any[] {
    const priorityDomains = [
      'crunchbase.com', 'techcrunch.com', 'forbes.com', 'linkedin.com',
      'tracxn.com', 'reddit.com', 'sequoiacap.com', 'equitybee.com',
      'wikipedia.org', 'yourstory.com', 'clay.com', 'bettercreating.com',
      'youtube.com', 'buildd.com', 'angelone.in', 'livemint.com',
      'smart-investing.in', 'rediff.com', 'morganstanley.com', 'theorg.com'
    ];
    
    return sources.map(source => {
      const url = source.url || '';
      const domain = url.match(/https?:\/\/([^\/]+)/)?.[1] || '';
      const isPriority = priorityDomains.some(pd => domain.includes(pd));
      
      return {
        name: source.title || domain,
        url,
        relevance: isPriority ? 'high' : source.relevance || 'medium',
        dataExtracted: ['Company information'] // Could be more specific
      };
    });
  }
  
  /**
   * Get list of priority sources that were actually used
   */
  private getPrioritySourcesUsed(sources: any[]): string[] {
    const priorityNames = [
      'Crunchbase', 'TechCrunch', 'Forbes', 'LinkedIn', 'Tracxn',
      'Reddit', 'Sequoia', 'EquityBee', 'Wikipedia', 'YourStory',
      'Clay', 'YouTube', 'LiveMint', 'Morgan Stanley', 'TheOrg'
    ];
    
    const used = sources
      .filter(s => s.relevance === 'high')
      .map(s => {
        const url = s.url.toLowerCase();
        for (const name of priorityNames) {
          if (url.includes(name.toLowerCase())) {
            return name;
          }
        }
        return null;
      })
      .filter(Boolean) as string[];
    
    return [...new Set(used)]; // Remove duplicates
  }
  
  /**
   * Calculate overall confidence across all sections
   */
  private calculateOverallConfidence(data: any): number {
    const confidenceFields = [
      data.companyOverview?.confidence,
      data.teamAndLeadership?.confidence,
      data.corporateStructure?.confidence,
      data.employeeMetrics?.confidence,
      data.fundingHistory?.confidence,
      data.financialHealth?.confidence,
      data.marketPosition?.confidence,
      data.competitorAnalysis?.confidence,
      data.recentDevelopments?.confidence,
      data.growthTrajectory?.confidence,
      data.riskAnalysis?.confidence,
      data.investmentRationale?.confidence,
      data.ipoAnalysis?.confidence,
      data.employeeSatisfaction?.confidence,
      data.customerFeedback?.confidence
    ].filter(c => typeof c === 'number');
    
    if (confidenceFields.length === 0) return 50;
    
    return Math.round(
      confidenceFields.reduce((sum, c) => sum + c, 0) / confidenceFields.length
    );
  }
  
  /**
   * Assess overall data quality
   */
  private assessDataQuality(confidence: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
    if (confidence >= 85) return 'Excellent';
    if (confidence >= 70) return 'Good';
    if (confidence >= 50) return 'Fair';
    return 'Poor';
  }
}

// Export singleton instance
export const startupDueDiligenceService = new StartupDueDiligenceService();

