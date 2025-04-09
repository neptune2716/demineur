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
    streaks: {
        current: 0,
        best: 0,
        lastPlayed: null
    },
    achievements: {
        firstWin: false,
        tenWins: false,
        fiftyWins: false,
        hundredWins: false,
        perfectEasy: false,  // Win without flagging any wrong cells
        perfectMedium: false,
        perfectHard: false,
        speedRunnerEasy: false,  // Win under a time threshold
        speedRunnerMedium: false,
        speedRunnerHard: false,
        weekStreak: false,  // Play for 7 consecutive days
        monthStreak: false  // Play for 30 consecutive days
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
 * @param {number} time - Time taken in seconds
 * @param {string} difficulty - Game difficulty: 'easy', 'medium', 'hard', or 'custom'
 * @param {Object} gameConfig - Configuration for custom games { rows, columns, mines }
 * @returns {Object} Updated achievement information
 */
export function recordGameResult(isWin, time, difficulty, gameConfig = null) {
    const stats = loadStatistics();
    const newAchievements = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Update general game counts
    stats.games.played++;
    if (isWin) {
        stats.games.won++;
    } else {
        stats.games.lost++;
    }
    
    // Update streaks
    if (stats.streaks.lastPlayed) {
        const lastPlayed = new Date(stats.streaks.lastPlayed);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Check if played on consecutive days
        const lastPlayedDate = lastPlayed.toISOString().split('T')[0];
        const yesterdayDate = yesterday.toISOString().split('T')[0];
        
        if (lastPlayedDate === yesterdayDate || lastPlayedDate === today) {
            stats.streaks.current++;
        } else {
            stats.streaks.current = 1; // Reset streak, but count today
        }
    } else {
        stats.streaks.current = 1; // First time playing
    }
    
    // Update best streak
    if (stats.streaks.current > stats.streaks.best) {
        stats.streaks.best = stats.streaks.current;
    }
    
    // Update last played date
    stats.streaks.lastPlayed = now.toISOString();
    
    // Only record times and check achievements for wins
    if (isWin) {
    // Update best times
        if (difficulty === 'custom' && gameConfig) {
            const customKey = `${gameConfig.rows}_${gameConfig.columns}_${gameConfig.mines}`;
            // Ensure the custom object exists
            if (!stats.bestTimes.custom) {
                stats.bestTimes.custom = {};
            }
            if (!stats.bestTimes.custom[customKey] || time < stats.bestTimes.custom[customKey]) {
                stats.bestTimes.custom[customKey] = time;
                console.log(`New best time for custom game: ${time}s`);
            }
        } else if (difficulty in stats.bestTimes) {
            if (!stats.bestTimes[difficulty] || time < stats.bestTimes[difficulty]) {
                stats.bestTimes[difficulty] = time;
                console.log(`New best time for ${difficulty}: ${time}s`);
            }
        }
        
        // Check achievements
        if (!stats.achievements.firstWin) {
            stats.achievements.firstWin = true;
            newAchievements.push('First Win');
        }
        
        if (stats.games.won >= 10 && !stats.achievements.tenWins) {
            stats.achievements.tenWins = true;
            newAchievements.push('Ten Wins');
        }
        
        if (stats.games.won >= 50 && !stats.achievements.fiftyWins) {
            stats.achievements.fiftyWins = true;
            newAchievements.push('Fifty Wins');
        }
        
        if (stats.games.won >= 100 && !stats.achievements.hundredWins) {
            stats.achievements.hundredWins = true;
            newAchievements.push('Hundred Wins');
        }
        
        // Check speed achievements
        if (difficulty in SPEED_THRESHOLDS && time <= SPEED_THRESHOLDS[difficulty]) {
            const achievementKey = `speedRunner${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;
            if (!stats.achievements[achievementKey]) {
                stats.achievements[achievementKey] = true;
                newAchievements.push(`Speed Runner (${difficulty})`);
            }
        }
    }
    
    // Check streak achievements
    if (stats.streaks.current >= 7 && !stats.achievements.weekStreak) {
        stats.achievements.weekStreak = true;
        newAchievements.push('Week Streak');
    }
    
    if (stats.streaks.current >= 30 && !stats.achievements.monthStreak) {
        stats.achievements.monthStreak = true;
        newAchievements.push('Month Streak');
    }
    
    // Save updated stats
    currentStats = stats;
    saveStatistics();
    
    return {
        newAchievements,
        stats
    };
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
