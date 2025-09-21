import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import type { RiskFlag } from "@shared/schema"

interface RiskFlagsProps {
  risks: RiskFlag[]
}

export function RiskFlags({ risks }: RiskFlagsProps) {
  const getRiskIcon = (type: RiskFlag['type']) => {
    switch (type) {
      case 'high':
        return <XCircle className="h-3 w-3 text-red-500" />
      case 'medium':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />
      case 'low':
        return <CheckCircle className="h-3 w-3 text-green-500" />
    }
  }

  const getRiskVariant = (type: RiskFlag['type']) => {
    switch (type) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'default'
      default:
        return 'secondary'
    }
  }

  if (risks.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
        <p className="text-sm">No significant risks detected</p>
      </div>
    )
  }

  return (
    <div className="space-y-3" data-testid="risk-flags-container">
      {risks.map((risk, index) => (
        <div 
          key={index} 
          className="space-y-2 p-3 rounded-md border"
          data-testid={`risk-flag-${index}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getRiskIcon(risk.type)}
              <span className="font-medium text-sm">{risk.category}</span>
            </div>
            <Badge 
              variant={getRiskVariant(risk.type)}
              className="text-xs"
              data-testid={`risk-badge-${risk.type}`}
            >
              {risk.type.toUpperCase()}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-foreground">{risk.description}</p>
            <p className="text-xs text-muted-foreground">{risk.impact}</p>
          </div>
        </div>
      ))}
    </div>
  )
}