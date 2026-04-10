
const config = require('../config/config');

const getSessionRole = (req) => {
    return req.session?.userRole || req.session?.user?.role || config.ROLES.GUEST;
};

const isApiRequest = (req) => {
    return req.originalUrl.startsWith('/api/') || req.accepts(['html', 'json']) === 'json';
};

const buildLoginRedirectUrl = (req) => {
    return `/pages/login.html?returnTo=${encodeURIComponent(req.originalUrl)}`;
};

const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        req.session.returnTo = req.originalUrl;
        if (isApiRequest(req)) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                redirectTo: buildLoginRedirectUrl(req)
            });
        }

        res.redirect(buildLoginRedirectUrl(req));
    }
};

const requireAdmin = (req, res, next) => {
    if (req.session && req.session.user && getSessionRole(req) === config.ROLES.ADMIN) {
        next();
    } else {
        if (!req.session?.user) {
            req.session.returnTo = req.originalUrl;

            if (isApiRequest(req)) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    redirectTo: buildLoginRedirectUrl(req)
                });
            }

            return res.redirect(buildLoginRedirectUrl(req));
        }

        if (isApiRequest(req)) {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        res.redirect('/');
    }
};

const requireMember = (req, res, next) => {
    if (req.session && req.session.user) {
        const role = getSessionRole(req);
        if (role === config.ROLES.ADMIN || role === config.ROLES.MEMBER) {
            next();
        } else {
            if (isApiRequest(req)) {
                return res.status(403).json({
                    success: false,
                    error: 'Member access required'
                });
            }

            res.redirect('/');
        }
    } else {
        req.session.returnTo = req.originalUrl;

        if (isApiRequest(req)) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                redirectTo: buildLoginRedirectUrl(req)
            });
        }

        res.redirect(buildLoginRedirectUrl(req));
    }
};

const requireGuest = (req, res, next) => {
    if (!req.session || !req.session.user) {
        next();
    } else {
        res.redirect('/');
    }
};

const addUserToLocals = (req, res, next) => {
    const role = getSessionRole(req);
    res.locals.user = req.session.user || null;
    res.locals.userRole = role;
    res.locals.isAuthenticated = !!req.session.user;
    res.locals.isAdmin = role === config.ROLES.ADMIN;
    res.locals.isMember = role === config.ROLES.MEMBER || role === config.ROLES.ADMIN;
    next();
};

const getRoleLevel = (role) => {
    switch (role) {
        case config.ROLES.ADMIN:
            return 3;
        case config.ROLES.MEMBER:
            return 2;
        case config.ROLES.GUEST:
            return 1;
        default:
            return 0;
    }
};

const hasRoleLevel = (userRole, requiredRole) => {
    return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
};

module.exports = {
    requireAuth,
    requireAdmin,
    requireMember,
    requireGuest,
    addUserToLocals,
    getSessionRole,
    getRoleLevel,
    hasRoleLevel
};
