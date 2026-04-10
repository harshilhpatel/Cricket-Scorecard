
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

if (typeof process.loadEnvFile === 'function' && fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
}

const Config = (() => {
    let instance = null;

    function createConfig() {
        const dbConfig = {
            LOCAL_URI: 'mongodb://127.0.0.1:27017',
            DATABASE_NAME: 'cricket_scorecard',
            
            REMOTE_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cricket_scorecard',
            
            COLLECTIONS: {
                USERS: 'users',
                MATCHES: 'matches',
                TEAMS: 'teams',
                LOGS: 'logs',
                SCORES: 'scores'
            }
        };

        const sessionConfig = {
            SESSION_SECRET: process.env.SESSION_SECRET || 'cricket_scorecard_secret_key_2026'
        };

        const apiConfig = {
            CRICKET_API_KEY: process.env.CRICKET_API_KEY || '',
            CRICKET_API_BASE_URL: 'https://api.cricapi.com/v1',
            
            FREE_CRICKET_API: 'https://cricket-live-data.p.rapidapi.com'
        };

        const roles = {
            ADMIN: 'admin',
            MEMBER: 'member',
            GUEST: 'guest'
        };

        const appConfig = {
            APP_NAME: 'Cricket Easy Scorecard',
            APP_VERSION: '1.0.0',
            ITEMS_PER_PAGE: 10,
            MAX_LOGIN_ATTEMPTS: 5
        };

        return {
            ...dbConfig,
            ...sessionConfig,
            ...apiConfig,
            ROLES: roles,
            APP: appConfig
        };
    }

    return {
        getInstance: () => {
            if (!instance) {
                instance = createConfig();
            }
            return instance;
        }
    };
})();

module.exports = Config.getInstance();
