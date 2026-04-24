require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { exec } = require('child_process');
const path = require('path');
const pool = require('./config/db');

const app = express();

async function initializeDatabase() {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_users')");
    client.release();
    
    if (!result.rows[0].exists) {
      console.log('Database not initialized. Running migrations...');
      
      exec('node database/migrate.js', (err, stdout, stderr) => {
        if (err) {
          console.error('Migration error:', err.message);
          return;
        }
        console.log(stdout);
        
        console.log('Running seed...');
        exec('node database/seed.js', (seedErr, seedStdout) => {
          if (seedErr) {
            console.error('Seed error:', seedErr.message);
            return;
          }
          console.log(seedStdout);
          console.log('Database initialized successfully');
        });
      });
    } else {
      console.log('Database already initialized');
    }
  } catch (err) {
    console.log('Could not check database status:', err.message);
  }
}

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  'https://brick-builder-lilac.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Requested-With']
}));

app.options('*', cors());

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/api/', limiter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

const teamRoutes = require('./src/routes/teamRoutes');
app.use('/api/team', teamRoutes);

const serviceRoutes = require('./src/routes/serviceRoutes');
app.use('/api/services', serviceRoutes);

const blogRoutes = require('./src/routes/blogRoutes');
app.use('/api/blog', blogRoutes);

const analyticsRoutes = require('./src/routes/analyticsRoutes');
app.use('/api/analytics', analyticsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong on the server' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

initializeDatabase();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);
});