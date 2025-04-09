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

// Create floating particles for the background
export function createParticles() {
    const container = document.getElementById('particles-container');
    container.innerHTML = '';
    
    // Create different numbers of particles based on screen size
    const particleCount = window.innerWidth < 600 ? 15 : 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Randomize particle positions
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Add some random transformations
        const randomScale = 0.5 + Math.random() * 1;
        const randomOpacity = 0.3 + Math.random() * 0.7;
        const randomDuration = 15 + Math.random() * 20;
        
        particle.style.transform = `scale(${randomScale})`;
        particle.style.opacity = randomOpacity;
        particle.style.animationDuration = `${randomDuration}s`;
        
        container.appendChild(particle);
    }
}

// Update particles when theme changes
export function updateParticles() {
    // Only refresh particles when animation is enabled
    if (localStorage.getItem('animatedBackground') !== 'true') return;
    
    // Remove existing particles
    const container = document.getElementById('particles-container');
    
    // Create new particles with a slight delay to allow CSS variables to update
    setTimeout(() => createParticles(), 100);
}

// Open custom game modal
export function openCustomModal() {
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
    
    const rows = Math.max(5, Math.min(50, parseInt(heightInput.value) || 10));
    const columns = Math.max(5, Math.min(50, parseInt(widthInput.value) || 10));
    const mineCount = Math.max(1, Math.min(rows * columns - 1, parseInt(minesInput.value) || 10));
    
    heightInput.value = rows;
    widthInput.value = columns;
    minesInput.value = mineCount;
    
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
    
    // Add active game visual indicator
    document.body.classList.add('game-active');
    
    return gameBoard;
}

// Render the game board
export function renderBoard() {
    // Clear previous board
    gameBoardElement.innerHTML = '';
    
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
