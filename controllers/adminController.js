
const logger = require('../middleware/logger');
const config = require('../config/config');
const UserModel = require('../models/userModel');

const getUsersAPI = async (req, res) => {
    try {
        const { role, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        
        const query = {};
        if (role) query.role = role;
        
        const users = await UserModel.list(query, {
            limit: parseInt(limit),
            skip: parseInt(skip),
            sort: { createdAt: -1 }
        });
        
        const total = await UserModel.count(query);
        
        res.json({
            success: true,
            data: users,
            meta: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip),
                page: parseInt(page)
            }
        });
    } catch (error) {
        console.error('Error loading users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load users'
        });
    }
};

const postUpdateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        if (!Object.values(config.ROLES).includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role'
            });
        }
        
        if (id === req.session.user.id) {
            return res.status(400).json({
                success: false,
                error: 'Cannot change your own role'
            });
        }
        
        await UserModel.updateRole(id, role);
        
        res.json({
            success: true,
            message: 'User role updated successfully'
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user role'
        });
    }
};

const getLogsAPI = async (req, res) => {
    try {
        const { type = 'request', page = 1, limit = 50 } = req.query;
        const skip = (page - 1) * limit;
        
        let logs;
        let total;
        
        if (type === 'auth') {
            const result = await logger.getAuthLogs({ limit: parseInt(limit), skip: parseInt(skip) });
            logs = result.logs;
            total = result.total;
        } else {
            const result = await logger.getLogs({ limit: parseInt(limit), skip: parseInt(skip) });
            logs = result.logs;
            total = result.total;
        }
        
        res.json({
            success: true,
            data: logs,
            meta: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip),
                page: parseInt(page)
            }
        });
    } catch (error) {
        console.error('Error loading logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load logs'
        });
    }
};

module.exports = {
    getUsersAPI,
    postUpdateUserRole,
    getLogsAPI
};
