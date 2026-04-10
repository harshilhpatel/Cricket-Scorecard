
const express = require('express');
const session = require('express-session');
const path = require('path');

const config = require('./config/config');

const authMiddleware = require('./middleware/auth');
const loggerMiddleware = require('./middleware/logger');

const authController = require('./controllers/authController');
const apiController = require('./controllers/apiController');
const adminController = require('./controllers/adminController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));

app.use(session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(loggerMiddleware.logRequest);


const PUBLIC_PAGES = new Set([
    'index.html',
    'login.html',
    'register.html',
    'about.html'
]);

const MEMBER_PAGES = new Set([
    'matches.html',
    'match-details.html',
    'create-match.html',
    'live-scores.html'
]);

const ADMIN_PAGES = new Set([
    'admin-dashboard.html',
    'admin-users.html',
    'admin-logs.html'
]);

const sendPage = (res, page) => {
    return res.sendFile(path.join(__dirname, 'views', 'pages', page));
};

const buildLoginPageUrl = (req) => {
    return `/pages/login.html?returnTo=${encodeURIComponent(req.originalUrl)}`;
};

const isAuthenticated = (req) => {
    return !!req.session?.user;
};

const isAdmin = (req) => {
    return authMiddleware.getSessionRole(req) === config.ROLES.ADMIN;
};

app.get('/', (req, res) => {
    sendPage(res, 'index.html');
});

app.get('/pages/:page', (req, res) => {
    const page = req.params.page;
    const validPages = new Set([
        ...PUBLIC_PAGES,
        ...MEMBER_PAGES,
        ...ADMIN_PAGES
    ]);

    if (!validPages.has(page)) {
        return res.status(404).sendFile(path.join(__dirname, 'views', 'pages', 'index.html'));
    }

    if (ADMIN_PAGES.has(page)) {
        if (!isAuthenticated(req)) {
            return res.redirect(buildLoginPageUrl(req));
        }

        if (!isAdmin(req)) {
            return res.redirect('/');
        }
    }

    if (MEMBER_PAGES.has(page) && !isAuthenticated(req)) {
        return res.redirect(buildLoginPageUrl(req));
    }

    return sendPage(res, page);
});


app.post('/login', authController.postLoginAPI);
app.post('/register', authController.postRegisterAPI);
app.get('/logout', authController.logoutAPI);

app.get('/api/session', (req, res) => {
    if (req.session.user) {
        res.json({ success: true, user: req.session.user });
    } else {
        res.json({ success: false, user: null });
    }
});

app.get('/api/matches', apiController.getMatches);
app.get('/api/matches/:id', authMiddleware.requireAuth, apiController.getMatchById);
app.post('/api/matches', authMiddleware.requireAuth, apiController.createMatch);
app.put('/api/matches/:id', authMiddleware.requireAdmin, apiController.updateMatch);
app.delete('/api/matches/:id', authMiddleware.requireAdmin, apiController.deleteMatch);

app.get('/api/users', authMiddleware.requireAdmin, adminController.getUsersAPI);
app.post('/admin/users/:id/role', authMiddleware.requireAdmin, adminController.postUpdateUserRole);

app.get('/api/logs', authMiddleware.requireAdmin, adminController.getLogsAPI);

app.get('/api/external/cricket', apiController.getExternalCricketData);


app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        success: false,
        error: 'Something went wrong!'
    });
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'pages', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  Cricket Easy Scorecard Server`);
    console.log(`  Running on http://localhost:${PORT}`);
    console.log(`========================================\n`);
});

module.exports = app;
