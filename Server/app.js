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
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 8080;

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
  name: 'amudhootru.sid',
  secret: process.env.SESSION_SECRET || 'amudhootru-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
}));

// increase limit to handle base64-encoded profile images
app.use(express.json({ limit: '5mb' }));

// import routes
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

// use routes
app.use(userRoutes);
app.use(productRoutes);
app.use(orderRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
