import { authenticatedFetchJSON } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StartupChart } from "@/components/startup-chart"
import { MetricsCard } from "@/components/metrics-card"
import { Badge } from "@/components/ui/badge"
import { Target, TrendingUp, TrendingDown, Users, DollarSign, Loader2, RefreshCw, Filter, Building2, Zap, Rocket, BarChart3, X } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Link } from "react-router-dom"
import {getApiUrl} from "@/lib/config.ts";

interface IndustryBenchmark {
  industry: string
  companies: number
  avgScore: number
  topPerformer: string
  growth: string
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
    maxValue: number
    trend: string
    trendValue: string
  }
  burnRateEfficiency: {
    value: number
    trend: string
    trendValue: string
  }
}

interface Startup {
  id: string
  name: string
  description: string | null
  industry: string | null
  stage: string | null
  foundedYear: number | null
  location: string | null
  websiteUrl: string | null
  overallScore: number | null
  riskLevel: string | null
  recommendation: string | null
  analysisData: any | null
  createdAt: string
  updatedAt: string
}

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

const INDUSTRY_OPTIONS = [
  'AI/ML', 'FinTech', 'HealthTech', 'EdTech', 'SaaS', 'E-commerce', 
  'Cybersecurity', 'Blockchain', 'IoT', 'Robotics', 'CleanTech', 'AgriTech'
]

const COMPANY_SIZE_OPTIONS = [
  { 
    value: 'very-big', 
    label: 'Multi-National Companies', 
    description: 'Fortune 500, Unicorns, Established Enterprises', 
    employeeRange: '10,000+ employees',
    icon: Building2 
  },
  { 
    value: 'mid-scale', 
    label: 'Mid-Scale Startups', 
    description: 'Growth Stage, Series B/C Companies', 
    employeeRange: '200-1,000 employees',
    icon: Zap 
  },
  { 
    value: 'small-scale', 
    label: 'Small-Scale Startups', 
    description: 'Series A, Established Product-Market Fit', 
    employeeRange: '50-200 employees',
    icon: Users 
  },
  { 
    value: 'early-stage', 
    label: 'Early Stage Startups', 
    description: 'Seed Stage, Product Development', 
    employeeRange: '10-50 employees',
    icon: Rocket 
  },
  { 
    value: 'pre-seed', 
    label: 'Pre-seed Startups', 
    description: 'Idea Stage, MVP Development', 
    employeeRange: '1-10 employees',
    icon: Target 
  }
]

export default function BenchmarksPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [companySize, setCompanySize] = useState<string>('mid-scale')
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false)
  const [selectedStartupId, setSelectedStartupId] = useState<string>('')
  const queryClient = useQueryClient()

  const { data: industryBenchmarks = [], isLoading, error } = useQuery<IndustryBenchmark[]>({
    queryKey: ['/api/benchmarks'],
    queryFn: async () => {
      return await authenticatedFetchJSON(getApiUrl('/api/benchmarks'))
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: customBenchmarks = [], isLoading: customLoading, error: customError } = useQuery<IndustryBenchmark[]>({
    queryKey: ['/api/benchmarks/custom', selectedIndustries, companySize],
    queryFn: async () => {
      const params = new URLSearchParams()
      selectedIndustries.forEach(industry => params.append('industries', industry))
      params.append('companySize', companySize)
      
      return await authenticatedFetchJSON(getApiUrl(`/api/benchmarks/custom?${params.toString()}`))
    },
    enabled: isCustomMode && selectedIndustries.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: benchmarkMetrics, isLoading: metricsLoading, error: metricsError } = useQuery<BenchmarkMetrics>({
    queryKey: ['/api/benchmark-metrics'],
    queryFn: async () => {
      return await authenticatedFetchJSON(getApiUrl('/api/benchmark-metrics'))
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch all startups for comparison dropdown
  const { data: allStartups = [], isLoading: startupsLoading } = useQuery<Startup[]>({
    queryKey: ['/api/startups'],
    queryFn: async () => {
      const data = await authenticatedFetchJSON(getApiUrl('/api/startups'))
      
      // Save to local storage for persistence
      localStorage.setItem('startups', JSON.stringify(data))
      
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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

  // Filter only analyzed startups (those with overallScore)
  const analyzedStartups = allStartups.filter(startup => startup.overallScore !== null && startup.overallScore !== undefined)

  // Calculate portfolio metrics by industry
  const calculatePortfolioMetricsByIndustry = (industry: string) => {
    const industryStartups = analyzedStartups.filter(startup => 
      startup.industry?.toLowerCase() === industry.toLowerCase()
    )
    
    if (industryStartups.length === 0) return null
    
    const totalScore = industryStartups.reduce((sum, startup) => sum + (startup.overallScore || 0), 0)
    const avgScore = totalScore / industryStartups.length
    
    return {
      count: industryStartups.length,
      avgScore: Math.round(avgScore),
      startups: industryStartups
    }
  }

  // Fetch analysis data for selected startup
  const { data: selectedAnalysisData, isLoading: analysisLoading, isFetching: analysisFetching } = useQuery<AnalysisData>({
    queryKey: ['/api/analysis', selectedStartupId],
    queryFn: async () => {
      const analysisData = await authenticatedFetchJSON(getApiUrl(`/api/analysis/${selectedStartupId}`))
      
      // Save to local storage for persistence
      if (analysisData && selectedStartupId) {
        localStorage.setItem(`analysis_${selectedStartupId}`, JSON.stringify(analysisData))
      }
      
      return analysisData
    },
    enabled: !!selectedStartupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Use local storage as fallback when server is unavailable
    placeholderData: (previousData) => {
      if (previousData) return previousData
      if (selectedStartupId) {
        const cached = localStorage.getItem(`analysis_${selectedStartupId}`)
        if (cached) {
          try {
            return JSON.parse(cached)
          } catch (e) {
            console.error('Failed to parse cached analysis data:', e)
          }
        }
      }
      return undefined
    }
  })

  const refreshMutation = useMutation({
    mutationFn: async () => {
      setIsRefreshing(true)
      // Invalidate and refetch both benchmarks and metrics data
      await queryClient.invalidateQueries({ queryKey: ['/api/benchmarks'] })
      await queryClient.invalidateQueries({ queryKey: ['/api/benchmark-metrics'] })
      if (isCustomMode) {
        await queryClient.invalidateQueries({ queryKey: ['/api/benchmarks/custom'] })
      }
    },
    onSettled: () => {
      setIsRefreshing(false)
    }
  })

  const handleRefresh = () => {
    refreshMutation.mutate()
  }

  const handleIndustrySelect = (industry: string) => {
    if (selectedIndustries.includes(industry)) {
      setSelectedIndustries(prev => prev.filter(i => i !== industry))
    } else if (selectedIndustries.length < 5) {
      setSelectedIndustries(prev => [...prev, industry])
    }
  }

  const handleGenerateCustom = () => {
    if (selectedIndustries.length > 0) {
      setIsCustomMode(true)
      queryClient.invalidateQueries({ queryKey: ['/api/benchmarks/custom'] })
    }
  }

  const handleResetToDefault = () => {
    setIsCustomMode(false)
    setSelectedIndustries([])
    setCompanySize('mid-scale')
  }

  const handleStartComparison = () => {
    if (selectedStartupId && selectedAnalysisData && benchmarkMetrics) {
      setIsComparisonModalOpen(true)
    }
  }

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
      return '↗'
    } else if (startupValue < benchmarkValue) {
      return '↘'
    }
    return '→'
  }

  // Use custom benchmarks if in custom mode, otherwise use default
  const currentBenchmarks = isCustomMode ? customBenchmarks : industryBenchmarks
  const currentLoading = isCustomMode ? customLoading : isLoading
  const currentError = isCustomMode ? customError : error
  return (
    <div className="space-y-6" data-testid="benchmarks-page-main">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Industry Benchmarks</h1>
          <p className="text-muted-foreground">
            Compare startup performance against industry standards
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isComparisonModalOpen} onOpenChange={setIsComparisonModalOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="default"
                size="sm"
                disabled={analyzedStartups.length === 0}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Compare with Benchmark
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Benchmark Comparison
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Startup Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select Startup to Compare</Label>
                  <Select value={selectedStartupId} onValueChange={setSelectedStartupId}>
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="Choose a startup to compare with benchmarks..." />
                    </SelectTrigger>
                    <SelectContent>
                      {analyzedStartups.map((startup) => (
                        <SelectItem key={startup.id} value={startup.id}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{startup.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {startup.industry || 'No industry'}
                              </span>
                            </div>
                            <Badge 
                              variant={startup.overallScore && startup.overallScore >= 80 ? 'default' : 
                                     startup.overallScore && startup.overallScore >= 60 ? 'secondary' : 'destructive'}
                              className="ml-2"
                            >
                              {startup.overallScore}/100
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Loading State - Show when fetching and no data yet */}
                {selectedStartupId && analysisFetching && !selectedAnalysisData && (
                  <div className="text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground font-medium">Loading analysis data...</p>
                  </div>
                )}

                {/* Loading overlay when refreshing existing data */}
                {selectedStartupId && analysisFetching && selectedAnalysisData && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Refreshing...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comparison Results */}
                {selectedStartupId && selectedAnalysisData && benchmarkMetrics && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        {selectedAnalysisData.startup.name} vs Market Benchmarks
                      </h3>
                      <Button 
                        asChild
                        size="sm"
                        variant="outline"
                      >
                        <Link to={`/benchmarks/comparison/${selectedStartupId}`}>
                          View Detailed Comparison
                        </Link>
                      </Button>
                    </div>

                    {/* Metrics Comparison */}
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Market Penetration Comparison */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Market Penetration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Your Startup</span>
                            <span className={`font-medium ${getComparisonColor(selectedAnalysisData.analysis.metrics.marketSize, benchmarkMetrics.marketPenetration.value)}`}>
                              {selectedAnalysisData.analysis.metrics.marketSize} {getComparisonIcon(selectedAnalysisData.analysis.metrics.marketSize, benchmarkMetrics.marketPenetration.value)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Market Average</span>
                            <span className="font-medium">{benchmarkMetrics.marketPenetration.value}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Difference: {Math.abs(selectedAnalysisData.analysis.metrics.marketSize - benchmarkMetrics.marketPenetration.value).toFixed(1)} points
                          </div>
                        </CardContent>
                      </Card>

                      {/* Team Experience Comparison */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Team Experience</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Your Startup</span>
                            <span className={`font-medium ${getComparisonColor(selectedAnalysisData.analysis.metrics.team, benchmarkMetrics.teamExperience.value)}`}>
                              {selectedAnalysisData.analysis.metrics.team} {getComparisonIcon(selectedAnalysisData.analysis.metrics.team, benchmarkMetrics.teamExperience.value)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Market Average</span>
                            <span className="font-medium">{benchmarkMetrics.teamExperience.value}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Difference: {Math.abs(selectedAnalysisData.analysis.metrics.team - benchmarkMetrics.teamExperience.value).toFixed(1)} points
                          </div>
                        </CardContent>
                      </Card>

                      {/* Product Quality Comparison */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Product Quality</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Your Startup</span>
                            <span className={`font-medium ${getComparisonColor(selectedAnalysisData.analysis.metrics.product, benchmarkMetrics.revenueGrowth.value)}`}>
                              {selectedAnalysisData.analysis.metrics.product} {getComparisonIcon(selectedAnalysisData.analysis.metrics.product, benchmarkMetrics.revenueGrowth.value)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Market Average</span>
                            <span className="font-medium">{benchmarkMetrics.revenueGrowth.value}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Difference: {Math.abs(selectedAnalysisData.analysis.metrics.product - benchmarkMetrics.revenueGrowth.value).toFixed(1)} points
                          </div>
                        </CardContent>
                      </Card>

                      {/* Financial Performance Comparison */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Financial Performance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Your Startup</span>
                            <span className={`font-medium ${getComparisonColor(selectedAnalysisData.analysis.metrics.financials, benchmarkMetrics.burnRateEfficiency.value)}`}>
                              {selectedAnalysisData.analysis.metrics.financials} {getComparisonIcon(selectedAnalysisData.analysis.metrics.financials, benchmarkMetrics.burnRateEfficiency.value)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Market Average</span>
                            <span className="font-medium">{benchmarkMetrics.burnRateEfficiency.value}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Difference: {Math.abs(selectedAnalysisData.analysis.metrics.financials - benchmarkMetrics.burnRateEfficiency.value).toFixed(1)} points
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Overall Score Comparison */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Overall Performance Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Your Startup Score</span>
                              <span className={`text-2xl font-bold ${getComparisonColor(selectedAnalysisData.analysis.overallScore, 75)}`}>
                                {selectedAnalysisData.analysis.overallScore}/100
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${selectedAnalysisData.analysis.overallScore}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Market Average</span>
                              <span className="text-2xl font-bold text-muted-foreground">75/100</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-muted-foreground h-2 rounded-full" 
                                style={{ width: '75%' }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            <strong>Analysis:</strong> Your startup scores {selectedAnalysisData.analysis.overallScore > 75 ? 'above' : selectedAnalysisData.analysis.overallScore < 75 ? 'below' : 'at'} the market average. 
                            {selectedAnalysisData.analysis.overallScore > 75 ? ' This indicates strong competitive positioning.' : 
                             selectedAnalysisData.analysis.overallScore < 75 ? ' Consider focusing on areas for improvement.' : 
                             ' You are performing at market standards.'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {selectedStartupId && !selectedAnalysisData && !analysisFetching && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No analysis data found for selected startup.</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {isCustomMode && (
            <Button 
              onClick={handleResetToDefault}
              variant="outline"
              size="sm"
            >
              Reset to Default
            </Button>
          )}
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing || currentLoading}
            variant="outline"
            size="sm"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh AI Data
          </Button>
        </div>
      </div>

      {/* Custom Benchmarks Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Custom Benchmark Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Industry Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Industries (Max 5)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {INDUSTRY_OPTIONS.map((industry) => (
                <Button
                  key={industry}
                  variant={selectedIndustries.includes(industry) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleIndustrySelect(industry)}
                  disabled={!selectedIndustries.includes(industry) && selectedIndustries.length >= 5}
                  className="justify-start"
                >
                  {industry}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Selected: {selectedIndustries.length}/5 industries
            </p>
          </div>

          {/* Company Size Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Company Size Category</Label>
            <RadioGroup value={companySize} onValueChange={setCompanySize} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {COMPANY_SIZE_OPTIONS.map((option) => {
                const IconComponent = option.icon
                return (
                  <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">{option.employeeRange}</div>
                        </div>
                      </div>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleGenerateCustom}
              disabled={selectedIndustries.length === 0 || customLoading}
              className="min-w-[200px]"
            >
              {customLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Filter className="h-4 w-4 mr-2" />
                  Generate Custom Benchmarks
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Industry Overview Cards */}
      {currentLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="h-6 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-12 animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-12 animate-pulse"></div>
                </div>
                <div className="space-y-1">
                  <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                </div>
                <div className="h-6 bg-muted rounded w-16 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : currentError ? (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Target className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Failed to load benchmarks</h3>
          <p className="text-muted-foreground mb-4">
            Unable to generate industry benchmark data. Please try again.
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {currentBenchmarks.map((industry) => {
            const portfolioMetrics = calculatePortfolioMetricsByIndustry(industry.industry)
            const marketScore = industry?.avgScore?.toFixed(2)
            const portfolioScore = portfolioMetrics?.avgScore?.toFixed(2)
            const scoreDifference = portfolioScore ? +portfolioScore - +marketScore : 0
            
            return (
              <Card key={industry.industry} data-testid={`industry-card-${industry.industry.toLowerCase()}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{industry.industry}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Market vs Portfolio Comparison */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Market Avg</span>
                      <span className="font-medium">{marketScore}</span>
                    </div>
                    {portfolioMetrics ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Your Portfolio</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{portfolioScore}</span>
                            {scoreDifference > 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : scoreDifference < 0 ? (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            ) : (
                              <div className="h-3 w-3 rounded-full bg-gray-400" />
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {scoreDifference > 0 ? `+${scoreDifference} above market` : 
                           scoreDifference < 0 ? `${scoreDifference} below market` : 
                           'At market average'}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        No analyzed startups in this industry
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Market Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Market Companies</span>
                      <span className="font-medium">{industry.companies}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Top Performer</span>
                      <p className="font-medium text-sm">{industry.topPerformer}</p>
                    </div>
                    <Badge 
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                    >
                      {industry.growth}
                    </Badge>
                  </div>
                  
                  {/* Portfolio Count */}
                  {portfolioMetrics && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Your Startups</span>
                        <Badge variant="outline">{portfolioMetrics.count}</Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}


      {/* Detailed Benchmarks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Detailed Benchmark Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {currentBenchmarks.map((industry) => (
              <div key={industry.industry} className="border-b pb-4 last:border-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{industry.industry}</h3>
                  <Badge variant="outline">{industry.companies} companies</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Avg Score: {industry?.avgScore?.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Leader: {industry.topPerformer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Growth: {industry.growth}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}