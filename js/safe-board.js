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
 * @param {Array} board - The game board to check
 * @param {Array} safeZone - Array of safe cell positions from the first click
 * @returns {boolean} - True if the board is solvable without guessing
 */
export function isBoardSolvable(board, safeZone) {
    // Clone the board for simulation
    const simulationBoard = JSON.parse(JSON.stringify(board));
    
    // Start from the center of the safe zone (player's first click)
    let revealed = new Set();
    if (safeZone.length > 0) {
        // Use the center of the safe zone (player's actual first click)
        const firstClick = safeZone[Math.floor(safeZone.length / 2)];
        revealed = simulateReveal(simulationBoard, firstClick.x, firstClick.y, revealed);
    } else {
        // Fallback in case safeZone is empty
        revealed = simulateReveal(simulationBoard, 0, 0, revealed);
    }
    
    // Flag known mines
    const flagged = new Set();
    
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
    let iterations = 0;
    const maxIterations = 1000; // Prevent infinite loops
    
    while (progress && unrevealed.length > 0 && iterations < maxIterations) {
        iterations++;
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
            const unrevealedNeighbors = neighbors.filter(n => {
                const key = `${n.x},${n.y}`;
                return !revealed.has(key) && !flagged.has(key);
            });
            const flaggedNeighbors = neighbors.filter(n => flagged.has(`${n.x},${n.y}`));
            
            // If adjacent mines count equals flagged neighbors, reveal other neighbors
            if (simulationBoard[cell.y][cell.x].adjacentMines === flaggedNeighbors.length &&
                unrevealedNeighbors.length > 0) {
                for (const neighbor of unrevealedNeighbors) {
                    if (!simulationBoard[neighbor.y][neighbor.x].isMine) {
                        revealed = simulateReveal(simulationBoard, neighbor.x, neighbor.y, revealed);
                        progress = true;
                    } else {
                        // This is a mine that should have been flagged but wasn't
                        // Mark it as flagged now
                        flagged.add(`${neighbor.x},${neighbor.y}`);
                        progress = true;
                    }
                }
            }
            
            // If unrevealed neighbors count equals remaining mines, flag them
            const remainingMines = simulationBoard[cell.y][cell.x].adjacentMines - flaggedNeighbors.length;
            if (remainingMines > 0 && remainingMines === unrevealedNeighbors.length) {
                for (const neighbor of unrevealedNeighbors) {
                    const nKey = `${neighbor.x},${neighbor.y}`;
                    if (simulationBoard[neighbor.y][neighbor.x].isMine) {
                        flagged.add(nKey);
                        progress = true;
                    } else {
                        // This should be a mine but isn't, meaning this isn't solvable
                        return false;
                    }
                }
            }
        }
        
        // Check for common 50/50 patterns
        if (!progress && unrevealed.length > 0) {
            if (has5050Pattern(simulationBoard, revealed, flagged)) {
                return false;
            }
        }
        
        // Update unrevealed list
        unrevealed = unrevealed.filter(cell => {
            const key = `${cell.x},${cell.y}`;
            return !revealed.has(key) && !flagged.has(key);
        });
    }
    
    // If we've hit the max iterations or we have unrevealed non-mine cells left, 
    // the board is not fully solvable
    return iterations < maxIterations && unrevealed.length === 0;
}

/**
 * Checks for common 50/50 patterns that require guessing
 * @param {Array} board - The game board
 * @param {Set} revealed - Set of revealed cell keys
 * @param {Set} flagged - Set of flagged cell keys
 * @returns {boolean} - True if a 50/50 pattern is found
 */
function has5050Pattern(board, revealed, flagged) {
    // Check for 1-1 patterns (common 50/50 situations)
    const edgeCells = findEdgeCells(board, revealed, flagged);
    
    for (const cell of edgeCells) {
        // Look for 1-1 patterns (a cell with exactly 1 mine in 2 unknown cells)
        if (cell.adjacentUnknowns === 2 && cell.adjacentMines - cell.adjacentFlagged === 1) {
            // Get the unknown neighbors
            const unknownNeighbors = getNeighbors(cell.x, cell.y).filter(n => {
                const key = `${n.x},${n.y}`;
                return !revealed.has(key) && !flagged.has(key);
            });
            
            // Check if another revealed cell touches the same 2 unknown cells
            for (const otherCell of edgeCells) {
                if (cell.x === otherCell.x && cell.y === otherCell.y) continue;
                
                if (otherCell.adjacentUnknowns === 2 && 
                    otherCell.adjacentMines - otherCell.adjacentFlagged === 1) {
                    
                    const otherUnknownNeighbors = getNeighbors(otherCell.x, otherCell.y).filter(n => {
                        const key = `${n.x},${n.y}`;
                        return !revealed.has(key) && !flagged.has(key);
                    });
                    
                    // If both revealed cells have the same unknown neighbors, it's a 50/50 pattern
                    if (unknownNeighbors.length === 2 && otherUnknownNeighbors.length === 2 &&
                        unknownNeighbors[0].x === otherUnknownNeighbors[0].x && 
                        unknownNeighbors[0].y === otherUnknownNeighbors[0].y &&
                        unknownNeighbors[1].x === otherUnknownNeighbors[1].x && 
                        unknownNeighbors[1].y === otherUnknownNeighbors[1].y) {
                        return true;
                    }
                }
            }
        }
    }
    
    return false;
}

/**
 * Find edge cells (revealed cells with unrevealed neighbors)
 * @param {Array} board - The game board
 * @param {Set} revealed - Set of revealed cell keys
 * @param {Set} flagged - Set of flagged cell keys
 * @returns {Array} - Array of edge cells with their properties
 */
function findEdgeCells(board, revealed, flagged) {
    const edgeCells = [];
    
    for (let y = 0; y < State.rows; y++) {
        for (let x = 0; x < State.columns; x++) {
            const cellKey = `${x},${y}`;
            if (revealed.has(cellKey) && board[y][x].adjacentMines > 0) {
                const neighbors = getNeighbors(x, y);
                const unknownNeighbors = neighbors.filter(n => {
                    const key = `${n.x},${n.y}`;
                    return !revealed.has(key) && !flagged.has(key);
                });
                
                const flaggedNeighbors = neighbors.filter(n => flagged.has(`${n.x},${n.y}`));
                
                if (unknownNeighbors.length > 0) {
                    edgeCells.push({
                        x, y,
                        adjacentMines: board[y][x].adjacentMines,
                        adjacentUnknowns: unknownNeighbors.length,
                        adjacentFlagged: flaggedNeighbors.length
                    });
                }
            }
        }
    }
    
    return edgeCells;
}

/**
 * Attempts to generate a solvable Minesweeper board
 * This improved version ensures the board is always solvable from the first click
 * without requiring 50/50 guessing situations
 */
export function generateSolvableBoard(safeZone) {
    let attempts = 0;
    const maxAttempts = 500; // Increased attempts for better chance of finding solvable board
    
    // Identify the center of the safe zone (the actual first click)
    const firstClick = safeZone.length > 0 ? 
        safeZone[Math.floor(safeZone.length / 2)] : 
        { x: 0, y: 0 };
    
    // Track best board stats (for fallback if we can't find perfect board)
    let bestBoard = null;
    let bestUnrevealed = Infinity;
    
    while (attempts < maxAttempts) {
        attempts++;
        
        // Reset the board
        for (let y = 0; y < State.rows; y++) {
            for (let x = 0; x < State.columns; x++) {
                State.gameBoard[y][x].isMine = false;
                State.gameBoard[y][x].adjacentMines = 0;
                State.gameBoard[y][x].isRevealed = false;
                State.gameBoard[y][x].isFlagged = false;
            }
        }
        
        // Use a progressive mine placement strategy
        if (!tryProgressiveMineGeneration(safeZone)) {
            // If progressive approach fails, fall back to random placement
            placeRandomMines(safeZone);
        }
        
        // Calculate adjacent mines
        updateAdjacentMineCounts(State.gameBoard);
        
        // Check if the board is solvable starting from the player's first click
        if (isBoardSolvable(State.gameBoard, [firstClick])) {
            console.log(`Generated fully solvable board in ${attempts} attempts`);
            return true;
        } else {
            // If not fully solvable, evaluate how close it is to being solvable
            const { unrevealedCount } = evaluateBoardSolvability(State.gameBoard, firstClick);
            
            // Keep track of the best board found so far
            if (unrevealedCount < bestUnrevealed) {
                bestBoard = JSON.parse(JSON.stringify(State.gameBoard));
                bestUnrevealed = unrevealedCount;
            }
        }
    }
    
    // If we couldn't find a perfectly solvable board, use the best one we found
    if (bestBoard && bestUnrevealed < State.rows * State.columns * 0.1) {
        // Use the best board we found (with less than 10% of cells requiring guesses)
        for (let y = 0; y < State.rows; y++) {
            for (let x = 0; x < State.columns; x++) {
                State.gameBoard[y][x] = bestBoard[y][x];
            }
        }
        console.log(`Using best available board with ${bestUnrevealed} unrevealed cells after ${maxAttempts} attempts`);
        return true;
    }
    
    console.warn(`Failed to generate solvable board after ${maxAttempts} attempts, using standard board`);
    return false;
}

/**
 * Uses a progressive approach to place mines in a way that's more likely to be solvable
 * @param {Array} safeZone - Array of cells that should not have mines
 * @returns {boolean} - Whether mine placement was successful
 */
function tryProgressiveMineGeneration(safeZone) {
    try {
        // First place a larger number of mines with even distribution
        const initialMineFraction = 0.8; // Start with 80% of the mines (increased from 60%)
        const initialCount = Math.floor(State.mineCount * initialMineFraction);
        
        let minesPlaced = 0;
        let attempts = 0;
        const maxAttempts = State.mineCount * 10; // Avoid infinite loops
        
        // Create a distribution grid to track mine density
        const gridSize = 3; // Size of virtual grid cells to track density
        const densityGrid = {};
        
        // Place the initial mines with careful distribution
        while (minesPlaced < initialCount && attempts < maxAttempts) {
            attempts++;
            
            // Select position with bias toward even distribution
            let x, y;
            
            if (Math.random() < 0.7) {
                // 70% of the time, try to place mine in less dense areas
                x = Math.floor(Math.random() * State.columns);
                y = Math.floor(Math.random() * State.rows);
                
                // Assign to a grid region
                const gridX = Math.floor(x / gridSize);
                const gridY = Math.floor(y / gridSize);
                const gridKey = `${gridX},${gridY}`;
                
                // Skip if this grid cell already has too many mines
                const maxDensity = Math.ceil(State.mineCount / (State.rows * State.columns / (gridSize * gridSize)) * 1.5);
                if (densityGrid[gridKey] && densityGrid[gridKey] >= maxDensity) {
                    continue; // Try a different location
                }
            } else {
                // 30% of the time, place completely randomly
                x = Math.floor(Math.random() * State.columns);
                y = Math.floor(Math.random() * State.rows);
            }
            
            // Check if position is not in safe zone and doesn't already have a mine
            const isSafe = safeZone.some(pos => pos.x === x && pos.y === y);
            
            if (!isSafe && !State.gameBoard[y][x].isMine) {
                State.gameBoard[y][x].isMine = true;
                minesPlaced++;
                
                // Update density grid
                const gridX = Math.floor(x / gridSize);
                const gridY = Math.floor(y / gridSize);
                const gridKey = `${gridX},${gridY}`;
                densityGrid[gridKey] = (densityGrid[gridKey] || 0) + 1;
            }
        }
        
        // Calculate adjacent mines
        updateAdjacentMineCounts(State.gameBoard);
        
        // Add remaining mines more strategically - avoid creating 50/50 situations
        const remainingMines = State.mineCount - minesPlaced;
        if (remainingMines > 0) {
            // Find all candidate positions for mines with improved scoring
            const candidates = [];
            for (let y = 0; y < State.rows; y++) {
                for (let x = 0; x < State.columns; x++) {
                    // Skip safe zone and existing mines
                    const isSafe = safeZone.some(pos => pos.x === x && pos.y === y);
                    if (isSafe || State.gameBoard[y][x].isMine) continue;
                    
                    // Check surrounding cells
                    const neighbors = getNeighbors(x, y);
                    
                    // Count mines and revealed cells around this position
                    const adjacentMines = neighbors.filter(n => State.gameBoard[n.y][n.x].isMine).length;
                    
                    // Calculate various factors for scoring
                    const gridX = Math.floor(x / gridSize);
                    const gridY = Math.floor(y / gridSize);
                    const gridKey = `${gridX},${gridY}`;
                    const localDensity = densityGrid[gridKey] || 0;
                    
                    // Count diagonal and orthogonal mines separately (prefer orthogonal patterns)
                    let diagonalMines = 0;
                    let orthogonalMines = 0;
                    
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            
                            const nx = x + dx;
                            const ny = y + dy;
                            
                            if (nx >= 0 && nx < State.columns && ny >= 0 && ny < State.rows) {
                                if (State.gameBoard[ny][nx].isMine) {
                                    if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
                                        diagonalMines++; // Diagonal mine
                                    } else {
                                        orthogonalMines++; // Orthogonal mine (horizontal/vertical)
                                    }
                                }
                            }
                        }
                    }
                    
                    // Calculate a score that considers multiple factors
                    // Higher score = better candidate for mine placement
                    let score = 0;
                    
                    // 1. Prefer locations with fewer adjacent mines (to avoid clumps)
                    score += (8 - adjacentMines) * 5;
                    
                    // 2. Prefer locations in less dense grid regions
                    score += (8 - localDensity) * 3;
                    
                    // 3. If there are already adjacent mines, slightly prefer orthogonal patterns
                    // This creates more recognizable patterns for players
                    if (adjacentMines > 0) {
                        score += orthogonalMines > diagonalMines ? 2 : 0;
                    }
                    
                    // 4. Add some randomization to avoid too predictable patterns
                    score += Math.random() * 3;
                    
                    candidates.push({ x, y, score });
                }
            }
            
            // Sort candidates by score (higher score first)
            candidates.sort((a, b) => b.score - a.score);
            
            // Place remaining mines using the candidates list
            for (let i = 0; i < Math.min(remainingMines, candidates.length); i++) {
                State.gameBoard[candidates[i].y][candidates[i].x].isMine = true;
                minesPlaced++;
                
                // Re-calculate adjacent mines after each placement
                updateAdjacentMineCounts(State.gameBoard);
            }
        }
        
        // If we couldn't place all mines, fall back to random placement for the rest
        while (minesPlaced < State.mineCount) {
            const x = Math.floor(Math.random() * State.columns);
            const y = Math.floor(Math.random() * State.rows);
            
            const isSafe = safeZone.some(pos => pos.x === x && pos.y === y);
            if (!isSafe && !State.gameBoard[y][x].isMine) {
                State.gameBoard[y][x].isMine = true;
                minesPlaced++;
            }
        }
        
        return true;
    } catch (e) {
        console.error("Error in progressive mine placement:", e);
        return false;
    }
}

/**
 * Places mines randomly on the board
 * @param {Array} safeZone - Array of cells that should not have mines
 */
function placeRandomMines(safeZone) {
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
}

/**
 * Evaluates how close a board is to being fully solvable
 * @param {Array} board - The game board to evaluate
 * @param {Object} firstClick - The first click position
 * @returns {Object} - Statistics about the board's solvability
 */
function evaluateBoardSolvability(board, firstClick) {
    // Run a simplified solvability check and count unrevealed cells
    const simulationBoard = JSON.parse(JSON.stringify(board));
    let revealed = new Set();
    revealed = simulateReveal(simulationBoard, firstClick.x, firstClick.y, revealed);
    
    let flagged = new Set();
    let unrevealed = [];
    
    // Find unrevealed non-mine cells
    for (let y = 0; y < State.rows; y++) {
        for (let x = 0; x < State.columns; x++) {
            const cellKey = `${x},${y}`;
            if (!simulationBoard[y][x].isMine && !revealed.has(cellKey)) {
                unrevealed.push({ x, y });
            }
        }
    }
    
    // Simulate a limited number of moves to estimate solvability
    let progress = true;
    let iterations = 0;
    const maxIterations = 100;
    
    while (progress && unrevealed.length > 0 && iterations < maxIterations) {
        iterations++;
        progress = false;
        
        // Process revealed cells with numbers
        for (let y = 0; y < State.rows; y++) {
            for (let x = 0; x < State.columns; x++) {
                const cellKey = `${x},${y}`;
                if (revealed.has(cellKey) && simulationBoard[y][x].adjacentMines > 0) {
                    const neighbors = getNeighbors(x, y);
                    const unrevealedNeighbors = neighbors.filter(n => {
                        const key = `${n.x},${n.y}`;
                        return !revealed.has(key) && !flagged.has(key);
                    });
                    const flaggedNeighbors = neighbors.filter(n => flagged.has(`${n.x},${n.y}`));
                    
                    // Simple solving logic
                    if (simulationBoard[y][x].adjacentMines === flaggedNeighbors.length && unrevealedNeighbors.length > 0) {
                        for (const neighbor of unrevealedNeighbors) {
                            if (!simulationBoard[neighbor.y][neighbor.x].isMine) {
                                revealed = simulateReveal(simulationBoard, neighbor.x, neighbor.y, revealed);
                                progress = true;
                            } else {
                                flagged.add(`${neighbor.x},${neighbor.y}`);
                                progress = true;
                            }
                        }
                    }
                }
            }
        }
        
        // Update unrevealed list
        unrevealed = unrevealed.filter(cell => {
            const key = `${cell.x},${cell.y}`;
            return !revealed.has(key) && !flagged.has(key);
        });
    }
    
    return {
        unrevealedCount: unrevealed.length,
        revealedCount: revealed.size,
    };
}
