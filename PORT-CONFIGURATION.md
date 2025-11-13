# Port Configuration Summary

## Production (EC2 with Docker)

**Single Port Architecture**: Everything runs through port 3001

```
Port 3001 → Backend Express Server
            ├── /api/* → API endpoints
            └── /*     → Static React build files
```

### What runs where:
- **Backend Server**: Port 3001 (inside and outside container)
- **Elasticsearch**: Port 9200 (inside Docker network)
- **React Build**: Served as static files from backend on port 3001

### Environment Variables (.env.production):
```bash
PORT=3001
ELASTICSEARCH_NODE=http://elasticsearch:9200
CORS_ORIGIN=https://www.ismellbullshit.com,https://ismellbullshit.com
NODE_ENV=production
```

### Docker Compose:
```yaml
backend:
  ports:
    - "3001:3001"  # Host:Container
  environment:
    - PORT=3001
```

### Dockerfile:
```dockerfile
EXPOSE 3001
```

### Access:
- Direct: `http://your-ec2-ip:3001`
- With Nginx: `http://your-domain.com` (Nginx proxies to :3001)

## Development (Local)

**Two Port Architecture**: Separate dev server and API

### Option 1: With React Dev Server
```
Port 3000 → React Dev Server (hot reload)
Port 3001 → Backend API Server
```

Environment (.env):
```bash
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

Commands:
```bash
# Terminal 1: Start backend
npm start

# Terminal 2: Start React dev server
npm run dev:client
```

Access: `http://localhost:3000`

### Option 2: Production Build Locally
```
Port 3001 → Backend (serves API + static build)
```

Environment (.env):
```bash
PORT=3001
NODE_ENV=production
CORS_ORIGIN=http://localhost:3001
```

Commands:
```bash
npm run build  # Build React
npm start      # Start backend
```

Access: `http://localhost:3001`

## Key Points

1. **Production**: Only port 3001 is exposed. Backend serves everything.
2. **Development**: Port 3000 for React dev server, 3001 for API (optional)
3. **API Calls**: All use relative URLs (`/api/*`) so they work in any environment
4. **CORS**: Must include all domains that will access your API
5. **Elasticsearch**: Always on 9200, accessed via Docker network name in containers

## Troubleshooting Port Issues

### Check what's running on ports:
```bash
# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :9200

# Linux/Mac
lsof -i :3001
lsof -i :9200
```

### Docker port mapping:
```bash
docker-compose ps
docker port ismellbs-app
```

### Test backend is accessible:
```bash
curl http://localhost:3001/health
```

### Check Docker logs:
```bash
docker-compose logs backend
```

## EC2 Security Group Rules

Allow these inbound ports:
- **80** (HTTP) - if using Nginx
- **443** (HTTPS) - if using Nginx
- **3001** (App) - if accessing directly
- **22** (SSH) - for management

Do NOT expose:
- **9200** (Elasticsearch) - internal only
- **9300** (Elasticsearch) - internal only
