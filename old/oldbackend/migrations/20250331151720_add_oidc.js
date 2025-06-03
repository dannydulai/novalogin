/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
	await knex.schema.raw(`
        ALTER TABLE apps
        ADD COLUMN oidc BOOLEAN DEFAULT FALSE;
		`);
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};
