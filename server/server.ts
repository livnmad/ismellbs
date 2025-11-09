import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import blogRoutes from './routes/blog.routes';
import newsRoutes from './routes/news.routes';
import commentRoutes from './routes/comment.routes';
import adminRoutes from './routes/admin.routes';
import { createIndex, testConnection } from './config/elasticsearch';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
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

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'build');
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
