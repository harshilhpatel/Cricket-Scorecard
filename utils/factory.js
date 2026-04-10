
const UserFactory = (() => {
    const createUser = (data) => {
        return {
            username: data.username || '',
            email: data.email || '',
            password: data.password || '',
            fullName: data.fullName || '',
            role: data.role || 'guest',
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            lastLogin: null,
            loginAttempts: 0
        };
    };

    const createAdmin = (data) => {
        return {
            ...createUser(data),
            role: 'admin',
            permissions: ['all']
        };
    };

    const createMember = (data) => {
        return {
            ...createUser(data),
            role: 'member',
            permissions: ['read', 'write']
        };
    };

    const createGuest = (data) => {
        return {
            ...createUser(data),
            role: 'guest',
            permissions: ['read']
        };
    };

    return {
        createUser,
        createAdmin,
        createMember,
        createGuest
    };
})();

const MatchFactory = (() => {
    const createMatch = (data) => {
        return {
            title: data.title || 'Untitled Match',
            team1: {
                name: data.team1?.name || 'Team A',
                players: data.team1?.players || [],
                score: data.team1?.score || 0,
                wickets: data.team1?.wickets || 0,
                overs: data.team1?.overs || 0
            },
            team2: {
                name: data.team2?.name || 'Team B',
                players: data.team2?.players || [],
                score: data.team2?.score || 0,
                wickets: data.team2?.wickets || 0,
                overs: data.team2?.overs || 0
            },
            matchType: data.matchType || 'T20',
            venue: data.venue || '',
            date: data.date ? new Date(data.date) : new Date(),
            status: data.status || 'upcoming',
            tossWinner: data.tossWinner || null,
            tossDecision: data.tossDecision || null,
            currentInnings: data.currentInnings || 1,
            createdBy: data.createdBy || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            ballByBall: data.ballByBall || []
        };
    };

    const createT20Match = (data) => {
        return {
            ...createMatch(data),
            matchType: 'T20',
            totalOvers: 20
        };
    };

    const createODIMatch = (data) => {
        return {
            ...createMatch(data),
            matchType: 'ODI',
            totalOvers: 50
        };
    };

    const createTestMatch = (data) => {
        return {
            ...createMatch(data),
            matchType: 'Test',
            totalOvers: null,
            maxDays: 5
        };
    };

    return {
        createMatch,
        createT20Match,
        createODIMatch,
        createTestMatch
    };
})();

const TeamFactory = (() => {
    const createTeam = (data) => {
        return {
            name: data.name || 'Unknown Team',
            shortName: data.shortName || '',
            country: data.country || '',
            logo: data.logo || '',
            players: data.players || [],
            captain: data.captain || null,
            coach: data.coach || '',
            homeGround: data.homeGround || '',
            founded: data.founded || null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    };

    const createInternationalTeam = (data) => {
        return {
            ...createTeam(data),
            teamType: 'international',
            ranking: data.ranking || null
        };
    };

    const createDomesticTeam = (data) => {
        return {
            ...createTeam(data),
            teamType: 'domestic',
            league: data.league || ''
        };
    };

    const createFranchiseTeam = (data) => {
        return {
            ...createTeam(data),
            teamType: 'franchise',
            franchise: data.franchise || '',
            league: data.league || ''
        };
    };

    return {
        createTeam,
        createInternationalTeam,
        createDomesticTeam,
        createFranchiseTeam
    };
})();

const ScoreFactory = (() => {
    const createBall = (data) => {
        return {
            over: data.over || 0,
            ball: data.ball || 0,
            batsman: data.batsman || '',
            bowler: data.bowler || '',
            runs: data.runs || 0,
            isWicket: data.isWicket || false,
            wicketType: data.wicketType || null,
            extras: {
                wide: data.extras?.wide || false,
                noBall: data.extras?.noBall || false,
                bye: data.extras?.bye || 0,
                legBye: data.extras?.legBye || 0
            },
            timestamp: new Date()
        };
    };

    const createInnings = (data) => {
        return {
            inningsNumber: data.inningsNumber || 1,
            battingTeam: data.battingTeam || '',
            bowlingTeam: data.bowlingTeam || '',
            totalRuns: data.totalRuns || 0,
            totalWickets: data.totalWickets || 0,
            totalOvers: data.totalOvers || 0,
            runRate: data.runRate || 0,
            batsmen: data.batsmen || [],
            bowlers: data.bowlers || [],
            fallOfWickets: data.fallOfWickets || [],
            balls: data.balls || []
        };
    };

    const createBatsmanStats = (data) => {
        return {
            name: data.name || '',
            runs: data.runs || 0,
            balls: data.balls || 0,
            fours: data.fours || 0,
            sixes: data.sixes || 0,
            strikeRate: data.strikeRate || 0,
            isOut: data.isOut || false,
            dismissal: data.dismissal || null
        };
    };

    const createBowlerStats = (data) => {
        return {
            name: data.name || '',
            overs: data.overs || 0,
            maidens: data.maidens || 0,
            runs: data.runs || 0,
            wickets: data.wickets || 0,
            economy: data.economy || 0,
            wides: data.wides || 0,
            noBalls: data.noBalls || 0
        };
    };

    return {
        createBall,
        createInnings,
        createBatsmanStats,
        createBowlerStats
    };
})();

const LogFactory = (() => {
    const createRequestLog = (data) => {
        return {
            timestamp: new Date(),
            method: data.method || 'GET',
            url: data.url || '',
            ip: data.ip || '',
            userAgent: data.userAgent || '',
            userId: data.userId || null,
            username: data.username || 'anonymous',
            role: data.role || 'guest',
            requestBody: data.requestBody || null,
            responseStatus: data.responseStatus || 200,
            responseTime: data.responseTime || 0
        };
    };

    const createAuthLog = (data) => {
        return {
            timestamp: new Date(),
            eventType: data.eventType || 'login',
            username: data.username || '',
            userId: data.userId || null,
            ip: data.ip || '',
            userAgent: data.userAgent || '',
            success: data.success || false,
            message: data.message || ''
        };
    };

    return {
        createRequestLog,
        createAuthLog
    };
})();

const Factory = {
    create: (type, data) => {
        switch (type.toLowerCase()) {
            case 'user':
                return UserFactory.createUser(data);
            case 'admin':
                return UserFactory.createAdmin(data);
            case 'member':
                return UserFactory.createMember(data);
            case 'guest':
                return UserFactory.createGuest(data);
            case 'match':
                return MatchFactory.createMatch(data);
            case 't20':
                return MatchFactory.createT20Match(data);
            case 'odi':
                return MatchFactory.createODIMatch(data);
            case 'test':
                return MatchFactory.createTestMatch(data);
            case 'team':
                return TeamFactory.createTeam(data);
            case 'internationalteam':
                return TeamFactory.createInternationalTeam(data);
            case 'domesticteam':
                return TeamFactory.createDomesticTeam(data);
            case 'franchiseteam':
                return TeamFactory.createFranchiseTeam(data);
            case 'ball':
                return ScoreFactory.createBall(data);
            case 'innings':
                return ScoreFactory.createInnings(data);
            case 'batsman':
                return ScoreFactory.createBatsmanStats(data);
            case 'bowler':
                return ScoreFactory.createBowlerStats(data);
            case 'requestlog':
                return LogFactory.createRequestLog(data);
            case 'authlog':
                return LogFactory.createAuthLog(data);
            default:
                throw new Error(`Unknown factory type: ${type}`);
        }
    },
    
    User: UserFactory,
    Match: MatchFactory,
    Team: TeamFactory,
    Score: ScoreFactory,
    Log: LogFactory
};

module.exports = Factory;
