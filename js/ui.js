/**
 * UI Module
 * Handles UI-related functions and DOM manipulation
 */

import * as State from './state.js';
import * as Game from './game.js';
import * as Audio from './audio.js';
import * as Storage from './storage.js';

// Cache DOM elements
export const gameBoardElement = document.getElementById('game-board');
export const minesCounterElement = document.getElementById('mines-counter');
export const timerElement = document.getElementById('timer');
export const customModalElement = document.getElementById('custom-modal');
export const resultModalElement = document.getElementById('result-modal');
export const zenStartModalElement = document.getElementById('zen-start-modal');
export const zenLossModalElement = document.getElementById('zen-loss-modal'); // Fixed missing parenthesis

// Set the game theme
export function setTheme(theme) {
    document.body.className = '';
    document.body.classList.add(`theme-${theme}`);
    
    // Check if animated background is enabled
    if (localStorage.getItem('animatedBackground') === 'true') {
        document.body.classList.add('animated-bg');
    }
    
    localStorage.setItem('theme', theme);
    
    // Update particles to match the theme
    updateParticles();
}

// Track animation frame for performance optimization
let animationFrameId = null;
let particlesInitialized = false;

// Create floating particles for the background
export function createParticles() {
    if (localStorage.getItem('animatedBackground') !== 'true') return;
    
    const container = document.getElementById('particles-container');
    
    // Clear existing particles and create new ones
    container.innerHTML = '';
    particlesInitialized = true;
    
    // Create different numbers of particles based on screen size
    const particleCount = window.innerWidth < 600 ? 12 : 24;
    
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Randomize particle positions for immediate animation
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Add some random transformations but no delays
        const randomScale = 0.5 + Math.random() * 1;
        const randomOpacity = 0.3 + Math.random() * 0.7;
        const randomDuration = 15 + Math.random() * 20;
        
        particle.style.transform = `scale(${randomScale})`;
        particle.style.opacity = randomOpacity;
        particle.style.animationDuration = `${randomDuration}s`;
        // No animation delay - all particles start animating immediately
        
        fragment.appendChild(particle);
    }
    
    container.appendChild(fragment);
}

// Update particles when theme changes
export function updateParticles() {
    // Only refresh particles when animation is enabled
    if (localStorage.getItem('animatedBackground') !== 'true') {
        const container = document.getElementById('particles-container');
        container.innerHTML = '';
        particlesInitialized = false;
        return;
    }
    
    // Instead of recreating all particles, just mark them as needing initialization
    particlesInitialized = false;
    
    // Use requestAnimationFrame for smoother updates
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    // Small delay to allow CSS variables to update, but using requestAnimationFrame for better performance
    animationFrameId = requestAnimationFrame(() => {
        createParticles();
    });
}

// Open custom game modal
export function openCustomModal() {
    // Load saved custom settings if they exist
    const savedCustomSettings = localStorage.getItem('customGameSettings');
    
    if (savedCustomSettings) {
        const settings = JSON.parse(savedCustomSettings);
        document.getElementById('width').value = settings.width;
        document.getElementById('height').value = settings.height;
        document.getElementById('mines').value = settings.mines;
    }
    
    customModalElement.style.display = 'block';
}

// Close custom game modal
export function closeCustomModal() {
    customModalElement.style.display = 'none';
}

// Handle custom game settings
export function startCustomGame() {
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const minesInput = document.getElementById('mines');
    
    const rows = Math.max(5, Math.min(100, parseInt(heightInput.value) || 10));
    const columns = Math.max(5, Math.min(100, parseInt(widthInput.value) || 10));
    
    // Calculate maximum mines allowed (30% of total tiles)
    const totalTiles = rows * columns;
    const maxAllowedMines = Math.floor(totalTiles * 0.3);
    
    // Get the requested mines and ensure it's within limits
    let mineCount = Math.max(1, parseInt(minesInput.value) || 10);
      // Check if mine count exceeds the 30% limit
    if (mineCount > maxAllowedMines) {
        // Show a custom warning notification instead of alert
        import('./notification.js').then(Notification => {
            Notification.showWarning(`Maximum mines allowed is ${maxAllowedMines} (30% of total tiles)`);
        });
        mineCount = maxAllowedMines;
    }
    
    // Ensure we never exceed total tiles - 1 (need at least one safe cell)
    mineCount = Math.min(mineCount, totalTiles - 1);
    
    // Update input values
    heightInput.value = rows;
    widthInput.value = columns;
    minesInput.value = mineCount;
      // Save custom settings to localStorage
    const customSettings = {
        width: columns,
        height: rows,
        mines: mineCount
    };    localStorage.setItem('customGameSettings', JSON.stringify(customSettings));
    
    // Set game dimensions and start the game
    State.setGameDimensions(rows, columns, mineCount);
    
    // Set difficulty to custom explicitly using the proper setter method
    State.setDifficulty('custom');
    
    closeCustomModal();
    initializeGame();
}

// Initialize or restart the game
export function initializeGame() {
    // Reset game state
    const gameBoard = State.resetGameState();
    clearInterval(State.timerInterval);
    timerElement.textContent = '0';
    
    // Update CSS variables for grid
    document.documentElement.style.setProperty('--rows', State.rows);
    document.documentElement.style.setProperty('--columns', State.columns);
    
    // Update UI
    minesCounterElement.textContent = State.mineCount;
    renderBoard();
    
    // Update statistics on the main page (only if not in Zen Mode)
    if (!State.isZenMode) {
        updateMainPageStats();
    }
    
    // Add active game visual indicator
    document.body.classList.add('game-active');
    
    // Update difficulty indicator
    updateDifficultyIndicator();
    
    // Update mode indicators
    updateModeIndicators();
    
    return gameBoard;
}

/**
 * Updates the Zen Mode level indicator and game title
 * Shows the indicator when in Zen Mode, hides it otherwise
 * Updates the displayed level number and changes the main title
 */
export function updateZenLevelIndicator() {
    const zenLevelIndicator = document.getElementById('zen-level-indicator');
    const zenCurrentLevel = document.getElementById('zen-current-level');
    const gameTitle = document.getElementById('game-title');
    
    if (State.isZenMode) {
        // Show the indicator and update level
        zenLevelIndicator.style.display = 'flex';
        zenCurrentLevel.textContent = State.zenLevel;
        
        // Change the game title to indicate Zen Mode
        gameTitle.textContent = 'Zen Mode';
        
        // Add a class to the body to enable zen-specific styles
        document.body.classList.add('zen-mode-active');
        
    } else {
        // Hide the indicator when not in Zen Mode
        zenLevelIndicator.style.display = 'none';
        
        // Restore the original game title
        gameTitle.textContent = 'Relaxing Minesweeper';
        
        // Remove zen mode class
        document.body.classList.remove('zen-mode-active');
    }
}

/**
 * Adds a brief animation to the level indicator for level-up events
 */
export function animateLevelUp() {
    const zenLevelIndicator = document.getElementById('zen-level-indicator');
    zenLevelIndicator.classList.add('level-up-animation');
    
    // Remove the animation class after it completes
    setTimeout(() => {
        zenLevelIndicator.classList.remove('level-up-animation');
    }, 600); // Animation duration + a little extra
}

/**
 * Transition from the main screen to the gameplay view
 */
export function transitionToGameplay() {
    // Add class to body for overall state
    document.body.classList.add('game-playing');
    
    // Hide main screen elements
    const mainScreen = document.getElementById('main-screen');
    mainScreen.classList.add('hidden');
    
    // Center the game board
    const gameBoard = document.querySelector('.game-board-container');
    gameBoard.classList.add('centered');
    
    // Show in-game UI
    const inGameUI = document.getElementById('in-game-ui');
    setTimeout(() => {
        inGameUI.classList.add('active');
    }, 300); // Small delay for sequential animation
    
    // Show/Hide New Game button based on mode
    const newGameInGameButton = document.getElementById('new-game-in-game');
    if (newGameInGameButton) {
        newGameInGameButton.style.display = State.isZenMode ? 'none' : 'inline-block';
    }
    
    // Update Zen Mode indicator if needed
    updateZenLevelIndicator();
}

/**
 * Reset UI to the main screen state
 */
export function resetToMainScreen() {
    // Remove game-playing class
    document.body.classList.remove('game-playing');
    
    // Show main screen elements
    const mainScreen = document.getElementById('main-screen');
    mainScreen.classList.remove('hidden');
    
    // Reset game board position
    const gameBoard = document.querySelector('.game-board-container');
    gameBoard.classList.remove('centered');
    
    // Hide in-game UI
    const inGameUI = document.getElementById('in-game-ui');
    inGameUI.classList.remove('active');
    
    // Ensure New Game button is visible when returning to main screen context
    // (though it's part of in-game UI which is hidden anyway, this is for consistency)
    const newGameInGameButton = document.getElementById('new-game-in-game');
    if (newGameInGameButton) {
        newGameInGameButton.style.display = 'inline-block';
    }
    
    // If quitting Zen Mode, reset the state
    if (State.isZenMode) {
        State.setZenMode(false);
        State.setZenLevel(1);
        Storage.clearZenProgress(); // Clear saved progress when returning to menu
        // Also reset the current run statistics
        import('./statistics.js').then(Statistics => {
            Statistics.resetZenRun();
        });
    }
    
    // Update difficulty indicator back to normal and hide Zen indicator
    updateDifficultyIndicator();
    updateZenLevelIndicator();
}

/**
 * Show the pause menu
 */
/**
 * Show the pause menu and pause the timer
 */
export function showPauseMenu() {
    const pauseMenu = document.getElementById('pause-menu');
    pauseMenu.style.display = 'block';
    pauseMenu.classList.add('centered-modal');
    
    // Store the current timer interval and clear it
    if (State.timerInterval) {
        clearInterval(State.timerInterval);
        // Store the active state to resume later
        pauseMenu.dataset.wasActive = 'true';
    }
}

/**
 * Hide the pause menu and resume the timer if game was active
 */
export function hidePauseMenu() {
    const pauseMenu = document.getElementById('pause-menu');
    pauseMenu.style.display = 'none';
    
    // Resume the timer if the game was active when paused
    if (pauseMenu.dataset.wasActive === 'true' && State.gameActive) {
        startTimer();
        pauseMenu.dataset.wasActive = 'false';
    }
}

/**
 * Update the difficulty indicator based on current difficulty or Zen level
 */
export function updateDifficultyIndicator() {
    const difficultyLabel = document.getElementById('current-difficulty-label');
    if (difficultyLabel) {
        let difficultyText = "";
        
        if (State.isZenMode) {
            difficultyText = `Zen Level ${State.zenLevel}`;
        } else {
            // Show standard difficulty levels including Custom
            switch(State.difficulty) {
                case 'easy':
                    difficultyText = "Easy";
                    break;
                case 'medium':
                    difficultyText = "Medium";
                    break;
                case 'hard':
                    difficultyText = "Hard";
                    break;
                case 'custom':
                    difficultyText = "Custom";
                    break;
                default:
                    difficultyText = "Custom"; // Fallback
            }
        }
        difficultyLabel.textContent = difficultyText;
    }
}

// Update mode indicators (Speedrun mode, Safe mode)
export function updateModeIndicators() {
    // Main menu indicators
    const speedrunIndicator = document.getElementById('speedrun-indicator');
    const safeIndicator = document.getElementById('safe-indicator');
    
    // In-game indicators
    const inGameSpeedrun = document.getElementById('in-game-speedrun');
    const inGameSafe = document.getElementById('in-game-safe');
    
    // Update speedrun indicators
    if (State.speedrunMode) {
        speedrunIndicator.classList.remove('disabled');
        inGameSpeedrun.classList.remove('disabled');
    } else {
        speedrunIndicator.classList.add('disabled');
        inGameSpeedrun.classList.add('disabled');
    }
    
    // Update safe mode indicators
    if (State.safeMode) {
        safeIndicator.classList.remove('disabled');
        inGameSafe.classList.remove('disabled');
    } else {
        safeIndicator.classList.add('disabled');
        inGameSafe.classList.add('disabled');
    }
}

// Update statistics on the main page
export function updateMainPageStats() {
    import('./statistics.js').then(Statistics => {
        // Update win rate
        const winRateElement = document.getElementById('main-win-rate');
        if (winRateElement) {
            winRateElement.textContent = `${Statistics.getWinRate()}%`;
        }
        
        // Update streak
        const streakElement = document.getElementById('main-current-streak');
        if (streakElement) {
            const streakInfo = Statistics.getStreakInfo();
            streakElement.textContent = streakInfo.current;
        }
    });
}

// Render the game board
export function renderBoard() {
    // Clear previous board
    gameBoardElement.innerHTML = '';
    
    // Calculate total cells and apply size class to the board for optimization
    const totalCells = State.rows * State.columns;
    gameBoardElement.dataset.boardSize = totalCells > 1000 ? 'large' : 
                                         totalCells > 500 ? 'medium' : 'small';
    
    // Create grid cells
    for (let y = 0; y < State.rows; y++) {
        for (let x = 0; x < State.columns; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            
            // Add event listeners
            cell.addEventListener('click', Game.handleLeftClick);
            cell.addEventListener('contextmenu', Game.handleRightClick);
            
            gameBoardElement.appendChild(cell);
        }
    }
}

// Render a saved game board
export function renderSavedBoard() {
    // Clear previous board
    gameBoardElement.innerHTML = '';
    
    // Create grid cells with saved state
    for (let y = 0; y < State.rows; y++) {
        for (let x = 0; x < State.columns; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            
            const boardCell = State.gameBoard[y][x];
            
            // Restore cell appearance
            if (boardCell.isRevealed) {
                cell.classList.add('revealed');
                
                if (boardCell.adjacentMines > 0) {
                    cell.textContent = boardCell.adjacentMines;
                    cell.dataset.mines = boardCell.adjacentMines;
                }
                
                if (boardCell.isMine) {
                    cell.classList.add('mine');
                }
            }
            
            if (boardCell.isFlagged) {
                cell.classList.add('flagged');
            }
            
            // Add event listeners
            cell.addEventListener('click', Game.handleLeftClick);
            cell.addEventListener('contextmenu', Game.handleRightClick);
            
            gameBoardElement.appendChild(cell);
        }
    }
}

// Get DOM element for a cell
export function getCellElement(x, y) {
    return document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
}

// Helper function to format time in seconds to M:SS or S format
function formatDuration(seconds) {
    if (seconds < 60) {
        return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
}

// Start timer
export function startTimer() {
    State.setTimerInterval(setInterval(() => {
        State.incrementTimer();
        timerElement.textContent = formatDuration(State.timer);
    }, 1000));
}

// Update mines counter
export function updateMinesCounter() {
    minesCounterElement.textContent = State.mineCount - document.querySelectorAll('.cell.flagged').length;
}

// Show result modal
export function showResultModal(isWin, timer) {
    // Don't show the standard result modal in Zen Mode
    if (State.isZenMode) return;
    
    const resultModal = document.getElementById('result-modal');
    const resultMessage = document.getElementById('result-message');
    const resultDetails = document.getElementById('result-details');
    
    if (isWin) {
        resultMessage.textContent = 'Congratulations!';
        resultDetails.textContent = `You won in ${formatDuration(timer)}.`;
        resultMessage.style.color = 'var(--accent-color)';
    } else {
        resultMessage.textContent = 'Game Over';
        resultDetails.textContent = 'Better luck next time!';
        resultMessage.style.color = 'var(--mine-color)';
    }
    
    resultModal.style.display = 'block';
}

// --- Zen Mode UI Functions ---

/**
 * Calculates game dimensions for a given Zen level.
 * Starts with Easy, gradually increases size and mine density.
 * @param {number} level - The current Zen level.
 * @returns {{rows: number, columns: number, mineCount: number}}
 */
function getZenLevelConfig(level) {
    // Base config (Easy)
    let rows = 9;
    let columns = 9;
    let mines = 10;

    // Increase size every 5 levels
    const sizeIncreases = Math.floor((level - 1) / 5);
    rows += sizeIncreases;
    columns += sizeIncreases;

    // Increase mine density slightly every level, capping at ~20-25%
    // Start with ~12% density (10 / 81)
    const baseDensity = 0.12;
    const maxDensity = 0.22; // Cap density increase
    const densityIncreasePerLevel = 0.002;
    let currentDensity = baseDensity + (level - 1) * densityIncreasePerLevel;
    currentDensity = Math.min(currentDensity, maxDensity);

    mines = Math.floor(rows * columns * currentDensity);

    // Ensure minimum/maximum dimensions and mines
    rows = Math.max(5, Math.min(rows, 50)); // Min 5x5, Max 50x50
    columns = Math.max(5, Math.min(columns, 50));
    mines = Math.max(5, Math.min(mines, Math.floor(rows * columns * 0.3))); // Min 5 mines, max 30% density
    mines = Math.min(mines, rows * columns - 9); // Ensure at least a 3x3 safe start

    return { rows, columns, mineCount: mines };
}

/**
 * Starts a specific Zen level.
 * @param {number} level - The level to start.
 */
export function startZenLevel(level) {
    // Set Zen Mode state
    State.setZenMode(true);
    State.setZenLevel(level);

    // Get configuration for this level
    const config = getZenLevelConfig(level);
    State.setGameDimensions(config.rows, config.columns, config.mineCount);

    // Ensure Safe Mode is enabled for Zen Mode
    State.setSafeMode(true);
    
    // Update the Zen level indicator BEFORE initializing the game
    updateZenLevelIndicator();
    
    // Initialize the game
    initializeGame();
    
    // Ensure we transition to gameplay view if not already there
    if (!document.body.classList.contains('game-playing')) {
        transitionToGameplay(); // This will now hide the New Game button
    } else {
        // If already in gameplay view (e.g., next level), ensure button is hidden
        const newGameInGameButton = document.getElementById('new-game-in-game');
        if (newGameInGameButton) {
            newGameInGameButton.style.display = 'none';
        }
    }
    
    // Force update the indicator again to ensure it's visible
    setTimeout(() => {
        const zenLevelIndicator = document.getElementById('zen-level-indicator');
        if (zenLevelIndicator) {
            zenLevelIndicator.style.display = 'flex';
            console.log('Forcing Zen Mode indicator visibility');
        }
    }, 100);
}

/**
 * Shows the Zen Mode start modal.
 */
export function showZenStartModal() {
    // Get both progress sources
    const savedProgressLevel = Storage.loadZenProgress();
    const hasSavedZenGame = localStorage.getItem(Storage.HAS_SAVED_ZEN_GAME_KEY) === 'true';
    
    // If there's a saved game state, get the level from there
    let gameStateLevel = null;
    if (hasSavedZenGame) {
        const savedZenGame = Storage.loadZenGameState();
        if (savedZenGame && typeof savedZenGame.zenLevel === 'number') {
            gameStateLevel = savedZenGame.zenLevel;
        }
    }
    
    // Use the highest level from either source
    const actualLevel = Math.max(
        gameStateLevel || 0,  // From saved game state
        savedProgressLevel || 0  // From progress tracking
    );
    
    const continueButton = document.getElementById('zen-continue');
    const continueLevelSpan = document.getElementById('zen-continue-level');

    // Show continue button if we have a valid level to continue at
    if (hasSavedZenGame || (actualLevel && actualLevel > 1)) {
        // Display the actual level, or default to 1 if somehow both are 0
        continueLevelSpan.textContent = actualLevel || 1;
        continueButton.style.display = 'inline-block';
    } else {
        continueButton.style.display = 'none';
    }
    zenStartModalElement.style.display = 'block';
}

/**
 * Hides the Zen Mode start modal.
 */
export function hideZenStartModal() {
    zenStartModalElement.style.display = 'none';
}

/**
 * Shows the Zen Mode loss modal.
 * @param {number} levelLost - The level the player lost on.
 */
export function showZenLossModal(levelLost) {
    document.getElementById('zen-loss-level').textContent = levelLost;
    document.getElementById('zen-replay-level').textContent = levelLost;
    zenLossModalElement.style.display = 'block';
}

/**
 * Hides the Zen Mode loss modal.
 */
export function hideZenLossModal() {
    zenLossModalElement.style.display = 'none';
}
