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
import * as StatisticsUI from './statistics-ui.js';
import * as Tutorial from './tutorial.js';

// Initialize the game when DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadPreferences();
      // Initialize the theme customizer
    ThemeCustomizer.initColorCustomizer();
    
    // Initialize statistics UI
    StatisticsUI.initStatisticsUI();
    
    // Initialize tutorial system
    Tutorial.initTutorial();
    
    // Check for saved game state
    if (localStorage.getItem('hasSavedGame') === 'true') {
        if (loadGameState()) {
            return;
        }
    }
    
    // Always set Easy mode as default when starting/refreshing the game
    if (Config.difficulties['easy']) {
        const { rows, columns, mines } = Config.difficulties['easy'];
        State.setGameDimensions(rows, columns, mines);
    }
    
    // Initialize with default settings (now including Easy mode dimensions)
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
        // Update mode indicators when closing the menu
        UI.updateModeIndicators();
        
        // Restore original state of toggles
        resetToggleStates();
    });
    // Tutorial button in menu
    document.getElementById('open-tutorial-from-menu').addEventListener('click', function() {
        Audio.playSound('click-sound');
        document.getElementById('menu-modal').style.display = 'none'; // Close menu first
        // Update mode indicators when closing menu to open tutorial
        UI.updateModeIndicators();
        Tutorial.openTutorial();
    });
      // Tutorial show on startup checkbox
    document.getElementById('show-tutorial-startup').addEventListener('change', function() {
        Audio.playSound('click-sound');
        localStorage.setItem('dontShowTutorial', !this.checked);
    });
      // Close menus when clicking outside
    window.addEventListener('click', function(event) {
        const menuModal = document.getElementById('menu-modal');
        const customModal = document.getElementById('custom-modal');
        const resultModal = document.getElementById('result-modal');
        const tutorialModal = document.getElementById('tutorial-modal');
          if (event.target === menuModal) {
            Audio.playSound('click-sound');
            menuModal.style.display = 'none';
            // Update mode indicators when clicking outside to close
            UI.updateModeIndicators();
        } else if (event.target === customModal) {
            Audio.playSound('click-sound');
            customModal.style.display = 'none';
        } else if (event.target === tutorialModal) {
            Audio.playSound('click-sound');
            tutorialModal.style.display = 'none';
            customModal.style.display = 'none';
        } else if (event.target === resultModal) {
            Audio.playSound('click-sound');
            resultModal.style.display = 'none';
            UI.initializeGame();
        }
    });
      // In-game controls
    document.getElementById('new-game-in-game').addEventListener('click', function() {
        Audio.playSound('click-sound');
        UI.initializeGame();
    });
    
    // Pause game button
    document.getElementById('pause-game').addEventListener('click', function() {
        Audio.playSound('click-sound');
        UI.showPauseMenu();
    });
    
    // Pause menu events
    document.getElementById('resume-game').addEventListener('click', function() {
        Audio.playSound('click-sound');
        UI.hidePauseMenu();
    });
    
    document.getElementById('pause-close').addEventListener('click', function() {
        Audio.playSound('click-sound');
        UI.hidePauseMenu();
    });
    
    document.getElementById('open-options-from-pause').addEventListener('click', function() {
        Audio.playSound('click-sound');
        UI.hidePauseMenu();
        
        // Disable safe mode and speedrun mode toggles when accessing from pause menu
        const speedrunToggle = document.getElementById('speedrun-toggle');
        const safeModeToggle = document.getElementById('safe-mode-toggle');
        
        // Store original state to restore when menu is closed
        if (!speedrunToggle.hasAttribute('data-original-state')) {
            speedrunToggle.setAttribute('data-original-state', speedrunToggle.disabled ? 'disabled' : 'enabled');
            safeModeToggle.setAttribute('data-original-state', safeModeToggle.disabled ? 'disabled' : 'enabled');
        }
        
        // Disable the toggles
        speedrunToggle.disabled = true;
        safeModeToggle.disabled = true;
        
        // Add a visual indication that they can't be changed during gameplay
        speedrunToggle.parentElement.classList.add('in-game-disabled');
        safeModeToggle.parentElement.classList.add('in-game-disabled');
        
        document.getElementById('menu-modal').style.display = 'block';
    });
    
    document.getElementById('quit-game').addEventListener('click', function() {
        Audio.playSound('click-sound');
        UI.hidePauseMenu();
        // Reset to main screen and reinitialize the game
        UI.resetToMainScreen();
        UI.initializeGame();
    });
    
    document.querySelectorAll('.difficulty').forEach(button => {        button.addEventListener('click', function() {
            Audio.playSound('click-sound');
            const difficulty = this.dataset.difficulty;
            setDifficulty(difficulty);
            document.getElementById('menu-modal').style.display = 'none';
            // Update mode indicators when closing menu via difficulty selection
            UI.updateModeIndicators();
            UI.initializeGame();
        });
    });
      document.getElementById('custom-difficulty').addEventListener('click', function() {
        Audio.playSound('click-sound');
        document.getElementById('menu-modal').style.display = 'none';
        // Update mode indicators when closing menu to open custom modal
        UI.updateModeIndicators();
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
    
    // Safe mode toggle
    document.getElementById('safe-mode-toggle').addEventListener('change', function() {
        Audio.playSound('click-sound');
        State.setSafeMode(this.checked);
        localStorage.setItem('safeMode', State.safeMode);
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

// Function to reset toggle states after closing the menu
function resetToggleStates() {
    const speedrunToggle = document.getElementById('speedrun-toggle');
    const safeModeToggle = document.getElementById('safe-mode-toggle');
    
    // Only reset if data attributes exist
    if (speedrunToggle.hasAttribute('data-original-state')) {
        // Restore original disabled state
        speedrunToggle.disabled = speedrunToggle.getAttribute('data-original-state') === 'disabled';
        safeModeToggle.disabled = safeModeToggle.getAttribute('data-original-state') === 'disabled';
        
        // Remove the temporary attributes
        speedrunToggle.removeAttribute('data-original-state');
        safeModeToggle.removeAttribute('data-original-state');
        
        // Remove visual indication
        speedrunToggle.parentElement.classList.remove('in-game-disabled');
        safeModeToggle.parentElement.classList.remove('in-game-disabled');
    }
}

// Load saved preferences from localStorage
function loadPreferences() {
    // Load audio preferences
    Audio.loadAudioPreferences();
    
    // Load controller preferences
    Controller.loadControllerSettings();    // Load speedrun mode preference
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
    
    // Load safe mode preference
    if (localStorage.getItem('safeMode') !== null) {
        State.setSafeMode(localStorage.getItem('safeMode') === 'true');
        document.getElementById('safe-mode-toggle').checked = State.safeMode;
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
        // Update the state's difficulty tracking
        State.setDifficulty(difficulty);
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
        
        // Restore UI state (game playing or menu view)
        if (gameState.inGameplayMode) {
            // If we were in gameplay mode, transition to gameplay UI
            UI.transitionToGameplay();
        } else {
            // If we were in menu mode, make sure we're in the main screen
            UI.resetToMainScreen();
        }
        
        return true;
    } catch (error) {
        console.error('Error loading saved game:', error);
        return false;
    }
}
