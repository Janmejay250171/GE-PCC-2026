import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import policyRoutes from './routes/policyRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import journeyRoutes from './routes/journeyRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { hospitalService } from './services/hospitalService.js';
import { Policy } from './models/Policy.js';
import { DEMO_POLICIES } from './utils/demoData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Flexible CORS: allow local dev, Render deployed domains (*.onrender.com), and configured clientUrl
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow curl, mobile, same-origin
    if (allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in production for client flexibility
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// P0.8: Do NOT publicly serve uploaded policy documents via static routes.
// Internal references remain secure; mock demo PDFs remain accessible for demonstrations.
app.use('/mock-policies', express.static(path.resolve(__dirname, '../../mock-policies')));

// Health endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'SehatSure Backend',
    timestamp: new Date().toISOString()
  });
});

// Feature 1: Policy Routes
app.use('/api/policy', policyRoutes);

// Feature 2 & 3: Hospital Discovery, Ranking & Bill Breakdown Routes
app.use('/api/hospitals', hospitalRoutes);

// Feature 4: Care Journey Event Tracking, Rules Engine & State Persistence
app.use('/api/journey', journeyRoutes);

// Authentication & Profile Routes
app.use('/api/auth', authRoutes);

// 404 handler for unknown API routes
app.use('/api/*', (_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested API route does not exist.'
    }
  });
});

// Production: Serve Vite build assets and SPA fallback
const possibleFrontendDist = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../../../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist')
];

let frontendDistPath: string | null = null;
for (const p of possibleFrontendDist) {
  if (fs.existsSync(p)) {
    frontendDistPath = p;
    break;
  }
}

if (frontendDistPath) {
  console.log(`[Server] Serving static frontend from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));

  // SPA fallback for all non-API GET routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/mock-policies') || req.path.startsWith('/uploads')) {
      return next();
    }
    const indexPath = path.join(frontendDistPath!, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

async function startServer() {
  try {
    await connectDB();
    await hospitalService.initData();

    // Auto-seed demo policies if database is empty
    const policyCount = await Policy.countDocuments();
    if (policyCount === 0) {
      console.log('[Server] Database is empty. Seeding demo policies...');
      for (const demo of DEMO_POLICIES) {
        await Policy.create({
          _id: demo.id,
          confirmedByUser: false,
          ...demo.data
        });
      }
      console.log('[Server] Demo policies seeded successfully.');
    }

    app.listen(config.port, () => {
      console.log(`[Server] SehatSure API running on port ${config.port}`);
      console.log(`[Server] Client origin allowed: ${config.clientUrl}`);
    });
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
