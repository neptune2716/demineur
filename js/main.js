/**
 * Main Module
 * Entry point for the Minesweeper game
 * Coordinates between other modules and handles initialization
 */

import * as Config from './config.js';
import * as State from './state.js';
import * as UI from './ui.js';
import * as Game from './game.js';
import * as Audio from './audio.js';
import * as Storage from './storage.js';
import * as Controller from './controller.js';
import * as ThemeCustomizer from './theme-customizer.js';

// Initialize the game when DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadPreferences();
    
    // Initialize the theme customizer
    ThemeCustomizer.initColorCustomizer();
    
    // Check for saved game state
    if (localStorage.getItem('hasSavedGame') === 'true') {
        if (loadGameState()) {
            return;
        }
    }
    
    // Initialize with default settings
    UI.initializeGame();
});

// Set up all event listeners for the game
function setupEventListeners() {
    // Menu control
    document.getElementById('menu-button').addEventListener('click', function() {
        Audio.playSound('click-sound');
        document.getElementById('menu-modal').style.display = 'block';
    });
    
    document.getElementById('menu-close').addEventListener('click', function() {
        Audio.playSound('click-sound');
        document.getElementById('menu-modal').style.display = 'none';
    });
    
    // Close menus when clicking outside
    window.addEventListener('click', function(event) {
        const menuModal = document.getElementById('menu-modal');
        const customModal = document.getElementById('custom-modal');
        const resultModal = document.getElementById('result-modal');
        
        if (event.target === menuModal) {
            Audio.playSound('click-sound');
            menuModal.style.display = 'none';
        } else if (event.target === customModal) {
            Audio.playSound('click-sound');
            customModal.style.display = 'none';
        } else if (event.target === resultModal) {
            Audio.playSound('click-sound');
            resultModal.style.display = 'none';
            UI.initializeGame();
        }
    });
    
    // Game controls
    document.getElementById('new-game').addEventListener('click', function() {
        Audio.playSound('click-sound');
        document.getElementById('menu-modal').style.display = 'none';
        UI.initializeGame();
    });
    
    document.querySelectorAll('.difficulty').forEach(button => {
        button.addEventListener('click', function() {
            Audio.playSound('click-sound');
            const difficulty = this.dataset.difficulty;
            setDifficulty(difficulty);
            document.getElementById('menu-modal').style.display = 'none';
            UI.initializeGame();
        });
    });
    
    document.getElementById('custom-difficulty').addEventListener('click', function() {
        Audio.playSound('click-sound');
        document.getElementById('menu-modal').style.display = 'none';
        UI.openCustomModal();
    });
    
    document.getElementById('start-custom').addEventListener('click', function() {
        Audio.playSound('click-sound');
        UI.startCustomGame();
    });
    
    document.getElementById('custom-close').addEventListener('click', function() {
        Audio.playSound('click-sound');
        UI.closeCustomModal();
    });
      document.getElementById('theme').addEventListener('change', function() {
        Audio.playSound('click-sound');
        UI.setTheme(this.value);
    });
    
    // Animated background toggle
    document.getElementById('animated-bg').addEventListener('change', function() {
        Audio.playSound('click-sound');
        const isEnabled = this.checked;
        localStorage.setItem('animatedBackground', isEnabled);
        
        if (isEnabled) {
            document.body.classList.add('animated-bg');
            UI.createParticles();
        } else {
            document.body.classList.remove('animated-bg');
            document.getElementById('particles-container').innerHTML = '';
        }
    });
    
      // Speedrun mode toggle
    document.getElementById('speedrun-toggle').addEventListener('change', function() {
        State.setSpeedrunMode(this.checked);
        localStorage.setItem('speedrunMode', State.speedrunMode);
        
        // Enable or disable speedrun-related controls
        const speedrunControls = document.querySelectorAll('.speedrun-control');
        speedrunControls.forEach(control => {
            control.classList.toggle('disabled', !State.speedrunMode);
            const inputs = control.querySelectorAll('input');
            inputs.forEach(input => input.disabled = !State.speedrunMode);
        });
    });
    
    // Controller setup
    Controller.setupControllerListeners();
    
    // Audio setup
    Audio.setupAudioListeners();
    
    // Result modal new game button
    document.getElementById('new-game-result').addEventListener('click', function() {
        document.getElementById('result-modal').style.display = 'none';
        UI.initializeGame();
    });
}

// Load saved preferences from localStorage
function loadPreferences() {
    // Load audio preferences
    Audio.loadAudioPreferences();
    
    // Load controller preferences
    Controller.loadControllerSettings();
      // Load speedrun mode preference
    if (localStorage.getItem('speedrunMode') !== null) {
        State.setSpeedrunMode(localStorage.getItem('speedrunMode') === 'true');
        document.getElementById('speedrun-toggle').checked = State.speedrunMode;
        
        // Enable or disable speedrun-related controls
        const speedrunControls = document.querySelectorAll('.speedrun-control');
        speedrunControls.forEach(control => {
            control.classList.toggle('disabled', !State.speedrunMode);
            const inputs = control.querySelectorAll('input');
            inputs.forEach(input => input.disabled = !State.speedrunMode);
        });
    }
      // Apply saved theme if exists
    if (localStorage.getItem('theme')) {
        const savedTheme = localStorage.getItem('theme');
        document.getElementById('theme').value = savedTheme;
        UI.setTheme(savedTheme);
    }
    
    // Check animated background preference
    if (localStorage.getItem('animatedBackground') !== null) {
        const animatedBg = localStorage.getItem('animatedBackground') === 'true';
        document.getElementById('animated-bg').checked = animatedBg;
        if (animatedBg) {
            document.body.classList.add('animated-bg');
            UI.createParticles();
        } else {
            document.body.classList.remove('animated-bg');
        }
    } else {
        // Default to enabled
        localStorage.setItem('animatedBackground', 'true');
        document.body.classList.add('animated-bg');
        UI.createParticles();
    }
}

// Set difficulty level
function setDifficulty(difficulty) {
    if (Config.difficulties[difficulty]) {
        const { rows, columns, mines } = Config.difficulties[difficulty];
        State.setGameDimensions(rows, columns, mines);
    }
}

// Load game state from localStorage
function loadGameState() {
    const savedState = localStorage.getItem('savedGameState');
    if (!savedState) return false;
    
    try {
        const gameState = JSON.parse(savedState);
          // Restore game dimensions and state
        State.setGameDimensions(gameState.rows, gameState.columns, gameState.mineCount);
        State.setCellsRevealed(gameState.cellsRevealed);
        State.setTimer(gameState.timer);
        State.setFlaggedMines(gameState.flaggedMines);
        State.setFirstClick(false);
        State.setGameActive(true);
        
        // Update CSS variables for grid
        document.documentElement.style.setProperty('--rows', State.rows);
        document.documentElement.style.setProperty('--columns', State.columns);
          // Restore the game board
        State.setGameBoard(gameState.board);
        
        // Update UI
        UI.minesCounterElement.textContent = State.mineCount - document.querySelectorAll('.cell.flagged').length;
        UI.timerElement.textContent = State.timer;
        
        // Render the board
        UI.renderSavedBoard();
        
        // Start timer
        UI.startTimer();
        document.body.classList.add('game-active');
        
        return true;
    } catch (error) {
        console.error('Error loading saved game:', error);
        return false;
    }
}
