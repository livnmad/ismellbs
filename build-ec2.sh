#!/bin/bash
# EC2 Docker Build Script with Better Error Handling

echo "🚀 Starting Docker build for EC2..."

# Check available memory
FREE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
echo "📊 Available memory: ${FREE_MEM}MB"

if [ "$FREE_MEM" -lt 1024 ]; then
    echo "⚠️  Warning: Low memory detected. Build may be slow or fail."
    echo "💡 Consider stopping other services or upgrading instance."
fi

# Clean up old images and containers
echo "🧹 Cleaning up old Docker resources..."
docker system prune -f

# Option 1: Use optimized Dockerfile (recommended for EC2)
echo "📦 Building with optimized Dockerfile..."
docker build \
  --file Dockerfile.optimized \
  --tag ismellbs:latest \
  --progress=plain \
  --no-cache \
  . 2>&1 | tee build.log

BUILD_STATUS=$?

if [ $BUILD_STATUS -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📝 Build log saved to build.log"
else
    echo "❌ Build failed with status: $BUILD_STATUS"
    echo "📝 Check build.log for details"
    echo ""
    echo "💡 Troubleshooting tips:"
    echo "  1. Check internet connectivity: ping -c 3 registry.npmjs.org"
    echo "  2. Verify disk space: df -h"
    echo "  3. Check memory: free -m"
    echo "  4. Try building with regular Dockerfile: docker build -f Dockerfile -t ismellbs:latest ."
    exit 1
fi

# Show image size
echo ""
echo "📏 Final image size:"
docker images ismellbs:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo ""
echo "🎉 Ready to run: docker-compose up -d"
