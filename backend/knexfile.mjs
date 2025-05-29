import config from './config.mjs';

export default {
    client: "pg",
    connection: config.db,
    pool: {
        min: 0,
        max: 100
    }
}
