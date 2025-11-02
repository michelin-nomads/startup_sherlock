import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, ArrowLeft, RefreshCw, Building2, Users, DollarSign, 
  TrendingUp, AlertTriangle, Target, Award, ThumbsUp, ThumbsDown,
  ExternalLink, Clock, CheckCircle2, XCircle, AlertCircle,
  BarChart3, PieChart, LineChart, Globe, MapPin, Calendar,
  Briefcase, FileText, Eye, MessageSquare
} from 'lucide-react';
import { getApiUrl } from '@/lib/config';
import { authenticatedFetchJSON } from '@/lib/api';

interface DueDiligenceData {
  companyOverview: any;
  teamAndLeadership: any;
  corporateStructure: any;
  employeeMetrics: any;
  fundingHistory: any;
  financialHealth: any;
  marketPosition: any;
  competitorAnalysis: any;
  recentDevelopments: any;
  growthTrajectory: any;
  riskAnalysis: any;
  investmentRationale: any;
  ipoAnalysis: any;
  employeeSatisfaction: any;
  customerFeedback: any;
  needToAsk: string[];
  recommendations: string[];
  metadata: any;
}

export default function PublicDataAnalysisPage() {
  const { startupId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [conducting, setConducting] = useState(false);
  const [data, setData] = useState<DueDiligenceData | null>(null);
  const [docData, setDocData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [startupName, setStartupName] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (startupId) {
      fetchDueDiligence();
    }
  }, [startupId]);

  const fetchDueDiligence = async (skipLoadingState = false) => {
    if (!skipLoadingState) {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await authenticatedFetchJSON(getApiUrl(`api/due-diligence/${startupId}`));
      setData(result.dueDiligence);
      setDocData(result.documentAnalysis);
      setStartupName(result.startupName);
      
      // Increment refresh key to ensure proper rendering
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (!skipLoadingState) {
        setLoading(false);
      }
    }
  };

  const conductDueDiligence = async () => {
    setConducting(true);
    setError(null);

    try {
      // Get the result directly from the POST response
      const result = await authenticatedFetchJSON(getApiUrl(`api/due-diligence/${startupId}`), {
        method: 'POST',
      });
      
      // Update the state with the new data immediately
      setData(result.dueDiligence);
      setDocData(result.documentAnalysis);
      setStartupName(result.startupName);
      setError(null);
      
      // Increment refresh key to force re-render
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setConducting(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading due diligence data...</p>
        </div>
      </div>
    );
  }

  if (error === 'no_data') {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Public Source Due Diligence</CardTitle>
            <CardDescription>
              No public source research has been conducted for this startup yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the button below to conduct comprehensive research from public sources including
              Crunchbase, TechCrunch, Forbes, LinkedIn, and more.
            </p>
            <Button 
              onClick={() => conductDueDiligence()}
              disabled={conducting}
              size="lg"
            >
              {conducting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conducting Due Diligence...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Conduct Public Source Due Diligence
                </>
              )}
            </Button>
            {conducting && (
              <p className="text-xs text-muted-foreground">
                This may take 30-60 seconds. We're searching multiple sources...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-red-700">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchDueDiligence()}
                  className="mt-4"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-3xl font-bold">{startupName}</h1>
          <p className="text-muted-foreground">Public Source Due Diligence Report</p>
        </div>
        <Button onClick={() => conductDueDiligence()} disabled={conducting}>
          {conducting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </>
          )}
        </Button>
      </div>

      {/* Metadata Card - Research Confidence */}
      <Card className={`border-2 ${getConfidenceColor(data.metadata.overallConfidence)}`}>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5" />
                <p className="font-semibold">Overall Confidence</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold">{data.metadata.overallConfidence}%</div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getConfidenceBadge(data.metadata.overallConfidence)}`}
                      style={{ width: `${data.metadata.overallConfidence}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5" />
                <p className="font-semibold">Research Time</p>
              </div>
              <p className="text-2xl font-bold">{data.metadata.timeTakenSeconds}s</p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5" />
                <p className="font-semibold">Sources Used</p>
              </div>
              <p className="text-2xl font-bold">{data.metadata.sources.length}</p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5" />
                <p className="font-semibold">Data Quality</p>
              </div>
              <Badge className="text-sm">{data.metadata.dataQuality}</Badge>
            </div>
          </div>

          {data.metadata.prioritySources.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-semibold mb-2">Priority Sources:</p>
              <div className="flex flex-wrap gap-2">
                {data.metadata.prioritySources.map((source: string) => (
                  <Badge key={source} variant="outline">
                    {source}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs key={refreshKey} defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="comparison">Compare</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Company Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Overview
                <Badge className="ml-auto">{data.companyOverview.confidence}% confident</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Sector</p>
                  <p className="font-semibold">{data.companyOverview.sector || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Industry</p>
                  <p className="font-semibold">{data.companyOverview.industry || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Founded</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {data.companyOverview.foundedYear || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Headquarters</p>
                  <p className="font-semibold flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {data.companyOverview.headquarters || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="text-sm">{data.companyOverview.description || 'N/A'}</p>
              </div>

              {data.companyOverview.founders && data.companyOverview.founders.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Founders</p>
                  <div className="flex flex-wrap gap-2">
                    {data.companyOverview.founders.map((founder: string) => (
                      <Badge key={founder} variant="secondary">
                        {founder}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {data.companyOverview.otherLocations && data.companyOverview.otherLocations.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Other Locations</p>
                  <p className="text-sm">{data.companyOverview.otherLocations.join(', ')}</p>
                </div>
              )}

              {data.companyOverview.website && (
                <div>
                  <a 
                    href={data.companyOverview.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {data.companyOverview.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Developments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent News & Developments
                <Badge className="ml-auto">{data.recentDevelopments.confidence}% confident</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.recentDevelopments.recentNews && data.recentDevelopments.recentNews.length > 0 ? (
                <div className="space-y-3">
                  {data.recentDevelopments.recentNews.slice(0, 5).map((news: any, i: number) => (
                    <div key={i} className="border-l-2 border-primary pl-4 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm">{news.title}</p>
                        <Badge 
                          variant={news.sentiment === 'positive' ? 'default' : news.sentiment === 'negative' ? 'destructive' : 'secondary'}
                          className="shrink-0"
                        >
                          {news.sentiment}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{news.summary}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{news.date}</span>
                        <span>•</span>
                        <span>{news.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent news available</p>
              )}

              {(data.recentDevelopments.productLaunches?.length > 0 ||
                data.recentDevelopments.partnerships?.length > 0 ||
                data.recentDevelopments.awards?.length > 0) && (
                <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                  {data.recentDevelopments.productLaunches?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Product Launches</p>
                      <ul className="text-sm space-y-1">
                        {data.recentDevelopments.productLaunches.map((item: string, i: number) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.recentDevelopments.partnerships?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Partnerships</p>
                      <ul className="text-sm space-y-1">
                        {data.recentDevelopments.partnerships.map((item: string, i: number) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.recentDevelopments.awards?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Awards</p>
                      <ul className="text-sm space-y-1">
                        {data.recentDevelopments.awards.map((item: string, i: number) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Investment Rationale */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <ThumbsUp className="h-5 w-5" />
                  Why Invest
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.investmentRationale.whyInvest?.map((reason: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <ThumbsDown className="h-5 w-5" />
                  Why Not Invest
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.investmentRationale.whyNotInvest?.map((reason: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value="financials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Funding History
                <Badge className="ml-auto">{data.fundingHistory.confidence}% confident</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Funding</p>
                  <p className="text-2xl font-bold">{data.fundingHistory.totalFunding || 'N/A'}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Current Valuation</p>
                  <p className="text-2xl font-bold">{data.fundingHistory.valuation || 'N/A'}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Last Round</p>
                  <p className="text-xl font-bold">{data.fundingHistory.lastRoundType || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">{data.fundingHistory.lastRoundAmount}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Last Round Date</p>
                  <p className="text-xl font-bold">{data.fundingHistory.lastRoundDate || 'N/A'}</p>
                </div>
              </div>

              {data.fundingHistory.rounds && data.fundingHistory.rounds.length > 0 && (
                <div>
                  <p className="font-semibold mb-3">Funding Rounds</p>
                  <div className="space-y-3">
                    {data.fundingHistory.rounds.map((round: any, i: number) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">{round.round}</Badge>
                          <span className="font-bold">{round.amount}</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <p><span className="text-muted-foreground">Date:</span> {round.date}</p>
                          {round.valuation && <p><span className="text-muted-foreground">Valuation:</span> {round.valuation}</p>}
                          {round.leadInvestors && round.leadInvestors.length > 0 && (
                            <p><span className="text-muted-foreground">Lead Investors:</span> {round.leadInvestors.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                {data.fundingHistory.currentInvestors && data.fundingHistory.currentInvestors.length > 0 && (
                  <div>
                    <p className="font-semibold mb-3">Current Investors</p>
                    <div className="space-y-2">
                      {data.fundingHistory.currentInvestors.map((investor: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{investor.name}</span>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">{investor.type}</Badge>
                            {investor.notable && <Badge className="text-xs">Notable</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.fundingHistory.pastInvestors && data.fundingHistory.pastInvestors.length > 0 && (
                  <div>
                    <p className="font-semibold mb-3">Past Investors (Exited)</p>
                    <div className="space-y-2">
                      {data.fundingHistory.pastInvestors.map((investor: any, i: number) => (
                        <div key={i} className="p-2 border rounded">
                          <p className="text-sm font-medium">{investor.name}</p>
                          <p className="text-xs text-muted-foreground">Exit: {investor.exitDate}</p>
                          <p className="text-xs text-muted-foreground">Reason: {investor.exitReason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Financial Health
                <Badge className="ml-auto">{data.financialHealth.confidence}% confident</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">{data.financialHealth.revenue || 'N/A'}</p>
                  <p className="text-sm text-green-600">{data.financialHealth.revenueGrowth}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Profitability</p>
                  <p className="text-lg font-bold">{data.financialHealth.profitability || 'N/A'}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Burn Rate</p>
                  <p className="text-lg font-bold">{data.financialHealth.burnRate || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">Runway: {data.financialHealth.runway}</p>
                </div>
              </div>

              {data.financialHealth.revenueHistory && data.financialHealth.revenueHistory.length > 0 && (
                <div>
                  <p className="font-semibold mb-3">Revenue History</p>
                  <div className="space-y-2">
                    {data.financialHealth.revenueHistory.map((year: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded">
                        <span className="font-medium">{year.year}</span>
                        <div className="text-right">
                          <p className="font-bold">{year.revenue}</p>
                          <p className="text-sm text-green-600">{year.growth} growth</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.financialHealth.keyMetrics && data.financialHealth.keyMetrics.length > 0 && (
                <div>
                  <p className="font-semibold mb-3">Key Metrics</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {data.financialHealth.keyMetrics.map((metric: any, i: number) => (
                      <div key={i} className="p-3 border rounded">
                        <p className="text-sm text-muted-foreground">{metric.metric}</p>
                        <p className="font-bold">{metric.value}</p>
                        <p className="text-xs text-muted-foreground">{metric.trend}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Tab */}
        <TabsContent value="market" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Market Position
                <Badge className="ml-auto">{data.marketPosition.confidence}% confident</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Market Size (TAM)</p>
                  <p className="text-2xl font-bold">{data.marketPosition.marketSize || 'N/A'}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Market Share</p>
                  <p className="text-2xl font-bold">{data.marketPosition.marketShare || 'N/A'}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Market Ranking</p>
                  <p className="text-2xl font-bold">{data.marketPosition.ranking || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Positioning</p>
                <p className="text-sm">{data.marketPosition.positioning || 'N/A'}</p>
              </div>

              {data.marketPosition.competitiveAdvantages && data.marketPosition.competitiveAdvantages.length > 0 && (
                <div>
                  <p className="font-semibold mb-2">Competitive Advantages</p>
                  <ul className="space-y-1">
                    {data.marketPosition.competitiveAdvantages.map((adv: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.marketPosition.marketTrends && data.marketPosition.marketTrends.length > 0 && (
                <div>
                  <p className="font-semibold mb-2">Market Trends</p>
                  <div className="space-y-2">
                    {data.marketPosition.marketTrends.map((trend: string, i: number) => (
                      <div key={i} className="p-2 border-l-2 border-primary pl-3 text-sm">
                        {trend}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Competitor Analysis
                <Badge className="ml-auto">{data.competitorAnalysis.confidence}% confident</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.competitorAnalysis.directCompetitors && data.competitorAnalysis.directCompetitors.length > 0 && (
                <div className="space-y-3">
                  {data.competitorAnalysis.directCompetitors.map((comp: any, i: number) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold">{comp.name}</h3>
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">Funding: {comp.funding}</p>
                          <p className="text-muted-foreground">Market Share: {comp.marketShare}</p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold text-green-700 mb-1">Strengths</p>
                          <ul className="text-sm space-y-1">
                            {comp.strengths?.map((s: string, j: number) => (
                              <li key={j}>• {s}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-red-700 mb-1">Weaknesses</p>
                          <ul className="text-sm space-y-1">
                            {comp.weaknesses?.map((w: string, j: number) => (
                              <li key={j}>• {w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {data.competitorAnalysis.competitiveComparison && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold mb-2">Overall Position</p>
                  <p className="text-sm">{data.competitorAnalysis.competitiveComparison.overallPosition}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team & Leadership
                <Badge className="ml-auto">{data.teamAndLeadership.confidence}% confident</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.teamAndLeadership.founders && data.teamAndLeadership.founders.length > 0 && (
                <div>
                  <p className="font-semibold mb-3">Founders</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {data.teamAndLeadership.founders.map((founder: any, i: number) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold">{founder.name}</p>
                            <p className="text-sm text-muted-foreground">{founder.role}</p>
                          </div>
                          {founder.linkedinUrl && (
                            <a 
                              href={founder.linkedinUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                        <p className="text-sm">{founder.background}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.teamAndLeadership.keyExecutives && data.teamAndLeadership.keyExecutives.length > 0 && (
                <div>
                  <p className="font-semibold mb-3">Key Executives</p>
                  <div className="space-y-2">
                    {data.teamAndLeadership.keyExecutives.map((exec: any, i: number) => (
                      <div key={i} className="p-3 border rounded">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{exec.name}</p>
                            <p className="text-sm text-muted-foreground">{exec.title}</p>
                          </div>
                          <Badge variant="outline">Joined {exec.joinedYear}</Badge>
                        </div>
                        <p className="text-sm mt-2">{exec.background}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.teamAndLeadership.boardMembers && data.teamAndLeadership.boardMembers.length > 0 && (
                <div>
                  <p className="font-semibold mb-3">Board Members</p>
                  <div className="grid md:grid-cols-3 gap-3">
                    {data.teamAndLeadership.boardMembers.map((member: any, i: number) => (
                      <div key={i} className="p-3 border rounded text-center">
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.company}</p>
                        <Badge variant="outline" className="mt-2 text-xs">{member.role}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.teamAndLeadership.teamSize && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Team Size</p>
                  <p className="text-2xl font-bold">{data.teamAndLeadership.teamSize} people</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Employee Metrics
                <Badge className="ml-auto">{data.employeeMetrics.confidence}% confident</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Employees</p>
                  <p className="text-3xl font-bold">{data.employeeMetrics.totalEmployees || 'N/A'}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Employee Growth</p>
                  <p className="text-xl font-bold">{data.employeeMetrics.employeeGrowth || 'N/A'}</p>
                </div>
              </div>

              {data.employeeMetrics.keyDepartments && data.employeeMetrics.keyDepartments.length > 0 && (
                <div>
                  <p className="font-semibold mb-3">Key Departments</p>
                  <div className="grid md:grid-cols-3 gap-3">
                    {data.employeeMetrics.keyDepartments.map((dept: any, i: number) => (
                      <div key={i} className="p-3 border rounded text-center">
                        <p className="font-semibold">{dept.department}</p>
                        <p className="text-2xl font-bold">{dept.size}</p>
                        <p className="text-xs text-muted-foreground">employees</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.employeeMetrics.hiringTrends && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold mb-2">Hiring Trends</p>
                  <p className="text-sm">{data.employeeMetrics.hiringTrends}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Analysis
                <Badge className="ml-auto">{data.riskAnalysis.confidence}% confident</Badge>
              </CardTitle>
              <CardDescription>
                Overall Risk Level: <Badge variant="outline" className="ml-2">{data.riskAnalysis.overallRiskLevel}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.riskAnalysis.highRisks && data.riskAnalysis.highRisks.length > 0 && (
                <div>
                  <p className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    High Risks
                  </p>
                  <div className="space-y-3">
                    {data.riskAnalysis.highRisks.map((risk: any, i: number) => (
                      <div key={i} className="p-4 border-2 border-red-200 bg-red-50 rounded-lg">
                        <p className="font-semibold text-red-900">{risk.risk}</p>
                        <p className="text-sm mt-2"><span className="font-semibold">Impact:</span> {risk.impact}</p>
                        <p className="text-sm mt-1"><span className="font-semibold">Mitigation:</span> {risk.mitigation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.riskAnalysis.mediumRisks && data.riskAnalysis.mediumRisks.length > 0 && (
                <div>
                  <p className="font-semibold text-yellow-700 mb-3">Medium Risks</p>
                  <div className="space-y-2">
                    {data.riskAnalysis.mediumRisks.map((risk: any, i: number) => (
                      <div key={i} className="p-3 border border-yellow-200 bg-yellow-50 rounded">
                        <p className="font-semibold">{risk.risk}</p>
                        <p className="text-sm text-muted-foreground mt-1">{risk.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.riskAnalysis.lowRisks && data.riskAnalysis.lowRisks.length > 0 && (
                <div>
                  <p className="font-semibold text-green-700 mb-2">Low Risks</p>
                  <ul className="space-y-1">
                    {data.riskAnalysis.lowRisks.map((risk: string, i: number) => (
                      <li key={i} className="text-sm">• {risk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Investment Recommendation
                <Badge className="ml-auto">{data.investmentRationale.confidence}% confident</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
                <p className="text-sm text-muted-foreground mb-1">Recommended Action</p>
                <p className="text-2xl font-bold">{data.investmentRationale.recommendedAction}</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded">
                  <p className="text-sm text-muted-foreground">Target Investment</p>
                  <p className="font-bold">{data.investmentRationale.targetInvestment || 'N/A'}</p>
                </div>
                <div className="p-4 border rounded">
                  <p className="text-sm text-muted-foreground">Expected Return</p>
                  <p className="font-bold">{data.investmentRationale.expectedReturn || 'N/A'}</p>
                </div>
                <div className="p-4 border rounded">
                  <p className="text-sm text-muted-foreground">Time Horizon</p>
                  <p className="font-bold">{data.investmentRationale.timeHorizon || 'N/A'}</p>
                </div>
              </div>

              {data.investmentRationale.keyConsiderations && data.investmentRationale.keyConsiderations.length > 0 && (
                <div>
                  <p className="font-semibold mb-2">Key Considerations</p>
                  <ul className="space-y-2">
                    {data.investmentRationale.keyConsiderations.map((consideration: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary">•</span>
                        <span>{consideration}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Data Sources
              </CardTitle>
              <CardDescription>
                {data.metadata.sources.length} sources used • Research completed in {data.metadata.timeTakenSeconds}s
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.metadata.sources.map((source: any, i: number) => (
                <div key={i} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-600 hover:underline flex items-center gap-2"
                      >
                        {source.name}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <p className="text-xs text-muted-foreground mt-1 break-all">{source.url}</p>
                      {source.dataExtracted && source.dataExtracted.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Data extracted:</p>
                          <div className="flex flex-wrap gap-1">
                            {source.dataExtracted.map((data: string, j: number) => (
                              <Badge key={j} variant="outline" className="text-xs">
                                {data}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant={source.relevance === 'high' ? 'default' : 'secondary'}
                      className={source.relevance === 'high' ? 'bg-green-500' : ''}
                    >
                      {source.relevance}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle>Document vs Public Source Comparison</CardTitle>
              <CardDescription>
                Compare data from uploaded documents with public sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              {docData ? (
                <div className="text-sm text-muted-foreground">
                  <p>Document analysis data is available. Comparison features coming soon...</p>
                  <p className="mt-2">This tab will show side-by-side comparison of:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Company information</li>
                    <li>Funding details</li>
                    <li>Financial metrics</li>
                    <li>Team information</li>
                    <li>Market positioning</li>
                  </ul>
                  <p className="mt-4">Discrepancies will be highlighted in color-coded cards.</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No document analysis data available for comparison. Please analyze documents first.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
      </Tabs>

      {/* Need to Ask Section - Always visible at bottom */}
      {data.needToAsk && data.needToAsk.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <MessageSquare className="h-5 w-5" />
              Questions to Ask
            </CardTitle>
            <CardDescription>
              Information that needs clarification or is not publicly available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.needToAsk.map((question, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="font-semibold text-amber-600">{i + 1}.</span>
                  <span>{question}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

