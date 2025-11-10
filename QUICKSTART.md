# I Smell Bullshit - Quick Start Guide

## ✅ Project Successfully Restructured!

The project now uses a **single `package.json`** at the root level with a monorepo structure.

### 📁 New Structure
```
ismellbs/
├── server/          # Backend (Node.js/Express/TypeScript)
├── client/          # Frontend (React/TypeScript)
├── package.json     # Single root package.json
└── .env            # Environment variables
```

## 🚀 Getting Started

### Option 1: Docker (Easiest)
```bash
docker-compose up -d
```
Access at: https://ismellbullshit.com/api

### Option 2: Local Development

1. **Install all dependencies**
   ```bash
   npm install
   cd client
   npm install
   cd ..
   ```

2. **Start Elasticsearch**
   ```bash
   docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -e "xpack.security.enabled=false" docker.elastic.co/elasticsearch/elasticsearch:8.11.0
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```
   This starts both:
   - Backend API: https://ismellbullshit.com
   - React app: http://localhost:3000

## 📦 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Run both server and client in development |
| `npm run dev:server` | Run only the backend server |
| `npm run dev:client` | Run only the React client |
| `npm run build` | Build both server and client for production |
| `npm start` | Start production server (after build) |

## 🔧 Environment Setup

Create `.env` in root:
```
PORT=3001
ELASTICSEARCH_NODE=http://localhost:9200
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

Create `client/.env`:
```
REACT_APP_API_URL=https://ismellbullshit.com/api
```

## 🎯 What Changed?

- ✅ Single `package.json` at root
- ✅ Backend moved from `backend/src/` → `server/`
- ✅ Frontend moved from `frontend/` → `client/`
- ✅ Simplified Docker setup (single Dockerfile)
- ✅ Production mode serves React from Express server
- ✅ Concurrent dev mode runs both servers

See full README.md for complete documentation!
