import { StartupAnalysisResult } from './gemini';
import { PublicDataResult } from './webCrawler';

export interface DiscrepancyResult {
  overallDiscrepancyScore: number; // 0-100, higher means more discrepancies
  discrepancies: Discrepancy[];
  redFlags: RedFlag[];
  confidenceAssessment: ConfidenceAssessment;
  summary: string;
}

export interface Discrepancy {
  category: 'market' | 'team' | 'financial' | 'product' | 'company_info' | 'founder';
  field: string;
  documentValue: string | number;
  publicValue: string | number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  recommendation: string;
}

export interface RedFlag {
  type: 'financial' | 'team' | 'legal' | 'operational' | 'reputation';
  severity: 'warning' | 'critical';
  title: string;
  description: string;
  evidence: string[];
  recommendation: string;
}

export interface ConfidenceAssessment {
  documentReliability: number; // 0-100
  publicDataReliability: number; // 0-100
  overallConfidence: number; // 0-100
  factors: ConfidenceFactor[];
}

export interface ConfidenceFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  weight: number;
}

export class DiscrepancyAnalyzer {
  analyzeDiscrepancies(
    documentAnalysis: StartupAnalysisResult,
    publicData: PublicDataResult,
    companyName: string
  ): DiscrepancyResult {
    console.log(`🔍 Analyzing discrepancies for ${companyName}...`);

    const discrepancies: Discrepancy[] = [];
    const redFlags: RedFlag[] = [];
    const confidenceFactors: ConfidenceFactor[] = [];

    // Analyze company information discrepancies
    this.analyzeCompanyInfoDiscrepancies(documentAnalysis, publicData, discrepancies);
    
    // Analyze founder information discrepancies
    this.analyzeFounderDiscrepancies(documentAnalysis, publicData, [], discrepancies);
    
    // Analyze financial discrepancies
    this.analyzeFinancialDiscrepancies(documentAnalysis, publicData, discrepancies);
    
    // Analyze market information discrepancies
    this.analyzeMarketDiscrepancies(documentAnalysis, publicData, discrepancies);
    
    // Generate red flags
    this.generateRedFlags(discrepancies, publicData, redFlags);
    
    // Assess confidence
    this.assessConfidence(documentAnalysis, publicData, confidenceFactors);
    
    // Calculate overall discrepancy score
    const overallDiscrepancyScore = this.calculateOverallDiscrepancyScore(discrepancies);
    
    // Generate summary
    const summary = this.generateSummary(discrepancies, redFlags, overallDiscrepancyScore);

    const result: DiscrepancyResult = {
      overallDiscrepancyScore,
      discrepancies,
      redFlags,
      confidenceAssessment: {
        documentReliability: this.calculateDocumentReliability(discrepancies),
        publicDataReliability: this.calculatePublicDataReliability(publicData),
        overallConfidence: this.calculateOverallConfidence(confidenceFactors),
        factors: confidenceFactors
      },
      summary
    };

    console.log(`✅ Discrepancy analysis completed for ${companyName}`);
    return result;
  }

  private analyzeCompanyInfoDiscrepancies(
    documentAnalysis: StartupAnalysisResult,
    publicData: PublicDataResult,
    discrepancies: Discrepancy[]
  ): void {
    // Check if company description matches
    if (publicData.companyInfo.description && documentAnalysis.keyInsights.length > 0) {
      const documentDescription = documentAnalysis.keyInsights.join(' ');
      const similarity = this.calculateTextSimilarity(documentDescription, publicData.companyInfo.description);
      
      if (similarity < 0.3) {
        discrepancies.push({
          category: 'company_info',
          field: 'description',
          documentValue: documentDescription.substring(0, 100) + '...',
          publicValue: publicData.companyInfo.description.substring(0, 100) + '...',
          severity: 'medium',
          description: 'Company description in documents differs significantly from public information',
          impact: 'May indicate misrepresentation or outdated information',
          recommendation: 'Verify company description with official sources'
        });
      }
    }

    // Check founding date
    if (publicData.companyInfo.founded && publicData.businessRegistry.incorporationDate) {
      const publicFounded = new Date(publicData.companyInfo.founded);
      const registryFounded = new Date(publicData.businessRegistry.incorporationDate);
      
      if (Math.abs(publicFounded.getTime() - registryFounded.getTime()) > 365 * 24 * 60 * 60 * 1000) { // 1 year difference
        discrepancies.push({
          category: 'company_info',
          field: 'founding_date',
          documentValue: publicData.companyInfo.founded,
          publicValue: publicData.businessRegistry.incorporationDate,
          severity: 'high',
          description: 'Founding date discrepancy between public info and business registry',
          impact: 'Could indicate false claims about company history',
          recommendation: 'Verify founding date with official business registry'
        });
      }
    }
  }

  private analyzeFounderDiscrepancies(
    documentAnalysis: StartupAnalysisResult,
    publicData: PublicDataResult,
    founderNames: string[],
    discrepancies: Discrepancy[]
  ): void {
    // Check if founder profiles are verified
    const unverifiedFounders = publicData.founderProfiles.filter(profile => !profile.verified);
    
    if (unverifiedFounders.length > 0) {
      discrepancies.push({
        category: 'founder',
        field: 'verification',
        documentValue: `${founderNames.length} founders mentioned`,
        publicValue: `${unverifiedFounders.length} unverified profiles`,
        severity: 'medium',
        description: 'Some founder profiles could not be verified through public sources',
        impact: 'May indicate false founder claims or privacy concerns',
        recommendation: 'Request additional verification for founder backgrounds'
      });
    }

    // Check team quality score vs public data
    if (publicData.founderProfiles.length > 0) {
      const avgExperience = publicData.founderProfiles.reduce((sum, profile) => 
        sum + profile.experience.length, 0) / publicData.founderProfiles.length;
      
      if (documentAnalysis.metrics.team > 90 && avgExperience < 3) {
        discrepancies.push({
          category: 'team',
          field: 'experience',
          documentValue: `Team score: ${documentAnalysis.metrics.team}`,
          publicValue: `Avg experience: ${avgExperience.toFixed(1)} positions`,
          severity: 'high',
          description: 'High team score in documents but limited public experience data',
          impact: 'May indicate inflated team quality claims',
          recommendation: 'Request detailed founder CVs and references'
        });
      }
    }
  }

  private analyzeFinancialDiscrepancies(
    documentAnalysis: StartupAnalysisResult,
    publicData: PublicDataResult,
    discrepancies: Discrepancy[]
  ): void {
    // Check for negative news about financial issues
    const negativeFinancialNews = publicData.newsArticles.filter(article => 
      article.sentiment === 'negative' && 
      (article.title.toLowerCase().includes('funding') || 
       article.title.toLowerCase().includes('financial') ||
       article.title.toLowerCase().includes('revenue'))
    );

    if (negativeFinancialNews.length > 0 && documentAnalysis.metrics.financials > 80) {
      discrepancies.push({
        category: 'financial',
        field: 'reputation',
        documentValue: `Financial score: ${documentAnalysis.metrics.financials}`,
        publicValue: `${negativeFinancialNews.length} negative financial news articles`,
        severity: 'high',
        description: 'High financial score in documents but negative financial news in public sources',
        impact: 'May indicate financial issues not disclosed in documents',
        recommendation: 'Investigate financial news and request detailed financial statements'
      });
    }
  }

  private analyzeMarketDiscrepancies(
    documentAnalysis: StartupAnalysisResult,
    publicData: PublicDataResult,
    discrepancies: Discrepancy[]
  ): void {
    // Check industry classification
    if (publicData.companyInfo.industry && documentAnalysis.keyInsights.length > 0) {
      const documentIndustry = this.extractIndustryFromInsights(documentAnalysis.keyInsights);
      
      if (documentIndustry && !this.industriesMatch(documentIndustry, publicData.companyInfo.industry)) {
        discrepancies.push({
          category: 'market',
          field: 'industry',
          documentValue: documentIndustry,
          publicValue: publicData.companyInfo.industry,
          severity: 'low',
          description: 'Industry classification differs between documents and public sources',
          impact: 'Minor discrepancy, may be due to different classification systems',
          recommendation: 'Clarify industry classification'
        });
      }
    }
  }

  private generateRedFlags(discrepancies: Discrepancy[], publicData: PublicDataResult, redFlags: RedFlag[]): void {
    // Critical discrepancies become red flags
    const criticalDiscrepancies = discrepancies.filter(d => d.severity === 'critical');
    
    criticalDiscrepancies.forEach(discrepancy => {
      redFlags.push({
        type: this.mapCategoryToRedFlagType(discrepancy.category),
        severity: 'critical',
        title: `Critical ${discrepancy.category} discrepancy`,
        description: discrepancy.description,
        evidence: [discrepancy.documentValue.toString(), discrepancy.publicValue.toString()],
        recommendation: discrepancy.recommendation
      });
    });

    // Check for domain issues
    if (publicData.domainInfo.status && !publicData.domainInfo.status.includes('ok')) {
      redFlags.push({
        type: 'operational',
        severity: 'warning',
        title: 'Domain status issues',
        description: 'Company domain has non-standard status',
        evidence: [publicData.domainInfo.status],
        recommendation: 'Verify domain ownership and status'
      });
    }

    // Check for business registry issues
    if (publicData.businessRegistry.status && 
        !['active', 'good standing', 'current'].includes(publicData.businessRegistry.status.toLowerCase())) {
      redFlags.push({
        type: 'legal',
        severity: 'critical',
        title: 'Business registry issues',
        description: 'Company status in business registry is not active',
        evidence: [publicData.businessRegistry.status],
        recommendation: 'Verify company legal status immediately'
      });
    }
  }

  private assessConfidence(
    documentAnalysis: StartupAnalysisResult,
    publicData: PublicDataResult,
    confidenceFactors: ConfidenceFactor[]
  ): void {
    // Public data availability
    const publicDataScore = publicData.confidenceScore;
    confidenceFactors.push({
      factor: 'Public Data Availability',
      impact: publicDataScore > 70 ? 'positive' : publicDataScore < 30 ? 'negative' : 'neutral',
      description: `${publicDataScore}% of expected public data found`,
      weight: 0.3
    });

    // News coverage
    const newsCount = publicData.newsArticles.length;
    confidenceFactors.push({
      factor: 'Media Coverage',
      impact: newsCount > 5 ? 'positive' : newsCount === 0 ? 'negative' : 'neutral',
      description: `${newsCount} news articles found`,
      weight: 0.2
    });

    // Domain age
    if (publicData.domainInfo.registeredDate) {
      const domainAge = this.calculateDomainAge(publicData.domainInfo.registeredDate);
      confidenceFactors.push({
        factor: 'Domain Age',
        impact: domainAge > 2 ? 'positive' : domainAge < 0.5 ? 'negative' : 'neutral',
        description: `Domain registered ${domainAge.toFixed(1)} years ago`,
        weight: 0.15
      });
    }

    // Business registry verification
    if (publicData.businessRegistry.registrationNumber) {
      confidenceFactors.push({
        factor: 'Business Registry',
        impact: 'positive',
        description: 'Company found in business registry',
        weight: 0.2
      });
    }

    // Founder verification
    const verifiedFounders = publicData.founderProfiles.filter(p => p.verified).length;
    const totalFounders = publicData.founderProfiles.length;
    if (totalFounders > 0) {
      confidenceFactors.push({
        factor: 'Founder Verification',
        impact: verifiedFounders === totalFounders ? 'positive' : verifiedFounders === 0 ? 'negative' : 'neutral',
        description: `${verifiedFounders}/${totalFounders} founders verified`,
        weight: 0.15
      });
    }
  }

  private calculateOverallDiscrepancyScore(discrepancies: Discrepancy[]): number {
    if (discrepancies.length === 0) return 0;

    const weights = { critical: 4, high: 3, medium: 2, low: 1 };
    const totalWeight = discrepancies.reduce((sum, d) => sum + weights[d.severity], 0);
    const maxPossibleWeight = discrepancies.length * 4;
    
    return Math.round((totalWeight / maxPossibleWeight) * 100);
  }

  private calculateDocumentReliability(discrepancies: Discrepancy[]): number {
    const criticalCount = discrepancies.filter(d => d.severity === 'critical').length;
    const highCount = discrepancies.filter(d => d.severity === 'high').length;
    const mediumCount = discrepancies.filter(d => d.severity === 'medium').length;
    
    const reliabilityScore = 100 - (criticalCount * 25) - (highCount * 15) - (mediumCount * 5);
    return Math.max(0, reliabilityScore);
  }

  private calculatePublicDataReliability(publicData: PublicDataResult): number {
    return publicData.confidenceScore;
  }

  private calculateOverallConfidence(confidenceFactors: ConfidenceFactor[]): number {
    const weightedScore = confidenceFactors.reduce((sum, factor) => {
      const score = factor.impact === 'positive' ? 100 : factor.impact === 'negative' ? 0 : 50;
      return sum + (score * factor.weight);
    }, 0);
    
    return Math.round(weightedScore);
  }

  private generateSummary(discrepancies: Discrepancy[], redFlags: RedFlag[], discrepancyScore: number): string {
    const criticalCount = discrepancies.filter(d => d.severity === 'critical').length;
    const highCount = discrepancies.filter(d => d.severity === 'high').length;
    const redFlagCount = redFlags.length;

    if (discrepancyScore === 0) {
      return "No significant discrepancies found between document claims and public data. High confidence in analysis.";
    } else if (discrepancyScore < 25) {
      return `Minor discrepancies found (${discrepancies.length} total). Analysis remains reliable with some caution advised.`;
    } else if (discrepancyScore < 50) {
      return `Moderate discrepancies detected (${discrepancies.length} total, ${highCount} high severity). Additional verification recommended.`;
    } else {
      return `Significant discrepancies found (${discrepancies.length} total, ${criticalCount} critical, ${redFlagCount} red flags). High risk of misrepresentation.`;
    }
  }

  // Helper methods
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    return intersection.length / union.length;
  }

  private extractIndustryFromInsights(insights: string[]): string | null {
    const industries = ['AI', 'ML', 'FinTech', 'HealthTech', 'EdTech', 'SaaS', 'E-commerce', 'Biotech'];
    const text = insights.join(' ').toLowerCase();
    
    for (const industry of industries) {
      if (text.includes(industry.toLowerCase())) {
        return industry;
      }
    }
    return null;
  }

  private industriesMatch(industry1: string, industry2: string): boolean {
    const normalized1 = industry1.toLowerCase().replace(/[^a-z]/g, '');
    const normalized2 = industry2.toLowerCase().replace(/[^a-z]/g, '');
    return normalized1.includes(normalized2) || normalized2.includes(normalized1);
  }

  private mapCategoryToRedFlagType(category: string): RedFlag['type'] {
    switch (category) {
      case 'financial': return 'financial';
      case 'team': case 'founder': return 'team';
      case 'company_info': return 'legal';
      default: return 'operational';
    }
  }

  private calculateDomainAge(registeredDate: string): number {
    const registered = new Date(registeredDate);
    const now = new Date();
    return (now.getTime() - registered.getTime()) / (365 * 24 * 60 * 60 * 1000);
  }
}

// Export singleton instance
export const discrepancyAnalyzer = new DiscrepancyAnalyzer();
