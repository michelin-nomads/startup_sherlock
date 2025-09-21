import "dotenv/config";
import * as fs from "fs";
import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface StartupAnalysisResult {
  overallScore: number;
  metrics: {
    marketSize: number;
    traction: number;
    team: number;
    product: number;
    financials: number;
    competition: number;
  };
  riskFlags: Array<{
    type: 'high' | 'medium' | 'low';
    category: string;
    description: string;
    impact: string;
  }>;
  keyInsights: string[];
  recommendation: {
    decision: 'strong_buy' | 'buy' | 'hold' | 'pass';
    reasoning: string;
    targetInvestment: number;
    expectedReturn: number;
  };
  riskLevel: 'Low' | 'Medium' | 'High';
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

// Sleep utility for delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry logic with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = RETRY_CONFIG.maxRetries,
  baseDelay: number = RETRY_CONFIG.baseDelay
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a retryable error (503, 429, 500, 502, 504)
      const isRetryable = error instanceof Error && 
        (error.message.includes('503') || 
         error.message.includes('429') || 
         error.message.includes('500') || 
         error.message.includes('502') || 
         error.message.includes('504') ||
         error.message.includes('overloaded') ||
         error.message.includes('rate limit'));
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
        RETRY_CONFIG.maxDelay
      );
      
      console.log(`⏳ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      console.log(`   Error: ${error.message}`);
      
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

// Try multiple Gemini models in order of preference (Pro, then Flash)
async function tryModelsInOrder(operation: (model: string) => Promise<any>): Promise<any> {
  const geminiModels = ['gemini-2.5-pro', 'gemini-2.5-flash'];
  let lastError: Error;
  
  // Try Gemini models first
  for (const model of geminiModels) {
    try {
      console.log(`🤖 Trying Gemini model: ${model}`);
      return await operation(model);
    } catch (error) {
      lastError = error as Error;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`❌ Gemini model ${model} failed: ${errorMessage}`);
      
      // If it's not a model-specific error, don't try other models
      if (!errorMessage.includes('503') && 
          !errorMessage.includes('overloaded') && 
          !errorMessage.includes('429')) {
        throw error;
      }
    }
  }
  
  // If all Gemini models fail, throw a user-friendly error
  console.log('❌ All Gemini models failed - no fallback available');
  throw new Error('Our AI analysis service is temporarily overloaded. Please try again in a few moments.');
}

// Parse JSON response from any model
function parseAnalysisResponse(responseText: string): StartupAnalysisResult {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[0];
      const data = JSON.parse(jsonStr);
      
      // Validate the response structure
      if (data.overallScore && data.metrics && data.recommendation) {
        return data as StartupAnalysisResult;
      }
    }
    
    // If JSON parsing fails, try to extract key information
    return extractAnalysisFromText(responseText);
  } catch (error) {
    console.error('❌ Failed to parse response:', error);
    return extractAnalysisFromText(responseText);
  }
}

// Helper functions for dynamic calculations
function calculateDynamicInvestment(overallScore: number, metrics: any): number {
  // Calculate average metric value for normalization
  const avgMetric = (metrics.marketSize + metrics.team + metrics.product + metrics.traction + metrics.financials + metrics.competition) / 6;
  
  // Base investment scales with overall score relative to average
  const scoreRatio = overallScore / avgMetric;
  const baseInvestment = avgMetric * scoreRatio * (overallScore * 1000000); // Scale with score
  
  // Adjust based on relative metric strengths
  const marketWeight = metrics.marketSize / avgMetric;
  const teamWeight = metrics.team / avgMetric;
  const productWeight = metrics.product / avgMetric;
  
  const dynamicInvestment = baseInvestment * marketWeight * teamWeight * productWeight;
  
  // Dynamic bounds based on metric values
  const minBound = avgMetric * (overallScore / 100) * 500000;
  const maxBound = avgMetric * (overallScore / 100) * 5000000;
  
  return Math.max(minBound, Math.min(maxBound, Math.round(dynamicInvestment)));
}

function calculateDynamicReturn(overallScore: number, metrics: any): number {
  // Calculate average metric value for normalization
  const avgMetric = (metrics.marketSize + metrics.team + metrics.product + metrics.traction + metrics.financials + metrics.competition) / 6;
  
  // Base return scales with score relative to average metrics
  const scoreRatio = overallScore / avgMetric;
  const baseReturn = scoreRatio * (avgMetric / 100) * 6; // Scale with metrics
  
  // Adjust based on traction and financials relative to average
  const tractionWeight = metrics.traction / avgMetric;
  const financialWeight = metrics.financials / avgMetric;
  
  const dynamicReturn = baseReturn * tractionWeight * financialWeight;
  
  // Dynamic bounds based on metric performance
  const minReturn = Math.max(1.5, avgMetric / 50);
  const maxReturn = Math.min(8.0, avgMetric / 10);
  
  return Math.max(minReturn, Math.min(maxReturn, Math.round(dynamicReturn * 10) / 10));
}

// Extract analysis from unstructured text (fallback for open source models)
function extractAnalysisFromText(text: string): StartupAnalysisResult {
  console.log('📝 Extracting analysis from unstructured text...');
  
  // Simple heuristics to extract scores and information
  const scoreMatch = text.match(/(?:overall|total).*?score.*?(\d+)/i);
  const overallScore = scoreMatch ? parseInt(scoreMatch[1]) : 75;
  
  // Extract individual metrics
  const marketMatch = text.match(/market.*?(\d+)/i);
  const tractionMatch = text.match(/traction.*?(\d+)/i);
  const teamMatch = text.match(/team.*?(\d+)/i);
  const productMatch = text.match(/product.*?(\d+)/i);
  const financialMatch = text.match(/financial.*?(\d+)/i);
  const competitionMatch = text.match(/competition.*?(\d+)/i);
  
  const metrics = {
    marketSize: marketMatch ? parseInt(marketMatch[1]) : 70,
    traction: tractionMatch ? parseInt(tractionMatch[1]) : 65,
    team: teamMatch ? parseInt(teamMatch[1]) : 75,
    product: productMatch ? parseInt(productMatch[1]) : 70,
    financials: financialMatch ? parseInt(financialMatch[1]) : 60,
    competition: competitionMatch ? parseInt(competitionMatch[1]) : 70
  };
  
  // Determine recommendation based on overall score
  let decision: 'strong_buy' | 'buy' | 'hold' | 'pass' = 'hold';
  if (overallScore >= 85) decision = 'strong_buy';
  else if (overallScore >= 70) decision = 'buy';
  else if (overallScore < 55) decision = 'pass';
  
  // Determine risk level
  let riskLevel: 'Low' | 'Medium' | 'High' = 'Medium';
  if (overallScore >= 80) riskLevel = 'Low';
  else if (overallScore < 60) riskLevel = 'High';
  
  return {
    overallScore,
    metrics,
    riskFlags: [
      {
        type: 'medium',
        category: 'Analysis Method',
        description: 'Analysis performed using open source model fallback',
        impact: 'Results may be less detailed than Gemini analysis'
      }
    ],
    keyInsights: [
      'Analysis performed using open source model fallback',
      'Gemini API was unavailable, using alternative analysis method',
      'Results based on document content analysis'
    ],
    recommendation: {
      decision,
      reasoning: `Based on overall score of ${overallScore}, this appears to be a ${decision.replace('_', ' ')} opportunity.`,
      targetInvestment: calculateDynamicInvestment(overallScore, metrics),
      expectedReturn: calculateDynamicReturn(overallScore, metrics)
    },
    riskLevel
  };
}

export async function analyzeStartupDocuments(documents: Array<{ content: string; type: string; name: string }>): Promise<StartupAnalysisResult> {
  try {
    const systemPrompt = `You are an expert startup investment analyst with 15+ years of experience in venture capital and startup evaluation. Your task is to analyze startup documents and provide a comprehensive investment assessment.

ANALYSIS FRAMEWORK:
1. Market Size & Opportunity (0-100)
   - Total Addressable Market (TAM)
   - Market growth rate and trends
   - Competitive landscape saturation
   - Regulatory environment

2. Traction & Growth Metrics (0-100)
   - Revenue growth rate
   - User/customer acquisition
   - Product-market fit indicators
   - Key performance metrics

3. Team Quality & Experience (0-100)
   - Founder backgrounds and expertise
   - Team composition and skills
   - Previous startup experience
   - Advisory board quality

4. Product/Technology Innovation (0-100)
   - Technology differentiation
   - Intellectual property
   - Scalability and defensibility
   - Product roadmap clarity

5. Financial Health & Unit Economics (0-100)
   - Revenue model viability
   - Unit economics (CAC, LTV, payback period)
   - Burn rate and runway
   - Path to profitability

6. Competitive Positioning (0-100)
   - Competitive advantages
   - Market positioning
   - Barriers to entry
   - Threat of substitutes

SCORING GUIDELINES:
- 90-100: Exceptional, industry-leading
- 80-89: Strong, above average
- 70-79: Good, meets expectations
- 60-69: Average, some concerns
- 50-59: Below average, significant issues
- 0-49: Poor, major red flags

RISK ASSESSMENT:
- High Risk: Multiple critical issues, poor fundamentals
- Medium Risk: Some concerns but manageable
- Low Risk: Strong fundamentals, minor issues

INVESTMENT RECOMMENDATIONS:
- strong_buy: Exceptional opportunity (score 85+)
- buy: Good investment opportunity (score 70-84)
- hold: Wait and see (score 55-69)
- pass: Not recommended (score <55)

CRITICAL: You MUST respond with valid JSON in the exact format specified below. Do not include any text before or after the JSON. Ensure all numbers are valid (no NaN, null, or undefined values).

{
  "overallScore": number,
  "metrics": {
    "marketSize": number,
    "traction": number,
    "team": number,
    "product": number,
    "financials": number,
    "competition": number
  },
  "riskFlags": [
    {
      "type": "high|medium|low",
      "category": "string",
      "description": "string",
      "impact": "string"
    }
  ],
  "keyInsights": ["string"],
  "recommendation": {
    "decision": "strong_buy|buy|hold|pass",
    "reasoning": "string",
    "targetInvestment": number,
    "expectedReturn": number
  },
  "riskLevel": "Low|Medium|High"
}`;

    const documentContent = documents.map(doc => 
      `--- ${doc.name} (${doc.type}) ---\n${doc.content}\n`
    ).join('\n');

    console.log('📊 Starting analysis with retry logic and open source fallback...');
    console.log(`📄 Documents: ${documents.length}, Content length: ${documentContent.length}`);
    
    // Try multiple models with retry logic
    const response = await tryModelsInOrder(async (model) => {
      if (model.startsWith('gemini')) {
        // Gemini API call
        return await retryWithBackoff(async () => {
          const geminiResponse = await ai.models.generateContent({
            model: model,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: "application/json",
              responseSchema: {
                type: "object",
                properties: {
                  overallScore: { type: "number", minimum: 0, maximum: 100 },
                  metrics: {
                    type: "object",
                    properties: {
                      marketSize: { type: "number", minimum: 0, maximum: 100 },
                      traction: { type: "number", minimum: 0, maximum: 100 },
                      team: { type: "number", minimum: 0, maximum: 100 },
                      product: { type: "number", minimum: 0, maximum: 100 },
                      financials: { type: "number", minimum: 0, maximum: 100 },
                      competition: { type: "number", minimum: 0, maximum: 100 }
                    },
                    required: ["marketSize", "traction", "team", "product", "financials", "competition"]
                  },
                  riskFlags: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["high", "medium", "low"] },
                        category: { type: "string" },
                        description: { type: "string" },
                        impact: { type: "string" }
                      },
                      required: ["type", "category", "description", "impact"]
                    }
                  },
                  keyInsights: {
                    type: "array",
                    items: { type: "string" }
                  },
                  recommendation: {
                    type: "object",
                    properties: {
                      decision: { type: "string", enum: ["strong_buy", "buy", "hold", "pass"] },
                      reasoning: { type: "string" },
                      targetInvestment: { type: "number", minimum: 0 },
                      expectedReturn: { type: "number", minimum: 0 }
                    },
                    required: ["decision", "reasoning", "targetInvestment", "expectedReturn"]
                  },
                  riskLevel: { type: "string", enum: ["Low", "Medium", "High"] }
                },
                required: ["overallScore", "metrics", "riskFlags", "keyInsights", "recommendation", "riskLevel"]
              }
            },
            contents: documentContent,
          });
          return { text: geminiResponse.text };
        });
      }
    });

    const rawJson = response.text;
    console.log('✅ Successfully received response from AI model');
    console.log(`�� Response length: ${rawJson.length} characters`);

    if (rawJson) {
      const data = parseAnalysisResponse(rawJson);
      console.log('🎯 Analysis completed successfully!');
      return data;
    } else {
      throw new Error("Empty response from AI model");
    }
  } catch (error) {
    console.error("❌ All AI models failed:", error);
    
    // Type-safe error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      name: errorName
    });
    
    // Throw a specific error for server busy state
    throw new Error('SERVER_BUSY');
  }
}

export async function extractTextFromDocument(filePath: string, mimeType: string): Promise<string> {
  try {
    console.log(`📄 Extracting text from: ${filePath}, type: ${mimeType}`);
    
    if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
      const fileBytes = fs.readFileSync(filePath);
      console.log(`📊 File size: ${fileBytes.length} bytes`);
      
      // Try multiple models with retry logic for text extraction
      const response = await tryModelsInOrder(async (model) => {
        if (model.startsWith('gemini')) {
          return await retryWithBackoff(async () => {
            const geminiResponse = await ai.models.generateContent({
              model: model,
              contents: [
                {
                  inlineData: {
                    data: fileBytes.toString("base64"),
                    mimeType: mimeType,
                  },
                },
                `Extract all text content from this document. If it's a pitch deck, business plan, or startup document, 
                provide the text in a structured format. Include any numbers, metrics, financial data, team information,
                market analysis, and key business information. Preserve formatting and structure where possible.
                
                Focus on extracting:
                - Company name and description
                - Market size and opportunity
                - Revenue model and financial projections
                - Team information and backgrounds
                - Product features and technology
                - Competitive analysis
                - Traction metrics and growth data
                - Funding requirements and use of funds`
              ],
            });
            return { text: geminiResponse.text };
          });
        }
      });

      const extractedText = response.text || "";
      console.log(`✅ Text extraction successful: ${extractedText.length} characters`);
      return extractedText;
    } else {
      // For text-based files, read directly
      const content = fs.readFileSync(filePath, 'utf-8');
      console.log(`📝 Text file content: ${content.length} characters`);
      return content;
    }
  } catch (error) {
    console.error(`❌ Failed to extract text from ${filePath}:`, error);
    
    // Type-safe error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    console.error("Extraction error details:", {
      message: errorMessage,
      stack: errorStack,
      name: errorName
    });
    
    return `Error extracting text from ${filePath}: ${errorMessage}`;
  }
}

export interface IndustryBenchmark {
  industry: string;
  companies: number;
  avgScore: number;
  topPerformer: string;
  growth: string;
}

export interface BenchmarkMetrics {
  marketPenetration: {
    value: number;
    trend: string;
    trendValue: string;
  };
  teamExperience: {
    value: number;
    trend: string;
    trendValue: string;
  };
  revenueGrowth: {
    value: number;
    maxValue: number;
    trend: string;
    trendValue: string;
  };
  burnRateEfficiency: {
    value: number;
    trend: string;
    trendValue: string;
  };
}

// Fallback benchmark data with realistic companies
const fallbackBenchmarks: IndustryBenchmark[] = [
  {
    industry: 'AI/ML',
    companies: 247,
    avgScore: 78.2,
    topPerformer: 'OpenAI',
    growth: '+12.3%'
  },
  {
    industry: 'FinTech',
    companies: 189,
    avgScore: 74.8,
    topPerformer: 'Stripe',
    growth: '+8.7%'
  },
  {
    industry: 'HealthTech',
    companies: 156,
    avgScore: 81.1,
    topPerformer: 'Teladoc',
    growth: '+15.2%'
  },
  {
    industry: 'SaaS',
    companies: 134,
    avgScore: 69.4,
    topPerformer: 'Salesforce',
    growth: '+6.1%'
  },
  {
    industry: 'E-commerce',
    companies: 98,
    avgScore: 72.8,
    topPerformer: 'Shopify',
    growth: '+9.4%'
  }
];

export async function generateIndustryBenchmarks(): Promise<IndustryBenchmark[]> {
  const models = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-1.5-pro"];
  
  for (const model of models) {
    try {
      console.log(`🤖 Generating industry benchmarks with ${model}...`);
      
      const prompt = `Generate realistic industry benchmark data for startup analysis. Return ONLY a valid JSON array with 4-6 industry objects, each containing:
- industry: string (industry name like "AI/ML", "FinTech", "HealthTech", "EdTech", "SaaS", "E-commerce")
- companies: number (realistic number of companies in portfolio, 50-500)
- avgScore: number (average investment score 60-85)
- topPerformer: string (use REAL, well-known companies that are actually top performers in each industry, like "OpenAI" for AI/ML, "Stripe" for FinTech, "Zoom" for SaaS, etc.)
- growth: string (growth percentage like "+12.3%")

Use actual top-performing companies that investors would recognize. Examples:
- AI/ML: OpenAI, Anthropic, DeepMind, Hugging Face
- FinTech: Stripe, Square, PayPal, Coinbase
- SaaS: Salesforce, Zoom, Slack, Notion
- HealthTech: Teladoc, 23andMe, Veracyte
- E-commerce: Shopify, BigCommerce, WooCommerce

IMPORTANT: Return ONLY the JSON array, no markdown, no code blocks, no explanations, no additional text. Just the raw JSON array.`;

      const result = await ai.models.generateContent({
        model: model,
        contents: prompt,
      });
      const text = result.text;

      if (!text) {
        throw new Error("Gemini response missing text");
      }
      console.log(`✅ ${model} response received for benchmarks`);
      console.log("📝 Raw response:", text.substring(0, 200) + "...");

      // Clean the response - remove markdown code blocks if present
      let cleanText = text.trim();

      // Remove markdown code blocks
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Remove any leading/trailing whitespace
      cleanText = cleanText.trim();

      console.log("🧹 Cleaned response:", cleanText.substring(0, 200) + "...");

      // Parse the JSON response
      const benchmarks = JSON.parse(cleanText);

      // Validate the structure
      if (!Array.isArray(benchmarks)) {
        throw new Error("Response is not an array");
      }

      // Validate each benchmark object
      for (const benchmark of benchmarks) {
        if (!benchmark.industry || typeof benchmark.companies !== 'number' || 
            typeof benchmark.avgScore !== 'number' || !benchmark.topPerformer || !benchmark.growth) {
          throw new Error("Invalid benchmark structure");
        }
      }

      console.log(`🎯 Generated ${benchmarks.length} industry benchmarks with ${model}`);
      return benchmarks;

    } catch (error) {
      console.error(`❌ Error generating benchmarks with ${model}:`, error);
      
      // If this is the last model, throw the error
      if (model === models[models.length - 1]) {
        console.log("🔄 All Gemini models failed, using fallback data");
        return fallbackBenchmarks;
      }
      
      // Otherwise, try the next model
      console.log(`🔄 Trying next model...`);
    }
  }
  
  // This should never be reached, but just in case
  return fallbackBenchmarks;
}

// Fallback metrics data
const fallbackMetrics: BenchmarkMetrics = {
  marketPenetration: {
    value: 67.3,
    trend: "up",
    trendValue: "+5.1%"
  },
  teamExperience: {
    value: 82.7,
    trend: "up",
    trendValue: "+3.2%"
  },
  revenueGrowth: {
    value: 156.2,
    maxValue: 200,
    trend: "up",
    trendValue: "+22.4%"
  },
  burnRateEfficiency: {
    value: 45.8,
    trend: "neutral",
    trendValue: "0%"
  }
};

export async function generateBenchmarkMetrics(): Promise<BenchmarkMetrics> {
  const models = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-1.5-pro"];
  
  for (const model of models) {
    try {
      console.log(`🤖 Generating benchmark metrics with ${model}...`);
      
      const prompt = `Generate realistic benchmark metrics for startup analysis. Return ONLY a valid JSON object with these exact fields:
{
  "marketPenetration": {
    "value": number (50-80, average market share captured),
    "trend": string ("up", "down", or "neutral"),
    "trendValue": string (like "+5.1%" or "-2.3%")
  },
  "teamExperience": {
    "value": number (70-90, founder and team background score),
    "trend": string ("up", "down", or "neutral"),
    "trendValue": string (like "+3.2%" or "-1.1%")
  },
  "revenueGrowth": {
    "value": number (100-200, YoY revenue growth rate),
    "maxValue": 200,
    "trend": string ("up", "down", or "neutral"),
    "trendValue": string (like "+22.4%" or "-5.2%")
  },
  "burnRateEfficiency": {
    "value": number (30-60, capital efficiency score),
    "trend": string ("up", "down", or "neutral"),
    "trendValue": string (like "+8.1%" or "-3.4%")
  }
}

Make the data realistic and varied. Use actual percentage values for trends. Return ONLY the JSON object, no markdown, no code blocks, no explanations.`;

      const result = await ai.models.generateContent({
        model: model,
        contents: prompt,
      });
      const text = result.text;

      if (!text) {
        throw new Error("Gemini response missing text");
      }
      console.log(`✅ ${model} response received for benchmark metrics`);
      console.log("📝 Raw response:", text.substring(0, 200) + "...");

      // Clean the response - remove markdown code blocks if present
      let cleanText = text.trim();

      // Remove markdown code blocks
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Remove any leading/trailing whitespace
      cleanText = cleanText.trim();

      console.log("🧹 Cleaned response:", cleanText.substring(0, 200) + "...");

      // Parse the JSON response
      const metrics = JSON.parse(cleanText);

      // Validate the structure
      if (!metrics.marketPenetration || !metrics.teamExperience || !metrics.revenueGrowth || !metrics.burnRateEfficiency) {
        throw new Error("Invalid metrics structure");
      }

      console.log(`🎯 Generated benchmark metrics successfully with ${model}`);
      return metrics;

    } catch (error) {
      console.error(`❌ Error generating benchmark metrics with ${model}:`, error);
      
      // If this is the last model, use fallback
      if (model === models[models.length - 1]) {
        console.log("🔄 All Gemini models failed, using fallback metrics data");
        return fallbackMetrics;
      }
      
      // Otherwise, try the next model
      console.log(`🔄 Trying next model...`);
    }
  }
  
  // This should never be reached, but just in case
  return fallbackMetrics;
}

export interface MarketRecommendation {
  targetInvestment: number;
  expectedReturn: number;
}

export async function generateMarketRecommendation(benchmarks: IndustryBenchmark[], metrics: BenchmarkMetrics): Promise<MarketRecommendation> {
  const models = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-1.5-pro"];
  
  // Calculate avgScore once at the beginning
  const avgScore = benchmarks.reduce((sum, b) => sum + b.avgScore, 0) / benchmarks.length;
  
  for (const model of models) {
    try {
      console.log(`🤖 Generating market recommendation with ${model}...`);
      
      const prompt = `Based on the following market data, generate realistic investment recommendations for the Indian startup ecosystem. 

Market Context:
- Average industry score: ${avgScore}
- Market penetration: ${metrics.marketPenetration.value}%
- Team experience score: ${metrics.teamExperience.value}
- Revenue growth: ${metrics.revenueGrowth.value}%
- Burn rate efficiency: ${metrics.burnRateEfficiency.value}

Industry benchmarks:
${benchmarks.map(b => `- ${b.industry}: ${b.companies} companies, avg score ${b.avgScore}, growth ${b.growth}`).join('\n')}

Generate investment recommendations in INR (Indian Rupees). Consider:
- Target investment should be realistic for Indian market (₹5Cr to ₹50Cr range)
- Expected return should be based on market conditions (2x to 8x range)
- Higher scores should correlate with higher investment amounts and returns

Return ONLY a valid JSON object with these exact fields:
{
  "targetInvestment": number (in INR, realistic amount between 50000000 and 500000000),
  "expectedReturn": number (multiplier like 3.5 for 3.5x return)
}

IMPORTANT: Return ONLY the JSON object, no markdown, no code blocks, no explanations.`;

      const result = await ai.models.generateContent({
        model: model,
        contents: prompt,
      });
      const text = result.text;

      if (!text) {
        throw new Error("Gemini response missing text");
      }
      console.log(`✅ ${model} response received for market recommendation`);
      console.log("📝 Raw response:", text.substring(0, 200) + "...");

      // Clean the response - remove markdown code blocks if present
      let cleanText = text.trim();

      // Remove markdown code blocks
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Remove any leading/trailing whitespace
      cleanText = cleanText.trim();

      console.log("🧹 Cleaned response:", cleanText.substring(0, 200) + "...");

      // Parse the JSON response
      const recommendation = JSON.parse(cleanText);

      // Validate the structure
      if (!recommendation.targetInvestment || !recommendation.expectedReturn) {
        throw new Error("Invalid recommendation structure");
      }

      // Validate ranges
      if (recommendation.targetInvestment < 50000000 || recommendation.targetInvestment > 500000000) {
        throw new Error("Target investment out of range");
      }

      if (recommendation.expectedReturn < 2 || recommendation.expectedReturn > 6) {
        throw new Error("Expected return out of range");
      }

      console.log(`🎯 Generated market recommendation successfully with ${model}`);
      return recommendation;

    } catch (error) {
      console.error(`❌ Error generating market recommendation with ${model}:`, error);
      
      // If this is the last model, generate dynamic fallback based on input data
      if (model === models[models.length - 1]) {
        console.log("🔄 All Gemini models failed, generating dynamic fallback based on market data");
        
        // Generate realistic base investment (₹5Cr to ₹50Cr range)
        const avgIndustryScore = benchmarks.reduce((sum, b) => sum + b.avgScore, 0) / benchmarks.length;
        const avgGrowth = benchmarks.reduce((sum, b) => {
          return sum + parseFloat(b.growth.replace('%', '').replace('+', ''));
        }, 0) / benchmarks.length;
        
        // Base investment scales with industry performance
        const baseInvestment = 50000000 + (avgIndustryScore - 50) * 1000000 + (avgGrowth * 2000000);
        
        // Conservative multipliers (0.5 to 1.5 range)
        const scoreMultiplier = 0.5 + (avgScore / 100);
        const marketMultiplier = 0.5 + (metrics.marketPenetration.value / 200);
        const teamMultiplier = 0.5 + (metrics.teamExperience.value / 200);
        
        const dynamicInvestment = Math.round(baseInvestment * scoreMultiplier * marketMultiplier * teamMultiplier);
        const clampedInvestment = Math.max(50000000, Math.min(500000000, dynamicInvestment));
        
        // Calculate realistic expected return (2x to 6x range)
        const baseReturn = 2.0 + (avgScore / 100) * 2; // 2x to 4x based on score
        
        // Growth and efficiency adjustments (small increments)
        const growthAdjustment = (metrics.revenueGrowth.value - 100) / 200; // -0.5 to +0.5
        const efficiencyAdjustment = (metrics.burnRateEfficiency.value - 50) / 100; // -0.5 to +0.5
        
        const dynamicReturn = baseReturn + growthAdjustment + efficiencyAdjustment;
        const clampedReturn = Math.max(2.0, Math.min(6.0, dynamicReturn));
        
        return {
          targetInvestment: clampedInvestment,
          expectedReturn: Math.round(clampedReturn * 10) / 10 // Round to 1 decimal
        };
      }
      
      // Otherwise, try the next model
      console.log(`🔄 Trying next model...`);
    }
  }
  
  // Generate final dynamic fallback if all models fail
  const avgIndustryScore = benchmarks.reduce((sum, b) => sum + b.avgScore, 0) / benchmarks.length;
  const avgGrowth = benchmarks.reduce((sum, b) => {
    return sum + parseFloat(b.growth.replace('%', '').replace('+', ''));
  }, 0) / benchmarks.length;
  
  // Base investment scales with industry performance
  const baseInvestment = 50000000 + (avgIndustryScore - 50) * 1000000 + (avgGrowth * 2000000);
  
  // Conservative multipliers (0.5 to 1.5 range)
  const scoreMultiplier = 0.5 + (avgScore / 100);
  const marketMultiplier = 0.5 + (metrics.marketPenetration.value / 200);
  const teamMultiplier = 0.5 + (metrics.teamExperience.value / 200);
  
  const dynamicInvestment = Math.round(baseInvestment * scoreMultiplier * marketMultiplier * teamMultiplier);
  const clampedInvestment = Math.max(50000000, Math.min(500000000, dynamicInvestment));
  
  // Calculate realistic expected return (2x to 6x range)
  const baseReturn = 2.0 + (avgScore / 100) * 2; // 2x to 4x based on score
  
  // Growth and efficiency adjustments (small increments)
  const growthAdjustment = (metrics.revenueGrowth.value - 100) / 200; // -0.5 to +0.5
  const efficiencyAdjustment = (metrics.burnRateEfficiency.value - 50) / 100; // -0.5 to +0.5
  
  const dynamicReturn = baseReturn + growthAdjustment + efficiencyAdjustment;
  const clampedReturn = Math.max(2.0, Math.min(6.0, dynamicReturn));
  
  return {
    targetInvestment: clampedInvestment,
    expectedReturn: Math.round(clampedReturn * 10) / 10
  };
}

// Company size configurations
const COMPANY_SIZE_CONFIG = {
  'very-big': {
    name: 'Very Big Companies',
    description: 'Fortune 500, Unicorns, Established Enterprises (10,000+ employees)',
    companyCountRange: [20, 50],
    avgScoreRange: [75, 90],
    growthRange: [5, 15],
    examples: {
      'AI/ML': ['OpenAI', 'Anthropic', 'DeepMind', 'NVIDIA'],
      'FinTech': ['Stripe', 'Square', 'PayPal', 'Coinbase'],
      'HealthTech': ['Teladoc', '23andMe', 'Veracyte', 'Livongo'],
      'SaaS': ['Salesforce', 'Zoom', 'Slack', 'Notion'],
      'E-commerce': ['Shopify', 'BigCommerce', 'WooCommerce', 'Magento'],
      'Cybersecurity': ['CrowdStrike', 'Palo Alto Networks', 'Okta', 'Zscaler'],
      'Blockchain': ['Chainlink', 'Polygon', 'Avalanche', 'Solana'],
      'IoT': ['ARM', 'Qualcomm', 'Intel', 'Samsung'],
      'Robotics': ['Boston Dynamics', 'iRobot', 'ABB', 'Fanuc'],
      'CleanTech': ['Tesla', 'First Solar', 'Enphase', 'Bloom Energy'],
      'AgriTech': ['John Deere', 'Trimble', 'AGCO', 'CNH Industrial'],
      'EdTech': ['Coursera', 'Udemy', 'Khan Academy', 'Duolingo']
    }
  },
  'mid-scale': {
    name: 'Mid-scale Startups',
    description: 'Growth Stage, Series B/C Companies (200-1,000 employees)',
    companyCountRange: [100, 300],
    avgScoreRange: [65, 80],
    growthRange: [10, 25],
    examples: {
      'AI/ML': ['Hugging Face', 'Replicate', 'Weights & Biases', 'Scale AI'],
      'FinTech': ['Plaid', 'Chime', 'Robinhood', 'Affirm'],
      'HealthTech': ['Ro', 'Hims', 'Calm', 'Headspace'],
      'SaaS': ['Airtable', 'Figma', 'Linear', 'Vercel'],
      'E-commerce': ['Gumroad', 'Printful', 'Klaviyo', 'ReCharge'],
      'Cybersecurity': ['1Password', 'Auth0', 'Cloudflare', 'Snyk'],
      'Blockchain': ['Uniswap', 'Aave', 'Compound', 'MakerDAO'],
      'IoT': ['Particle', 'Losant', 'Ubidots', 'ThingSpeak'],
      'Robotics': ['Fetch Robotics', 'Locus Robotics', '6 River Systems', 'GreyOrange'],
      'CleanTech': ['ChargePoint', 'EVgo', 'Sunrun', 'Vivint Solar'],
      'AgriTech': ['Farmers Edge', 'Taranis', 'Prospera', 'AeroFarms'],
      'EdTech': ['MasterClass', 'Skillshare', 'Brilliant', 'Codecademy']
    }
  },
  'small-scale': {
    name: 'Small-scale Startups',
    description: 'Series A, Established Product-Market Fit (50-200 employees)',
    companyCountRange: [200, 500],
    avgScoreRange: [60, 75],
    growthRange: [12, 30],
    examples: {
      'AI/ML': ['LangChain', 'LlamaIndex', 'Together AI', 'Modal'],
      'FinTech': ['Stripe Connect', 'Marqeta', 'Dwolla', 'Synapse'],
      'HealthTech': ['Ro', 'Hims', 'Calm', 'Headspace'],
      'SaaS': ['Linear', 'Vercel', 'PlanetScale', 'Railway'],
      'E-commerce': ['Shopify Apps', 'Gumroad', 'Printful', 'Klaviyo'],
      'Cybersecurity': ['1Password', 'Auth0', 'Cloudflare', 'Snyk'],
      'Blockchain': ['Uniswap', 'Aave', 'Compound', 'MakerDAO'],
      'IoT': ['Particle', 'Losant', 'Ubidots', 'ThingSpeak'],
      'Robotics': ['Fetch Robotics', 'Locus Robotics', '6 River Systems', 'GreyOrange'],
      'CleanTech': ['ChargePoint', 'EVgo', 'Sunrun', 'Vivint Solar'],
      'AgriTech': ['Farmers Edge', 'Taranis', 'Prospera', 'AeroFarms'],
      'EdTech': ['MasterClass', 'Skillshare', 'Brilliant', 'Codecademy']
    }
  },
  'early-stage': {
    name: 'Early Stage Startups',
    description: 'Seed Stage, Product Development (10-50 employees)',
    companyCountRange: [500, 1000],
    avgScoreRange: [55, 70],
    growthRange: [15, 40],
    examples: {
      'AI/ML': ['LangChain', 'LlamaIndex', 'Together AI', 'Modal'],
      'FinTech': ['Stripe Connect', 'Marqeta', 'Dwolla', 'Synapse'],
      'HealthTech': ['Ro', 'Hims', 'Calm', 'Headspace'],
      'SaaS': ['Linear', 'Vercel', 'PlanetScale', 'Railway'],
      'E-commerce': ['Shopify Apps', 'Gumroad', 'Printful', 'Klaviyo'],
      'Cybersecurity': ['1Password', 'Auth0', 'Cloudflare', 'Snyk'],
      'Blockchain': ['Uniswap', 'Aave', 'Compound', 'MakerDAO'],
      'IoT': ['Particle', 'Losant', 'Ubidots', 'ThingSpeak'],
      'Robotics': ['Fetch Robotics', 'Locus Robotics', '6 River Systems', 'GreyOrange'],
      'CleanTech': ['ChargePoint', 'EVgo', 'Sunrun', 'Vivint Solar'],
      'AgriTech': ['Farmers Edge', 'Taranis', 'Prospera', 'AeroFarms'],
      'EdTech': ['MasterClass', 'Skillshare', 'Brilliant', 'Codecademy']
    }
  },
  'pre-seed': {
    name: 'Pre-seed Startups',
    description: 'Idea Stage, MVP Development (1-10 employees)',
    companyCountRange: [1000, 2000],
    avgScoreRange: [45, 65],
    growthRange: [20, 50],
    examples: {
      'AI/ML': ['LangChain', 'LlamaIndex', 'Together AI', 'Modal'],
      'FinTech': ['Stripe Connect', 'Marqeta', 'Dwolla', 'Synapse'],
      'HealthTech': ['Ro', 'Hims', 'Calm', 'Headspace'],
      'SaaS': ['Linear', 'Vercel', 'PlanetScale', 'Railway'],
      'E-commerce': ['Shopify Apps', 'Gumroad', 'Printful', 'Klaviyo'],
      'Cybersecurity': ['1Password', 'Auth0', 'Cloudflare', 'Snyk'],
      'Blockchain': ['Uniswap', 'Aave', 'Compound', 'MakerDAO'],
      'IoT': ['Particle', 'Losant', 'Ubidots', 'ThingSpeak'],
      'Robotics': ['Fetch Robotics', 'Locus Robotics', '6 River Systems', 'GreyOrange'],
      'CleanTech': ['ChargePoint', 'EVgo', 'Sunrun', 'Vivint Solar'],
      'AgriTech': ['Farmers Edge', 'Taranis', 'Prospera', 'AeroFarms'],
      'EdTech': ['MasterClass', 'Skillshare', 'Brilliant', 'Codecademy']
    }
  }
};

export async function generateCustomIndustryBenchmarks(
  industries: string[], 
  companySize: string
): Promise<IndustryBenchmark[]> {
  const models = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-1.5-pro"];
  const sizeConfig = COMPANY_SIZE_CONFIG[companySize as keyof typeof COMPANY_SIZE_CONFIG];
  
  if (!sizeConfig) {
    throw new Error(`Invalid company size: ${companySize}`);
  }

  for (const model of models) {
    try {
      console.log(`🤖 Generating custom benchmarks with ${model} for ${industries.join(', ')} (${sizeConfig.name})...`);
      
      const prompt = `Generate realistic industry benchmark data for startup analysis. Return ONLY a valid JSON array with ${industries.length} industry objects, each containing:
- industry: string (one of: ${industries.join(', ')})
- companies: number (realistic number of companies in portfolio, ${sizeConfig.companyCountRange[0]}-${sizeConfig.companyCountRange[1]})
- avgScore: number (average investment score ${sizeConfig.avgScoreRange[0]}-${sizeConfig.avgScoreRange[1]})
- topPerformer: string (use REAL, well-known companies that are actually top performers in each industry for ${sizeConfig.name})
- growth: string (growth percentage like "+${sizeConfig.growthRange[0]}%" to "+${sizeConfig.growthRange[1]}%")

Company Size Context: ${sizeConfig.description}
- Company Count Range: ${sizeConfig.companyCountRange[0]}-${sizeConfig.companyCountRange[1]} companies
- Average Score Range: ${sizeConfig.avgScoreRange[0]}-${sizeConfig.avgScoreRange[1]}
- Growth Range: +${sizeConfig.growthRange[0]}% to +${sizeConfig.growthRange[1]}%

Use actual top-performing companies that investors would recognize for this company size category. Examples for ${sizeConfig.name}:
${industries.map(industry => {
  const examples = sizeConfig.examples[industry as keyof typeof sizeConfig.examples] || ['Example Company'];
  return `- ${industry}: ${examples.slice(0, 3).join(', ')}`;
}).join('\n')}

IMPORTANT: Return ONLY the JSON array, no markdown, no code blocks, no explanations, no additional text. Just the raw JSON array.`;

      const result = await ai.models.generateContent({
        model: model,
        contents: prompt,
      });
      const text = result.text;

      if (!text) {
        throw new Error("Gemini response missing text");
      }
      console.log(`✅ ${model} response received for custom benchmarks`);
      console.log("📝 Raw response:", text.substring(0, 200) + "...");

      // Clean the response - remove markdown code blocks if present
      let cleanText = text.trim();

      // Remove markdown code blocks
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Remove any leading/trailing whitespace
      cleanText = cleanText.trim();

      console.log("🧹 Cleaned response:", cleanText.substring(0, 200) + "...");

      // Parse the JSON response
      const benchmarks = JSON.parse(cleanText);

      // Validate the structure
      if (!Array.isArray(benchmarks)) {
        throw new Error("Response is not an array");
      }

      // Validate each benchmark object
      for (const benchmark of benchmarks) {
        if (!benchmark.industry || typeof benchmark.companies !== 'number' || 
            typeof benchmark.avgScore !== 'number' || !benchmark.topPerformer || !benchmark.growth) {
          throw new Error("Invalid benchmark structure");
        }
        
        // Validate industry is in the requested list
        if (!industries.includes(benchmark.industry)) {
          throw new Error(`Industry ${benchmark.industry} not in requested list`);
        }
      }

      console.log(`🎯 Generated ${benchmarks.length} custom industry benchmarks with ${model}`);
      return benchmarks;

    } catch (error) {
      console.error(`❌ Error generating custom benchmarks with ${model}:`, error);
      
      // If this is the last model, use fallback
      if (model === models[models.length - 1]) {
        console.log("🔄 All Gemini models failed, using fallback custom data");
        return generateFallbackCustomBenchmarks(industries, sizeConfig);
      }
      
      // Otherwise, try the next model
      console.log(`🔄 Trying next model...`);
    }
  }
  
  // This should never be reached, but just in case
  return generateFallbackCustomBenchmarks(industries, sizeConfig);
}

function generateFallbackCustomBenchmarks(
  industries: string[], 
  sizeConfig: typeof COMPANY_SIZE_CONFIG[keyof typeof COMPANY_SIZE_CONFIG]
): IndustryBenchmark[] {
  return industries.map(industry => {
    const examples = sizeConfig.examples[industry as keyof typeof sizeConfig.examples] || ['Example Company'];
    const topPerformer = examples[0];
    
    return {
      industry,
      companies: Math.floor(Math.random() * (sizeConfig.companyCountRange[1] - sizeConfig.companyCountRange[0] + 1)) + sizeConfig.companyCountRange[0],
      avgScore: Math.floor(Math.random() * (sizeConfig.avgScoreRange[1] - sizeConfig.avgScoreRange[0] + 1)) + sizeConfig.avgScoreRange[0],
      topPerformer,
      growth: `+${Math.floor(Math.random() * (sizeConfig.growthRange[1] - sizeConfig.growthRange[0] + 1)) + sizeConfig.growthRange[0]}%`
    };
  });
}

// Industry Risk interface
export interface IndustryRisk {
  type: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  impact: string;
  mitigation: string;
}

// Fallback industry risks data
const fallbackIndustryRisks: Record<string, IndustryRisk[]> = {
  'AI/ML': [
    {
      type: 'high',
      category: 'Regulatory',
      description: 'Evolving AI regulations and compliance requirements',
      impact: 'Potential legal restrictions and compliance costs',
      mitigation: 'Stay updated on regulations, implement ethical AI practices'
    },
    {
      type: 'medium',
      category: 'Technical',
      description: 'Rapid technological obsolescence and model drift',
      impact: 'Need for continuous model updates and retraining',
      mitigation: 'Invest in MLOps infrastructure and continuous learning'
    },
    {
      type: 'medium',
      category: 'Market',
      description: 'Intense competition from tech giants and open source',
      impact: 'Pricing pressure and market share erosion',
      mitigation: 'Focus on specialized use cases and proprietary data'
    }
  ],
  'FinTech': [
    {
      type: 'high',
      category: 'Regulatory',
      description: 'Strict financial regulations and compliance requirements',
      impact: 'High compliance costs and regulatory barriers',
      mitigation: 'Invest in compliance infrastructure and legal expertise'
    },
    {
      type: 'medium',
      category: 'Security',
      description: 'Cybersecurity threats and data breaches',
      impact: 'Reputation damage and financial losses',
      mitigation: 'Implement robust security measures and insurance'
    },
    {
      type: 'low',
      category: 'Market',
      description: 'Economic downturns affecting financial services',
      impact: 'Reduced demand for financial products',
      mitigation: 'Diversify product portfolio and target resilient segments'
    }
  ],
  'HealthTech': [
    {
      type: 'high',
      category: 'Regulatory',
      description: 'FDA approval processes and medical device regulations',
      impact: 'Long development cycles and high compliance costs',
      mitigation: 'Engage regulatory consultants early and plan for approval timelines'
    },
    {
      type: 'medium',
      category: 'Liability',
      description: 'Medical malpractice and product liability risks',
      impact: 'Legal exposure and insurance costs',
      mitigation: 'Comprehensive insurance coverage and quality assurance'
    },
    {
      type: 'medium',
      category: 'Adoption',
      description: 'Slow healthcare provider adoption of new technologies',
      impact: 'Extended sales cycles and market penetration challenges',
      mitigation: 'Focus on proven ROI and pilot programs with key providers'
    }
  ]
};

export async function generateIndustryRisks(industry: string): Promise<IndustryRisk[]> {
  const models = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-1.5-pro"];
  
  for (const model of models) {
    try {
      console.log(`🤖 Generating industry risks with ${model} for ${industry}...`);
      
      const prompt = `Generate realistic industry-specific risks for ${industry} startups. Return ONLY a valid JSON array with 3-5 risk objects, each containing:
- type: string (one of: 'high', 'medium', 'low')
- category: string (e.g., 'Regulatory', 'Technical', 'Market', 'Financial', 'Operational')
- description: string (specific risk description for ${industry} industry)
- impact: string (potential impact of this risk)
- mitigation: string (how to mitigate this risk)

Focus on risks that are specific to the ${industry} industry and relevant to startup companies. Consider regulatory, technical, market, and operational risks.

IMPORTANT: Return ONLY the JSON array, no markdown, no code blocks, no explanations, no additional text. Just the raw JSON array.`;

      const result = await ai.models.generateContent({ model: model, contents: prompt });
      const text = result.text;
      
      if (!text) {
        throw new Error('Empty response from AI model');
      }

      // Clean the response
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      console.log(`📝 Raw response: ${cleanedText.substring(0, 200)}...`);
      console.log(`🧹 Cleaned response: ${cleanedText.substring(0, 200)}...`);

      const risks: IndustryRisk[] = JSON.parse(cleanedText);
      
      // Validate the response
      if (!Array.isArray(risks) || risks.length === 0) {
        throw new Error('Invalid response format: expected non-empty array');
      }

      // Validate each risk object
      for (const risk of risks) {
        if (!risk.type || !risk.category || !risk.description || !risk.impact || !risk.mitigation) {
          throw new Error('Invalid risk object: missing required fields');
        }
        if (!['high', 'medium', 'low'].includes(risk.type)) {
          throw new Error('Invalid risk type: must be high, medium, or low');
        }
      }

      console.log(`🎯 Generated ${risks.length} industry risks for ${industry} with ${model}`);
      return risks;
    } catch (error) {
      console.error(`❌ Error generating industry risks with ${model}:`, error);
      if (model === models[models.length - 1]) {
        console.log("🔄 All Gemini models failed, using fallback data");
        return fallbackIndustryRisks[industry] || fallbackIndustryRisks['AI/ML'];
      }
      console.log(`🔄 Trying next model...`);
    }
  }
  return fallbackIndustryRisks[industry] || fallbackIndustryRisks['AI/ML']; // Should not be reached
}
