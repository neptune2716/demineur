/**
 * Statistics Module
 * Manages game statistics, tracking progress and achievements
 */

// Default statistics structure
const DEFAULT_STATS = {
    games: {
        played: 0,
        won: 0,
        lost: 0
    },
    bestTimes: {
        easy: null,
        medium: null,
        hard: null,
        custom: {}  // Will store best times for custom configurations as "rows_columns_mines"
    },
    personalBests: {
        easy: {
            quickestWin: null,
            mostRevealed: null,
            leastMoves: null
        },
        medium: {
            quickestWin: null,
            mostRevealed: null,
            leastMoves: null
        },
        hard: {
            quickestWin: null,
            mostRevealed: null,
            leastMoves: null
        },
        custom: {}
    },
    gameHistory: {
        easy: [],    // Array of { date: ISO string, time: seconds, result: 'won'|'lost' }
        medium: [],
        hard: [],
        custom: {}   // Object with keys like "10_10_10" (rows_cols_mines) containing arrays of game records
    },
    streaks: {
        current: 0,
        best: 0,
        lastPlayed: null,
        dailyStreak: 0, // Number of consecutive days played
        lastDayPlayed: null // To track which day was last played (YYYY-MM-DD)
    },
    zenProgress: {
        bestOneGo: null,       // Highest level reached without respawning in a single run
        bestWithRespawns: null, // Highest level reached, allowing respawns
        currentRun: {          // Tracks the state of the current ongoing run
            level: 1,
            usedRespawns: false
        }
    },
    achievements: {
        // Win-based achievements
        firstWin: false,
        tenWins: false,
        fiftyWins: false,
        hundredWins: false,
        
        // Perfection achievements  
        perfectEasy: false,      // Win without flagging any wrong cells
        perfectMedium: false,
        perfectHard: false,
        
        // Speed achievements
        speedRunnerEasy: false,  // Win under a time threshold
        speedRunnerMedium: false,
        speedRunnerHard: false,
        
        // Streak achievements
        weekStreak: false,       // Play for 7 consecutive days
        monthStreak: false,      // Play for 30 consecutive days
        
        // Milestone achievements
        hundredGames: false,     // Play 100 games
        thousandGames: false,    // Play 1000 games
        fiftyPercentWinRate: false, // Achieve 50% win rate after 20+ games
        seventyFivePercentWinRate: false, // Achieve 75% win rate after 20+ games
        
        // Mastery achievements
        easyMaster: false,      // Win easy difficulty 20 times
        mediumMaster: false,    // Win medium difficulty 15 times
        hardMaster: false       // Win hard difficulty 10 times
    },
    difficultyStats: {
        easy: {
            played: 0,
            won: 0
        },
        medium: {
            played: 0,
            won: 0
        },
        hard: {
            played: 0,
            won: 0
        },
        custom: {
            played: 0,
            won: 0
        },
        zen: {
            played: 0,
            highestLevelOneGo: 0,
            highestLevelRespawns: 0
        }
    }
};

// Speed thresholds for speedRunner achievements (in seconds)
const SPEED_THRESHOLDS = {
    easy: 30,
    medium: 120,
    hard: 300
};

// Cache for current statistics
let currentStats = null;

/**
 * Load statistics from localStorage
 * @returns {Object} The current statistics
 */
export function loadStatistics() {
    if (currentStats) return currentStats;
    
    const savedStats = localStorage.getItem('gameStatistics');
    if (savedStats) {
        try {
            currentStats = JSON.parse(savedStats);
            // Update any missing fields (in case we add new stats fields later)
            currentStats = { ...DEFAULT_STATS, ...currentStats };
        } catch (error) {
            console.error('Error parsing saved statistics:', error);
            currentStats = { ...DEFAULT_STATS };
        }
    } else {
        currentStats = { ...DEFAULT_STATS };
    }
    return currentStats;
}

/**
 * Save statistics to localStorage
 */
export function saveStatistics() {
    if (!currentStats) return;
    localStorage.setItem('gameStatistics', JSON.stringify(currentStats));
}

/**
 * Update statistics after a game ends
 * @param {boolean} isWin - Whether the player won the game
 * @param {number} value - Time taken in seconds (normal modes) OR Level reached (Zen mode loss)
 * @param {string} difficulty - Game difficulty: 'easy', 'medium', 'hard', 'custom', or 'zen'
 * @param {Object} gameConfig - Configuration for custom games { rows, columns, mines }
 * @param {Object} gameStats - Additional game statistics { moves, cellsRevealed, wrongFlags }
 * @returns {Object} Updated achievement information
 */
export function recordGameResult(isWin, value, difficulty, gameConfig = null, gameStats = {}) {
    const stats = loadStatistics();
    const newAchievements = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // --- Handle Zen Mode Specific Logic ---
    if (difficulty === 'zen') {
        if (!isWin) { // Only record loss for Zen mode best levels
            const levelLost = value; // 'value' is the level lost in Zen mode
            
            // Update Best Level (One Go)
            if (!stats.zenProgress.currentRun.usedRespawns) {
                if (stats.zenProgress.bestOneGo === null || levelLost > stats.zenProgress.bestOneGo) {
                    stats.zenProgress.bestOneGo = levelLost;
                }
            }
            
            // Update Best Level (With Respawns)
            if (stats.zenProgress.bestWithRespawns === null || levelLost > stats.zenProgress.bestWithRespawns) {
                stats.zenProgress.bestWithRespawns = levelLost;
            }
            
            // Update difficulty-specific stats for Zen
            if (stats.difficultyStats.zen) {
                stats.difficultyStats.zen.played++; // Increment plays on loss
                stats.difficultyStats.zen.highestLevelOneGo = stats.zenProgress.bestOneGo;
                stats.difficultyStats.zen.highestLevelRespawns = stats.zenProgress.bestWithRespawns;
            }

            // Reset current run state after a loss is recorded
            resetZenRunInternal(stats);
        }
    } else {
        // --- Handle Normal Mode Logic ---
        const time = value; // 'value' is time in normal modes
        
        // Update general game counts
        stats.games.played++;
        
        // Update difficulty-specific stats
        if (stats.difficultyStats[difficulty]) {
            stats.difficultyStats[difficulty].played++;
            if (isWin) {
                stats.difficultyStats[difficulty].won++;
            }
        }
        
        if (isWin) {
            stats.games.won++;
            // Increment win streak on a win
            stats.streaks.current++;
            
            // Update best times
            if (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard') {
                if (stats.bestTimes[difficulty] === null || time < stats.bestTimes[difficulty]) {
                    stats.bestTimes[difficulty] = time;
                    // Check for speed achievements
                    if (time <= SPEED_THRESHOLDS[difficulty] && !stats.achievements[`speedRunner${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`]) {
                        stats.achievements[`speedRunner${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`] = true;
                        newAchievements.push(`speedRunner${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`);
                    }
                }
            } else if (difficulty === 'custom' && gameConfig) {
                const configKey = `${gameConfig.rows}_${gameConfig.columns}_${gameConfig.mines}`;
                if (!stats.bestTimes.custom[configKey] || time < stats.bestTimes.custom[configKey].time) {
                    stats.bestTimes.custom[configKey] = { time: time, date: now.toISOString(), speedrun: gameStats.speedrunMode, safe: gameStats.safeMode };
                }
            }
            
            // Check for perfection achievements
            if (gameStats.wrongFlags === 0 && (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard')) {
                if (!stats.achievements[`perfect${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`]) {
                    stats.achievements[`perfect${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`] = true;
                    newAchievements.push(`perfect${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`);
                }
            }

        } else {
            stats.games.lost++;
            // Reset win streak on a loss
            stats.streaks.current = 0;
        }
    }
    
    // --- Update Streaks and Achievements (Common Logic) ---
    
    // Update best win streak
    if (stats.streaks.current > stats.streaks.best) {
        stats.streaks.best = stats.streaks.current;
    }
    
    // Update daily play streak
    if (!stats.streaks.lastDayPlayed || stats.streaks.lastDayPlayed !== today) {
        if (stats.streaks.lastDayPlayed) {
            const lastDay = new Date(stats.streaks.lastDayPlayed);
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayDate = yesterday.toISOString().split('T')[0];
            
            if (stats.streaks.lastDayPlayed === yesterdayDate) {
                stats.streaks.dailyStreak++;
            } else {
                stats.streaks.dailyStreak = 1; // Reset if not consecutive
            }
        } else {
            stats.streaks.dailyStreak = 1; // First day played
        }
        stats.streaks.lastDayPlayed = today; // Update last day played
    }
    
    stats.streaks.lastPlayed = now.toISOString();
    
    // Check win-based achievements
    if (isWin && difficulty !== 'zen') { // Only count normal mode wins for these
        if (!stats.achievements.firstWin) { stats.achievements.firstWin = true; newAchievements.push('firstWin'); }
        if (stats.games.won >= 10 && !stats.achievements.tenWins) { stats.achievements.tenWins = true; newAchievements.push('tenWins'); }
        if (stats.games.won >= 50 && !stats.achievements.fiftyWins) { stats.achievements.fiftyWins = true; newAchievements.push('fiftyWins'); }
        if (stats.games.won >= 100 && !stats.achievements.hundredWins) { stats.achievements.hundredWins = true; newAchievements.push('hundredWins'); }
        
        // Check mastery achievements
        if (difficulty === 'easy' && stats.difficultyStats.easy.won >= 20 && !stats.achievements.easyMaster) { stats.achievements.easyMaster = true; newAchievements.push('easyMaster'); }
        if (difficulty === 'medium' && stats.difficultyStats.medium.won >= 15 && !stats.achievements.mediumMaster) { stats.achievements.mediumMaster = true; newAchievements.push('mediumMaster'); }
        if (difficulty === 'hard' && stats.difficultyStats.hard.won >= 10 && !stats.achievements.hardMaster) { stats.achievements.hardMaster = true; newAchievements.push('hardMaster'); }
    }
    
    // Check milestone achievements (apply to all modes including Zen losses)
    if (stats.games.played >= 100 && !stats.achievements.hundredGames) { stats.achievements.hundredGames = true; newAchievements.push('hundredGames'); }
    if (stats.games.played >= 1000 && !stats.achievements.thousandGames) { stats.achievements.thousandGames = true; newAchievements.push('thousandGames'); }
    
    // Check win rate achievements (only for normal modes)
    if (stats.games.played >= 20 && difficulty !== 'zen') {
        const winRate = (stats.games.won / stats.games.played) * 100;
        if (winRate >= 50 && !stats.achievements.fiftyPercentWinRate) { stats.achievements.fiftyPercentWinRate = true; newAchievements.push('fiftyPercentWinRate'); }
        if (winRate >= 75 && !stats.achievements.seventyFivePercentWinRate) { stats.achievements.seventyFivePercentWinRate = true; newAchievements.push('seventyFivePercentWinRate'); }
    }
    
    // Check daily streak achievements
    if (stats.streaks.dailyStreak >= 7 && !stats.achievements.weekStreak) { stats.achievements.weekStreak = true; newAchievements.push('weekStreak'); }
    if (stats.streaks.dailyStreak >= 30 && !stats.achievements.monthStreak) { stats.achievements.monthStreak = true; newAchievements.push('monthStreak'); }
    
    saveStatistics();
    
    // Return information about newly unlocked achievements
    return { newAchievements };
}

/**
 * Calculate win rate
 * @returns {number} Win rate as a percentage
 */
export function getWinRate() {
    const stats = loadStatistics();
    if (stats.games.played === 0) return 0;
    return Math.round((stats.games.won / stats.games.played) * 100);
}

/**
 * Get all unlocked achievements
 * @returns {Array} Array of achievement names
 */
export function getUnlockedAchievements() {
    const stats = loadStatistics();
    const unlocked = [];
    
    for (const [key, value] of Object.entries(stats.achievements)) {
        if (value === true) {
            // Format the achievement name for display
            let name = key.replace(/([A-Z])/g, ' $1').trim(); // Add spaces before capital letters
            name = name.charAt(0).toUpperCase() + name.slice(1); // Capitalize first letter
            unlocked.push(name);
        }
    }
    
    return unlocked;
}

/**
 * Get best time for a specific difficulty
 * @param {string} difficulty - 'easy', 'medium', 'hard'
 * @param {Object} customConfig - For custom games: { rows, columns, mines }
 * @returns {number|null} Best time in seconds or null if no best time
 */
export function getBestTime(difficulty, customConfig = null) {
    const stats = loadStatistics();
    
    if (difficulty === 'custom' && customConfig) {
        const customKey = `${customConfig.rows}_${customConfig.columns}_${customConfig.mines}`;
        return stats.bestTimes.custom[customKey] || null;
    } else {
        return stats.bestTimes[difficulty] || null;
    }
}

/**
 * Reset all statistics (mainly for testing or user preference)
 */
export function resetStatistics() {
    currentStats = { ...DEFAULT_STATS };
    saveStatistics();
    return currentStats;
}

/**
 * Get formatted streak information
 * @returns {Object} Streak information
 */
export function getStreakInfo() {
    const stats = loadStatistics();
    return {
        current: stats.streaks.current,
        best: stats.streaks.best,
        lastPlayed: stats.streaks.lastPlayed ? new Date(stats.streaks.lastPlayed).toLocaleDateString() : 'Never'
    };
}

/**
 * Marks that a respawn was used in the current Zen run.
 */
export function markZenRespawUsed() {
    const stats = loadStatistics();
    if (stats.zenProgress.currentRun) {
        stats.zenProgress.currentRun.usedRespawns = true;
        saveStatistics();
    }
}

/**
 * Resets the current Zen run state (e.g., when starting fresh or quitting).
 */
export function resetZenRun() {
    const stats = loadStatistics();
    resetZenRunInternal(stats);
    saveStatistics();
}

// Internal helper to reset zen run state without saving immediately
function resetZenRunInternal(stats) {
    if (stats.zenProgress.currentRun) {
        stats.zenProgress.currentRun = {
            level: 1,
            usedRespawns: false
        };
    }
}

/**
 * Get Zen Mode progress
 * @returns {Object} { bestOneGo: number | null, bestWithRespawns: number | null }
 */
export function getZenProgress() {
    const stats = loadStatistics();
    return {
        bestOneGo: stats.zenProgress.bestOneGo,
        bestWithRespawns: stats.zenProgress.bestWithRespawns
    };
}
