import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts"

interface AvgMetricsRadarChartProps {
  data: Array<{ metric: string; value: number; fullMark: number }>
  avgScore: number
}

export function AvgMetricsRadarChart({ data, avgScore }: AvgMetricsRadarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Average Metrics</CardTitle>
        <p className="text-sm text-muted-foreground">
          Portfolio strengths across 6 metrics • Avg: {avgScore}
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data}>
            <PolarGrid className="stroke-muted" />
            <PolarAngleAxis dataKey="metric" className="text-xs" />
            <PolarRadiusAxis className="text-xs" angle={90} domain={[0, 100]} />
            <Radar 
              name="Portfolio Average" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              fill="hsl(var(--primary))" 
              fillOpacity={0.5} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))' 
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

