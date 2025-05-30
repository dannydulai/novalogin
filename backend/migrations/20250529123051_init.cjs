/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.schema.raw(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);
    // Users table
    await knex.schema.raw(`
        CREATE TABLE users (
            user_id uuid PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
            created timestamp without time zone DEFAULT now(),
            updated timestamp without time zone DEFAULT now(),
            email text NOT NULL UNIQUE,
            email_key text NOT NULL UNIQUE,
            password text NOT NULL,
            password_reset_token uuid,
            firstname text,
            lastname text,
            referred_by uuid REFERENCES users(user_id) ON DELETE SET NULL,
            referral_code text UNIQUE NOT NULL,
            groups text[] DEFAULT '{}',
            tfa_enabled boolean DEFAULT false,
            tfa_secret text,
            class text DEFAULT 'Normal',
            is_fraud boolean DEFAULT false
        );

        CREATE INDEX users_email_key_idx ON users(email_key);
        CREATE INDEX users_email_idx ON users(email);
        CREATE INDEX users_referral_code_idx ON users(referral_code);
        CREATE INDEX users_referred_by_idx ON users(referred_by);
        CREATE INDEX users_firstname_idx ON users(firstname);
        CREATE INDEX users_lastname_idx ON users(lastname);
        CREATE INDEX users_groups_idx ON users(groups);
        CREATE INDEX users_class_idx ON users(class);
    `);
    // Associations table
    await knex.schema.raw(`
        CREATE TABLE associations (
            user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            association_id text PRIMARY KEY NOT NULL,
            association_type text NOT NULL,
            created timestamp without time zone DEFAULT now(),
            updated timestamp without time zone DEFAULT now(),
            data jsonb DEFAULT '{}'::jsonb
        );
        CREATE INDEX associations_user_id_idx ON associations(user_id);
    `);
    // Tokens table
    await knex.schema.raw(`
        CREATE TABLE tokens (
            token_id uuid PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
            user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            expiration timestamp without time zone NOT NULL
        );
        CREATE INDEX tokens_user_id_idx ON tokens(user_id);
        CREATE INDEX tokens_expiration_idx ON tokens(expiration);
    `);
    // Apps table
    await knex.schema.raw(`
        CREATE TABLE apps (
            app_id uuid PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
            secret uuid DEFAULT uuid_generate_v4(),
            login_callback text,
            name text NOT NULL,
            oidc boolean DEFAULT false,
            groups text[] dEFAULT '{}'
        );
    `);
    // Token Info table
    await knex.schema.raw(`
        CREATE TABLE token_info (
            token_id uuid NOT NULL REFERENCES tokens(token_id) ON DELETE CASCADE,
            user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            app_id uuid NOT NULL REFERENCES apps(app_id) ON DELETE CASCADE,
            app_name text NOT NULL,
            ip text NOT NULL,
            location text,
            os text,
            browser text,
            logout_token uuid NOT NULL DEFAULT uuid_generate_v4(),
            session_token uuid NOT NULL,
            created timestamp without time zone DEFAULT now()
        );
        CREATE INDEX token_info_token_id_idx ON token_info(token_id);
    `);
    // Codes table
    await knex.schema.raw(`
        CREATE TABLE codes (
            code uuid PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
            expiration timestamp without time zone DEFAULT now() + interval '5 hours',
            challenge text NOT NULL,
            value text NOT NULL
        );
        CREATE INDEX codes_expiration_idx ON codes(expiration);
    `);
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    await knex.schema.raw(`
        ALTER TABLE codes DROP CONSTRAINT IF EXISTS codes_expiration_idx;
        DROP TABLE IF EXISTS codes;
    `);
    await knex.schema.raw(`
        DROP INDEX IF EXISTS token_info_token_id_idx;
        DROP TABLE IF EXISTS token_info;
    `);
    await knex.schema.raw(`
        DROP TABLE IF EXISTS apps;
    `);
    await knex.schema.raw(`
        ALTER TABLE tokens DROP CONSTRAINT IF EXISTS tokens_user_id_idx;
        ALTER TABLE tokens DROP CONSTRAINT IF EXISTS tokens_expiration_idx;
        DROP TABLE IF EXISTS tokens;
    `);
    await knex.schema.raw(`
        ALTER TABLE associations DROP CONSTRAINT IF EXISTS associations_user_id_idx;
        DROP TABLE IF EXISTS associations;
    `);
    await knex.schema.raw(`
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key_idx;
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_idx;
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_referral_code_idx;
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_referred_by_idx;
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_firstname_idx;
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_lastname_idx;
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_groups_idx;
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_class_idx;
        DROP TABLE IF EXISTS users;
    `);
    await knex.schema.raw(`
        DROP EXTENSION IF EXISTS "uuid-ossp";
    `);
};
