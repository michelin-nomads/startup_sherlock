import { MetricsCard } from '../metrics-card'

export default function MetricsCardExample() {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Metrics Cards</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricsCard
          title="Market Size"
          value={85.2}
          description="Total addressable market assessment"
          trend="up"
          trendValue="+8.2%"
          category="success"
        />
        <MetricsCard
          title="Team Quality"
          value={91.5}
          description="Founder and team experience evaluation"
          trend="up"
          trendValue="+12.1%"
          category="success"
        />
        <MetricsCard
          title="Financials"
          value={54.7}
          description="Revenue model and unit economics"
          trend="down"
          trendValue="-2.1%"
          category="warning"
        />
      </div>
    </div>
  )
}