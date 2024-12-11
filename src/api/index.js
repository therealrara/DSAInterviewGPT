const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 3000;

const loginApi = require('./routes/loginApi');
const interviewApi = require('./routes/interviewApi');
const userApi = require('./routes/userApi');

const knex = require('knex');
const knexConfig = require('./knexfile');

// Choose environment dynamically
const environment = process.env.NODE_ENV || 'development';
const db = knex(knexConfig[environment]);

(async () => {
  try {
    console.log('Testing database connection...');
    const result = await db.raw('SELECT 1+1 AS result');
    console.log('Database connection successful:', result.rows[0]);

    console.log('Running database migrations...');
    await db.migrate.latest(); // Run all pending migrations
    console.log('Migrations completed successfully.');

    console.log('Starting the application...');
    const app = express();

    app.use(cors());
    app.use(express.json()); // Parse JSON bodies

    app.use((req, res, next) => {
      req.db = db; // Attach Knex instance
      next();
    });

    // Define API routes
    app.use('/login', loginApi);
    app.use('/interview', interviewApi);
    app.use('/users', userApi);

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('Closing database connection...');
      await db.destroy();
      console.log('Database connection closed.');
      process.exit(0);
    });

  } catch (error) {
    console.error('Error initializing application:', error.message);
    process.exit(1);
  }
})();
