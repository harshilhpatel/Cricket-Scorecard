
const config = require('../config/config');
const mongoModel = require('./mongoModel');
const Factory = require('../utils/factory');

const collectionName = config.COLLECTIONS.LOGS;

const LogModel = {
    createRequestLog: async (logData) => {
        const logEntry = Factory.create('requestlog', logData);
        return mongoModel.insertOne(collectionName, logEntry);
    },
    createAuthLog: async (logData) => {
        const logEntry = Factory.create('authlog', logData);
        return mongoModel.insertOne(collectionName, logEntry);
    },
    list: (query = {}, options = {}) => mongoModel.find(collectionName, query, options),
    count: (query = {}) => mongoModel.count(collectionName, query),
    deleteMany: (query = {}) => mongoModel.deleteMany(collectionName, query)
};

module.exports = LogModel;
