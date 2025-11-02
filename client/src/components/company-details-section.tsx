import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Globe,
  ExternalLink,
  ChevronDown,
  TrendingDown,
  BarChart3,
  Target,
  Lightbulb,
  Shield,
  Package,
  CheckCircle2,
  XCircle,
  Network,
  TrendingUpDown,
  Newspaper,
  Award,
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  AlertTriangle,
  PieChart as PieChartIcon,
  BarChart2,
  Zap,
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Area,
  AreaChart
} from "recharts";

interface CompanyDetailsSectionProps {
  analysisData: any;
}

export default function CompanyDetailsSection({
  analysisData,
}: CompanyDetailsSectionProps) {
  const { analysis } = analysisData;

  // Extract the new information from analysis
  const companyInfo = analysis?.companyInfo;
  const corporateStructure = analysis?.corporateStructure;
  const foundersInfo = analysis?.foundersInfo;
  const employeeInfo = analysis?.employeeInfo;
  const financialInfo = analysis?.financialInfo;
  const fundingInfo = analysis?.fundingInfo;
  const recentDevelopments = analysis?.recentDevelopments;
  const ipoAnalysis = analysis?.ipoAnalysis;
  const customerFeedback = analysis?.customerFeedback;
  const employeeSatisfaction = analysis?.employeeSatisfaction;
  const informationGaps = analysis?.informationGaps;

  // Helper function to parse currency strings to numbers
  const parseCurrency = (value: string): number | null => {
    if (!value || value === 'N/A') return null;
    
    // Remove currency symbols and spaces
    const cleaned = value.replace(/[$,\s]/g, '');
    
    // Handle K, M, B suffixes
    if (cleaned.includes('B')) {
      return parseFloat(cleaned.replace('B', '')) * 1000000000;
    } else if (cleaned.includes('M')) {
      return parseFloat(cleaned.replace('M', '')) * 1000000;
    } else if (cleaned.includes('K')) {
      return parseFloat(cleaned.replace('K', '')) * 1000;
    }
    
    // Try to parse as regular number
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  // Helper function to format numbers for display
  const formatNumber = (num: number, currency = true): string => {
    if (!num && num !== 0) return 'N/A';
    
    const prefix = currency ? '$' : '';
    const absNum = Math.abs(num);
    
    if (absNum >= 1_000_000_000) {
      return `${prefix}${(num / 1_000_000_000).toFixed(1)}B`;
    } else if (absNum >= 1_000_000) {
      return `${prefix}${(num / 1_000_000).toFixed(1)}M`;
    } else if (absNum >= 1_000) {
      return `${prefix}${(num / 1_000).toFixed(1)}K`;
    } else {
      return `${prefix}${num.toLocaleString()}`;
    }
  };

  // Don't render if no data is available
  if (
    !companyInfo &&
    !corporateStructure &&
    !foundersInfo &&
    !employeeInfo &&
    !financialInfo &&
    !fundingInfo &&
    !recentDevelopments &&
    !ipoAnalysis &&
    !customerFeedback &&
    !employeeSatisfaction &&
    !informationGaps
  ) {
    return null;
  }

  return (
    <>
      {/* Company Overview */}
      {companyInfo && (
        <Card>
          <details className="group" open>
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <span className="font-semibold">
                  Company Overview
                </span>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {companyInfo.sector && companyInfo.sector !== 'N/A' && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Sector</p>
                    <p className="text-sm font-semibold mt-1">{companyInfo.sector}</p>
                  </div>
                )}
                {companyInfo.industry && companyInfo.industry !== 'N/A' && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Industry</p>
                    <p className="text-sm font-semibold mt-1">{companyInfo.industry}</p>
                  </div>
                )}
                {companyInfo.foundedYear && companyInfo.foundedYear !== 'N/A' && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Founded</p>
                    <p className="text-sm font-semibold mt-1">{companyInfo.foundedYear}</p>
                  </div>
                )}
                {companyInfo.headquarters && companyInfo.headquarters !== 'N/A' && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Headquarters</p>
                    <p className="text-sm font-semibold mt-1">{companyInfo.headquarters}</p>
                  </div>
                )}
              </div>

              {/* Founders from foundersInfo */}
              {foundersInfo?.founders && foundersInfo.founders.length > 0 && foundersInfo.founders[0]?.name && foundersInfo.founders[0].name !== 'N/A' && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-2">Founders</p>
                    <div className="flex flex-wrap gap-2">
                      {foundersInfo.founders.map((founder: any, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {founder.name}{founder.role && founder.role !== 'N/A' ? ` - ${founder.role}` : ''}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {companyInfo.description && companyInfo.description !== 'N/A' && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-2">Description</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{companyInfo.description}</p>
                  </div>
                </>
              )}

              {/* Current CEO - check multiple sources */}
              {(() => {
                // Try to find CEO from companyInfo.ceo or foundersInfo.currentLeadership
                let ceo = null;
                
                if (companyInfo.ceo && companyInfo.ceo !== 'N/A') {
                  ceo = companyInfo.ceo;
                } else if (foundersInfo?.currentLeadership && foundersInfo.currentLeadership.length > 0) {
                  // Look for CEO in leadership
                  const ceoLeader = foundersInfo.currentLeadership.find((leader: any) => 
                    leader.title && (
                      leader.title.toLowerCase().includes('ceo') || 
                      leader.title.toLowerCase().includes('chief executive')
                    )
                  );
                  if (ceoLeader) {
                    ceo = ceoLeader.name;
                  }
                }

                return ceo && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Current CEO</p>
                      <p className="text-sm font-semibold mt-1">
                        {typeof ceo === 'string' 
                          ? ceo 
                          : `${ceo.name}${ceo.since ? ` (Since ${ceo.since})` : ''}`}
                      </p>
                    </div>
                  </>
                );
              })()}

              {companyInfo.website && companyInfo.website !== 'N/A' && (
                <>
                  <Separator />
                  <div>
                    <a
                      href={
                        companyInfo.website.startsWith("http")
                          ? companyInfo.website
                          : `https://${companyInfo.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Globe className="h-4 w-4" />
                      {companyInfo.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </>
              )}
            </CardContent>
          </details>
        </Card>
      )}

      {/* Corporate Structure */}
      {corporateStructure && (corporateStructure.parentCompany || corporateStructure.subsidiaries?.length > 0 || corporateStructure.mergers?.length > 0 || corporateStructure.acquisitions?.length > 0) && (
          <Card>
            <details className="group">
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
                <div className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                <span className="font-semibold">
                  Corporate Structure
                  </span>
                </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
              </summary>
              <CardContent className="space-y-4 pt-4">
                    <div className="grid md:grid-cols-2 gap-4">
                {corporateStructure.parentCompany && corporateStructure.parentCompany !== 'null' && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium">Parent Company</p>
                    <p className="text-sm font-semibold mt-1">{corporateStructure.parentCompany}</p>
                          </div>
                )}
                
                {corporateStructure.subsidiaries && corporateStructure.subsidiaries.length > 0 && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium mb-2">Subsidiaries</p>
                    <div className="flex flex-wrap gap-2">
                      {corporateStructure.subsidiaries.map((sub: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {sub}
                        </Badge>
                      ))}
                    </div>
                              </div>
                            )}
              </div>

              {corporateStructure.mergers && corporateStructure.mergers.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <TrendingUpDown className="h-4 w-4 text-blue-600" />
                    Mergers
                  </p>
                  <div className="space-y-2">
                    {corporateStructure.mergers.map((merger: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">{merger.company}</p>
                          <Badge variant="outline" className="text-xs">{merger.year}</Badge>
                              </div>
                        {merger.amount && merger.amount !== 'N/A' && (
                          <p className="text-xs text-muted-foreground mt-1">Deal Amount: {merger.amount}</p>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {corporateStructure.acquisitions && corporateStructure.acquisitions.length > 0 && (
                    <div>
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-600" />
                    Acquisitions
                  </p>
                      <div className="space-y-2">
                    {corporateStructure.acquisitions.map((acquisition: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">{acquisition.company}</p>
                          <Badge variant="outline" className="text-xs">{acquisition.year}</Badge>
                                </div>
                        {acquisition.amount && acquisition.amount !== 'N/A' && (
                          <p className="text-xs text-muted-foreground mt-1">Deal Amount: {acquisition.amount}</p>
                              )}
                        {acquisition.rationale && acquisition.rationale !== 'N/A' && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{acquisition.rationale}</p>
                        )}
                      </div>
                    ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </details>
          </Card>
        )}

      {/* Team & Leadership */}
      {(foundersInfo || employeeInfo) && (
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="font-semibold">
                    Team & Leadership
                </span>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="space-y-4 pt-4">
              {/* Company Size and Growth */}
              {employeeInfo && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                    <p className="text-xs text-muted-foreground font-medium">Company Size</p>
                    <p className="text-sm font-bold mt-1">{employeeInfo.currentEmployeeSize || 'N/A'} employees</p>
                </div>
                  
                  {employeeInfo.employeeGrowthRate && employeeInfo.employeeGrowthRate !== 'N/A' && (
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                      <p className="text-xs text-muted-foreground font-medium">Growth Rate 
                        <div className="inline-block pl-1">{employeeInfo.employeeGrowthRate.includes('-') ? (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        ) : (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        )}</div></p>
                      <p className="text-sm font-bold mt-1 flex items-center gap-1">
                        {employeeInfo.employeeGrowthRate}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Year-over-year</p>
                </div>
                  )}
                  
                  {employeeInfo.hiringPlans && employeeInfo.hiringPlans !== 'N/A' && (
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground font-medium">Hiring Plans</p>
                      <p className="text-sm font-semibold mt-1">{employeeInfo.hiringPlans}</p>
              </div>
                  )}
                </div>
              )}

              {/* Current Founders */}
              {foundersInfo && foundersInfo.founders && foundersInfo.founders.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">Current Founders</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {foundersInfo.founders.map((founder: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-sm font-semibold">{founder.name || "N/A"}</p>
                          </div>
                          {founder.role && founder.role !== "N/A" && (
                            <p className="text-xs text-muted-foreground">{founder.role}</p>
                          )}
                          {founder.background && founder.background !== "N/A" && (
                            <p className="text-xs text-muted-foreground mt-1">{founder.background}</p>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Key Executives */}
              {foundersInfo && foundersInfo.currentLeadership && foundersInfo.currentLeadership.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">Key Executives</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {foundersInfo.currentLeadership.map((leader: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                          <p className="text-sm font-semibold">{leader.name || "N/A"}</p>
                          <p className="text-xs text-muted-foreground mt-1">{leader.title || "N/A"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Employee Growth History Chart */}
              {employeeInfo && employeeInfo.employeeHistory && 
                employeeInfo.employeeHistory.length > 0 && 
                employeeInfo.employeeHistory[0].year !== 'N/A' && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">Employee Growth Trend</p>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={employeeInfo.employeeHistory}>
                          <defs>
                            <linearGradient id="colorEmployees" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="year" 
                            className="text-xs"
                            stroke="currentColor"
                          />
                          <YAxis 
                            className="text-xs"
                            stroke="currentColor"
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#3b82f6" 
                            fillOpacity={1} 
                            fill="url(#colorEmployees)"
                            name="Employees"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                </div>
              </div>
                </>
              )}

              {/* Key Departments */}
              {employeeInfo && employeeInfo.keyDepartments && employeeInfo.keyDepartments.length > 0 && employeeInfo.keyDepartments[0] !== 'N/A' && (
                <>
                  <Separator />
                <div>
                  <p className="text-sm font-semibold mb-3">Key Departments</p>
                  <div className="flex flex-wrap gap-2">
                    {employeeInfo.keyDepartments.map((dept: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">{dept}</Badge>
                    ))}
                  </div>
                </div>
                </>
              )}
            </CardContent>
          </details>
        </Card>
      )}

      {/* Product Information */}
      {analysis.productInfo && (
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <span className="font-semibold">
                  Product Information
                </span>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="space-y-4 pt-4">
              {/* Development Stage */}
              {analysis.productInfo.developmentStage && analysis.productInfo.developmentStage !== 'N/A' && (
                <div className="p-3 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Development Stage</p>
                  <p className="text-sm font-bold">{analysis.productInfo.developmentStage}</p>
                </div>
              )}

              {/* Product Description */}
              {analysis.productInfo.productDescription && analysis.productInfo.productDescription !== 'N/A' && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-2">Product Description</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{analysis.productInfo.productDescription}</p>
                  </div>
                </>
              )}

              {/* Key Features */}
              {analysis.productInfo.keyFeatures && 
                analysis.productInfo.keyFeatures.length > 0 && 
                analysis.productInfo.keyFeatures[0] !== 'N/A' && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">Key Features</p>
                    <ul className="space-y-2">
                      {analysis.productInfo.keyFeatures.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Technology Stack */}
              {analysis.productInfo.technologyStack && 
                analysis.productInfo.technologyStack.length > 0 && 
                analysis.productInfo.technologyStack[0] !== 'N/A' && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">Technology Stack</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.productInfo.technologyStack.map((tech: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Intellectual Property */}
              {analysis.productInfo.intellectualProperty && 
                analysis.productInfo.intellectualProperty.length > 0 && 
                analysis.productInfo.intellectualProperty[0] !== 'N/A' && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">Intellectual Property</p>
                    <ul className="space-y-2">
                      {analysis.productInfo.intellectualProperty.map((ip: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Shield className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          <span>{ip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Product Roadmap */}
              {analysis.productInfo.productRoadmap && 
                analysis.productInfo.productRoadmap.length > 0 && 
                analysis.productInfo.productRoadmap[0] !== 'N/A' && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      Product Roadmap
                    </p>
                    <ul className="space-y-2">
                      {analysis.productInfo.productRoadmap.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0 mt-2" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Scalability Factors */}
              {analysis.productInfo.scalabilityFactors && 
                analysis.productInfo.scalabilityFactors.length > 0 && 
                analysis.productInfo.scalabilityFactors[0] !== 'N/A' && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Scalability Factors
                    </p>
                    <ul className="space-y-2">
                      {analysis.productInfo.scalabilityFactors.map((factor: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </details>
        </Card>
      )}

      {/* Funding History */}
      {fundingInfo && (
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">
                  Funding History
                </span>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="space-y-4 pt-4">
              {fundingInfo.fundingRounds && fundingInfo.fundingRounds.length > 0 && fundingInfo.fundingRounds[0].round !== "N/A" ? (
                <>
                  {fundingInfo.totalFundingRaised && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="p-3 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Total Funding</p>
                        <p className="text-sm font-bold">{fundingInfo.totalFundingRaised || 'N/A'}</p>
                      </div>
                      {fundingInfo.currentValuation && fundingInfo.currentValuation !== 'N/A' && (
                        <div className="p-3 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Current Valuation</p>
                          <p className="text-sm font-bold">{fundingInfo.currentValuation}</p>
                        </div>
                      )}
                      <div className="p-3 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Funding Rounds</p>
                        <p className="text-sm font-bold">{fundingInfo.fundingRounds.length}</p>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Funding Rounds Chart */}
                  <div>
                    <p className="text-sm font-semibold mb-3">Funding Rounds Chart</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={fundingInfo.fundingRounds.map((round: any) => ({
                          ...round,
                          amount_numeric: parseCurrency(round.amount)
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="round" 
                            className="text-xs"
                            stroke="currentColor"
                          />
                          <YAxis 
                            className="text-xs"
                            stroke="currentColor"
                            tickFormatter={(value) => formatNumber(value)}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                            formatter={(value: any) => formatNumber(value)}
                          />
                          <Bar 
                            dataKey="amount_numeric" 
                            fill="#3b82f6" 
                            radius={[8, 8, 0, 0]} 
                            name="Amount" 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <Separator />

                  {/* Round Details */}
                  <div>
                    <p className="text-sm font-semibold mb-3">Round Details</p>
                    <div className="space-y-2">
                      {fundingInfo.fundingRounds.map((round: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="text-sm font-semibold">{round.round || "N/A"}</p>
                              <p className="text-xs text-muted-foreground">{round.date || "N/A"}</p>
                              {round.valuation && round.valuation !== "N/A" && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Valuation: {round.valuation}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {round.amount || "N/A"}
                            </Badge>
                          </div>
                          {round.leadInvestors && round.leadInvestors.length > 0 && round.leadInvestors[0] !== "N/A" && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground font-medium mb-1">Lead Investors:</p>
                              <div className="flex flex-wrap gap-1">
                                {round.leadInvestors.map((investor: string, j: number) => (
                                  <Badge key={j} variant="secondary" className="text-xs">
                                    {investor}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Valuation Chart (if valuation data exists) */}
                  {fundingInfo.fundingRounds.some((r: any) => r.valuation && r.valuation !== 'N/A') && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-semibold mb-3">Valuation Growth</p>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart 
                              data={fundingInfo.fundingRounds
                                .filter((r: any) => r.valuation && r.valuation !== 'N/A')
                                .map((round: any) => ({
                                  ...round,
                                  valuation_numeric: parseCurrency(round.valuation)
                                }))
                              }
                            >
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis 
                                dataKey="round" 
                                className="text-xs"
                                stroke="currentColor"
                              />
                              <YAxis 
                                className="text-xs"
                                stroke="currentColor"
                                tickFormatter={(value) => formatNumber(value)}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--background))', 
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px'
                                }}
                                formatter={(value: any) => formatNumber(value)}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="valuation_numeric" 
                                stroke="#8b5cf6" 
                                strokeWidth={3}
                                name="Valuation"
                                dot={{ fill: '#8b5cf6', r: 5 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Current Investors */}
                  {/* {fundingInfo.currentInvestors && fundingInfo.currentInvestors.length > 0 && fundingInfo.currentInvestors[0] !== "N/A" && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-semibold mb-3">Current Investors</p>
                        <div className="flex flex-wrap gap-2">
                          {fundingInfo.currentInvestors.map((investor: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {investor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )} */}
  

                  {/* Past Investors Who Exited */}
                  {fundingInfo.pastInvestorsExited && fundingInfo.pastInvestorsExited.length > 0 && fundingInfo.pastInvestorsExited[0].name !== "N/A" && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          Past Investors Who Exited
                        </p>
                        <div className="space-y-2">
                          {fundingInfo.pastInvestorsExited.map((investor: any, index: number) => (
                            <div key={index} className="p-3 border rounded-lg border-red-200 dark:border-red-800">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-semibold">{investor.name}</p>
                                {investor.exitDate && investor.exitDate !== 'N/A' && (
                                  <Badge variant="outline" className="text-xs">{investor.exitDate}</Badge>
                                )}
                              </div>
                              {investor.exitReason && investor.exitReason !== 'N/A' && (
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Exit Reason:</span> {investor.exitReason}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

  
                </>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No funding data available</p>
                  <p className="text-xs text-muted-foreground mt-1">This startup has not reported any funding rounds yet</p>
                </div>
              )}
            </CardContent>
          </details>
        </Card>
      )}

      {/* Financial Health & Revenue */}
      {financialInfo && (
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                <span className="font-semibold">
                Financial Health & Revenue
                </span>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="space-y-4 pt-4">
              {(financialInfo.currentRevenue || financialInfo.revenueHistory) ? (
                <>
                  {financialInfo.currentRevenue && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Annual Revenue</p>
                        <p className="text-sm font-bold">{financialInfo.currentRevenue || 'N/A'}</p>
                      </div>
                      {financialInfo.keyMetrics?.mrr && financialInfo.keyMetrics.mrr !== 'N/A' && (
                        <div className="p-3 border rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground font-medium mb-1">MRR</p>
                          <p className="text-sm font-bold">{financialInfo.keyMetrics.mrr}</p>
                        </div>
                      )}
                      {financialInfo.revenueGrowthRate && financialInfo.revenueGrowthRate !== 'N/A' && (
                        <div className="p-3 border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Growth Rate</p>
                          <p className="text-sm font-bold">{financialInfo.revenueGrowthRate}</p>
                        </div>
                      )}
                      {financialInfo.keyMetrics?.cac && financialInfo.keyMetrics.cac !== 'N/A' && (
                        <div className="p-3 border rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground font-medium mb-1">CAC</p>
                          <p className="text-sm font-bold">{financialInfo.keyMetrics.cac}</p>
                        </div>
                      )}
                      {financialInfo.keyMetrics?.ltv && financialInfo.keyMetrics.ltv !== 'N/A' && (
                        <div className="p-3 border rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground font-medium mb-1">LTV</p>
                          <p className="text-sm font-bold">{financialInfo.keyMetrics.ltv}</p>
                        </div>
                      )}
                      {financialInfo.burnRate && financialInfo.burnRate !== 'N/A' && (
                        <div className="p-3 border rounded-lg bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Monthly Burn Rate</p>
                          <p className="text-sm font-bold">{financialInfo.burnRate}</p>
                        </div>
                      )}
                      {financialInfo.runway && financialInfo.runway !== 'N/A' && (
                        <div className="p-3 border rounded-lg bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Cash Runway</p>
                          <p className="text-sm font-bold">{financialInfo.runway}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {financialInfo.profitabilityStatus && (
                    <>
                      <Separator />
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <p className="text-sm font-semibold mb-3">Profitability Status</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Status</p>
                            <Badge variant={financialInfo.profitabilityStatus === 'profitable' ? 'default' : 'secondary'} className="capitalize text-wrap">
                              {financialInfo.profitabilityStatus || 'N/A'}
                            </Badge>
                          </div>
                          {financialInfo.revenueModel && financialInfo.revenueModel !== 'N/A' && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Revenue Model</p>
                              <p className="text-xs font-semibold">{financialInfo.revenueModel}</p>
                            </div>
                          )}
                          {financialInfo.grossMargin && financialInfo.grossMargin !== 'N/A' && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Gross Margin</p>
                              <p className="text-sm font-semibold">{financialInfo.grossMargin}</p>
                            </div>
                          )}
                          {financialInfo.netMargin && financialInfo.netMargin !== 'N/A' && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Net Margin</p>
                              <p className="text-sm font-semibold">{financialInfo.netMargin}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {financialInfo.revenueHistory && 
                    financialInfo.revenueHistory.length > 0 && 
                    financialInfo.revenueHistory[0].year !== 'N/A' && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-semibold mb-3">Revenue Growth Chart</p>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[...financialInfo.revenueHistory].sort((a: any, b: any) => {
                              const yearA = parseInt(a.year) || 0;
                              const yearB = parseInt(b.year) || 0;
                              return yearA - yearB;
                            }).map((item: any) => ({
                              ...item,
                              revenue_numeric: parseCurrency(item.revenue)
                            }))}>
                              <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="year" className="text-xs" stroke="currentColor" />
                              <YAxis className="text-xs" stroke="currentColor" tickFormatter={(value) => formatNumber(value)} />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--background))', 
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px'
                                }}
                                formatter={(value: any) => formatNumber(value)}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="revenue_numeric" 
                                stroke="#10b981" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorRevenue)" 
                                name="Revenue" 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No financial data available</p>
                  <p className="text-xs text-muted-foreground mt-1">Financial information has not been reported for this startup</p>
                </div>
              )}
            </CardContent>
          </details>
        </Card>
      )}

      {/* Detailed Metrics */}
      <Card>
        <details className="group">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              <span className="font-semibold">
                Detailed Metrics Analysis
              </span>
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <CardContent className="space-y-4 pt-4">
            {analysis.metrics &&
            Object.keys(analysis.metrics).length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(analysis?.metrics || {}).map(
                    ([metric, score]) => (
                      <div key={metric} className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold capitalize">
                            {metric.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {score as number}/100
                          </Badge>
                        </div>
                        <Progress value={score as number} className="h-2.5" />
                        <p className="text-xs text-muted-foreground mt-2">
                          {(score as number) >= 80 ? "Excellent" : (score as number) >= 60 ? "Good" : (score as number) >= 40 ? "Fair" : "Needs Improvement"}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <BarChart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No metrics data available</p>
                <p className="text-xs text-muted-foreground mt-1">Analysis metrics will appear here once generated</p>
              </div>
            )}
          </CardContent>
        </details>
      </Card>


      {/* Growth Trajectory */}
      {analysis.growthMetrics && (analysis.growthMetrics.growthDrivers || analysis.growthMetrics.growthChallenges || analysis.growthMetrics.keyMilestones) && (
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <span className="font-semibold">
                  Growth Trajectory
                </span>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="space-y-4 pt-4">
              {/* Growth Metrics Cards */}
              {(analysis.growthMetrics.userGrowth || analysis.growthMetrics.revenueGrowth || analysis.growthMetrics.marketExpansion) && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {analysis.growthMetrics.userGrowth && analysis.growthMetrics.userGrowth !== 'N/A' && (
                      <div className="p-3 border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                        <p className="text-xs text-muted-foreground font-medium mb-1">User Growth</p>
                        <p className="text-sm font-bold">{analysis.growthMetrics.userGrowth}</p>
                      </div>
                    )}
                    {analysis.growthMetrics.revenueGrowth && analysis.growthMetrics.revenueGrowth !== 'N/A' && (
                      <div className="p-3 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Revenue Growth</p>
                        <p className="text-sm font-bold">{analysis.growthMetrics.revenueGrowth}</p>
                      </div>
                    )}
                    {analysis.growthMetrics.marketExpansion && analysis.growthMetrics.marketExpansion !== 'N/A' && (
                      <div className="p-3 border rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Market Expansion</p>
                        <p className="text-sm font-bold">{analysis.growthMetrics.marketExpansion}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Growth Drivers */}
              {analysis.growthMetrics.growthDrivers && 
                analysis.growthMetrics.growthDrivers.length > 0 && 
                analysis.growthMetrics.growthDrivers[0] !== 'N/A' && (
                <>
                  {(analysis.growthMetrics.userGrowth || analysis.growthMetrics.revenueGrowth || analysis.growthMetrics.marketExpansion) && <Separator />}
                  <div>
                    <p className="text-sm font-semibold mb-3 text-green-600">Growth Drivers</p>
                    <ul className="space-y-2">
                      {analysis.growthMetrics.growthDrivers.map((driver: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                          <span>{driver}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Growth Challenges */}
              {analysis.growthMetrics.growthChallenges && 
                analysis.growthMetrics.growthChallenges.length > 0 && 
                analysis.growthMetrics.growthChallenges[0] !== 'N/A' && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3 text-red-600">Growth Challenges</p>
                    <ul className="space-y-2">
                      {analysis.growthMetrics.growthChallenges.map((challenge: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                          <span>{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Key Milestones - Horizontal Timeline */}
              {analysis.growthMetrics.keyMilestones && 
                analysis.growthMetrics.keyMilestones.length > 0 && 
                analysis.growthMetrics.keyMilestones[0].date !== 'N/A' && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-4">Key Milestones</p>
                    <div className="relative overflow-x-auto pb-2">
                      <div className="flex items-start gap-3 px-2">
                        {analysis.growthMetrics.keyMilestones.map((milestone: any, index: number) => (
                          <div key={index} className="relative flex flex-col items-center max-w-[160px] flex-shrink-0">
                            {/* Timeline dot and line */}
                            <div className="relative w-full flex items-center mb-2">
                              {index > 0 && (
                                <div className="absolute right-1/2 top-1/2 w-full h-0.5 bg-primary/30" style={{ transform: 'translateY(-50%)', right: 'calc(50% + 10px)' }}></div>
                              )}
                              <div className="relative z-10 w-5 h-5 rounded-full bg-primary border-2 border-background mx-auto"></div>
                              {index < analysis.growthMetrics.keyMilestones.length - 1 && (
                                <div className="absolute left-1/2 top-1/2 w-full h-0.5 bg-primary/30" style={{ transform: 'translateY(-50%)', left: 'calc(50% + 10px)' }}></div>
                              )}
                            </div>
                            
                            {/* Milestone content */}
                            <div className="text-center">
                              <Badge variant="outline" className="text-xs mb-1.5">{milestone.date}</Badge>
                              <p className="text-xs leading-tight px-1">{milestone.milestone}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </details>
        </Card>
      )}

      {/* Market Position */}
      {analysis.marketAnalysis && (
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <span className="font-semibold">
                  Market Position
                </span>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="space-y-4 pt-4">
              {(analysis.marketAnalysis.tam || analysis.marketAnalysis.marketSize || analysis.marketAnalysis.marketShare || analysis.marketAnalysis.marketRanking) ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {analysis.marketAnalysis.marketSize && analysis.marketAnalysis.marketSize !== 'N/A' && (
                <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium">TAM</p>
                    <p className="text-sm font-bold mt-1">{analysis.marketAnalysis.marketSize}</p>
                </div>
                )}
                  {analysis.marketAnalysis.marketShare && analysis.marketAnalysis.marketShare !== 'N/A' && (
                      <div className="p-3 border rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Market Share</p>
                        <p className="text-sm font-bold">{analysis.marketAnalysis.marketShare}</p>
                      </div>
                    )}
                {analysis.marketAnalysis.marketGrowthRate && analysis.marketAnalysis.marketGrowthRate !== 'N/A' && (
                <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium">Growth Rate</p>
                    <p className="text-sm font-bold flex items-center gap-1 mt-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      {analysis.marketAnalysis.marketGrowthRate}
                    </p>
                </div>
                )}
                    {/* {analysis.marketAnalysis.tam && analysis.marketAnalysis.tam !== 'N/A' && (
                      <div className="p-3 border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                        <p className="text-xs text-muted-foreground font-medium mb-1">TAM</p>
                        <p className="text-sm font-bold">{analysis.marketAnalysis.tam}</p>
                      </div>
                    )} */}
                    {analysis.marketAnalysis.marketRanking && analysis.marketAnalysis.marketRanking !== 'N/A' && (
                      <div className="p-3 border rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Ranking</p>
                        <p className="text-sm font-bold">{analysis.marketAnalysis.marketRanking}</p>
                      </div>
                    )}
                  </div>

                  {analysis.marketAnalysis.targetMarket && analysis.marketAnalysis.targetMarket !== 'N/A' && (
                    <>
                      <Separator />
                      <div className="p-3 border rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground font-medium mb-2">Competitive Positioning</p>
                        <p className="text-sm">{analysis.marketAnalysis.targetMarket}</p>
                      </div>
                    </>
                  )}

                  {analysis.marketAnalysis.competitiveAdvantages && 
                    analysis.marketAnalysis.competitiveAdvantages.length > 0 && 
                    analysis.marketAnalysis.competitiveAdvantages[0] !== 'N/A' && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-semibold mb-2">Competitive Advantages</p>
                        <ul className="space-y-2">
                          {analysis.marketAnalysis.competitiveAdvantages.map((advantage: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                              <span>{advantage}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  {analysis.marketAnalysis.marketTrends && 
                    analysis.marketAnalysis.marketTrends.length > 0 && 
                    analysis.marketAnalysis.marketTrends[0] !== 'N/A' && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-semibold mb-2">Market Trends</p>
                        <div className="space-y-2">
                          {analysis.marketAnalysis.marketTrends.map((trend: string, index: number) => (
                            <div key={index} className="p-2 border-l-2 border-primary pl-3 text-sm bg-muted/30 rounded-r">
                              {trend}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Globe className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No market position data available</p>
                  <p className="text-xs text-muted-foreground mt-1">Market analysis information has not been collected yet</p>
                </div>
              )}
            </CardContent>
          </details>
        </Card>
      )}

      {/* Competitive Analysis */}
      {analysis.competitorInfo && (
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                <span className="font-semibold">
                  Competitive Analysis
                </span>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="space-y-4 pt-4">
              {/* Top Competitors Section */}
              {analysis.competitorInfo.mainCompetitors && 
                analysis.competitorInfo.mainCompetitors.length > 0 && 
                analysis.competitorInfo.mainCompetitors[0] !== 'N/A' ? (
                <>
                  <div>
                    <p className="text-sm font-semibold mb-3">Top Competitors</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {analysis.competitorInfo.mainCompetitors.map((competitor: string, index: number) => (
                        <div key={index} className="p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                          <p className="text-sm font-semibold">{competitor}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths and Weaknesses */}
                  {(analysis.competitorInfo.strengths || analysis.competitorInfo.weaknesses) && (
                    <>
                      <Separator />
                      <div className="grid md:grid-cols-2 gap-4">
                        {analysis.competitorInfo.strengths && analysis.competitorInfo.strengths.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-3 text-green-600">Our Strengths</p>
                            <ul className="space-y-2">
                              {analysis.competitorInfo.strengths.map((strength: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {analysis.competitorInfo.weaknesses && analysis.competitorInfo.weaknesses.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-3 text-red-600">Our Weaknesses</p>
                            <ul className="space-y-2">
                              {analysis.competitorInfo.weaknesses.map((weakness: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                                  <span>{weakness}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Overall Market Standing */}
                  {analysis.competitorInfo.competitivePosition && analysis.competitorInfo.competitivePosition !== 'N/A' && (
                    <>
                      <Separator />
                      <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                        <p className="text-sm font-semibold mb-2 text-primary">Overall Market Standing</p>
                        <p className="text-sm">{analysis.competitorInfo.competitivePosition}</p>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <PieChartIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No competitor analysis available</p>
                  <p className="text-xs text-muted-foreground mt-1">Competitive landscape data has not been analyzed yet</p>
                </div>
              )}
            </CardContent>
          </details>
        </Card>
      )}

      {/* Product Launches - Separate Section */}
      {recentDevelopments && recentDevelopments.productLaunches && recentDevelopments.productLaunches.length > 0 && recentDevelopments.productLaunches[0] !== 'N/A' && (
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">Product Launches</span>
                <Badge variant="outline" className="text-xs ml-2 bg-blue-50 text-blue-600 border-blue-200">
                  {recentDevelopments.productLaunches?.length || 0} launches
                </Badge>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentDevelopments.productLaunches.map((launch: string, index: number) => (
                  <div key={index} className="p-3 border-l-4 border-blue-500 pl-4 bg-gradient-to-r from-blue-50/80 to-transparent dark:from-blue-900/20 rounded-r-lg hover:from-blue-100/80 dark:hover:from-blue-900/30 transition-colors">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{launch}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </details>
        </Card>
      )}

      {/* Recent Developments */}
      {recentDevelopments && recentDevelopments.allNews && recentDevelopments.allNews.length > 0 && (
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                <span className="font-semibold">
                  Recent Developments
                </span>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="space-y-4 pt-4">
              {/* All News */}
              {recentDevelopments.allNews.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-3">Recent News</p>
                  <div className="space-y-2">
                    {recentDevelopments.allNews.slice(0, 5).map((news: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold">{news.title}</p>
                          <Badge variant={
                            news.sentiment === 'positive' ? 'default' : 
                            news.sentiment === 'negative' ? 'destructive' : 
                            'secondary'
                          } className="text-xs shrink-0">
                            {news.sentiment}
                          </Badge>
                        </div>
                        {news.date && news.date !== 'N/A' && (
                          <p className="text-xs text-muted-foreground mt-1">{news.date}</p>
                        )}
                        {news.summary && news.summary !== 'N/A' && (
                          <p className="text-xs mt-2">{news.summary}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Partnerships */}
              {recentDevelopments.partnerships && recentDevelopments.partnerships.length > 0 && recentDevelopments.partnerships[0] !== 'N/A' && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Network className="h-4 w-4 text-purple-600" />
                    Partnerships
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentDevelopments.partnerships.map((partnership: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {partnership}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Awards */}
              {recentDevelopments.awards && recentDevelopments.awards.length > 0 && recentDevelopments.awards[0] !== 'N/A' && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-600" />
                    Awards & Recognition
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentDevelopments.awards.map((award: string, index: number) => (
                      <Badge key={index} variant="default" className="text-xs bg-gradient-to-r from-yellow-600 to-orange-600">
                        {award}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </details>
        </Card>
      )}

      {/* Risk Assessment */}
      {(analysis.riskAssessment?.overallRiskLevel || analysisData.analysis?.riskLevel) && (
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Risk Assessment</span>
                <Badge variant="outline" className="text-xs ml-2">
                  {analysis.riskAssessment?.overallRiskLevel || analysisData.analysis?.riskLevel}
                </Badge>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="space-y-4 pt-4">
              {/* Categorized Risks */}
              {analysis.riskAssessment && (
                <>
                  <div className="space-y-3">
                    {/* Market Risks */}
                    {analysis.riskAssessment?.marketRisks && 
                      analysis.riskAssessment.marketRisks.length > 0 && 
                      analysis.riskAssessment.marketRisks[0] !== 'N/A' && (
                      <div>
                        <p className="text-xs font-semibold mb-2 text-muted-foreground">Market Risks</p>
                        <ul className="space-y-1.5">
                          {analysis.riskAssessment.marketRisks.map((risk: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Financial Risks */}
                    {analysis.riskAssessment?.financialRisks && 
                      analysis.riskAssessment.financialRisks.length > 0 && 
                      analysis.riskAssessment.financialRisks[0] !== 'N/A' && (
                      <div>
                        <p className="text-xs font-semibold mb-2 text-muted-foreground">Financial Risks</p>
                        <ul className="space-y-1.5">
                          {analysis.riskAssessment.financialRisks.map((risk: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Competitive Risks */}
                    {analysis.riskAssessment?.competitiveRisks && 
                      analysis.riskAssessment.competitiveRisks.length > 0 && 
                      analysis.riskAssessment.competitiveRisks[0] !== 'N/A' && (
                      <div>
                        <p className="text-sm font-semibold mb-2 text-red-600">Competitive Risks</p>
                        <ul className="space-y-1">
                          {analysis.riskAssessment.competitiveRisks.map((risk: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <div className="w-1 h-1 rounded-full bg-red-600 shrink-0 mt-1.5" />
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Operational Risks */}
                    {analysis.riskAssessment?.operationalRisks && 
                      analysis.riskAssessment.operationalRisks.length > 0 && 
                      analysis.riskAssessment.operationalRisks[0] !== 'N/A' && (
                      <div>
                        <p className="text-xs font-semibold mb-2 text-muted-foreground">Operational Risks</p>
                        <ul className="space-y-1.5">
                          {analysis.riskAssessment.operationalRisks.map((risk: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Regulatory Risks */}
                    {analysis.riskAssessment?.regulatoryRisks && 
                      analysis.riskAssessment.regulatoryRisks.length > 0 && 
                      analysis.riskAssessment.regulatoryRisks[0] !== 'N/A' && (
                      <div>
                        <p className="text-xs font-semibold mb-2 text-muted-foreground">Regulatory Risks</p>
                        <ul className="space-y-1.5">
                          {analysis.riskAssessment.regulatoryRisks.map((risk: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              {/* Mitigation Strategies */}
              {analysis.riskAssessment?.mitigationStrategies && 
                analysis.riskAssessment.mitigationStrategies.length > 0 && 
                analysis.riskAssessment.mitigationStrategies[0] !== 'N/A' && (  
                  <div>
                    <p className="text-xs font-semibold mb-2 text-muted-foreground">Mitigation Strategies</p>
                    <ul className="space-y-1.5">
                      {analysis.riskAssessment.mitigationStrategies.map((strategy: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
              )}

              {/* Overall Risk Summary */}
              {(analysis.riskAssessment || analysis.riskAssessment?.mitigationStrategies) && <Separator />}
              
              <div className="p-4 border rounded-lg bg-muted/30">
                <p className="text-sm font-semibold mb-2">
                  Risk Level: {analysis.riskAssessment?.overallRiskLevel || analysisData.analysis?.riskLevel}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {analysis.riskAssessment?.riskSummary || 
                   analysis.riskAssessment?.overallRiskExplanation || 
                   analysisData.analysis?.recommendation?.reasoning ||
                   'Risk assessment based on comprehensive analysis of market, financial, operational, and competitive factors.'}
                </p>
              </div>
            </CardContent>
          </details>
        </Card>
      )}      

      {/* IPO Analysis */}
      {ipoAnalysis && ipoAnalysis.ipoPotential && ipoAnalysis.ipoPotential !== 'N/A' && (
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <TrendingUpDown className="h-5 w-5" />
                <span className="font-semibold">
                  IPO Analysis
                </span>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="space-y-4 pt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">IPO Potential</p>
                  <Badge variant={
                    ipoAnalysis.ipoPotential === 'High' ? 'default' : 
                    ipoAnalysis.ipoPotential === 'Medium' ? 'secondary' : 
                    'outline'
                  } className="mt-1">
                    {ipoAnalysis.ipoPotential}
                  </Badge>
                </div>
                {ipoAnalysis.estimatedTimeline && ipoAnalysis.estimatedTimeline !== 'N/A' && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium">Estimated Timeline</p>
                    <p className="text-sm font-semibold mt-1">{ipoAnalysis.estimatedTimeline}</p>
                  </div>
                )}
              </div>

              {ipoAnalysis.ipoReadiness && ipoAnalysis.ipoReadiness !== 'N/A' && (
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium mb-2">IPO Readiness</p>
                  <p className="text-sm">{ipoAnalysis.ipoReadiness}</p>
                </div>
              )}

              {ipoAnalysis.marketConditions && ipoAnalysis.marketConditions !== 'N/A' && (
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium mb-2">Market Conditions</p>
                  <p className="text-sm">{ipoAnalysis.marketConditions}</p>
                </div>
              )}

              {ipoAnalysis.comparableIPOs && ipoAnalysis.comparableIPOs.length > 0 && ipoAnalysis.comparableIPOs[0] !== 'N/A' && (
                <div>
                  <p className="text-sm font-semibold mb-2">Comparable IPOs</p>
                  <div className="flex flex-wrap gap-2">
                    {ipoAnalysis.comparableIPOs.map((ipo: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {ipo}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {ipoAnalysis.estimatedValuation && ipoAnalysis.estimatedValuation !== 'N/A' && (
                <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Estimated IPO Valuation</p>
                  <p className="text-lg font-bold mt-1">{ipoAnalysis.estimatedValuation}</p>
                </div>
              )}
            </CardContent>
          </details>
        </Card>
      )}

      {/* Employee Satisfaction */}
      {employeeSatisfaction && (employeeSatisfaction.pros?.length > 0 || employeeSatisfaction.cons?.length > 0 || employeeSatisfaction.glassdoorRating) && (
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="font-semibold">
                  Employee Satisfaction
                </span>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="space-y-4 pt-4">
              <div className="grid md:grid-cols-3 gap-4">
                {employeeSatisfaction.glassdoorRating && employeeSatisfaction.glassdoorRating !== 'N/A' && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium">Glassdoor Rating</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <p className="text-lg font-bold">{employeeSatisfaction.glassdoorRating}</p>
                    </div>
                  </div>
                )}
                {employeeSatisfaction.leadershipRating && employeeSatisfaction.leadershipRating !== 'N/A' && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium">Leadership Rating</p>
                    <p className="text-lg font-bold mt-1">{employeeSatisfaction.leadershipRating}</p>
                  </div>
                )}
                {employeeSatisfaction.workCulture && employeeSatisfaction.workCulture !== 'N/A' && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium">Work Culture</p>
                    <p className="text-sm mt-1">{employeeSatisfaction.workCulture}</p>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {employeeSatisfaction.pros && employeeSatisfaction.pros.length > 0 && employeeSatisfaction.pros[0] !== 'N/A' && (
                  <div>
                    <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                      Pros
                    </p>
                    <div className="space-y-2">
                      {employeeSatisfaction.pros.map((pro: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-2 border rounded-lg border-green-200 dark:border-green-800">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-xs">{pro}</span>
                  </div>
                      ))}
                </div>
                  </div>
                )}

                {employeeSatisfaction.cons && employeeSatisfaction.cons.length > 0 && employeeSatisfaction.cons[0] !== 'N/A' && (
                  <div>
                    <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                      Cons
                    </p>
                    <div className="space-y-2">
                      {employeeSatisfaction.cons.map((con: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-2 border rounded-lg border-red-200 dark:border-red-800">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <span className="text-xs">{con}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </details>
        </Card>
      )}

      {/* Customer Feedback */}
      {customerFeedback && (customerFeedback.positiveReviews?.length > 0 || customerFeedback.negativeReviews?.length > 0 || customerFeedback.npsScore) && (
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <span className="font-semibold">
                  Customer Feedback
                </span>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="space-y-4 pt-4">
                <div className="grid md:grid-cols-3 gap-4">
                {customerFeedback.npsScore && customerFeedback.npsScore !== 'N/A' && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium">NPS Score</p>
                    <p className="text-lg font-bold mt-1">{customerFeedback.npsScore}</p>
                  </div>
                )}
                {customerFeedback.customerSatisfaction && customerFeedback.customerSatisfaction !== 'N/A' && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium">Overall Satisfaction</p>
                    <p className="text-sm font-semibold mt-1">{customerFeedback.customerSatisfaction}</p>
                  </div>
                )}
                {customerFeedback.customerRetention && customerFeedback.customerRetention !== 'N/A' && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium">Customer Retention</p>
                    <p className="text-sm font-bold mt-1">{customerFeedback.customerRetention}</p>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {customerFeedback.positiveReviews && customerFeedback.positiveReviews.length > 0 && customerFeedback.positiveReviews[0] !== 'N/A' && (
                  <div>
                    <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                      Positive Reviews
                    </p>
                    <div className="space-y-2">
                      {customerFeedback.positiveReviews.map((review: string, index: number) => (
                        <div key={index} className="p-2 border rounded-lg border-green-200 dark:border-green-800">
                          <p className="text-xs">{review}</p>
                  </div>
                      ))}
                    </div>
                  </div>
                )}

                {customerFeedback.negativeReviews && customerFeedback.negativeReviews.length > 0 && customerFeedback.negativeReviews[0] !== 'N/A' && (
                  <div>
                    <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                      Negative Reviews
                    </p>
                    <div className="space-y-2">
                      {customerFeedback.negativeReviews.map((review: string, index: number) => (
                        <div key={index} className="p-2 border rounded-lg border-red-200 dark:border-red-800">
                          <p className="text-xs">{review}</p>
                  </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {customerFeedback.commonComplaints && customerFeedback.commonComplaints.length > 0 && customerFeedback.commonComplaints[0] !== 'N/A' && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold mb-2">Common Complaints</p>
                  <div className="space-y-2">
                    {customerFeedback.commonComplaints.map((complaint: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 p-2 border rounded-lg">
                        <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">{complaint}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </details>
        </Card>
      )}
    </>
  );
}
