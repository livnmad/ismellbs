# Quick Deployment Commands for EC2

## Initial Setup on EC2

```bash
# 1. SSH into EC2
ssh -i your-key.pem ec2-user@your-ec2-ip

# 2. Install Docker
sudo yum update -y
sudo yum install -y docker git
sudo service docker start
sudo usermod -a -G docker ec2-user

# 3. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Logout and login again for docker group to take effect
exit
# SSH back in

# 5. Clone repository
git clone https://github.com/livnmad/ismellbs.git
cd ismellbs

# 6. Copy production environment
cp .env.production .env

# 7. Build and run
docker-compose up -d --build

# 8. Check status
docker-compose ps
docker-compose logs -f backend
```

## Update Deployment

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@your-ec2-ip

# Navigate to project
cd ismellbs

# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Check logs
docker-compose logs -f backend
```

## Quick Checks

```bash
# Is Docker running?
docker ps

# Are services running?
docker-compose ps

# Check backend logs
docker-compose logs backend

# Check elasticsearch logs
docker-compose logs elasticsearch

# Test health endpoint
curl http://localhost:3000/health

# Check if port 3000 is listening
sudo netstat -tlnp | grep 3000
```

## Troubleshooting

```bash
# Stop everything
docker-compose down

# Remove all containers and volumes (CAUTION: deletes data)
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache

# Start services
docker-compose up -d

# Follow logs in real-time
docker-compose logs -f

# Restart just backend
docker-compose restart backend

# Get into backend container shell
docker-compose exec backend sh
```

## Access Your Site

After deployment:
- Direct: `http://YOUR_EC2_IP:3000`
- With domain: `http://ismellbullshit.com` (after DNS setup)

## Port Forwarding (if needed)

If you want to access on port 80:
```bash
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000
```

## Monitoring

```bash
# Resource usage
docker stats

# Disk usage
docker system df

# Clean up unused resources
docker system prune -a
```
