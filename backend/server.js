require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const patientRoutes = require('./routes/patientRoutes');
const adminRoutes = require('./routes/adminRoutes');

connectDB();

const app = express();

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));

const corsOriginHandler = (origin, callback) => {
  if (!origin) return callback(null, true);
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const cleanOrigin = origin.replace(/\/+$/, '');
  const allowed = clientUrl.split(',').map((u) => u.trim().replace(/\/+$/, ''));
  if (allowed.includes('*') || allowed.includes(cleanOrigin) || process.env.NODE_ENV !== 'production') {
    return callback(null, true);
  }
  return callback(null, true);
};

app.use(
  cors({
    origin: corsOriginHandler,
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

// Rate limiting - especially important for AI + auth endpoints
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api', globalLimiter);

const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: 'Too many AI requests, slow down.' });
app.use('/api/ai', aiLimiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/auth', authLimiter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.get('/api', (req, res) => res.json({ status: 'ok', message: 'MediCareAI API root' }));

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/admin', adminRoutes);

// If frontend build exists (e.g. unified fullstack deployment on Render), serve frontend
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // Helpful root endpoint when backend is hosted as a standalone API
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'MediCareAI Backend API is running.',
      apiBaseUrl: '/api',
      endpoints: {
        health: '/api/health',
        registerPatient: 'POST /api/auth/register',
        registerDoctor: 'POST /api/auth/register-doctor',
        login: 'POST /api/auth/login',
      },
    });
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
});
