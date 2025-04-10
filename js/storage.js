/**
 * Storage Module
 * Manages saving and loading game state from localStorage
 */

import * as State from './state.js';

// Save current game state to localStorage
export function saveGameState() {
    // Only save if game is active
    if (!State.gameActive || State.firstClick) return;
    
    const gameState = {
        board: State.gameBoard,
        rows: State.rows,
        columns: State.columns,
        mineCount: State.mineCount,
        cellsRevealed: State.cellsRevealed,
        timer: State.timer,
        flaggedMines: State.flaggedMines,
        firstClick: false,
        // Save UI state - whether we're in game playing mode or menu
        inGameplayMode: document.body.classList.contains('game-playing')
    };
    
    localStorage.setItem('savedGameState', JSON.stringify(gameState));
    localStorage.setItem('hasSavedGame', 'true');
}

// Clear saved game state
export function clearSavedGame() {
    localStorage.removeItem('savedGameState');
    localStorage.removeItem('hasSavedGame');
}
