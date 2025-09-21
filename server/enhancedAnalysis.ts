import { StartupAnalysisResult } from './gemini';
import { PublicDataResult, webCrawler } from './webCrawler';
import { DiscrepancyResult, discrepancyAnalyzer } from './discrepancyAnalyzer';

export interface EnhancedAnalysisResult {
  // Original document analysis
  documentAnalysis: StartupAnalysisResult;
  
  // Public data verification
  publicDataAnalysis: PublicDataResult;
  
  // Discrepancy analysis
  discrepancyAnalysis: DiscrepancyResult;
  
  // Overall assessment
  overallAssessment: OverallAssessment;
  
  // Metadata
  analysisId: string;
  companyName: string;
  analyzedAt: string;
  analysisVersion: string;
}

export interface OverallAssessment {
  overallScore: number; // 0-100, adjusted for discrepancies
  confidenceLevel: 'high' | 'medium' | 'low';
  riskLevel: 'Low' | 'Medium' | 'High';
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'pass';
  keyFindings: string[];
  nextSteps: string[];
  redFlagsCount: number;
  discrepanciesCount: number;
}

export class EnhancedAnalysisService {
  async performEnhancedAnalysis(
    documents: Array<{ content: string; type: string; name: string }>,
    companyName: string,
    websites: string[] = []
  ): Promise<EnhancedAnalysisResult> {
    console.log(`🚀 Starting enhanced analysis for ${companyName}...`);
    
    const analysisId = this.generateAnalysisId();
    const analyzedAt = new Date().toISOString();
    
    try {
      // Step 1: Perform document analysis (existing functionality)
      console.log('📄 Step 1: Analyzing documents...');
      const documentAnalysis = await this.analyzeDocuments(documents);
      
      // Step 2: Crawl public data with manual source input
      console.log('🌐 Step 2: Crawling public data with manual sources...');
      const publicDataAnalysis = await webCrawler.crawlPublicData(
        companyName,
        websites
      );
      
      // Step 3: Analyze discrepancies
      console.log('🔍 Step 3: Analyzing discrepancies...');
      const discrepancyAnalysis = discrepancyAnalyzer.analyzeDiscrepancies(
        documentAnalysis,
        publicDataAnalysis,
        companyName
      );
      
      // Step 4: Generate overall assessment
      console.log('📊 Step 4: Generating overall assessment...');
      const overallAssessment = this.generateOverallAssessment(
        documentAnalysis,
        publicDataAnalysis,
        discrepancyAnalysis
      );
      
      const result: EnhancedAnalysisResult = {
        documentAnalysis,
        publicDataAnalysis,
        discrepancyAnalysis,
        overallAssessment,
        analysisId,
        companyName,
        analyzedAt,
        analysisVersion: '1.0.0'
      };
      
      console.log(`✅ Enhanced analysis completed for ${companyName}`);
      return result;
      
    } catch (error) {
      console.error('Error in enhanced analysis:', error);
      throw new Error(`Enhanced analysis failed: ${error}`);
    }
  }

  private async analyzeDocuments(documents: Array<{ content: string; type: string; name: string }>): Promise<StartupAnalysisResult> {
    // Import the existing document analysis function
    const { analyzeStartupDocuments } = await import('./gemini');
    return await analyzeStartupDocuments(documents);
  }

  private generateOverallAssessment(
    documentAnalysis: StartupAnalysisResult,
    publicData: PublicDataResult,
    discrepancyAnalysis: DiscrepancyResult
  ): OverallAssessment {
    // Calculate adjusted overall score based on discrepancies
    const baseScore = documentAnalysis.overallScore;
    const discrepancyPenalty = discrepancyAnalysis.overallDiscrepancyScore * 0.5; // 50% penalty for discrepancies
    const adjustedScore = Math.max(0, baseScore - discrepancyPenalty);
    
    // Determine confidence level
    const confidenceLevel = this.determineConfidenceLevel(discrepancyAnalysis.confidenceAssessment.overallConfidence);
    
    // Determine risk level
    const riskLevel = this.determineRiskLevel(discrepancyAnalysis.redFlags, discrepancyAnalysis.overallDiscrepancyScore);
    
    // Determine recommendation
    const recommendation = this.determineRecommendation(adjustedScore, discrepancyAnalysis.redFlags.length);
    
    // Generate key findings
    const keyFindings = this.generateKeyFindings(documentAnalysis, publicData, discrepancyAnalysis);
    
    // Generate next steps
    const nextSteps = this.generateNextSteps(discrepancyAnalysis, publicData);
    
    return {
      overallScore: Math.round(adjustedScore),
      confidenceLevel,
      riskLevel,
      recommendation,
      keyFindings,
      nextSteps,
      redFlagsCount: discrepancyAnalysis.redFlags.length,
      discrepanciesCount: discrepancyAnalysis.discrepancies.length
    };
  }

  private determineConfidenceLevel(confidenceScore: number): 'high' | 'medium' | 'low' {
    if (confidenceScore >= 80) return 'high';
    if (confidenceScore >= 60) return 'medium';
    return 'low';
  }

  private determineRiskLevel(redFlags: any[], discrepancyScore: number): 'Low' | 'Medium' | 'High' {
    const criticalRedFlags = redFlags.filter(flag => flag.severity === 'critical').length;
    
    if (criticalRedFlags > 0 || discrepancyScore > 70) return 'High';
    if (discrepancyScore > 40 || redFlags.length > 2) return 'Medium';
    return 'Low';
  }

  private determineRecommendation(adjustedScore: number, redFlagCount: number): 'strong_buy' | 'buy' | 'hold' | 'pass' {
    if (redFlagCount > 2) return 'pass';
    if (adjustedScore >= 85) return 'strong_buy';
    if (adjustedScore >= 70) return 'buy';
    if (adjustedScore >= 55) return 'hold';
    return 'pass';
  }

  private generateKeyFindings(
    documentAnalysis: StartupAnalysisResult,
    publicData: PublicDataResult,
    discrepancyAnalysis: DiscrepancyResult
  ): string[] {
    const findings: string[] = [];
    
    // Document analysis findings
    findings.push(`Document analysis shows overall score of ${documentAnalysis.overallScore}/100`);
    
    // Public data findings
    if (publicData.confidenceScore > 70) {
      findings.push(`Strong public data verification (${publicData.confidenceScore}% confidence)`);
    } else if (publicData.confidenceScore < 30) {
      findings.push(`Limited public data available (${publicData.confidenceScore}% confidence)`);
    }
    
    // Discrepancy findings
    if (discrepancyAnalysis.discrepancies.length === 0) {
      findings.push('No significant discrepancies found between documents and public data');
    } else {
      findings.push(`${discrepancyAnalysis.discrepancies.length} discrepancies identified`);
    }
    
    // Red flag findings
    if (discrepancyAnalysis.redFlags.length > 0) {
      findings.push(`${discrepancyAnalysis.redFlags.length} red flags require attention`);
    }
    
    // News sentiment
    const positiveNews = publicData.newsArticles.filter(article => article.sentiment === 'positive').length;
    const negativeNews = publicData.newsArticles.filter(article => article.sentiment === 'negative').length;
    
    if (positiveNews > negativeNews) {
      findings.push('Positive media sentiment overall');
    } else if (negativeNews > positiveNews) {
      findings.push('Negative media sentiment detected');
    }
    
    return findings;
  }

  private generateNextSteps(discrepancyAnalysis: DiscrepancyResult, publicData: PublicDataResult): string[] {
    const nextSteps: string[] = [];
    
    // High priority steps for critical discrepancies
    const criticalDiscrepancies = discrepancyAnalysis.discrepancies.filter(d => d.severity === 'critical');
    if (criticalDiscrepancies.length > 0) {
      nextSteps.push('Address critical discrepancies immediately');
      nextSteps.push('Request additional documentation for verification');
    }
    
    // Red flag steps
    if (discrepancyAnalysis.redFlags.length > 0) {
      nextSteps.push('Investigate all red flags before proceeding');
    }
    
    // Public data steps
    if (publicData.confidenceScore < 50) {
      nextSteps.push('Gather additional public information');
      nextSteps.push('Verify company registration and legal status');
    }
    
    // Founder verification steps
    const unverifiedFounders = publicData.founderProfiles.filter(p => !p.verified);
    if (unverifiedFounders.length > 0) {
      nextSteps.push('Verify founder backgrounds and credentials');
    }
    
    // Financial verification steps
    const financialDiscrepancies = discrepancyAnalysis.discrepancies.filter(d => d.category === 'financial');
    if (financialDiscrepancies.length > 0) {
      nextSteps.push('Request audited financial statements');
      nextSteps.push('Verify revenue claims with third-party sources');
    }
    
    // Default steps
    if (nextSteps.length === 0) {
      nextSteps.push('Proceed with standard due diligence');
      nextSteps.push('Schedule management meetings');
    }
    
    return nextSteps;
  }

  private generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const enhancedAnalysisService = new EnhancedAnalysisService();
