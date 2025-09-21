import "dotenv/config";
import { analyzeStartupDocuments } from './server/gemini';

const testDocuments = [
  {
    name: "EcoTrack Pitch Deck",
    type: "application/pdf",
    content: `
# EcoTrack - Pre-Seed Pitch Deck

## Company Overview
EcoTrack is a sustainability tracking platform for small businesses.

## Market Opportunity
- Total Addressable Market: $50B
- Growing at 15% annually
- 2M+ small businesses need sustainability tracking

## Team
- CEO: Jane Smith (ex-Google, 10 years experience)
- CTO: John Doe (ex-Microsoft, 8 years experience)
- CFO: Sarah Johnson (ex-PwC, 12 years experience)

## Product
- SaaS platform for carbon footprint tracking
- AI-powered insights and recommendations
- Mobile app for field data collection

## Traction
- 500+ beta users
- $50K ARR
- 20% month-over-month growth
- 4.8/5 customer satisfaction

## Financials
- Current burn: $25K/month
- Runway: 18 months
- Projected revenue: $2M by end of year 2
- Unit economics: $200 CAC, $2,400 LTV

## Competition
- Direct competitors: CarbonTracker, GreenBiz
- Competitive advantage: AI-powered insights, better UX
- Market differentiation: Focus on small businesses

## Funding
- Seeking: $1.5M pre-seed
- Use of funds: 60% product development, 25% marketing, 15% operations
- Expected return: 10x in 5 years
    `
  }
];

async function testResilientAnalysis() {
  console.log('🚀 Testing resilient Gemini API with retry logic...\n');
  
  const startTime = Date.now();
  
  try {
    const result = await analyzeStartupDocuments(testDocuments);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`\n✅ Analysis completed in ${duration}ms!`);
    console.log('📊 Results:');
    console.log(`   Overall Score: ${result.overallScore}`);
    console.log(`   Risk Level: ${result.riskLevel}`);
    console.log(`   Recommendation: ${result.recommendation.decision}`);
    console.log(`   Target Investment: $${result.recommendation.targetInvestment.toLocaleString()}`);
    console.log(`   Expected Return: ${result.recommendation.expectedReturn}x`);
    
    console.log('\n📈 Metrics:');
    Object.entries(result.metrics).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    console.log('\n🚨 Risk Flags:');
    result.riskFlags.forEach(flag => {
      console.log(`   [${flag.type.toUpperCase()}] ${flag.category}: ${flag.description}`);
    });
    
    console.log('\n💡 Key Insights:');
    result.keyInsights.forEach(insight => {
      console.log(`   • ${insight}`);
    });
    
    console.log('\n🎯 Recommendation Reasoning:');
    console.log(`   ${result.recommendation.reasoning}`);
    
    return true;
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    return false;
  }
}

testResilientAnalysis();
