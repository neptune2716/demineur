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
 * @param {number} time - Time taken in seconds
 * @param {string} difficulty - Game difficulty: 'easy', 'medium', 'hard', or 'custom'
 * @param {Object} gameConfig - Configuration for custom games { rows, columns, mines }
 * @param {Object} gameStats - Additional game statistics { moves, cellsRevealed, wrongFlags }
 * @returns {Object} Updated achievement information
 */
export function recordGameResult(isWin, time, difficulty, gameConfig = null, gameStats = {}) {
    const stats = loadStatistics();
    const newAchievements = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
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
    } else {
        stats.games.lost++;
        // Reset win streak on a loss
        stats.streaks.current = 0;
    }
      
    // Update daily play streak (separate from win streak)
    if (stats.streaks.lastPlayed) {
        const lastPlayed = new Date(stats.streaks.lastPlayed);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Check if played on consecutive days (for daily streak achievement)
        const lastPlayedDate = lastPlayed.toISOString().split('T')[0];
        const yesterdayDate = yesterday.toISOString().split('T')[0];
        
        // Only reset daily streak if not consecutive days
        if (!(lastPlayedDate === yesterdayDate || lastPlayedDate === today)) {
            stats.streaks.dailyStreak = 1;
        }
    } else {
        stats.streaks.current = 1; // First time playing
    }
    
    // Update daily streaks for regular players
    if (!stats.streaks.lastDayPlayed || stats.streaks.lastDayPlayed !== today) {
        // Only update daily streak if it's a new day
        if (stats.streaks.lastDayPlayed) {
            const lastDay = new Date(stats.streaks.lastDayPlayed);
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayDate = yesterday.toISOString().split('T')[0];
            
            if (stats.streaks.lastDayPlayed === yesterdayDate) {
                // Played yesterday, continue streak
                stats.streaks.dailyStreak++;
            } else {
                // Didn't play yesterday, reset streak
                stats.streaks.dailyStreak = 1;
            }
        } else {
            stats.streaks.dailyStreak = 1; // First day playing
        }
        
        // Update the last day played
        stats.streaks.lastDayPlayed = today;
    }
    
    // Update best streak
    if (stats.streaks.current > stats.streaks.best) {
        stats.streaks.best = stats.streaks.current;
    }
      // Update last played date
    stats.streaks.lastPlayed = now.toISOString();
      // Record this game in history (only if it's a win)
    if (isWin) {
        const gameRecord = {
            date: now.toISOString(),
            time: time
        };
        
        // Save to appropriate history section
        if (difficulty === 'custom' && gameConfig) {
            const customKey = `${gameConfig.rows}_${gameConfig.columns}_${gameConfig.mines}`;
            if (!stats.gameHistory.custom[customKey]) {
                stats.gameHistory.custom[customKey] = [];
            }
            stats.gameHistory.custom[customKey].push(gameRecord);
        } else if (stats.gameHistory[difficulty]) {
            stats.gameHistory[difficulty].push(gameRecord);
        }
    }
    
    // Only record times and check achievements for wins
    if (isWin) {
        // Update best times
        if (difficulty === 'custom' && gameConfig) {
            const customKey = `${gameConfig.rows}_${gameConfig.columns}_${gameConfig.mines}`;
            // Ensure the custom objects exist
            if (!stats.bestTimes.custom) {
                stats.bestTimes.custom = {};
            }
            if (!stats.personalBests.custom[customKey]) {
                stats.personalBests.custom[customKey] = {
                    quickestWin: null,
                    mostRevealed: null,
                    leastMoves: null
                };
            }
            
            // Update best time for custom game
            if (!stats.bestTimes.custom[customKey] || time < stats.bestTimes.custom[customKey]) {
                stats.bestTimes.custom[customKey] = time;
                console.log(`New best time for custom game: ${time}s`);
            }
            
            // Update personal bests for custom game
            if (!stats.personalBests.custom[customKey].quickestWin || time < stats.personalBests.custom[customKey].quickestWin) {
                stats.personalBests.custom[customKey].quickestWin = time;
                newAchievements.push(`New personal best time for custom game: ${time}s`);
            }
            
            if (gameStats.cellsRevealed && (!stats.personalBests.custom[customKey].mostRevealed || 
                gameStats.cellsRevealed > stats.personalBests.custom[customKey].mostRevealed)) {
                stats.personalBests.custom[customKey].mostRevealed = gameStats.cellsRevealed;
            }
            
            if (gameStats.moves && (!stats.personalBests.custom[customKey].leastMoves || 
                gameStats.moves < stats.personalBests.custom[customKey].leastMoves)) {
                stats.personalBests.custom[customKey].leastMoves = gameStats.moves;
            }
            
        } else if (difficulty in stats.bestTimes) {
            // Update best time for standard difficulty
            if (!stats.bestTimes[difficulty] || time < stats.bestTimes[difficulty]) {
                stats.bestTimes[difficulty] = time;
                console.log(`New best time for ${difficulty}: ${time}s`);
                newAchievements.push(`New best time for ${difficulty}: ${time}s`);
            }
            
            // Update personal bests for standard difficulty
            if (!stats.personalBests[difficulty].quickestWin || time < stats.personalBests[difficulty].quickestWin) {
                stats.personalBests[difficulty].quickestWin = time;
            }
            
            if (gameStats.cellsRevealed && (!stats.personalBests[difficulty].mostRevealed || 
                gameStats.cellsRevealed > stats.personalBests[difficulty].mostRevealed)) {
                stats.personalBests[difficulty].mostRevealed = gameStats.cellsRevealed;
            }
            
            if (gameStats.moves && (!stats.personalBests[difficulty].leastMoves || 
                gameStats.moves < stats.personalBests[difficulty].leastMoves)) {
                stats.personalBests[difficulty].leastMoves = gameStats.moves;
            }
        }
        
        // Check win-based achievements
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
        
        // Check difficulty mastery achievements
        if (difficulty === 'easy' && stats.difficultyStats.easy.won >= 20 && !stats.achievements.easyMaster) {
            stats.achievements.easyMaster = true;
            newAchievements.push('Easy Master');
        }
        
        if (difficulty === 'medium' && stats.difficultyStats.medium.won >= 15 && !stats.achievements.mediumMaster) {
            stats.achievements.mediumMaster = true;
            newAchievements.push('Medium Master');
        }
        
        if (difficulty === 'hard' && stats.difficultyStats.hard.won >= 10 && !stats.achievements.hardMaster) {
            stats.achievements.hardMaster = true;
            newAchievements.push('Hard Master');
        }
        
        // Check perfect game achievements (no wrong flags)
        if (gameStats.wrongFlags === 0) {
            const perfectKey = `perfect${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;
            if (difficulty !== 'custom' && !stats.achievements[perfectKey]) {
                stats.achievements[perfectKey] = true;
                newAchievements.push(`Perfect Game (${difficulty})`);
            }
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
    if (stats.streaks.dailyStreak >= 7 && !stats.achievements.weekStreak) {
        stats.achievements.weekStreak = true;
        newAchievements.push('Week Streak');
    }
    
    if (stats.streaks.dailyStreak >= 30 && !stats.achievements.monthStreak) {
        stats.achievements.monthStreak = true;
        newAchievements.push('Month Streak');
    }
    
    // Check milestone achievements
    if (stats.games.played >= 100 && !stats.achievements.hundredGames) {
        stats.achievements.hundredGames = true;
        newAchievements.push('100 Games Played');
    }
    
    if (stats.games.played >= 1000 && !stats.achievements.thousandGames) {
        stats.achievements.thousandGames = true;
        newAchievements.push('1000 Games Played');
    }
    
    // Check win rate achievements (only if played enough games)
    if (stats.games.played >= 20) {
        const winRate = (stats.games.won / stats.games.played) * 100;
        
        if (winRate >= 50 && !stats.achievements.fiftyPercentWinRate) {
            stats.achievements.fiftyPercentWinRate = true;
            newAchievements.push('50% Win Rate');
        }
        
        if (winRate >= 75 && !stats.achievements.seventyFivePercentWinRate) {
            stats.achievements.seventyFivePercentWinRate = true;
            newAchievements.push('75% Win Rate');
        }
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
