import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import blogRoutes from './routes/blog.routes';
import newsRoutes from './routes/news.routes';
import commentRoutes from './routes/comment.routes';
import adminRoutes from './routes/admin.routes';
import userRoutes from './routes/user.routes';
import { createIndex, testConnection } from './config/elasticsearch';
import esClient from './config/elasticsearch';
import { AdminUserService } from './services/adminUser.service';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));

// CORS configuration with validation
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️  Blocked CORS request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', blogRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  // In Docker: __dirname = /app/dist/server, client build is at /app/client/build
  const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'build');
  console.log(`📁 Serving static files from: ${clientBuildPath}`);
  app.use(express.static(clientBuildPath));
  
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // 404 handler for development
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Initialize Elasticsearch and start server
const startServer = async () => {
  try {
    console.log('Testing Elasticsearch connection...');
    const connected = await testConnection();

    if (!connected) {
      console.error('Failed to connect to Elasticsearch. Retrying in 5 seconds...');
      setTimeout(startServer, 5000);
      return;
    }

    console.log('Creating Elasticsearch index...');
    await createIndex();

    // Initialize admin user service and create admin index
    const adminUserService = new AdminUserService(esClient);
    await adminUserService.initializeIndex();
    console.log('Admin users index initialized');

    // Initialize user service and create users index
    const userService = new UserService(esClient);
    await userService.initializeIndex();
    console.log('Users index initialized');

    // Initialize auth service with admin user service
    const authService = new AuthService(adminUserService);
    
    // Make services available globally for routes
    (global as any).adminUserService = adminUserService;
    (global as any).authService = authService;
    (global as any).userService = userService;

    // Clean up lockouts every hour
    setInterval(() => authService.cleanupLockouts(), 60 * 60 * 1000);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
