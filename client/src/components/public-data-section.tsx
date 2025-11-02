import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, DollarSign, Users, AlertTriangle, Globe, 
  CheckCircle2, XCircle, Building2, Target, Briefcase, Search, Database, ExternalLink, FileText, Clock, RefreshCcw, ChevronDown, ChevronUp,
  BarChart3, Activity, Zap, Calendar, Newspaper, LineChart as LineChartIcon, PieChart as PieChartIcon, Star, Info, AlertCircle, Loader2
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, Area, AreaChart 
} from 'recharts';

interface PublicDataSectionProps {
  publicData: any;
  documentData: any;
  status?: 'loading' | 'failed' | 'success';
  onRefresh?: () => void;
  isRefreshing?: boolean;
  sectionLoadingStates?: Record<string, boolean>;
  onLoadSection?: (sectionKey: string) => void;
}

export function PublicDataSection({ 
  publicData, 
  documentData, 
  status = 'loading',
  onRefresh,
  isRefreshing,
  sectionLoadingStates = {},
  onLoadSection
}: PublicDataSectionProps) {
  
  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Filter out null/undefined values
      const validPayload = payload.filter((entry: any) => entry.value !== null && entry.value !== undefined);
      
      if (validPayload.length === 0) {
        return null;
      }
      
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
          <p className="text-sm font-semibold mb-2 text-foreground">{label}</p>
          {validPayload.map((entry: any, index: number) => {
            // Format the value appropriately
            let displayValue = entry.value;
            if (typeof entry.value === 'number') {
              // Check if it's an employee count (usually smaller numbers or has "Employees" in name)
              if (entry.name?.toLowerCase().includes('employee')) {
                displayValue = entry.value.toLocaleString();
              } else {
                // For revenue, funding, valuation, etc.
                displayValue = formatNumber(entry.value);
              }
            }
            
            return (
              <div key={index} className="flex items-center justify-between gap-3 mb-1 last:mb-0">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
                <span className="text-xs font-semibold text-foreground">{displayValue}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };
  
  // Handle failed state
  if (status === 'failed' || (publicData === null && status !== 'loading')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Public Source Research Failed
          </CardTitle>
          <CardDescription>
            Unable to fetch public data. This may be due to API limitations or network issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Retrying...' : 'Retry'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Handle loading state
  if (!publicData || status === 'loading') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 animate-pulse" />
            Researching Public Sources...
          </CardTitle>
          <CardDescription>
            Gathering data from Crunchbase, TechCrunch, LinkedIn, and other sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Extract data from synthesizedInsights.data
  // Handle both nested structure (synthesizedInsights.data) and flat structure (direct keys)
  const data = publicData?.synthesizedInsights?.data || publicData?.synthesizedInsights || {};
  
  // Extract each section with proper fallback
  const companyOverview = data?.company_overview || {};
  const corporateStructure = data?.corporate_structure || {};
  const employeeMetrics = data?.employee_metrics || {};
  const fundingHistory = data?.funding_history || {};
  const financialHealth = data?.financial_health || {};
  const marketPosition = data?.market_position || {};
  const competitorAnalysis = data?.competitor_analysis || {};
  const recentDevelopments = data?.recent_news_developments || [];
  const growthTrajectory = data?.growth_trajectory || {};
  const riskRationale = data?.risk_and_investment_rationale || {};
  const ipoAnalysis = data?.ipo_potential || {};
  const employeeSatisfaction = data?.employee_satisfaction || {};
  const customerFeedback = data?.customer_feedback || {};
  const informationGaps = data?.information_gaps || [];
  const sources = publicData?.sources || [];
  const metadata = publicData?.metadata || data?.metadata || {};

  // Chart colors
  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  // Format large numbers properly (e.g., $10B instead of $10000.0M)
  const formatNumber = (num: number, currency = true): string => {
    if (!num && num !== 0) return 'N/A';

    if(typeof num !== 'number') return num
    
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

  // Team and Leadership data
  const teamData = data.team_and_leadership || {};
  const currentFounders = companyOverview.current_cofounders || companyOverview.founders || [];
  // Fix: Ensure we check employee_metrics first, then fall back to teamData
  const companySize = (employeeMetrics?.current_employees?.value != null) 
    ? employeeMetrics.current_employees.value 
    : (teamData?.team_size != null ? teamData.team_size : 'N/A');

  // Helper to check if a section has data
  const hasSectionData = (sectionKey: string) => {
    const data = publicData.synthesizedInsights?.data || publicData.synthesizedInsights || {};
    return data[sectionKey] && Object.keys(data[sectionKey]).length > 0;
  };

  // Helper to check if a section is loading
  const isSectionLoading = (sectionKey: string) => {
    return sectionLoadingStates[sectionKey] || false;
  };

  return (
    <div className="space-y-6">
      {/* Company Overview */}
      <Card>
        <details className="group">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <span className="font-semibold">Company Overview</span>
              {isSectionLoading('company_overview') && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              {!hasSectionData('company_overview') && !isSectionLoading('company_overview') && onLoadSection && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLoadSection('company_overview');
                  }}
                  className="h-6 text-xs"
                >
                  Load
                </Button>
              )}
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {companyOverview.sector && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Sector</p>
                  <p className="text-sm font-semibold mt-1">{companyOverview.sector}</p>
                </div>
              )}
              {companyOverview.industry && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Industry</p>
                  <p className="text-sm font-semibold mt-1">{companyOverview.industry}</p>
                </div>
              )}
              {companyOverview.founded_date && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Founded</p>
                  <p className="text-sm font-semibold mt-1">{companyOverview.founded_date}</p>
                </div>
              )}
              {companyOverview.headquarters && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Headquarters</p>
                  <p className="text-sm font-semibold mt-1">
                    {companyOverview.headquarters.city}, {companyOverview.headquarters.country}
                  </p>
                </div>
              )}
              </div>

            {companyOverview.founders && companyOverview.founders.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">Founders</p>
                  <div className="flex flex-wrap gap-2">
                    {companyOverview.founders.map((founder: any, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {founder.name} {founder.role && `- ${founder.role}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {companyOverview.description && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">Description</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{companyOverview.description}</p>
                </div>
              </>
            )}
            
            {companyOverview.current_ceo && companyOverview.current_ceo.name && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Current CEO</p>
                  <p className="text-sm font-semibold mt-1">
                    {companyOverview.current_ceo.name}
                    {companyOverview.current_ceo.since && ` (Since ${companyOverview.current_ceo.since})`}
                  </p>
                </div>
              </>
            )}
            </CardContent>
        </details>
          </Card>

      {/* Corporate Structure */}
      <Card>
        <details className="group">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              <span className="font-semibold">Corporate Structure</span>
              {isSectionLoading('corporate_structure') && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              {!hasSectionData('corporate_structure') && !isSectionLoading('corporate_structure') && onLoadSection && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLoadSection('corporate_structure');
                  }}
                  className="h-6 text-xs"
                >
                  Load
                </Button>
              )}
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <CardContent className="space-y-4 pt-4">
            {corporateStructure && (corporateStructure.mergers?.length > 0 || corporateStructure.acquisitions?.length > 0 || corporateStructure.parent_company || (recentDevelopments && !Array.isArray(recentDevelopments) && recentDevelopments.partnerships?.length > 0)) ? (
              <>
              {corporateStructure.parent_company && (
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Parent Company</p>
                  <p className="text-sm font-semibold">{corporateStructure.parent_company}</p>
                </div>
              )}

              {corporateStructure.subsidiaries && corporateStructure.subsidiaries.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Subsidiaries</p>
                  <div className="flex flex-wrap gap-2">
                    {corporateStructure.subsidiaries.map((sub: any, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {sub.name || sub} {sub.since && `(${sub.since})`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {recentDevelopments && !Array.isArray(recentDevelopments) && recentDevelopments.partnerships && recentDevelopments.partnerships.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">Partnerships</p>
                    <div className="space-y-2">
                      {recentDevelopments.partnerships.map((item: any, i: number) => (
                        <div key={i} className="p-3 border-l-4 border-green-500 pl-3 bg-green-50/50 dark:bg-green-900/10 rounded-r hover:bg-green-100/50 dark:hover:bg-green-900/20 transition-colors">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.date}</p>
                          {item.summary && (
                            <p className="text-xs text-muted-foreground mt-1">{item.summary}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {corporateStructure.mergers && corporateStructure.mergers.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">Mergers</p>
                    <div className="space-y-2">
                      {corporateStructure.mergers.map((merger: any, i: number) => (
                        <div key={i} className="p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-semibold">{merger.company}</p>
                              <p className="text-xs text-muted-foreground">{merger.date}</p>
                            </div>
                            {merger.amount_usd && (
                              <Badge variant="outline" className="text-xs">
                                {formatNumber(merger.amount_usd)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {corporateStructure.acquisitions && corporateStructure.acquisitions.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">Acquisitions</p>
                    <div className="space-y-2">
                      {corporateStructure.acquisitions.map((acq: any, i: number) => (
                        <div key={i} className="p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-semibold">{acq.company}</p>
                              <p className="text-xs text-muted-foreground">{acq.date}</p>
                            </div>
                            {acq.amount_usd && (
                              <Badge variant="outline" className="text-xs">
                                {formatNumber(acq.amount_usd)}
                              </Badge>
                            )}
                          </div>
                          {acq.rationale && (
                            <p className="text-xs text-muted-foreground mt-1">{acq.rationale}</p>
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
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No corporate structure data available</p>
                <p className="text-xs text-muted-foreground mt-1">Information about mergers, acquisitions, and corporate relationships not available</p>
              </div>
            )}
          </CardContent>
        </details>
      </Card>

      {/* Team & Leadership */}
      <Card>
        <details className="group" open>
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="font-semibold">Team & Leadership</span>
              {isSectionLoading('employee_metrics') && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              {!hasSectionData('employee_metrics') && !isSectionLoading('employee_metrics') && onLoadSection && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLoadSection('employee_metrics');
                  }}
                  className="h-6 text-xs"
                >
                  Load
                </Button>
              )}
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <CardContent className="space-y-4 pt-4">
            {/* Company Size and Growth */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                <p className="text-xs text-muted-foreground font-medium">Company Size</p>
                <p className="text-2xl font-bold mt-1">{typeof companySize === 'number' ? companySize.toLocaleString() : companySize} employees</p>
                {employeeMetrics.current_employees?.as_of && (
                  <p className="text-xs text-muted-foreground mt-1">As of {employeeMetrics.current_employees.as_of}</p>
                )}
              </div>
              
              {employeeMetrics.employee_growth_rate_pct && (
                <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                  <p className="text-xs text-muted-foreground font-medium">Growth Rate</p>
                  <p className="text-2xl font-bold mt-1">{employeeMetrics.employee_growth_rate_pct}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Year-over-year</p>
                </div>
              )}
              
              {employeeMetrics.hiring_trend && (
                <div className="p-4 border rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground font-medium">Hiring Trend</p>
                  <p className="text-sm font-semibold mt-1">{employeeMetrics.hiring_trend}</p>
                </div>
              )}
            </div>

            {/* Current Founders */}
            {currentFounders && currentFounders.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold mb-3">Current Founders</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {currentFounders.map((founder: any, i: number) => (
                      <div key={i} className="p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-semibold">{founder.name || founder}</p>
                        </div>
                        {founder.role && (
                          <p className="text-xs text-muted-foreground">{founder.role}</p>
                        )}
                        {founder.background_short && (
                          <p className="text-xs text-muted-foreground mt-1">{founder.background_short}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Key Executives (if available) */}
            {teamData.key_executives && teamData.key_executives.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold mb-3">Key Executives</p>
                  <div className="space-y-2">
                    {teamData.key_executives.slice(0, 5).map((exec: any, i: number) => (
                      <div key={i} className="p-2 border rounded flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{exec.name}</p>
                          <p className="text-xs text-muted-foreground">{exec.title || exec.role}</p>
                        </div>
                        {exec.joined_year && (
                          <Badge variant="outline" className="text-xs">Since {exec.joined_year}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Employee Growth History Chart */}
            {employeeMetrics.employee_history && employeeMetrics.employee_history.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold mb-3">Employee Growth History</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[...employeeMetrics.employee_history].sort((a: any, b: any) => {
                        const yearA = parseInt(a.year) || 0;
                        const yearB = parseInt(b.year) || 0;
                        return yearA - yearB;
                      })}>
                        <defs>
                          <linearGradient id="colorEmployeeGrowth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="year" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(value) => value.toLocaleString()} />
                        <RechartsTooltip 
                          content={<CustomTooltip />}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="employees" 
                          stroke="#3b82f6" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#colorEmployeeGrowth)" 
                          name="Employees" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Employee History Data Points */}
                  <div className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[...employeeMetrics.employee_history]
                        .sort((a: any, b: any) => {
                          const yearA = parseInt(a.year) || 0;
                          const yearB = parseInt(b.year) || 0;
                          return yearB - yearA; // Descending order for display
                        })
                        .map((item: any, i: number) => (
                          <div key={i} className="p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                            <p className="text-xs text-muted-foreground">{item.year}</p>
                            <p className="text-lg font-bold">{item.employees.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">employees</p>
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

      {/* Funding History */}
      <Card>
        <details className="group">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <span className="font-semibold">Funding History</span>
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <CardContent className="space-y-4 pt-4">
            {fundingHistory && fundingHistory.rounds && fundingHistory.rounds.length > 0 ? (
              <>
              {fundingHistory.total_funding_usd && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Total Funding</p>
                    <p className="text-sm font-bold">{formatNumber(fundingHistory.total_funding_usd)}</p>
                  </div>
                  {(fundingHistory.current_valuation_usd?.value || fundingHistory.current_valuation_usd) && (
                    <div className="p-3 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Current Valuation</p>
                      <p className="text-sm font-bold">
                        {formatNumber(fundingHistory.current_valuation_usd?.value || fundingHistory.current_valuation_usd)}
                      </p>
                      {fundingHistory.current_valuation_usd?.as_of && (
                        <p className="text-xs text-muted-foreground mt-1">
                          As of {fundingHistory.current_valuation_usd.as_of}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="p-3 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Funding Rounds</p>
                    <p className="text-sm font-bold">{fundingHistory.rounds.length}</p>
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-sm font-semibold mb-3">Funding Rounds Chart</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[...fundingHistory.rounds].sort((a: any, b: any) => {
                      const dateA = new Date(a.date).getTime();
                      const dateB = new Date(b.date).getTime();
                      return dateA - dateB;
                    })}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="round_type" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(value) => formatNumber(value)} />
                      <RechartsTooltip 
                        content={<CustomTooltip />}
                        labelFormatter={(label) => `Round: ${label}`}
                      />
                      <Bar dataKey="amount_usd" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Amount" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-semibold mb-3">Round Details</p>
                <div className="space-y-2">
                  {[...fundingHistory.rounds].sort((a: any, b: any) => {
                    // Sort by date in ascending order (oldest first)
                    const dateA = new Date(a.date).getTime();
                    const dateB = new Date(b.date).getTime();
                    return dateA - dateB;
                  }).map((round: any, i: number) => (
                    <div key={i} className="p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{round.round_type}</p>
                          <p className="text-xs text-muted-foreground">{round.date}</p>
                          {(round.valuation_post_usd || round.valuation_pre_usd) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Valuation: {formatNumber(round.valuation_post_usd || round.valuation_pre_usd)}
                              {round.valuation_post_usd ? ' (post-money)' : ' (pre-money)'}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {formatNumber(round.amount_usd)}
                        </Badge>
                      </div>
                      {round.lead_investors && round.lead_investors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Lead Investors:</p>
                          <div className="flex flex-wrap gap-1">
                            {round.lead_investors.map((investor: string, j: number) => (
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

              {/* Valuation Chart over funding rounds */}
              {fundingHistory.rounds.some((r: any) => r.valuation_post_usd || r.valuation_pre_usd) && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">Valuation Growth</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[...fundingHistory.rounds]
                          .filter((r: any) => r.valuation_post_usd || r.valuation_pre_usd)
                          .sort((a: any, b: any) => {
                            const dateA = new Date(a.date).getTime();
                            const dateB = new Date(b.date).getTime();
                            return dateA - dateB;
                          })}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="round_type" className="text-xs" />
                          <YAxis className="text-xs" tickFormatter={(value) => formatNumber(value)} />
                          <RechartsTooltip 
                            content={<CustomTooltip />}
                            labelFormatter={(label) => `Round: ${label}`}
                          />
                          <Line 
                            type="monotone" 
                            dataKey={(data: any) => data.valuation_post_usd || data.valuation_pre_usd} 
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

      {/* Financial Health & Revenue */}
      <Card>
        <details className="group">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <span className="font-semibold">Financial Health & Revenue</span>
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <CardContent className="space-y-4 pt-4">
            {financialHealth && (financialHealth.annual_revenue || financialHealth.revenue_history) ? (
              <>
              {financialHealth.annual_revenue && financialHealth.annual_revenue.value_usd && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Annual Revenue</p>
                    <p className="text-sm font-bold">{formatNumber(financialHealth.annual_revenue.value_usd)}</p>
                    {financialHealth.annual_revenue.latest_year && (
                      <p className="text-xs text-muted-foreground mt-1">{financialHealth.annual_revenue.latest_year}</p>
                    )}
                  </div>
                  {/* {financialHealth.key_metrics?.ARR_usd?.value !== null && (
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground font-medium mb-1">ARR</p>
                      <p className="text-sm font-bold">{formatNumber(financialHealth.key_metrics.ARR_usd.value)}</p>
                    </div>
                  )} */}
                  {financialHealth.key_metrics?.MRR_usd?.value != null && (
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground font-medium mb-1">MRR</p>
                      <p className="text-sm font-bold">{formatNumber(financialHealth.key_metrics?.MRR_usd?.value)}</p>
                    </div>
                  )}
                  {financialHealth.revenue_growth_rate_pct?.value != null && (
                    <div className="p-3 border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Growth Rate</p>
                      <p className="text-sm font-bold">{financialHealth.revenue_growth_rate_pct?.value}%</p>
                    </div>
                  )}
                  {financialHealth.key_metrics?.CAC_usd?.value != null && (
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground font-medium mb-1">CAC</p>
                      <p className="text-sm font-bold">{formatNumber(financialHealth.key_metrics?.CAC_usd?.value)}</p>
                    </div>
                  )}
                  {financialHealth.key_metrics?.LTV_usd?.value != null && (
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground font-medium mb-1">LTV</p>
                      <p className="text-sm font-bold">{formatNumber(financialHealth.key_metrics?.LTV_usd?.value)}</p>
                    </div>
                  )}
                  {financialHealth.burn_rate_monthly_usd?.value && (
                    <div className="p-3 border rounded-lg bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Monthly Burn Rate</p>
                      <p className="text-sm font-bold">{formatNumber(financialHealth.burn_rate_monthly_usd.value)}</p>
                      {financialHealth.burn_rate_monthly_usd.as_of && (
                        <p className="text-xs text-muted-foreground mt-1">{financialHealth.burn_rate_monthly_usd.as_of}</p>
                      )}
                    </div>
                  )}
                  {financialHealth.cash_runway_months?.value && (
                    <div className="p-3 border rounded-lg bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Cash Runway</p>
                      <p className="text-sm font-bold">{financialHealth.cash_runway_months.value} months</p>
                      {financialHealth.cash_runway_months.as_of && (
                        <p className="text-xs text-muted-foreground mt-1">{financialHealth.cash_runway_months.as_of}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {financialHealth.profitability && (
                <>
                  <Separator />
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <p className="text-sm font-semibold mb-3">Profitability Status</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {financialHealth.profitability.status && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Status</p>
                          <Badge variant={financialHealth.profitability.status === 'profitable' ? 'default' : 'secondary'}>
                            {financialHealth.profitability.status}
                          </Badge>
                        </div>
                      )}
                      {financialHealth.profitability.ebitda_usd && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">EBITDA</p>
                          <p className="text-sm font-semibold">{formatNumber(financialHealth.profitability.ebitda_usd)}</p>
                        </div>
                      )}
                      {financialHealth.profitability.pat_usd && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">PAT</p>
                          <p className="text-sm font-semibold">{formatNumber(financialHealth.profitability.pat_usd)}</p>
                        </div>
                      )}
                      {financialHealth.profitability.latest_year && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Latest Year</p>
                          <p className="text-sm font-semibold">{financialHealth.profitability.latest_year}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {financialHealth.revenue_history && financialHealth.revenue_history.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">Revenue Growth Chart</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[...financialHealth.revenue_history].sort((a: any, b: any) => {
                          const yearA = parseInt(a.year) || 0;
                          const yearB = parseInt(b.year) || 0;
                          return yearA - yearB;
                        })}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="year" className="text-xs" />
                          <YAxis className="text-xs" tickFormatter={(value) => formatNumber(value)} />
                          <RechartsTooltip 
                            content={<CustomTooltip />}
                          />
                          <Area type="monotone" dataKey="value_usd" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Revenue Table */}
                    <details className="mt-4">
                      <summary className="text-sm font-medium cursor-pointer hover:text-blue-600">
                        View Detailed Revenue Table
                      </summary>
                      <div className="border rounded-lg overflow-hidden mt-3">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-muted/50 border-b">
                              <tr>
                                <th className="text-left text-xs font-semibold text-muted-foreground p-2">
                                  Year
                                </th>
                                <th className="text-right text-xs font-semibold text-muted-foreground p-2">
                                  Revenue
                                </th>
                                <th className="text-right text-xs font-semibold text-muted-foreground p-2">
                                  YoY Growth
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {financialHealth.revenueHistory?.map(
                                (item: any, i: number) => {
                                  const currentRevenue =
                                    item.revenue || item.amount;
                                  const previousRevenue =
                                    i > 0
                                      ? financialHealth.revenueHistory[i - 1]
                                          .revenue ||
                                        financialHealth.revenueHistory[i - 1]
                                          .amount
                                      : null;

                                  let growthText = "-";
                                  let growthClass = "text-muted-foreground";

                                  if (previousRevenue && currentRevenue) {
                                    const parseRevenue = (rev: string) => {
                                      const cleaned = rev.replace(
                                        /[^0-9.KMBkmb]/g,
                                        ""
                                      );
                                      let multiplier = 1;
                                      if (/[Kk]/.test(rev)) multiplier = 1000;
                                      else if (/[Mm]/.test(rev))
                                        multiplier = 1000000;
                                      else if (/[Bb]/.test(rev))
                                        multiplier = 1000000000;
                                      const num = parseFloat(cleaned);
                                      return isNaN(num)
                                        ? null
                                        : num * multiplier;
                                    };

                                    const currentNum =
                                      parseRevenue(currentRevenue);
                                    const previousNum =
                                      parseRevenue(previousRevenue);

                                    if (
                                      currentNum != null &&
                                      previousNum != null &&
                                      previousNum !== 0
                                    ) {
                                      const growthPercent =
                                        ((currentNum - previousNum) /
                                          previousNum) *
                                        100;
                                      if (growthPercent > 0.1) {
                                        growthText = `+${growthPercent.toFixed(
                                          0
                                        )}%`;
                                        growthClass =
                                          "text-green-600 font-semibold";
                                      } else if (growthPercent < -0.1) {
                                        growthText = `${growthPercent.toFixed(
                                          0
                                        )}%`;
                                        growthClass =
                                          "text-red-600 font-semibold";
                                      } else {
                                        growthText = "~0%";
                                        growthClass = "text-muted-foreground";
                                      }
                                    }
                                  }

                                  return (
                                    <tr
                                      key={i}
                                      className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                                    >
                                      <td className="text-xs font-medium p-2">
                                        {item.year || item.period}
                                      </td>
                                      <td className="text-sm font-bold text-right p-2">
                                        {currentRevenue}
                                      </td>
                                      <td
                                        className={`text-xs text-right p-2 ${growthClass}`}
                                      >
                                        {growthText}
                                      </td>
                                    </tr>
                                  );
                                }
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </details>
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

      {/* Growth Trajectory */}
      {growthTrajectory && (growthTrajectory.historical_growth || growthTrajectory.projected_growth || growthTrajectory.key_milestones) && (
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <span className="font-semibold">Growth Trajectory</span>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="space-y-4 pt-4">
              {/* Growth Chart from chart_series */}
              {growthTrajectory.chart_series && growthTrajectory.chart_series.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-3">Growth Metrics Over Time</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[...growthTrajectory.chart_series].sort((a: any, b: any) => {
                        const yearA = parseInt(a.year) || 0;
                        const yearB = parseInt(b.year) || 0;
                        return yearA - yearB;
                      })}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="year" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(value) => {
                          if (typeof value === 'number') {
                            return formatNumber(value, false);
                          }
                          return value;
                        }} />
                        <RechartsTooltip 
                          content={<CustomTooltip />}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="employees" 
                          stroke="#3b82f6" 
                          strokeWidth={2} 
                          name="Employees"
                          dot={{ fill: '#3b82f6', r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="revenue_usd" 
                          stroke="#10b981" 
                          strokeWidth={2} 
                          name="Revenue"
                          dot={{ fill: '#10b981', r: 4 }}
                        />
                        {growthTrajectory.chart_series.some((d: any) => d.funding_usd) && (
                          <Line 
                            type="monotone" 
                            dataKey="funding_usd" 
                            stroke="#8b5cf6" 
                            strokeWidth={2} 
                            name="Funding"
                            dot={{ fill: '#8b5cf6', r: 4 }}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Historical & Projected Growth Chart */}
              {(growthTrajectory.historical_growth || growthTrajectory.projected_growth) && (() => {
                // Merge historical and projected data into a single dataset
                const mergedData: any[] = [];
                const periodMap = new Map();

                // Add historical data
                if (growthTrajectory.historical_growth) {
                  growthTrajectory.historical_growth.forEach((item: any) => {
                    periodMap.set(item.period, { 
                      period: item.period, 
                      historical: item.value,
                      projected: null
                    });
                  });
                }

                // Add projected data
                if (growthTrajectory.projected_growth) {
                  growthTrajectory.projected_growth.forEach((item: any) => {
                    if (periodMap.has(item.period)) {
                      periodMap.get(item.period).projected = item.value;
                    } else {
                      periodMap.set(item.period, { 
                        period: item.period, 
                        historical: null,
                        projected: item.value
                      });
                    }
                  });
                }

                // Convert map to sorted array in ASCENDING order (oldest to newest)
                mergedData.push(...Array.from(periodMap.values()).sort((a, b) => {
                  const aYear = parseInt(a.period) || 0;
                  const bYear = parseInt(b.period) || 0;
                  return aYear - bYear; // Ascending order: 2019, 2020, 2021...
                }));

                return (
                  <>
                    {growthTrajectory.chart_series && growthTrajectory.chart_series.length > 0 && <Separator />}
                    <div>
                      <p className="text-sm font-semibold mb-3">Historical & Projected Growth</p>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={mergedData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="period" className="text-xs" />
                            <YAxis className="text-xs" tickFormatter={(value) => {
                              if (typeof value === 'number') {
                                return formatNumber(value, false);
                              }
                              return value;
                            }} />
                            <RechartsTooltip 
                              content={<CustomTooltip />}
                            />
                            <Legend />
                            {/* Historical growth - solid line */}
                            <Line 
                              type="monotone" 
                              dataKey="historical" 
                              stroke="#3b82f6" 
                              strokeWidth={2} 
                              name="Historical" 
                              dot={{ fill: '#3b82f6', r: 4 }}
                              connectNulls={false}
                            />
                            {/* Projected growth - dashed line */}
                            <Line 
                              type="monotone" 
                              dataKey="projected" 
                              stroke="#10b981" 
                              strokeWidth={2} 
                              strokeDasharray="5 5"
                              name="Projected" 
                              dot={{ fill: '#10b981', r: 4 }}
                              connectNulls={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Solid line: Historical | Dashed line: Projected
                      </p>
                    </div>
                  </>
                );
              })()}

              {/* Growth Drivers */}
              {growthTrajectory.growth_drivers && growthTrajectory.growth_drivers.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3 text-green-600">Growth Drivers</p>
                    <ul className="space-y-2">
                      {growthTrajectory.growth_drivers.map((driver: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                          <span>{driver}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Growth Challenges */}
              {growthTrajectory.growth_challenges && growthTrajectory.growth_challenges.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3 text-red-600">Growth Challenges</p>
                    <ul className="space-y-2">
                      {growthTrajectory.growth_challenges.map((challenge: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                          <span>{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Key Milestones - Horizontal Timeline */}
              {growthTrajectory.key_milestones && growthTrajectory.key_milestones.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-4">Key Milestones</p>
                    <div className="relative overflow-x-auto pb-2">
                      <div className="flex items-start gap-3 px-2">
                        {growthTrajectory.key_milestones.map((milestone: any, i: number) => (
                          <div key={i} className="relative flex flex-col items-center max-w-[160px] flex-shrink-0">
                            {/* Timeline dot and line */}
                            <div className="relative w-full flex items-center mb-2">
                              {i > 0 && (
                                <div className="absolute right-1/2 top-1/2 w-full h-0.5 bg-primary/30" style={{ transform: 'translateY(-50%)', right: 'calc(50% + 10px)' }}></div>
                              )}
                              <div className="relative z-10 w-5 h-5 rounded-full bg-primary border-2 border-background mx-auto"></div>
                              {i < growthTrajectory.key_milestones.length - 1 && (
                                <div className="absolute left-1/2 top-1/2 w-full h-0.5 bg-primary/30" style={{ transform: 'translateY(-50%)', left: 'calc(50% + 10px)' }}></div>
                              )}
                            </div>
                            
                            {/* Milestone content */}
                            <div className="text-center">
                              <Badge variant="outline" className="text-xs mb-1.5">{milestone.year}</Badge>
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
      <Card>
        <details className="group">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <span className="font-semibold">Market Position</span>
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <CardContent className="space-y-4 pt-4">
            {marketPosition && (marketPosition.TAM_usd?.value != null || marketPosition.market_share_pct?.value != null || marketPosition.market_ranking?.rank != null || marketPosition.competitive_positioning || marketPosition.competitive_advantages?.length > 0 || marketPosition.market_trends?.length > 0) ? (
              <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {marketPosition.TAM_usd?.value != null && (
                  <div className="p-3 border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                    <p className="text-xs text-muted-foreground font-medium mb-1">TAM</p>
                    <p className="text-sm font-bold">{formatNumber(marketPosition.TAM_usd.value)}</p>
                  </div>
                )}
                {marketPosition?.market_share_pct?.value != null && (
                  <div className="p-3 border rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Market Share</p>
                    <p className="text-sm font-bold">{marketPosition.market_share_pct.value}%</p>
                  </div>
                )}
                {marketPosition?.market_ranking?.rank != null && (
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Ranking</p>
                    <p className="text-sm font-bold">#{marketPosition.market_ranking.rank}</p>
                    {marketPosition.market_ranking.basis && (
                      <p className="text-xs text-muted-foreground">{marketPosition.market_ranking.basis}</p>
                    )}
                  </div>
                )}
              </div>

              {marketPosition.competitive_positioning && (
                <>
                  <Separator />
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-2">Competitive Positioning</p>
                    <p className="text-sm">{marketPosition.competitive_positioning}</p>
                  </div>
                </>
              )}

              {marketPosition.competitive_advantages && marketPosition.competitive_advantages.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-2">Competitive Advantages</p>
                    <ul className="space-y-2">
                      {marketPosition.competitive_advantages.map((adv: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                          <span>{adv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {marketPosition.market_trends && marketPosition.market_trends.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-2">Market Trends</p>
                    <div className="space-y-2">
                      {marketPosition.market_trends.map((trend: string, i: number) => (
                        <div key={i} className="p-2 border-l-2 border-primary pl-3 text-sm bg-muted/30 rounded-r">
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

      {/* Competitor Analysis */}
      <Card>
        <details className="group">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              <span className="font-semibold">Competitive Analysis</span>
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <CardContent className="space-y-4 pt-4">
            {competitorAnalysis && competitorAnalysis.top_competitors && competitorAnalysis.top_competitors.length > 0 ? (
              <>
              <div>
                <p className="text-sm font-semibold mb-3">Top Competitors</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {competitorAnalysis.top_competitors.map((comp: any, i: number) => (
                    <div key={i} className="p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                      <p className="text-sm font-semibold">{comp.name}</p>
                      {comp.market_share_pct && (
                        <p className="text-xs text-muted-foreground mt-1">{comp.market_share_pct}% market share</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {(competitorAnalysis.strengths || competitorAnalysis.weaknesses) && (
                <>
                  <Separator />
                  <div className="grid md:grid-cols-2 gap-4">
                    {competitorAnalysis.strengths && competitorAnalysis.strengths.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-3 text-green-600">Our Strengths</p>
                        <ul className="space-y-2">
                          {competitorAnalysis.strengths.map((strength: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {competitorAnalysis.weaknesses && competitorAnalysis.weaknesses.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-3 text-red-600">Our Weaknesses</p>
                        <ul className="space-y-2">
                          {competitorAnalysis.weaknesses.map((weakness: string, i: number) => (
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

              {competitorAnalysis.overall_standing && (
                <>
                  <Separator />
                  <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                    <p className="text-sm font-semibold mb-2 text-primary">Overall Market Standing</p>
                    <p className="text-sm">{competitorAnalysis.overall_standing}</p>
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

      {/* Product Launches - Separate Section */}
      {recentDevelopments && !Array.isArray(recentDevelopments) && recentDevelopments.product_launches && recentDevelopments.product_launches.length > 0 && (
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">Product Launches</span>
                <Badge variant="outline" className="text-xs ml-2 bg-blue-50 text-blue-600 border-blue-200">
                  {recentDevelopments.product_launches.length} launches
                </Badge>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentDevelopments.product_launches.map((item: any, i: number) => (
                  <div key={i} className="p-3 border-l-4 border-blue-500 pl-4 bg-gradient-to-r from-blue-50/80 to-transparent dark:from-blue-900/20 rounded-r-lg hover:from-blue-100/80 dark:hover:from-blue-900/30 transition-colors">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{item.title || item.product}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{item.date || item.launch_date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </details>
        </Card>
      )}

      {/* Recent Developments */}
      {recentDevelopments && (Array.isArray(recentDevelopments) ? recentDevelopments.length > 0 : Object.keys(recentDevelopments).length > 0) && (
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                <span className="font-semibold">Recent News & Developments</span>
                {Array.isArray(recentDevelopments) && (
                  <Badge variant="outline" className="text-xs ml-2">{recentDevelopments.length} updates</Badge>
                )}
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="space-y-4 pt-4">
              {/* All News (if array) or categorized news (if object) */}
              {Array.isArray(recentDevelopments) ? (
                <div className="space-y-3">
                  {recentDevelopments.slice(0, 10).map((dev: any, i: number) => (
                    <div key={i} className="p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold mb-1">{dev.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{dev.date}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">{dev.type}</Badge>
                          </div>
                        </div>
                      </div>
                      {dev.url && (
                        <a href={dev.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-2">
                          <ExternalLink className="h-3 w-3" />
                          Read more
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Categorized news (excluding product_launches and partnerships which have their own sections) */
                <>
                  {recentDevelopments.awards_recognition && recentDevelopments.awards_recognition.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2 text-yellow-600">🏆 Awards & Recognition</p>
                      <div className="space-y-2">
                        {recentDevelopments.awards_recognition.map((item: any, i: number) => (
                          <div key={i} className="p-2 border-l-4 border-yellow-500 pl-3 bg-yellow-50/50 dark:bg-yellow-900/10 rounded">
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.date}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recentDevelopments.controversies && recentDevelopments.controversies.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2 text-red-600">⚠️ Controversies</p>
                      <div className="space-y-2">
                        {recentDevelopments.controversies.map((item: any, i: number) => (
                          <div key={i} className="p-2 border-l-4 border-red-500 pl-3 bg-red-50/50 dark:bg-red-900/10 rounded">
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.date}</p>
                            {item.summary && <p className="text-xs mt-1">{item.summary}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recentDevelopments.funding_announcements && recentDevelopments.funding_announcements.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2 text-purple-600">💰 Funding Announcements</p>
                      <div className="space-y-2">
                        {recentDevelopments.funding_announcements.map((item: any, i: number) => (
                          <div key={i} className="p-2 border-l-4 border-purple-500 pl-3 bg-purple-50/50 dark:bg-purple-900/10 rounded">
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.date}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recentDevelopments.leadership_changes && recentDevelopments.leadership_changes.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2 text-orange-600">👔 Leadership Changes</p>
                      <div className="space-y-2">
                        {recentDevelopments.leadership_changes.map((item: any, i: number) => (
                          <div key={i} className="p-2 border-l-4 border-orange-500 pl-3 bg-orange-50/50 dark:bg-orange-900/10 rounded">
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.date}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recentDevelopments.market_expansion && recentDevelopments.market_expansion.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2 text-cyan-600">🌍 Market Expansion</p>
                      <div className="space-y-2">
                        {recentDevelopments.market_expansion.map((item: any, i: number) => (
                          <div key={i} className="p-2 border-l-4 border-cyan-500 pl-3 bg-cyan-50/50 dark:bg-cyan-900/10 rounded">
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.date}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recentDevelopments.all_news && recentDevelopments.all_news.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">📰 All Recent News</p>
                      <div className="space-y-2">
                        {recentDevelopments.all_news.slice(0, 5).map((item: any, i: number) => (
                          <div key={i} className="p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-semibold mb-1">{item.title}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>{item.date}</span>
                                  {item.source && (
                                    <>
                                      <span>•</span>
                                      <span>{item.source}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {item.sentiment && (
                                <Badge 
                                  variant={item.sentiment === 'positive' ? 'default' : item.sentiment === 'negative' ? 'destructive' : 'secondary'}
                                  className="text-xs shrink-0"
                                >
                                  {item.sentiment}
                                </Badge>
                              )}
                            </div>
                            {item.summary && <p className="text-xs text-muted-foreground mt-1">{item.summary}</p>}
                            {item.url && (
                              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-2">
                                <ExternalLink className="h-3 w-3" />
                                Read more
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </details>
        </Card>
      )}

      {/* Risk Analysis */}
      {riskRationale && riskRationale.risk_level && (
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Risk Assessment</span>
                <Badge variant="outline" className="text-xs ml-2">{riskRationale.risk_level.level}</Badge>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="space-y-4 pt-4">
              <div className="p-4 border rounded-lg bg-muted/30">
                <p className="text-sm font-semibold mb-2">Risk Level: {riskRationale.risk_level.level}</p>
                <p className="text-sm text-muted-foreground">{riskRationale.risk_level.explanation}</p>
              </div>
            </CardContent>
          </details>
        </Card>
      )}

      {/* IPO Analysis */}
      {ipoAnalysis && (ipoAnalysis.ipo_likelihood || ipoAnalysis.estimated_ipo_timeline) && (
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5" />
                <span className="font-semibold">IPO Analysis</span>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ipoAnalysis.ipo_likelihood && (
                  <div className="p-3 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <p className="text-xs text-muted-foreground font-medium mb-1">IPO Likelihood</p>
                    <p className="text-sm font-bold">{ipoAnalysis.ipo_likelihood}</p>
                  </div>
                )}
                {ipoAnalysis.estimated_ipo_timeline && (
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Timeline</p>
                    <p className="text-sm font-bold">{ipoAnalysis.estimated_ipo_timeline}</p>
                  </div>
                )}
                {ipoAnalysis.estimated_ipo_valuation_usd && (
                  <div className="p-3 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Est. Valuation</p>
                    <p className="text-sm font-bold">${(ipoAnalysis.estimated_ipo_valuation_usd / 1000000000).toFixed(1)}B</p>
                  </div>
                )}
              </div>

              {ipoAnalysis.comparable_ipos && ipoAnalysis.comparable_ipos.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">Comparable IPOs</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {ipoAnalysis.comparable_ipos.map((ipo: any, i: number) => (
                        <div key={i} className="p-3 border rounded-lg">
                          <p className="text-sm font-semibold">{ipo.company}</p>
                          <p className="text-xs text-muted-foreground">${(ipo.valuation_usd / 1000000000).toFixed(1)}B • {ipo.year}</p>
                    </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </details>
        </Card>
      )}

      {/* Employee Satisfaction */}
      {employeeSatisfaction && Object.keys(employeeSatisfaction).length > 0 && (
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="font-semibold">Employee Satisfaction</span>
                {(employeeSatisfaction.glassdoor_rating?.value || typeof employeeSatisfaction.glassdoor_rating === 'number') && (
                  <Badge variant="outline" className="text-xs ml-2">
                    ⭐ {employeeSatisfaction.glassdoor_rating?.value || employeeSatisfaction.glassdoor_rating}/5
                  </Badge>
                )}
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="space-y-4 pt-4">
              {employeeSatisfaction.reviews_summary && (
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-sm">{employeeSatisfaction.reviews_summary}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {employeeSatisfaction.top_pros && employeeSatisfaction.top_pros.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2 text-green-600">Top Pros</p>
                    <ul className="space-y-1">
                      {employeeSatisfaction.top_pros.map((pro: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {employeeSatisfaction.top_cons && employeeSatisfaction.top_cons.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2 text-red-600">Top Cons</p>
                    <ul className="space-y-1">
                      {employeeSatisfaction.top_cons.map((con: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </details>
        </Card>
      )}

      {/* Customer Feedback */}
      {customerFeedback && Object.keys(customerFeedback).length > 0 && (
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                <span className="font-semibold">Customer Feedback</span>
                {(customerFeedback.g2_rating?.value || typeof customerFeedback.g2_rating === 'number') && (
                  <Badge variant="outline" className="text-xs ml-2">
                    G2: {customerFeedback.g2_rating?.value || customerFeedback.g2_rating}/5
                  </Badge>
                )}
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="space-y-4 pt-4">
              {(customerFeedback.nps_score || customerFeedback.g2_rating || customerFeedback.trustpilot_rating) && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(customerFeedback.nps_score?.value || typeof customerFeedback.nps_score === 'number') && (
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground font-medium mb-1">NPS Score</p>
                      <p className="text-sm font-bold">{customerFeedback.nps_score?.value || customerFeedback.nps_score}</p>
                    </div>
                  )}
                  {(customerFeedback.g2_rating?.value || typeof customerFeedback.g2_rating === 'number') && (
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground font-medium mb-1">G2 Rating</p>
                      <p className="text-sm font-bold">{customerFeedback.g2_rating?.value || customerFeedback.g2_rating}/5</p>
                    </div>
                  )}
                  {(customerFeedback.trustpilot_rating?.value || typeof customerFeedback.trustpilot_rating === 'number') && (
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Trustpilot</p>
                      <p className="text-sm font-bold">{customerFeedback.trustpilot_rating?.value || customerFeedback.trustpilot_rating}/5</p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {customerFeedback.positive_themes && customerFeedback.positive_themes.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2 text-green-600">Positive Feedback</p>
                    <ul className="space-y-1">
                      {customerFeedback.positive_themes.map((theme: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                          <span>{theme}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {customerFeedback.negative_themes && customerFeedback.negative_themes.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2 text-red-600">Negative Feedback</p>
                    <ul className="space-y-1">
                      {customerFeedback.negative_themes.map((theme: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                          <span>{theme}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </details>
        </Card>
      )}

      {/* Investment Rationale */}
      {riskRationale && (riskRationale.why_invest || riskRationale.why_not_invest) && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <details className="group">
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Why Invest</span>
                </div>
                <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
              </summary>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  {riskRationale.why_invest && riskRationale.why_invest.length > 0 ? (
                    riskRationale.why_invest.map((reason: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{reason}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No data available</p>
                  )}
                </ul>
              </CardContent>
            </details>
          </Card>

          <Card>
            <details className="group">
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold">Why Not Invest</span>
                </div>
                <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
              </summary>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  {riskRationale.why_not_invest && riskRationale.why_not_invest.length > 0 ? (
                    riskRationale.why_not_invest.map((reason: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{reason}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No data available</p>
                  )}
                </ul>
              </CardContent>
            </details>
          </Card>
        </div>
      )}
      
      {/* Data Sources - Compact Design */}
      {sources && sources.length > 0 && (
        <Card className="border-2">
          <details className="group">
            <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Database className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-base font-semibold">Data Sources</span>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {sources.length} sources
                </Badge>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                {/* Show first 3 source icons */}
                <div className="flex -space-x-2">
                  {sources.slice(0, 3).map((source: any, i: number) => (
                    <div 
                      key={i} 
                      className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center"
                      title={source.title || source.url}
                    >
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                  ))}
                </div>
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 flex-shrink-0" />
              </div>
            </summary>
            
            {/* Expandable source list */}
            <CardContent className="pt-0 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 overflow-hidden">
                {sources.map((source: any, i: number) => (
                  <a
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 border rounded-lg hover:bg-muted/50 transition-colors group/item overflow-hidden"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover/item:text-primary shrink-0" />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-xs font-medium truncate group-hover/item:text-primary" title={source.url}>
                        {source.title && source.title !== source.url ? source.title : 
                          (source.url.length > 40 ? `${source.url.substring(0, 40)}...` : source.url)}
                      </p>
                    </div>
                    {source.relevance && (
                      <Badge
                        variant={source.relevance === "high" ? "default" : "secondary"}
                        className="text-[10px] h-5 px-1.5 shrink-0 whitespace-nowrap"
                      >
                        {source.relevance}
                      </Badge>
                    )}
                  </a>
                ))}
              </div>
            </CardContent>
          </details>
        </Card>
      )}
    </div>
  );
}
