/**
 * Storage Module
 * Manages saving and loading game state from localStorage
 */

import * as State from './state.js';

const GAME_STATE_KEY = 'savedGameState';
const HAS_SAVED_GAME_KEY = 'hasSavedGame';
const ZEN_PROGRESS_KEY = 'zenModeProgress'; // Keep for stats, but not for active game state
const ZEN_GAME_STATE_KEY = 'savedZenGameState';
export const HAS_SAVED_ZEN_GAME_KEY = 'hasSavedZenGame'; // Export the key name

// Save current game state to localStorage (for non-Zen modes)
export function saveGameState() {
    // Only save if game is active, not first click, AND NOT in Zen Mode
    if (!State.gameActive || State.firstClick || State.isZenMode) {
        // Clear any potentially stale non-zen save if we are in zen mode or game isn't active
        if (localStorage.getItem(HAS_SAVED_GAME_KEY)) {
             clearSavedGame();
        }
        return;
    }

    const gameState = {
        board: State.gameBoard,
        rows: State.rows,
        columns: State.columns,
        mineCount: State.mineCount,
        cellsRevealed: State.cellsRevealed,
        timer: State.timer,
        flaggedMines: State.flaggedMines,
        firstClick: false,
        difficulty: State.difficulty, // Save difficulty
        speedrunMode: State.speedrunMode, // Save modes
        safeMode: State.safeMode,
        inGameplayMode: document.body.classList.contains('game-playing')
    };

    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
    localStorage.setItem(HAS_SAVED_GAME_KEY, 'true');
}

// Load standard game state
export function loadGameState() {
    const savedStateString = localStorage.getItem(GAME_STATE_KEY);
    if (!savedStateString) {
        return null;
    }
    try {
        const parsedState = JSON.parse(savedStateString);
        return parsedState;
    } catch (error) {
        console.error('[Storage] Error parsing saved game state JSON:', error);
        clearSavedGame(); // Clear corrupted state
        return null;
    }
}

// Clear saved game state (for non-Zen modes)
export function clearSavedGame() {
    localStorage.removeItem(GAME_STATE_KEY);
    localStorage.removeItem(HAS_SAVED_GAME_KEY);
}

// --- Zen Mode Progress Storage (Level Only) ---

/**
 * Saves the current Zen Mode level to localStorage. (Potentially deprecated for active state)
 */
export function saveZenProgress() {
    // This function might become less relevant if full state is saved,
    // but keep it for now as it might be used elsewhere (e.g., statistics).
    if (!State.isZenMode) return;
    const progress = {
        level: State.zenLevel
    };
    localStorage.setItem(ZEN_PROGRESS_KEY, JSON.stringify(progress));
}

/**
 * Loads the Zen Mode level from localStorage. (Potentially deprecated for active state)
 * @returns {number | null} The saved level, or null if no progress exists.
 */
export function loadZenProgress() {
    const savedProgress = localStorage.getItem(ZEN_PROGRESS_KEY);
    if (savedProgress) {
        try {
            const progress = JSON.parse(savedProgress);
            return progress.level || 1; // Return saved level or default to 1
        } catch (e) {
            console.error("Error loading Zen progress:", e);
            return null;
        }
    }
    return null;
}

/**
 * Clears the saved Zen Mode progress (level only) from localStorage. (Potentially deprecated for active state)
 */
export function clearZenProgress() {
    localStorage.removeItem(ZEN_PROGRESS_KEY);
}

// --- Zen Mode Game State Storage (Full State) ---

/**
 * Saves the current Zen Mode game state (board, level, timer, etc.) to localStorage.
 */
export function saveZenGameState() {
    // Only save if in Zen Mode and game is active
    if (!State.isZenMode || !State.gameActive) {
        // If not saving, ensure no stale save flag exists
        if (localStorage.getItem(HAS_SAVED_ZEN_GAME_KEY)) {
            clearZenGameState();
        }
        return;
    }

    const zenGameState = {
        board: State.gameBoard,
        rows: State.rows,
        columns: State.columns,
        mineCount: State.mineCount,
        cellsRevealed: State.cellsRevealed,
        timer: State.timer,
        flaggedMines: State.flaggedMines, // Save flagged mine count for consistency
        zenLevel: State.zenLevel,
        firstClick: State.firstClick, // Preserve first click state
        inGameplayMode: true // Assume saving happens during gameplay or pause
    };    localStorage.setItem(ZEN_GAME_STATE_KEY, JSON.stringify(zenGameState));
    localStorage.setItem(HAS_SAVED_ZEN_GAME_KEY, 'true'); // Set the flag
}

/**
 * Loads the saved Zen Mode game state from localStorage.
 * @returns {Object | null} The saved Zen game state object, or null if none exists or is invalid.
 */
export function loadZenGameState() {
    const savedState = localStorage.getItem(ZEN_GAME_STATE_KEY);
    if (!savedState) return null;
    try {
        const gameState = JSON.parse(savedState);
        // Basic validation
        if (gameState && gameState.board && typeof gameState.zenLevel === 'number') {
            return gameState;
        }
        throw new Error("Invalid Zen game state format");
    } catch (error) {
        console.error('Error loading saved Zen game state:', error);
        clearZenGameState(); // Clear corrupted state
        return null;
    }
}

/**
 * Clears the saved Zen Mode game state from localStorage.
 */
export function clearZenGameState() {    localStorage.removeItem(ZEN_GAME_STATE_KEY);
    localStorage.removeItem(HAS_SAVED_ZEN_GAME_KEY); // Clear the flag
}
