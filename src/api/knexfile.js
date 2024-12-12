require('dotenv').config(); // Load environment variables

module.exports = {
    development: {
        client: 'pg',
        connection: {
            connectionString: process.env.PG_URL,
            ssl: { rejectUnauthorized: false },
        },
        pool: {
            min: 2,
            max: 10, // Increase the max connections
        },
        migrations: {
            directory: './migrations',
        },
        debug: false,
    },
    production: {
        client: 'pg',
        connection: {
            connectionString: process.env.PG_URL,
            ssl: { rejectUnauthorized: false },
        },
        pool: {
            min: 2,
            max: 10, // Increase the max connections
        },
        migrations: {
            directory: './migrations',
        },
    },
};
