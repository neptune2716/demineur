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
    
    // Add event listener for the menu statistics button
    document.getElementById('view-stats-menu').addEventListener('click', () => {
        Audio.playSound('click-sound');
        document.getElementById('menu-modal').style.display = 'none'; // Hide menu first
        showStatisticsModal();
    });
    
    document.getElementById('statistics-close').addEventListener('click', () => {
        Audio.playSound('click-sound');
        hideStatisticsModal();
    });
    
    document.getElementById('close-statistics').addEventListener('click', () => {
        Audio.playSound('click-sound');
        hideStatisticsModal();
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
    
    // Update best times
    updateBestTimes(stats.bestTimes);
    
    // Update achievements
    updateAchievements();
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
    });
    
    // We could add custom times display here if needed
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
 * Update the achievements display
 */
function updateAchievements() {
    // Get unlocked achievements
    const unlockedAchievements = Statistics.getUnlockedAchievements();
    
    // Clear current achievements list
    achievementsList.innerHTML = '';
    
    // Create achievement items for each unlocked achievement
    unlockedAchievements.forEach(achievement => {
        const achievementItem = document.createElement('div');
        achievementItem.className = 'achievement-item';
        achievementItem.innerHTML = `
            <span class="achievement-icon">🏆</span>
            <span class="achievement-name">${achievement}</span>
        `;
        achievementsList.appendChild(achievementItem);
    });
    
    // If no achievements, show a message
    if (unlockedAchievements.length === 0) {
        const noAchievements = document.createElement('p');
        noAchievements.textContent = 'No achievements unlocked yet. Keep playing!';
        noAchievements.style.textAlign = 'center';
        achievementsList.appendChild(noAchievements);
    }
}
