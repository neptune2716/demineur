/**
 * Game State Module
 * Manages the game state variables and provides functions to modify them
 */

import { defaultConfig } from './config.js';

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
}
