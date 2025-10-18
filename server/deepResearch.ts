import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Deep Research Configuration
 * 
 * APPROACH 1: Discovery Engine API (Requires Allowlist Access)
 * - Requires Google Cloud Project setup
 * - Needs allowlist approval from Google
 * - Uses Discovery Engine API endpoint
 * 
 * APPROACH 2: Extended Thinking Mode (Available Now)
 * - Uses standard Gemini API
 * - Enhanced reasoning with longer processing time
 * - No special access required
 */

// ============================================================================
// APPROACH 1: Deep Research Agent (Discovery Engine API)
// ============================================================================

interface DeepResearchConfig {
  projectId: string;
  appId: string;
  dataStoreId: string;
  location?: string;
}

export class DeepResearchService {
  private config: DeepResearchConfig;
  private apiEndpoint: string;

  constructor(config: DeepResearchConfig) {
    this.config = {
      location: 'global',
      ...config
    };
    this.apiEndpoint = `https://discoveryengine.googleapis.com/v1/projects/${this.config.projectId}/locations/${this.config.location}/collections/default_collection/engines/${this.config.appId}/assistants/default_assistant:streamAssist`;
  }

  /**
   * Initiate a deep research session
   * Step 1: Create session and get SESSION_ID
   */
  async initiateResearch(query: string): Promise<string> {
    try {
      const accessToken = process.env.GOOGLE_CLOUD_ACCESS_TOKEN;
      
      if (!accessToken) {
        throw new Error("Google Cloud access token not found. Run: gcloud auth print-access-token");
      }

      const response = await axios.post(
        this.apiEndpoint,
        {
          query: {
            text: query
          },
          agentsSpec: {
            agentSpecs: {
              agentId: "deep_research"
            }
          },
          toolsSpec: {
            vertexAiSearchSpec: {
              dataStoreSpecs: {
                dataStore: `projects/${this.config.projectId}/locations/${this.config.location}/collections/default_collection/datastores/${this.config.dataStoreId}`
              }
            },
            webGroundingSpec: {}
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Goog-User-Project': this.config.projectId
          }
        }
      );

      // Extract session ID from response
      const sessionId = response.data.session || response.data.sessionId;
      console.log('🔬 Deep Research session initiated:', sessionId);
      
      return sessionId;
    } catch (error) {
      console.error('❌ Failed to initiate deep research:', error);
      throw new Error(`Deep research initiation failed: ${error}`);
    }
  }

  /**
   * Start the research process
   * Step 2: Begin research with SESSION_ID
   */
  async startResearch(sessionId: string): Promise<any> {
    try {
      const accessToken = process.env.GOOGLE_CLOUD_ACCESS_TOKEN;

      const response = await axios.post(
        this.apiEndpoint,
        {
          query: {
            text: "Start Research"
          },
          session: sessionId,
          agentsSpec: {
            agentSpecs: {
              agentId: "deep_research"
            }
          },
          toolsSpec: {
            vertexAiSearchSpec: {
              dataStoreSpecs: {
                dataStore: `projects/${this.config.projectId}/locations/${this.config.location}/collections/default_collection/datastores/${this.config.dataStoreId}`
              }
            },
            webGroundingSpec: {}
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Goog-User-Project': this.config.projectId
          }
        }
      );

      console.log('✅ Deep Research completed');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to start deep research:', error);
      throw new Error(`Deep research start failed: ${error}`);
    }
  }

  /**
   * Complete deep research workflow
   * Combines initiate + start in one call
   */
  async conductResearch(query: string): Promise<any> {
    try {
      console.log('🔬 Starting deep research for:', query);
      
      // Step 1: Initiate session
      const sessionId = await this.initiateResearch(query);
      
      // Step 2: Start research
      const result = await this.startResearch(sessionId);
      
      return result;
    } catch (error) {
      console.error('❌ Deep research failed:', error);
      throw error;
    }
  }
}

// ============================================================================
// APPROACH 2: Enhanced Reasoning Mode (Available Now - Recommended)
// ============================================================================

/**
 * Enhanced Reasoning Service
 * Uses Gemini 2.5 Pro with optimized prompts for deep analysis
 * No special access required - works with your existing API key
 */
export class EnhancedReasoningService {
  /**
   * Conduct deep analysis using enhanced reasoning prompts
   * This approach works with standard Gemini API
   */
  async analyzeWithDeepThinking(
    documents: Array<{ content: string; type: string; name: string }>,
    analysisType: 'comprehensive' | 'financial' | 'market' | 'team' = 'comprehensive'
  ): Promise<any> {
    try {
      console.log('🧠 Starting enhanced reasoning analysis...');

      const deepThinkingPrompt = this.buildDeepThinkingPrompt(documents, analysisType);

      // Use longer timeout and more tokens for deep analysis
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        config: {
          systemInstruction: deepThinkingPrompt.system,
          responseMimeType: "application/json",
          // Request extended thinking by being explicit in instructions
          temperature: 0.7, // Slightly higher for creative problem-solving
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192, // Increased for detailed analysis
        },
        contents: deepThinkingPrompt.content || '',
      });

      const result = JSON.parse(response.text || '{}');
      console.log('✅ Enhanced reasoning analysis completed');
      
      return result;
    } catch (error) {
      console.error('❌ Enhanced reasoning failed:', error);
      throw error;
    }
  }

  /**
   * Build specialized prompts that encourage deep thinking
   */
  private buildDeepThinkingPrompt(
    documents: Array<{ content: string; type: string; name: string }>,
    analysisType: string
  ): { system: string; content: string } {
    const documentContent = documents.map(doc => 
      `--- ${doc.name} (${doc.type}) ---\n${doc.content}\n`
    ).join('\n');

    const baseSystem = `You are a world-class startup investment analyst with 20+ years of experience conducting deep due diligence for top-tier VC firms.

CRITICAL: Take your time to think deeply about this analysis. Consider multiple perspectives, evaluate evidence carefully, and reason through each conclusion step-by-step.

Your analysis should demonstrate:
1. Strategic thinking - Consider long-term implications and second-order effects
2. Critical evaluation - Question assumptions and identify hidden risks
3. Comparative reasoning - Benchmark against similar successful/failed startups
4. Quantitative rigor - Validate numerical claims with logical consistency checks
5. Holistic assessment - Connect dots across financial, market, team, and product dimensions

Think like a detective: Look for what's NOT said, identify inconsistencies, and probe deeper into claims that seem too good to be true.`;

    let specificInstructions = '';
    let outputSchema: any = {};

    switch (analysisType) {
      case 'financial':
        specificInstructions = `
DEEP FINANCIAL ANALYSIS FRAMEWORK:

Phase 1: Unit Economics Deep Dive
- Calculate implied CAC, LTV, payback period from available data
- Analyze burn rate trajectory and runway scenarios
- Evaluate revenue quality (recurring vs. one-time, concentration risk)
- Assess capital efficiency metrics

Phase 2: Financial Red Flags Detection
- Investigate unusual financial patterns or anomalies
- Check consistency between revenue claims and team size
- Validate market size claims against financial projections
- Analyze cost structure for hidden inefficiencies

Phase 3: Scenario Analysis
- Best case: Optimistic but plausible trajectory
- Base case: Most likely outcome based on evidence
- Worst case: Downside risks and mitigation strategies

Return comprehensive financial assessment with confidence levels.`;

        outputSchema = {
          type: "object",
          properties: {
            unitEconomics: {
              type: "object",
              properties: {
                cac: { type: "number", description: "Customer Acquisition Cost" },
                ltv: { type: "number", description: "Lifetime Value" },
                ltvCacRatio: { type: "number" },
                paybackPeriod: { type: "number", description: "Months" },
                confidenceLevel: { type: "string", enum: ["high", "medium", "low"] }
              }
            },
            burnAnalysis: {
              type: "object",
              properties: {
                monthlyBurn: { type: "number" },
                runway: { type: "number", description: "Months" },
                capitalEfficiency: { type: "string" }
              }
            },
            redFlags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  flag: { type: "string" },
                  severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                  evidence: { type: "string" },
                  mitigation: { type: "string" }
                }
              }
            },
            scenarioAnalysis: {
              type: "object",
              properties: {
                bestCase: { type: "object" },
                baseCase: { type: "object" },
                worstCase: { type: "object" }
              }
            },
            overallFinancialScore: { type: "number", minimum: 0, maximum: 100 },
            keyFindings: { type: "array", items: { type: "string" } }
          }
        };
        break;

      case 'market':
        specificInstructions = `
DEEP MARKET ANALYSIS FRAMEWORK:

Phase 1: TAM Validation
- Critically evaluate Total Addressable Market claims
- Use bottom-up analysis to validate top-down estimates
- Identify realistic Serviceable Obtainable Market (SOM)
- Compare with similar companies' actual penetration rates

Phase 2: Competitive Dynamics
- Map competitive landscape comprehensively
- Identify true barriers to entry and moats
- Evaluate threat of substitutes and new entrants
- Analyze winner-take-all vs. fragmented market dynamics

Phase 3: Market Timing Assessment
- Evaluate if market is ready for this solution
- Identify regulatory, technological, or behavioral barriers
- Assess adoption curve position (early adopters vs. mainstream)

Return deep market insights with strategic implications.`;

        outputSchema = {
          type: "object",
          properties: {
            tamValidation: {
              type: "object",
              properties: {
                claimedTam: { type: "string" },
                validatedTam: { type: "string" },
                realisticSom: { type: "string" },
                validationMethod: { type: "string" },
                confidence: { type: "string" }
              }
            },
            competitiveAnalysis: {
              type: "object",
              properties: {
                directCompetitors: { type: "array", items: { type: "string" } },
                indirectCompetitors: { type: "array", items: { type: "string" } },
                competitiveAdvantages: { type: "array", items: { type: "string" } },
                vulnerabilities: { type: "array", items: { type: "string" } },
                marketPosition: { type: "string" }
              }
            },
            marketTiming: {
              type: "object",
              properties: {
                readinessScore: { type: "number", minimum: 0, maximum: 100 },
                catalysts: { type: "array", items: { type: "string" } },
                barriers: { type: "array", items: { type: "string" } },
                adoptionStage: { type: "string" }
              }
            },
            overallMarketScore: { type: "number", minimum: 0, maximum: 100 },
            strategicInsights: { type: "array", items: { type: "string" } }
          }
        };
        break;

      case 'team':
        specificInstructions = `
DEEP TEAM ANALYSIS FRAMEWORK:

Phase 1: Founder Capability Assessment
- Evaluate domain expertise and relevant experience
- Assess complementary skill sets across founding team
- Analyze track record of execution and learning
- Evaluate decision-making and strategic thinking

Phase 2: Team Dynamics & Culture
- Assess founder relationships and equity splits
- Evaluate hiring strategy and talent attraction
- Analyze organizational structure for scale readiness
- Identify potential leadership gaps

Phase 3: Execution Indicators
- Review past milestones achieved vs. promised
- Assess adaptability and pivot decisions
- Evaluate communication and stakeholder management
- Analyze resource allocation priorities

Return comprehensive team assessment with red/green flags.`;

        outputSchema = {
          type: "object",
          properties: {
            founderAnalysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role: { type: "string" },
                  domainExpertise: { type: "string" },
                  relevantExperience: { type: "string" },
                  strengths: { type: "array", items: { type: "string" } },
                  gaps: { type: "array", items: { type: "string" } },
                  score: { type: "number" }
                }
              }
            },
            teamDynamics: {
              type: "object",
              properties: {
                complementarity: { type: "string" },
                cultureAssessment: { type: "string" },
                scaleReadiness: { type: "string" },
                leadershipGaps: { type: "array", items: { type: "string" } }
              }
            },
            executionTrack: {
              type: "object",
              properties: {
                milestonesAchieved: { type: "array", items: { type: "string" } },
                adaptabilityScore: { type: "number" },
                resourceAllocation: { type: "string" },
                communicationQuality: { type: "string" }
              }
            },
            overallTeamScore: { type: "number", minimum: 0, maximum: 100 },
            greenFlags: { type: "array", items: { type: "string" } },
            redFlags: { type: "array", items: { type: "string" } }
          }
        };
        break;

      default: // comprehensive
        specificInstructions = `
COMPREHENSIVE DEEP ANALYSIS FRAMEWORK:

Conduct a multi-dimensional analysis that integrates financial, market, team, and product perspectives.

Phase 1: Evidence Collection & Validation
- Extract all quantitative claims and validate internal consistency
- Identify assumptions underlying projections
- Cross-reference claims across different document sections
- Flag unsupported or questionable assertions

Phase 2: Deep Reasoning & Inference
- Connect dots between different data points
- Identify patterns that suggest strength or weakness
- Reason about causality and correlation
- Consider alternative explanations for observed data

Phase 3: Risk-Adjusted Scoring
- Score each dimension with confidence intervals
- Identify correlated risks that compound each other
- Evaluate risk/reward asymmetry
- Generate probabilistic scenarios

Phase 4: Investment Thesis Development
- Synthesize analysis into coherent investment narrative
- Identify key value drivers and risk factors
- Articulate bull case and bear case clearly
- Provide actionable recommendations with reasoning

Be intellectually honest: If data is insufficient, say so. If claims are questionable, challenge them.`;

        outputSchema = {
          type: "object",
          properties: {
            evidenceValidation: {
              type: "object",
              properties: {
                validatedClaims: { type: "array", items: { type: "string" } },
                questionableClaims: { type: "array", items: { type: "string" } },
                unsupportedClaims: { type: "array", items: { type: "string" } },
                dataGaps: { type: "array", items: { type: "string" } }
              }
            },
            deepInsights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  insight: { type: "string" },
                  evidence: { type: "array", items: { type: "string" } },
                  implications: { type: "string" },
                  confidence: { type: "string", enum: ["high", "medium", "low"] }
                }
              }
            },
            riskAdjustedScores: {
              type: "object",
              properties: {
                market: {
                  type: "object",
                  properties: {
                    baseScore: { type: "number" },
                    confidenceInterval: { type: "string" },
                    keyDrivers: { type: "array", items: { type: "string" } }
                  }
                },
                team: {
                  type: "object",
                  properties: {
                    baseScore: { type: "number" },
                    confidenceInterval: { type: "string" },
                    keyDrivers: { type: "array", items: { type: "string" } }
                  }
                },
                product: {
                  type: "object",
                  properties: {
                    baseScore: { type: "number" },
                    confidenceInterval: { type: "string" },
                    keyDrivers: { type: "array", items: { type: "string" } }
                  }
                },
                financials: {
                  type: "object",
                  properties: {
                    baseScore: { type: "number" },
                    confidenceInterval: { type: "string" },
                    keyDrivers: { type: "array", items: { type: "string" } }
                  }
                },
                traction: {
                  type: "object",
                  properties: {
                    baseScore: { type: "number" },
                    confidenceInterval: { type: "string" },
                    keyDrivers: { type: "array", items: { type: "string" } }
                  }
                }
              }
            },
            investmentThesis: {
              type: "object",
              properties: {
                bullCase: {
                  type: "object",
                  properties: {
                    narrative: { type: "string" },
                    keyDrivers: { type: "array", items: { type: "string" } },
                    upside: { type: "string" },
                    probability: { type: "string" }
                  }
                },
                bearCase: {
                  type: "object",
                  properties: {
                    narrative: { type: "string" },
                    keyRisks: { type: "array", items: { type: "string" } },
                    downside: { type: "string" },
                    probability: { type: "string" }
                  }
                },
                baseCase: {
                  type: "object",
                  properties: {
                    narrative: { type: "string" },
                    expectedValue: { type: "string" },
                    probability: { type: "string" }
                  }
                },
                recommendation: {
                  type: "object",
                  properties: {
                    decision: { type: "string", enum: ["strong_buy", "buy", "hold", "pass"] },
                    reasoning: { type: "string" },
                    confidence: { type: "string" },
                    conditions: { type: "array", items: { type: "string" } }
                  }
                }
              }
            },
            overallScore: { type: "number", minimum: 0, maximum: 100 },
            confidenceLevel: { type: "string", enum: ["high", "medium", "low"] },
            criticalQuestions: {
              type: "array",
              items: { type: "string" },
              description: "Key questions that need answers before investing"
            }
          },
          required: ["evidenceValidation", "deepInsights", "riskAdjustedScores", "investmentThesis", "overallScore", "confidenceLevel"]
        };
        break;
    }

    return {
      system: baseSystem + '\n\n' + specificInstructions,
      content: documentContent
    };
  }

  /**
   * Analyze with parallel deep thinking across multiple dimensions
   * Returns comprehensive analysis combining multiple perspectives
   */
  async multiDimensionalDeepAnalysis(
    documents: Array<{ content: string; type: string; name: string }>
  ): Promise<any> {
    try {
      console.log('🔬 Starting multi-dimensional deep analysis...');

      // Run analyses in parallel for different dimensions
      const [financialAnalysis, marketAnalysis, teamAnalysis, comprehensiveAnalysis] = await Promise.all([
        this.analyzeWithDeepThinking(documents, 'financial'),
        this.analyzeWithDeepThinking(documents, 'market'),
        this.analyzeWithDeepThinking(documents, 'team'),
        this.analyzeWithDeepThinking(documents, 'comprehensive')
      ]);

      // Combine all analyses
      const combinedAnalysis = {
        comprehensiveAnalysis,
        detailedDimensions: {
          financial: financialAnalysis,
          market: marketAnalysis,
          team: teamAnalysis
        },
        synthesizedInsights: this.synthesizeInsights(
          financialAnalysis,
          marketAnalysis,
          teamAnalysis,
          comprehensiveAnalysis
        ),
        analyzedAt: new Date().toISOString(),
        analysisType: 'multi_dimensional_deep_research'
      };

      console.log('✅ Multi-dimensional deep analysis completed');
      return combinedAnalysis;
    } catch (error) {
      console.error('❌ Multi-dimensional analysis failed:', error);
      throw error;
    }
  }

  /**
   * Synthesize insights from multiple analyses
   */
  private synthesizeInsights(
    financial: any,
    market: any,
    team: any,
    comprehensive: any
  ): any {
    return {
      crossDimensionalPatterns: [
        // Example: Look for patterns across dimensions
        ...(financial.redFlags?.map((f: any) => ({
          type: 'financial_red_flag',
          description: f.flag,
          severity: f.severity,
          crossRef: 'financial'
        })) || []),
        ...(team.redFlags?.map((t: any) => ({
          type: 'team_red_flag',
          description: t,
          severity: 'medium',
          crossRef: 'team'
        })) || [])
      ],
      convergingSignals: {
        strengths: [],
        weaknesses: [],
        uncertainties: []
      },
      investmentDecision: {
        recommendedAction: comprehensive.investmentThesis?.recommendation?.decision || 'hold',
        confidence: comprehensive.confidenceLevel || 'medium',
        keyFactors: comprehensive.investmentThesis?.recommendation?.reasoning || ''
      }
    };
  }
}

// ============================================================================
// Export Instances
// ============================================================================

// Deep Research (requires allowlist access)
export const deepResearchService = new DeepResearchService({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
  appId: process.env.DISCOVERY_ENGINE_APP_ID || '',
  dataStoreId: process.env.DISCOVERY_ENGINE_DATA_STORE_ID || ''
});

// Enhanced Reasoning (works with standard API - RECOMMENDED)
export const enhancedReasoningService = new EnhancedReasoningService();

