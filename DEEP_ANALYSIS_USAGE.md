# Deep Analysis - Quick Usage Guide

## 🚀 How to Use Deep Research Without User Intervention

### **Option 1: Automatic Deep Analysis (Recommended)**

Simply add `useDeepAnalysis: true` to your existing analysis request:

```bash
curl -X POST http://localhost:5000/api/analyze/STARTUP_ID \
  -H "Content-Type: application/json" \
  -d '{
    "startupName": "TechFlow AI",
    "useDeepAnalysis": true
  }'
```

**What happens:**
- Automatically uses Gemini 2.5 Pro with enhanced reasoning
- Returns standard format + deep insights
- No code changes needed in frontend
- Backward compatible (default is `false`)

---

### **Option 2: Dedicated Deep Analysis Endpoint**

For more control over analysis type:

```bash
# Comprehensive analysis (default - recommended)
curl -X POST http://localhost:5000/api/deep-analyze/STARTUP_ID \
  -H "Content-Type: application/json" \
  -d '{}'

# Financial deep dive
curl -X POST http://localhost:5000/api/deep-analyze/STARTUP_ID \
  -H "Content-Type: application/json" \
  -d '{
    "analysisType": "financial"
  }'

# Market validation
curl -X POST http://localhost:5000/api/deep-analyze/STARTUP_ID \
  -H "Content-Type: application/json" \
  -d '{
    "analysisType": "market"
  }'

# Team assessment
curl -X POST http://localhost:5000/api/deep-analyze/STARTUP_ID \
  -H "Content-Type: application/json" \
  -d '{
    "analysisType": "team"
  }'
```

---

## 📊 Response Structure

### Standard Analysis vs Deep Analysis

**Standard Analysis:**
```json
{
  "analysis": {
    "overallScore": 75,
    "metrics": {
      "marketSize": 80,
      "traction": 65,
      "team": 78
    },
    "keyInsights": [
      "Strong market opportunity",
      "Experienced team"
    ]
  }
}
```

**Deep Analysis (adds):**
```json
{
  "analysis": {
    "overallScore": 75,
    "metrics": { ... },
    "deepAnalysis": {
      "evidenceValidation": {
        "validatedClaims": ["Revenue grew 200% YoY"],
        "questionableClaims": ["TAM seems inflated"],
        "unsupportedClaims": ["10,000 users claimed"],
        "dataGaps": ["Missing burn rate data"]
      },
      "deepInsights": [
        {
          "category": "financial",
          "insight": "LTV/CAC ratio of 5.2x is exceptional",
          "evidence": ["CAC: $500", "LTV: $2,600"],
          "confidence": "high"
        }
      ],
      "investmentThesis": {
        "bullCase": {
          "narrative": "Could capture 5% market share...",
          "upside": "20x return",
          "probability": "35%"
        },
        "bearCase": {
          "narrative": "Competition risk high...",
          "downside": "50% loss",
          "probability": "25%"
        },
        "recommendation": {
          "decision": "buy",
          "reasoning": "Strong fundamentals despite risks",
          "confidence": "medium"
        }
      },
      "criticalQuestions": [
        "What is customer retention rate?",
        "How defensible is technology?"
      ]
    }
  }
}
```

---

## 🤖 Automatic Background Analysis

### Pattern 1: Auto-analyze after upload

```typescript
// In your upload handler
app.post("/api/upload/:startupId", upload.array('documents'), async (req, res) => {
  // 1. Process documents
  await processDocuments(files);
  
  // 2. Auto-trigger deep analysis (no user action)
  setTimeout(async () => {
    try {
      await axios.post(`http://localhost:5000/api/deep-analyze/${startupId}`);
      console.log(`✅ Auto deep analysis completed for ${startupId}`);
    } catch (error) {
      console.error('Auto analysis failed:', error);
    }
  }, 5000); // 5 second delay
  
  res.json({ success: true });
});
```

### Pattern 2: Always use deep analysis

```typescript
// Make deep analysis the default
app.post("/api/analyze/:startupId", async (req, res) => {
  const { useDeepAnalysis = true } = req.body; // Changed to true
  
  // Rest of your code...
});
```

### Pattern 3: Conditional deep analysis

```typescript
// Only deep analyze high-potential startups
app.post("/api/analyze/:startupId", async (req, res) => {
  // Quick analysis first
  const quickResult = await analyzeStartupDocuments(docs);
  
  // Auto-trigger deep if promising
  if (quickResult.overallScore >= 70) {
    const deepResult = await enhancedReasoningService.analyzeWithDeepThinking(docs);
    return res.json({ analysis: deepResult, type: 'deep' });
  }
  
  res.json({ analysis: quickResult, type: 'standard' });
});
```

---

## 💡 Frontend Integration

### React Example

```typescript
// In your analysis component
const analyzeStartup = async (startupId: string, useDeep: boolean = true) => {
  setLoading(true);
  
  try {
    const response = await fetch(`/api/analyze/${startupId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        useDeepAnalysis: useDeep // Toggle deep analysis
      })
    });
    
    const data = await response.json();
    
    // Check if deep analysis was used
    if (data.analysisType === 'deep_reasoning') {
      console.log('🧠 Deep analysis insights:', data.analysis.deepAnalysis);
      // Show additional insights in UI
      setDeepInsights(data.analysis.deepAnalysis);
    }
    
    setAnalysis(data.analysis);
  } catch (error) {
    console.error('Analysis failed:', error);
  } finally {
    setLoading(false);
  }
};
```

### UI Toggle (Optional)

```tsx
<button onClick={() => analyzeStartup(startupId, true)}>
  🧠 Deep Analysis (2-3 mins)
</button>

<button onClick={() => analyzeStartup(startupId, false)}>
  ⚡ Quick Analysis (30 secs)
</button>
```

---

## 📈 What You Get with Deep Analysis

### 1. **Evidence Validation**
- ✅ Claims that are supported by data
- ⚠️ Claims that seem questionable  
- ❌ Claims with no evidence
- 📋 Missing information identified

### 2. **Risk-Adjusted Scores**
- Not just single numbers
- Confidence intervals (e.g., "72-84")
- Key drivers behind each score
- Factors that could change the score

### 3. **Investment Scenarios**
- **Bull Case**: Best realistic outcome + probability
- **Bear Case**: Worst realistic outcome + probability
- **Base Case**: Most likely outcome
- Expected value calculations

### 4. **Critical Questions**
- What information is missing?
- What would change your decision?
- What needs verification?

### 5. **Deep Insights**
- Pattern recognition across dimensions
- Hidden risks or opportunities
- Comparison with similar companies
- Strategic implications

---

## ⚙️ Configuration

### Enable by Default

In your `.env`:
```bash
# Deep Analysis Settings
USE_DEEP_ANALYSIS_BY_DEFAULT=true
DEEP_ANALYSIS_TIMEOUT_MS=180000  # 3 minutes
```

Then in code:
```typescript
const useDeepAnalysis = process.env.USE_DEEP_ANALYSIS_BY_DEFAULT === 'true';
```

### Performance Tuning

```typescript
// Adjust based on your needs
const ANALYSIS_CONFIG = {
  quick: {
    timeout: 30000,    // 30 seconds
    model: 'gemini-2.5-flash',
    type: 'standard'
  },
  deep: {
    timeout: 180000,   // 3 minutes
    model: 'gemini-2.5-pro',
    type: 'comprehensive'
  },
  expert: {
    timeout: 300000,   // 5 minutes
    model: 'gemini-2.5-pro',
    type: 'multi_dimensional'
  }
};
```

---

## 🔍 Debugging

### Check if Deep Analysis is Working

```bash
# Run analysis and check response
curl -X POST http://localhost:5000/api/deep-analyze/STARTUP_ID | jq .

# Look for these fields:
# - .analysis.evidenceValidation
# - .analysis.deepInsights
# - .analysis.investmentThesis
# - .analysis.criticalQuestions
```

### View Logs

```bash
# Server will log:
🧠 Using enhanced deep reasoning analysis...
✅ Enhanced reasoning analysis completed
```

### Common Issues

**"Analysis timeout"**
- Increase timeout in your fetch/axios config
- Or split into separate calls (financial, then market, etc.)

**"Standard analysis returned instead of deep"**
- Check `useDeepAnalysis` is being sent in request body
- Verify import of `enhancedReasoningService` in routes.ts

**"Response format different from expected"**
- Deep analysis has additional fields, not replacement
- Access via `response.analysis.deepAnalysis`

---

## 🎯 Best Practices

### 1. **Cache Results**
Deep analysis is expensive. Cache and reuse:

```typescript
const cachedAnalysis = await redis.get(`analysis:${startupId}`);
if (cachedAnalysis) {
  return JSON.parse(cachedAnalysis);
}

const deepAnalysis = await performDeepAnalysis();
await redis.setex(`analysis:${startupId}`, 3600, JSON.stringify(deepAnalysis));
```

### 2. **Progressive Enhancement**
Start quick, add depth if promising:

```typescript
// 1. Quick screening (30s)
const screening = await quickAnalysis();

// 2. If passes, deep dive (3 min)
if (screening.score >= 70) {
  const deep = await deepAnalysis();
  return deep;
}
```

### 3. **User Feedback**
Let users know deep analysis is running:

```typescript
// Backend
res.write('data: {"status": "analyzing", "step": "financial"}\n\n');

// Frontend shows progress:
// "Analyzing financials... 25%"
// "Validating claims... 50%"
// "Generating insights... 75%"
```

### 4. **Fallback to Standard**
If deep analysis fails, gracefully fallback:

```typescript
try {
  return await deepAnalysis();
} catch (error) {
  console.warn('Deep analysis failed, using standard:', error);
  return await standardAnalysis();
}
```

---

## 📞 Need Help?

1. Check console logs for detailed errors
2. Review `DEEP_RESEARCH_SETUP.md` for full documentation
3. Test with smaller documents first
4. Verify API key has sufficient quota

---

**You're all set!** Deep research is now integrated and ready to use. 🎉

**Quick Test:**
```bash
# Upload a document
curl -F "documents=@test.pdf" http://localhost:5000/api/upload

# Run deep analysis
curl -X POST http://localhost:5000/api/deep-analyze/{startupId}
```

