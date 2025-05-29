import account6_router from './routes.mjs';
export default function(app, logger) {
    app.use('/api/6', account6_router);
}
