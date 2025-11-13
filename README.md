# 💩 I Smell Bullshit - Blog Platform

A full-stack blog submission platform built with Node.js, TypeScript, React, and Elasticsearch. Features rate limiting, content validation, and XSS protection.

## 🏗️ Architecture

- **Frontend**: React 18 with TypeScript
- **Backend**: Node.js with Express and TypeScript
- **Database**: Elasticsearch 8.11
- **Containerization**: Docker & Docker Compose

## 📋 Features

### Security & Validation
- ✅ **XSS Protection**: All user input is sanitized to prevent cross-site scripting attacks
- ✅ **Content Validation**: Server-side validation using express-validator
- ✅ **Malicious Code Detection**: Pattern matching to detect and block potentially harmful content
- ✅ **Rate Limiting**: IP-based rate limiting (1 submission per 5 minutes)
- ✅ **Input Sanitization**: All fields are sanitized and validated

### Features
- 📝 Blog post submission with title, content, author, email, and tags
- 🔍 Full-text search across posts
- 📄 Pagination support
- 🏷️ Tag support (up to 5 tags per post)
- ⏱️ Automatic rate limiting with countdown timer
- 📊 Real-time post listing

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ installed (for local development)
- Docker Desktop installed (for containerized deployment)
- Docker Compose installed
- Port 3001 and 9200 available

### Running with Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/livnmad/ismellbs.git
   cd ismellbs
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Application: http://localhost:3001
   - Elasticsearch: http://localhost:9200
   - Backend API: http://localhost:3001
   - Elasticsearch: http://localhost:9200

4. **Stop all services**
   ```bash
   docker-compose down
   ```

5. **Stop and remove volumes (reset data)**
   ```bash
   docker-compose down -v
   ```

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   cd client
   npm install
   cd ..
   ```

2. **Start Elasticsearch** (using Docker)
   ```bash
   docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -e "xpack.security.enabled=false" docker.elastic.co/elasticsearch/elasticsearch:8.11.0
   ```

3. **Create .env file in root**
   ```bash
   copy .env.example .env
   ```
   Edit `.env` if needed:
   ```
   PORT=3001
   ELASTICSEARCH_NODE=http://localhost:9200
   CORS_ORIGIN=http://localhost:3000
   NODE_ENV=development
   ```

4. **Create .env file in client directory**
   ```bash
   cd client
   copy .env.example .env
   cd ..
   ```

5. **Run in development mode** (runs both server and client)
   ```bash
   npm run dev
   ```
   This starts:
   - Backend server on https://ismellbullshit.com
   - React dev server on http://localhost:3000

6. **Run server only**
   ```bash
   npm run dev:server
   ```

7. **Run client only**
   ```bash
   npm run dev:client
   ```

8. **Build for production**
   ```bash
   npm run build
   npm start
   ```
   This builds both server and client, then serves the React app from the Express server.

## 📡 API Endpoints

### GET /api/posts
Get all blog posts with pagination

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 10, max: 50)

**Response:**
```json
{
  "data": [
    {
      "id": "abc123",
      "title": "Post Title",
      "content": "Post content...",
      "author": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-11-08T12:00:00Z",
      "tags": ["tech", "blog"]
    }
  ],
  "total": 50,
  "page": 1,
  "pageSize": 10,
  "totalPages": 5
}
```

### GET /api/posts/search
Search blog posts

**Query Parameters:**
- `q` (required): Search query
- `page` (optional): Page number
- `pageSize` (optional): Items per page

### GET /api/posts/:id
Get a single post by ID

### POST /api/posts
Create a new blog post

**Rate Limit**: 1 request per 5 minutes per IP address

**Request Body:**
```json
{
  "title": "Post Title",
  "content": "Post content (min 10, max 10000 chars)",
  "author": "John Doe",
  "email": "john@example.com",
  "tags": ["tag1", "tag2"]
}
```

**Validation Rules:**
- **Title**: 3-200 characters, alphanumeric with basic punctuation
- **Content**: 10-10,000 characters, checked for malicious patterns
- **Author**: 2-100 characters, letters only
- **Email**: Valid email format
- **Tags**: Optional, max 5 tags, 30 chars each, alphanumeric with hyphens

**Response (Success - 201):**
```json
{
  "message": "Blog post created successfully",
  "post": {
    "id": "abc123",
    "title": "Post Title",
    "content": "Post content...",
    "author": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-11-08T12:00:00Z",
    "tags": ["tag1", "tag2"]
  }
}
```

**Response (Rate Limited - 429):**
```json
{
  "error": "Too many submissions",
  "message": "You can only submit one post every 5 minutes",
  "retryAfter": 240,
  "resetTime": "2025-11-08T12:05:00Z"
}
```

## 🗄️ Elasticsearch Index

**Index Name**: `i-smell-bullshit-blog`

**Mapping:**
```json
{
  "properties": {
    "title": {
      "type": "text",
      "fields": {
        "keyword": { "type": "keyword" }
      }
    },
    "content": {
      "type": "text"
    },
    "author": {
      "type": "text",
      "fields": {
        "keyword": { "type": "keyword" }
      }
    },
    "email": {
      "type": "keyword"
    },
    "ipAddress": {
      "type": "ip"
    },
    "createdAt": {
      "type": "date"
    },
    "tags": {
      "type": "keyword"
    }
  }
}
```

## 🔒 Security Features

### Input Validation
All inputs are validated using `express-validator`:
- Type checking
- Length restrictions
- Pattern matching
- Email validation

### XSS Prevention
Using the `xss` library to sanitize all user inputs:
- Strips all HTML tags
- Removes script tags and inline JavaScript
- Prevents common XSS attack vectors

### Malicious Content Detection
Pattern matching to detect:
- `<script>` tags
- `javascript:` protocol
- Event handlers (`onclick`, etc.)
- `<iframe>` tags
- `eval()` calls
- CSS expressions

### Rate Limiting
- In-memory rate limiter
- 1 submission per IP every 5 minutes
- Automatic cleanup of expired entries
- Returns retry-after time in responses

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **@elastic/elasticsearch** - Elasticsearch client
- **express-validator** - Input validation
- **xss** - XSS protection
- **helmet** - Security headers
- **cors** - CORS middleware

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Axios** - HTTP client
- **CSS3** - Styling

### Infrastructure
- **Elasticsearch 8.11** - Search and storage
- **Docker** - Containerization
- **Nginx** - Frontend web server

## 📁 Project Structure

```
ismellbs/
├── server/                    # Backend (Node.js + Express + TypeScript)
│   ├── config/
│   │   └── elasticsearch.ts   # Elasticsearch configuration
│   ├── middleware/
│   │   ├── validation.ts      # Input validation & XSS protection
│   │   └── rateLimit.ts       # IP-based rate limiting
│   ├── routes/
│   │   └── blog.routes.ts     # API endpoints
│   ├── services/
│   │   └── blog.service.ts    # Business logic
│   ├── types/
│   │   └── blog.types.ts      # TypeScript interfaces
│   └── server.ts              # Express server entry point
├── client/                    # Frontend (React + TypeScript)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── BlogForm.tsx   # Submission form
│   │   │   └── BlogList.tsx   # Post listing
│   │   ├── services/
│   │   │   └── api.ts         # API client
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.tsx
│   │   └── index.css
│   ├── package.json           # Client dependencies
│   └── tsconfig.json          # Client TypeScript config
├── dist/                      # Compiled output (gitignored)
│   └── server/                # Compiled server code
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.yml         # Docker Compose configuration
├── package.json               # Root package with monorepo scripts
├── tsconfig.server.json       # Server TypeScript config
├── .env                       # Environment variables
└── README.md
```

## 🐛 Troubleshooting

### Elasticsearch won't start
- Ensure you have enough memory (at least 2GB available)
- Check if port 9200 is already in use
- Try increasing Docker memory limit

### Backend can't connect to Elasticsearch
- Wait 30 seconds for Elasticsearch to fully start
- Check Elasticsearch health: `curl http://localhost:9200/_cluster/health`
- Verify network connectivity in Docker Compose

### Rate limiting not working
- Rate limiting is in-memory and resets on server restart
- Check that IP addresses are being correctly extracted
- Verify X-Forwarded-For headers if behind a proxy

### Frontend can't reach backend
- In development: Make sure both `npm run dev:server` and `npm run dev:client` are running
- Verify CORS_ORIGIN is set correctly in root .env
- Check client/.env has REACT_APP_API_URL=https://ismellbullshit.com/api
- Check that backend is running on port 3001
- Clear browser cache and try again

### TypeScript errors
- Run `npm install` in root directory
- Run `npm install` in client directory
- Check that node_modules exists in both locations

## 📝 Environment Variables

### Root .env
```
PORT=3001
ELASTICSEARCH_NODE=http://localhost:9200
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

### Client .env (client/.env)
```
REACT_APP_API_URL=https://ismellbullshit.com/api
```

## 📦 NPM Scripts

- `npm install` - Install root dependencies
- `npm run dev` - Run both server and client in development mode
- `npm run dev:server` - Run only the backend server
- `npm run dev:client` - Run only the React client
- `npm run build` - Build both server and client for production
- `npm run build:server` - Build only the server
- `npm run build:client` - Build only the client
- `npm start` - Start production server (serves both API and React app)

## 🧪 Testing

1. **Start the development servers**
   ```bash
   npm run dev
   ```

2. Access the application at http://localhost:3000 and:
   - Fill out the submission form
   - Try submitting with invalid data to test validation
   - Try submitting twice within 5 minutes to test rate limiting
   - View submitted posts in the list below
   - Try pagination if you have multiple posts

3. **Test production build**
   ```bash
   npm run build
   npm start
   ```
   Access at https://ismellbullshit.com (single server serves everything)

## 📄 License

ISC

## 👤 Author

Built as a full-stack demonstration project.
