
const bcrypt = require('bcryptjs');
const Factory = require('../utils/factory');
const logger = require('../middleware/logger');
const UserModel = require('../models/userModel');
const config = require('../config/config');

const SALT_ROUNDS = 10;

const postLoginAPI = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both username and password'
            });
        }
        
        const user = await UserModel.findByUsername(username);
        
        if (!user) {
            await logger.logAuthEvent('failed_login', username, null, false, 'User not found', req);
            
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        
        if (user.loginAttempts >= config.APP.MAX_LOGIN_ATTEMPTS) {
            await logger.logAuthEvent('failed_login', username, user._id, false, 'Account locked', req);
            
            return res.status(403).json({
                success: false,
                message: 'Account is locked due to too many failed attempts'
            });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            await UserModel.incrementLoginAttempts(user._id.toString());
            
            await logger.logAuthEvent('failed_login', username, user._id, false, 'Invalid password', req);
            
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        
        await UserModel.resetLoginState(user._id.toString(), new Date());
        
        req.session.user = {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role
        };
        req.session.userRole = user.role;
        
        await logger.logAuthEvent('login', username, user._id, true, 'Login successful', req);
        
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during login'
        });
    }
};

const postRegisterAPI = async (req, res) => {
    try {
        const { username, email, password, confirmPassword, fullName } = req.body;
        
        if (!username || !email || !password || !confirmPassword || !fullName) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all fields'
            });
        }
        
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }
        
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }
        
        const existingUser = await UserModel.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }
        
        const existingEmail = await UserModel.findByEmail(email);
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        
        const userData = {
            username,
            email,
            password: hashedPassword,
            fullName,
            role: 'member'
        };
        
        const newUser = Factory.create('member', userData);
        
        const result = await UserModel.create(newUser);
        
        await logger.logAuthEvent('register', username, result.insertedId, true, 'Registration successful', req);
        
        req.session.user = {
            id: result.insertedId.toString(),
            username: username,
            email: email,
            fullName: fullName,
            role: 'member'
        };
        req.session.userRole = 'member';
        
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: {
                id: result.insertedId.toString(),
                username: username,
                email: email,
                fullName: fullName,
                role: 'member'
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during registration'
        });
    }
};

const logoutAPI = async (req, res) => {
    try {
        if (req.session.user) {
            await logger.logAuthEvent('logout', req.session.user.username, req.session.user.id, true, 'Logout successful', req);
        }
        
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
            }
            res.json({ success: true, message: 'Logout successful' });
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, message: 'Logout failed' });
    }
};

module.exports = {
    postLoginAPI,
    postRegisterAPI,
    logoutAPI
};
