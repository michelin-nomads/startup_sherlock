# Deep Research Integration Guide

This guide explains how to use **deep research/deep thinking** capabilities with Gemini 2.5 Pro in your Startup Sherlock API **without user intervention**.

---

## 🎯 Two Approaches Available

### **Approach 1: Enhanced Reasoning (RECOMMENDED) ✅**
- **Status**: Ready to use NOW
- **Requirements**: Your existing Gemini API key
- **Access**: No special approval needed
- **Quality**: Excellent for deep analysis
- **Cost**: Standard Gemini 2.5 Pro pricing

### **Approach 2: Discovery Engine Deep Research**
- **Status**: Requires allowlist approval
- **Requirements**: Google Cloud project + Discovery Engine setup
- **Access**: Need to request from Google Cloud
- **Quality**: Google's most advanced research agent
- **Cost**: Enterprise pricing

---

## 🚀 Quick Start (Enhanced Reasoning - Recommended)

### 1. **No Additional Setup Required!**

The enhanced reasoning approach uses your existing Gemini API key. No new credentials needed.

### 2. **Register the New Routes**

Add to your `server/index.ts`:

```typescript
import { registerDeepResearchRoutes } from "./deepResearchRoutes";

// After your existing routes
registerDeepResearchRoutes(app);
```

### 3. **Use the API**

#### Option A: Deep Analysis (Single Dimension)
```bash
curl -X POST http://localhost:5000/api/deep-analyze/STARTUP_ID \
  -H "Content-Type: application/json" \
  -d '{
    "analysisType": "comprehensive"
  }'
```

**Analysis Types:**
- `comprehensive` - Full multi-dimensional analysis (default)
- `financial` - Deep financial due diligence
- `market` - TAM validation, competitive analysis
- `team` - Founder capability assessment

#### Option B: Multi-Dimensional Analysis (Recommended)
```bash
curl -X POST http://localhost:5000/api/multi-dimensional-analyze/STARTUP_ID
```

This runs 4 analyses in parallel:
- Financial deep dive
- Market validation
- Team assessment  
- Comprehensive synthesis

Returns integrated insights across all dimensions.

### 4. **Automatic Analysis After Upload**

Modify your existing `/api/analyze/:startupId` to automatically use deep analysis:

```typescript
// In server/routes.ts
import { enhancedReasoningService } from './deepResearch';

app.post("/api/analyze/:startupId", async (req: Request, res: Response) => {
  try {
    const { startupId } = req.params;
    const { useDeepAnalysis = true } = req.body; // Auto-enable deep analysis
    
    const startup = await storage.getStartup(startupId);
    const documents = await storage.getDocumentsByStartup(startupId);
    
    const documentData = documents.map(doc => ({
      content: doc.extractedText || '',
      type: doc.fileType,
      name: doc.fileName
    }));

    let analysisResult;
    
    if (useDeepAnalysis) {
      // Use enhanced reasoning for better insights
      analysisResult = await enhancedReasoningService.analyzeWithDeepThinking(
        documentData,
        'comprehensive'
      );
    } else {
      // Fallback to standard analysis
      analysisResult = await analyzeStartupDocuments(documentData);
    }

    await storage.updateStartup(startupId, {
      overallScore: analysisResult.overallScore,
      analysisData: analysisResult
    });

    res.json({ startup, analysis: analysisResult });
  } catch (error) {
    // Handle error
  }
});
```

---

## 📊 What Deep Reasoning Provides

### Enhanced Over Standard Analysis:

**Standard Gemini Analysis:**
```json
{
  "overallScore": 75,
  "metrics": { ... },
  "keyInsights": ["Good team", "Strong market"]
}
```

**Enhanced Reasoning Analysis:**
```json
{
  "evidenceValidation": {
    "validatedClaims": ["Revenue grew 200% YoY with proof in financials"],
    "questionableClaims": ["TAM of $50B seems inflated"],
    "unsupportedClaims": ["Claim of 10,000 users lacks evidence"],
    "dataGaps": ["Missing burn rate information"]
  },
  "deepInsights": [
    {
      "category": "financial",
      "insight": "Unit economics show LTV/CAC of 5.2x, exceptional for SaaS",
      "evidence": ["CAC calculated at $500", "LTV estimated at $2,600"],
      "implications": "Strong capital efficiency suggests profitability path",
      "confidence": "high"
    }
  ],
  "riskAdjustedScores": {
    "market": {
      "baseScore": 78,
      "confidenceInterval": "72-84",
      "keyDrivers": ["Growing market", "First-mover advantage"]
    }
  },
  "investmentThesis": {
    "bullCase": {
      "narrative": "If team executes, could capture 5% of market...",
      "keyDrivers": ["Product-market fit", "Capital efficient growth"],
      "upside": "20x potential return",
      "probability": "35%"
    },
    "bearCase": {
      "narrative": "Competition from incumbents could squeeze margins...",
      "keyRisks": ["Low barriers to entry", "Customer concentration"],
      "downside": "50% loss",
      "probability": "25%"
    },
    "baseCase": {
      "narrative": "Steady growth with moderate exit...",
      "expectedValue": "5x return in 5 years",
      "probability": "40%"
    }
  },
  "criticalQuestions": [
    "What is the customer retention rate?",
    "How defensible is the technology?",
    "What happens if Series A funding is delayed?"
  ]
}
```

### Key Differences:

1. **Evidence Validation** - Explicitly validates claims vs. assumptions
2. **Confidence Intervals** - Provides score ranges, not just point estimates
3. **Scenario Analysis** - Bull/bear/base cases with probabilities
4. **Critical Thinking** - Identifies what's missing, not just what's present
5. **Actionable Questions** - Surfaces key unknowns that need investigation

---

## 🔧 Advanced Integration Patterns

### Pattern 1: Automated Deep Analysis Pipeline

```typescript
// Automatically run deep analysis after document upload
app.post("/api/upload/:startupId", upload.array('documents'), async (req, res) => {
  // 1. Process and save documents
  const processedDocs = await processDocuments(files);
  
  // 2. Automatically trigger deep analysis (no user action needed)
  setTimeout(async () => {
    const documents = await storage.getDocumentsByStartup(startupId);
    const documentData = documents.map(doc => ({
      content: doc.extractedText,
      type: doc.fileType,
      name: doc.fileName
    }));
    
    // Run in background
    const deepAnalysis = await enhancedReasoningService.analyzeWithDeepThinking(
      documentData,
      'comprehensive'
    );
    
    await storage.updateStartup(startupId, {
      analysisData: { deepAnalysis }
    });
    
    console.log(`✅ Auto deep analysis completed for ${startupId}`);
  }, 5000); // Run after 5 seconds
  
  res.json({ success: true, startupId });
});
```

### Pattern 2: Scheduled Deep Analysis

```typescript
import cron from 'node-cron';

// Re-analyze all startups daily with latest model improvements
cron.schedule('0 2 * * *', async () => { // 2 AM daily
  console.log('🔄 Running scheduled deep analysis refresh...');
  
  const startups = await storage.getAllStartups();
  
  for (const startup of startups) {
    try {
      const documents = await storage.getDocumentsByStartup(startup.id);
      const documentData = documents.map(doc => ({
        content: doc.extractedText,
        type: doc.fileType,
        name: doc.fileName
      }));
      
      const analysis = await enhancedReasoningService.analyzeWithDeepThinking(
        documentData,
        'comprehensive'
      );
      
      await storage.updateStartup(startup.id, {
        analysisData: { ...startup.analysisData, deepAnalysis: analysis }
      });
      
      console.log(`✅ Refreshed analysis for ${startup.name}`);
    } catch (error) {
      console.error(`❌ Failed to refresh ${startup.name}:`, error);
    }
  }
  
  console.log('✅ Scheduled deep analysis refresh completed');
});
```

### Pattern 3: Conditional Deep Analysis

```typescript
// Only run deep analysis for high-value opportunities
app.post("/api/analyze/:startupId", async (req, res) => {
  const documents = await getDocuments(startupId);
  
  // 1. Run quick standard analysis first
  const quickAnalysis = await analyzeStartupDocuments(documents);
  
  // 2. If promising, automatically run deep analysis
  if (quickAnalysis.overallScore >= 70 && 
      quickAnalysis.recommendation.decision !== 'pass') {
    
    console.log('🎯 High-potential startup detected, running deep analysis...');
    
    const deepAnalysis = await enhancedReasoningService.multiDimensionalDeepAnalysis(
      documents
    );
    
    return res.json({
      quickAnalysis,
      deepAnalysis,
      recommendation: 'Proceed with detailed due diligence'
    });
  }
  
  // Return standard analysis for lower scores
  res.json({ quickAnalysis });
});
```

### Pattern 4: Progressive Analysis

```typescript
// Start with quick analysis, progressively add depth
app.post("/api/progressive-analyze/:startupId", async (req, res) => {
  const documents = await getDocuments(startupId);
  
  // Stage 1: Quick screening (30 seconds)
  const screening = await standardAnalysis(documents);
  
  // Stage 2: If passes screening, run financial deep dive (2 mins)
  if (screening.overallScore >= 60) {
    const financial = await enhancedReasoningService.analyzeWithDeepThinking(
      documents,
      'financial'
    );
    
    // Stage 3: If financials look good, run full multi-dimensional (5 mins)
    if (financial.overallFinancialScore >= 70) {
      const comprehensive = await enhancedReasoningService.multiDimensionalDeepAnalysis(
        documents
      );
      
      return res.json({
        stage: 'comprehensive',
        analysis: comprehensive
      });
    }
    
    return res.json({
      stage: 'financial',
      screening,
      financial
    });
  }
  
  res.json({
    stage: 'screening',
    screening
  });
});
```

---

## 🔐 Discovery Engine Setup (Optional - For Allowlist Users)

If you have access to Google Cloud Discovery Engine API:

### 1. **Environment Variables**

Add to your `.env`:

```bash
# Discovery Engine Configuration (Optional)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
DISCOVERY_ENGINE_APP_ID=your-app-id
DISCOVERY_ENGINE_DATA_STORE_ID=your-datastore-id
GOOGLE_CLOUD_ACCESS_TOKEN=<run: gcloud auth print-access-token>
```

### 2. **Request Allowlist Access**

Contact Google Cloud support or use the console to request access to:
- Discovery Engine API
- Deep Research agent (`deep_research`)

### 3. **Use Discovery Endpoint**

```bash
curl -X POST http://localhost:5000/api/discovery-research/STARTUP_ID \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Conduct comprehensive research on this startup"
  }'
```

---

## 📈 Performance Comparison

| Method | Speed | Depth | Cost | Setup |
|--------|-------|-------|------|-------|
| Standard Analysis | 10-30s | Good | $ | None |
| Enhanced Reasoning | 30-90s | Excellent | $$ | None |
| Multi-Dimensional | 90-240s | Best | $$$ | None |
| Discovery Engine | 300-600s | Research-grade | $$$$ | Allowlist |

**Recommendation:** Start with **Enhanced Reasoning** for best balance of depth and practicality.

---

## 💡 Best Practices

### 1. **Cache Analysis Results**
Deep analysis is compute-intensive. Store results and only re-run when documents change.

```typescript
const lastAnalyzed = startup.analysisData?.analyzedAt;
const documentLastUpdated = Math.max(...documents.map(d => d.uploadedAt));

if (!lastAnalyzed || documentLastUpdated > lastAnalyzed) {
  // Run fresh analysis
  const analysis = await enhancedReasoningService.analyzeWithDeepThinking(...);
} else {
  // Use cached analysis
  const analysis = startup.analysisData.deepAnalysis;
}
```

### 2. **Use Appropriate Analysis Type**
Don't run multi-dimensional analysis for every startup. Use conditionally:

```typescript
const analysisType = determineAnalysisType(startup);

function determineAnalysisType(startup) {
  if (startup.stage === 'pre-seed') return 'team'; // Focus on founders
  if (startup.industry === 'fintech') return 'financial'; // Regulatory focus
  if (startup.requestedFunding > 10000000) return 'comprehensive'; // High stakes
  return 'market'; // Default
}
```

### 3. **Set Timeouts**
Deep analysis can take time. Set appropriate timeouts:

```typescript
const analysisPromise = enhancedReasoningService.analyzeWithDeepThinking(...);
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Analysis timeout')), 180000) // 3 min
);

const analysis = await Promise.race([analysisPromise, timeoutPromise]);
```

### 4. **Monitor Costs**
Track API usage for deep analysis:

```typescript
let deepAnalysisCount = 0;
let deepAnalysisCost = 0;

// After each analysis
deepAnalysisCount++;
deepAnalysisCost += estimateCost(tokensUsed);

console.log(`Deep Analysis Stats: ${deepAnalysisCount} calls, $${deepAnalysisCost.toFixed(2)} spent`);
```

---

## 🧪 Testing

Test the deep analysis endpoints:

```bash
# 1. Upload a document
curl -X POST http://localhost:5000/api/upload \
  -F "documents=@pitch-deck.pdf" \
  -F "startupName=TestCorp"

# 2. Run deep analysis
curl -X POST http://localhost:5000/api/deep-analyze/{startupId} \
  -H "Content-Type: application/json" \
  -d '{"analysisType": "comprehensive"}'

# 3. Get results
curl http://localhost:5000/api/deep-analysis/{startupId}
```

---

## 📚 Response Examples

### Financial Deep Dive Response:
```json
{
  "unitEconomics": {
    "cac": 450,
    "ltv": 2340,
    "ltvCacRatio": 5.2,
    "paybackPeriod": 11,
    "confidenceLevel": "high"
  },
  "burnAnalysis": {
    "monthlyBurn": 125000,
    "runway": 18,
    "capitalEfficiency": "Above average for stage"
  },
  "redFlags": [
    {
      "flag": "Customer concentration - top 3 customers = 60% revenue",
      "severity": "high",
      "evidence": "Financial statements show revenue concentration",
      "mitigation": "Diversify customer base before Series A"
    }
  ],
  "scenarioAnalysis": {
    "bestCase": { "irr": 0.65, "exitValue": 250000000 },
    "baseCase": { "irr": 0.35, "exitValue": 75000000 },
    "worstCase": { "irr": -0.50, "exitValue": 5000000 }
  },
  "overallFinancialScore": 78,
  "keyFindings": [
    "Strong unit economics with healthy LTV/CAC",
    "Burn rate manageable but runway short",
    "Revenue quality concern due to concentration"
  ]
}
```

---

## 🚨 Troubleshooting

### "Analysis timeout"
- Increase timeout limits
- Split into smaller analyses
- Use `analysisType` instead of `comprehensive`

### "Token limit exceeded"
- Reduce document size before sending
- Extract only relevant sections
- Use pagination for large documents

### "Rate limit errors"
- Add retry logic with exponential backoff (already implemented)
- Consider batching requests
- Use model fallback (Pro → Flash)

---

## 📞 Support

For issues or questions:
1. Check `Progress.md` for project overview
2. Review logs in console for detailed errors
3. Test with smaller documents first
4. Verify API key has sufficient quota

---

**Ready to Use!** Your deep research integration is complete. Start with `/api/deep-analyze` endpoint for immediate results. 🎉

