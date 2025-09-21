import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface MetricsCardProps {
  title: string
  value: number
  maxValue?: number
  description?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  category?: 'primary' | 'success' | 'warning' | 'danger'
}

export function MetricsCard({ 
  title, 
  value, 
  maxValue = 100, 
  description, 
  trend = 'neutral',
  trendValue,
  category = 'primary'
}: MetricsCardProps) {
  const percentage = (value / maxValue) * 100

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />
    }
  }

  const getCategoryColor = () => {
    switch (category) {
      case 'success':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'danger':
        return 'bg-red-500'
      default:
        return 'bg-primary'
    }
  }

  return (
    <Card data-testid={`metrics-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{value.toFixed(1)}</span>
            {trendValue && (
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span className="text-xs text-muted-foreground">{trendValue}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={percentage} 
              className="h-2"
              data-testid={`progress-${title.toLowerCase().replace(/\s+/g, '-')}`}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Score: {value.toFixed(1)}</span>
              <span>Max: {maxValue}</span>
            </div>
          </div>

          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}

          <Badge 
            variant={category === 'primary' ? 'default' : 'secondary'}
            className={`text-xs ${getCategoryColor()}`}
            data-testid={`badge-${category}`}
          >
            {percentage >= 80 ? 'Excellent' : 
             percentage >= 60 ? 'Good' : 
             percentage >= 40 ? 'Average' : 'Needs Improvement'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}