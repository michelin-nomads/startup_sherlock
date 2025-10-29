import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { getApiUrl } from '@/lib/config';

interface HybridResearchResult {
  query: string;
  groundedAnalysis: {
    analysis: string;
    groundingMetadata?: {
      groundingChunks?: Array<{
        web?: {
          uri?: string;
          title?: string;
        };
      }>;
    };
    model: string;
  };
  customSearchResults: Array<{
    title: string;
    link: string;
    snippet: string;
  }>;
  synthesizedInsights: {
    summary: string;
    keyFindings: string[];
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    recommendation: string;
    confidenceLevel: 'high' | 'medium' | 'low';
  };
  sources: Array<{
    title: string;
    url: string;
    type: string;
    relevance: string;
  }>;
  confidence: number;
  timestamp: string;
}

export default function ResearchTestPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HybridResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<'full' | 'quick'>('full');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const endpoint = searchType === 'full' 
        ? getApiUrl('api/hybrid-research/search')
        : getApiUrl('api/hybrid-research/quick-search');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceLevelBadge = (level: string) => {
    const colors = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800',
    };
    return colors[level as keyof typeof colors] || colors.medium;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🔍 Hybrid Research Test</h1>
        <p className="text-muted-foreground">
          Test Gemini Grounding + Google Custom Search. All FREE services, no allowlist required!
        </p>
      </div>

      {/* Search Input */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>
            Try searching for: "OpenAI startup", "Tesla competitive analysis", "AI market size 2025"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search-query">What would you like to research?</Label>
            <Input
              id="search-query"
              type="text"
              placeholder="e.g., TechCorp startup funding investors team"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              disabled={loading}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="full-search"
                name="search-type"
                checked={searchType === 'full'}
                onChange={() => setSearchType('full')}
                disabled={loading}
              />
              <Label htmlFor="full-search" className="cursor-pointer">
                Full Research (Grounding + Custom Search + Synthesis)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="quick-search"
                name="search-type"
                checked={searchType === 'quick'}
                onChange={() => setSearchType('quick')}
                disabled={loading}
              />
              <Label htmlFor="quick-search" className="cursor-pointer">
                Quick Search (Grounding Only)
              </Label>
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Researching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Start Research
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Confidence Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Research Confidence
                <Badge className={getConfidenceLevelBadge(result.synthesizedInsights?.confidenceLevel || 'medium')}>
                  {result.synthesizedInsights?.confidenceLevel?.toUpperCase() || 'MEDIUM'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Confidence Score</span>
                  <span className="font-semibold">{result.confidence}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${getConfidenceColor(result.confidence)}`}
                    style={{ width: `${result.confidence}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{result.sources.length} sources found</span>
                  <span>Model: {result.groundedAnalysis.model}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Different Views */}
          <Tabs defaultValue="synthesis" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="synthesis">Synthesis</TabsTrigger>
              <TabsTrigger value="analysis">Full Analysis</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
              <TabsTrigger value="raw">Raw Data</TabsTrigger>
            </TabsList>

            {/* Synthesized Insights */}
            <TabsContent value="synthesis" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{result.synthesizedInsights?.summary || 'No summary available'}</p>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.synthesizedInsights?.strengths?.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-green-600">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      Weaknesses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.synthesizedInsights?.weaknesses?.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-red-600">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Opportunities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.synthesizedInsights?.opportunities?.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Threats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.synthesizedInsights?.threats?.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-orange-600">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Key Findings</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.synthesizedInsights?.keyFindings?.map((finding, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="font-semibold text-primary">{i + 1}.</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                  <CardTitle>Recommendation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">{result.synthesizedInsights?.recommendation}</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Full Analysis */}
            <TabsContent value="analysis">
              <Card>
                <CardHeader>
                  <CardTitle>Grounded Analysis</CardTitle>
                  <CardDescription>
                    Analysis from {result.groundedAnalysis.model} with web search grounding
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={result.groundedAnalysis.analysis}
                    readOnly
                    className="min-h-[500px] font-mono text-sm"
                  />
                </CardContent>
              </Card>

              {result.customSearchResults && result.customSearchResults.length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Custom Search Results</CardTitle>
                    <CardDescription>
                      Top results from Google Custom Search API
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {result.customSearchResults.map((searchResult, i) => (
                        <div key={i} className="border-b pb-4 last:border-b-0">
                          <a
                            href={searchResult.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                          >
                            {searchResult.title}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <p className="text-sm text-muted-foreground mt-1">
                            {searchResult.snippet}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Sources */}
            <TabsContent value="sources">
              <Card>
                <CardHeader>
                  <CardTitle>Sources ({result.sources.length})</CardTitle>
                  <CardDescription>
                    All sources used in this research
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.sources.map((source, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="flex-1">
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                          >
                            {source.title}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <p className="text-xs text-muted-foreground mt-1 break-all">
                            {source.url}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {source.type}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              source.relevance === 'high'
                                ? 'border-green-500 text-green-700'
                                : source.relevance === 'medium'
                                ? 'border-yellow-500 text-yellow-700'
                                : 'border-gray-500 text-gray-700'
                            }`}
                          >
                            {source.relevance}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Raw JSON */}
            <TabsContent value="raw">
              <Card>
                <CardHeader>
                  <CardTitle>Raw JSON Response</CardTitle>
                  <CardDescription>
                    Complete API response for debugging
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={JSON.stringify(result, null, 2)}
                    readOnly
                    className="min-h-[600px] font-mono text-xs"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

