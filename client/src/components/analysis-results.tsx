import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetricsCard } from "./metrics-card"
import { RiskFlags } from "./risk-flags"
import { StartupChart } from "./startup-chart"
import { Progress } from "@/components/ui/progress"
import { Download, Share, TrendingUp, AlertTriangle, Target, Users } from "lucide-react"
import type { StartupAnalysis, StartupMetrics, RiskFlag } from "@shared/schema"

// todo: remove mock data
const mockAnalysis: StartupAnalysis = {
  startup: {
    id: '1',
    name: 'TechFlow AI',
    industry: 'Artificial Intelligence',
    stage: 'Series A',
    foundedYear: 2022,
    location: 'San Francisco, CA',
    description: 'AI-powered workflow automation platform for enterprise customers',
    websiteUrl: 'https://techflow.ai',
    overallScore: 84.5,
    riskLevel: 'Medium',
    recommendation: 'Strong Buy',
    analysisData: {},
    createdAt: new Date(),
    updatedAt: new Date()
  },
  metrics: {
    marketSize: 85.2,
    traction: 72.8,
    team: 91.5,
    product: 68.3,
    financials: 54.7,
    competition: 77.9,
  },
  riskFlags: [
    {
      type: 'medium',
      category: 'Financial',
      description: 'Burn rate higher than industry average',
      impact: 'Potential runway concerns if growth doesn\'t accelerate'
    },
    {
      type: 'low',
      category: 'Market',
      description: 'Growing market with limited direct competition',
      impact: 'Positive market dynamics favor early expansion'
    },
    {
      type: 'high',
      category: 'Competition',
      description: 'Large tech companies entering space',
      impact: 'Significant competitive pressure expected'
    }
  ],
  benchmarkData: {},
  keyInsights: [
    'Strong technical team with proven AI expertise',
    'Early customer traction showing product-market fit',
    'Scalable business model with recurring revenue',
    'Market timing favorable for AI automation solutions'
  ],
  investmentRecommendation: {
    decision: 'strong_buy',
    reasoning: 'Exceptional team, growing market, solid early traction with manageable risks',
    targetInvestment: 5000000,
    expectedReturn: 8.5
  }
}

export function AnalysisResults() {
  const [selectedTab, setSelectedTab] = useState('overview')

  const handleTabChange = (tab: string | null) => {
    if (tab) {
      console.log(`Tab changed to: ${tab}`)
      setSelectedTab(tab)
    }
  }

  const handleExport = () => {
    console.log('Exporting analysis report...')
  }

  const handleShare = () => {
    console.log('Sharing analysis...')
  }

  const getRecommendationColor = (decision: string) => {
    switch (decision) {
      case 'strong_buy':
        return 'bg-green-600 text-white'
      case 'buy':
        return 'bg-green-500 text-white'
      case 'hold':
        return 'bg-yellow-500 text-black'
      case 'pass':
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6" data-testid="analysis-results-main">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{mockAnalysis.startup.name}</h1>
          <p className="text-muted-foreground">
            {mockAnalysis.startup.industry} • {mockAnalysis.startup.stage} • {mockAnalysis.startup.location}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleShare} data-testid="button-share">
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button onClick={handleExport} data-testid="button-export">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overall Score */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {mockAnalysis.startup.overallScore}
              </div>
              <p className="text-sm text-muted-foreground">Overall Score</p>
              <Progress 
                value={mockAnalysis.startup.overallScore} 
                className="mt-2"
                data-testid="progress-overall-score"
              />
            </div>
            
            <div className="text-center">
              <Badge 
                className={`text-base px-4 py-2 ${getRecommendationColor(mockAnalysis.investmentRecommendation.decision)}`}
                data-testid="badge-recommendation"
              >
                {mockAnalysis.investmentRecommendation.decision.replace('_', ' ').toUpperCase()}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">Investment Recommendation</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                {formatCurrency(mockAnalysis.investmentRecommendation.targetInvestment)}
              </div>
              <p className="text-sm text-muted-foreground">Target Investment</p>
              <p className="text-xs text-muted-foreground mt-1">
                {mockAnalysis.investmentRecommendation.expectedReturn}x expected return
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics" data-testid="tab-metrics">Metrics</TabsTrigger>
          <TabsTrigger value="risks" data-testid="tab-risks">Risk Assessment</TabsTrigger>
          <TabsTrigger value="benchmarks" data-testid="tab-benchmarks">Benchmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {mockAnalysis.keyInsights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-sm">{insight}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Investment Thesis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{mockAnalysis.investmentRecommendation.reasoning}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Target Investment:</span>
                    <span className="font-mono">{formatCurrency(mockAnalysis.investmentRecommendation.targetInvestment)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expected Return:</span>
                    <span className="font-mono">{mockAnalysis.investmentRecommendation.expectedReturn}x</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Risk Level:</span>
                    <Badge variant="secondary">{mockAnalysis.startup.riskLevel}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Company Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Founded</p>
                    <p className="font-medium">{mockAnalysis.startup.foundedYear}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stage</p>
                    <p className="font-medium">{mockAnalysis.startup.stage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <a 
                      href={mockAnalysis.startup.websiteUrl} 
                      className="text-primary hover:underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {mockAnalysis.startup.websiteUrl}
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm">{mockAnalysis.startup.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MetricsCard
              title="Market Size"
              value={mockAnalysis.metrics.marketSize}
              description="Total addressable market assessment"
              trend="up"
              trendValue="+8.2%"
              category="success"
            />
            <MetricsCard
              title="Team Quality"
              value={mockAnalysis.metrics.team}
              description="Founder and team experience evaluation"
              trend="up"
              trendValue="+12.1%"
              category="success"
            />
            <MetricsCard
              title="Traction"
              value={mockAnalysis.metrics.traction}
              description="User growth and market validation"
              trend="up"
              trendValue="+5.3%"
              category="primary"
            />
            <MetricsCard
              title="Product"
              value={mockAnalysis.metrics.product}
              description="Product-market fit and innovation"
              trend="neutral"
              trendValue="0%"
              category="warning"
            />
            <MetricsCard
              title="Financials"
              value={mockAnalysis.metrics.financials}
              description="Revenue model and unit economics"
              trend="down"
              trendValue="-2.1%"
              category="warning"
            />
            <MetricsCard
              title="Competition"
              value={mockAnalysis.metrics.competition}
              description="Competitive advantage assessment"
              trend="up"
              trendValue="+3.7%"
              category="primary"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <StartupChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RiskFlags risks={mockAnalysis.riskFlags} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Industry Benchmarks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Comparing against {mockAnalysis.startup.industry} industry standards
              </p>
              <StartupChart />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}