require('dotenv').config();
const express          = require('express');
const expressNovaLogin = require('express-nova-login')({
    app_id:        process.env.NOVA_APP_ID,
    app_secret:    process.env.NOVA_APP_SECRET,
    cookie_secret: process.env.NOVA_COOKIE_SECRET,
    auth_url:      process.env.NOVA_AUTH_URL,
});
const app = express();

app.use(expressNovaLogin.router);
app.get('/api/user', expressNovaLogin.middleware.hardCheck, (req, res) => {
    return res.json({
        user_id: req.auth.credentials.user_id,
        status: 'Success'
    });
});

app.listen(process.env.PORT || 3002, () => {
    console.log(`Server is running on port ${process.env.PORT || 3002}`);
});

