exports.up = function (knex) {
    return knex.schema.alterTable('users', (table) => {
        table.string('username').nullable().alter(); // Make username nullable
        table.string('email').nullable().alter(); // Make email nullable
        table.string('password').nullable().alter(); // Make password nullable
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable('users', (table) => {
        table.string('username').notNullable().alter(); // Revert to not nullable
        table.string('email').notNullable().alter(); // Revert to not nullable
        table.string('password').notNullable().alter(); // Revert to not nullable
    });
};
