# EC2 Docker Build Troubleshooting

## Issue: Build Hangs at npm install

### Common Causes:
1. **Low Memory**: t2.micro/t2.small instances may struggle
2. **Network Issues**: Slow or unstable connection to npm registry
3. **Deprecated Packages**: Warning messages can slow down builds

### Solutions:

#### Option 1: Use Optimized Dockerfile (Recommended)
```bash
# Make script executable
chmod +x build-ec2.sh

# Run build script
./build-ec2.sh
```

#### Option 2: Manual Build with Retries
```bash
# Build with verbose output
docker build -f Dockerfile.optimized -t ismellbs:latest --progress=plain . 2>&1 | tee build.log

# If it fails, try without cache
docker build -f Dockerfile.optimized -t ismellbs:latest --no-cache .
```

#### Option 3: Build Locally and Push to Registry
```bash
# On your local machine
docker build -t yourusername/ismellbs:latest .
docker push yourusername/ismellbs:latest

# On EC2
docker pull yourusername/ismellbs:latest
docker tag yourusername/ismellbs:latest ismellbs:latest
```

#### Option 4: Use Docker BuildKit
```bash
# Enable BuildKit for better caching
export DOCKER_BUILDKIT=1
docker build -t ismellbs:latest .
```

### EC2 Instance Recommendations:

**Minimum**: t3.small (2GB RAM)
**Recommended**: t3.medium (4GB RAM) for faster builds

### Increase Build Timeout:

Add to your EC2 instance:
```bash
# Edit Docker daemon config
sudo nano /etc/docker/daemon.json
```

Add:
```json
{
  "max-concurrent-downloads": 3,
  "max-concurrent-uploads": 3
}
```

```bash
# Restart Docker
sudo systemctl restart docker
```

### Monitor Build Progress:

```bash
# In another terminal, watch Docker stats
watch -n 2 docker stats

# Or check system resources
watch -n 2 'free -m && df -h'
```

### If Build Still Hangs:

1. **Check network**: `ping -c 3 registry.npmjs.org`
2. **Check disk space**: `df -h`
3. **Check memory**: `free -m`
4. **Review logs**: `cat build.log | grep -i error`
5. **Try smaller instance type changes**: Build on larger instance, export image, import on smaller instance

### Alternative: Build in Stages

If build still hangs, try building images separately:

```bash
# Build backend only
docker build --target server-builder -t ismellbs-server .

# Build frontend only  
docker build --target client-builder -t ismellbs-client .

# Build final image
docker build -t ismellbs:latest .
```

### Environment Variables

Create `.env` file with:
```env
NPM_CONFIG_FETCH_TIMEOUT=600000
NPM_CONFIG_FETCH_RETRIES=10
NODE_OPTIONS=--max-old-space-size=2048
```
