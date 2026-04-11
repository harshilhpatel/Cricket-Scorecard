
const MatchModel = require('../models/matchModel');
const config = require('../config/config');

const GUEST_DASHBOARD_LIMITS = Object.freeze({
    live: 1,
    upcoming: 2,
    recent: 2
});

const isAuthenticatedRequest = (req) => {
    return !!req.session?.user;
};

const getProtectedApiError = () => ({
    success: false,
    error: 'Please log in or sign up to access full match information'
});

const parsePositiveInt = (value, fallback) => {
    const parsed = parseInt(value, 10);

    if (Number.isNaN(parsed) || parsed < 1) {
        return fallback;
    }

    return parsed;
};

const getDashboardLimit = (value, authenticatedDefault, guestCap, isGuest) => {
    const fallback = isGuest ? guestCap : authenticatedDefault;
    const parsed = parsePositiveInt(value, fallback);

    if (isGuest) {
        return Math.min(parsed, guestCap);
    }

    return parsed;
};

const getUnavailableScoreDisplay = (status = 'upcoming') => {
    if (status === 'upcoming') {
        return 'Yet to bat';
    }

    if (status === 'completed') {
        return 'Result only';
    }

    return 'Score unavailable';
};


const getMatches = async (req, res) => {
    try {
        if (!isAuthenticatedRequest(req)) {
            return res.status(401).json(getProtectedApiError());
        }

        const { status, type, limit = 20, skip = 0 } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (type) query.matchType = type;
        
        const matches = await MatchModel.list(query, {
            limit: parseInt(limit),
            skip: parseInt(skip),
            sort: { date: -1 }
        });

        const total = await MatchModel.count(query);
        
        res.json({
            success: true,
            data: matches,
            meta: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip)
            }
        });
    } catch (error) {
        console.error('API Error - getMatches:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch matches'
        });
    }
};

const getMatchById = async (req, res) => {
    try {
        if (!isAuthenticatedRequest(req)) {
            return res.status(401).json(getProtectedApiError());
        }

        const { id } = req.params;
        
        const match = await MatchModel.findById(id);
        
        if (!match) {
            return res.status(404).json({
                success: false,
                error: 'Match not found'
            });
        }
        
        res.json({
            success: true,
            data: match
        });
    } catch (error) {
        console.error('API Error - getMatchById:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch match'
        });
    }
};

const createMatch = async (req, res) => {
    try {
        const matchData = req.body;
        
        if (!matchData.title || !matchData.team1?.name || !matchData.team2?.name) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        
        matchData.createdBy = req.session.user.id;
        
        const { result, match: newMatch } = await MatchModel.create(matchData);
        
        res.status(201).json({
            success: true,
            data: {
                id: result.insertedId,
                ...newMatch
            },
            message: 'Match created successfully'
        });
    } catch (error) {
        console.error('API Error - createMatch:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create match'
        });
    }
};

const updateMatch = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const existingMatch = await MatchModel.findById(id);
        
        if (!existingMatch) {
            return res.status(404).json({
                success: false,
                error: 'Match not found'
            });
        }
        
        updateData.updatedAt = new Date();
        
        await MatchModel.updateById(id, updateData);
        
        const updatedMatch = await MatchModel.findById(id);
        
        res.json({
            success: true,
            data: updatedMatch,
            message: 'Match updated successfully'
        });
    } catch (error) {
        console.error('API Error - updateMatch:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update match'
        });
    }
};

const deleteMatch = async (req, res) => {
    try {
        const { id } = req.params;
        
        const existingMatch = await MatchModel.findById(id);
        
        if (!existingMatch) {
            return res.status(404).json({
                success: false,
                error: 'Match not found'
            });
        }
        
        await MatchModel.deleteById(id);
        
        res.json({
            success: true,
            message: 'Match deleted successfully'
        });
    } catch (error) {
        console.error('API Error - deleteMatch:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete match'
        });
    }
};


const EXTERNAL_API_CACHE_MS = 60 * 1000;
const externalApiCache = new Map();

const normalizeMatchType = (matchType = '', title = '') => {
    const normalizedType = String(matchType || '').trim();

    if (normalizedType) {
        return normalizedType.toUpperCase();
    }

    if (/test/i.test(title)) return 'TEST';
    if (/odi/i.test(title)) return 'ODI';
    if (/t20/i.test(title)) return 'T20';

    return 'MATCH';
};

const parseTeamLabel = (label = '') => {
    const trimmedLabel = String(label || '').trim();
    const match = trimmedLabel.match(/^(.*?)(?:\s*\[([^\]]+)\])?$/);

    return {
        name: match?.[1]?.trim() || trimmedLabel || 'TBD',
        shortName: match?.[2]?.trim() || ''
    };
};

const inferScoreFeedStatus = (match) => {
    if (match.ms === 'live') return 'live';
    if (match.ms === 'result') return 'completed';
    if (match.ms === 'fixture') return 'upcoming';

    const statusText = String(match.status || '').toLowerCase();

    if (statusText.includes('starts at')) return 'upcoming';
    if (
        statusText.includes('won') ||
        statusText.includes('result') ||
        statusText.includes('draw') ||
        statusText.includes('tie') ||
        statusText.includes('abandoned')
    ) {
        return 'completed';
    }

    return 'live';
};

const inferMatchInfoStatus = (match) => {
    if (match.matchStarted && !match.matchEnded) return 'live';
    if (match.matchEnded) return 'completed';

    return inferScoreFeedStatus(match);
};

const getDateValue = (dateString) => {
    const parsedDate = Date.parse(dateString || '');
    return Number.isNaN(parsedDate) ? 0 : parsedDate;
};

const formatLocalScoreDisplay = (team = {}, status = 'upcoming') => {
    if (team.score === undefined || team.score === null) {
        return getUnavailableScoreDisplay(status);
    }

    let scoreText = `${team.score}`;

    if (team.wickets !== undefined && team.wickets !== null) {
        scoreText += `/${team.wickets}`;
    }

    if (team.overs !== undefined && team.overs !== null && team.overs !== '') {
        scoreText += ` (${team.overs})`;
    }

    return scoreText;
};

const formatScoreEntry = (scoreEntry) => {
    if (!scoreEntry || scoreEntry.r === undefined || scoreEntry.r === null) {
        return '';
    }

    let scoreText = `${scoreEntry.r}`;

    if (scoreEntry.w !== undefined && scoreEntry.w !== null) {
        scoreText += `/${scoreEntry.w}`;
    }

    if (scoreEntry.o !== undefined && scoreEntry.o !== null && scoreEntry.o !== '') {
        scoreText += ` (${scoreEntry.o})`;
    }

    return scoreText;
};

const normalizeText = (value = '') =>
    String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

const buildScoreMap = (match) => {
    const teams = Array.isArray(match.teams) ? match.teams.slice(0, 2) : [];
    const scoreMap = new Map(teams.map(teamName => [teamName, []]));
    const fallbackEntries = [];

    (match.score || []).forEach(scoreEntry => {
        const inningsText = normalizeText(scoreEntry.inning || '');
        let selectedTeam = null;
        let bestIndex = Number.POSITIVE_INFINITY;

        teams.forEach(teamName => {
            const teamToken = normalizeText(teamName);
            const matchIndex = inningsText.indexOf(teamToken);

            if (matchIndex !== -1 && matchIndex < bestIndex) {
                selectedTeam = teamName;
                bestIndex = matchIndex;
            }
        });

        if (selectedTeam) {
            scoreMap.get(selectedTeam).push(scoreEntry);
        } else {
            fallbackEntries.push(scoreEntry);
        }
    });

    fallbackEntries.forEach(scoreEntry => {
        const [team1, team2] = teams;
        const firstTeamScores = scoreMap.get(team1)?.length || 0;
        const secondTeamScores = scoreMap.get(team2)?.length || 0;
        const selectedTeam = firstTeamScores <= secondTeamScores ? team1 : team2;

        if (selectedTeam) {
            scoreMap.get(selectedTeam).push(scoreEntry);
        }
    });

    return scoreMap;
};

const buildMatchInfoTeam = (match, teamName, scoreEntries = []) => {
    const teamInfo = (match.teamInfo || []).find(team => team.name === teamName) || {};
    const latestScore = scoreEntries[scoreEntries.length - 1] || null;

    return {
        name: teamName || teamInfo.name || 'TBD',
        shortName: teamInfo.shortname || '',
        img: teamInfo.img || '',
        score: latestScore?.r ?? null,
        wickets: latestScore?.w ?? null,
        overs: latestScore?.o ?? null,
        scoreDisplay: scoreEntries.length
            ? scoreEntries.map(formatScoreEntry).filter(Boolean).join(' | ')
            : ''
    };
};

const normalizeMatchInfo = (match) => {
    const teams = Array.isArray(match.teams)
        ? match.teams.slice(0, 2)
        : (match.teamInfo || []).map(team => team.name).slice(0, 2);
    const [team1Name = 'Team 1', team2Name = 'Team 2'] = teams;
    const scoreMap = buildScoreMap(match);
    const status = inferMatchInfoStatus(match);

    return {
        id: match.id,
        title: match.name || `${team1Name} vs ${team2Name}`,
        name: match.name || `${team1Name} vs ${team2Name}`,
        matchType: normalizeMatchType(match.matchType, match.name),
        status,
        statusLabel: status.toUpperCase(),
        statusText: match.status || '',
        venue: match.venue || 'Venue not available',
        date: match.dateTimeGMT || match.date || null,
        tossWinner: match.tossWinner || '',
        tossDecision: match.tossChoice || match.tossDecision || '',
        result: match.matchWinner || '',
        source: 'external',
        team1: buildMatchInfoTeam(match, team1Name, scoreMap.get(team1Name) || []),
        team2: buildMatchInfoTeam(match, team2Name, scoreMap.get(team2Name) || [])
    };
};

const normalizeScoreFeedMatch = (match) => {
    const team1 = parseTeamLabel(match.t1);
    const team2 = parseTeamLabel(match.t2);
    const status = inferScoreFeedStatus(match);

    return {
        id: match.id,
        title: `${team1.name} vs ${team2.name}`,
        name: `${team1.name} vs ${team2.name}`,
        matchType: normalizeMatchType(match.matchType, match.series),
        status,
        statusLabel: status.toUpperCase(),
        statusText: match.status || '',
        venue: match.series || 'Venue details available on match page',
        series: match.series || '',
        date: match.dateTimeGMT || null,
        tossWinner: '',
        tossDecision: '',
        result: status === 'completed' ? match.status || '' : '',
        source: 'external',
        detailUrl: `/pages/match-details.html?id=${match.id}&source=external`,
        team1: {
            name: team1.name,
            shortName: team1.shortName,
            img: match.t1img || '',
            score: null,
            wickets: null,
            overs: null,
            scoreDisplay: match.t1s || getUnavailableScoreDisplay(status)
        },
        team2: {
            name: team2.name,
            shortName: team2.shortName,
            img: match.t2img || '',
            score: null,
            wickets: null,
            overs: null,
            scoreDisplay: match.t2s || getUnavailableScoreDisplay(status)
        }
    };
};

const normalizeLocalMatch = (match) => {
    const id = match._id?.toString?.() || match.id || '';
    const status = match.status || 'upcoming';
    const team1Name = match.team1?.name || 'Team 1';
    const team2Name = match.team2?.name || 'Team 2';

    return {
        id,
        title: match.title || `${team1Name} vs ${team2Name}`,
        name: match.title || `${team1Name} vs ${team2Name}`,
        matchType: normalizeMatchType(match.matchType, match.title),
        status,
        statusLabel: status.toUpperCase(),
        statusText: status.charAt(0).toUpperCase() + status.slice(1),
        venue: match.venue || 'Venue not available',
        series: 'Local Match',
        date: match.date || null,
        tossWinner: match.tossWinner || '',
        tossDecision: match.tossDecision || '',
        result: match.result || '',
        source: 'local',
        detailUrl: `/pages/match-details.html?id=${encodeURIComponent(id)}&source=local`,
        team1: {
            name: team1Name,
            shortName: '',
            img: '',
            score: match.team1?.score ?? null,
            wickets: match.team1?.wickets ?? null,
            overs: match.team1?.overs ?? null,
            scoreDisplay: formatLocalScoreDisplay(match.team1, status)
        },
        team2: {
            name: team2Name,
            shortName: '',
            img: '',
            score: match.team2?.score ?? null,
            wickets: match.team2?.wickets ?? null,
            overs: match.team2?.overs ?? null,
            scoreDisplay: formatLocalScoreDisplay(match.team2, status)
        }
    };
};

const mergeExternalMatch = (scoreFeedMatch, matchInfoMatch, id) => {
    const baseMatch = matchInfoMatch || scoreFeedMatch;
    const status = matchInfoMatch?.status || scoreFeedMatch?.status || 'upcoming';

    return {
        id,
        title: matchInfoMatch?.title || scoreFeedMatch?.title || 'Match Details',
        name: matchInfoMatch?.name || scoreFeedMatch?.name || 'Match Details',
        matchType: matchInfoMatch?.matchType || scoreFeedMatch?.matchType || 'MATCH',
        status,
        statusLabel: status.toUpperCase(),
        statusText: matchInfoMatch?.statusText || scoreFeedMatch?.statusText || '',
        venue: matchInfoMatch?.venue || scoreFeedMatch?.venue || 'Venue not available',
        series: scoreFeedMatch?.series || '',
        date: matchInfoMatch?.date || scoreFeedMatch?.date || null,
        tossWinner: matchInfoMatch?.tossWinner || '',
        tossDecision: matchInfoMatch?.tossDecision || '',
        result: matchInfoMatch?.result || scoreFeedMatch?.result || '',
        source: 'external',
        detailUrl: `/pages/match-details.html?id=${id}&source=external`,
        team1: {
            ...(scoreFeedMatch?.team1 || {}),
            ...(matchInfoMatch?.team1 || {}),
            name: matchInfoMatch?.team1?.name || scoreFeedMatch?.team1?.name || 'Team 1',
            shortName: matchInfoMatch?.team1?.shortName || scoreFeedMatch?.team1?.shortName || '',
            img: matchInfoMatch?.team1?.img || scoreFeedMatch?.team1?.img || '',
            scoreDisplay:
                scoreFeedMatch?.team1?.scoreDisplay ||
                matchInfoMatch?.team1?.scoreDisplay ||
                getUnavailableScoreDisplay(status)
        },
        team2: {
            ...(scoreFeedMatch?.team2 || {}),
            ...(matchInfoMatch?.team2 || {}),
            name: matchInfoMatch?.team2?.name || scoreFeedMatch?.team2?.name || 'Team 2',
            shortName: matchInfoMatch?.team2?.shortName || scoreFeedMatch?.team2?.shortName || '',
            img: matchInfoMatch?.team2?.img || scoreFeedMatch?.team2?.img || '',
            scoreDisplay:
                scoreFeedMatch?.team2?.scoreDisplay ||
                matchInfoMatch?.team2?.scoreDisplay ||
                getUnavailableScoreDisplay(status)
        }
    };
};

const sortExternalMatches = (matches, statusFilter = '') => {
    const sortedMatches = [...matches];

    sortedMatches.sort((matchA, matchB) => {
        const firstDate = getDateValue(matchA.date);
        const secondDate = getDateValue(matchB.date);

        if (statusFilter === 'upcoming') {
            return firstDate - secondDate;
        }

        if (statusFilter === 'completed') {
            return secondDate - firstDate;
        }

        if (statusFilter === 'live') {
            return secondDate - firstDate;
        }

        const statusOrder = {
            live: 0,
            upcoming: 1,
            completed: 2
        };

        if (statusOrder[matchA.status] !== statusOrder[matchB.status]) {
            return statusOrder[matchA.status] - statusOrder[matchB.status];
        }

        if (matchA.status === 'upcoming') {
            return firstDate - secondDate;
        }

        return secondDate - firstDate;
    });

    return sortedMatches;
};

const filterExternalMatches = (matches, { status = '', type = '' } = {}) =>
    matches.filter(match => {
        const statusMatches = !status || match.status === status;
        const typeMatches = !type || match.matchType.toUpperCase() === String(type).toUpperCase();

        return statusMatches && typeMatches;
    });

const fetchCricApi = async (endpoint, params = {}) => {
    const searchParams = new URLSearchParams({
        apikey: config.CRICKET_API_KEY,
        ...params
    });
    const cacheKey = `${endpoint}?${searchParams.toString()}`;
    const cachedEntry = externalApiCache.get(cacheKey);

    if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
        return cachedEntry.data;
    }

    const requestUrl = `${config.CRICKET_API_BASE_URL}/${endpoint}?${searchParams.toString()}`;
    let lastError = null;

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const response = await fetch(requestUrl);

            if (!response.ok) {
                throw new Error(`External API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.status && data.status !== 'success') {
                throw new Error(data.message || 'External API returned an unsuccessful status');
            }

            externalApiCache.set(cacheKey, {
                data,
                expiresAt: Date.now() + EXTERNAL_API_CACHE_MS
            });

            return data;
        } catch (error) {
            lastError = error;

            if (attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
            }
        }
    }

    throw lastError;
};

const getScoreFeedMatches = async () => {
    const response = await fetchCricApi('cricScore');
    const matches = Array.isArray(response.data) ? response.data.map(normalizeScoreFeedMatch) : [];

    return sortExternalMatches(matches);
};

const getExternalCricketData = async (req, res) => {
    try {
        const { endpoint = 'dashboard', id, status = '', type = '' } = req.query;
        const isGuest = !isAuthenticatedRequest(req);
        const protectedEndpoints = new Set(['matches', 'match', 'series']);

        if (!config.CRICKET_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'CRICKET_API_KEY is not configured'
            });
        }

        if (protectedEndpoints.has(endpoint) && isGuest) {
            return res.status(401).json(getProtectedApiError());
        }

        switch (endpoint) {
            case 'dashboard': {
                const matches = await getScoreFeedMatches();
                const liveMatches = sortExternalMatches(
                    matches.filter(match => match.status === 'live'),
                    'live'
                );
                const upcomingMatches = sortExternalMatches(
                    matches.filter(match => match.status === 'upcoming'),
                    'upcoming'
                );
                const completedMatches = sortExternalMatches(
                    matches.filter(match => match.status === 'completed'),
                    'completed'
                );

                return res.json({
                    success: true,
                    data: {
                        live: liveMatches.slice(0, getDashboardLimit(req.query.liveLimit, 6, GUEST_DASHBOARD_LIMITS.live, isGuest)),
                        upcoming: upcomingMatches.slice(0, getDashboardLimit(req.query.upcomingLimit, 6, GUEST_DASHBOARD_LIMITS.upcoming, isGuest)),
                        recent: completedMatches.slice(0, getDashboardLimit(req.query.recentLimit, 6, GUEST_DASHBOARD_LIMITS.recent, isGuest)),
                        stats: {
                            total: matches.length,
                            live: liveMatches.length,
                            upcoming: upcomingMatches.length,
                            completed: completedMatches.length
                        }
                    },
                    source: 'external'
                });
            }
            case 'matches':
            {
                const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
                const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
                const skip = Math.max(parseInt(req.query.skip, 10) || (page - 1) * limit, 0);
                const localQuery = {};

                if (status) localQuery.status = status;
                if (type) localQuery.matchType = type;

                const [externalMatches, localMatches] = await Promise.all([
                    getScoreFeedMatches(),
                    MatchModel.list(localQuery, { sort: { date: -1 } })
                ]);
                const filteredMatches = sortExternalMatches(
                    [
                        ...filterExternalMatches(externalMatches, { status, type }),
                        ...localMatches.map(normalizeLocalMatch)
                    ],
                    status
                );

                return res.json({
                    success: true,
                    data: filteredMatches.slice(skip, skip + limit),
                    meta: {
                        total: filteredMatches.length,
                        limit,
                        skip,
                        page
                    },
                    source: 'external'
                });
            }
            case 'match': {
                if (!id) {
                    return res.status(400).json({
                        success: false,
                        error: 'Match ID is required'
                    });
                }

                const [scoreFeedMatches, matchInfoResponse] = await Promise.all([
                    getScoreFeedMatches(),
                    fetchCricApi('match_info', { id })
                ]);
                const scoreFeedMatch = scoreFeedMatches.find(match => match.id === id) || null;
                const matchInfoMatch = matchInfoResponse.data ? normalizeMatchInfo(matchInfoResponse.data) : null;

                if (!scoreFeedMatch && !matchInfoMatch) {
                    return res.status(404).json({
                        success: false,
                        error: 'Match not found'
                    });
                }

                return res.json({
                    success: true,
                    data: mergeExternalMatch(scoreFeedMatch, matchInfoMatch, id),
                    source: 'external'
                });
            }
            case 'series': {
                const data = await fetchCricApi('series', { offset: req.query.offset || 0 });

                return res.json({
                    success: true,
                    data,
                    source: 'external'
                });
            }
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Unsupported external endpoint'
                });
        }
    } catch (error) {
        console.error('External API Error:', error);

        res.status(502).json({
            success: false,
            error: 'Failed to fetch external cricket data'
        });
    }
};

module.exports = {
    getMatches,
    getMatchById,
    createMatch,
    updateMatch,
    deleteMatch,
    getExternalCricketData
};
