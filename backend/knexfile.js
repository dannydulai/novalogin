import dotenv from 'dotenv';
dotenv.config();

export default {
    client: "pg",
    connection: {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
    },
    pool: {
        min: 0,
        max: 100,
    },
}
