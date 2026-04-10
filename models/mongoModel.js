
const { MongoClient, ObjectId } = require('mongodb');
const dns = require('node:dns/promises');
const config = require('../config/config');

const MongoModel = (() => {
    let mongoClient = null;
    let db = null;
    let connectionPromise = null;

    const usesMongoOperators = (update = {}) =>
        Object.keys(update).some(key => key.startsWith('$'));

    const buildAtlasDirectUri = async (srvUri) => {
        const parsedUri = new URL(srvUri);
        const clusterHost = parsedUri.hostname;
        const srvLookupName = `_mongodb._tcp.${clusterHost}`;
        const srvRecords = await dns.resolveSrv(srvLookupName);

        if (!srvRecords.length) {
            throw new Error(`No SRV records found for ${clusterHost}`);
        }

        const txtRecords = await dns.resolveTxt(clusterHost).catch(() => []);
        const queryParams = new URLSearchParams(parsedUri.searchParams);

        txtRecords
            .flat()
            .join('&')
            .split('&')
            .filter(Boolean)
            .forEach((entry) => {
                const [rawKey, rawValue = ''] = entry.split('=');
                const key = rawKey.trim();

                if (key && !queryParams.has(key)) {
                    queryParams.set(key, rawValue.trim());
                }
            });

        if (!queryParams.has('tls') && !queryParams.has('ssl')) {
            queryParams.set('tls', 'true');
        }

        const authSegment = parsedUri.username
            ? `${encodeURIComponent(parsedUri.username)}:${encodeURIComponent(parsedUri.password)}@`
            : '';
        const hosts = srvRecords
            .map((record) => `${record.name}:${record.port}`)
            .join(',');
        const databasePath = parsedUri.pathname && parsedUri.pathname !== '/'
            ? parsedUri.pathname
            : `/${config.DATABASE_NAME}`;

        return `mongodb://${authSegment}${hosts}${databasePath}?${queryParams.toString()}`;
    };

    const buildConnectionCandidates = async (uri, useLocal) => {
        if (useLocal || !uri.startsWith('mongodb+srv://')) {
            return [uri];
        }

        const candidates = [uri];

        try {
            candidates.push(await buildAtlasDirectUri(uri));
        } catch (error) {
            console.warn('Unable to prepare Atlas direct-host fallback:', error.message);
        }

        return candidates;
    };

    const getMongoClient = async (useLocal = !process.env.MONGODB_URI) => {
        if (db) {
            return mongoClient;
        }

        if (!connectionPromise) {
            const uri = useLocal
                ? `${config.LOCAL_URI}/${config.DATABASE_NAME}`
                : config.REMOTE_URI;
            const clientOptions = {
                serverApi: {
                    version: '1',
                    strict: true,
                    deprecationErrors: true
                },
                serverSelectionTimeoutMS: 5000
            };

            connectionPromise = buildConnectionCandidates(uri, useLocal)
                .then(async (connectionUris) => {
                    let lastError = null;

                    for (let index = 0; index < connectionUris.length; index += 1) {
                        const candidateUri = connectionUris[index];
                        mongoClient = new MongoClient(candidateUri, clientOptions);

                        try {
                            await mongoClient.connect();
                            db = mongoClient.db(config.DATABASE_NAME);

                            if (index > 0) {
                                console.log('Connected to MongoDB using Atlas direct-host fallback');
                            } else {
                                console.log('Connected to MongoDB successfully');
                            }

                            return mongoClient;
                        } catch (error) {
                            lastError = error;
                            console.error('MongoDB connection error:', error);
                            await mongoClient.close().catch(() => {});
                            mongoClient = null;
                            db = null;
                        }
                    }

                    throw lastError;
                })
                .finally(() => {
                    connectionPromise = null;
                });
        }

        return connectionPromise;
    };

    const getDatabase = async () => {
        if (!db) {
            await getMongoClient();
        }
        return db;
    };

    const getCollection = async (collectionName) => {
        const database = await getDatabase();
        return database.collection(collectionName);
    };

    const find = async (collectionName, query = {}, options = {}) => {
        try {
            const collection = await getCollection(collectionName);
            const { limit = 0, skip = 0, sort = {} } = options;

            let cursor = collection.find(query);

            if (skip > 0) cursor = cursor.skip(skip);
            if (limit > 0) cursor = cursor.limit(limit);
            if (Object.keys(sort).length > 0) cursor = cursor.sort(sort);

            return await cursor.toArray();
        } catch (error) {
            console.error(`Error finding documents in ${collectionName}:`, error);
            throw error;
        }
    };

    const findById = async (collectionName, id) => {
        try {
            const collection = await getCollection(collectionName);
            return await collection.findOne({ _id: new ObjectId(id) });
        } catch (error) {
            console.error(`Error finding document by ID in ${collectionName}:`, error);
            throw error;
        }
    };

    const findOne = async (collectionName, query = {}) => {
        try {
            const collection = await getCollection(collectionName);
            return await collection.findOne(query);
        } catch (error) {
            console.error(`Error finding document in ${collectionName}:`, error);
            throw error;
        }
    };

    const insertOne = async (collectionName, document) => {
        try {
            const collection = await getCollection(collectionName);
            const result = await collection.insertOne(document);
            console.log(`Document inserted in ${collectionName} with ID:`, result.insertedId);
            return result;
        } catch (error) {
            console.error(`Error inserting document in ${collectionName}:`, error);
            throw error;
        }
    };

    const insertMany = async (collectionName, documents) => {
        try {
            const collection = await getCollection(collectionName);
            const result = await collection.insertMany(documents);
            console.log(`${result.insertedCount} documents inserted in ${collectionName}`);
            return result;
        } catch (error) {
            console.error(`Error inserting documents in ${collectionName}:`, error);
            throw error;
        }
    };

    const updateOne = async (collectionName, query, update = {}) => {
        try {
            const collection = await getCollection(collectionName);
            const updateDocument = usesMongoOperators(update) ? update : { $set: update };
            const result = await collection.updateOne(query, updateDocument);
            console.log(`${result.modifiedCount} document updated in ${collectionName}`);
            return result;
        } catch (error) {
            console.error(`Error updating document in ${collectionName}:`, error);
            throw error;
        }
    };

    const updateById = async (collectionName, id, update) => {
        try {
            return await updateOne(collectionName, { _id: new ObjectId(id) }, update);
        } catch (error) {
            console.error(`Error updating document by ID in ${collectionName}:`, error);
            throw error;
        }
    };

    const deleteOne = async (collectionName, query) => {
        try {
            const collection = await getCollection(collectionName);
            const result = await collection.deleteOne(query);
            console.log(`${result.deletedCount} document deleted from ${collectionName}`);
            return result;
        } catch (error) {
            console.error(`Error deleting document from ${collectionName}:`, error);
            throw error;
        }
    };

    const deleteById = async (collectionName, id) => {
        try {
            return await deleteOne(collectionName, { _id: new ObjectId(id) });
        } catch (error) {
            console.error(`Error deleting document by ID from ${collectionName}:`, error);
            throw error;
        }
    };

    const deleteMany = async (collectionName, query) => {
        try {
            const collection = await getCollection(collectionName);
            const result = await collection.deleteMany(query);
            console.log(`${result.deletedCount} documents deleted from ${collectionName}`);
            return result;
        } catch (error) {
            console.error(`Error deleting documents from ${collectionName}:`, error);
            throw error;
        }
    };

    const count = async (collectionName, query = {}) => {
        try {
            const collection = await getCollection(collectionName);
            return await collection.countDocuments(query);
        } catch (error) {
            console.error(`Error counting documents in ${collectionName}:`, error);
            throw error;
        }
    };

    const closeConnection = async () => {
        if (mongoClient) {
            await mongoClient.close();
            mongoClient = null;
            db = null;
            console.log('MongoDB connection closed');
        }
    };

    return {
        getMongoClient,
        getDatabase,
        getCollection,
        find,
        findById,
        findOne,
        insertOne,
        insertMany,
        updateOne,
        updateById,
        deleteOne,
        deleteById,
        deleteMany,
        count,
        closeConnection
    };
})();

module.exports = MongoModel;
