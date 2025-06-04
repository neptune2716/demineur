/**
 * Game State Module
 * Manages the game state variables and provides functions to modify them
 */

import { defaultConfig, difficulties } from './config.js';

// Game state variables
export let gameBoard = [];
export let rows = defaultConfig.rows;
export let columns = defaultConfig.columns;
export let mineCount = defaultConfig.mineCount;
export let cellsRevealed = 0;
export let gameActive = false;
export let firstClick = true;
export let timer = 0;
export let timerInterval;
export let flaggedMines = 0;
export let speedrunMode = true;
export let safeMode = false; // Prevent 50/50 chance situations
// Store the user's preference before Zen Mode overrides it
export let previousSafeMode = false;
export let difficulty = 'easy'; // Track current difficulty
export let isZenMode = false; // Track if Zen Mode is active
export let zenLevel = 1; // Track current Zen Mode level

// State setter methods
export function setFirstClick(value) {
    firstClick = value;
}

export function setGameActive(value) {
    gameActive = value;
}

export function setSpeedrunMode(value) {
    speedrunMode = value;
}

export function setSafeMode(value) {
    safeMode = value;
}

export function setPreviousSafeMode(value) {
    previousSafeMode = value;
}

export function incrementCellsRevealed() {
    cellsRevealed++;
}

export function setCellsRevealed(value) {
    cellsRevealed = value;
}

export function setTimer(value) {
    timer = value;
}

export function incrementTimer() {
    timer++;
}

export function setFlaggedMines(value) {
    flaggedMines = value;
}

export function incrementFlaggedMines() {
    flaggedMines++;
}

export function decrementFlaggedMines() {
    flaggedMines--;
}

export function setGameBoard(board) {
    gameBoard = board;
}

export function setDifficulty(value) {
    difficulty = value;
}

export function setZenMode(value) {
    isZenMode = value;
}

export function setZenLevel(value) {
    zenLevel = value;
}

export function incrementZenLevel() {
    zenLevel++;
}

export function setTimerInterval(interval) {
    timerInterval = interval;
}

// Reset game state to default values
export function resetGameState() {
    gameActive = true;
    firstClick = true;
    cellsRevealed = 0;
    flaggedMines = 0;
    timer = 0;

    // Don't reset zen mode status here, handle it separately
    // isZenMode = false;
    // zenLevel = 1;

    // Create empty board
    gameBoard = Array.from({ length: rows }, () => 
        Array.from({ length: columns }, () => ({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            adjacentMines: 0
        }))
    );
    
    return gameBoard;
}

// Update game dimensions
export function setGameDimensions(newRows, newColumns, newMineCount) {
    rows = newRows;
    columns = newColumns;
    mineCount = newMineCount;

    // If not in Zen mode, determine difficulty based on dimensions
    if (!isZenMode) {
        let foundDifficulty = 'custom';
        // Use the properly imported difficulties object
        if (difficulties) {
            for (const [diffName, config] of Object.entries(difficulties)) {
                if (config.rows === newRows && config.columns === newColumns && config.mines === newMineCount) {
                    foundDifficulty = diffName;
                    break;
                }
            }
        } else {
            console.warn("difficulties not available in setGameDimensions");
        }
        setDifficulty(foundDifficulty);
    } else {
        // In Zen mode, difficulty is 'zen'
        setDifficulty('zen');
    }
}
