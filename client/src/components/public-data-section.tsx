import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  Globe,
  CheckCircle2,
  XCircle,
  Building2,
  Target,
  Briefcase,
  Search,
  Database,
  ExternalLink,
  FileText,
  Clock,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Activity,
  Zap,
  Calendar,
  Newspaper,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Star,
  Info,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

interface PublicDataSectionProps {
  publicData: any;
  documentData: any;
  status?: "loading" | "failed" | "success";
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

// Milestone Node Component
function MilestoneNode({
  milestone,
  index,
}: {
  milestone: any;
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const milestoneText =
    typeof milestone === "string" ? milestone : milestone.milestone;
  const year =
    typeof milestone === "object" && milestone.year ? milestone.year : "";
  const description =
    typeof milestone === "object" && milestone.description
      ? milestone.description
      : "";
  const impact =
    typeof milestone === "object" && milestone.impact ? milestone.impact : "";

  return (
    <div className="flex flex-col items-center flex-1 group relative">
      {/* Timeline Node */}
      <div
        className="relative z-10 w-4 h-4 rounded-full bg-blue-600 border-4 border-white dark:border-gray-900 shadow-md cursor-pointer transition-all hover:scale-125 hover:bg-blue-700"
        onClick={() => setIsExpanded(!isExpanded)}
      />

      {/* Year Label */}
      {year && (
        <Badge variant="outline" className="text-xs mt-2 mb-1">
          {year}
        </Badge>
      )}

      {/* Milestone Title (Always Visible) */}
      <div className="mt-2 text-center px-2 max-w-[150px]">
        <p className="text-xs font-semibold line-clamp-2 hover:line-clamp-none transition-all">
          {milestoneText}
        </p>
      </div>

      {/* Expandable Details Card */}
      {isExpanded && (description || impact) && (
        <div className="absolute top-16 z-20 mt-2 p-3 border rounded-lg bg-background shadow-lg w-64 animate-in fade-in slide-in-from-top-2">
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          >
            <XCircle className="h-3 w-3" />
          </button>
          <p className="text-xs font-semibold mb-2">{milestoneText}</p>
          {description && (
            <p className="text-xs text-muted-foreground mb-2">{description}</p>
          )}
          {impact && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Impact:</span> {impact}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Milestones Timeline Component
function MilestonesTimeline({ milestones }: { milestones: any[] }) {
  return (
    <div className="relative py-6">
      {/* Horizontal Timeline Line */}
      <div className="absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />

      {/* Milestones on Timeline */}
      <div className="relative flex justify-between items-start">
        {milestones.map((milestone, i) => (
          <MilestoneNode key={i} milestone={milestone} index={i} />
        ))}
      </div>

      {/* Instruction Text */}
      <p className="text-xs text-muted-foreground text-center mt-6 italic">
        Click on any milestone node to view details
      </p>
    </div>
  );
}

export function PublicDataSection({
  publicData,
  documentData,
  status = "loading",
  onRefresh,
  isRefreshing,
}: PublicDataSectionProps) {
  // Handle failed state
  if (status === "failed" || (publicData === null && status !== "loading")) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Public Source Data Unavailable
          </CardTitle>
          <CardDescription>
            Public source research failed due to API limitations. This may be
            due to Gemini API being overloaded (503 error). You can try
            refreshing to retry the analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {isRefreshing ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                Retrying Analysis...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry Public Data Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Handle loading state
  if (!publicData || status === "loading") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Public Source Data
          </CardTitle>
          <CardDescription>
            Public source research is being conducted in the background...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Safely destructure with defaults
  const companyOverview = publicData?.companyOverview || {};
  const fundingHistory = publicData?.fundingHistory || {};
  const financialHealth = publicData?.financialHealth || {};
  const marketPosition = publicData?.marketPosition || {};
  const teamAndLeadership = publicData?.teamAndLeadership || {};
  const riskAnalysis = publicData?.riskAnalysis || {};
  const investmentRationale = publicData?.investmentRationale || {};
  const metadata = publicData?.metadata || {};
  const growthTrajectory = publicData?.growthTrajectory || {};
  const ipoAnalysis = publicData?.ipoAnalysis || {};
  const competitorAnalysis = publicData?.competitorAnalysis || {};
  const recentDevelopments = publicData?.recentDevelopments || {};

  const [showSources, setShowSources] = useState(false);

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80)
      return (
        <Badge className="bg-green-600 text-xs">High: {confidence}%</Badge>
      );
    if (confidence >= 60)
      return (
        <Badge className="bg-yellow-600 text-xs">Medium: {confidence}%</Badge>
      );
    return <Badge className="bg-red-600 text-xs">Low: {confidence}%</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Company Overview */}
      <Card>
        <details className="group">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <span className="font-semibold">Company Overview</span>
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Sector
                </p>
                <p className="text-sm font-semibold mt-1">
                  {companyOverview?.sector || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Founded
                </p>
                <p className="text-sm font-semibold mt-1">
                  {companyOverview?.foundedYear || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Headquarters
                </p>
                <p className="text-sm font-semibold mt-1">
                  {companyOverview?.headquarters || "N/A"}
                </p>
              </div>
            </div>
            {companyOverview?.founders &&
              companyOverview.founders.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-2">
                      Founders
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {companyOverview.founders.map(
                        (founder: string, i: number) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs"
                          >
                            {founder}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}
            {companyOverview?.description && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">
                    Description
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {companyOverview.description}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </details>
      </Card>

      {/* Team & Leadership */}
      <Card>
        <details className="group">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="font-semibold">Team & Leadership</span>
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <CardContent className="space-y-4 pt-4">
            {/* Team Overview */}
            <div>
              <p className="text-sm font-semibold mb-3">Team Overview</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {teamAndLeadership?.teamSize && (
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      Team Size
                    </p>
                    <p className="text-sm font-bold">
                      {teamAndLeadership.teamSize}
                    </p>
                  </div>
                )}
                {teamAndLeadership?.founders && (
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      Founders
                    </p>
                    <p className="text-sm font-bold">
                      {Array.isArray(teamAndLeadership.founders)
                        ? teamAndLeadership.founders.length
                        : teamAndLeadership.founders}
                    </p>
                  </div>
                )}
                {teamAndLeadership?.executiveTeamSize && (
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      Executives
                    </p>
                    <p className="text-sm font-bold">
                      {teamAndLeadership.executiveTeamSize}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Key Leaders / Founders */}
            {teamAndLeadership?.keyLeaders &&
              teamAndLeadership.keyLeaders.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      Key Leaders ({teamAndLeadership.keyLeaders.length})
                    </p>
                    <div className="space-y-3">
                      {teamAndLeadership.keyLeaders.map(
                        (leader: any, i: number) => (
                          <div key={i} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-sm font-semibold">
                                  {leader.name || "N/A"}
                                </p>
                                {leader.title && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {leader.title}
                                  </p>
                                )}
                              </div>
                              {leader.verified && (
                                <Badge variant="outline" className="text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            {leader.background && (
                              <p className="text-xs text-muted-foreground mb-2">
                                {leader.background}
                              </p>
                            )}
                            {leader.experience &&
                              leader.experience.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground font-medium mb-1">
                                    Experience:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {leader.experience
                                      .slice(0, 3)
                                      .map((exp: string, j: number) => (
                                        <Badge
                                          key={j}
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {exp}
                                        </Badge>
                                      ))}
                                  </div>
                                </div>
                              )}
                            {leader.previousCompanies &&
                              leader.previousCompanies.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground font-medium mb-1">
                                    Previous Companies:
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {leader.previousCompanies
                                      .slice(0, 3)
                                      .join(", ")}
                                  </p>
                                </div>
                              )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}

            {/* Founders (if provided as list) */}
            {Array.isArray(teamAndLeadership?.founders) &&
              teamAndLeadership.founders.length > 0 &&
              !teamAndLeadership?.keyLeaders && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      Founders ({teamAndLeadership.founders.length})
                    </p>
                    <div className="space-y-2">
                      {teamAndLeadership.founders.map(
                        (founder: any, i: number) => (
                          <div key={i} className="p-3 border rounded-lg">
                            {typeof founder === "string" ? (
                              <p className="text-sm font-semibold">{founder}</p>
                            ) : (
                              <>
                                <div className="flex items-start justify-between mb-1">
                                  <div>
                                    <p className="text-sm font-semibold">
                                      {founder.name || "N/A"}
                                    </p>
                                    {founder.role && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {founder.role}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {founder.background && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {founder.background}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}

            {/* Advisory Board */}
            {teamAndLeadership?.advisors &&
              teamAndLeadership.advisors.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      Advisory Board ({teamAndLeadership.advisors.length})
                    </p>
                    <div className="space-y-2">
                      {teamAndLeadership.advisors.map(
                        (advisor: any, i: number) => (
                          <div
                            key={i}
                            className="p-3 border rounded-lg flex items-start justify-between"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-semibold">
                                {typeof advisor === "string"
                                  ? advisor
                                  : advisor.name}
                              </p>
                              {typeof advisor === "object" &&
                                advisor.expertise && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {advisor.expertise}
                                  </p>
                                )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}

            {/* Team Strengths */}
            {teamAndLeadership?.strengths &&
              teamAndLeadership.strengths.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">Team Strengths</p>
                    <div className="space-y-2">
                      {teamAndLeadership.strengths.map(
                        (strength: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 p-2 border rounded-lg"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">
                              {strength}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}

            {/* Notable Hires / Key Talent */}
            {teamAndLeadership?.notableHires &&
              teamAndLeadership.notableHires.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">Notable Hires</p>
                    <div className="flex flex-wrap gap-2">
                      {teamAndLeadership.notableHires.map(
                        (hire: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {hire}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}

            {/* Team Culture / Values */}
            {teamAndLeadership?.culture && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold mb-2">Team Culture</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {teamAndLeadership.culture}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </details>
      </Card>

      {/* Funding History */}
      <Card>
        <details className="group">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <span className="font-semibold">Funding History</span>
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <CardContent className="space-y-4 pt-4">
            {/* Funding Summary */}
            <div>
              <p className="text-sm font-semibold mb-3">Funding Summary</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Total Funding
                  </p>
                  <p className="text-sm font-bold">
                    {fundingHistory?.totalFunding || "N/A"}
                  </p>
                </div>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Last Round
                  </p>
                  <p className="text-sm font-bold">
                    {fundingHistory?.lastRoundType || "N/A"}
                  </p>
                </div>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Last Round Amount
                  </p>
                  <p className="text-sm font-bold">
                    {fundingHistory?.lastRoundAmount || "N/A"}
                  </p>
                </div>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Last Round Date
                  </p>
                  <p className="text-sm font-bold">
                    {fundingHistory?.lastRoundDate || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Valuation */}
            {fundingHistory?.valuation && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold mb-2">
                    Valuation Details
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {fundingHistory.valuation}
                  </p>
                </div>
              </>
            )}

            {/* Funding Rounds */}
            {fundingHistory?.rounds && fundingHistory.rounds.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold mb-3">
                    Funding Rounds Timeline
                  </p>
                  {/* Funding Chart */}
                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={(() => {
                          // Sort and prepare data for chart
                          const sortedRounds = [...fundingHistory.rounds].sort(
                            (a, b) => {
                              const getYear = (dateStr: string) => {
                                if (!dateStr) return 0;
                                const match = dateStr.match(/\d{4}/);
                                return match ? parseInt(match[0]) : 0;
                              };
                              return getYear(a.date) - getYear(b.date);
                            }
                          );

                          return sortedRounds.map(
                            (roundData: any, i: number) => {
                              const parseAmount = (amt: string) => {
                                if (!amt) return 0;
                                const cleaned = amt.replace(
                                  /[^0-9.KMBkmb]/g,
                                  ""
                                );
                                let multiplier = 1;
                                if (/[Kk]/.test(amt)) multiplier = 1;
                                else if (/[Mm]/.test(amt)) multiplier = 1000;
                                else if (/[Bb]/.test(amt)) multiplier = 1000000;
                                const num = parseFloat(cleaned);
                                return isNaN(num) ? 0 : num * multiplier;
                              };

                              return {
                                name: roundData.round || `Round ${i + 1}`,
                                amount: parseAmount(roundData.amount),
                                displayAmount: roundData.amount || "N/A",
                                date: roundData.date || "N/A",
                                investors:
                                  roundData.leadInvestors?.length ||
                                  roundData.investors?.length ||
                                  0,
                                currency:
                                  roundData.amount?.match(/[$₹€£¥]/)?.[0] ||
                                  "$",
                              };
                            }
                          );
                        })()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted"
                        />
                        <XAxis
                          dataKey="name"
                          className="text-xs"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          className="text-xs"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            if (value >= 1000)
                              return `$${(value / 1000).toFixed(0)}M`;
                            if (value >= 1) return `$${value.toFixed(0)}M`;
                            return `$${value}K`;
                          }}
                        />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border rounded-lg p-3 shadow-lg">
                                  <p className="font-semibold text-sm">
                                    {data.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {data.date}
                                  </p>
                                  <p className="text-sm font-bold text-blue-600 mt-1">
                                    {data.displayAmount}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {data.investors} investors
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="amount"
                          fill="#3b82f6"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Detailed Round Information */}
                  <details className="mt-4">
                    <summary className="text-sm font-medium cursor-pointer hover:text-blue-600">
                      View Detailed Round Information
                    </summary>
                    <div className="space-y-2 mt-3">
                      {(() => {
                        const sortedRounds = [...fundingHistory.rounds].sort(
                          (a, b) => {
                            const getYear = (dateStr: string) => {
                              if (!dateStr) return 0;
                              const match = dateStr.match(/\d{4}/);
                              return match ? parseInt(match[0]) : 0;
                            };
                            return getYear(a.date) - getYear(b.date);
                          }
                        );

                        return sortedRounds.map((roundData: any, i: number) => (
                          <div
                            key={i}
                            className="p-3 border rounded-lg bg-muted/30"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold">
                                {roundData.round || `Round ${i + 1}`}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {roundData.date || "Date N/A"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                              {roundData.amount && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Amount:{" "}
                                  </span>
                                  <span className="font-medium">
                                    {roundData.amount}
                                  </span>
                                </div>
                              )}
                              {roundData.valuation && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Valuation:{" "}
                                  </span>
                                  <span className="font-medium">
                                    {roundData.valuation}
                                  </span>
                                </div>
                              )}
                            </div>
                            {roundData.leadInvestors &&
                              roundData.leadInvestors.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Lead Investors:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {roundData.leadInvestors.map(
                                      (inv: string, j: number) => (
                                        <Badge
                                          key={j}
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {inv}
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        ));
                      })()}
                    </div>
                  </details>
                </div>
              </>
            )}

            {/* Current Investors */}
            {fundingHistory?.currentInvestors &&
              fundingHistory.currentInvestors.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-2">
                      Current Investors (
                      {fundingHistory.currentInvestors.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {fundingHistory.currentInvestors.map(
                        (inv: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {typeof inv === "string" ? inv : inv.name}{" "}
                            {inv.notable && "⭐"}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}
          </CardContent>
        </details>
      </Card>

      {/* Revenue & Financial Health */}
      <Card>
        <details className="group">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <span className="font-semibold">Revenue & Financial Health</span>
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <CardContent className="space-y-4 pt-4">
            {/* Financial Metrics */}
            <div>
              <p className="text-sm font-semibold mb-3">Financial Metrics</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {financialHealth?.revenue && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      Annual Revenue
                    </p>
                    <p className="text-sm font-semibold">
                      {financialHealth.revenue}
                    </p>
                  </div>
                )}
                {financialHealth?.RevenueGrowthRate && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      Revenue Growth Rate
                    </p>
                    <p className="text-sm font-semibold">
                      {financialHealth.RevenueGrowthRate}
                    </p>
                  </div>
                )}
                {financialHealth?.profitability && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      Profitability
                    </p>
                    <p className="text-sm font-semibold">
                      {financialHealth.profitability}
                    </p>
                  </div>
                )}
                {financialHealth?.ebitda && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      EBITDA
                    </p>
                    <p className="text-sm font-semibold">
                      {financialHealth.ebitda}
                    </p>
                  </div>
                )}
                {financialHealth?.pat && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      PAT
                    </p>
                    <p className="text-sm font-semibold">
                      {financialHealth.pat}
                    </p>
                  </div>
                )}
                {financialHealth?.burnRate && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      Burn Rate
                    </p>
                    <p className="text-sm font-semibold">
                      {financialHealth.burnRate}
                    </p>
                  </div>
                )}
                {financialHealth?.runway && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      Runway
                    </p>
                    <p className="text-sm font-semibold">
                      {financialHealth.runway}
                    </p>
                  </div>
                )}
                {financialHealth?.cashReserves && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      Cash Reserves
                    </p>
                    <p className="text-sm font-semibold">
                      {financialHealth.cashReserves}
                    </p>
                  </div>
                )}
                {financialHealth?.margins && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      Margins
                    </p>
                    <p className="text-sm font-semibold">
                      {financialHealth.margins}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Revenue History */}
            {financialHealth?.revenueHistory &&
              financialHealth.revenueHistory.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      Revenue Growth Trajectory
                    </p>
                    {/* Revenue Chart */}
                    <div className="h-80 mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={(() => {
                            return financialHealth.revenueHistory.map(
                              (item: any, i: number) => {
                                const currentRevenue =
                                  item.revenue || item.amount;
                                const previousRevenue =
                                  i > 0
                                    ? financialHealth.revenueHistory[i - 1]
                                        .revenue ||
                                      financialHealth.revenueHistory[i - 1]
                                        .amount
                                    : null;

                                // Parse revenue for chart
                                const parseRevenue = (rev: string) => {
                                  if (!rev) return 0;
                                  const cleaned = rev.replace(
                                    /[^0-9.KMBkmb]/g,
                                    ""
                                  );
                                  let multiplier = 1;
                                  if (/[Kk]/.test(rev)) multiplier = 1;
                                  else if (/[Mm]/.test(rev)) multiplier = 1000;
                                  else if (/[Bb]/.test(rev))
                                    multiplier = 1000000;
                                  const num = parseFloat(cleaned);
                                  return isNaN(num) ? 0 : num * multiplier;
                                };

                                const currentNum = parseRevenue(currentRevenue);
                                const previousNum = previousRevenue
                                  ? parseRevenue(previousRevenue)
                                  : null;

                                let growthPercent = 0;
                                if (previousNum && previousNum !== 0) {
                                  growthPercent =
                                    ((currentNum - previousNum) / previousNum) *
                                    100;
                                }

                                return {
                                  year: item.year || item.period,
                                  revenue: currentNum,
                                  displayRevenue: currentRevenue,
                                  growth: growthPercent,
                                };
                              }
                            );
                          })()}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="colorRevenue"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#10b981"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#10b981"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-muted"
                          />
                          <XAxis
                            dataKey="year"
                            className="text-xs"
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            className="text-xs"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              if (value >= 1000)
                                return `$${(value / 1000).toFixed(0)}B`;
                              if (value >= 1) return `$${value.toFixed(0)}M`;
                              return `$${(value * 1000).toFixed(0)}K`;
                            }}
                          />
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                                    <p className="font-semibold text-sm">
                                      {data.year}
                                    </p>
                                    <p className="text-sm font-bold text-green-600 mt-1">
                                      {data.displayRevenue}
                                    </p>
                                    {data.growth !== 0 && (
                                      <p
                                        className={`text-xs mt-1 ${
                                          data.growth > 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                      >
                                        {data.growth > 0 ? "+" : ""}
                                        {data.growth.toFixed(1)}% YoY
                                      </p>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Revenue Table */}
                    <details className="mt-4">
                      <summary className="text-sm font-medium cursor-pointer hover:text-blue-600">
                        View Detailed Revenue Table
                      </summary>
                      <div className="border rounded-lg overflow-hidden mt-3">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-muted/50 border-b">
                              <tr>
                                <th className="text-left text-xs font-semibold text-muted-foreground p-2">
                                  Year
                                </th>
                                <th className="text-right text-xs font-semibold text-muted-foreground p-2">
                                  Revenue
                                </th>
                                <th className="text-right text-xs font-semibold text-muted-foreground p-2">
                                  YoY Growth
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {financialHealth.revenueHistory.map(
                                (item: any, i: number) => {
                                  const currentRevenue =
                                    item.revenue || item.amount;
                                  const previousRevenue =
                                    i > 0
                                      ? financialHealth.revenueHistory[i - 1]
                                          .revenue ||
                                        financialHealth.revenueHistory[i - 1]
                                          .amount
                                      : null;

                                  let growthText = "-";
                                  let growthClass = "text-muted-foreground";

                                  if (previousRevenue && currentRevenue) {
                                    const parseRevenue = (rev: string) => {
                                      const cleaned = rev.replace(
                                        /[^0-9.KMBkmb]/g,
                                        ""
                                      );
                                      let multiplier = 1;
                                      if (/[Kk]/.test(rev)) multiplier = 1000;
                                      else if (/[Mm]/.test(rev))
                                        multiplier = 1000000;
                                      else if (/[Bb]/.test(rev))
                                        multiplier = 1000000000;
                                      const num = parseFloat(cleaned);
                                      return isNaN(num)
                                        ? null
                                        : num * multiplier;
                                    };

                                    const currentNum =
                                      parseRevenue(currentRevenue);
                                    const previousNum =
                                      parseRevenue(previousRevenue);

                                    if (
                                      currentNum !== null &&
                                      previousNum !== null &&
                                      previousNum !== 0
                                    ) {
                                      const growthPercent =
                                        ((currentNum - previousNum) /
                                          previousNum) *
                                        100;
                                      if (growthPercent > 0.1) {
                                        growthText = `+${growthPercent.toFixed(
                                          0
                                        )}%`;
                                        growthClass =
                                          "text-green-600 font-semibold";
                                      } else if (growthPercent < -0.1) {
                                        growthText = `${growthPercent.toFixed(
                                          0
                                        )}%`;
                                        growthClass =
                                          "text-red-600 font-semibold";
                                      } else {
                                        growthText = "~0%";
                                        growthClass = "text-muted-foreground";
                                      }
                                    }
                                  }

                                  return (
                                    <tr
                                      key={i}
                                      className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                                    >
                                      <td className="text-xs font-medium p-2">
                                        {item.year || item.period}
                                      </td>
                                      <td className="text-sm font-bold text-right p-2">
                                        {currentRevenue}
                                      </td>
                                      <td
                                        className={`text-xs text-right p-2 ${growthClass}`}
                                      >
                                        {growthText}
                                      </td>
                                    </tr>
                                  );
                                }
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </details>
                  </div>
                </>
              )}
          </CardContent>
        </details>
      </Card>

            {/* Growth Trajectory */}
            <Card>
        <details className="group">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span className="font-semibold">Growth Trajectory</span>
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <CardContent className="space-y-4 pt-4">
            {/* Growth Summary - Interactive Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {growthTrajectory?.historicalGrowth && (
                <div className="group relative p-3 border-2 rounded-lg bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                      Historical Growth
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {growthTrajectory.historicalGrowth}
                  </p>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  </div>
                </div>
              )}

              {growthTrajectory?.projectedGrowth && (
                <div className="group relative p-3 border-2 rounded-lg bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10 hover:shadow-lg hover:border-green-400 transition-all cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm font-bold text-green-900 dark:text-green-100">
                      Projected Growth
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {growthTrajectory.projectedGrowth}
                  </p>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                  </div>
                </div>
              )}
            </div>

            {/* Growth Drivers - Interactive Cards */}
            {growthTrajectory?.growthDrivers &&
              growthTrajectory.growthDrivers.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-600" />
                      Growth Drivers
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {growthTrajectory.growthDrivers.map(
                        (driver: string, i: number) => (
                          <div
                            key={i}
                            className="group relative p-2 border rounded-lg bg-muted/30 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <Activity className="h-3 w-3 text-amber-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-normal group-hover:text-amber-900 dark:group-hover:text-amber-100 transition-colors">
                                  {driver}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}

            {/* Growth Milestones - Interactive Timeline */}
            {growthTrajectory?.milestones &&
              growthTrajectory.milestones.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-4">
                      Key Milestones Timeline
                    </p>

                    {/* Interactive Timeline Visualization */}
                    <MilestonesTimeline
                      milestones={growthTrajectory.milestones}
                    />
                  </div>
                </>
              )}

            {/* Challenges - Highlighted */}
            {growthTrajectory?.challenges &&
              growthTrajectory.challenges.length > 0 && (
                <>
                  <Separator />
                  <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription>
                      <p className="text-sm font-semibold mb-3 text-orange-900 dark:text-orange-100">
                        Key Challenges
                      </p>
                      <ul className="space-y-1.5 ml-4">
                        {growthTrajectory.challenges.map(
                          (challenge: string, i: number) => (
                            <li
                              key={i}
                              className="text-sm text-orange-800 dark:text-orange-200 list-disc"
                            >
                              {challenge}
                            </li>
                          )
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                </>
              )}
          </CardContent>
        </details>
      </Card>

      {/* Product Launches */}
      <Card>
        <details className="group">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <span className="font-semibold">Product Launches</span>
              {recentDevelopments?.productLaunches && recentDevelopments.productLaunches.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {recentDevelopments.productLaunches.length}
                </Badge>
              )}
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <CardContent className="space-y-4 pt-4">
            {recentDevelopments?.productLaunches &&
            recentDevelopments.productLaunches.length > 0 ? (
              <div className="space-y-3">
                {recentDevelopments.productLaunches.map(
                  (launch: string, i: number) => (
                    <div
                      key={i}
                      className="group relative p-4 border rounded-lg hover:border-primary/50 hover:bg-muted/30 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        {/* Launch Number */}
                        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
                          <span className="text-xs font-semibold text-primary">
                            {i + 1}
                          </span>
                        </div>
                        
                        {/* Launch Content */}
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed">
                            {launch}
                          </p>
                        </div>

                        {/* Icon */}
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-muted mb-3">
                  <Zap className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No product launches available</p>
              </div>
            )}
          </CardContent>
        </details>
      </Card>
      
      {/* Market Position */}
      <Card>
        <details className="group">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <span className="font-semibold">
                Market Position & Competition
              </span>
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <CardContent className="space-y-4 pt-4">
            {/* Market Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {marketPosition?.marketSize && (
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Market Size
                  </p>
                  <p className="text-sm font-medium">
                    {marketPosition.marketSize}
                  </p>
                </div>
              )}
              {marketPosition?.marketShare && (
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Market Share
                  </p>
                  <p className="text-sm font-medium">
                    {marketPosition.marketShare}
                  </p>
                </div>
              )}
              {marketPosition?.ranking && (
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Ranking
                  </p>
                  <p className="text-sm font-medium">{marketPosition.ranking}</p>
                </div>
              )}
              {marketPosition?.growthRate && (
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Growth Rate
                  </p>
                  <p className="text-sm font-medium">
                    {marketPosition.growthRate}
                  </p>
                </div>
              )}
            </div>

            {/* Market Trends */}
            {marketPosition?.marketTrends && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold mb-3">
                    Key Market Trends
                  </p>
                  <div className="space-y-2">
                    {(Array.isArray(marketPosition.marketTrends)
                      ? marketPosition.marketTrends
                      : String(marketPosition.marketTrends)
                          .split(/[\n\r•\-]+/)
                          .filter((t) => t.trim())
                    )
                      .slice(0, 6)
                      .map((trend: string, i: number) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-2 border rounded-lg bg-muted/30"
                        >
                          <TrendingUp className="h-4 w-4 shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">
                            {typeof trend === "string" ? trend.trim() : trend}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* Competitors */}
            {marketPosition?.competitors &&
              marketPosition.competitors.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      Key Competitors ({marketPosition.competitors.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {marketPosition.competitors
                        .slice(0, 6)
                        .map((competitor: any, i: number) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs"
                          >
                            {typeof competitor === "string"
                              ? competitor
                              : competitor.name}
                            {typeof competitor === "object" &&
                              competitor.marketShare && (
                                <span className="ml-1 text-muted-foreground">
                                  ({competitor.marketShare})
                                </span>
                              )}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </>
              )}

            {/* Competitive Advantages */}
            {marketPosition?.competitiveAdvantages &&
              marketPosition.competitiveAdvantages.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      Competitive Advantages
                    </p>
                    <div className="space-y-2">
                      {marketPosition.competitiveAdvantages
                        .slice(0, 6)
                        .map((advantage: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 p-2 border rounded-lg bg-muted/30"
                          >
                            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">
                              {advantage}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}

            {/* Target Market */}
            {marketPosition?.targetMarket && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold mb-2">Target Market</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {marketPosition.targetMarket}
                  </p>
                </div>
              </>
            )}

            {/* Customer Segments */}
            {marketPosition?.customerSegments &&
              marketPosition.customerSegments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-2">
                      Customer Segments
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {marketPosition.customerSegments.map(
                        (segment: string, i: number) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs"
                          >
                            {segment}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}
          </CardContent>
        </details>
      </Card>


      {/* Competitor Analysis (Detailed) */}
      <Card>
        <details className="group">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              <span className="font-semibold">Competitive Analysis</span>
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <CardContent className="space-y-4 pt-4">
            {/* Market Share Distribution */}
            {competitorAnalysis?.marketShareData && (
              <div>
                <p className="text-sm font-semibold mb-3">
                  Market Share Distribution
                </p>

                {/* Pie Chart */}
                <div className="h-80 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(() => {
                          const COLORS = [
                            "#3b82f6",
                            "#10b981",
                            "#f59e0b",
                            "#ef4444",
                            "#8b5cf6",
                            "#ec4899",
                            "#14b8a6",
                            "#f97316",
                          ];
                          return Object.entries(
                            competitorAnalysis.marketShareData
                          ).map(
                            ([company, share]: [string, any], i: number) => ({
                              name: company,
                              value:
                                typeof share === "number"
                                  ? share
                                  : parseInt(String(share)) || 0,
                              fill: COLORS[i % COLORS.length],
                            })
                          );
                        })()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        dataKey="value"
                      >
                        {Object.entries(competitorAnalysis.marketShareData).map(
                          (entry, index) => (
                            <Cell key={`cell-${index}`} />
                          )
                        )}
                      </Pie>
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg">
                                <p className="font-semibold text-sm">
                                  {data.name}
                                </p>
                                <p
                                  className="text-sm font-bold mt-1"
                                  style={{ color: data.payload.fill }}
                                >
                                  {data.value}% Market Share
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value, entry: any) => (
                          <span className="text-xs">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar Chart Alternative View */}
                <details className="mt-4">
                  <summary className="text-sm font-medium cursor-pointer hover:text-blue-600">
                    View as Bar Chart
                  </summary>
                  <div className="space-y-2 mt-3">
                    {Object.entries(competitorAnalysis.marketShareData).map(
                      ([company, share]: [string, any], i: number) => {
                        const percentage =
                          typeof share === "number"
                            ? share
                            : parseInt(String(share)) || 0;
                        const COLORS = [
                          "#3b82f6",
                          "#10b981",
                          "#f59e0b",
                          "#ef4444",
                          "#8b5cf6",
                          "#ec4899",
                          "#14b8a6",
                          "#f97316",
                        ];
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium">{company}</span>
                              <span className="text-muted-foreground">
                                {percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                              <div
                                className="h-3 rounded-full transition-all duration-500"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: COLORS[i % COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </details>
              </div>
            )}

            {/* Direct Competitors */}
            {competitorAnalysis?.directCompetitors &&
              competitorAnalysis.directCompetitors.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      Direct Competitors (
                      {competitorAnalysis.directCompetitors.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {competitorAnalysis.directCompetitors.map(
                        (comp: any, i: number) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs"
                          >
                            {comp.name || comp}
                          </Badge>
                        )
                      )}
                    </div>
                    {/* <div className="grid grid-cols-1 gap-3">
                      {competitorAnalysis.directCompetitors.map(
                        (comp: any, i: number) => (
                          <div
                            key={i}
                            className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <p className="text-sm font-semibold">
                                  {comp.name || comp}
                                </p>
                                {(comp.funding || comp.marketShare) && (
                                  <div className="flex gap-3 mt-2">
                                    {comp.funding &&
                                      comp.funding !== "Not available" && (
                                        <div>
                                          <p className="text-xs text-muted-foreground">
                                            Funding: {comp.funding}
                                          </p>
                                        </div>
                                      )}
                                    {comp.marketShare &&
                                      comp.marketShare !== "Not available" && (
                                        <div>
                                          <p className="text-xs text-muted-foreground">
                                            Market Share: {comp.marketShare}
                                          </p>
                                        </div>
                                      )}
                                  </div>
                                )}
                              </div>
                            </div>
                            {(comp.strengths || comp.weaknesses) && (
                              <div className="grid md:grid-cols-2 gap-3 mt-3">
                                {comp.strengths &&
                                  comp.strengths.length > 0 &&
                                  comp.strengths[0] !== "Not available" && (
                                    <div>
                                      <p className="text-xs font-medium text-green-600 mb-1">
                                        Strengths
                                      </p>
                                      <ul className="space-y-1">
                                        {comp.strengths
                                          .filter(
                                            (s: string) => s !== "Not available"
                                          )
                                          .map((s: string, j: number) => (
                                            <li
                                              key={j}
                                              className="text-xs text-muted-foreground flex items-start gap-1"
                                            >
                                              <span className="text-green-600">
                                                +
                                              </span>
                                              <span>{s}</span>
                                            </li>
                                          ))}
                                      </ul>
                                    </div>
                                  )}
                                {comp.weaknesses &&
                                  comp.weaknesses.length > 0 &&
                                  comp.weaknesses[0] !== "Not available" && (
                                    <div>
                                      <p className="text-xs font-medium text-red-600 mb-1">
                                        Weaknesses
                                      </p>
                                      <ul className="space-y-1">
                                        {comp.weaknesses
                                          .filter(
                                            (w: string) => w !== "Not available"
                                          )
                                          .map((w: string, j: number) => (
                                            <li
                                              key={j}
                                              className="text-xs text-muted-foreground flex items-start gap-1"
                                            >
                                              <span className="text-red-600">
                                                -
                                              </span>
                                              <span>{w}</span>
                                            </li>
                                          ))}
                                      </ul>
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div> */}
                  </div>
                </>
              )}

            {/* Competitive Advantages */}
            {competitorAnalysis?.advantages &&
              competitorAnalysis.advantages.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      Our Competitive Advantages
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {competitorAnalysis.advantages.map(
                        (adv: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 p-2 border rounded-lg bg-green-50/30 dark:bg-green-900/10"
                          >
                            <Zap className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">
                              {adv}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}

            {/* Competitive Positioning */}
            {competitorAnalysis?.competitiveComparison && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold mb-3">
                    Competitive Comparison
                  </p>
                  <div className="space-y-2">
                    {/* {competitorAnalysis.competitiveComparison.vsCompetitor1 && (
                      <div className="p-3 border rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {
                            competitorAnalysis.competitiveComparison
                              .vsCompetitor1
                          }
                        </p>
                      </div>
                    )}
                    {competitorAnalysis.competitiveComparison.vsCompetitor2 && (
                      <div className="p-3 border rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {
                            competitorAnalysis.competitiveComparison
                              .vsCompetitor2
                          }
                        </p>
                      </div>
                    )} */}
                    {competitorAnalysis.competitiveComparison
                      .overallPosition && (
                      <div className="p-3 border rounded-lg bg-blue-50/30 dark:bg-blue-900/10">
                        <p className="text-xs text-muted-foreground font-medium mb-1">
                          Overall Position
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {
                            competitorAnalysis.competitiveComparison
                              .overallPosition
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </details>
      </Card>


      {/* IPO Analysis */}
      <Card>
        <details className="group">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
            <div className="flex items-center gap-2">
              <LineChartIcon className="h-5 w-5" />
              <span className="font-semibold">IPO Analysis</span>
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <CardContent className="space-y-4 pt-4">
            {/* IPO Potential */}
            {ipoAnalysis?.ipoPotential && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold">IPO Potential</p>
                  <Badge
                    variant={
                      ipoAnalysis.ipoPotential === "High"
                        ? "default"
                        : ipoAnalysis.ipoPotential === "Medium"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-xs"
                  >
                    {ipoAnalysis.ipoPotential}
                  </Badge>
                </div>
              </div>
            )}

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ipoAnalysis?.estimatedTimeline && (
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Timeline
                  </p>
                  <p className="text-sm font-bold">
                    {ipoAnalysis.estimatedTimeline}
                  </p>
                </div>
              )}

              {ipoAnalysis?.estimatedValuation &&
                ipoAnalysis.estimatedValuation !== "Not publicly available" && (
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      Est. Valuation
                    </p>
                    <p className="text-sm font-bold">
                      {ipoAnalysis.estimatedValuation}
                    </p>
                  </div>
                )}

              {ipoAnalysis?.comparableIPOs &&
                ipoAnalysis.comparableIPOs.length > 0 && (
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      Comparables
                    </p>
                    <p className="text-sm font-bold">
                      {ipoAnalysis.comparableIPOs.length} Companies
                    </p>
                  </div>
                )}
            </div>

            {/* Readiness & Conditions */}
            {ipoAnalysis?.ipoReadiness && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold mb-2">
                    Readiness Assessment
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {ipoAnalysis.ipoReadiness}
                  </p>
                </div>
              </>
            )}

            {ipoAnalysis?.marketConditions &&
              ipoAnalysis.marketConditions !== "Not publicly available" && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-2">
                      Market Conditions
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {ipoAnalysis.marketConditions}
                    </p>
                  </div>
                </>
              )}

            {/* Comparable IPOs */}
            {ipoAnalysis?.comparableIPOs &&
              ipoAnalysis.comparableIPOs.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      Comparable IPOs
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ipoAnalysis.comparableIPOs
                        .slice(0, 6)
                        .map((ipo: any, i: number) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs"
                          >
                            {typeof ipo === "string"
                              ? ipo
                              : ipo.name || ipo.company}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </>
              )}
          </CardContent>
        </details>
      </Card>

      {/* Recent Developments */}
      <Card>
        <details className="group">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              <span className="font-semibold">Recent Developments</span>
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <CardContent className="space-y-4 pt-4">
            {/* Recent News */}
            {recentDevelopments?.recentNews &&
              recentDevelopments.recentNews.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-3">
                    Recent News ({recentDevelopments.recentNews.length})
                  </p>
                  <div className="space-y-3">
                    {recentDevelopments.recentNews.map(
                      (news: any, i: number) => (
                        <div
                          key={i}
                          className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="text-sm font-semibold mb-1">
                                {news.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{news.date}</span>
                                <span>•</span>
                                <span>{news.source}</span>
                              </div>
                            </div>
                            {news.sentiment && (
                              <Badge
                                variant={
                                  news.sentiment === "positive"
                                    ? "default"
                                    : news.sentiment === "negative"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {news.sentiment}
                              </Badge>
                            )}
                          </div>
                          {news.summary && (
                            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                              {news.summary}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Partnerships */}
            {recentDevelopments?.partnerships &&
              recentDevelopments.partnerships.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">Partnerships</p>
                    <div className="space-y-2">
                      {recentDevelopments.partnerships.map(
                        (partnership: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 p-2 border rounded-lg bg-blue-50/30 dark:bg-blue-900/10"
                          >
                            <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">
                              {partnership}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}

            {/* Awards */}
            {recentDevelopments?.awards &&
              recentDevelopments.awards.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      Awards & Recognition
                    </p>
                    <div className="space-y-2">
                      {recentDevelopments.awards.map(
                        (award: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 p-2 border rounded-lg bg-yellow-50/30 dark:bg-yellow-900/10"
                          >
                            <Star
                              className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5"
                              fill="currentColor"
                            />
                            <span className="text-sm text-muted-foreground">
                              {award}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}

            {/* Empty State */}
            {(!recentDevelopments?.recentNews ||
              recentDevelopments.recentNews.length === 0) &&
              (!recentDevelopments?.productLaunches ||
                recentDevelopments.productLaunches.length === 0) &&
              (!recentDevelopments?.partnerships ||
                recentDevelopments.partnerships.length === 0) &&
              (!recentDevelopments?.awards ||
                recentDevelopments.awards.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Newspaper className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent developments available</p>
                </div>
              )}
          </CardContent>
        </details>
      </Card>

      {/* Risk Analysis */}
      <Card>
        <details className="group">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Risk Assessment</span>
              <Badge variant="outline" className="text-xs ml-2">
                {riskAnalysis?.overallRiskLevel || "N/A"}
              </Badge>
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <CardContent className="space-y-4 pt-4">
            {/* Risk Summary */}
            {(() => {
              // Show count if risks exist (even without full details)
              const hasHighRisks = riskAnalysis?.highRisks?.length > 0;
              const hasMediumRisks = riskAnalysis?.mediumRisks?.length > 0;
              const hasLowRisks = riskAnalysis?.lowRisks?.length > 0;

              if (!hasHighRisks && !hasMediumRisks && !hasLowRisks) return null;

              return (
                <div className="grid grid-cols-3 gap-3">
                  {hasHighRisks && (
                    <div className="p-3 border rounded-lg border-red-200 bg-red-50/30 dark:bg-red-900/10">
                      <p className="text-xs text-muted-foreground font-medium mb-1">
                        High Risk
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {riskAnalysis.highRisks.length}
                      </p>
                    </div>
                  )}
                  {hasMediumRisks && (
                    <div className="p-3 border rounded-lg border-yellow-200 bg-yellow-50/30 dark:bg-yellow-900/10">
                      <p className="text-xs text-muted-foreground font-medium mb-1">
                        Medium Risk
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {riskAnalysis.mediumRisks.length}
                      </p>
                    </div>
                  )}
                  {hasLowRisks && (
                    <div className="p-3 border rounded-lg border-blue-200 bg-blue-50/30 dark:bg-blue-900/10">
                      <p className="text-xs text-muted-foreground font-medium mb-1">
                        Low Risk
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {riskAnalysis.lowRisks.length}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* High Priority Risks */}
            {(() => {
              const validHighRisks =
                riskAnalysis?.highRisks?.filter(
                  (r: any) => (r.risk || r.title) && (r.impact || r.description)
                ) || [];
              if (validHighRisks.length === 0) return null;

              return (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      High Priority Risks ({validHighRisks.length})
                    </p>
                    <div className="space-y-3">
                      {validHighRisks.map((risk: any, i: number) => (
                        <div
                          key={i}
                          className="p-4 rounded-lg border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-sm">
                              {risk.risk || risk.title}
                            </h4>
                            <Badge variant="destructive" className="text-xs">
                              High
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                            {risk.impact || risk.description}
                          </p>
                          {risk.mitigation && (
                            <div className="mt-2 pt-2 border-t border-red-200">
                              <p className="text-xs text-muted-foreground font-medium mb-1">
                                Mitigation:
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {risk.mitigation}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Medium Priority Risks */}
            {(() => {
              const validMediumRisks =
                riskAnalysis?.mediumRisks?.filter(
                  (r: any) => (r.risk || r.title) && (r.impact || r.description)
                ) || [];
              if (validMediumRisks.length === 0) return null;

              return (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      Medium Priority Risks ({validMediumRisks.length})
                    </p>
                    <div className="space-y-2">
                      {validMediumRisks
                        .slice(0, 5)
                        .map((risk: any, i: number) => (
                          <div
                            key={i}
                            className="p-3 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10"
                          >
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-semibold text-sm">
                                {risk.risk || risk.title}
                              </h4>
                              <Badge variant="secondary" className="text-xs">
                                Medium
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {risk.impact || risk.description}
                            </p>
                          </div>
                        ))}
                      {validMediumRisks.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          +{validMediumRisks.length - 5} more medium risks
                        </p>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Low Priority Risks */}
            {(() => {
              const validLowRisks =
                riskAnalysis?.lowRisks?.filter(
                  (r: any) => (r.risk || r.title) && (r.impact || r.description)
                ) || [];
              if (validLowRisks.length === 0) return null;

              return (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      Low Priority Risks ({validLowRisks.length})
                    </p>
                    <div className="space-y-2">
                      {validLowRisks.slice(0, 5).map((risk: any, i: number) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-semibold text-sm">
                              {risk.risk || risk.title}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              Low
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {risk.impact || risk.description}
                          </p>
                        </div>
                      ))}
                      {validLowRisks.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          +{validLowRisks.length - 5} more low risks
                        </p>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Risk Categories */}
            {riskAnalysis?.risksByCategory &&
              Object.keys(riskAnalysis.risksByCategory).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      Risks by Category
                    </p>

                    {/* Bar Chart Visualization */}
                    <div className="h-64 mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={Object.entries(
                            riskAnalysis.risksByCategory
                          ).map(([category, count]: [string, any]) => ({
                            category:
                              category.charAt(0).toUpperCase() +
                              category.slice(1),
                            count:
                              typeof count === "number"
                                ? count
                                : parseInt(String(count)) || 0,
                          }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-muted"
                          />
                          <XAxis
                            dataKey="category"
                            className="text-xs"
                            tick={{ fontSize: 11 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                                    <p className="font-semibold text-sm">
                                      {data.category}
                                    </p>
                                    <p className="text-sm font-bold text-orange-600 mt-1">
                                      {data.count}{" "}
                                      {data.count === 1 ? "Risk" : "Risks"}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar
                            dataKey="count"
                            fill="#f59e0b"
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* List View */}
                    <details className="mt-4">
                      <summary className="text-sm font-medium cursor-pointer hover:text-blue-600">
                        View Category List
                      </summary>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                        {Object.entries(riskAnalysis.risksByCategory).map(
                          ([category, count]: [string, any], i: number) => (
                            <div
                              key={i}
                              className="p-2 border rounded-lg flex items-center justify-between"
                            >
                              <span className="text-xs font-medium capitalize">
                                {category}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {count}
                              </Badge>
                            </div>
                          )
                        )}
                      </div>
                    </details>
                  </div>
                </>
              )}

            {/* Mitigation Strategies */}
            {riskAnalysis?.mitigationStrategies &&
              riskAnalysis.mitigationStrategies.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      Key Mitigation Strategies
                    </p>
                    <div className="space-y-2">
                      {riskAnalysis.mitigationStrategies.map(
                        (strategy: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 p-2 border rounded-lg"
                          >
                            <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">
                              {strategy}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}

            {/* Risk Score/Rating */}
            {riskAnalysis?.riskScore && (
              <>
                <Separator />
                <div className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">
                      Overall Risk Score
                    </span>
                    <Badge
                      variant={
                        riskAnalysis.riskScore > 70
                          ? "destructive"
                          : riskAnalysis.riskScore > 40
                          ? "secondary"
                          : "default"
                      }
                      className="text-xs"
                    >
                      {riskAnalysis.riskScore}/100
                    </Badge>
                  </div>
                  {riskAnalysis?.riskAssessment && (
                    <p className="text-xs text-muted-foreground">
                      {riskAnalysis.riskAssessment}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* No risks identified */}
            {!riskAnalysis?.highRisks?.length &&
              !riskAnalysis?.mediumRisks?.length &&
              !riskAnalysis?.lowRisks?.length && (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No significant risks identified
                  </p>
                </div>
              )}
          </CardContent>
        </details>
      </Card>

           {/* Investment Rationale */}
           <div className="grid md:grid-cols-1 gap-6">
        {/* Why Invest */}
        <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold">Why Invest</span>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="pt-4">
              <ul className="space-y-2">
                {investmentRationale?.whyInvest &&
                investmentRationale.whyInvest.length > 0 ? (
                  investmentRationale.whyInvest
                    .slice(0, 5)
                    .map((reason: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">
                          {reason}
                        </span>
                      </li>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No data available
                  </p>
                )}
              </ul>
            </CardContent>
          </details>
        </Card>

        {/* Why Not Invest */}
        {/* <Card>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-semibold">Why Not Invest</span>
              </div>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <CardContent className="pt-4">
              <ul className="space-y-2">
                {investmentRationale?.whyNotInvest &&
                investmentRationale.whyNotInvest.length > 0 ? (
                  investmentRationale.whyNotInvest
                    .slice(0, 5)
                    .map((reason: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">
                          {reason}
                        </span>
                      </li>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No data available
                  </p>
                )}
              </ul>
            </CardContent>
          </details>
        </Card> */}
      </div>

      {/* Data Sources & Metadata - Bottom */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Sources Section */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground">
                  Sources:
                </span>
              </div>

              <button
                onClick={() => setShowSources(!showSources)}
                className="flex items-center gap-2 hover:bg-muted/50 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
              >
                {/* Source Icons - Show first 3 source logos */}
                <div className="flex items-center -space-x-2">
                  {(() => {
                    const sources = metadata?.sources || [];
                    const firstThree = sources.slice(0, 3);

                    // Helper function to extract domain from URL
                    const getDomain = (source: any) => {
                      let url =
                        typeof source === "string" ? source : source.url;
                      if (!url) return null;

                      try {
                        // If URL doesn't have protocol, add https://
                        if (
                          !url.startsWith("http://") &&
                          !url.startsWith("https://")
                        ) {
                          url = "https://" + url;
                        }
                        const urlObj = new URL(url);
                        return urlObj.hostname;
                      } catch {
                        // If still fails, try to extract domain manually
                        const match = url.match(
                          /(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/
                        );
                        return match ? match[1] : null;
                      }
                    };

                    // Helper function to get first letter for fallback
                    const getFirstLetter = (source: any) => {
                      const name =
                        typeof source === "string"
                          ? source
                          : source.name || source.url || "S";
                      return name.charAt(0).toUpperCase();
                    };

                    // If no sources, show default icons
                    if (firstThree.length === 0) {
                      return (
                        <>
                          <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-background flex items-center justify-center shadow-sm">
                            <Search className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-background flex items-center justify-center shadow-sm">
                            <Database className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-background flex items-center justify-center shadow-sm">
                            <ExternalLink className="h-4 w-4 text-purple-600" />
                          </div>
                        </>
                      );
                    }

                    return firstThree.map((source: any, i: number) => {
                      const domain = getDomain(source);
                      const firstLetter = getFirstLetter(source);
                      const colors = [
                        {
                          bg: "bg-blue-100 dark:bg-blue-900",
                          text: "text-blue-600 dark:text-blue-300",
                        },
                        {
                          bg: "bg-green-100 dark:bg-green-900",
                          text: "text-green-600 dark:text-green-300",
                        },
                        {
                          bg: "bg-purple-100 dark:bg-purple-900",
                          text: "text-purple-600 dark:text-purple-300",
                        },
                      ];
                      const colorSet = colors[i % colors.length];

                      // If we have a domain, try to show favicon
                      if (domain) {
                        return (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-background flex items-center justify-center shadow-sm overflow-hidden relative"
                          >
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                              alt={domain}
                              className="w-5 h-5 object-contain"
                              onError={(e) => {
                                // Replace with letter fallback if favicon fails
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class="w-full h-full ${colorSet.bg} ${colorSet.text} flex items-center justify-center text-xs font-bold">${firstLetter}</div>`;
                                }
                              }}
                            />
                          </div>
                        );
                      }

                      // Fallback: show first letter with colored background
                      return (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full border-2 border-background shadow-sm overflow-hidden"
                        >
                          <div
                            className={`w-full h-full ${colorSet.bg} ${colorSet.text} flex items-center justify-center text-xs font-bold`}
                          >
                            {firstLetter}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Remaining Sources Count */}
                {metadata?.sources?.length > 3 && (
                  <Badge variant="secondary" className="text-xs font-semibold">
                    +{metadata.sources.length - 3} more
                  </Badge>
                )}

                {metadata?.sources?.length > 0 &&
                  metadata?.sources?.length <= 3 && (
                    <Badge
                      variant="secondary"
                      className="text-xs font-semibold"
                    >
                      {metadata.sources.length}{" "}
                      {metadata.sources.length === 1 ? "source" : "sources"}
                    </Badge>
                  )}

                {/* Toggle Icon */}
                {showSources ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>

            {/* Metadata Info */}
            <div className="flex items-center gap-6">
              {/* Research Time */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Research Time</p>
                  <p className="text-sm font-semibold">
                    {metadata?.timeTakenSeconds || 0}s
                  </p>
                </div>
              </div>

              {/* Overall Confidence */}
              {metadata?.overallConfidence && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <div className="mt-0.5">
                      {getConfidenceBadge(metadata.overallConfidence)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Expandable Sources List */}
          {showSources && (
            <>
              <Separator className="my-4" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    All Data Sources ({metadata?.sources?.length || 0})
                  </p>
                </div>
                {metadata?.sources && metadata.sources.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {metadata.sources.map((source: any, i: number) => {
                      // Handle both string and object formats
                      const sourceName =
                        typeof source === "string"
                          ? source
                          : source.name || source.url || "Unknown Source";
                      const sourceUrl =
                        typeof source === "object" ? source.url : null;
                      const relevance =
                        typeof source === "object" ? source.relevance : null;

                      return (
                        <div
                          key={i}
                          className="p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <ExternalLink className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium break-words">
                                {sourceName}
                              </p>
                              {sourceUrl && (
                                <a
                                  href={sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-xs truncate block mt-1"
                                >
                                  {sourceUrl}
                                </a>
                              )}
                              {relevance && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] mt-1"
                                >
                                  {relevance}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Multiple public sources including search engines, databases,
                    and web APIs
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
