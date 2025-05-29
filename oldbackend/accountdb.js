const knex       = require('knex')
const PGCONNSTR  = process.env.ACCOUNT_PG_URL || "";
const db         = knex({ connection: PGCONNSTR, client: 'pg', pool: { min: 0, max: 100 } })
module.exports   = db;
