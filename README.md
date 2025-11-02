# Startup Sherlock 🔍

**AI-powered startup analysis for smarter investment decisions**

Analyze startup documents, get comprehensive risk assessments, and make informed investment decisions with the power of artificial intelligence.

🌐 **Live App**: [https://startup-sherlock.web.app](https://startup-sherlock.web.app)

---

## ✨ Features


### 📊 **Intelligent Document Analysis**
- Upload business plans, financial statements, pitch decks, and more
- AI-powered extraction and analysis using Google Gemini
- Support for PDFs, Word docs, Excel, PowerPoint, images, and text files

### 🎯 **Comprehensive Risk Assessment**
- Overall startup scores
- Detailed risk flag identification
- Investment recommendations
- Key strengths and weaknesses analysis

### 📈 **Industry Benchmarks**
- Compare startups against industry standards
- Track performance metrics
- Identify competitive advantages

### 🔒 **Secure & Private**
- User authentication (Google Sign-In + Email/Password)
- Each user's data is completely isolated
- Secure document storage

### 🎨 **Modern Dashboard**
- View all analyzed startups at a glance
- Interactive charts and visualizations
- Easy document management

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** database
- **Google Cloud Account** (for Gemini API and Cloud SQL)
- **Firebase Account** (for authentication and hosting)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd startup_sherlock
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env` and fill in your credentials:
   
   ```bash
   cp .env.example .env
   ```
   
   Required variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `GEMINI_API_KEY` - Google Gemini API key
   - `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account key
   - Firebase configuration variables (see `.env.example`)

4. **Set up the database**
   ```bash
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5000`

---

## 📖 Usage Guide

### 1. **Sign Up / Sign In**
- Create an account using email/password or Google Sign-In
- Your data is private and isolated from other users

### 2. **Upload Documents**
- Click "Upload" to add startup documents
- Supported formats: PDF, Word, Excel, PowerPoint, images, text files
- Upload multiple documents for comprehensive analysis

### 3. **Analyze**
- Click "Analyze" to process documents with AI
- Review detailed analysis including:
  - Overall startup score
  - Risk assessment with flags
  - Investment recommendation
  - Key insights and recommendations

### 4. **Benchmarks**
- Compare startups against industry standards
- View performance metrics
- Understand competitive positioning

### 5. **Dashboard**
- View all your analyzed startups
- Track progress over time
- Easy access to past analyses

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Cloud SQL)
- **Authentication**: Firebase Auth
- **AI**: Google Gemini API
- **Storage**: Google Cloud Storage
- **Hosting**: Firebase Hosting

---

## 📁 Project Structure

```
startup_sherlock/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts (Auth)
│   │   └── lib/         # Utilities and configs
│   └── public/          # Static assets
├── server/              # Express backend
│   ├── routes.ts        # API routes
│   ├── gemini.ts        # AI integration
│   ├── storage.ts       # Database layer
│   └── ...
├── shared/              # Shared types and schemas
└── migrations/          # Database migrations
```

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (frontend + backend) |
| `npm run build` | Build frontend for production |
| `npm start` | Start production server |
| `npm run check` | TypeScript type checking |
| `npm run db:migrate` | Run database migrations |
| `npm run db:test` | Test database connection |

---

## 🌍 Deployment

### Prerequisites
- Google Cloud project with billing enabled
- Firebase project set up
- Cloud SQL instance running
- Service account with necessary permissions

### Deploy to Firebase Hosting

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**
   ```bash
   firebase deploy --only hosting
   ```

### Deploy Backend
- Configure your hosting platform with environment variables
- Set up Cloud SQL Proxy for database connection
- Deploy the server code

---

## 🔒 Security

- All user data is isolated and private
- Authentication required for all operations
- Secure document storage
- API authentication with JWT tokens
- Input validation on all forms

---

## 📄 File Format Support

**Documents:**
- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Microsoft Excel (.xls, .xlsx)
- Microsoft PowerPoint (.ppt, .pptx)

**Text Files:**
- Plain Text (.txt)
- Markdown (.md)
- CSV (.csv)
- HTML (.html)

**Images:**
- JPEG/JPG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

---

## 📝 License

MIT

---

## 📞 Support

For questions or support, please open an issue in the repository.

---

**Built with ❤️ for smarter startup analysis**
