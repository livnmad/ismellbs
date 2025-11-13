# EC2 Deployment Guide

## Port Configuration Summary

- **Server Port**: 3001 (serves both API and static React build)
- **Elasticsearch**: 9200, 9300
- **Nginx/Load Balancer**: Should proxy to port 3001

## Architecture

```
Internet → Nginx (80/443) → Backend Container (3001)
                                    ↓
                             Elasticsearch (9200)
```

## EC2 Setup Steps

### 1. Install Docker and Docker Compose on EC2

```bash
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone and Setup Project

```bash
git clone https://github.com/livnmad/ismellbs.git
cd ismellbs

# Copy production environment file
cp .env.production .env

# Edit .env if needed
nano .env
```

### 3. Build and Run with Docker Compose

```bash
# Build and start services
docker-compose up -d --build

# Check logs
docker-compose logs -f backend

# Check status
docker-compose ps
```

### 4. Configure Security Group (AWS Console)

Allow these inbound rules:
- **Port 80** (HTTP) - from 0.0.0.0/0
- **Port 443** (HTTPS) - from 0.0.0.0/0
- **Port 3001** (App) - from 0.0.0.0/0 (or from Nginx only)
- **Port 22** (SSH) - from your IP only

### 5. Setup Nginx Reverse Proxy (Optional but Recommended)

```bash
sudo amazon-linux-extras install nginx1 -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

Create `/etc/nginx/conf.d/ismellbullshit.conf`:

```nginx
server {
    listen 80;
    server_name ismellbullshit.com www.ismellbullshit.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ismellbullshit.com www.ismellbullshit.com;

    # SSL configuration (add your certificates)
    # ssl_certificate /path/to/cert.pem;
    # ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Setup SSL with Let's Encrypt (Free)

```bash
sudo yum install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ismellbullshit.com -d www.ismellbullshit.com
```

## Direct Access (Without Nginx)

If you're not using Nginx, access the site directly:
- http://your-ec2-ip:3001
- or configure DNS to point to your EC2 IP and use port 3001

## Troubleshooting

### Check if containers are running
```bash
docker-compose ps
```

### View logs
```bash
docker-compose logs -f backend
docker-compose logs -f elasticsearch
```

### Restart services
```bash
docker-compose restart
```

### Rebuild after code changes
```bash
git pull
docker-compose down
docker-compose up -d --build
```

### Check if port 3001 is accessible
```bash
curl http://localhost:3001/health
```

### Common Issues

1. **502 Bad Gateway**: Backend container not running or wrong port mapping
   - Check: `docker-compose ps`
   - Check: `docker-compose logs backend`

2. **CORS errors**: Add your domain to CORS_ORIGIN in .env
   - Edit `.env` and add your domain
   - Restart: `docker-compose restart backend`

3. **Elasticsearch connection failed**: Elasticsearch not ready
   - Check: `docker-compose logs elasticsearch`
   - Wait for: "Cluster health status changed from [YELLOW] to [GREEN]"

4. **Port already in use**: Another service using port 3001
   - Check: `sudo lsof -i :3001`
   - Kill process or change PORT in .env

## Monitoring

### Check application health
```bash
curl http://localhost:3001/health
```

### Monitor resource usage
```bash
docker stats
```

### View all running containers
```bash
docker ps
```

## Updates and Maintenance

### Update code
```bash
cd ismellbs
git pull
docker-compose down
docker-compose up -d --build
```

### Backup Elasticsearch data
```bash
docker-compose exec elasticsearch curl -X PUT "localhost:9200/_snapshot/my_backup" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/usr/share/elasticsearch/snapshots"
  }
}'
```

### Clean up old Docker images
```bash
docker system prune -a
```
