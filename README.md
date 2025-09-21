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

The application will be available at `http://localhost:5001`

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

## Project Structure

- `client/` - React frontend application
- `server/` - Express backend API
- `shared/` - Shared TypeScript schemas and types

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run check` - Type checking
- `npm run db:push` - Update database schema
