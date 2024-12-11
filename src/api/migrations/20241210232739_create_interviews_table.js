exports.up = function (knex) {
    return knex.schema.createTable('interviews', (table) => {
        table.increments('id').primary(); // Auto-incrementing primary key
        table.string('interview_id').notNullable().unique(); // Unique interview ID
        table.boolean('in_progress').notNullable().defaultTo(false); // Boolean for progress status
        table
            .integer('user_id') // Foreign key column
            .unsigned() // Unsigned to match the auto-incrementing ID of the users table
            .notNullable()
            .references('id') // Column being referenced
            .inTable('users') // Table being referenced
            .onDelete('CASCADE') // Delete interview records when the user is deleted
            .onUpdate('CASCADE'); // Update foreign keys when the user ID changes
        table.timestamps(true, true); // created_at and updated_at
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('interviews'); // Drop the table if rolled back
};