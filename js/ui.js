/**
 * UI Module
 * Handles UI-related functions and DOM manipulation
 */

import * as State from './state.js';
import * as Game from './game.js';
import * as Audio from './audio.js';

// Cache DOM elements
export const gameBoardElement = document.getElementById('game-board');
export const minesCounterElement = document.getElementById('mines-counter');
export const timerElement = document.getElementById('timer');
export const customModalElement = document.getElementById('custom-modal');

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
    
    // Calculate maximum mines allowed (20% of total tiles)
    const totalTiles = rows * columns;
    const maxAllowedMines = Math.floor(totalTiles * 0.2);
    
    // Get the requested mines and ensure it's within limits
    let mineCount = Math.max(1, parseInt(minesInput.value) || 10);
      // Check if mine count exceeds the 20% limit
    if (mineCount > maxAllowedMines) {
        // Show a custom warning notification instead of alert
        import('./notification.js').then(Notification => {
            Notification.showWarning(`Maximum mines allowed is ${maxAllowedMines} (20% of total tiles)`);
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
    };
    localStorage.setItem('customGameSettings', JSON.stringify(customSettings));
    
    // Set game dimensions and start the game
    State.setGameDimensions(rows, columns, mineCount);
    
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
    
    // Update statistics on the main page
    updateMainPageStats();
    
    // Add active game visual indicator
    document.body.classList.add('game-active');
    
    // Reset the game UI to main screen state
    resetToMainScreen();
    
    // Update difficulty indicator
    updateDifficultyIndicator();
    
    return gameBoard;
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
}

/**
 * Show the pause menu
 */
export function showPauseMenu() {
    const pauseMenu = document.getElementById('pause-menu');
    pauseMenu.style.display = 'block';
}

/**
 * Hide the pause menu
 */
export function hidePauseMenu() {
    const pauseMenu = document.getElementById('pause-menu');
    pauseMenu.style.display = 'none';
}

/**
 * Update the difficulty indicator based on current difficulty
 */
export function updateDifficultyIndicator() {
    const difficultyLabel = document.getElementById('current-difficulty-label');
    if (difficultyLabel) {
        let difficultyText = "";
        
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
                difficultyText = `Custom (${State.rows}×${State.columns}, ${State.mineCount} mines)`;
                break;
            default:
                difficultyText = "Easy";
        }
        
        difficultyLabel.textContent = difficultyText;
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

// Start timer
export function startTimer() {
    State.setTimerInterval(setInterval(() => {
        State.incrementTimer();
        timerElement.textContent = State.timer;
    }, 1000));
}

// Update mines counter
export function updateMinesCounter() {
    minesCounterElement.textContent = State.mineCount - document.querySelectorAll('.cell.flagged').length;
}

// Show result modal
export function showResultModal(isWin, timer) {
    const resultModal = document.getElementById('result-modal');
    const resultMessage = document.getElementById('result-message');
    const resultDetails = document.getElementById('result-details');
    
    if (isWin) {
        resultMessage.textContent = 'Congratulations!';
        resultDetails.textContent = `You won in ${timer} seconds.`;
        resultMessage.style.color = 'var(--accent-color)';
    } else {
        resultMessage.textContent = 'Game Over';
        resultDetails.textContent = 'Better luck next time!';
        resultMessage.style.color = 'var(--mine-color)';
    }
    
    resultModal.style.display = 'block';
}
