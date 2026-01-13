# Growgle Backend

A comprehensive career development platform that provides personalized insights, roadmaps, and tools for professional growth. Built with Node.js, Express, and Firebase, featuring AI-powered recommendations and LaTeX resume compilation.

## Features

### Career Analytics & Insights

- **Skills Assessment**: Comprehensive skill evaluation and progress tracking
- **Career Scoring**: Dynamic career score calculation based on skills, experience, and achievements
- **Personalized Dashboard**: Real-time analytics with progress visualization
- **Industry Trends**: Integration with news APIs and Google Trends for market insights

### Data Intelligence

- **BigQuery Integration**: Advanced analytics and data processing
- **Vertex AI**: AI-powered career recommendations and insights
- **News Analysis**: Real-time industry news aggregation and analysis
- **Trend Monitoring**: Automated tracking of skill demand and market trends

### Roadmap Management

- **Personalized Roadmaps**: Custom learning paths based on career goals
- **Milestone Tracking**: Progress monitoring with deadline management
- **Skill Progression**: Detailed skill development tracking
- **Achievement System**: Gamified learning with progress rewards

### Resume Management

- **PDF Upload & Storage**: Secure resume storage with Cloudinary integration
- **LaTeX Compilation**: Professional resume generation using LaTeX/Tectonic
- **Real-time Preview**: Live LaTeX editing with instant PDF preview
- **Version Control**: Resume history and version management

### Authentication & Security

- **PASETO Tokens**: Secure authentication with public key cryptography
- **Role-based Access**: Granular permission system
- **Email Integration**: Automated notifications with Nodemailer
- **Data Validation**: Comprehensive input validation with Zod schemas

## Tech Stack

- **Runtime**: Node.js 22+ (CommonJS)
- **Framework**: Express.js 5.x
- **Database**: Firebase Firestore
- **Authentication**: PASETO V4 with RSA keys
- **Validation**: Zod schemas
- **File Storage**: Cloudinary
- **Document Processing**: Tectonic LaTeX engine

## Quick Start

### Prerequisites

- Node.js 22+
- npm or yarn
- Docker (optional, for containerized deployment)
- Firebase project with Firestore enabled
- Google Cloud Project with BigQuery and Vertex AI APIs enabled

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Growgle/Growgle-backend.git
cd Growgle-backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Setup**
   Create a `.env` file in the root directory:

```env
PORT=3002
NODE_ENV=development

# Firebase Configuration
PROJECT_ID=your-firebase-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# API Keys
NEWS_API_KEY=your-news-api-key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# LaTeX Configuration (optional)
TECTONIC_PATH=/usr/bin/tectonic
LATEX_TIMEOUT_MS=15000
LATEX_WARMUP=1
```

4. **Generate RSA Keys**

```bash
# Visit http://localhost:3002/generate-keys after starting the server
# This will generate the required PASETO signing keys
```

5. **Start Development Server**

```bash
npm run dev
```

The server will start on `http://localhost:3002`

## API Documentation

### Authentication

All protected routes require a valid PASETO token in the Authorization header:

```
Authorization: Bearer <your-paseto-token>
```

### Core Endpoints

#### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh

#### Profile Management

- `GET /api/profile/user` - Get user profile
- `PATCH /api/profile/user` - Update user profile
- `GET /api/profile/dashboard` - Get dashboard analytics
- `POST /api/profile/resume` - Upload resume (PDF only)

#### Roadmap Management

- `GET /api/roadmaps` - List user roadmaps
- `POST /api/roadmaps` - Create new roadmap
- `GET /api/roadmaps/:id` - Get specific roadmap
- `PATCH /api/roadmaps/:id` - Update roadmap
- `DELETE /api/roadmaps/:id` - Delete roadmap

#### LaTeX Compilation

- `POST /api/compile` - Compile LaTeX to PDF
  - Content-Type: `text/plain`
  - Body: Raw LaTeX source
  - Returns: PDF binary or error details

#### Insights & Analytics

- `GET /api/insights` - Get career insights
- `POST /api/ingest/news` - Ingest news data
- `GET /api/setup` - Setup analytics pipeline

## Key Features in Detail

### LaTeX Resume Compilation

The platform includes a full LaTeX-to-PDF compilation service using Tectonic:

- **Real-time Compilation**: Convert LaTeX source to PDF instantly
- **Error Handling**: Detailed error messages for debugging
- **Template Support**: Automatic document wrapping for fragments
- **Security**: Sandboxed compilation with timeouts and cleanup
- **Performance**: Warm-up optimization for fast first-time compilation

### Career Analytics

Advanced analytics powered by Google Cloud:

- **Skill Trending**: Track industry skill demands using BigQuery
- **Market Analysis**: Real-time job market insights
- **Personalized Recommendations**: AI-powered career suggestions
- **Progress Tracking**: Detailed skill development metrics

### Roadmap System

Comprehensive career planning tools:

- **Custom Roadmaps**: User-created learning paths
- **Milestone Management**: Track progress with deadlines
- **Phase Organization**: Structured learning progression
- **Achievement Tracking**: Gamified skill development

### Testing

```bash
# Health check
curl http://localhost:3002/health

# LaTeX compilation test
curl -X POST -H "Content-Type: text/plain" \
  --data-binary "Hello from LaTeX" \
  http://localhost:3002/api/compile -o test.pdf
```

---

Built with ❤️ by team Growgle.
