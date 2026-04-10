
const LogModel = require('../models/logModel');

const logRequest = async (req, res, next) => {
    const startTime = Date.now();
    
    const originalEnd = res.end;
    
    res.end = function(chunk, encoding) {
        res.end = originalEnd;
        res.end(chunk, encoding);
        
        const responseTime = Date.now() - startTime;
        
        const logData = {
            method: req.method,
            url: req.originalUrl || req.url,
            ip: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('user-agent') || 'unknown',
            userId: req.session?.user?.id || null,
            username: req.session?.user?.username || 'anonymous',
            role: req.session?.userRole || req.session?.user?.role || 'guest',
            requestBody: req.method !== 'GET' ? sanitizeRequestBody(req.body) : null,
            responseStatus: res.statusCode,
            responseTime: responseTime
        };
        
        LogModel.createRequestLog(logData).catch(err => {
            console.error('Error saving request log:', err);
        });
    };
    
    next();
};

const sanitizeRequestBody = (body) => {
    if (!body || typeof body !== 'object') {
        return body;
    }
    
    const sanitized = { ...body };
    
    const sensitiveFields = ['password', 'confirmPassword', 'creditCard', 'ssn', 'token'];
    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '***REDACTED***';
        }
    });
    
    return sanitized;
};

const logAuthEvent = async (eventType, username, userId, success, message, req) => {
    try {
        const logData = {
            eventType: eventType,
            username: username,
            userId: userId,
            ip: req?.ip || req?.connection?.remoteAddress || 'unknown',
            userAgent: req?.get('user-agent') || 'unknown',
            success: success,
            message: message
        };
        await LogModel.createAuthLog(logData);
    } catch (error) {
        console.error('Failed to log auth event:', error);
    }
};

const getLogs = async (options = {}) => {
    try {
        const { 
            limit = 100, 
            skip = 0, 
            startDate = null, 
            endDate = null,
            userId = null,
            method = null,
            status = null
        } = options;
        
        const query = {};
        
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }
        
        if (userId) query.userId = userId;
        if (method) query.method = method;
        if (status) query.responseStatus = status;
        
        const logs = await LogModel.list(query, {
            limit: parseInt(limit),
            skip: parseInt(skip),
            sort: { timestamp: -1 }
        });

        const total = await LogModel.count(query);
        
        return { logs, total };
    } catch (error) {
        console.error('Error fetching logs:', error);
        throw error;
    }
};

const getAuthLogs = async (options = {}) => {
    try {
        const { limit = 100, skip = 0, username = null, eventType = null } = options;
        
        const query = { eventType: { $exists: true } };
        
        if (username) query.username = username;
        if (eventType) query.eventType = eventType;
        
        const logs = await LogModel.list(query, {
            limit: parseInt(limit),
            skip: parseInt(skip),
            sort: { timestamp: -1 }
        });

        const total = await LogModel.count(query);
        
        return { logs, total };
    } catch (error) {
        console.error('Error fetching auth logs:', error);
        throw error;
    }
};

const clearOldLogs = async (daysToKeep = 30) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        
        const result = await LogModel.deleteMany({
            timestamp: { $lt: cutoffDate }
        });
        
        return result;
    } catch (error) {
        console.error('Error clearing old logs:', error);
        throw error;
    }
};

module.exports = {
    logRequest,
    logAuthEvent,
    getLogs,
    getAuthLogs,
    clearOldLogs
};
