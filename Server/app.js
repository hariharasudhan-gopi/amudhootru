// const express = require("express");

// const userRoutes = require("./routes/userRoutes.js");

// const app = express();
// const PORT = 8080;

// // Mount routers
// app.use("/userLogin", userRoutes);

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });


const express = require("express");
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
require('dotenv').config();
const pool = require('./db/pool');

const app = express();

const PORT = process.env.PORT || 8080;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

const ensureSessionTableSQL = `
  CREATE TABLE IF NOT EXISTS user_sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
  );
`;

const ensureSessionIndexSQL = `
  CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions (expire);
`;

pool.query(ensureSessionTableSQL)
  .then(() => pool.query(ensureSessionIndexSQL))
  .catch((error) => {
    console.error('Failed to ensure session table:', error.message);
  });

pool.query('ALTER TABLE productdetails ADD COLUMN IF NOT EXISTS offerprice NUMERIC;')
  .catch((error) => {
    console.error('Failed to ensure offerprice column:', error.message);
  });

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser requests and configured browser origins.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(session({
  store: new pgSession({
    pool,
    tableName: 'user_sessions',
  }),
  name: 'amudhootru.sid',
  secret: process.env.SESSION_SECRET || 'amudhootru-dev-secret',
  proxy: isProduction,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    // Cross-site cookie is required when frontend and API are on different Railway domains.
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
}));

// increase limit to handle base64-encoded profile images
app.use(express.json({ limit: '5mb' }));

// import routes
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const chatRoutes = require("./routes/chatRoutes");

// use routes
app.use(userRoutes);
app.use(productRoutes);
app.use(orderRoutes);
app.use(chatRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
