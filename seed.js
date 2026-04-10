/**
 * Database Seed Script
 * Initializes the database with sample data
 * Run: node seed.js
 */

const bcrypt = require('bcryptjs');
const mongoUtil = require('./utils/mongoUtil');
const Factory = require('./utils/factory');
const config = require('./config/config');

const SALT_ROUNDS = 10;

async function seedDatabase() {
    console.log('========================================');
    console.log('  Cricket Scorecard - Database Seeder');
    console.log('========================================\n');

    try {
        // Initialize database connection
        await mongoUtil.getDatabase();
        console.log('Connected to MongoDB\n');

        // Clear existing data
        console.log('Clearing existing data...');
        await mongoUtil.deleteMany(config.COLLECTIONS.USERS, {});
        await mongoUtil.deleteMany(config.COLLECTIONS.MATCHES, {});
        await mongoUtil.deleteMany(config.COLLECTIONS.TEAMS, {});
        await mongoUtil.deleteMany(config.COLLECTIONS.LOGS, {});
        console.log('Existing data cleared\n');

        // ============================================
        // Create Users
        // ============================================
        console.log('Creating users...');

        // Admin user
        const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
        const admin = Factory.User.createAdmin({
            username: 'admin',
            email: 'admin@cricketscorecard.com',
            password: adminPassword,
            fullName: 'Administrator'
        });
        const adminResult = await mongoUtil.insertOne(config.COLLECTIONS.USERS, admin);
        console.log('  - Admin user created: admin/admin123');

        // Member user
        const memberPassword = await bcrypt.hash('member123', SALT_ROUNDS);
        const member = Factory.User.createMember({
            username: 'member',
            email: 'member@cricketscorecard.com',
            password: memberPassword,
            fullName: 'John Member'
        });
        const memberResult = await mongoUtil.insertOne(config.COLLECTIONS.USERS, member);
        console.log('  - Member user created: member/member123');

        // Additional users
        const users = [
            { username: 'alice', email: 'alice@example.com', fullName: 'Alice Smith', role: 'member' },
            { username: 'bob', email: 'bob@example.com', fullName: 'Bob Johnson', role: 'member' },
            { username: 'charlie', email: 'charlie@example.com', fullName: 'Charlie Brown', role: 'member' }
        ];

        for (const userData of users) {
            const password = await bcrypt.hash(userData.username + '123', SALT_ROUNDS);
            const user = Factory.User.createUser({
                ...userData,
                password
            });
            await mongoUtil.insertOne(config.COLLECTIONS.USERS, user);
            console.log(`  - User created: ${userData.username}/${userData.username}123`);
        }
        console.log('');

        // ============================================
        // Create Teams
        // ============================================
        console.log('Creating teams...');

        const teams = [
            { name: 'India', shortName: 'IND', country: 'India', homeGround: 'Wankhede Stadium, Mumbai' },
            { name: 'Australia', shortName: 'AUS', country: 'Australia', homeGround: 'Melbourne Cricket Ground' },
            { name: 'England', shortName: 'ENG', country: 'England', homeGround: 'Lord\'s, London' },
            { name: 'Pakistan', shortName: 'PAK', country: 'Pakistan', homeGround: 'National Stadium, Karachi' },
            { name: 'South Africa', shortName: 'SA', country: 'South Africa', homeGround: 'Newlands, Cape Town' },
            { name: 'New Zealand', shortName: 'NZ', country: 'New Zealand', homeGround: 'Eden Park, Auckland' },
            { name: 'Sri Lanka', shortName: 'SL', country: 'Sri Lanka', homeGround: 'R. Premadasa Stadium, Colombo' },
            { name: 'West Indies', shortName: 'WI', country: 'West Indies', homeGround: 'Kensington Oval, Barbados' },
            { name: 'Bangladesh', shortName: 'BAN', country: 'Bangladesh', homeGround: 'Sher-e-Bangla Stadium, Dhaka' },
            { name: 'Afghanistan', shortName: 'AFG', country: 'Afghanistan', homeGround: 'Sharjah Cricket Stadium' }
        ];

        const teamIds = {};
        for (const teamData of teams) {
            const team = Factory.Team.createInternationalTeam(teamData);
            const result = await mongoUtil.insertOne(config.COLLECTIONS.TEAMS, team);
            teamIds[teamData.name] = result.insertedId;
            console.log(`  - Team created: ${teamData.name}`);
        }
        console.log('');

        // ============================================
        // Create Matches
        // ============================================
        console.log('Creating matches...');

        const now = new Date();

        // Live match
        const liveMatch = Factory.Match.createT20Match({
            title: 'India vs Australia - 1st T20I',
            team1: { name: 'India', score: 145, wickets: 3, overs: 15.2 },
            team2: { name: 'Australia', score: 0, wickets: 0, overs: 0 },
            venue: 'Melbourne Cricket Ground',
            date: now,
            status: 'live',
            tossWinner: 'India',
            tossDecision: 'bat',
            createdBy: adminResult.insertedId.toString()
        });
        await mongoUtil.insertOne(config.COLLECTIONS.MATCHES, liveMatch);
        console.log('  - Live match created: India vs Australia');

        // Completed match
        const completedMatch = Factory.Match.createODIMatch({
            title: 'England vs New Zealand - 2nd ODI',
            team1: { name: 'England', score: 285, wickets: 8, overs: 50 },
            team2: { name: 'New Zealand', score: 245, wickets: 10, overs: 47.3 },
            venue: 'Lord\'s, London',
            date: new Date(now - 86400000), // Yesterday
            status: 'completed',
            tossWinner: 'England',
            tossDecision: 'bat',
            createdBy: adminResult.insertedId.toString()
        });
        await mongoUtil.insertOne(config.COLLECTIONS.MATCHES, completedMatch);
        console.log('  - Completed match created: England vs New Zealand');

        // Upcoming matches
        const upcomingMatches = [
            {
                title: 'Pakistan vs South Africa - 1st Test',
                team1: { name: 'Pakistan' },
                team2: { name: 'South Africa' },
                matchType: 'Test',
                venue: 'National Stadium, Karachi',
                date: new Date(now + 172800000), // 2 days from now
                status: 'upcoming',
                createdBy: memberResult.insertedId.toString()
            },
            {
                title: 'Sri Lanka vs Bangladesh - 3rd T20I',
                team1: { name: 'Sri Lanka', score: 178, wickets: 6, overs: 20 },
                team2: { name: 'Bangladesh', score: 165, wickets: 9, overs: 20 },
                matchType: 'T20',
                venue: 'R. Premadasa Stadium, Colombo',
                date: new Date(now - 172800000), // 2 days ago
                status: 'completed',
                tossWinner: 'Sri Lanka',
                tossDecision: 'bat',
                createdBy: adminResult.insertedId.toString()
            },
            {
                title: 'West Indies vs Ireland - 1st ODI',
                team1: { name: 'Ireland', score: 220, wickets: 10, overs: 48.5 },
                team2: { name: 'West Indies', score: 125, wickets: 4, overs: 25.3 },
                matchType: 'ODI',
                venue: 'Kensington Oval, Bridgetown',
                date: now,
                status: 'live',
                tossWinner: 'Ireland',
                tossDecision: 'bat',
                createdBy: memberResult.insertedId.toString()
            },
            {
                title: 'India vs England - 3rd Test',
                team1: { name: 'India' },
                team2: { name: 'England' },
                matchType: 'Test',
                venue: 'Wankhede Stadium, Mumbai',
                date: new Date(now + 604800000), // 1 week from now
                status: 'upcoming',
                createdBy: adminResult.insertedId.toString()
            },
            {
                title: 'Australia vs New Zealand - T20 Series',
                team1: { name: 'Australia', score: 195, wickets: 5, overs: 20 },
                team2: { name: 'New Zealand', score: 180, wickets: 8, overs: 20 },
                matchType: 'T20',
                venue: 'Sydney Cricket Ground',
                date: new Date(now - 345600000), // 4 days ago
                status: 'completed',
                tossWinner: 'New Zealand',
                tossDecision: 'field',
                createdBy: memberResult.insertedId.toString()
            }
        ];

        for (const matchData of upcomingMatches) {
            let match;
            switch (matchData.matchType) {
                case 'T20':
                    match = Factory.Match.createT20Match(matchData);
                    break;
                case 'ODI':
                    match = Factory.Match.createODIMatch(matchData);
                    break;
                case 'Test':
                    match = Factory.Match.createTestMatch(matchData);
                    break;
                default:
                    match = Factory.Match.createMatch(matchData);
            }
            await mongoUtil.insertOne(config.COLLECTIONS.MATCHES, match);
            console.log(`  - Match created: ${matchData.title}`);
        }
        console.log('');

        // ============================================
        // Create Sample Logs
        // ============================================
        console.log('Creating sample logs...');

        const sampleLogs = [
            {
                method: 'POST',
                url: '/login',
                ip: '127.0.0.1',
                userAgent: 'Mozilla/5.0',
                userId: adminResult.insertedId.toString(),
                username: 'admin',
                role: 'admin',
                responseStatus: 302,
                responseTime: 150
            },
            {
                method: 'GET',
                url: '/admin',
                ip: '127.0.0.1',
                userAgent: 'Mozilla/5.0',
                userId: adminResult.insertedId.toString(),
                username: 'admin',
                role: 'admin',
                responseStatus: 200,
                responseTime: 80
            },
            {
                method: 'GET',
                url: '/matches',
                ip: '192.168.1.100',
                userAgent: 'Mozilla/5.0',
                userId: null,
                username: 'anonymous',
                role: 'guest',
                responseStatus: 200,
                responseTime: 120
            }
        ];

        for (const logData of sampleLogs) {
            const log = Factory.Log.createRequestLog(logData);
            log.timestamp = new Date(now - Math.random() * 86400000);
            await mongoUtil.insertOne(config.COLLECTIONS.LOGS, log);
        }
        console.log('  - Sample logs created');
        console.log('');

        console.log('========================================');
        console.log('  Database seeded successfully!');
        console.log('========================================');
        console.log('\nDemo Credentials:');
        console.log('  Admin:  admin / admin123');
        console.log('  Member: member / member123');
        console.log('  Users:  alice/alice123, bob/bob123, charlie/charlie123');
        console.log('\nYou can now start the server with:');
        console.log('  npm start');
        console.log('');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        // Close database connection
        await mongoUtil.closeConnection();
        process.exit(0);
    }
}

// Run seeder
seedDatabase();
