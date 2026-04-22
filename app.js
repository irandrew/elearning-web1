import express from 'express';

const app = express();

// Basic Middleware
app.use(express.json());

// API Routes
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'Operational',
    timestamp: new Date().toISOString()
  });
});

export default app;
