import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  ArrowLeft,
  Star,
  ChevronDown,
  Shield,
  AlertCircle,
  Info,
  Globe,
  Search,
  Loader2,
  Plus,
  X,
  XCircle,
  FileText,
  Database,
  GitCompare,
  BarChart,
  Target,
  RefreshCcw,
  PieChart as PieChartIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import AnalysisComparison from "@/components/analysis-comparison";
import { PublicDataSection } from "@/components/public-data-section";
import CompanyDetailsSection from "@/components/company-details-section";
import { useState, useEffect } from "react";
import { getApiUrl } from "@/lib/config.ts";
import { formatCurrency } from "@/lib/utils";
import { authenticatedFetchJSON } from "@/lib/api";

interface AnalysisData {
  startup: {
    id: string;
    name: string;
    description: string | null;
    industry: string | null;
    overallScore: number;
    riskLevel: string;
    recommendation: string;
    analysisData?: any; // Contains publicSourceDueDiligence after background job completes
  };
  analysis: {
    overallScore: number;
    metrics: {
      marketSize: number;
      traction: number;
      team: number;
      product: number;
      financials: number;
      competition: number;
    };
    riskFlags: Array<{
      type: "high" | "medium" | "low";
      category: string;
      description: string;
      impact: string;
    }>;
    keyInsights: string[];
    recommendation: {
      decision: "strong_buy" | "buy" | "hold" | "pass";
      reasoning: string;
      targetInvestment: number;
      expectedReturn: number;
    };
    riskLevel: "Low" | "Medium" | "High";
  };
  documents: Array<{
    id: string;
    fileName: string;
    fileType: string;
    extractedText: string;
  }>;
  // Enhanced Analysis Data (if available)
  publicDataAnalysis?: {
    companyInfo: {
      website: string;
      description: string;
      founded: string;
      employees: string;
      headquarters: string;
      industry: string;
      socialMedia: {
        linkedin?: string;
        twitter?: string;
        facebook?: string;
      };
    };
    founderProfiles: Array<{
      name: string;
      title: string;
      linkedinUrl?: string;
      experience: string[];
      education: string[];
      previousCompanies: string[];
      verified: boolean;
    }>;
    newsArticles: Array<{
      title: string;
      url: string;
      publishedDate: string;
      source: string;
      summary: string;
      sentiment: "positive" | "negative" | "neutral";
    }>;
    domainInfo: {
      domain: string;
      registeredDate: string;
      registrar: string;
      nameServers: string[];
      status: string;
      expirationDate: string;
    };
    businessRegistry: {
      companyName: string;
      registrationNumber: string;
      status: string;
      incorporationDate: string;
      jurisdiction: string;
      registeredAgent: string;
    };
    confidenceScore: number;
    lastUpdated: string;
  };
  discrepancyAnalysis?: {
    overallDiscrepancyScore: number;
    discrepancies: Array<{
      category:
        | "market"
        | "team"
        | "financial"
        | "product"
        | "company_info"
        | "founder";
      field: string;
      documentValue: string | number;
      publicValue: string | number;
      severity: "low" | "medium" | "high" | "critical";
      description: string;
      impact: string;
      recommendation: string;
    }>;
    redFlags: Array<{
      type: "financial" | "team" | "legal" | "operational" | "reputation";
      severity: "warning" | "critical";
      title: string;
      description: string;
      evidence: string[];
      recommendation: string;
    }>;
    confidenceAssessment: {
      documentReliability: number;
      publicDataReliability: number;
      overallConfidence: number;
      factors: Array<{
        factor: string;
        impact: "positive" | "negative" | "neutral";
        description: string;
        weight: number;
      }>;
    };
    summary: string;
  };
  overallAssessment?: {
    overallScore: number;
    confidenceLevel: "high" | "medium" | "low";
    riskLevel: "Low" | "Medium" | "High";
    recommendation: "strong_buy" | "buy" | "hold" | "pass";
    keyFindings: string[];
    nextSteps: string[];
    redFlagsCount: number;
    discrepanciesCount: number;
  };
}

interface Startup {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  stage: string | null;
  foundedYear: number | null;
  location: string | null;
  websiteUrl: string | null;
  overallScore: number | null;
  riskLevel: string | null;
  recommendation: string | null;
  analysisData: any | null;
  createdAt: string;
  updatedAt: string;
}

interface AnalysisProps {
  params: Record<string, string>;
}

export default function Analysis({ params }: AnalysisProps) {
  const id = params.id;
  const navigate = useNavigate();
  const [publicData, setPublicData] = useState<any>({
    synthesizedInsights: { data: {} },
  });
  const [publicDataStatus, setPublicDataStatus] = useState<
    "loading" | "failed" | "success"
  >("loading");
  const [isRefreshingPublicData, setIsRefreshingPublicData] = useState(false);
  const [hasSuccessfulRetry, setHasSuccessfulRetry] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<AnalysisData>({
    queryKey: ['/api/document-analysis', id],
    queryFn: async () => {
      const analysisData = await authenticatedFetchJSON(getApiUrl(`/api/document-analysis/${id}`))
      
      // Save to local storage for persistence
      if (analysisData && id) {
        localStorage.setItem(`analysis_${id}`, JSON.stringify(analysisData));
      }

      return analysisData;
    },
    enabled: !!id,
    // Use local storage as fallback when server is unavailable
    placeholderData: (previousData) => {
      if (previousData) return previousData;
      if (id) {
        const cached = localStorage.getItem(`analysis_${id}`);
        if (cached) {
          try {
            return JSON.parse(cached);
          } catch (e) {
            console.error("Failed to parse cached analysis data:", e);
          }
        }
      }
      return undefined;
    },
  });

  // Extract public data from analysis data (stored in startup.analysisData)
  useEffect(() => {
    // Don't override if we have successfully retried and fetched public data
    if (hasSuccessfulRetry && publicData && publicDataStatus === "success") {
      return;
    }

    if (data?.startup?.analysisData) {
      const analysisData = data.startup.analysisData as any;
      if (analysisData.publicSourceDueDiligence) {
        // Public data available
        setPublicData(analysisData.publicSourceDueDiligence);
        setPublicDataStatus("success");
      } else if (analysisData.analysisType) {
        // Analysis is complete but public data is missing - it failed during parallel execution
        setPublicData(null);
        setPublicDataStatus("failed");
      } else {
        // Still loading (old background mode, shouldn't happen with new parallel execution)
        setPublicDataStatus("loading");
      }
    }
  }, [data, hasSuccessfulRetry, publicData, publicDataStatus]);

  // Extract public data from analysis data (stored in startup.analysisData)
  useEffect(() => {
    // Don't override if we have successfully retried and fetched public data
    if (hasSuccessfulRetry && publicData && publicDataStatus === 'success') {
      return;
    }

    if (data?.startup?.analysisData) {
      const analysisData = data.startup.analysisData as any;
      if (analysisData.publicSourceDueDiligence) {
        // Public data available
        setPublicData(analysisData.publicSourceDueDiligence);
        setPublicDataStatus('success');
      } else if (analysisData.analysisType) {
        // Analysis is complete but public data is missing - it failed during parallel execution
        setPublicData(null);
        setPublicDataStatus('failed');
      } else {
        // Still loading (old background mode, shouldn't happen with new parallel execution)
        setPublicDataStatus('loading');
      }
    }
  }, [data, hasSuccessfulRetry, publicData, publicDataStatus]);

  // Function to retry public data analysis
  const handleRefreshPublicData = async () => {
    if (!id) return;
    
    setIsRefreshingPublicData(true);
    setPublicDataStatus('loading');
    setHasSuccessfulRetry(false); // Reset the flag
    
    try {
      const result = await authenticatedFetchJSON(getApiUrl(`/api/public-data-analysis/${id}`), {
        method: 'POST',
      });
      
      // Update the public data with the new result
      if (result.publicSourceDueDiligence) {
        // Create a new object reference to ensure React detects the change
        const newPublicData = { ...result.publicSourceDueDiligence, _refreshTimestamp: Date.now() };
        setPublicData(newPublicData);
        setPublicDataStatus('success');
        setHasSuccessfulRetry(true); // Mark as successful retry
        
        // Update localStorage with the new data
        if (id) {
          const existingData = localStorage.getItem(`analysis_${id}`);
          if (existingData) {
            try {
              const parsed = JSON.parse(existingData);
              parsed.startup = parsed.startup || {};
              parsed.startup.analysisData = parsed.startup.analysisData || {};
              parsed.startup.analysisData.publicSourceDueDiligence = result.publicSourceDueDiligence;
              localStorage.setItem(`analysis_${id}`, JSON.stringify(parsed));
            } catch (e) {
              console.error('Failed to update localStorage:', e);
            }
          }
        }
        
        // Invalidate and refetch the query to ensure consistency
        queryClient.invalidateQueries({ queryKey: ['/api/document-analysis', id] });
      } else {
        setPublicDataStatus('failed');
        setHasSuccessfulRetry(false);
      }
    } catch (error) {
      console.error('Error refreshing public data:', error);
      setPublicDataStatus('failed');
      setHasSuccessfulRetry(false);
    } finally {
      setIsRefreshingPublicData(false);
    }
  };

  // Fetch all analyzed startups for dropdown
  const { data: startups = [], isLoading: startupsLoading } = useQuery<
    Startup[]
  >({
    queryKey: ["/api/startups"],
    queryFn: async () => {
      const data = await authenticatedFetchJSON(getApiUrl('/api/startups'))
      
      // Save to local storage for persistence
      localStorage.setItem("startups", JSON.stringify(data));

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Use local storage as fallback when server is unavailable
    placeholderData: (previousData) => {
      if (previousData) return previousData;
      const cached = localStorage.getItem("startups");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.error("Failed to parse cached startups data:", e);
        }
      }
      return [];
    },
  });

  // Enhanced Analysis State - MUST be at the top before any conditional logic
  const [isEnhancedAnalysisLoading, setIsEnhancedAnalysisLoading] =
    useState(false);
  const [websites, setWebsites] = useState<string[]>([""]);
  const [open, setOpen] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState<string>("");
  const queryClient = useQueryClient();

  // Enhanced Analysis Mutation
  const enhancedAnalysisMutation = useMutation({
    mutationFn: async ({ startupId, websites }: { startupId: string, websites: string[] }) => {
      return await authenticatedFetchJSON(getApiUrl('/api/enhanced-analysis'), {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startupId,
          websites: websites.filter((url) => url.trim() !== ""),
        }),
      })
    },
    onSuccess: (data) => {
      // Save enhanced analysis results to local storage
      if (data && id) {
        const existingData = localStorage.getItem(`analysis_${id}`);
        let mergedData = data;

        if (existingData) {
          try {
            const parsed = JSON.parse(existingData);
            mergedData = { ...parsed, ...data };
          } catch (e) {
            console.error("Failed to merge with existing analysis data:", e);
          }
        }

        localStorage.setItem(`analysis_${id}`, JSON.stringify(mergedData));
      }

      // Refetch the analysis data to show the new enhanced sections
      queryClient.invalidateQueries({
        queryKey: ["/api/document-analysis", id],
      });
      setIsEnhancedAnalysisLoading(false);
    },
    onError: (error) => {
      console.error("Enhanced analysis failed:", error);
      setIsEnhancedAnalysisLoading(false);
    },
  });

  const addWebsite = () => {
    setWebsites([...websites, ""]);
  };

  const removeWebsite = (index: number) => {
    if (websites.length > 1) {
      setWebsites(websites.filter((_, i) => i !== index));
    }
  };

  const updateWebsite = (index: number, value: string) => {
    const newWebsites = [...websites];
    newWebsites[index] = value;
    setWebsites(newWebsites);
  };

  const handleEnhancedAnalysis = () => {
    setIsEnhancedAnalysisLoading(true);
    enhancedAnalysisMutation.mutate({
      startupId: id!,
      websites: websites.filter((url) => url.trim() !== ""),
    });
  };

  // Filter only analyzed startups (those with overallScore)
  const analyzedStartups = startups.filter(
    (startup) =>
      startup.overallScore !== null && startup.overallScore !== undefined
  );

  const handleStartupSelect = (startupId: string) => {
    setSelectedStartup(startupId);
    setOpen(false);
    navigate(`/analysis/${startupId}`);
  };

  // Handle case when no ID is provided - show startup selection
  if (!id) {
    if (startupsLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">
              Loading analyzed startups...
            </p>
          </div>
        </div>
      );
    }

    if (analyzedStartups.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mx-auto">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">No Analysis Available</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                You haven't completed any startup analysis yet. Upload your
                documents to get started with AI-powered investment analysis.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link to="/upload">Upload Documents</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">View Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6" data-testid="analysis-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Analysis Results
              </h1>
            </div>
            <p className="text-muted-foreground">
              Select a startup to view its detailed analysis and market
              comparison
            </p>
          </div>
        </div>

        {/* Startup Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Startup Analysis</CardTitle>
            <p className="text-sm text-muted-foreground">
              Choose from your previously analyzed startups to view detailed
              results
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Analyzed Startups</label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {selectedStartup
                        ? analyzedStartups.find(
                            (startup) => startup.id === selectedStartup
                          )?.name
                        : "Select a startup to view analysis..."}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-h-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Search startups..." />
                      <CommandList>
                        <CommandEmpty>No startup found.</CommandEmpty>
                        <CommandGroup>
                          {analyzedStartups.map((startup) => (
                            <CommandItem
                              key={startup.id}
                              value={`${startup.name} ${
                                startup.industry || ""
                              }`}
                              onSelect={() => handleStartupSelect(startup.id)}
                              className="flex items-center justify-between p-2"
                            >
                              <div className="flex flex-col items-start flex-1">
                                <span className="font-medium">
                                  {startup.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {startup.industry || "No industry"} • Score:{" "}
                                  {startup.overallScore}/100
                                </span>
                              </div>
                              <Badge
                                variant={
                                  startup.overallScore &&
                                  startup.overallScore >= 80
                                    ? "default"
                                    : startup.overallScore &&
                                      startup.overallScore >= 60
                                    ? "secondary"
                                    : "destructive"
                                }
                                className="ml-2 shrink-0"
                              >
                                {startup.overallScore &&
                                startup.overallScore >= 80
                                  ? "Strong"
                                  : startup.overallScore &&
                                    startup.overallScore >= 60
                                  ? "Good"
                                  : "Fair"}
                              </Badge>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyzedStartups.slice(0, 6).map((startup) => (
                  <Card
                    key={startup.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleStartupSelect(startup.id)}
                  >
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold truncate">
                            {startup.name}
                          </h3>
                          <Badge
                            variant={
                              startup.overallScore && startup.overallScore >= 80
                                ? "default"
                                : startup.overallScore &&
                                  startup.overallScore >= 60
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {startup.overallScore}/100
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {startup.industry || "No industry specified"}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Risk: {startup.riskLevel || "Unknown"}</span>
                          <span>
                            {new Date(startup.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {analyzedStartups.length > 6 && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    And {analyzedStartups.length - 6} more analysis available in
                    the dropdown above
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold">Need a New Analysis?</h3>
              <p className="text-muted-foreground">
                Upload documents for a new startup to get AI-powered investment
                analysis
              </p>
              <div className="flex gap-3 justify-center">
                <Button asChild>
                  <Link to="/upload">Upload New Documents</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/">View Dashboard</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950 mx-auto">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Analysis Not Found</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              The analysis for startup ID "{id}" could not be found. It may have
              been deleted or the ID is invalid.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate("/upload")}>
              Upload New Documents
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              View Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { startup, analysis, documents } = data;
  const {
    synthesizedInsights: { data: publicSynthesizedData } = { data: {} },
  } = publicData;

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case "strong_buy":
        return "bg-green-600";
      case "buy":
        return "bg-green-500";
      case "hold":
        return "bg-yellow-500";
      case "pass":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
      default: return 'text-gray-600'
    }
  };

  const getRiskFlagColor = (type: string) => {
    switch (type) {
      case "high":
        return "border-red-500 bg-red-50 dark:bg-red-950";
      case "medium":
        return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950";
      case "low":
        return "border-blue-500 bg-blue-50 dark:bg-blue-950";
      default:
        return "border-gray-500 bg-gray-50 dark:bg-gray-950";
    }
  };

  return (
    <div className="space-y-6" data-testid="analysis-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/analysis">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">{startup.name}</h1>
            {analysis.recommendation?.decision && (
              <Badge className={`${getDecisionColor(analysis.recommendation.decision)} text-white`}>
                {analysis.recommendation.decision.replace('_', ' ').toUpperCase()}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            AI-powered investment analysis • Public source data included
          </p>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Overall Score
                </p>
                <p className="text-2xl font-bold">
                  {analysis.overallScore}/100
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Risk Level
                </p>
                <p
                  className={`text-2xl font-bold ${getRiskColor(
                    analysis.riskLevel
                  )}`}
                >
                  {analysis.riskLevel}
                </p>
              </div>
              <AlertTriangle
                className={`h-8 w-8 ${getRiskColor(analysis.riskLevel)}`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Target Investment
                </p>
                <p className="text-2xl font-bold">
                  {analysis.recommendation?.targetInvestment 
                    ? formatCurrency(analysis.recommendation.targetInvestment) 
                    : 'N/A'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expected Return</p>
                <p className="text-2xl font-bold">
                  {analysis.recommendation?.expectedReturn 
                    ? `${analysis.recommendation.expectedReturn}x` 
                    : 'N/A'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Views */}
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Document Analysis
          </TabsTrigger>
          <TabsTrigger value="public" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Public Data Analysis
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            Comparison & Questions
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Document Analysis */}
        <TabsContent value="documents" className="space-y-6 mt-6">
          {/* Company Details Section - New Sections */}
          <CompanyDetailsSection analysisData={data} />

          {/* Investment Recommendation */}
          {/* <Card>
            <details className="group" open>
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  <span className="font-semibold">
                    Investment Recommendation
                  </span>
                  {analysis.recommendation?.decision && (
                    <Badge
                      className={`${getDecisionColor(
                        analysis.recommendation.decision
                      )} text-white text-xs ml-2`}
                    >
                      {analysis.recommendation.decision
                        .replace("_", " ")
                        .toUpperCase()}
                    </Badge>
                  )}
                </div>
                <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
              </summary>
              <CardContent className="space-y-4 pt-4">
                {analysis.recommendation ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysis.recommendation.targetInvestment && (
                        <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Target Investment</p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(
                              analysis.recommendation.targetInvestment
                            )}
                          </p>
                        </div>
                      )}
                      {analysis.recommendation.expectedReturn && (
                        <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Expected Return</p>
                          <p className="text-2xl font-bold">
                            {analysis.recommendation.expectedReturn}x
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Multiple</p>
                        </div>
                      )}
                    </div>
                    
                    {analysis.recommendation.reasoning && (
                      <>
                        <Separator />
                        <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                          <p className="text-sm font-semibold mb-2 text-primary">Investment Rationale</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {analysis.recommendation.reasoning}
                          </p>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No recommendation data available</p>
                    <p className="text-xs text-muted-foreground mt-1">Investment recommendations will appear here once generated</p>
                  </div>
                )}
              </CardContent>
            </details>
          </Card> */}

          {/* Key Insights */}
          <Card>
            <details className="group">
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Key Insights</span>
                  {analysis.keyInsights && analysis.keyInsights.length > 0 && (
                    <Badge variant="outline" className="text-xs ml-2">
                      {analysis.keyInsights.length} insights
                    </Badge>
                  )}
                </div>
                <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
              </summary>
              <CardContent className="space-y-4 pt-4">
                {analysis.keyInsights && analysis.keyInsights.length > 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Critical findings from document analysis
                    </p>
                    <Separator />
                    <ul className="space-y-3">
                      {analysis.keyInsights.map((insight, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm leading-relaxed">
                            {insight}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No key insights available
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Insights will be generated from document analysis
                    </p>
                  </div>
                )}
              </CardContent>
            </details>
          </Card>

          {/* Documents Analyzed */}
          <Card className="border-2">
            <details className="group">
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Documents Analyzed</span>
                  <Badge variant="outline" className="text-xs">
                    {documents.length} documents
                  </Badge>
                </div>
                <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
              </summary>
              <CardContent className="pt-4">
                <div className="grid gap-3">
                  {documents.map((doc, index) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {doc.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground uppercase">
                            {doc.fileType} • Document {index + 1}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300 shrink-0"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Processed
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </details>
          </Card>
        </TabsContent>

        {/* Tab 2: Public Data Analysis */}
        <TabsContent value="public" className="space-y-6 mt-6">
          {/* Refresh Button - Always visible when public data exists */}
          {publicDataStatus === "success" && publicData && (
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border-2 border-dashed">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold">
                    Public Data Analysis Ready
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click refresh to update with latest public data
                  </p>
                </div>
              </div>
              <Button
                onClick={handleRefreshPublicData}
                disabled={isRefreshingPublicData}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {isRefreshingPublicData ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4" />
                    Refresh Data
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Public Sources Verified */}
          {data?.publicDataAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-green-500" />
                  Public Sources Verified (
                  {data.publicDataAnalysis.confidenceScore}% confidence)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Sources manually provided and verified during the enhanced
                  analysis
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Show successfully crawled sources */}
                  {data.publicDataAnalysis.companyInfo.website && (
                    <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                            ✅
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-green-800 dark:text-green-200">
                            Successfully Crawled
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            {data.publicDataAnalysis.companyInfo.website}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show if no sources were successfully crawled */}
                  {!data.publicDataAnalysis.companyInfo.website && (
                    <div className="p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                          <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
                            ⚠️
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-yellow-800 dark:text-yellow-200">
                            No Sources Successfully Crawled
                          </p>
                          <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            The provided URLs could not be crawled. Please check
                            that they are valid website URLs.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid gap-4">
                  {/* Company Website */}
                  {data.publicDataAnalysis.companyInfo.website && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                            🌐
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">Company Website</p>
                          <p className="text-sm text-muted-foreground">
                            {data.publicDataAnalysis.companyInfo.website}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300"
                      >
                        Verified
                      </Badge>
                    </div>
                  )}

                  {/* Business Registry */}
                  {data.publicDataAnalysis.businessRegistry
                    .registrationNumber && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                            🏢
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">Business Registry</p>
                          <p className="text-sm text-muted-foreground">
                            {
                              data.publicDataAnalysis.businessRegistry
                                .jurisdiction
                            }{" "}
                            • Status:{" "}
                            {data.publicDataAnalysis.businessRegistry.status}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300"
                      >
                        Verified
                      </Badge>
                    </div>
                  )}

                  {/* Domain Information */}
                  {data.publicDataAnalysis.domainInfo.domain && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 dark:text-orange-400 text-sm font-medium">
                            🔗
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">Domain Information</p>
                          <p className="text-sm text-muted-foreground">
                            {data.publicDataAnalysis.domainInfo.domain} •
                            Registered:{" "}
                            {data.publicDataAnalysis.domainInfo.registeredDate
                              ? new Date(
                                  data.publicDataAnalysis.domainInfo.registeredDate
                                ).toLocaleDateString()
                              : "Unknown"}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300"
                      >
                        Verified
                      </Badge>
                    </div>
                  )}

                  {/* News Articles */}
                  {data.publicDataAnalysis.newsArticles.length > 0 && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                          <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                            📰
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">News Coverage</p>
                          <p className="text-sm text-muted-foreground">
                            {data.publicDataAnalysis.newsArticles.length}{" "}
                            articles found
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300"
                      >
                        {data.publicDataAnalysis.newsArticles.length} Sources
                      </Badge>
                    </div>
                  )}

                  {/* Founder Profiles */}
                  {data.publicDataAnalysis.founderProfiles.length > 0 && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                            👥
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">Founder Profiles</p>
                          <p className="text-sm text-muted-foreground">
                            {data.publicDataAnalysis.founderProfiles.length}{" "}
                            profiles analyzed
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300"
                      >
                        {
                          data.publicDataAnalysis.founderProfiles.filter(
                            (p) => p.verified
                          ).length
                        }
                        /{data.publicDataAnalysis.founderProfiles.length}{" "}
                        Verified
                      </Badge>
                    </div>
                  )}

                  {/* Social Media */}
                  {(data.publicDataAnalysis.companyInfo.socialMedia.linkedin ||
                    data.publicDataAnalysis.companyInfo.socialMedia.twitter ||
                    data.publicDataAnalysis.companyInfo.socialMedia
                      .facebook) && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center">
                          <span className="text-cyan-600 dark:text-cyan-400 text-sm font-medium">
                            📱
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">Social Media Presence</p>
                          <p className="text-sm text-muted-foreground">
                            {[
                              data.publicDataAnalysis.companyInfo.socialMedia
                                .linkedin && "LinkedIn",
                              data.publicDataAnalysis.companyInfo.socialMedia
                                .twitter && "Twitter",
                              data.publicDataAnalysis.companyInfo.socialMedia
                                .facebook && "Facebook",
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300"
                      >
                        Active
                      </Badge>
                    </div>
                  )}

                  {/* Data Freshness */}
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Data Last Updated
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(
                          data.publicDataAnalysis.lastUpdated
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-medium">
                        Overall Confidence
                      </span>
                      <Badge
                        variant={
                          data.publicDataAnalysis.confidenceScore >= 70
                            ? "default"
                            : data.publicDataAnalysis.confidenceScore >= 40
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {data.publicDataAnalysis.confidenceScore}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PUBLIC SOURCE DATA SECTION in Public Tab */}
          <PublicDataSection
            publicData={publicData}
            documentData={analysis}
            status={publicDataStatus}
            onRefresh={handleRefreshPublicData}
            isRefreshing={isRefreshingPublicData}
          />
        </TabsContent>

        {/* Tab 3: Comparison & Questions */}
        <TabsContent value="comparison" className="space-y-6 mt-6">
          {/* Discrepancies & Red Flags */}
          {data?.discrepancyAnalysis &&
            (data.discrepancyAnalysis.discrepancies.length > 0 ||
              data.discrepancyAnalysis.redFlags.length > 0) && (
              <Card>
                <details className="group">
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <span className="font-semibold">
                        Discrepancies & Red Flags
                      </span>
                      <Badge variant="outline" className="text-xs ml-2">
                        {data.discrepancyAnalysis.discrepancies.length +
                          data.discrepancyAnalysis.redFlags.length}{" "}
                        total
                      </Badge>
                    </div>
                    <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                  </summary>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {/* Overall Discrepancy Score */}
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Overall Discrepancy Score
                          </span>
                          <Badge
                            variant={
                              data.discrepancyAnalysis.overallDiscrepancyScore <
                              25
                                ? "default"
                                : data.discrepancyAnalysis
                                    .overallDiscrepancyScore < 50
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {data.discrepancyAnalysis.overallDiscrepancyScore}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {data.discrepancyAnalysis.summary}
                        </p>
                      </div>

                      {/* Red Flags */}
                      {data.discrepancyAnalysis.redFlags.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            Critical Red Flags
                          </h4>
                          {data.discrepancyAnalysis.redFlags.map(
                            (flag, index) => (
                              <div
                                key={index}
                                className="border border-red-200 dark:border-red-800 rounded-lg p-3 bg-red-50 dark:bg-red-900/20"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sm text-red-800 dark:text-red-200">
                                    {flag.title}
                                  </span>
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    {flag.severity.toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                                  {flag.description}
                                </p>
                                <div className="text-xs text-red-600 dark:text-red-400">
                                  <span className="font-medium">
                                    Recommendation:{" "}
                                  </span>
                                  {flag.recommendation}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {/* Discrepancies */}
                      {data.discrepancyAnalysis.discrepancies.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <Info className="h-4 w-4 text-yellow-500" />
                            Data Discrepancies
                          </h4>
                          {data.discrepancyAnalysis.discrepancies.map(
                            (discrepancy, index) => (
                              <div
                                key={index}
                                className="border rounded-lg p-3"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sm">
                                    {discrepancy.category.toUpperCase()}:{" "}
                                    {discrepancy.field}
                                  </span>
                                  <Badge
                                    variant={
                                      discrepancy.severity === "critical"
                                        ? "destructive"
                                        : discrepancy.severity === "high"
                                        ? "secondary"
                                        : "outline"
                                    }
                                    className="text-xs"
                                  >
                                    {discrepancy.severity.toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {discrepancy.description}
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="font-medium">
                                      Document:{" "}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {discrepancy.documentValue}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      Public Data:{" "}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {discrepancy.publicValue}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">
                                  <span className="font-medium">
                                    Recommendation:{" "}
                                  </span>
                                  {discrepancy.recommendation}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {/* Confidence Assessment */}
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <h4 className="font-medium text-sm mb-2">
                          Confidence Assessment
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="font-medium">
                              Document Reliability
                            </span>
                            <div className="mt-1">
                              <Badge
                                variant={
                                  data.discrepancyAnalysis.confidenceAssessment
                                    .documentReliability >= 80
                                    ? "default"
                                    : data.discrepancyAnalysis
                                        .confidenceAssessment
                                        .documentReliability >= 60
                                    ? "secondary"
                                    : "destructive"
                                }
                                className="text-xs"
                              >
                                {
                                  data.discrepancyAnalysis.confidenceAssessment
                                    .documentReliability
                                }
                                %
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">
                              Public Data Reliability
                            </span>
                            <div className="mt-1">
                              <Badge
                                variant={
                                  data.discrepancyAnalysis.confidenceAssessment
                                    .publicDataReliability >= 80
                                    ? "default"
                                    : data.discrepancyAnalysis
                                        .confidenceAssessment
                                        .publicDataReliability >= 60
                                    ? "secondary"
                                    : "destructive"
                                }
                                className="text-xs"
                              >
                                {
                                  data.discrepancyAnalysis.confidenceAssessment
                                    .publicDataReliability
                                }
                                %
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">
                              Overall Confidence
                            </span>
                            <div className="mt-1">
                              <Badge
                                variant={
                                  data.discrepancyAnalysis.confidenceAssessment
                                    .overallConfidence >= 80
                                    ? "default"
                                    : data.discrepancyAnalysis
                                        .confidenceAssessment
                                        .overallConfidence >= 60
                                    ? "secondary"
                                    : "destructive"
                                }
                                className="text-xs"
                              >
                                {
                                  data.discrepancyAnalysis.confidenceAssessment
                                    .overallConfidence
                                }
                                %
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </details>
              </Card>
            )}

          {/* Document vs Public Data Comparison */}
          {publicSynthesizedData &&
            Object.keys(publicSynthesizedData).length > 0 && (
              <Card>
                <details className="group">
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
                    <div className="flex items-center gap-2">
                      <GitCompare className="h-5 w-5" />
                      <span className="font-semibold">
                        Document vs Public Data Comparison
                      </span>
                    </div>
                    <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                  </summary>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Side-by-side comparison of information from uploaded
                      documents versus publicly available data
                    </p>
                    <div className="space-y-3">
                      {(() => {
                        const comparisons: Array<{
                          field: string;
                          documentValue: string;
                          publicValue: string;
                          match: boolean;
                        }> = [];

                        // Helper function to normalize values for comparison
                        const normalizeValue = (val: any): string => {
                          if (
                            val === null ||
                            val === undefined ||
                            val === "" ||
                            val === "N/A"
                          )
                            return "";
                          return String(val).trim().toLowerCase();
                        };

                        // Helper function to check if field exists in both sources
                        const compareField = (
                          fieldName: string,
                          docValue: any,
                          publicValue: any
                        ) => {
                          const normalizedDoc = normalizeValue(docValue);
                          const normalizedPublic = normalizeValue(publicValue);

                          // Only add if both values exist
                          if (normalizedDoc && normalizedPublic) {
                            comparisons.push({
                              field: fieldName,
                              documentValue: String(docValue),
                              publicValue: String(publicValue),
                              match: normalizedDoc === normalizedPublic,
                            });
                          }
                        };

                        // Compare Company Info fields
                        if (
                          (analysis as any).companyInfo &&
                          publicSynthesizedData.company_overview
                        ) {
                          const docInfo = (analysis as any).companyInfo;
                          const pubInfo =
                            publicSynthesizedData.company_overview;

                          compareField(
                            "Company Name",
                            docInfo.companyName,
                            pubInfo.name || docInfo.companyName
                          );
                          compareField(
                            "Founded Year",
                            docInfo.foundedYear,
                            pubInfo.founded_date
                          );
                          compareField(
                            "Sector",
                            docInfo.sector,
                            pubInfo.sector
                          );
                          compareField(
                            "Industry",
                            docInfo.industry,
                            pubInfo.industry
                          );
                          compareField(
                            "Headquarters",
                            docInfo.headquarters,
                            pubInfo.headquarters?.city
                              ? `${pubInfo.headquarters.city}, ${pubInfo.headquarters.country}`
                              : pubInfo.headquarters
                          );
                          compareField(
                            "Website",
                            docInfo.website,
                            pubInfo.website
                          );
                        }

                        // Compare Employee Info
                        if (
                          (analysis as any).employeeInfo &&
                          publicSynthesizedData.employee_metrics
                        ) {
                          const docEmp = (analysis as any).employeeInfo;
                          const pubEmp = publicSynthesizedData.employee_metrics;

                          compareField(
                            "Employee Count",
                            docEmp.currentEmployeeSize,
                            pubEmp.current_employees?.value
                          );
                        }

                        // Compare Financial Info
                        if (
                          (analysis as any).financialInfo &&
                          publicSynthesizedData.financial_health
                        ) {
                          const docFin = (analysis as any).financialInfo;
                          const pubFin = publicSynthesizedData.financial_health;

                          // Format revenue for comparison
                          const pubRevenue = pubFin.annual_revenue?.value_usd
                            ? `$${(
                                pubFin.annual_revenue.value_usd / 1000000
                              ).toFixed(0)}M`
                            : null;
                          const pubGrowthRate = pubFin.revenue_growth_rate_pct
                            ?.value
                            ? `${pubFin.revenue_growth_rate_pct.value.toFixed(
                                1
                              )}%`
                            : null;

                          compareField(
                            "Annual Revenue",
                            docFin.currentRevenue,
                            pubRevenue
                          );
                          compareField(
                            "Revenue Growth Rate",
                            docFin.revenueGrowthRate,
                            pubGrowthRate
                          );
                          compareField(
                            "Profitability Status",
                            docFin.profitabilityStatus,
                            pubFin.profitability?.status
                          );

                          // Key metrics
                          if (docFin.keyMetrics && pubFin.key_metrics) {
                            const pubARR = pubFin.key_metrics.ARR_usd?.value
                              ? `$${(
                                  pubFin.key_metrics.ARR_usd.value / 1000000
                                ).toFixed(0)}M`
                              : null;
                            const pubMRR = pubFin.key_metrics.MRR_usd?.value
                              ? `$${(
                                  pubFin.key_metrics.MRR_usd.value / 1000000
                                ).toFixed(1)}M`
                              : null;

                            compareField("ARR", docFin.keyMetrics.arr, pubARR);
                            compareField("MRR", docFin.keyMetrics.mrr, pubMRR);
                          }
                        }

                        // Compare Funding Info
                        if (
                          (analysis as any).fundingInfo &&
                          publicSynthesizedData.funding_history
                        ) {
                          const docFund = (analysis as any).fundingInfo;
                          const pubFund = publicSynthesizedData.funding_history;

                          // Format funding amounts
                          const pubTotalFunding = pubFund.total_funding_usd
                            ? `$${(pubFund.total_funding_usd / 1000000).toFixed(
                                1
                              )}M`
                            : null;
                          const pubValuation = pubFund.current_valuation_usd
                            ?.value
                            ? `$${(
                                pubFund.current_valuation_usd.value / 1000000000
                              ).toFixed(1)}B`
                            : null;

                          // Get last round info
                          const lastRound =
                            pubFund.rounds?.[pubFund.rounds.length - 1];
                          const pubLastRoundType = lastRound?.round_type;
                          const pubLastRoundAmount = lastRound?.amount_usd
                            ? `$${(lastRound.amount_usd / 1000000).toFixed(0)}M`
                            : null;

                          compareField(
                            "Total Funding Raised",
                            docFund.totalFundingRaised,
                            pubTotalFunding
                          );
                          compareField(
                            "Last Funding Round",
                            docFund.lastFundingRound,
                            pubLastRoundType
                          );
                          compareField(
                            "Last Funding Amount",
                            docFund.lastFundingAmount,
                            pubLastRoundAmount
                          );
                          compareField(
                            "Current Valuation",
                            docFund.currentValuation,
                            pubValuation
                          );
                        }

                        // Compare Market Analysis
                        if (
                          (analysis as any).marketAnalysis &&
                          publicSynthesizedData.market_position
                        ) {
                          const docMkt = (analysis as any).marketAnalysis;
                          const pubMkt = publicSynthesizedData.market_position;

                          // Format TAM
                          const pubTAM = pubMkt.TAM_usd?.value
                            ? `$${(pubMkt.TAM_usd.value / 1000000000).toFixed(
                                1
                              )}B`
                            : null;
                          const pubMarketShare = pubMkt.market_share_pct?.value
                            ? `${pubMkt.market_share_pct.value}%`
                            : null;

                          compareField(
                            "Market Size (TAM)",
                            docMkt.marketSize,
                            pubTAM
                          );
                          compareField(
                            "Market Share",
                            docMkt.marketShare,
                            pubMarketShare
                          );
                          compareField(
                            "Market Ranking",
                            docMkt.marketRanking,
                            pubMkt.market_ranking?.rank
                          );
                          compareField(
                            "Competitive Position",
                            docMkt.competitivePosition,
                            pubMkt.competitive_positioning
                          );
                        }

                        return comparisons.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left p-3 font-semibold text-sm bg-muted/30">
                                    Field
                                  </th>
                                  <th className="text-left p-3 font-semibold text-sm bg-muted/30">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      Document Data
                                    </div>
                                  </th>
                                  <th className="text-left p-3 font-semibold text-sm bg-muted/30">
                                    <div className="flex items-center gap-2">
                                      <Database className="h-4 w-4" />
                                      Public Data
                                    </div>
                                  </th>
                                  <th className="text-center p-3 font-semibold text-sm bg-muted/30">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {comparisons.map((comp, index) => (
                                  <tr
                                    key={index}
                                    className="border-b hover:bg-muted/20 transition-colors"
                                  >
                                    <td className="p-3 font-medium text-sm">
                                      {comp.field}
                                    </td>
                                    <td className="p-3 text-sm">
                                      {comp.documentValue}
                                    </td>
                                    <td className="p-3 text-sm">
                                      {comp.publicValue}
                                    </td>
                                    <td className="p-3 text-center">
                                      {comp.match ? (
                                        <Badge
                                          variant="outline"
                                          className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300"
                                        >
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Match
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300"
                                        >
                                          <AlertTriangle className="h-3 w-3 mr-1" />
                                          Different
                                        </Badge>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-4 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">
                              No comparable fields found between document and
                              public data
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </details>
              </Card>
            )}

          {/* Market Comparison */}
          <AnalysisComparison analysisData={data} />

          {/* Information Gaps - Critical Questions */}
          {publicSynthesizedData?.information_gaps?.length > 0 && (
            <Card>
              <details className="group">
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-semibold">
                      Information Gaps from Startup
                    </span>
                    <Badge variant="outline" className="text-xs ml-2">
                      {publicSynthesizedData.information_gaps.length} questions
                    </Badge>
                  </div>
                  <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                </summary>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Critical questions that need clarification during due
                    diligence
                  </p>
                  <TooltipProvider>
                    <div className="grid md:grid-cols-2 gap-3">
                      {publicSynthesizedData.information_gaps.map(
                        (gap: any, index: number) => (
                          <div
                            key={index}
                            className="flex flex-col p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-start gap-2 flex-1">
                              <span className="font-semibold text-primary text-xs shrink-0 mt-0.5">
                                {index + 1}.
                              </span>
                              <div className="flex-1 min-w-0 flex">
                                <div className="flex items-start gap-2">
                                  <p className="text-xs leading-relaxed">
                                    {gap?.question_to_ask ||
                                      gap?.question ||
                                      gap?.text ||
                                      gap}
                                  </p>
                                  <div className="flex flex-col justify-between items-end flex-1 min-h-full">
                                    {gap?.why_needed && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-1 text-muted-foreground hover:text-primary cursor-help transition-colors">
                                            <Info className="h-3.5 w-3.5" />
                                            {/* <span className="text-[10px] font-medium">Why?</span> */}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <div className="space-y-1">
                                            <p className="text-xs font-semibold">
                                              Why this is needed:
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {gap.why_needed}
                                            </p>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                    {gap?.category && (
                                      <Badge
                                        variant="outline"
                                        className="self-end text-[10px] px-1.5 py-0.5 h-5"
                                      >
                                        {gap.category}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </TooltipProvider>
                </CardContent>
              </details>
            </Card>
          )}

          {/* Ask Questions Section - Placeholder for future Q&A feature */}
          <Card>
            <details className="group">
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  <span className="font-semibold">
                    Ask AI About This Analysis
                  </span>
                  <Badge variant="secondary" className="text-xs ml-2">
                    Coming Soon
                  </Badge>
                </div>
                <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
              </summary>
              <CardContent className="pt-4">
                <div className="p-4 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">AI Q&A feature coming soon</p>
                  <p className="text-xs mt-1">
                    You'll be able to ask detailed questions about the analysis
                    and get AI-powered answers
                  </p>
                </div>
              </CardContent>
            </details>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
