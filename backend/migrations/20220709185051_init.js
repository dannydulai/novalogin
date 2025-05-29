/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.schema
        .raw(`
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        `)
        .raw(`
          CREATE TABLE apps (
              id              text PRIMARY KEY DEFAULT uuid_generate_v4(),
              secret          text DEFAULT uuid_generate_v4(),
              login_callback  text NOT NULL,
              logout_callback text NOT NULL,
              name            text NOT NULL
          );
      `)
        .raw(`
          CREATE TABLE codes (
              code       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
              expiration timestamp without time zone NOT NULL DEFAULT NOW() + interval '5 minutes',
              challenge  text NOT NULL,
              value      text NOT NULL
          );
          CREATE INDEX idx_codes_expiration ON codes(expiration);
      `)
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    await knex.schema
        .raw(`
          DROP TABLE apps;
       `)
        .raw(`
          DROP TABLE codes;
       `)

};
