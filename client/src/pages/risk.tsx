import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RiskFlags } from "@/components/risk-flags"
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react"
import type { RiskFlag } from "@shared/schema"

// todo: remove mock data
const mockRiskFlags: RiskFlag[] = [
  {
    type: 'high',
    category: 'Competition',
    description: 'Large tech companies entering space',
    impact: 'Significant competitive pressure expected'
  },
  {
    type: 'medium',
    category: 'Financial',
    description: 'Burn rate higher than industry average',
    impact: 'Potential runway concerns if growth doesn\'t accelerate'
  },
  {
    type: 'medium',
    category: 'Regulatory',
    description: 'Pending regulation changes in target market',
    impact: 'May require product adjustments'
  },
  {
    type: 'low',
    category: 'Market',
    description: 'Growing market with limited direct competition',
    impact: 'Positive market dynamics favor early expansion'
  },
  {
    type: 'low',
    category: 'Technology',
    description: 'Strong IP portfolio and technical moat',
    impact: 'Defensible technology position'
  }
]

export default function RiskPage() {
  const highRisks = mockRiskFlags.filter(r => r.type === 'high').length
  const mediumRisks = mockRiskFlags.filter(r => r.type === 'medium').length
  const lowRisks = mockRiskFlags.filter(r => r.type === 'low').length

  return (
    <div className="space-y-6" data-testid="risk-page-main">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Risk Assessment</h1>
        <p className="text-muted-foreground">
          Comprehensive risk analysis across all portfolio companies
        </p>
      </div>

      {/* Risk Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{highRisks}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{mediumRisks}</div>
            <p className="text-xs text-muted-foreground">
              Monitor closely
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Risk</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{lowRisks}</div>
            <p className="text-xs text-muted-foreground">
              Within acceptable range
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Detailed Risk Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RiskFlags risks={mockRiskFlags} />
        </CardContent>
      </Card>
    </div>
  )
}