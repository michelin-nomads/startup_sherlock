import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Button } from "@/components/ui/button"

// todo: remove mock data
const mockBarData = [
  { name: 'Market Size', score: 85.2, benchmark: 72.1 },
  { name: 'Team', score: 91.5, benchmark: 78.3 },
  { name: 'Traction', score: 72.8, benchmark: 69.5 },
  { name: 'Product', score: 68.3, benchmark: 74.2 },
  { name: 'Financials', score: 54.7, benchmark: 61.8 },
  { name: 'Competition', score: 77.9, benchmark: 70.4 }
]

const mockTrendData = [
  { month: 'Jan', score: 65.2 },
  { month: 'Feb', score: 68.1 },
  { month: 'Mar', score: 71.3 },
  { month: 'Apr', score: 74.8 },
  { month: 'May', score: 72.1 },
  { month: 'Jun', score: 76.5 }
]

export function StartupChart() {
  const [chartType, setChartType] = useState<'bar' | 'trend'>('bar')

  const handleChartTypeChange = (type: 'bar' | 'trend') => {
    console.log(`Chart type changed to: ${type}`)
    setChartType(type)
  }

  return (
    <div className="space-y-4" data-testid="startup-chart-container">
      <div className="flex items-center gap-2">
        <Button
          variant={chartType === 'bar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleChartTypeChange('bar')}
          data-testid="button-chart-bar"
        >
          Metrics Comparison
        </Button>
        <Button
          variant={chartType === 'trend' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleChartTypeChange('trend')}
          data-testid="button-chart-trend"
        >
          Trend Analysis
        </Button>
      </div>

      <div className="h-64 w-full">
        {chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar 
                dataKey="score" 
                fill="hsl(var(--primary))" 
                name="Current Score"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="benchmark" 
                fill="hsl(var(--muted))" 
                name="Industry Benchmark"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                name="Overall Score"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}