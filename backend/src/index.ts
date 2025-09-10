import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
// import compression from 'compression';
// import rateLimit from 'express-rate-limit';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
// import winston from 'winston';
import { chatRoutes } from './routes/chat';
import { insightsRoutes } from './routes/insights';
import { healthRoutes } from './routes/health';

// Initialize logger - simplified
const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
  debug: (message: string, meta?: any) => console.log(`[DEBUG] ${message}`, meta || '')
};

// Initialize Secret Manager client
const secretClient = new SecretManagerServiceClient();

// Function to get secret from Secret Manager
async function getSecret(secretName: string): Promise<string> {
  try {
    // Fallback to environment variables when available
    const envFallback = process.env[secretName.replace(/-/g, '_').toUpperCase()];
    if (envFallback) return envFallback;

    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'otakon-production';
    const [version] = await secretClient.accessSecretVersion({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
    });
    return version.payload?.data?.toString() || '';
  } catch (error) {
    logger.error(`Error accessing secret ${secretName}:`, error);
    throw error;
  }
}

// Initialize Express app
const app = express();
const port = process.env.PORT || 8080;

// Rate limiting - simplified
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });

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
}));
// app.use(compression());
// app.use(limiter);
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://otakon-production.web.app',
        'https://otakon-production.firebaseapp.com',
        'https://otakon-production.web.app',
        'https://otakon-production.firebaseapp.com'
      ]
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Initialize services
let supabase: any;
let gemini: GoogleGenAI;

async function initializeServices() {
  try {
    logger.info('Initializing services...');
    
    // Get secrets
    const supabaseUrl = await getSecret('supabase-url');
    const supabaseServiceKey = await getSecret('supabase-service-key');
    const geminiApiKey = await getSecret('gemini-api-key');

    // Initialize Supabase
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Initialize Gemini
    gemini = new GoogleGenAI({ apiKey: geminiApiKey });

    // Make services available to routes
    app.locals.supabase = supabase;
    app.locals.gemini = gemini;
    app.locals.logger = logger;

    logger.info('Services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Routes
app.use('/health', healthRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/insights', insightsRoutes);

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  try {
    await initializeServices();
    
    app.listen(Number(port), '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${port}`, {
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
