
const config = require('../config/config');
const mongoModel = require('./mongoModel');

const collectionName = config.COLLECTIONS.TEAMS;

const TeamModel = {
    findById: (id) => mongoModel.findById(collectionName, id),
    findByName: (name) => mongoModel.findOne(collectionName, { name }),
    list: (query = {}, options = {}) => mongoModel.find(collectionName, query, options),
    listByName: () => mongoModel.find(collectionName, {}, { sort: { name: 1 } }),
    count: (query = {}) => mongoModel.count(collectionName, query),
    create: (team) => mongoModel.insertOne(collectionName, team),
    createMany: (teams) => mongoModel.insertMany(collectionName, teams)
};

module.exports = TeamModel;
