import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, Target, Users, DollarSign, Zap, AlertTriangle, CheckCircle, Info } from "lucide-react";
import AnalysisComparison from "@/components/analysis-comparison"
import { useParams } from "react-router-dom"
import { getApiUrl } from "@/lib/config"
import { authenticatedFetchJSON } from "@/lib/api"

interface AnalysisData {
    startup: {
        id: string
        name: string
        industry: string | null
        overallScore: number
        riskLevel: string
        recommendation: string
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

interface BenchmarkMetrics {
    marketPenetration: {
        value: number
        trend: string
        trendValue: string
    }
    teamExperience: {
        value: number
        trend: string
        trendValue: string
    }
    revenueGrowth: {
        value: number
        trend: string
        trendValue: string
    }
    burnRateEfficiency: {
        value: number
        trend: string
        trendValue: string
    }
}

interface ComparisonProps {
    params: Record<string, string>;
}

export default function Comparison({ params }: ComparisonProps) {
    const { startupId } = useParams<{ startupId: string }>();

    // Fetch analysis data for the startup
    const { data: analysisData, isLoading: analysisLoading, error: analysisError } = useQuery<AnalysisData>({
        queryKey: ['/api/analysis', startupId],
        queryFn: async () => {
            return await authenticatedFetchJSON(getApiUrl(`/api/analysis/${startupId}`))
        },
        enabled: !!startupId
    })

    // Fetch benchmark metrics
    const { data: benchmarkMetrics, isLoading: metricsLoading, error: metricsError } = useQuery<BenchmarkMetrics>({
        queryKey: ['/api/benchmark-metrics'],
        queryFn: async () => {
            return await authenticatedFetchJSON(getApiUrl('/api/benchmark-metrics'))
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    const getComparisonColor = (startupValue: number, benchmarkValue: number) => {
        if (startupValue > benchmarkValue) {
            return 'text-green-600 dark:text-green-400'
        } else if (startupValue < benchmarkValue) {
            return 'text-red-600 dark:text-red-400'
        }
        return 'text-blue-600 dark:text-blue-400'
    }

    const getComparisonIcon = (startupValue: number, benchmarkValue: number) => {
        if (startupValue > benchmarkValue) {
            return <TrendingUp className="h-4 w-4" />
        } else if (startupValue < benchmarkValue) {
            return <TrendingDown className="h-4 w-4" />
        }
        return <div className="h-4 w-4 flex items-center justify-center">→</div>
    }

    const getComparisonBadge = (startupValue: number, benchmarkValue: number) => {
        if (startupValue > benchmarkValue) {
            return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Above Market</Badge>
        } else if (startupValue < benchmarkValue) {
            return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Below Market</Badge>
        }
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">At Market</Badge>
    }

    if (analysisLoading || metricsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Loading comparison data...</p>
                </div>
            </div>
        )
    }

    if (analysisError || metricsError || !analysisData || !benchmarkMetrics) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950 mx-auto">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-semibold">Comparison Not Available</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Unable to load comparison data. Please try again or return to the benchmarks page.
                        </p>
                    </div>
                    <div className="flex gap-3 justify-center">
                        <Button asChild>
                            <Link to="/benchmarks">Back to Benchmarks</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link to="/">View Dashboard</Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    const { startup, analysis } = analysisData

    return (
        <div className="space-y-6" data-testid="comparison-page">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/benchmarks">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Detailed Comparison</h1>
                        <p className="text-muted-foreground">
                            {startup.name} vs Market Benchmarks
                        </p>
                    </div>
                </div>
                <Badge
                    variant={startup.overallScore >= 80 ? 'default' :
                        startup.overallScore >= 60 ? 'secondary' : 'destructive'}
                    className="text-lg px-4 py-2"
                >
                    {startup.overallScore}/100
                </Badge>
            </div>

            {/* Overall Performance Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Overall Performance Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Your Startup Score</span>
                                    <span className={`text-3xl font-bold ${getComparisonColor(startup.overallScore, 75)}`}>
                    {startup.overallScore}/100
                  </span>
                                </div>
                                <Progress value={startup.overallScore} className="h-3" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Market Average</span>
                                    <span className="text-3xl font-bold text-muted-foreground">75/100</span>
                                </div>
                                <Progress value={75} className="h-3" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Performance vs Market</span>
                                {getComparisonBadge(startup.overallScore, 75)}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Difference</span>
                                <span className={`text-lg font-semibold ${getComparisonColor(startup.overallScore, 75)}`}>
                  {startup.overallScore > 75 ? '+' : ''}{startup.overallScore - 75} points
                </span>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    <strong>Analysis:</strong> Your startup scores {startup.overallScore > 75 ? 'above' : startup.overallScore < 75 ? 'below' : 'at'} the market average.
                                    {startup.overallScore > 75 ? ' This indicates strong competitive positioning.' :
                                        startup.overallScore < 75 ? ' Consider focusing on areas for improvement.' :
                                            ' You are performing at market standards.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Git Diff-Style Market Comparison */}
            <AnalysisComparison analysisData={analysisData} />

            {/* Detailed Metrics Comparison */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Market Penetration */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Market Penetration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Your Startup</span>
                                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold ${getComparisonColor(analysis.metrics.marketSize, benchmarkMetrics.marketPenetration.value)}`}>
                    {analysis.metrics.marketSize}
                  </span>
                                    {getComparisonIcon(analysis.metrics.marketSize, benchmarkMetrics.marketPenetration.value)}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Market Average</span>
                                <span className="text-xl font-bold text-muted-foreground">
                  {benchmarkMetrics.marketPenetration.value}
                </span>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Difference</span>
                                <span className={`font-medium ${getComparisonColor(analysis.metrics.marketSize, benchmarkMetrics.marketPenetration.value)}`}>
                  {analysis.metrics.marketSize > benchmarkMetrics.marketPenetration.value ? '+' : ''}
                                    {analysis.metrics.marketSize - benchmarkMetrics.marketPenetration.value} points
                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span>Market Trend</span>
                                <span className="text-muted-foreground">{benchmarkMetrics.marketPenetration.trendValue}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Team Experience */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Team Experience
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Your Startup</span>
                                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold ${getComparisonColor(analysis.metrics.team, benchmarkMetrics.teamExperience.value)}`}>
                    {analysis.metrics.team}
                  </span>
                                    {getComparisonIcon(analysis.metrics.team, benchmarkMetrics.teamExperience.value)}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Market Average</span>
                                <span className="text-xl font-bold text-muted-foreground">
                  {benchmarkMetrics.teamExperience.value}
                </span>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Difference</span>
                                <span className={`font-medium ${getComparisonColor(analysis.metrics.team, benchmarkMetrics.teamExperience.value)}`}>
                  {analysis.metrics.team > benchmarkMetrics.teamExperience.value ? '+' : ''}
                                    {analysis.metrics.team - benchmarkMetrics.teamExperience.value} points
                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span>Market Trend</span>
                                <span className="text-muted-foreground">{benchmarkMetrics.teamExperience.trendValue}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Product Quality */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Product Quality
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Your Startup</span>
                                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold ${getComparisonColor(analysis.metrics.product, benchmarkMetrics.revenueGrowth.value)}`}>
                    {analysis.metrics.product}
                  </span>
                                    {getComparisonIcon(analysis.metrics.product, benchmarkMetrics.revenueGrowth.value)}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Market Average</span>
                                <span className="text-xl font-bold text-muted-foreground">
                  {benchmarkMetrics.revenueGrowth.value}
                </span>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Difference</span>
                                <span className={`font-medium ${getComparisonColor(analysis.metrics.product, benchmarkMetrics.revenueGrowth.value)}`}>
                  {analysis.metrics.product > benchmarkMetrics.revenueGrowth.value ? '+' : ''}
                                    {analysis.metrics.product - benchmarkMetrics.revenueGrowth.value} points
                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span>Market Trend</span>
                                <span className="text-muted-foreground">{benchmarkMetrics.revenueGrowth.trendValue}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Performance */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Financial Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Your Startup</span>
                                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold ${getComparisonColor(analysis.metrics.financials, benchmarkMetrics.burnRateEfficiency.value)}`}>
                    {analysis.metrics.financials}
                  </span>
                                    {getComparisonIcon(analysis.metrics.financials, benchmarkMetrics.burnRateEfficiency.value)}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Market Average</span>
                                <span className="text-xl font-bold text-muted-foreground">
                  {benchmarkMetrics.burnRateEfficiency.value}
                </span>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Difference</span>
                                <span className={`font-medium ${getComparisonColor(analysis.metrics.financials, benchmarkMetrics.burnRateEfficiency.value)}`}>
                  {analysis.metrics.financials > benchmarkMetrics.burnRateEfficiency.value ? '+' : ''}
                                    {analysis.metrics.financials - benchmarkMetrics.burnRateEfficiency.value} points
                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span>Market Trend</span>
                                <span className="text-muted-foreground">{benchmarkMetrics.burnRateEfficiency.trendValue}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Investment Recommendation */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Investment Recommendation
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Recommendation</span>
                                <Badge
                                    variant={startup.recommendation === 'strong_buy' ? 'default' :
                                        startup.recommendation === 'buy' ? 'secondary' :
                                            startup.recommendation === 'hold' ? 'outline' : 'destructive'}
                                    className="text-sm"
                                >
                                    {startup.recommendation.replace('_', ' ').toUpperCase()}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Risk Level</span>
                                <Badge
                                    variant={startup.riskLevel === 'Low' ? 'default' :
                                        startup.riskLevel === 'Medium' ? 'secondary' : 'destructive'}
                                    className="text-sm"
                                >
                                    {startup.riskLevel}
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Target Investment</span>
                                <span className="font-semibold">
                  ${(analysis.recommendation.targetInvestment / 1000000).toFixed(1)}M
                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Expected Return</span>
                                <span className="font-semibold">
                  {analysis.recommendation.expectedReturn}x
                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
                <Button asChild>
                    <Link to={`/analysis/${startupId}`}>View Full Analysis</Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link to="/benchmarks">Back to Benchmarks</Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link to="/">View Dashboard</Link>
                </Button>
            </div>
        </div>
    )
}