const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/database');
const { initSchema } = require('./db/init');

// Routes imports
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const monitoringRoutes = require('./routes/monitoringRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const chatRoutes = require('./routes/chatRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS with preflight support for React/Vite development server (default port 5173)
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Route Handlers mapping
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api', assessmentRoutes);
app.use('/api', monitoringRoutes);
app.use('/api', hospitalRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', chatRoutes);

// Health Check Endpoint (Required by Render/Railway deployment checks)
app.get('/api/health', async (req, res) => {
  try {
    const dbType = db.getDbType();
    // Quick test query
    await db.query('SELECT 1');
    res.json({
      status: 'healthy',
      database: 'connected',
      engine: dbType
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'error',
      details: error.message
    });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Unhandled Error: ', err.stack);
  res.status(500).json({
    message: 'An internal clinical system error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Startup Sequence
const bootstrap = async () => {
  try {
    // 1. Initialize DB Connection
    await db.initDatabase();
    
    // 2. Initialize tables, triggers, views, and reference seed data
    await initSchema();
    
    // 3. Launch Server
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`💚 [SERVER ACTIVE] MediSense-Ai API running on port ${PORT}`);
      console.log(`🚀 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🛡️ Secured by JWT & parameterized queries`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('❌ Server startup aborted due to critical database initialization failure:');
    console.error(error);
    process.exit(1);
  }
};

bootstrap();
