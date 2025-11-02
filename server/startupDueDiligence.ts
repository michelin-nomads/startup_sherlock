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
      // Build comprehensive research prompt with detailed schema
      const synthesisPrompt = this.buildDueDiligencePrompt(startupName);
      
      // Build simple query for grounding search
      const searchQuery = `Comprehensive due diligence research on ${startupName} startup including funding history, team, market position, financials, competitors, risks, and recent developments`;
      
      // Conduct research with priority sources and custom synthesis prompt
      const hybridResult = await hybridResearchService.conductResearch(searchQuery, synthesisPrompt);
      console.log("hybridResult", hybridResult)
      
      // Return hybrid result directly for visualization-focused UI
      const timeTakenSeconds = (Date.now() - startTime) / 1000;
      console.log(`✅ Due diligence completed in ${timeTakenSeconds}s`);
      
      // Return hybridResult directly instead of structured dueDiligence
      return hybridResult as any;
      
    } catch (error) {
      console.error('❌ Due diligence failed:', error);
      throw error;
    }
  }
  
  /**
   * Build comprehensive prompt focusing on all 14 points + priority sources
   */
//   private buildDueDiligencePrompt(startupName: string): string {
//     return `Conduct comprehensive due diligence research on ${startupName} startup. Prioritize information from Crunchbase, TechCrunch, Forbes, LinkedIn, Tracxn, Reddit, Sequoia Capital, EquityBee, Wikipedia, YourStory, Clay.com, BetterCreating, YouTube, Buildd.com, AngelOne, LiveMint, Smart-Investing.in, Money Rediff, Morgan Stanley, and TheOrg.

// CRITICAL: Provide detailed, factual information with specific numbers, dates, and sources. If information is not available, explicitly state "Information not publicly available" rather than making assumptions.

// Research the following:

// 1. COMPANY OVERVIEW:
//    - What does ${startupName} do? (detailed description)
//    - Sector and specific industry
//    - When was it founded? (exact date if available)
//    - Who founded it? (all founders with backgrounds)
//    - Current co-founders and their roles
//    - Headquarters location and all other office locations

// 2. CORPORATE STRUCTURE:
//    - Has ${startupName} merged with any companies? (details: company, year, amount)
//    - Has ${startupName} acquired any companies? (details: company, year, amount, rationale)
//    - Does ${startupName} have a parent company?
//    - Does ${startupName} have any subsidiaries?

// 3. EMPLOYEE METRICS:
//    - Total number of employees (current)
//    - Employee growth trend over the years
//    - Key department sizes (engineering, sales, etc.)
//    - Recent hiring trends

// 4. FUNDING HISTORY (CRITICAL - BE VERY SPECIFIC):
//    - Total funding raised to date
//    - All funding rounds (Seed, Series A, B, C, etc.) with:
//      * Round type
//      * Amount raised
//      * Date
//      * Valuation (pre-money and post-money if available)
//      * Lead investors for each round
//    - Current valuation
//    - Current investors and their investment amounts
//    - Past investors who exited and WHY they exited (very important)
//    - Notable investors from YC, Sequoia, a16z, etc.

// 5. FINANCIAL HEALTH:
//    - Annual revenue (latest available)
//    - Revenue history (year-by-year for last 3-5 years)
//    - Revenue growth rate (%)
//    - Profitability status (EBITDA, PAT, etc.)
//    - Key financial metrics (ARR, MRR, CAC, LTV, etc.)
//    - Cash runway

// 6. MARKET POSITION:
//    - Total addressable market (TAM) size 
//    - Market share percent
//    - Market ranking (e.g., #3 in the space)
//    - Competitive positioning

// 7. COMPETITOR ANALYSIS:
//    - Top 3-5 direct competitors
//    - Competitive comparison (feature-by-feature, pricing, market share)
//    - ${startupName}'s strengths vs competitors
//    - ${startupName}'s weaknesses vs competitors
//    - Where does ${startupName} stand overall?

// 8. RECENT NEWS & DEVELOPMENTS:
//    - Recent news articles (last 6 months) with dates and sources
//    - Recent product launches
//    - Recent partnerships or collaborations
//    - Awards or recognition received
//    - Any controversies or negative news

// 9. GROWTH TRAJECTORY:
//    - Historical growth metrics
//    - Growth rate trends
//    - Key milestones achieved (with years)
//    - Future growth projections
//    - Growth drivers and challenges

// 10. RISK FACTORS & INVESTMENT RATIONALE:
//     WHY TO INVEST:
//     - Key strengths and advantages
//     - Growth potential
//     - Market opportunity
//     - Team quality
//     - Competitive moats
    
//     WHY NOT TO INVEST:
//     - Key risks and concerns
//     - Competition threats
//     - Market challenges
//     - Regulatory risks
//     - Financial concerns
    
//     RISK LEVEL: High/Medium/Low (with detailed explanation)

// 11. IPO POTENTIAL:
//     - IPO likelihood and timeline
//     - IPO readiness factors
//     - Comparable company IPOs
//     - Estimated IPO valuation
//     - Market conditions for IPO

// 12. EMPLOYEE SATISFACTION:
//     - Glassdoor rating (if available)
//     - Employee reviews summary
//     - Top 3 pros from employee reviews
//     - Top 3 cons from employee reviews
//     - Work culture insights
//     - Leadership ratings

// 13. CUSTOMER FEEDBACK:
//     - NPS score (if available)
//     - Customer ratings (G2, Capterra, Trustpilot, etc.)
//     - Positive customer feedback themes
//     - Negative customer feedback themes
//     - Customer retention rate
//     - Common complaints

// 14. INFORMATION GAPS:
//     List specific questions that need to be asked to the company where:
//     - Public information is not available
//     - Information is unclear or contradictory
//     - More details are needed for investment decision

// IMPORTANT INSTRUCTIONS:
// - Provide specific numbers, dates, and facts (not vague statements)
// - Cite sources for key claims (especially financial data)
// - If information is not available, say "Not publicly available" explicitly
// - Focus on recent data (last 1-2 years primarily)
// - Include both positive and negative information
// - Be objective and balanced in analysis
// - If information is large, break it into points. Do not make it a single paragraph.
// - If any information includes numbers, extract the numbers and the text and put them in the JSON instead of returning large paragraphs.

// Return comprehensive, structured information with maximum detail and confidence.`;
//   }

// prompt2
//   private buildDueDiligencePrompt(startupName: string): string {
//     return `You are a research assistant. Conduct comprehensive due diligence on the startup named: ${startupName}.

// GLOBAL INSTRUCTIONS (MUST FOLLOW)
// 1. OUTPUT FORMAT: Return ONLY a single JSON object as the final answer (no extra narrative). The JSON must follow the schema in "OUTPUT SCHEMA" below exactly. Use 'null' for unknown numeric/date/string values only if exhaustive public-source search returns nothing. **Do not** return long paragraphs for any field.
// 2. SOURCING: For every non-null field include a 'sources' array item in the JSON referencing the exact URL(s) or citation(s) used. Mark each source with a short 'why' tag (e.g., "funding_round", "employee_count", "revenue_2023").
// 3. SEARCH SCOPE: Prioritize the following sources in this order: Crunchbase, TechCrunch, Forbes, LinkedIn, Tracxn, Wikipedia, Sequoia/a16z/YC pages, YourStory, LiveMint, Moneycontrol, AngelList, Glassdoor, G2/Capterra, company website, investor decks, regulatory filings (if any), and reputable press. Also check Reddit/YouTube for product announcements but tag such items as "community" or "video".
// 4. "Not publicly available": Only output the exact string '"Information not publicly available"' in a field **if** you have exhausted the prioritized list above and could not find the data. Otherwise provide the number/text or a sourced estimate (see ESTIMATES rule).
// 5. DATES: Use ISO format YYYY-MM-DD when day is available; otherwise YYYY-MM for month-only, or YYYY for year-only.
// 6. NUMBERS: All numeric fields must be numbers (no text). If value is a range, provide 'min' and 'max' numeric fields. Add 'currency' or 'unit' field where relevant (e.g., INR, USD, %). Do not return numbers embedded in sentences.
// 7. ESTIMATES: If you must estimate, put the numeric estimate and include '"estimate": true' plus at least one 'estimate_basis' explaining how you derived it and list sources. Do NOT present estimates as facts.
// 8. GROWTH & CHART DATA: Historical and projected growth must be arrays of '{ "period":"YYYY" or "YYYY-MM-DD", "value": number, "unit":"%" or "USD", "source": "...", "estimate": true/false }'. Also provide a 'chart_series' object for each metric intended for charting (time-ordered arrays).
// 9. LENGTH: Keep any short commentary strings under 280 characters. For longer reasoning, add an entry in 'data.information_gaps' or 'data.notes_summary' but still <1000 chars.
// 10. CITATION LIMIT: For each numeric datapoint include up to 3 best sources. For overall claim summaries, cite up to 5 most important sources.
// 11. RECENCY: Prefer data from the last 24 months. If older data is used, include 'as_of' date and explain if likely outdated.

// OUTPUT SCHEMA (MUST MATCH EXACTLY)
// {
//   "metadata": {
//     "company_name": string,
//     "query_date": "YYYY-MM-DD",
//     "primary_sources_checked": [string,...]
//   },
//   "data": {
//     "company_overview": {
//       "description": string,
//       "sector": string,
//       "industry": string,
//       "founded_date": string | "Information not publicly available",
//       "founders": [ {"name":string, "role":string|null, "background_short":string|null, "linkedin":string|null } ],
//       "current_ceo": {"name":string|null, "since":string|null},
//       "headquarters": {"city":string|null, "country":string|null, "other_offices":[ {"city":string,"country":string} ] }
//     },
//     "corporate_structure": {
//       "parent_company": string | null,
//       "subsidiaries": [ {"name":string,"since":string|null} ],
//       "mergers": [ {"company":string,"date":string,"amount_usd": number|null,"source":[string]} ],
//       "acquisitions": [ {"company":string,"date":string,"amount_usd": number|null,"rationale":string|null,"source":[string]} ]
//     },
//     "employee_metrics": {
//       "current_employees": { "value": number | "Information not publicly available", "as_of": string|null, "sources":[string] },
//       "employee_history": [ {"year": "YYYY", "employees": number, "source":string} ],
//       "department_breakdown": [ {"department":string, "employees":number, "source":string} ],
//       "recent_hiring_trend": string
//     },
//     "funding_history": {
//       "total_funding_usd": number | "Information not publicly available",
//       "rounds": [
//         { "round_type": "Seed|Series A|Series B|Bridge|Debt|IPO|Other",
//           "amount_usd": number,
//           "date": string,
//           "valuation_pre_usd": number|null,
//           "valuation_post_usd": number|null,
//           "lead_investors": [string],
//           "sources":[string]
//         }
//       ],
//       "current_valuation_usd": number|null,
//       "current_investors": [ {"name":string,"amount_usd":number|null,"first_invest_date":string|null} ],
//       "notable_exits_of_investors": [ {"investor":string,"why_exited":string,"source":string} ]
//     },
//     "financial_health": {
//       "annual_revenue": { "latest_year": "YYYY", "value_usd": number | "Information not publicly available", "currency":"USD|INR|etc", "sources":[string], "estimate": true/false, "estimate_basis": string|null },
//       "revenue_history": [ {"year":"YYYY","value_usd":number,"sources":[string],"estimate":true/false} ],
//       "revenue_growth_rate_pct": { "latest_year":"YYYY", "value": number|null, "sources":[string], "estimate": true/false },
//       "profitability": { "ebitda_usd": number|null, "pat_usd": number|null, "latest_year":"YYYY" },
//       "key_metrics": { "ARR_usd": number|null, "MRR_usd": number|null, "CAC_usd": number|null, "LTV_usd": number|null },
//       "cash_runway_months": { "value": number|null, "as_of":"YYYY-MM", "sources":[string], "estimate": true/false }
//     },
//     "market_position": {
//       "TAM_usd": number|null,
//       "SAM_usd": number|null,
//       "SOM_usd": number|null,
//       "market_share_pct": { "value": number|null, "as_of":"YYYY", "sources":[string] },
//       "market_ranking": { "rank": number|null, "basis":"e.g., revenue/users", "source":string },
//       "competitive_positioning": string
//     },
//     "competitor_analysis": {
//       "top_competitors": [ {"name":string,"notes":string,"market_share_pct":number|null,"source":[string]} ],
//       "feature_pricing_comparison": [ {"competitor":string,"feature_diff":"short","pricing":"short","source":[string]} ],
//       "strengths": [string],
//       "weaknesses": [string]
//     },
//     "recent_news_developments": [
//       {"date":"YYYY-MM-DD","title":string,"type":"product|funding|partnership|legal|other","source":string,"url":string}
//     ],
//     "growth_trajectory": {
//       "historical_growth": [ {"period":"YYYY","metric":"revenue|users|arr|other","value":number,"unit":"USD|%|users","source":string} ],
//       "projected_growth": [ {"period":"YYYY","metric":"revenue|users|arr|other","value":number,"unit":"USD|%|users","source":string,"estimate":true} ],
//       "key_milestones": [ {"year":"YYYY","milestone":"short"} ],
//       "growth_drivers": [string],
//       "growth_challenges": [string]
//     },
//     "risk_and_investment_rationale": {
//       "why_invest": [string],
//       "why_not_invest": [string],
//       "risk_level": {"level":"High|Medium|Low","explanation":string}
//     },
//     "ipo_potential": {
//       "ipo_likelihood": "High|Medium|Low|null",
//       "estimated_ipo_timeline": string|null,
//       "estimated_ipo_valuation_usd": number|null,
//       "comparable_ipos": [ {"company":string,"valuation_usd":number,"year":"YYYY","source":string} ]
//     },
//     "employee_satisfaction": {
//       "glassdoor_rating": number|null,
//       "reviews_summary": string,
//       "top_pros": [string],
//       "top_cons": [string]
//     },
//     "customer_feedback": {
//       "nps_score": number|null,
//       "g2_rating": number|null,
//       "trustpilot_rating": number|null,
//       "positive_themes": [string],
//       "negative_themes": [string],
//       "customer_retention_pct": number|null
//     },
//     "information_gaps": [ {"question_to_ask": string, "why_needed": string} ],
//     "notes_summary": string
//   },
//   "sources": [ {"url":string,"accessed_on":"YYYY-MM-DD","notes":string} ]
// }

// EXTRA RULES TO PREVENT VERBOSE OR INCORRECT OUTPUT:
// - NEVER return a sentence like “publicly not available” unless you actually checked the prioritized sources. Instead use exactly '"Information not publicly available"'.
// - If a field is partly available (e.g., revenue for 2022 but not 2023), return the available years and list missing years in 'information_gaps'.
// - Keep descriptive list elements short (≤140 chars). Use arrays for lists; avoid paragraphs.
// - For every numeric field, include either 'sources' or 'estimate_basis'. Missing both = reject and set 'null'.
// - Keep data factual, structured, and concise for analytical visualization.
// `
//   }
  
// prompt 3
// private buildDueDiligencePrompt(startupName: string): string {
//   return `You are a research assistant. Conduct comprehensive due diligence on the startup named: ${startupName}.

// GLOBAL INSTRUCTIONS (MUST FOLLOW)
// 1. OUTPUT FORMAT: Return ONLY a single JSON object as the final answer (no extra narrative). The JSON must follow the schema in "OUTPUT SCHEMA" below exactly. Use 'null' for unknown numeric/date/string values only if exhaustive public-source search returns nothing. **Do not** return long paragraphs for any field.
// 2. SOURCING: For every non-null field include a 'sources' array item in the JSON referencing the exact URL(s) or citation(s) used. Mark each source with a short 'why' tag (e.g., "funding_round", "employee_count", "revenue_2023").
// 3. SEARCH SCOPE: Prioritize the following sources in this order: Crunchbase, TechCrunch, Forbes, LinkedIn, Tracxn, Wikipedia, Sequoia/a16z/YC pages, YourStory, LiveMint, Moneycontrol, AngelList, Glassdoor, G2/Capterra, Reddit, YouTube, Clay.com, BetterCreating, Buildd.com, AngelOne, Smart-Investing.in, Money Rediff, Morgan Stanley, TheOrg, company website, investor decks, regulatory filings (if any), and reputable press.
// 4. "Not publicly available": Only output the exact string '"Information not publicly available"' in a field **if** you have exhausted the prioritized list above and could not find the data. Otherwise provide the number/text or a sourced estimate (see ESTIMATES rule).
// 5. DATES: Use ISO format YYYY-MM-DD when day is available; otherwise YYYY-MM for month-only, or YYYY for year-only.
// 6. NUMBERS: All numeric fields must be numbers (no text). If value is a range, provide 'min' and 'max' numeric fields. Add 'currency' or 'unit' field where relevant (e.g., INR, USD, %). Do not return numbers embedded in sentences.
// 7. ESTIMATES: If you must estimate, put the numeric estimate and include '"estimate": true' plus at least one 'estimate_basis' explaining how you derived it and list sources. Do NOT present estimates as facts.
// 8. GROWTH & CHART DATA: Historical and projected growth must be arrays of '{ "period":"YYYY" or "YYYY-MM-DD", "value": number, "unit":"%" or "USD", "source": "...", "estimate": true/false }'. Also provide a 'chart_series' object for each metric intended for charting (time-ordered arrays).
// 9. LENGTH: Keep any short commentary strings under 280 characters. For longer reasoning, add an entry in 'data.information_gaps' or 'data.notes_summary' but still <1000 chars.
// 10. CITATION LIMIT: For each numeric datapoint include up to 3 best sources. For overall claim summaries, cite up to 5 most important sources.
// 11. RECENCY: Prefer data from the last 24 months. If older data is used, include 'as_of' date and explain if likely outdated.

// RESEARCH THE FOLLOWING (BE COMPREHENSIVE AND SPECIFIC):

// 1. COMPANY OVERVIEW:
//  - What does ${startupName} do? (detailed description)
//  - Sector and specific industry
//  - When was it founded? (exact date if available)
//  - Who founded it? (all founders with backgrounds)
//  - Current co-founders and their roles
//  - Current CEO and since when
//  - Headquarters location and all other office locations
//  - Company website

// 2. CORPORATE STRUCTURE:
//  - Has ${startupName} merged with any companies? (details: company, year, amount)
//  - Has ${startupName} acquired any companies? (details: company, year, amount, rationale)
//  - Does ${startupName} have a parent company?
//  - Does ${startupName} have any subsidiaries?

// 3. EMPLOYEE METRICS:
//  - Total number of employees (current)
//  - Employee growth trend over the years
//  - Key department sizes (engineering, sales, etc.)
//  - Recent hiring trends

// 4. FUNDING HISTORY (CRITICAL - BE VERY SPECIFIC):
//  - Total funding raised to date
//  - All funding rounds (Seed, Series A, B, C, D, etc.) with:
//    * Round type
//    * Amount raised
//    * Date
//    * Valuation (pre-money and post-money if available)
//    * Lead investors for each round
//  - Current valuation
//  - Current investors and their investment amounts
//  - Past investors who exited and WHY they exited (very important)
//  - Notable investors from YC, Sequoia, a16z, etc.

// 5. FINANCIAL HEALTH:
//  - Annual revenue (latest available)
//  - Revenue history (year-by-year for last 3-5 years)
//  - Revenue growth rate (%)
//  - Profitability status (EBITDA, PAT, etc.)
//  - Key financial metrics (ARR, MRR, CAC, LTV, etc.)
//  - Cash runway
//  - Monthly burn rate

// 6. MARKET POSITION:
//  - Total addressable market (TAM) size 
//  - Serviceable addressable market (SAM)
//  - Serviceable obtainable market (SOM)
//  - Market share percent
//  - Market ranking (e.g., #3 in the space)
//  - Competitive positioning
//  - Competitive advantages
//  - Market trends

// 7. COMPETITOR ANALYSIS:
//  - Top 3-5 direct competitors
//  - Competitive comparison (feature-by-feature, pricing, market share, funding)
//  - ${startupName}'s strengths vs competitors
//  - ${startupName}'s weaknesses vs competitors
//  - Where does ${startupName} stand overall?

// 8. RECENT NEWS & DEVELOPMENTS:
//  - Recent news articles (last 6 months) with dates and sources
//  - Recent product launches
//  - Recent partnerships or collaborations
//  - Awards or recognition received
//  - Any controversies or negative news

// 9. GROWTH TRAJECTORY:
//  - Historical growth metrics (revenue, users, ARR, employees)
//  - Growth rate trends
//  - Key milestones achieved (with years)
//  - Future growth projections
//  - Growth drivers and challenges

// 10. RISK FACTORS & INVESTMENT RATIONALE:
//   WHY TO INVEST:
//   - Key strengths and advantages
//   - Growth potential
//   - Market opportunity
//   - Team quality
//   - Competitive moats
  
//   WHY NOT TO INVEST:
//   - Key risks and concerns
//   - Competition threats
//   - Market challenges
//   - Regulatory risks
//   - Financial concerns
  
//   RISK LEVEL: High/Medium/Low (with detailed explanation)
//   RECOMMENDED ACTION: Strong Buy/Buy/Hold/Pass
//   - Target investment amount
//   - Expected return
//   - Time horizon

// 11. IPO POTENTIAL:
//   - IPO likelihood and timeline
//   - IPO readiness factors
//   - Comparable company IPOs
//   - Estimated IPO valuation
//   - Market conditions for IPO

// 12. EMPLOYEE SATISFACTION:
//   - Glassdoor rating (if available)
//   - Employee reviews summary
//   - Top 3 pros from employee reviews
//   - Top 3 cons from employee reviews
//   - Work culture insights
//   - Leadership ratings

// 13. CUSTOMER FEEDBACK:
//   - NPS score (if available)
//   - Customer ratings (G2, Capterra, Trustpilot, etc.)
//   - Positive customer feedback themes
//   - Negative customer feedback themes
//   - Customer retention rate
//   - Common complaints

// 14. INFORMATION GAPS:
//   List specific questions that need to be asked to the company where:
//   - Public information is not available
//   - Information is unclear or contradictory
//   - More details are needed for investment decision

// OUTPUT SCHEMA (MUST MATCH EXACTLY)
// {
// "metadata": {
//   "company_name": string,
//   "query_date": "YYYY-MM-DD",
//   "primary_sources_checked": [string,...]
// },
// "data": {
//   "company_overview": {
//     "description": string,
//     "sector": string,
//     "industry": string,
//     "founded_date": string | "Information not publicly available",
//     "founders": [ {"name":string, "role":string|null, "background_short":string|null, "linkedin":string|null } ],
//     "current_cofounders": [ {"name":string, "role":string} ],
//     "current_ceo": {"name":string|null, "since":string|null},
//     "headquarters": {"city":string|null, "country":string|null, "other_offices":[ {"city":string,"country":string} ] },
//     "website": string|null,
//     "sources": [string]
//   },
//   "corporate_structure": {
//     "parent_company": string | null,
//     "subsidiaries": [ {"name":string,"since":string|null} ],
//     "mergers": [ {"company":string,"date":string,"amount_usd": number|null,"source":[string]} ],
//     "acquisitions": [ {"company":string,"date":string,"amount_usd": number|null,"rationale":string|null,"source":[string]} ]
//   },
//   "employee_metrics": {
//     "current_employees": { "value": number | "Information not publicly available", "as_of": string|null, "sources":[string] },
//     "employee_history": [ {"year": "YYYY", "employees": number, "source":string} ],
//     "department_breakdown": [ {"department":string, "employees":number, "source":string} ],
//     "recent_hiring_trend": string,
//     "chart_series": { "years": [string], "employee_counts": [number] }
//   },
//   "funding_history": {
//     "total_funding_usd": number | "Information not publicly available",
//     "rounds": [
//       { "round_type": "Seed|Series A|Series B|Series C|Series D|Bridge|Debt|IPO|Other",
//         "amount_usd": number,
//         "date": string,
//         "valuation_pre_usd": number|null,
//         "valuation_post_usd": number|null,
//         "lead_investors": [string],
//         "sources":[string]
//       }
//     ],
//     "current_valuation_usd": number|null,
//     "current_investors": [ {"name":string,"amount_usd":number|null,"first_invest_date":string|null,"notable":boolean} ],
//     "past_investors_exited": [ {"investor":string,"exit_reason":string,"exit_date":string|null,"source":string} ],
//     "notable_vc_investors": [ {"name":string,"firm":"YC|Sequoia|a16z|Other","sources":[string]} ]
//   },
//   "financial_health": {
//     "annual_revenue": { "latest_year": "YYYY", "value_usd": number | "Information not publicly available", "currency":"USD|INR|etc", "sources":[string], "estimate": true/false, "estimate_basis": string|null },
//     "revenue_history": [ {"year":"YYYY","value_usd":number,"sources":[string],"estimate":true/false} ],
//     "revenue_growth_rate_pct": { "latest_year":"YYYY", "value": number|null, "sources":[string], "estimate": true/false },
//     "profitability": { "status":"profitable|unprofitable|break-even|unknown", "ebitda_usd": number|null, "pat_usd": number|null, "latest_year":"YYYY", "sources":[string] },
//     "key_metrics": { 
//       "ARR_usd": {"value":number|null,"as_of":string|null,"sources":[string]}, 
//       "MRR_usd": {"value":number|null,"as_of":string|null,"sources":[string]}, 
//       "CAC_usd": {"value":number|null,"sources":[string]}, 
//       "LTV_usd": {"value":number|null,"sources":[string]} 
//     },
//     "cash_runway_months": { "value": number|null, "as_of":"YYYY-MM", "sources":[string], "estimate": true/false },
//     "burn_rate_monthly_usd": { "value": number|null, "as_of":"YYYY-MM", "sources":[string], "estimate": true/false },
//     "chart_series": { "years": [string], "revenues_usd": [number], "growth_rates_pct": [number] }
//   },
//   "market_position": {
//     "TAM_usd": {"value":number|null,"year":"YYYY","sources":[string]},
//     "SAM_usd": number|null,
//     "SOM_usd": number|null,
//     "market_share_pct": { "value": number|null, "as_of":"YYYY", "sources":[string] },
//     "market_ranking": { "rank": number|null, "basis":"e.g., revenue/users", "source":string },
//     "competitive_positioning": string,
//     "competitive_advantages": [string],
//     "market_trends": [string]
//   },
//   "competitor_analysis": {
//     "top_competitors": [ {"name":string,"funding_usd":number|null,"market_share_pct":number|null,"strengths":[string],"weaknesses":[string],"source":[string]} ],
//     "feature_pricing_comparison": [ {"competitor":string,"feature_diff":string,"pricing":string,"source":[string]} ],
//     "startup_strengths": [string],
//     "startup_weaknesses": [string],
//     "overall_standing": string
//   },
//   "recent_news_developments": [
//     {"date":"YYYY-MM-DD","title":string,"type":"product|funding|partnership|legal|award|controversy|other","sentiment":"positive|negative|neutral","summary":string,"source":string,"url":string}
//   ],
//   "growth_trajectory": {
//     "historical_growth": [ {"period":"YYYY","metric":"revenue|users|arr|employees|other","value":number,"unit":"USD|%|users|count","source":string,"estimate":false} ],
//     "projected_growth": [ {"period":"YYYY","metric":"revenue|users|arr|other","value":number,"unit":"USD|%|users","source":string,"estimate":true,"estimate_basis":string} ],
//     "key_milestones": [ {"year":"YYYY","milestone":string} ],
//     "growth_drivers": [string],
//     "growth_challenges": [string],
//     "chart_series": { "periods": [string], "values": [number], "metric": string }
//   },
//   "risk_and_investment_rationale": {
//     "why_invest": [string],
//     "why_not_invest": [string],
//     "key_strengths": [string],
//     "key_risks": [string],
//     "competitive_moats": [string],
//     "risk_level": {"level":"High|Medium|Low","explanation":string},
//     "recommended_action": "Strong Buy|Buy|Hold|Pass",
//     "target_investment_usd": number|null,
//     "expected_return_pct": number|null,
//     "time_horizon_years": number|null
//   },
//   "ipo_potential": {
//     "ipo_likelihood": "High|Medium|Low|Not Likely",
//     "estimated_ipo_timeline": string|null,
//     "ipo_readiness_factors": [string],
//     "estimated_ipo_valuation_usd": number|null,
//     "comparable_ipos": [ {"company":string,"valuation_usd":number,"year":"YYYY","source":string} ],
//     "market_conditions": string
//   },
//   "employee_satisfaction": {
//     "glassdoor_rating": {"value":number|null,"as_of":"YYYY-MM","url":string|null},
//     "reviews_summary": string,
//     "top_pros": [string],
//     "top_cons": [string],
//     "work_culture": string,
//     "leadership_rating": number|null,
//     "sources": [string]
//   },
//   "customer_feedback": {
//     "nps_score": {"value":number|null,"as_of":"YYYY-MM","source":string|null},
//     "g2_rating": {"value":number|null,"url":string|null},
//     "trustpilot_rating": {"value":number|null,"url":string|null},
//     "capterra_rating": {"value":number|null,"url":string|null},
//     "positive_themes": [string],
//     "negative_themes": [string],
//     "common_complaints": [string],
//     "customer_retention_pct": {"value":number|null,"source":string|null}
//   },
//   "information_gaps": [ {"question_to_ask": string, "why_needed": string, "category": string} ],
//   "notes_summary": string
// },
// "sources": [ {"url":string,"accessed_on":"YYYY-MM-DD","notes":string} ]
// }

// IMPORTANT INSTRUCTIONS:
// - Provide specific numbers, dates, and facts (not vague statements)
// - Cite sources for key claims (especially financial data)
// - If information is not available, say "Information not publicly available" explicitly
// - Focus on recent data (last 1-2 years primarily)
// - Include both positive and negative information
// - Be objective and balanced in analysis
// - If information is large, break it into points. Do not make it a single paragraph.
// - If any information includes numbers, extract the numbers and the text and put them in the JSON instead of returning large paragraphs.
// - Return comprehensive, structured information with maximum detail and confidence.

// EXTRA RULES TO PREVENT VERBOSE OR INCORRECT OUTPUT:
// - NEVER return a sentence like "publicly not available" unless you actually checked the prioritized sources. Instead use exactly '"Information not publicly available"'.
// - If a field is partly available (e.g., revenue for 2022 but not 2023), return the available years and list missing years in 'information_gaps'.
// - Keep descriptive list elements short (≤280 chars). Use arrays for lists; avoid paragraphs.
// - For every numeric field, include either 'sources' or 'estimate_basis'. Missing both = set 'null'.
// - Keep data factual, structured, and concise for analytical visualization.
// - Extract ALL numbers from text into numeric fields with proper units.
// - Include both positive and negative information objectively.
// - For past investors who exited, WHY they exited is CRITICAL - research this thoroughly.
// - Recent news should focus on last 6 months primarily.
// - Provide specific dates, not vague timeframes.
// - Chart series data should be time-ordered and complete for visualization.`;
// }

private buildDueDiligencePrompt(startupName: string): string {
  return `You are a research assistant. Conduct comprehensive due diligence on the startup named: ${startupName}.

GLOBAL INSTRUCTIONS (MUST FOLLOW)
1. OUTPUT FORMAT: Return ONLY a single JSON object as the final answer (no extra narrative). The JSON must follow the schema in "OUTPUT SCHEMA" below exactly. Use 'null' for unknown numeric/date/string values only if exhaustive public-source search returns nothing. **Do not** return long paragraphs for any field.
2. SOURCING: For every non-null field include a 'sources' array item in the JSON referencing the exact URL(s) or citation(s) used. Mark each source with a short 'why' tag (e.g., "funding_round", "employee_count", "revenue_2023").
3. SEARCH SCOPE: Prioritize the following sources in this order:
   PRIMARY SOURCES (Use these first):
   - Crunchbase (crunchbase.com) - BEST for funding, valuation, investors
   - PitchBook (pitchbook.com) - Excellent for funding rounds and valuations
   - CB Insights (cbinsights.com) - Great for funding trends and investor data
   - TechCrunch (techcrunch.com) - Latest funding announcements
   - VentureBeat (venturebeat.com) - Funding news and analysis
   - The Information (theinformation.com) - Premium tech business news
   - Forbes (forbes.com) - Company valuations and funding
   - Bloomberg (bloomberg.com) - Financial data and valuations
   - Reuters (reuters.com) - Business and funding news
   
   SECONDARY SOURCES:
   - Tracxn (tracxn.com) - Indian startup data
   - AngelList (angel.co) - Startup profiles and funding
   - LinkedIn (linkedin.com) - Company size, team info
   - Company website and press releases
   - Investor firm websites (Sequoia, a16z, YC, Accel, Tiger Global, etc.)
   - YourStory, Inc42, Entrackr (Indian startup news)
   - LiveMint, Economic Times, Moneycontrol (Indian business news)
   - SEC/regulatory filings (for public or pre-IPO companies)
   
   ADDITIONAL SOURCES:
   - Wikipedia, TheOrg, G2, Capterra, Glassdoor, Reddit, YouTube
   - Clay.com, BetterCreating, Buildd.com
   - AngelOne, Smart-Investing.in, Money Rediff, Morgan Stanley research
   
4. "Not publicly available": Only output the exact string '"Information not publicly available"' in a field **if** you have exhausted the prioritized list above and could not find the data. Otherwise provide the number/text or a sourced estimate (see ESTIMATES rule).
5. DATES: Use ISO format YYYY-MM-DD when day is available; otherwise YYYY-MM for month-only, or YYYY for year-only.
6. NUMBERS: All numeric fields must be numbers (no text). If value is a range, provide 'min' and 'max' numeric fields. Add 'currency' or 'unit' field where relevant (e.g., INR, USD, %). Do not return numbers embedded in sentences.
7. ESTIMATES: If you must estimate, put the numeric estimate and include '"estimate": true' plus at least one 'estimate_basis' explaining how you derived it and list sources. Do NOT present estimates as facts.
8. GROWTH & CHART DATA: Historical and projected growth must be arrays of '{ "period":"YYYY" or "YYYY-MM-DD", "value": number, "unit":"%" or "USD", "source": "...", "estimate": true/false }'. Also provide a 'chart_series' object for each metric intended for charting (time-ordered arrays).
9. LENGTH: Keep any short commentary strings under 280 characters. For longer reasoning, add an entry in 'data.information_gaps' or 'data.notes_summary' but still <1000 chars.
10. CITATION LIMIT: For each numeric datapoint include up to 3 best sources. For overall claim summaries, cite up to 5 most important sources.
11. RECENCY: Prefer data from the last 24 months. If older data is used, include 'as_of' date and explain if likely outdated.
12. VALUATION ACCURACY: For valuations, ALWAYS verify with multiple sources. If sources conflict, list all values with their sources and use the most credible/recent one. Cross-reference funding round amounts with valuations to ensure they make logical sense.

RESEARCH THE FOLLOWING (BE COMPREHENSIVE AND SPECIFIC):

1. COMPANY OVERVIEW:
 Collect and structure the following data:
 - description: Detailed description of what ${startupName} does (under 280 chars)
 - sector: Business sector (e.g., FinTech, HealthTech, SaaS)
 - industry: Specific industry within sector
 - founded_date: Exact founding date (YYYY-MM-DD or YYYY-MM or YYYY)
 - founders: Array of ALL founders with:
   * name: Full name
   * role: Original role (e.g., "Co-founder & CEO")
   * background_short: Previous experience/education (under 140 chars)
   * linkedin: LinkedIn profile URL
 - current_cofounders: Array of current co-founders with name and role
 - current_ceo: Name and since when (YYYY-MM-DD)
 - headquarters: City and country of HQ
 - other_offices: Array of all other office locations (city, country)
 - website: Company website URL
 - sources: URLs for all above data

2. CORPORATE STRUCTURE:
 Research and document:
 - parent_company: Parent company name (or null)
 - subsidiaries: Array of subsidiaries with name and since when
 - mergers: Array with:
   * company: Company merged with
   * date: Merger date (YYYY-MM-DD)
   * amount_usd: Deal amount in USD (number)
   * source: Source URLs
 - acquisitions: Array with:
   * company: Company acquired
   * date: Acquisition date (YYYY-MM-DD)
   * amount_usd: Deal amount in USD (number)
   * rationale: Why acquired (under 280 chars)
   * source: Source URLs

3. EMPLOYEE METRICS:
 Collect precise numbers:
 - current_employees: 
   * value: Total employee count (number)
   * as_of: Date of count (YYYY-MM)
   * sources: Source URLs
 - employee_history: Year-by-year array with:
   * year: YYYY
   * employees: Count (number)
   * source: URL
 - department_breakdown: Array with:
   * department: Department name (engineering, sales, marketing, etc.)
   * employees: Count (number)
   * source: URL
 - recent_hiring_trend: Hiring trend description (under 280 chars)
 - chart_series: For visualization:
   * years: Array of years
   * employee_counts: Array of counts matching years

4. FUNDING HISTORY (CRITICAL - BE VERY SPECIFIC AND ACCURATE):
 Research ALL funding details using PRIMARY SOURCES (Crunchbase, PitchBook, CB Insights, TechCrunch, VentureBeat):
 
 CRITICAL RULES FOR VALUATIONS:
 - Search for explicit valuation figures in funding announcements
 - Verify valuations with at least 2 independent sources when possible
 - If only post-money valuation is available: valuation_pre_usd = valuation_post_usd - amount_usd
 - If only pre-money valuation is available: valuation_post_usd = valuation_pre_usd + amount_usd
 - Check company press releases, investor announcements, and financial news for valuation data
 - For recent rounds (within 12 months), search extensively in news sources
 - Cross-reference: valuation should increase logically across rounds
 
 - total_funding_usd: Total funding raised across ALL rounds (number in USD)
 - rounds: Array of ALL funding rounds with:
   * round_type: Seed/Pre-Seed/Angel/Series A/Series B/Series C/Series D/Series E/Bridge/Debt/IPO/Other
   * amount_usd: Amount raised in THIS round (number)
   * date: Round date (YYYY-MM-DD) - exact date from announcement
   * valuation_pre_usd: Pre-money valuation (number or null) - SEARCH EXTENSIVELY for this
   * valuation_post_usd: Post-money valuation (number or null) - SEARCH EXTENSIVELY for this
   * lead_investors: Array of lead investor names
   * participating_investors: Array of all participating investor names
   * sources: Source URLs (must include at least 2 sources for valuation if available)
   * valuation_source_note: If valuation not found, explain what sources were checked
 - current_valuation_usd: Most recent company valuation (number or null)
   * as_of: Date of valuation (YYYY-MM-DD)
   * basis: "funding_round" or "secondary_sale" or "estimate"
   * sources: URLs
 - current_investors: Array with:
   * name: Investor name
   * amount_usd: Total investment amount (number or null)
   * first_invest_date: First investment date (YYYY-MM-DD)
   * rounds_participated: Array of round names they participated in
   * notable: Boolean (true for YC, Sequoia, a16z, Tiger Global, Accel, etc.)
 - past_investors_exited: Array with (VERY IMPORTANT):
   * investor: Investor name
   * exit_reason: WHY they exited (specific reason - under 280 chars)
   * exit_date: Exit date (YYYY-MM-DD or null)
   * exit_value_usd: Exit value if known (number or null)
   * source: Source URL
 - notable_vc_investors: Array with:
   * name: Investor name
   * firm: YC/Sequoia/a16z/Tiger Global/Accel/Other
   * total_invested_usd: Total amount invested (number or null)
   * sources: URLs

5. FINANCIAL HEALTH:
 Collect ALL financial metrics:
 - annual_revenue:
   * latest_year: YYYY
   * value_usd: Revenue in USD (number)
   * currency: Original currency (USD/INR/EUR/etc)
   * sources: URLs
   * estimate: true/false
   * estimate_basis: If estimate, explain how derived
 - revenue_history: Year-by-year array (last 3-5 years) with:
   * year: YYYY
   * value_usd: Revenue (number)
   * sources: URLs
   * estimate: true/false
 - revenue_growth_rate_pct:
   * latest_year: YYYY
   * value: Growth rate percentage (number)
   * sources: URLs
   * estimate: true/false
 - profitability:
   * status: profitable/unprofitable/break-even/unknown
   * ebitda_usd: EBITDA (number or null)
   * pat_usd: Profit after tax (number or null)
   * latest_year: YYYY
   * sources: URLs
 - key_metrics: For each metric collect value, as_of date, sources:
   * ARR_usd: Annual recurring revenue
   * MRR_usd: Monthly recurring revenue
   * CAC_usd: Customer acquisition cost
   * LTV_usd: Lifetime value
 - cash_runway_months:
   * value: Months (number or null)
   * as_of: YYYY-MM
   * sources: URLs
   * estimate: true/false
 - burn_rate_monthly_usd:
   * value: Monthly burn (number or null)
   * as_of: YYYY-MM
   * sources: URLs
   * estimate: true/false
 - chart_series: For visualization:
   * years: Array of years
   * revenues_usd: Array of revenues
   * growth_rates_pct: Array of growth rates

6. MARKET POSITION:
 Research market data:
 - TAM_usd: Total addressable market with:
   * value: Market size in USD (number or null)
   * year: YYYY
   * sources: URLs
 - SAM_usd: Serviceable addressable market (number or null)
 - SOM_usd: Serviceable obtainable market (number or null)
 - market_share_pct:
   * value: Market share percentage (number or null)
   * as_of: YYYY
   * sources: URLs
 - market_ranking:
   * rank: Ranking number (e.g., 3 for #3 in space)
   * basis: What ranking is based on (e.g., "revenue", "users")
   * source: URL
 - competitive_positioning: Positioning statement (under 280 chars)
 - competitive_advantages: Array of advantages (each under 140 chars)
 - market_trends: Array of market trends (each under 140 chars)

7. COMPETITOR ANALYSIS:
 Analyze top competitors:
 - top_competitors: Array of 3-5 competitors with:
   * name: Competitor name
   * funding_usd: Their total funding (number or null)
   * market_share_pct: Their market share (number or null)
   * strengths: Array of their strengths (each under 140 chars)
   * weaknesses: Array of their weaknesses (each under 140 chars)
   * source: Source URLs
 - feature_pricing_comparison: Array comparing features/pricing:
   * competitor: Competitor name
   * feature_diff: Feature differences vs ${startupName} (under 280 chars)
   * pricing: Pricing comparison (under 140 chars)
   * source: URLs
 - startup_strengths: Array of ${startupName}'s strengths vs competitors (each under 140 chars)
 - startup_weaknesses: Array of ${startupName}'s weaknesses vs competitors (each under 140 chars)
 - overall_standing: Where ${startupName} stands overall (under 280 chars)

8. RECENT NEWS & DEVELOPMENTS (LAST 6 MONTHS - WITH DATES, SOURCES, URLS):
 Structure news into dedicated categories. For EACH news item collect:
 - date: News date (YYYY-MM-DD)
 - title: News headline
 - summary: Brief summary (under 280 chars)
 - source: Source name (e.g., "TechCrunch", "Forbes")
 - url: Direct URL to article
 - sentiment: positive/negative/neutral
 
 Organize into these specific categories:
 - all_news: Array of ALL news items from last 6 months (comprehensive list)
 - product_launches: Array of product/feature launches only
 - partnerships: Array of partnerships and collaborations
 - awards_recognition: Array of awards, recognition, achievements received
 - controversies: Array of controversies, legal issues, negative news
 - funding_announcements: Array of funding-related news
 - leadership_changes: Array of C-suite/leadership changes
 - market_expansion: Array of new market entries, office openings
 
 Each category should be sorted by date (newest first)

9. GROWTH TRAJECTORY:
 Document growth patterns:
 - historical_growth: Array of past growth data with:
   * period: YYYY
   * metric: revenue/users/arr/employees/other
   * value: Numeric value
   * unit: USD/%/users/count
   * source: URL
   * estimate: false (historical = actual)
 - projected_growth: Array of future projections with:
   * period: YYYY
   * metric: revenue/users/arr/other
   * value: Numeric value
   * unit: USD/%/users
   * source: URL
   * estimate: true
   * estimate_basis: How projection was derived
 - key_milestones: Array with:
   * year: YYYY
   * milestone: Achievement (under 140 chars)
 - growth_drivers: Array of growth drivers (each under 140 chars)
 - growth_challenges: Array of challenges (each under 140 chars)
 - chart_series: For visualization:
   * periods: Array of time periods
   * values: Array of values
   * metric: What metric is being charted

10. RISK FACTORS & INVESTMENT RATIONALE:
  Comprehensive investment analysis:
  - why_invest: Array of reasons to invest (each under 140 chars):
    * Key strengths and advantages
    * Growth potential
    * Market opportunity
    * Team quality
    * Competitive moats
  - why_not_invest: Array of reasons not to invest (each under 140 chars):
    * Key risks and concerns
    * Competition threats
    * Market challenges
    * Regulatory risks
    * Financial concerns
  - key_strengths: Array of strengths (each under 140 chars)
  - key_risks: Array of risks (each under 140 chars)
  - competitive_moats: Array of moats (each under 140 chars)
  - risk_level:
    * level: High/Medium/Low
    * explanation: Detailed risk explanation (under 280 chars)
  - recommended_action: Strong Buy/Buy/Hold/Pass
  - target_investment_usd: Recommended investment amount (number or null)
  - expected_return_pct: Expected return percentage (number or null)
  - time_horizon_years: Investment time horizon in years (number or null)

11. IPO POTENTIAL:
  Assess IPO readiness:
  - ipo_likelihood: High/Medium/Low/Not Likely
  - estimated_ipo_timeline: Timeline estimate (e.g., "2025-2026" or null)
  - ipo_readiness_factors: Array of readiness factors (each under 140 chars)
  - estimated_ipo_valuation_usd: IPO valuation estimate (number or null)
  - comparable_ipos: Array of comparable IPOs with:
    * company: Company name
    * valuation_usd: IPO valuation (number)
    * year: YYYY
    * source: URL
  - market_conditions: Market conditions assessment (under 280 chars)

12. EMPLOYEE SATISFACTION:
  Research employee sentiment:
  - glassdoor_rating:
    * value: Rating number (1-5 or null)
    * as_of: YYYY-MM
    * url: Glassdoor URL or null
  - reviews_summary: Summary of employee reviews (under 280 chars)
  - top_pros: Array of top 3 pros from reviews (each under 140 chars)
  - top_cons: Array of top 3 cons from reviews (each under 140 chars)
  - work_culture: Work culture description (under 280 chars)
  - leadership_rating: Leadership rating (number or null)
  - sources: Source URLs

13. CUSTOMER FEEDBACK:
  Collect customer sentiment data:
  - nps_score:
    * value: NPS score (-100 to 100 or null)
    * as_of: YYYY-MM
    * source: URL or null
  - g2_rating:
    * value: Rating (1-5 or null)
    * url: G2 URL or null
  - trustpilot_rating:
    * value: Rating (1-5 or null)
    * url: Trustpilot URL or null
  - capterra_rating:
    * value: Rating (1-5 or null)
    * url: Capterra URL or null
  - positive_themes: Array of positive feedback themes (each under 140 chars)
  - negative_themes: Array of negative feedback themes (each under 140 chars)
  - common_complaints: Array of common complaints (each under 140 chars)
  - customer_retention_pct:
    * value: Retention percentage (number or null)
    * source: URL or null

14. INFORMATION GAPS:
  Document what's missing:
  For each gap provide:
  - question_to_ask: Specific question that needs to be asked to company
  - why_needed: Why this information is needed for investment decision
  - category: company_overview/funding/financials/market/team/product/other
  
  Flag gaps where:
  - Public information is not available
  - Information is unclear or contradictory
  - More details are needed for investment decision
  - Data is outdated (older than 24 months)

OUTPUT SCHEMA (MUST MATCH EXACTLY)
{
"metadata": {
  "company_name": string,
  "query_date": "YYYY-MM-DD",
  "primary_sources_checked": [string,...]
},
"data": {
  "company_overview": {
    "description": string,
    "sector": string,
    "industry": string,
    "founded_date": string | "Information not publicly available",
    "founders": [ {"name":string, "role":string|null, "background_short":string|null, "linkedin":string|null } ],
    "current_cofounders": [ {"name":string, "role":string} ],
    "current_ceo": {"name":string|null, "since":string|null},
    "headquarters": {"city":string|null, "country":string|null, "other_offices":[ {"city":string,"country":string} ] },
    "website": string|null,
    "sources": [string]
  },
  "corporate_structure": {
    "parent_company": string | null,
    "subsidiaries": [ {"name":string,"since":string|null} ],
    "mergers": [ {"company":string,"date":string,"amount_usd": number|null,"source":[string]} ],
    "acquisitions": [ {"company":string,"date":string,"amount_usd": number|null,"rationale":string|null,"source":[string]} ]
  },
  "employee_metrics": {
    "current_employees": { "value": number | "Information not publicly available", "as_of": string|null, "sources":[string] },
    "employee_history": [ {"year": "YYYY", "employees": number, "source":string} ],
    "department_breakdown": [ {"department":string, "employees":number, "source":string} ],
    "recent_hiring_trend": string,
    "chart_series": { "years": [string], "employee_counts": [number] }
  },
  "funding_history": {
    "total_funding_usd": number | "Information not publicly available",
    "rounds": [
      { "round_type": "Seed|Pre-Seed|Angel|Series A|Series B|Series C|Series D|Series E|Bridge|Debt|IPO|Other",
        "amount_usd": number,
        "date": "YYYY-MM-DD",
        "valuation_pre_usd": number|null,
        "valuation_post_usd": number|null,
        "lead_investors": [string],
        "participating_investors": [string],
        "sources":[string],
        "valuation_source_note": string|null
      }
    ],
    "current_valuation_usd": {"value":number|null,"as_of":"YYYY-MM-DD","basis":"funding_round|secondary_sale|estimate","sources":[string]},
    "current_investors": [ {"name":string,"amount_usd":number|null,"first_invest_date":"YYYY-MM-DD","rounds_participated":[string],"notable":boolean} ],
    "past_investors_exited": [ {"investor":string,"exit_reason":string,"exit_date":"YYYY-MM-DD"|null,"exit_value_usd":number|null,"source":string} ],
    "notable_vc_investors": [ {"name":string,"firm":"YC|Sequoia|a16z|Tiger Global|Accel|Other","total_invested_usd":number|null,"sources":[string]} ]
  },
  "financial_health": {
    "annual_revenue": { "latest_year": "YYYY", "value_usd": number | "Information not publicly available", "currency":"USD|INR|etc", "sources":[string], "estimate": true/false, "estimate_basis": string|null },
    "revenue_history": [ {"year":"YYYY","value_usd":number,"sources":[string],"estimate":true/false} ],
    "revenue_growth_rate_pct": { "latest_year":"YYYY", "value": number|null, "sources":[string], "estimate": true/false },
    "profitability": { "status":"profitable|unprofitable|break-even|unknown", "ebitda_usd": number|null, "pat_usd": number|null, "latest_year":"YYYY", "sources":[string] },
    "key_metrics": { 
      "ARR_usd": {"value":number|null,"as_of":string|null,"sources":[string]}, 
      "MRR_usd": {"value":number|null,"as_of":string|null,"sources":[string]}, 
      "CAC_usd": {"value":number|null,"sources":[string]}, 
      "LTV_usd": {"value":number|null,"sources":[string]} 
    },
    "cash_runway_months": { "value": number|null, "as_of":"YYYY-MM", "sources":[string], "estimate": true/false },
    "burn_rate_monthly_usd": { "value": number|null, "as_of":"YYYY-MM", "sources":[string], "estimate": true/false },
    "chart_series": { "years": [string], "revenues_usd": [number], "growth_rates_pct": [number] }
  },
  "market_position": {
    "TAM_usd": {"value":number|null,"year":"YYYY","sources":[string]},
    "SAM_usd": number|null,
    "SOM_usd": number|null,
    "market_share_pct": { "value": number|null, "as_of":"YYYY", "sources":[string] },
    "market_ranking": { "rank": number|null, "basis":"e.g., revenue/users", "source":string },
    "competitive_positioning": string,
    "competitive_advantages": [string],
    "market_trends": [string]
  },
  "competitor_analysis": {
    "top_competitors": [ {"name":string,"funding_usd":number|null,"market_share_pct":number|null,"strengths":[string],"weaknesses":[string],"source":[string]} ],
    "feature_pricing_comparison": [ {"competitor":string,"feature_diff":string,"pricing":string,"source":[string]} ],
    "startup_strengths": [string],
    "startup_weaknesses": [string],
    "overall_standing": string
  },
  "recent_news_developments": {
    "all_news": [
      {"date":"YYYY-MM-DD","title":string,"summary":string,"source":string,"url":string,"sentiment":"positive|negative|neutral"}
    ],
    "product_launches": [
      {"date":"YYYY-MM-DD","title":string,"summary":string,"source":string,"url":string}
    ],
    "partnerships": [
      {"date":"YYYY-MM-DD","title":string,"summary":string,"source":string,"url":string}
    ],
    "awards_recognition": [
      {"date":"YYYY-MM-DD","title":string,"summary":string,"source":string,"url":string}
    ],
    "controversies": [
      {"date":"YYYY-MM-DD","title":string,"summary":string,"source":string,"url":string,"sentiment":"negative"}
    ],
    "funding_announcements": [
      {"date":"YYYY-MM-DD","title":string,"summary":string,"source":string,"url":string}
    ],
    "leadership_changes": [
      {"date":"YYYY-MM-DD","title":string,"summary":string,"source":string,"url":string}
    ],
    "market_expansion": [
      {"date":"YYYY-MM-DD","title":string,"summary":string,"source":string,"url":string}
    ]
  },
  "growth_trajectory": {
    "historical_growth": [ {"period":"YYYY","metric":"revenue|users|arr|employees|other","value":number,"unit":"USD|%|users|count","source":string,"estimate":false} ],
    "projected_growth": [ {"period":"YYYY","metric":"revenue|users|arr|other","value":number,"unit":"USD|%|users","source":string,"estimate":true,"estimate_basis":string} ],
    "key_milestones": [ {"year":"YYYY","milestone":string} ],
    "growth_drivers": [string],
    "growth_challenges": [string],
    "chart_series": { "periods": [string], "values": [number], "metric": string }
  },
  "risk_and_investment_rationale": {
    "why_invest": [string],
    "why_not_invest": [string],
    "key_strengths": [string],
    "key_risks": [string],
    "competitive_moats": [string],
    "risk_level": {"level":"High|Medium|Low","explanation":string},
    "recommended_action": "Strong Buy|Buy|Hold|Pass",
    "target_investment_usd": number|null,
    "expected_return_pct": number|null,
    "time_horizon_years": number|null
  },
  "ipo_potential": {
    "ipo_likelihood": "High|Medium|Low|Not Likely",
    "estimated_ipo_timeline": string|null,
    "ipo_readiness_factors": [string],
    "estimated_ipo_valuation_usd": number|null,
    "comparable_ipos": [ {"company":string,"valuation_usd":number,"year":"YYYY","source":string} ],
    "market_conditions": string
  },
  "employee_satisfaction": {
    "glassdoor_rating": {"value":number|null,"as_of":"YYYY-MM","url":string|null},
    "reviews_summary": string,
    "top_pros": [string],
    "top_cons": [string],
    "work_culture": string,
    "leadership_rating": number|null,
    "sources": [string]
  },
  "customer_feedback": {
    "nps_score": {"value":number|null,"as_of":"YYYY-MM","source":string|null},
    "g2_rating": {"value":number|null,"url":string|null},
    "trustpilot_rating": {"value":number|null,"url":string|null},
    "capterra_rating": {"value":number|null,"url":string|null},
    "positive_themes": [string],
    "negative_themes": [string],
    "common_complaints": [string],
    "customer_retention_pct": {"value":number|null,"source":string|null}
  },
  "information_gaps": [ {"question_to_ask": string, "why_needed": string, "category": string} ],
  "notes_summary": string
},
"sources": [ {"url":string,"accessed_on":"YYYY-MM-DD","notes":string} ]
}

IMPORTANT INSTRUCTIONS:
- Provide specific numbers, dates, and facts (not vague statements)
- Cite sources for key claims (especially financial data)
- If information is not available, say "Information not publicly available" explicitly
- Focus on recent data (last 1-2 years primarily)
- Include both positive and negative information
- Be objective and balanced in analysis
- If information is large, break it into points. Do not make it a single paragraph.
- If any information includes numbers, extract the numbers and the text and put them in the JSON instead of returning large paragraphs.
- Return comprehensive, structured information with maximum detail and confidence.

EXTRA RULES TO PREVENT VERBOSE OR INCORRECT OUTPUT:
- NEVER return a sentence like "publicly not available" unless you actually checked the prioritized sources. Instead use exactly '"Information not publicly available"'.
- If a field is partly available (e.g., revenue for 2022 but not 2023), return the available years and list missing years in 'information_gaps'.
- Keep descriptive list elements short (≤280 chars). Use arrays for lists; avoid paragraphs.
- For every numeric field, include either 'sources' or 'estimate_basis'. Missing both = set 'null'.
- Keep data factual, structured, and concise for analytical visualization.
- Extract ALL numbers from text into numeric fields with proper units.
- Include both positive and negative information objectively.
- For past investors who exited, WHY they exited is CRITICAL - research this thoroughly.
- Recent news should focus on last 6 months primarily.
- Provide specific dates, not vague timeframes.
- Chart series data should be time-ordered and complete for visualization.`;
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
    "RevenueGrowthRate": "string",
    "revenueHistory": [{"year": "string", "revenue": "string", "growth": "string"}],
    "profitability": "string",
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

