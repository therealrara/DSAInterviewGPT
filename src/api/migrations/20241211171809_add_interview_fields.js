exports.up = function (knex) {
    return knex.schema.alterTable('interviews', (table) => {
        table.string('title').nullable(); // Add a new column
        table.text('problem_statement').nullable();
        table.string('score').nullable(); // Add a new column
        table.text('interview_feedback').nullable();
        table.text('conversation_link').nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable('interviews', (table) => {
        table.dropColumn('title'); // Add a new column
        table.dropColumn('problem_statement');
        table.dropColumn('score'); // Add a new column
        table.dropColumn('interview_feedback');
        table.dropColumn('conversation_link');
    });
};