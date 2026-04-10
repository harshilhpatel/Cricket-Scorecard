
const config = require('../config/config');
const mongoModel = require('./mongoModel');

const collectionName = config.COLLECTIONS.USERS;

const UserModel = {
    findById: (id) => mongoModel.findById(collectionName, id),
    findByUsername: (username) => mongoModel.findOne(collectionName, { username }),
    findByEmail: (email) => mongoModel.findOne(collectionName, { email }),
    findOne: (query = {}) => mongoModel.findOne(collectionName, query),
    list: (query = {}, options = {}) => mongoModel.find(collectionName, query, options),
    count: (query = {}) => mongoModel.count(collectionName, query),
    create: (user) => mongoModel.insertOne(collectionName, user),
    createMany: (users) => mongoModel.insertMany(collectionName, users),
    updateById: (id, update) => mongoModel.updateById(collectionName, id, update),
    incrementLoginAttempts: (id) => mongoModel.updateById(collectionName, id, { $inc: { loginAttempts: 1 } }),
    resetLoginState: (id, lastLogin = new Date()) =>
        mongoModel.updateById(collectionName, id, {
            loginAttempts: 0,
            lastLogin
        }),
    updateRole: (id, role) =>
        mongoModel.updateById(collectionName, id, {
            role,
            updatedAt: new Date()
        })
};

module.exports = UserModel;
