/**
 * Statistics UI Module
 * Handles displaying game statistics in the UI
 */

import * as Statistics from './statistics.js';
import * as Audio from './audio.js';

// Cache for DOM elements
let statisticsModal = null;
let achievementsList = null;

/**
 * Initialize the statistics UI
 */
export function initStatisticsUI() {
    // Cache DOM elements
    statisticsModal = document.getElementById('statistics-modal');
    achievementsList = document.getElementById('achievements-list');
    
    // Add event listeners for statistics-related buttons
    document.getElementById('view-stats').addEventListener('click', () => {
        Audio.playSound('click-sound');
        showStatisticsModal();
    });
    
    // Add event listener for the menu statistics button if it exists
    const viewStatsMenu = document.getElementById('view-stats-menu');
    if (viewStatsMenu) {
        viewStatsMenu.addEventListener('click', () => {
            Audio.playSound('click-sound');
            document.getElementById('menu-modal').style.display = 'none'; // Hide menu first
            showStatisticsModal();
        });
    }
    
    document.getElementById('statistics-close').addEventListener('click', () => {
        Audio.playSound('click-sound');
        hideStatisticsModal();
    });
    
    document.getElementById('close-statistics').addEventListener('click', () => {
        Audio.playSound('click-sound');
        hideStatisticsModal();
    });
    
    // Reset statistics button
    document.getElementById('reset-statistics').addEventListener('click', () => {
        Audio.playSound('click-sound');
        if (confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
            // Import UI and Statistics modules dynamically to avoid circular dependencies
            import('./statistics.js').then(Statistics => {
                Statistics.resetStatistics();
                updateStatisticsDisplay();
                  // Update the main page stats
                import('./ui.js').then(UI => {
                    UI.updateMainPageStats();
                });
                
                // Replace alert with custom notification
                import('./notification.js').then(Notification => {
                    Notification.showSuccess('Statistics have been reset successfully.');
                });
            });
        }
    });
    
    // Close modal when clicking outside
    statisticsModal.addEventListener('click', (event) => {
        if (event.target === statisticsModal) {
            Audio.playSound('click-sound');
            hideStatisticsModal();
        }
    });
}

/**
 * Show the statistics modal and update displayed statistics
 */
export function showStatisticsModal() {
    // Update statistics before showing
    updateStatisticsDisplay();
    
    // Show the modal
    statisticsModal.style.display = 'block';
}

/**
 * Hide the statistics modal
 */
export function hideStatisticsModal() {
    statisticsModal.style.display = 'none';
}

/**
 * Update all statistics displays with current data
 */
function updateStatisticsDisplay() {
    const stats = Statistics.loadStatistics();
    
    // Update general stats
    document.getElementById('games-played').textContent = stats.games.played;
    document.getElementById('games-won').textContent = stats.games.won;
    document.getElementById('win-rate').textContent = `${Statistics.getWinRate()}%`;
    document.getElementById('current-streak').textContent = stats.streaks.current;
    document.getElementById('best-streak').textContent = stats.streaks.best;
    
    // Update daily streak
    if (document.getElementById('daily-streak')) {
        document.getElementById('daily-streak').textContent = stats.streaks.dailyStreak || 0;
    }
    
    // Update last played date
    if (document.getElementById('last-played')) {
        document.getElementById('last-played').textContent = stats.streaks.lastPlayed ? 
            new Date(stats.streaks.lastPlayed).toLocaleDateString() : 'Never';
    }
      // Update menu preview stats
    if (document.getElementById('menu-win-rate')) {
        document.getElementById('menu-win-rate').textContent = `${Statistics.getWinRate()}%`;
    }
    if (document.getElementById('menu-current-streak')) {
        document.getElementById('menu-current-streak').textContent = stats.streaks.dailyStreak || 0;
    }
    
    // Update main interface stats
    if (document.getElementById('main-win-rate')) {
        document.getElementById('main-win-rate').textContent = `${Statistics.getWinRate()}%`;
    }
    if (document.getElementById('main-current-streak')) {
        document.getElementById('main-current-streak').textContent = stats.streaks.dailyStreak || 0;
    }
    
    // Update best times
    updateBestTimes(stats.bestTimes);
    
    // Update personal bests
    updatePersonalBests(stats.personalBests);
    
    // Update difficulty stats
    updateDifficultyStats(stats.difficultyStats);
    
    // Update achievements
    updateAchievements(stats.achievements);
}

/**
 * Update the best times display
 * @param {Object} bestTimes - Best times object from statistics
 */
function updateBestTimes(bestTimes) {
    // Update standard difficulties
    ['easy', 'medium', 'hard'].forEach(difficulty => {
        const time = bestTimes[difficulty];
        const element = document.getElementById(`best-time-${difficulty}`);
        
        if (time !== null) {
            element.textContent = formatTime(time);
        } else {
            element.textContent = '--';
        }
        
        // Add "See More" button if it doesn't exist yet
        const parentItem = element.closest('.stat-item');
        if (parentItem && !parentItem.querySelector('.see-more-btn')) {
            const seeMoreBtn = document.createElement('button');
            seeMoreBtn.classList.add('see-more-btn');
            seeMoreBtn.textContent = 'See More';
            seeMoreBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent closing the modal
                Audio.playSound('click-sound');
                showGameHistory(difficulty);
            });
            parentItem.appendChild(seeMoreBtn);
        }
    });
}

/**
 * Show game history for a specific difficulty
 * @param {string} difficulty - The difficulty level to show history for
 */
function showGameHistory(difficulty) {
    const stats = Statistics.loadStatistics();
    const gameHistory = stats.gameHistory[difficulty] || [];
    
    // Create modal content
    const historyModal = document.createElement('div');
    historyModal.className = 'modal';
    historyModal.id = 'game-history-modal';
    historyModal.style.display = 'block';
    
    // Format the difficulty name properly
    const difficultyName = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
      // Sort history by completion time (fastest first)
    const sortedHistory = [...gameHistory].sort((a, b) => 
        a.time - b.time
    );
    
    // Create history table
    let historyContent = `
    <div class="modal-content history-content">
        <span class="close" id="history-close">&times;</span>
        <h2>${difficultyName} Game History</h2>
        <div class="history-container">
            <table class="history-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (sortedHistory.length > 0) {
        sortedHistory.forEach(game => {
            const gameDate = new Date(game.date);
            const currentYear = new Date().getFullYear();
            
            // Format date as requested - show year only if not current year
            let formattedDate;
            const day = gameDate.getDate();
            const month = gameDate.toLocaleString('default', { month: 'long' });
            
            if (gameDate.getFullYear() === currentYear) {
                formattedDate = `${day} ${month}`;
            } else {
                formattedDate = `${day} ${month} (${gameDate.getFullYear()})`;
            }
            
            const time = formatTime(game.time);
            
            historyContent += `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${time}</td>
                </tr>
            `;
        });
    } else {
        historyContent += `
            <tr>
                <td colspan="2">No wins recorded on ${difficultyName} difficulty</td>
            </tr>
        `;
    }
    
    historyContent += `
                </tbody>
            </table>
        </div>
        <button id="close-history" class="full-width">Close</button>
    </div>
    `;
    
    historyModal.innerHTML = historyContent;
    document.body.appendChild(historyModal);
    
    // Add event listeners for close buttons
    document.getElementById('history-close').addEventListener('click', () => {
        Audio.playSound('click-sound');
        document.body.removeChild(historyModal);
    });
    
    document.getElementById('close-history').addEventListener('click', () => {
        Audio.playSound('click-sound');
        document.body.removeChild(historyModal);
    });
    
    // Close when clicking outside
    historyModal.addEventListener('click', (event) => {
        if (event.target === historyModal) {
            Audio.playSound('click-sound');
            document.body.removeChild(historyModal);
        }
    });
}

/**
 * Format time in seconds to a human-readable string
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
function formatTime(seconds) {
    if (seconds < 60) {
        return `${seconds} sec`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Update the personal bests display
 * @param {Object} personalBests - Personal bests object from statistics
 */
function updatePersonalBests(personalBests) {
    // Check if we have the custom-best-times element
    const customBestTimesContainer = document.getElementById('custom-best-times');
    if (customBestTimesContainer) {
        customBestTimesContainer.innerHTML = '';
        
        // Add heading for custom games if any exist
        if (Object.keys(personalBests.custom || {}).length > 0) {
            const customHeading = document.createElement('h4');
            customHeading.textContent = 'Custom Games';
            customHeading.style.marginTop = '15px';
            customHeading.style.marginBottom = '10px';
            customBestTimesContainer.appendChild(customHeading);
              // Add each custom game's best time, sorted by quickest time
            const sortedEntries = Object.entries(personalBests.custom)
                .filter(([_, value]) => value.quickestWin) // Filter out entries without times
                .sort((a, b) => a[1].quickestWin - b[1].quickestWin); // Sort by quickest time
                
            // Add entries with times first
            for (const [key, value] of sortedEntries) {
                const [rows, columns, mines] = key.split('_');
                const customItem = document.createElement('div');
                customItem.className = 'custom-best-time-item';
                customItem.innerHTML = `
                    <span>${rows}×${columns}, ${mines} mines</span>
                    <span>${formatTime(value.quickestWin)}</span>
                `;
                customBestTimesContainer.appendChild(customItem);
            }
            
            // Add entries without times last
            const entriesWithoutTimes = Object.entries(personalBests.custom)
                .filter(([_, value]) => !value.quickestWin);
                
            for (const [key, value] of entriesWithoutTimes) {
                const [rows, columns, mines] = key.split('_');
                const customItem = document.createElement('div');
                customItem.className = 'custom-best-time-item';
                customItem.innerHTML = `
                    <span>${rows}×${columns}, ${mines} mines</span>
                    <span>--</span>
                `;
                customBestTimesContainer.appendChild(customItem);
            }
        }
    }
}

/**
 * Update the difficulty statistics display
 * @param {Object} difficultyStats - Difficulty statistics object
 */
function updateDifficultyStats(difficultyStats) {
    // This could be expanded in the future if you add a dedicated section for difficulty stats
    for (const difficulty in difficultyStats) {
        if (difficulty === 'custom') continue;
        
        const winRateElement = document.getElementById(`win-rate-${difficulty}`);
        if (winRateElement) {
            const { played, won } = difficultyStats[difficulty];
            const winRate = played > 0 ? Math.round((won / played) * 100) : 0;
            winRateElement.textContent = `${winRate}%`;
        }
    }
}

/**
 * Update the achievements display
 * @param {Object} achievements - Achievements object from statistics
 */
function updateAchievements(achievements) {
    // Clear current achievements list
    achievementsList.innerHTML = '';
    
    if (achievements) {
        const totalAchievements = Object.keys(achievements).length;
        const unlockedCount = Object.values(achievements).filter(value => value === true).length;
        
        // Get all achievements - both unlocked and locked
        const allAchievements = [];
        
        // Achievement descriptions for tooltips
        const achievementDescriptions = {
            firstWin: "Win your first game",
            tenWins: "Win 10 games",
            fiftyWins: "Win 50 games",
            hundredWins: "Win 100 games",
            perfectEasy: "Win an Easy game without flagging any wrong cells",
            perfectMedium: "Win a Medium game without flagging any wrong cells",
            perfectHard: "Win a Hard game without flagging any wrong cells",
            speedRunnerEasy: "Win an Easy game in under 30 seconds",
            speedRunnerMedium: "Win a Medium game in under 120 seconds",
            speedRunnerHard: "Win a Hard game in under 300 seconds",
            weekStreak: "Play for 7 consecutive days",
            monthStreak: "Play for 30 consecutive days",
            hundredGames: "Play 100 games",
            thousandGames: "Play 1000 games",
            fiftyPercentWinRate: "Achieve a 50% win rate after playing at least 20 games",
            seventyFivePercentWinRate: "Achieve a 75% win rate after playing at least 20 games",
            easyMaster: "Win 20 games on Easy difficulty",
            mediumMaster: "Win 15 games on Medium difficulty",
            hardMaster: "Win 10 games on Hard difficulty"
        };
        
        for (const [key, value] of Object.entries(achievements)) {
            // Format the achievement name for display
            let name = key.replace(/([A-Z])/g, ' $1').trim(); // Add spaces before capital letters
            name = name.charAt(0).toUpperCase() + name.slice(1); // Capitalize first letter
            
            allAchievements.push({
                name,
                unlocked: value,
                key,
                description: achievementDescriptions[key] || "Complete this achievement"
            });
        }
        
        // Sort achievements: unlocked first, then alphabetically
        allAchievements.sort((a, b) => {
            if (a.unlocked !== b.unlocked) {
                return b.unlocked - a.unlocked; // Unlocked first
            }
            return a.name.localeCompare(b.name); // Then alphabetically
        });
        
        // Create achievement items for each achievement
        allAchievements.forEach(achievement => {
            const achievementItem = document.createElement('div');
            achievementItem.className = achievement.unlocked ? 'achievement-item' : 'achievement-item locked-achievement';
            
            const icon = achievement.unlocked ? '🏆' : '🔒';
            
            // Add tooltip for locked achievements showing how to unlock them
            if (!achievement.unlocked) {
                achievementItem.setAttribute('title', `How to unlock: ${achievement.description}`);
                achievementItem.setAttribute('data-tooltip', achievement.description);
            }
            
            achievementItem.innerHTML = `
                <span class="achievement-icon">${icon}</span>
                <span class="achievement-name">${achievement.name}</span>
            `;
            
            achievementsList.appendChild(achievementItem);
        });
        
        // If no achievements defined, show a message
        if (allAchievements.length === 0) {
            const noAchievements = document.createElement('p');
            noAchievements.textContent = 'No achievements available.';
            noAchievements.style.textAlign = 'center';
            achievementsList.appendChild(noAchievements);
        }
    }
}

