# Startup Sherlock

A web application that helps investors analyze startups using artificial intelligence. Upload startup documents and get detailed analysis reports with scores, risk assessments, and investment recommendations.

## What This App Does

This application analyzes startup companies by examining their business documents. It uses AI to evaluate different aspects of a startup and provides insights to help with investment decisions.

### Key Features

- **Document Upload**: Upload various types of documents (PDFs, Word docs, Excel files, presentations, etc.)
- **AI Analysis**: Automatically analyze startup documents using Google's Gemini AI
- **Scoring System**: Get overall scores and risk levels for each startup
- **Investment Recommendations**: Receive AI-generated investment advice
- **Industry Benchmarks**: Compare startups against industry standards
- **Dashboard**: View all analyzed startups in one place

### How It Works

1. **Upload Documents**: Add business plans, financial statements, pitch decks, or other startup documents
2. **AI Processing**: The system extracts text and analyzes the content using AI
3. **Get Results**: View detailed analysis including:
    - Overall startup score
    - Risk assessment
    - Investment recommendation
    - Key strengths and weaknesses
    - Industry comparisons

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: Firebase
- **AI**: Google Gemini API
- **File Processing**: Supports PDFs, Office documents, images, and more

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- PostgreSQL database
- Google Gemini API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
    - Create a `.env` file in the root directory
    - Add your database connection string
    - Add your Google Gemini API key

4. Set up the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `https://startup-sherlock.web.app/`

## Usage

1. **Create a Startup**: Add basic information about the startup you want to analyze
2. **Upload Documents**: Add relevant business documents (business plans, financials, etc.)
3. **Run Analysis**: Click analyze to process the documents with AI
4. **Review Results**: View the detailed analysis report with scores and recommendations
5. **Compare**: Use the benchmarks feature to compare against industry standards

## File Support

The application supports a wide range of file types:
- Documents: PDF, Word, Excel, PowerPoint
- Text files: TXT, CSV, HTML, Markdown
- Images: JPEG, PNG, GIF, WebP
- And many more formats

## Currency Handling

All financial values in the application are handled as follows:

- **Backend Storage**: Financial data is stored in **USD** (as returned by public APIs like Crunchbase, PitchBook)
- **Frontend Display**: All values are automatically converted to **INR** with Indian numbering format (Crores, Lakhs, Thousands)
- **Exchange Rate**: **Fetched automatically from live API** (updates daily)
  - Source: Free Currency API (https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api)
  - Fallback: 1 USD = 89 INR if API unavailable
- **Display Format**: ₹X.XXCr (Crores), ₹X.XXL (Lakhs), ₹X.XXK (Thousands) with 2 decimal places
- **Investment Recommendations**: Generated in INR range (₹5Cr to ₹50Cr)

### How Exchange Rates Work

1. **Backend Service** (`server/exchangeRateService.ts`):
   - Fetches latest USD to INR rate on server startup
   - Updates automatically every 24 hours
   - Caches rate in memory for fast access
   - API endpoint: `GET /api/exchange-rate`

2. **Frontend Manager** (`client/src/lib/exchangeRate.ts`):
   - Fetches rate from backend on app load
   - Caches in browser localStorage
   - Auto-refreshes if older than 24 hours
   - All currency displays use this live rate

3. **Fallback System**:
   - If API is unavailable, uses fallback rate (89 INR)
   - System continues to work normally
   - Automatically retries on next update cycle

### Manual Exchange Rate Update

The rate updates automatically, but if you need to manually update the fallback:
1. Open `client/src/lib/utils.ts`
2. Modify line 15: `export const USD_TO_INR_RATE = 89;`
3. Open `server/exchangeRateService.ts`
4. Modify line 18: `private readonly FALLBACK_RATE = 89;`

## Project Structure

- `client/` - React frontend application
- `server/` - Express backend API
- `shared/` - Shared TypeScript schemas and types

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run check` - Type checking
- `npm run db:push` - Update database schema
