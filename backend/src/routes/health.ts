import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

export { router as healthRoutes };
