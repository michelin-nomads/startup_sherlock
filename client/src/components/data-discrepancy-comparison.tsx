import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, GitCompare } from "lucide-react"
import { useState } from "react"

interface ComparisonProps {
  documentData: any
  publicData: any
}

export function DataDiscrepancyComparison({ documentData, publicData }: ComparisonProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Transform public data if it has the synthesizedInsights structure
  let pubAnalysis = publicData
  if (publicData?.analysisData?.publicSourceDueDiligence?.synthesizedInsights?.data) {
    const synthData = publicData.analysisData.publicSourceDueDiligence.synthesizedInsights.data
    const riskData = synthData.risk_and_investment_rationale || {}
    
    pubAnalysis = {
      overallScore: riskData.investment_score || 0,
      metrics: {
        marketSize: synthData.market_analysis?.market_size_score || 0,
        traction: synthData.market_analysis?.market_position_score || 0,
        team: synthData.team_assessment?.overall_team_score || 0,
        product: synthData.product_and_technology?.product_assessment_score || 0,
        financials: synthData.financial_health?.financial_health_score || 0,
        competition: synthData.competitive_landscape?.competitive_position_score || 0
      },
      riskLevel: riskData.risk_level || 'Unknown',
      recommendation: {
        decision: riskData.investment_recommendation || 'Unknown'
      }
    }
  }

  // Check if we have sufficient data
  const hasDocData = documentData?.analysisData?.overallScore != null
  const hasPubData = pubAnalysis?.overallScore != null || 
                     pubAnalysis?.analysisData?.overallScore != null

  if (!hasDocData || !hasPubData) {
    return (
      <Card>
        <details className="group" open={isOpen} onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}>
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-orange-500" />
              <span className="font-semibold">Data Comparison (Document vs Public)</span>
            </div>
            <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </summary>
          <CardContent className="pt-4">
            <p className="text-muted-foreground text-center py-8">
              Insufficient data for comparison. Please ensure both document analysis and public data research have been completed.
            </p>
          </CardContent>
        </details>
      </Card>
    )
  }

  // Extract scores
  const docScore = documentData.analysisData?.overallScore || documentData.overallScore || 0
  const pubScore = pubAnalysis.analysisData?.overallScore || pubAnalysis.overallScore || 0
  const scoreDiff = Math.abs(docScore - pubScore)

  // Extract metrics
  const docMetrics = documentData.analysisData?.metrics || documentData.metrics || {}
  const pubMetrics = pubAnalysis.analysisData?.metrics || pubAnalysis.metrics || {}

  // Extract risk levels
  const docRisk = documentData.analysisData?.riskLevel || documentData.riskLevel || 'Unknown'
  const pubRisk = pubAnalysis.analysisData?.riskLevel || pubAnalysis.riskLevel || 'Unknown'

  // Extract recommendations
  const docRec = documentData.analysisData?.recommendation?.decision || 
                 documentData.recommendation?.decision || 
                 documentData.recommendation || 'Unknown'
  const pubRec = pubAnalysis.analysisData?.recommendation?.decision || 
                 pubAnalysis.recommendation?.decision || 
                 pubAnalysis.recommendation || 'Unknown'

  // Severity calculation
  const getSeverity = (diff: number): { color: string; label: string } => {
    if (diff <= 10) return { color: "text-green-600", label: "Aligned" }
    if (diff <= 25) return { color: "text-yellow-600", label: "Minor Gap" }
    return { color: "text-red-600", label: "Significant Gap" }
  }

  const scoreGap = getSeverity(scoreDiff)

  const metricComparisons = [
    { key: 'marketSize', label: 'Market Size' },
    { key: 'traction', label: 'Traction' },
    { key: 'team', label: 'Team' },
    { key: 'product', label: 'Product' },
    { key: 'financials', label: 'Financials' },
    { key: 'competition', label: 'Competition' }
  ]

  return (
    <Card>
      <details className="group" open={isOpen} onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}>
        <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-orange-500" />
            <span className="font-semibold">Data Comparison (Document vs Public)</span>
            <Badge variant="outline" className="ml-2">
              {scoreDiff.toFixed(0)} pts difference
            </Badge>
          </div>
          <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </summary>
        
        <CardContent className="pt-4 space-y-6">
          {/* Overall Score Comparison */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Overall Score</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Document Analysis</p>
                <p className="text-2xl font-bold">{docScore}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Public Data</p>
                <p className="text-2xl font-bold">{pubScore}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Difference</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${scoreGap.color}`}>
                    {scoreDiff.toFixed(0)}
                  </p>
                  <Badge variant="outline" className={scoreGap.color}>
                    {scoreGap.label}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Comparison */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Metrics Breakdown</h4>
            <div className="space-y-2">
              {metricComparisons.map(({ key, label }) => {
                const docVal = docMetrics[key] || 0
                const pubVal = pubMetrics[key] || 0
                const diff = Math.abs(docVal - pubVal)
                const gap = getSeverity(diff)
                
                return (
                  <div key={key} className="grid grid-cols-4 gap-4 items-center py-2 border-b last:border-b-0">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-sm text-center">{docVal}</p>
                    <p className="text-sm text-center">{pubVal}</p>
                    <div className="flex items-center justify-end gap-2">
                      <p className={`text-sm font-medium ${gap.color}`}>
                        {diff.toFixed(0)}
                      </p>
                      <Badge variant="outline" className={`text-xs ${gap.color}`}>
                        {gap.label}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="grid grid-cols-4 gap-4 pt-2 text-xs text-muted-foreground font-medium">
              <p>Metric</p>
              <p className="text-center">Document</p>
              <p className="text-center">Public</p>
              <p className="text-right">Gap</p>
            </div>
          </div>

          {/* Risk Level Comparison */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Risk Assessment</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Document Analysis</p>
                <Badge 
                  variant={docRisk === 'Low' ? 'default' : docRisk === 'High' ? 'destructive' : 'secondary'}
                >
                  {docRisk}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Public Data</p>
                <Badge 
                  variant={pubRisk === 'Low' ? 'default' : pubRisk === 'High' ? 'destructive' : 'secondary'}
                >
                  {pubRisk}
                </Badge>
              </div>
            </div>
          </div>

          {/* Recommendation Comparison */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Investment Recommendation</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Document Analysis</p>
                <Badge variant="outline" className="capitalize">
                  {String(docRec).replace('_', ' ')}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Public Data</p>
                <Badge variant="outline" className="capitalize">
                  {String(pubRec).replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>

          {/* Summary note */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Discrepancies may indicate areas requiring further investigation or 
              reflect different data sources and methodologies. Significant gaps should be reviewed carefully.
            </p>
          </div>
        </CardContent>
      </details>
    </Card>
  )
}

