export interface GameStats {
    wins: number;
    losses: number;
    totalRounds: number;
    shotsFired: number;
    shotsHit: number;
    selfShots: number;
    damageDealt: number;
    itemsUsed: number;
    mostUsedItem: string;
    highestRound: number;
    itemPoints: number; // Calculated score based on effective item use
    matchHistory: MatchStats[];
}

export interface MatchStats {
    result: 'WIN' | 'LOSS';
    roundsSurvived: number;
    shotsFired: number;
    shotsHit: number;
    selfShots: number;
    itemsUsed: Record<string, number>;
    damageDealt: number;
    damageTaken: number;
    totalScore: number;
    timestamp?: number;
    isHardMode?: boolean;
    roundResults?: string[]; // e.g. ['WIN', 'LOSS', 'WIN']
}

const STORAGE_KEY = 'aadish_roulette_stats_v1';

export const getStoredStats = (): GameStats => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Storage migration: ensure matchHistory exists
            if (!parsed.matchHistory) parsed.matchHistory = [];
            if (parsed.shotsHit === undefined) parsed.shotsHit = 0;
            return parsed;
        }
    } catch (e) {
        console.error("Failed to load stats", e);
    }
    return {
        wins: 0,
        losses: 0,
        totalRounds: 0,
        shotsFired: 0,
        shotsHit: 0,
        selfShots: 0,
        damageDealt: 0,
        itemsUsed: 0,
        mostUsedItem: 'NONE',
        highestRound: 0,
        itemPoints: 0,
        matchHistory: []
    };
};

export const calculateMatchScore = (stats: MatchStats): number => {
    if (stats.result === 'LOSS') return 0;

    let score = 0;

    // Base Score
    score += 1000;
    score += stats.roundsSurvived * 100;

    // Performance
    score += stats.damageDealt * 50;
    score += stats.shotsHit * 20;

    // Item Points
    Object.values(stats.itemsUsed).forEach(count => {
        score += count * 15;
    });

    // Penalty for mistakes
    score -= stats.selfShots * 50;

    score = Math.max(0, Math.floor(score));

    // Hard Mode Multiplier
    if (stats.isHardMode) {
        score *= 2;
    }

    return score;
};

export const saveGameStats = (matchStats: MatchStats) => {
    const current = getStoredStats();

    // Update Totals
    if (matchStats.result === 'WIN') current.wins++;
    else current.losses++;

    current.totalRounds += matchStats.roundsSurvived;
    current.shotsFired += matchStats.shotsFired;
    current.shotsHit = (current.shotsHit || 0) + matchStats.shotsHit;
    current.selfShots += matchStats.selfShots;
    current.damageDealt += matchStats.damageDealt;

    // Update Item Stats
    let totalItemsMatch = 0;
    Object.entries(matchStats.itemsUsed).forEach(([item, count]) => {
        totalItemsMatch += count;
    });
    current.itemsUsed += totalItemsMatch;

    current.highestRound = Math.max(current.highestRound, matchStats.roundsSurvived);
    current.itemPoints += totalItemsMatch * 15;

    // Add History
    if (!current.matchHistory) current.matchHistory = [];
    const historyEntry = {
        ...matchStats,
        totalScore: calculateMatchScore(matchStats), // Ensure score is set with multiplier
        timestamp: Date.now()
    };
    current.matchHistory.unshift(historyEntry);
    // Keep last 20 games
    if (current.matchHistory.length > 20) current.matchHistory.pop();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return current;
};
