import pino                      from 'pino';
import morgan                    from 'morgan';
import express                   from 'express';
import path                      from 'path';
import multer                    from 'multer';
import cookieParser              from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';

import config          from './config.js';
import knex            from './db.js';
import admin           from "./admin.mjs";
import login           from "./login.mjs";
import accountpage     from './accountpage.mjs';
import accountTFA      from "./account2fa.mjs";
import account6        from './account6/account6.mjs';
import account5        from './account5.mjs';

const logger = pino({ name: "main" });
const app    = express();
app.disable('x-powered-by');
app.use(morgan('[:date[clf]] - :remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms'))
app.set('trust proxy', true)

// Set up a selective proxy middleware that checks if a route exists in account6 first
logger.info('Setting up selective proxy: account6 -> account5');

// Account5 target URL
const ACCOUNT5_URL = config.accountServerUrl; // Replace with actual account5 URL

// Create a proxy middleware for account5 requests
const account5Proxy = createProxyMiddleware({
    target: ACCOUNT5_URL,
    changeOrigin: true,
    // Preserve original IP and protocol information
    xfwd: true,
    on: {
        // Add additional headers to preserve request context
        proxyReq: (proxyReq, req, res) => {
            // Add back /accounts to front of request path
            proxyReq.path = `/accounts${proxyReq.path}`;

            // Preserve all original headers
            ///Object.keys(req.headers).forEach(key => {
            ///    // Don't override certain headers that the proxy middleware will set
            ///    if (!['host', 'connection'].includes(key.toLowerCase())) {
            ///        const value = req.headers[key];
            ///        proxyReq.setHeader(key, value);
            ///    }
            ///});
        },
        // Handle proxy errors
        error: (err, req, res) => {
            logger.error(`Proxy error: ${err.message}`);
            res.writeHead(500, {
                'Content-Type': 'text/plain',
            });
            res.end('Proxy error: Unable to connect to account5 service');
        }
    }
});

const accounts5Middleware = (req, res, next) => {
    const path   = `/api/accounts${req.path}`;
    const method = req.method.toLowerCase();
    for (let route of app._router.stack) {
        if (route.route?.path?.endsWith('/*') && path.startsWith(route.route.path.slice(0, -2)) && route.route.methods[method]) {
            return route.route.stack[0].handle(req, res, next); // Call handler manually since express won't match the route via next()
        } else if (route.route?.path === path && route.route.methods[method]) {
            return route.route.stack[0].handle(req, res, next);
        }
    }
    logger.info(`No matching route found for ${req.method} ${path}, proxying to account5`);
    return account5Proxy(req, res, next); // Use the proxy for all /api/accounts requests, must be above express.json()
};

app.use('/accounts',     accounts5Middleware);
app.use('/api/accounts', accounts5Middleware);

// Register this after proxy to avoid hangs / conflicts in data parsing
app.use(express.static(path.resolve() + '/public'));
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(multer().none());
app.use((req,res,next) => {
    res.header('x-frame-options', 'DENY');

    // allow pagerunner.roonlabs.net to make requests to this server (cors)
    res.header('Access-Control-Allow-Origin', 'https://pagerunner.roonlabs.net');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');

    next();
});

app.get("/", (req, res) => {
    return res.status(301).redirect('https://account.roon.app');
});

app.get("/__health", async (req, res) => { return res.send(); })


login      (app, logger);   // [x]
accountTFA (app, logger);   // [x]
admin      (app, logger);   // [x]
account6   (app, logger);   // [x]
account5   (app, logger);   // [x] ** All routes must start with /api/accounts **
accountpage(app, logger);   // [x]

const expireoldcodes = async function () {
    try {
        await knex.raw(`DELETE FROM codes WHERE expiration < NOW()`);
    } catch (e) {
        console.log(e);
    }
}
expireoldcodes();
setInterval(() => expireoldcodes(), 1 * 60 * 1000); // every 1 minute, expire old codes

logger.info(`listening on port ${config.port}`);
app.listen(config.port)
