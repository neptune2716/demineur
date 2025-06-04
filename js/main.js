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
import * as Statistics from './statistics.js'; // <-- Added this import

// Initialize the game when DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadPreferences();
    ThemeCustomizer.initColorCustomizer();
    StatisticsUI.initStatisticsUI();
    Tutorial.initTutorial();

    // --- Game State Loading Logic ---
    let gameLoaded = false;

    // 1. Check for saved Zen Game State first
    if (localStorage.getItem(Storage.HAS_SAVED_ZEN_GAME_KEY) === 'true') {
        console.log("Attempting to load saved Zen game...");
        if (loadAndResumeZenGame()) {
            console.log("Saved Zen game loaded successfully.");
            gameLoaded = true;
        } else {
            console.warn("Failed to load saved Zen game, clearing state.");
            Storage.clearZenGameState(); // Clear potentially corrupted state
        }
    }

    // 2. If no Zen game loaded, check for standard saved game
    if (!gameLoaded && localStorage.getItem('hasSavedGame') === 'true') {
        console.log("Attempting to load standard saved game...");
        if (loadStandardGameState()) { // Renamed original loadGameState to loadStandardGameState
            console.log("Standard saved game loaded successfully.");
            gameLoaded = true;
        } else {
            console.warn("Failed to load standard saved game, clearing state.");
            Storage.clearSavedGame(); // Clear potentially corrupted state
        }
    }

    // 3. If no game was loaded, initialize normally
    if (!gameLoaded) {
        console.log("No saved game found or loaded, initializing new game (Easy default).");
        // Default to Easy mode if no game loaded
        if (Config.difficulties['easy']) {
            const { rows, columns, mines } = Config.difficulties['easy'];
            State.setGameDimensions(rows, columns, mines);
            State.setDifficulty('easy'); // Explicitly set difficulty state
        }
        UI.initializeGame(); // Initialize UI for a new game
    }
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
    // Zen Mode button
    document.getElementById('zen-mode-button').addEventListener('click', function() {
        Audio.playSound('click-sound');
        UI.showZenStartModal();
    });
    // Close menus when clicking outside
    window.addEventListener('click', function(event) {
        const menuModal = document.getElementById('menu-modal');
        const customModal = document.getElementById('custom-modal');
        const resultModal = document.getElementById('result-modal');
        const tutorialModal = document.getElementById('tutorial-modal');
        const pauseMenu = document.getElementById('pause-menu');
        const zenStartModal = document.getElementById('zen-start-modal');
        const zenLossModal = document.getElementById('zen-loss-modal');
        
        if (event.target === menuModal) {
            Audio.playSound('click-sound');
            menuModal.style.display = 'none';
            // Update mode indicators when clicking outside to close
            UI.updateModeIndicators();
            resetToggleStates();
        } else if (event.target === customModal) {
            Audio.playSound('click-sound');
            customModal.style.display = 'none';
        } else if (event.target === pauseMenu) {
            Audio.playSound('click-sound');
            UI.hidePauseMenu();
        } else if (event.target === tutorialModal) {
            Audio.playSound('click-sound');
            tutorialModal.style.display = 'none';
            customModal.style.display = 'none';
        } else if (event.target === resultModal) {
            Audio.playSound('click-sound');
            resultModal.style.display = 'none';
            UI.initializeGame();
        } else if (event.target === zenStartModal) {
            Audio.playSound('click-sound');
            UI.hideZenStartModal();
        } else if (event.target === zenLossModal) {
            Audio.playSound('click-sound');
            UI.hideZenLossModal();
        }
    });    // In-game controls
    document.getElementById('new-game-in-game').addEventListener('click', function() {
        Audio.playSound('click-sound');
        // Clear saved game state first
        Storage.clearSavedGame();
        // Then reset to main screen and initialize the new game
        UI.resetToMainScreen();
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
        // Don't hide the pause menu when opening options
        // UI.hidePauseMenu(); -- removed
        
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
    });    document.getElementById('quit-game').addEventListener('click', function() {
        Audio.playSound('click-sound');
        UI.hidePauseMenu();
        
        // If in Zen Mode, save the current state before quitting (even on first click)
        if (State.isZenMode && State.gameActive) {
            Storage.saveZenGameState(); // Save the full Zen game state
            Storage.saveZenProgress(); // Also save the level progress
            console.log("Zen Mode game saved for later continuation");
        }
        
        // Reset to main screen and reinitialize the game
        UI.resetToMainScreen();
        UI.initializeGame();
    });
    
    document.querySelectorAll('.difficulty').forEach(button => {        
        button.addEventListener('click', function() {
            Audio.playSound('click-sound');
            const difficulty = this.dataset.difficulty;
            // Ensure Zen Mode is off when selecting a standard difficulty
            State.setZenMode(false);
            Storage.clearZenProgress(); // Clear any saved Zen progress
            setDifficulty(difficulty);
            document.getElementById('menu-modal').style.display = 'none';
            // Update mode indicators when closing menu via difficulty selection
            UI.updateModeIndicators();
            UI.initializeGame();
        });
    });
    document.getElementById('custom-difficulty').addEventListener('click', function() {
        Audio.playSound('click-sound');
        // Ensure Zen Mode is off when going to custom
        State.setZenMode(false);
        Storage.clearZenProgress();
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
        
        // Check if we were in Zen Mode
        if (State.isZenMode) {
            // For Zen Mode: continue at the current level
            UI.startZenLevel(State.zenLevel);
        } else {
            // For regular games: start a new game with current settings
            UI.initializeGame();
        }
    });    // Zen Mode Start Modal Buttons
    document.getElementById('zen-start-new').addEventListener('click', function() {
        Audio.playSound('click-sound');
        UI.hideZenStartModal();
        Storage.clearZenProgress(); // Clear any old progress
        Statistics.resetZenRun(); // Reset the current run stats
        
        // Immediately change title to Zen Mode before starting the level
        document.getElementById('game-title').textContent = 'Zen Mode';
        
        UI.startZenLevel(1);
    });    document.getElementById('zen-continue').addEventListener('click', function() {
        Audio.playSound('click-sound');
        UI.hideZenStartModal();
        
        // First check if there's a saved Zen game state (complete board state)
        if (localStorage.getItem(Storage.HAS_SAVED_ZEN_GAME_KEY) === 'true') {
            // Load the complete saved game state
            if (loadAndResumeZenGame()) {
                console.log("Successfully resumed saved Zen game");
                return; // Exit early as game is already loaded
            }
        }
        
        // If no saved game state or loading failed, fall back to just loading the level
        const savedLevel = Storage.loadZenProgress() || 1;
        
        // Immediately change title to Zen Mode before starting the level
        document.getElementById('game-title').textContent = 'Zen Mode';
        
        UI.startZenLevel(savedLevel);
    });

    document.getElementById('zen-start-cancel').addEventListener('click', function() {
        Audio.playSound('click-sound');
        UI.hideZenStartModal();
    });

    // Zen Mode Loss Modal Buttons
    document.getElementById('zen-loss-replay').addEventListener('click', function() {
        Audio.playSound('click-sound');
        UI.hideZenLossModal();
        Statistics.markZenRespawnUsed(); // Mark that a respawn was used
        // Replay the current level (which is stored in State.zenLevel)
        UI.startZenLevel(State.zenLevel);
    });

    document.getElementById('zen-loss-restart').addEventListener('click', function() {
        Audio.playSound('click-sound');
        UI.hideZenLossModal();
        Storage.clearZenProgress(); // Clear progress on full restart
        Statistics.resetZenRun(); // Reset the current run stats
        UI.startZenLevel(1);
    });

    document.getElementById('zen-loss-menu').addEventListener('click', function() {
        Audio.playSound('click-sound');
        UI.hideZenLossModal();
        UI.resetToMainScreen(); // This now handles resetting Zen state
        // Re-initialize with default difficulty after returning to menu
        setDifficulty('easy'); // Or load last used non-zen difficulty
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
    }
}

// Load STANDARD game state from localStorage (renamed from loadGameState)
function loadStandardGameState() {
    const savedState = Storage.loadGameState(); // Use the loader from storage.js
    if (!savedState) return false;

    try {
        // Restore game dimensions and state
        State.setGameDimensions(savedState.rows, savedState.columns, savedState.mineCount);
        State.setCellsRevealed(savedState.cellsRevealed);
        State.setTimer(savedState.timer);
        State.setFlaggedMines(savedState.flaggedMines);
        State.setFirstClick(false); // Saved games are never first click
        State.setGameActive(true);
        State.setDifficulty(savedState.difficulty || 'custom'); // Restore difficulty
        State.setSpeedrunMode(savedState.speedrunMode || false);
        State.setSafeMode(savedState.safeMode || false);
        State.setZenMode(false); // Ensure Zen mode is off

        // Update CSS variables for grid
        document.documentElement.style.setProperty('--rows', State.rows);
        document.documentElement.style.setProperty('--columns', State.columns);

        // Restore the game board
        State.setGameBoard(savedState.board);

        // Update UI
        UI.updateMinesCounter(); // Use the function to correctly calculate remaining flags
        UI.timerElement.textContent = State.timer;
        UI.updateModeIndicators(); // Update main screen indicators
        UI.updateDifficultyIndicator(); // Update difficulty label

        // Render the board
        UI.renderSavedBoard();

        // Start timer
        UI.startTimer();
        document.body.classList.add('game-active');

        // Restore UI state (game playing or menu view)
        if (savedState.inGameplayMode) {
            UI.transitionToGameplay();
        } else {
            // Should ideally not happen if saved correctly, but reset just in case
            UI.resetToMainScreen();
        }

        return true;
    } catch (error) {
        console.error('Error applying loaded standard game state:', error);
        Storage.clearSavedGame(); // Clear corrupted state
        return false;
    }
}

// Load and resume ZEN game state from localStorage
function loadAndResumeZenGame() {
    const zenGameState = Storage.loadZenGameState();
    if (!zenGameState) return false;    try {
        // Restore game dimensions and state
        State.setGameDimensions(zenGameState.rows, zenGameState.columns, zenGameState.mineCount);
        State.setCellsRevealed(zenGameState.cellsRevealed);
        State.setTimer(zenGameState.timer);
        State.setFlaggedMines(zenGameState.flaggedMines);
        
        // Properly restore first click state from saved state
        // This ensures if we quit before making our first click, we'll still generate a new board when we come back
        State.setFirstClick(zenGameState.firstClick !== undefined ? zenGameState.firstClick : false);
        
        State.setGameActive(true);
        State.setZenMode(true); // Set Zen mode ON
        State.setZenLevel(zenGameState.zenLevel);
        State.setDifficulty('zen'); // Set difficulty state for Zen
        // Speedrun/Safe modes are implicitly handled by Zen mode logic

        // Update CSS variables for grid
        document.documentElement.style.setProperty('--rows', State.rows);
        document.documentElement.style.setProperty('--columns', State.columns);

        // Restore the game board
        State.setGameBoard(zenGameState.board);

        // Update UI
        UI.updateMinesCounter();
        UI.timerElement.textContent = State.timer;
        UI.updateZenLevelIndicator(); // Show and update Zen level
        document.getElementById('game-title').textContent = 'Zen Mode'; // Set title
        UI.updateModeIndicators(); // Hide standard mode indicators

        // Render the board
        UI.renderSavedBoard();

        // Start timer
        UI.startTimer();
        document.body.classList.add('game-active');

        // Always transition to gameplay for a saved Zen game
        UI.transitionToGameplay();

        return true;
    } catch (error) {
        console.error('Error applying loaded Zen game state:', error);
        Storage.clearZenGameState(); // Clear corrupted state
        return false;
    }
}
