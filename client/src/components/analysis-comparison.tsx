import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getApiUrl } from "@/lib/config"
import { authenticatedFetch } from "@/lib/api"
import { TrendingUp, TrendingDown, Minus, GitCompare, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface AnalysisData {
  startup: {
    id: string
    name: string
    overallScore: number
    riskLevel: string
  }
  analysis: {
    overallScore: number
    metrics: {
      marketSize: number
      traction: number
      team: number
      product: number
      financials: number
      competition: number
    }
    recommendation: {
      targetInvestment: number
      expectedReturn: number
    }
  }
}

interface MarketTrends {
  overallScore: number
  metrics: {
    marketSize: number
    traction: number
    team: number
    product: number
    financials: number
    competition: number
  }
  recommendation: {
    targetInvestment: number
    expectedReturn: number
  }
}

interface ComparisonProps {
  analysisData: AnalysisData
}

export default function AnalysisComparison({ analysisData }: ComparisonProps) {
  const { data: marketTrends, isLoading, error } = useQuery<MarketTrends>({
    queryKey: ['market-trends'],
    queryFn: async () => {
      const response = await authenticatedFetch(getApiUrl('/api/market-trends'), {
        method: 'GET',
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch market trends: ${response.statusText}`)
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Market Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-4 bg-muted rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !marketTrends) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Market Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Unable to load market trends for comparison</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getComparisonIcon = (companyValue: number, marketValue: number) => {
    const diff = companyValue - marketValue
    if (Math.abs(diff) < 2) return <Minus className="h-4 w-4 text-gray-500" />
    return diff > 0 ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />
  }

  const getComparisonColor = (companyValue: number, marketValue: number) => {
    const diff = companyValue - marketValue
    if (Math.abs(diff) < 2) return "text-gray-600"
    return diff > 0 ? "text-green-600" : "text-red-600"
  }

  const getComparisonBadge = (companyValue: number, marketValue: number) => {
    const diff = companyValue - marketValue
    if (Math.abs(diff) < 2) return <Badge variant="secondary">Neutral</Badge>
    return diff > 0 ? 
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Better</Badge> : 
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Below Market</Badge>
  }

  const formatMetricName = (metric: string) => {
    return metric.replace(/([A-Z])/g, ' $1').trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="h-5 w-5" />
          Market Comparison
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Comparing your analysis with current market trends
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score Comparison */}
        <div className="space-y-3">
          <h4 className="font-semibold text-lg">Overall Score</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your Analysis</span>
                <span className="text-lg font-bold">{analysisData.analysis.overallScore}/100</span>
              </div>
              <Progress value={analysisData.analysis.overallScore} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Market Average</span>
                <span className="text-lg font-bold">{marketTrends.overallScore}/100</span>
              </div>
              <Progress value={marketTrends.overallScore} className="h-2" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              {getComparisonIcon(analysisData.analysis.overallScore, marketTrends.overallScore)}
              <span className={`text-sm font-medium ${getComparisonColor(analysisData.analysis.overallScore, marketTrends.overallScore)}`}>
                {Math.abs(analysisData.analysis.overallScore - marketTrends.overallScore).toFixed(1)} points difference
              </span>
            </div>
            {getComparisonBadge(analysisData.analysis.overallScore, marketTrends.overallScore)}
          </div>
        </div>

        {/* Detailed Metrics Comparison */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Detailed Metrics</h4>
          <div className="space-y-4">
            {Object.entries(analysisData?.analysis?.metrics || {}).map(([metric, companyValue]) => {
              const marketValue = marketTrends.metrics[metric as keyof typeof marketTrends.metrics]
              return (
                <div key={metric} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{formatMetricName(metric)}</span>
                    <div className="flex items-center gap-2">
                      {getComparisonIcon(companyValue, marketValue)}
                      {getComparisonBadge(companyValue, marketValue)}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Your Analysis</span>
                        <span className="font-medium">{companyValue}/100</span>
                      </div>
                      <Progress value={companyValue} className="h-2" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Market Average</span>
                        <span className="font-medium">{marketValue}/100</span>
                      </div>
                      <Progress value={marketValue} className="h-2" />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Difference: <span className={getComparisonColor(companyValue, marketValue)}>
                      {companyValue > marketValue ? '+' : ''}{(companyValue - marketValue).toFixed(1)} points
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Investment Comparison */}
        <div className="space-y-3">
          <h4 className="font-semibold text-lg">Investment Metrics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Target Investment</span>
                <span className="font-bold">{formatCurrency(analysisData.analysis.recommendation?.targetInvestment || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Market Average</span>
                <span className="font-bold">{formatCurrency(marketTrends.recommendation?.targetInvestment || 0)}</span>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                {getComparisonIcon(analysisData.analysis.recommendation?.targetInvestment, marketTrends.recommendation?.targetInvestment)}
                <span className={`text-sm ${getComparisonColor(analysisData.analysis.recommendation?.targetInvestment, marketTrends.recommendation?.targetInvestment)}`}>
                  {((analysisData.analysis.recommendation?.targetInvestment - marketTrends.recommendation?.targetInvestment) / marketTrends.recommendation?.targetInvestment * 100).toFixed(1)}% vs market
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Expected Return</span>
                <span className="font-bold">{analysisData.analysis.recommendation?.expectedReturn}x</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Market Average</span>
                <span className="font-bold">{marketTrends.recommendation?.expectedReturn || 0 }x</span>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                {getComparisonIcon(analysisData.analysis.recommendation?.expectedReturn, marketTrends.recommendation?.expectedReturn)}
                <span className={`text-sm ${getComparisonColor(analysisData.analysis.recommendation?.expectedReturn, marketTrends.recommendation?.expectedReturn)}`}>
                  {((analysisData.analysis.recommendation?.expectedReturn - marketTrends.recommendation?.expectedReturn) / marketTrends.recommendation?.expectedReturn * 100).toFixed(1)}% vs market
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 mb-2">
            <GitCompare className="h-4 w-4" />
            <span className="font-medium">Comparison Summary</span>
          </div>
          <p className="text-sm text-muted-foreground">
            This analysis shows how {analysisData.startup.name} compares to current market trends. 
            Green indicators show areas where the company performs better than market average, 
            while red indicators highlight areas that may need attention.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
