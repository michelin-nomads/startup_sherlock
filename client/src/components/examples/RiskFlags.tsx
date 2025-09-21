import { RiskFlags } from '../risk-flags'
import type { RiskFlag } from "@shared/schema"

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
    type: 'low',
    category: 'Market',
    description: 'Growing market with limited direct competition',
    impact: 'Positive market dynamics favor early expansion'
  }
]

export default function RiskFlagsExample() {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Risk Assessment</h3>
      <div className="max-w-md">
        <RiskFlags risks={mockRiskFlags} />
      </div>
    </div>
  )
}