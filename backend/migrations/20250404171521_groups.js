/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    // add groups text array to apps table
    await knex.raw(`
    ALTER TABLE apps
    ADD COLUMN groups TEXT[] DEFAULT '{}'::TEXT[]
    `);
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};
