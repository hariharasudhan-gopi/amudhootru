const { Pool } = require('pg');

const useConnectionString = Boolean(process.env.DATABASE_URL);

const pool = new Pool(
  useConnectionString
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT) || 5432,
      }
);

module.exports = pool;
