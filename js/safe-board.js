/**
 * Safe Board Generator Module
 * Provides algorithms for generating safe, solvable Minesweeper boards
 * without 50/50 chance situations
 */

import * as State from './state.js';

/**
 * Checks if a cell is on the board
 */
function isValidCell(x, y) {
    return x >= 0 && x < State.columns && y >= 0 && y < State.rows;
}

/**
 * Gets all valid neighboring cells
 */
function getNeighbors(x, y) {
    const neighbors = [];
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (isValidCell(nx, ny)) {
                neighbors.push({ x: nx, y: ny });
            }
        }
    }
    return neighbors;
}

/**
 * Simulates revealing a cell and returns the additional cells revealed
 */
function simulateReveal(board, x, y, revealed = new Set()) {
    const cellKey = `${x},${y}`;
    if (revealed.has(cellKey)) return revealed;
    
    revealed.add(cellKey);
    const cell = board[y][x];
    
    // If it's a mine, stop revealing
    if (cell.isMine) return revealed;
    
    // If it has adjacent mines, stop revealing
    if (cell.adjacentMines > 0) return revealed;
    
    // If it's an empty cell, reveal neighbors
    const neighbors = getNeighbors(x, y);
    for (const neighbor of neighbors) {
        simulateReveal(board, neighbor.x, neighbor.y, revealed);
    }
    
    return revealed;
}

/**
 * Counts adjacent mines for a given cell
 */
function countAdjacentMines(board, x, y) {
    let count = 0;
    const neighbors = getNeighbors(x, y);
    for (const neighbor of neighbors) {
        if (board[neighbor.y][neighbor.x].isMine) {
            count++;
        }
    }
    return count;
}

/**
 * Updates the adjacent mine counts for all cells in the board
 */
function updateAdjacentMineCounts(board) {
    for (let y = 0; y < State.rows; y++) {
        for (let x = 0; x < State.columns; x++) {
            if (!board[y][x].isMine) {
                board[y][x].adjacentMines = countAdjacentMines(board, x, y);
            }
        }
    }
}

/**
 * Checks if the board is solvable without guessing
 */
export function isBoardSolvable(board, safeZone) {
    // Clone the board for simulation
    const simulationBoard = JSON.parse(JSON.stringify(board));
    
    // First, ensure all cells in safe zone are revealed
    let revealed = new Set();
    for (const cell of safeZone) {
        revealed = simulateReveal(simulationBoard, cell.x, cell.y, revealed);
    }
    
    // Keep track of unrevealed non-mine cells
    let unrevealed = [];
    for (let y = 0; y < State.rows; y++) {
        for (let x = 0; x < State.columns; x++) {
            const cellKey = `${x},${y}`;
            if (!simulationBoard[y][x].isMine && !revealed.has(cellKey)) {
                unrevealed.push({ x, y });
            }
        }
    }
    
    // Simulate playing - repeatedly find cells that can be safely revealed
    let progress = true;
    while (progress && unrevealed.length > 0) {
        progress = false;
        
        // Find revealed cells with numbers to process
        const revealedWithNumbers = [];
        for (let y = 0; y < State.rows; y++) {
            for (let x = 0; x < State.columns; x++) {
                const cellKey = `${x},${y}`;
                if (revealed.has(cellKey) && simulationBoard[y][x].adjacentMines > 0) {
                    revealedWithNumbers.push({ x, y });
                }
            }
        }
        
        // Process each revealed cell with a number
        for (const cell of revealedWithNumbers) {
            const neighbors = getNeighbors(cell.x, cell.y);
            const unrevealedNeighbors = neighbors.filter(n => !revealed.has(`${n.x},${n.y}`));
            const flaggedNeighbors = unrevealedNeighbors.filter(n => simulationBoard[n.y][n.x].isMine);
            
            // If adjacent mines count equals flagged neighbors, reveal other neighbors
            if (simulationBoard[cell.y][cell.x].adjacentMines === flaggedNeighbors.length &&
                unrevealedNeighbors.length > flaggedNeighbors.length) {
                for (const neighbor of unrevealedNeighbors) {
                    if (!simulationBoard[neighbor.y][neighbor.x].isMine) {
                        revealed = simulateReveal(simulationBoard, neighbor.x, neighbor.y, revealed);
                        progress = true;
                    }
                }
            }
            
            // If unrevealed neighbors count equals remaining mines, flag them
            const remainingMines = simulationBoard[cell.y][cell.x].adjacentMines - flaggedNeighbors.length;
            if (remainingMines > 0 && remainingMines === unrevealedNeighbors.length - flaggedNeighbors.length) {
                for (const neighbor of unrevealedNeighbors) {
                    if (!simulationBoard[neighbor.y][neighbor.x].isMine) {
                        // This should be a mine but isn't, meaning this isn't solvable
                        return false;
                    }
                }
            }
        }
        
        // Update unrevealed list
        unrevealed = unrevealed.filter(cell => !revealed.has(`${cell.x},${cell.y}`));
    }
    
    // If we have unrevealed non-mine cells left, the board is not fully solvable
    return unrevealed.length === 0;
}

/**
 * Attempts to generate a solvable Minesweeper board
 */
export function generateSolvableBoard(safeZone) {
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
        attempts++;
        
        // Reset the board
        for (let y = 0; y < State.rows; y++) {
            for (let x = 0; x < State.columns; x++) {
                State.gameBoard[y][x].isMine = false;
                State.gameBoard[y][x].adjacentMines = 0;
            }
        }
        
        // Place mines randomly
        let minesPlaced = 0;
        while (minesPlaced < State.mineCount) {
            const x = Math.floor(Math.random() * State.columns);
            const y = Math.floor(Math.random() * State.rows);
            
            // Check if position is not in safe zone and doesn't already have a mine
            const isSafe = safeZone.some(pos => pos.x === x && pos.y === y);
            
            if (!isSafe && !State.gameBoard[y][x].isMine) {
                State.gameBoard[y][x].isMine = true;
                minesPlaced++;
            }
        }
        
        // Calculate adjacent mines
        updateAdjacentMineCounts(State.gameBoard);
        
        // Check if the board is solvable
        if (isBoardSolvable(State.gameBoard, safeZone)) {
            console.log(`Generated solvable board in ${attempts} attempts`);
            return true;
        }
    }
    
    console.warn(`Failed to generate solvable board after ${maxAttempts} attempts, using standard board`);
    return false;
}
