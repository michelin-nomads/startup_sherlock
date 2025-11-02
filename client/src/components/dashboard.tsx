import { authenticatedFetchJSON } from "@/lib/api"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MetricsCard } from "./metrics-card"
import { RiskFlags } from "./risk-flags"
import { StartupChart } from "./startup-chart"
import { FileUp, TrendingUp, AlertTriangle, Target, Users, IndianRupee, Eye } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import type { StartupMetrics, RiskFlag } from "@shared/schema"
import {getApiUrl} from "@/lib/config.ts";
import { formatCurrency } from "@/lib/utils"

// Base metrics configuration for dashboard cards
const BASE_METRICS_CONFIG = [
  {
    key: 'marketSize',
    title: 'Market Size',
    description: 'Average market potential score'
  },
  {
    key: 'traction',
    title: 'Traction',
    description: 'Average traction score'
  },
  {
    key: 'team',
    title: 'Team Quality',
    description: 'Average team strength score'
  },
  {
    key: 'product',
    title: 'Product',
    description: 'Average product innovation score'
  },
  {
    key: 'financials',
    title: 'Financials',
    description: 'Average financial health score'
  },
  {
    key: 'competition',
    title: 'Competition',
    description: 'Average competitive position'
  }
] as const;

// Function to determine category based on score
const getMetricCategory = (value: number): 'success' | 'warning' | 'danger' | 'primary' => {
  if (value >= 80) return 'success';      // Excellent performance
  if (value >= 60) return 'primary';      // Good performance  
  if (value >= 40) return 'warning';      // Needs attention
  return 'danger';                        // Poor performance
};

// Function to determine trend (placeholder - would need historical data)
const getMetricTrend = (key: string, currentValue: number): 'up' | 'down' | 'neutral' => {
  // TODO: This should compare with historical data or benchmarks
  // For now, using score-based heuristics
  if (currentValue >= 75) return 'up';
  if (currentValue <= 50) return 'down';
  return 'neutral';
};

// Calculate aggregate metrics from analyzed startups
const calculateAggregateMetrics = (startups: any[]): StartupMetrics => {
  const analyzed = startups.filter(s => s.analysisData?.metrics)
  if (analyzed.length === 0) {
    return {
      marketSize: 0,
      traction: 0,
      team: 0,
      product: 0,
      financials: 0,
      competition: 0,
    }
  }
  
  const totals = analyzed.reduce((acc, startup) => {
    const metrics = startup.analysisData.metrics
    return {
      marketSize: acc.marketSize + metrics.marketSize,
      traction: acc.traction + metrics.traction,
      team: acc.team + metrics.team,
      product: acc.product + metrics.product,
      financials: acc.financials + metrics.financials,
      competition: acc.competition + metrics.competition,
    }
  }, {
    marketSize: 0,
    traction: 0,
    team: 0,
    product: 0,
    financials: 0,
    competition: 0,
  })
  
  const count = analyzed.length
  return {
    marketSize: totals.marketSize / count,
    traction: totals.traction / count,
    team: totals.team / count,
    product: totals.product / count,
    financials: totals.financials / count,
    competition: totals.competition / count,
  }
}

const calculateAggregateRiskFlags = (startups: any[]): RiskFlag[] => {
  const analyzed = startups.filter(s => s.analysisData?.riskFlags)
  if (analyzed.length === 0) return []
  
  // Get unique risk categories and their severity
  const riskMap = new Map<string, { count: number, severity: string, description: string }>()
  
  analyzed.forEach(startup => {
    startup.analysisData.riskFlags.forEach((flag: any) => {
      const key = flag.category
      if (!riskMap.has(key)) {
        riskMap.set(key, { count: 1, severity: flag.type, description: flag.description })
      } else {
        const existing = riskMap.get(key)!
        existing.count++
        // Use highest severity
        if (flag.type === 'high' || (flag.type === 'medium' && existing.severity === 'low')) {
          existing.severity = flag.type
        }
      }
    })
  })
  
  return Array.from(riskMap.entries()).slice(0, 3).map(([category, data]) => ({
    type: data.severity as 'high' | 'medium' | 'low',
    category,
    description: `Found in ${data.count} startup${data.count > 1 ? 's' : ''}`,
    impact: `Portfolio-wide ${category.toLowerCase()} risk`
  }))
}

// Calculate total portfolio investment value
const calculatePortfolioInvestment = (startups: any[]): { totalInvestment: number, growthPercentage: number } => {
  const analyzed = startups.filter(s => s.analysisData?.recommendation?.targetInvestment)
  
  if (analyzed.length === 0) {
    return { totalInvestment: 0, growthPercentage: 0 }
  }
  
  const totalInvestment = analyzed.reduce((sum, startup) => {
    return sum + (startup.analysisData.recommendation.targetInvestment || 0)
  }, 0)
  
  // Calculate weighted growth based on expected returns and investment amounts
  const totalWeightedReturn = analyzed.reduce((sum, startup) => {
    const investment = startup.analysisData.recommendation.targetInvestment || 0
    let expectedReturn = startup.analysisData.recommendation.expectedReturn || 1
    
    // Cap unrealistic return multipliers to reasonable ranges
    // Typical VC returns are 3x-10x, exceptional cases might be 20x
    expectedReturn = Math.min(expectedReturn, 10) // Cap at 10x return
    expectedReturn = Math.max(expectedReturn, 0.5) // Floor at 0.5x (50% loss)
    
    return sum + (investment * expectedReturn)
  }, 0)
  
  const avgReturn = totalWeightedReturn / totalInvestment
  const growthPercentage = ((avgReturn - 1) * 100) // Convert to percentage growth
  
  return { 
    totalInvestment, 
    growthPercentage: Math.round(growthPercentage * 10) / 10 // Round to 1 decimal
  }
}

export function Dashboard() {
  const navigate = useNavigate()
  const [selectedPeriod, setSelectedPeriod] = useState("30d")

  const { data: startups, isLoading } = useQuery({
    queryKey: ['/api/startups'],
    queryFn: async () => {
      const data = await authenticatedFetchJSON(getApiUrl('/api/startups'))
      
      // Save to local storage for persistence
      localStorage.setItem('startups', JSON.stringify(data))
      
      return data
    },
    select: (data: any[]) => data || [],
    // Use local storage as fallback when server is unavailable
    placeholderData: (previousData) => {
      if (previousData) return previousData
      const cached = localStorage.getItem('startups')
      if (cached) {
        try {
          return JSON.parse(cached)
        } catch (e) {
          console.error('Failed to parse cached startups data:', e)
        }
      }
      return []
    }
  })

  const handlePeriodChange = (period: string) => {
    console.log(`Period changed to: ${period}`)
    setSelectedPeriod(period)
  }

  const analyzedStartups = startups?.filter(s => s.overallScore !== null && s.overallScore !== undefined) || []
  const totalAnalysis = analyzedStartups.length
  const avgScore = totalAnalysis > 0 
    ? analyzedStartups.reduce((sum, s) => sum + (s.overallScore || 0), 0) / totalAnalysis 
    : 0
  const highRiskCount = analyzedStartups.filter(s => s.riskLevel === 'High').length
  
  const aggregateMetrics = calculateAggregateMetrics(startups || [])
  const aggregateRiskFlags = calculateAggregateRiskFlags(startups || [])
  const portfolioInvestment = calculatePortfolioInvestment(startups || [])


  return (
    <div className="space-y-6" data-testid="dashboard-main">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investment Dashboard</h1>
          <p className="text-muted-foreground">
            AI-powered startup analysis and investment intelligence
          </p>
        </div>
        <Button data-testid="button-upload-new" onClick={() => navigate("/upload")}>
          <FileUp className="mr-2 h-4 w-4" />
          Analyze New Startup
        </Button>
      </div>

      {/* Key Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analysis</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnalysis}</div>
            <p className="text-xs text-muted-foreground">
              Total startups analyzed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Average investment score
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Flags</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highRiskCount}</div>
            <p className="text-xs text-muted-foreground">
              {totalAnalysis > 0 
                ? `${Math.round((highRiskCount / totalAnalysis) * 100)}% of portfolio at high risk`
                : 'No analysis data available'
              }
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investments</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolioInvestment.totalInvestment > 0 
                ? formatCurrency(portfolioInvestment.totalInvestment)
                : '₹0'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {portfolioInvestment.growthPercentage > 0 
                ? `+${portfolioInvestment.growthPercentage}% expected growth`
                : portfolioInvestment.growthPercentage < 0
                ? `${portfolioInvestment.growthPercentage}% expected decline`
                : 'No growth data available'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Metrics Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Portfolio Metrics</h2>
            {totalAnalysis > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {BASE_METRICS_CONFIG.map((metric) => {
                  const value = aggregateMetrics[metric.key as keyof typeof aggregateMetrics];
                  return (
                    <MetricsCard
                      key={metric.key}
                      title={metric.title}
                      value={value}
                      description={metric.description}
                      trend={getMetricTrend(metric.key, value)}
                      trendValue={`${totalAnalysis} startup${totalAnalysis === 1 ? '' : 's'}`}
                      category={getMetricCategory(value)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Analysis Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Upload startup documents to begin AI-powered analysis and see metrics here.
                </p>
                <Button data-testid="button-start-analyzing" onClick={() => navigate("/upload")}>
                  <FileUp className="mr-2 h-4 w-4" />
                  Start Analyzing
                </Button>
              </div>
            )}
          </div>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aggregateRiskFlags.length > 0 ? (
                <RiskFlags risks={aggregateRiskFlags} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No risk data available</p>
                  <p className="text-xs">Complete analysis to see risks</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2 animate-pulse">
                      <div className="space-y-1">
                        <div className="h-4 bg-muted rounded w-24"></div>
                        <div className="h-3 bg-muted rounded w-16"></div>
                      </div>
                      <div className="h-4 bg-muted rounded w-12"></div>
                    </div>
                  ))}
                </div>
              ) : analyzedStartups.length === 0 ? (
                <div className="text-center py-8">
                  <FileUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No analysis yet</p>
                  <Button data-testid="button-start-first-analysis" onClick={() => navigate("/upload")}>
                    Start Your First Analysis
                  </Button>
                </div>
              ) : (
                <>
                  {analyzedStartups.slice(0, 4).map((startup) => (
                    <div 
                      key={startup.id} 
                      className="flex items-center justify-between py-2 border-b last:border-0"
                      data-testid={`analysis-item-${startup.id}`}
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{startup.name}</p>
                        <p className="text-xs text-muted-foreground">{startup.industry || 'Not specified'}</p>
                      </div>
                      <div className="text-right space-y-1 flex items-center gap-2">
                        <div>
                          <p className="font-mono text-sm">{startup.overallScore?.toFixed(1) || 'N/A'}</p>
                          <Badge 
                            variant={startup.overallScore ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {startup.overallScore ? 'completed' : 'pending'}
                          </Badge>
                        </div>
                        {startup.overallScore && (
                          <Button variant="ghost" size="icon" data-testid={`button-view-${startup.id}`} onClick={() => navigate(`/analysis/${startup.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <Button variant="outline" className="w-full mt-4" data-testid="button-analyze-new" onClick={() => navigate("/upload")}>
                    Analyze New Startup
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}