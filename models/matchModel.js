
const config = require('../config/config');
const mongoModel = require('./mongoModel');
const Factory = require('../utils/factory');

const collectionName = config.COLLECTIONS.MATCHES;

const buildMatch = (matchData) => {
    switch (matchData.matchType) {
        case 'T20':
            return Factory.Match.createT20Match(matchData);
        case 'ODI':
            return Factory.Match.createODIMatch(matchData);
        case 'Test':
            return Factory.Match.createTestMatch(matchData);
        default:
            return Factory.Match.createMatch(matchData);
    }
};

const MatchModel = {
    buildMatch,
    findById: (id) => mongoModel.findById(collectionName, id),
    findOne: (query = {}) => mongoModel.findOne(collectionName, query),
    list: (query = {}, options = {}) => mongoModel.find(collectionName, query, options),
    count: (query = {}) => mongoModel.count(collectionName, query),
    create: async (matchData) => {
        const match = buildMatch(matchData);
        const result = await mongoModel.insertOne(collectionName, match);
        return { result, match };
    },
    updateById: (id, update) => mongoModel.updateById(collectionName, id, update),
    deleteById: (id) => mongoModel.deleteById(collectionName, id),
    listLive: () => mongoModel.find(collectionName, { status: 'live' }, { sort: { date: -1 } }),
    listRecentCompleted: (limit = 5) =>
        mongoModel.find(collectionName, { status: 'completed' }, { limit, sort: { updatedAt: -1 } }),
    listRecentCreated: (limit = 5) =>
        mongoModel.find(collectionName, {}, { limit, sort: { createdAt: -1 } }),
    listUpcoming: (limit = 3) =>
        mongoModel.find(collectionName, { status: 'upcoming' }, { limit, sort: { date: 1 } })
};

module.exports = MatchModel;
