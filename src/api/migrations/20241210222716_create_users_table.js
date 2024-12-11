exports.up = function (knex) {
    return knex.schema.createTable('users', (table) => {
        table.increments('id').primary(); // Auto-incrementing primary key
        table.string('username').notNullable().unique(); // Unique username
        table.string('email').notNullable().unique(); // Unique email
        table.string('password').notNullable(); // Password hash
        table.timestamps(true, true); // created_at and updated_at
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('users'); // Drop the table if rolled back
};
