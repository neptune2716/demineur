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
    const processQueue = new Set(); // Use Set for unique cells
    
    if (safeZone.length > 0) {
        const firstClick = safeZone[Math.floor(safeZone.length / 2)];
        const initialRevealed = simulateReveal(simulationBoard, firstClick.x, firstClick.y, new Set());
        initialRevealed.forEach(key => {
            revealed.add(key);
            const [xStr, yStr] = key.split(',');
            const x = parseInt(xStr, 10);
            const y = parseInt(yStr, 10);
            if (simulationBoard[y][x].adjacentMines > 0) {
                 processQueue.add(key); // Add initial frontier cells
            }
        });
    } else {
        // Fallback
        const initialRevealed = simulateReveal(simulationBoard, 0, 0, new Set());
         initialRevealed.forEach(key => {
            revealed.add(key);
            const [xStr, yStr] = key.split(',');
            const x = parseInt(xStr, 10);
            const y = parseInt(yStr, 10);
            if (simulationBoard[y][x].adjacentMines > 0) {
                 processQueue.add(key);
            }
        });
    }
    
    const flagged = new Set();
    
    let unrevealedCount = 0;
    for (let y = 0; y < State.rows; y++) {
        for (let x = 0; x < State.columns; x++) {
            if (!simulationBoard[y][x].isMine) {
                unrevealedCount++;
            }
        }
    }
    unrevealedCount -= revealed.size; 

    let iterations = 0;
    const maxIterations = State.rows * State.columns * 3; // Allow more iterations for complex boards

    // --- Revised Solver Loop --- 
    while (processQueue.size > 0 && unrevealedCount > 0 && iterations < maxIterations) {
        iterations++;
        
        // Get a cell key from the queue to process
        const cellKey = processQueue.values().next().value;
        processQueue.delete(cellKey); // Remove it

        // Double check if it's still relevant (might have been processed via reveal)
        if (!revealed.has(cellKey)) continue; 

        const [xStr, yStr] = cellKey.split(',');
        const x = parseInt(xStr, 10);
        const y = parseInt(yStr, 10);
        const cell = simulationBoard[y][x];

        // Skip 0-cells (shouldn't be in queue, but safety check)
        if (cell.adjacentMines === 0) continue; 

        const neighbors = getNeighbors(x, y);
        const unrevealedNeighbors = [];
        const flaggedNeighbors = [];
        const revealedNeighbors = []; // Keep track of revealed neighbors

        for (const n of neighbors) {
            const nKey = `${n.x},${n.y}`;
            if (flagged.has(nKey)) {
                flaggedNeighbors.push(n);
            } else if (revealed.has(nKey)) {
                revealedNeighbors.push(n); // Store revealed neighbors
            } else {
                unrevealedNeighbors.push(n);
            }
        }

        const remainingMines = cell.adjacentMines - flaggedNeighbors.length;
        let madeChange = false; // Track changes made based on *this* cell

        // Rule 1: Flagging
        if (remainingMines > 0 && remainingMines === unrevealedNeighbors.length) {
            for (const neighbor of unrevealedNeighbors) {
                const nKey = `${neighbor.x},${neighbor.y}`;
                if (!flagged.has(nKey)) { 
                    if (!simulationBoard[neighbor.y][neighbor.x].isMine) return false; // Contradiction
                    
                    flagged.add(nKey);
                    madeChange = true;
                    // Add revealed neighbors of the *flagged* cell to the queue for re-evaluation
                    getNeighbors(neighbor.x, neighbor.y).forEach(nn => {
                        const nnKey = `${nn.x},${nn.y}`;
                        if (revealed.has(nnKey) && simulationBoard[nn.y][nn.x].adjacentMines > 0) {
                            processQueue.add(nnKey); 
                        }
                    });
                }
            }
        }
        // Rule 2: Revealing
        else if (remainingMines === 0 && unrevealedNeighbors.length > 0) {
             for (const neighbor of unrevealedNeighbors) {
                const nKey = `${neighbor.x},${neighbor.y}`;
                // Check if already revealed (might happen if revealed through another path)
                if (revealed.has(nKey)) continue;

                if (simulationBoard[neighbor.y][neighbor.x].isMine) return false; // Contradiction
                
                // Use a temporary set to capture only newly revealed cells by this specific reveal action
                const tempRevealed = new Set();
                simulateReveal(simulationBoard, neighbor.x, neighbor.y, tempRevealed);

                let revealedCountIncrease = 0;
                tempRevealed.forEach(nrKey => {
                     if (!revealed.has(nrKey)) { // Process only if truly new
                        revealed.add(nrKey);
                        revealedCountIncrease++;
                        madeChange = true; // Mark change

                        const [nrxStr, nryStr] = nrKey.split(',');
                        const nrx = parseInt(nrxStr, 10);
                        const nry = parseInt(nryStr, 10);

                        // Add the newly revealed cell itself to queue if it's numbered
                        if (simulationBoard[nry][nrx].adjacentMines > 0) {
                            processQueue.add(nrKey);
                        }
                        // Add its revealed, numbered neighbors to the queue
                        getNeighbors(nrx, nry).forEach(nn => {
                            const nnKey = `${nn.x},${nn.y}`;
                            // Check if neighbor is revealed AND numbered
                            if (revealed.has(nnKey) && simulationBoard[nn.y][nn.x].adjacentMines > 0) {
                                processQueue.add(nnKey);
                            }
                        });
                    }
                });
                unrevealedCount -= revealedCountIncrease;
            }
        }

        // If a change was made (flag or reveal), the revealed neighbors of the *current* cell 
        // might now provide new information, so add them back to the queue for re-evaluation.
        if (madeChange) {
             revealedNeighbors.forEach(rn => {
                 const rnKey = `${rn.x},${rn.y}`;
                 // Only add if it's numbered (0s don't provide info)
                 if (simulationBoard[rn.y][rn.x].adjacentMines > 0) {
                    processQueue.add(rnKey);
                 }
             });
        }

    } // End while loop

    // Check if stuck before finishing
    if (unrevealedCount > 0 && iterations < maxIterations) {
        // Still unrevealed cells left, but queue is empty. Check for 50/50.
        if (has5050Pattern(simulationBoard, revealed, flagged)) {
           return false; // Known 50/50 pattern
        }
        // If no known 50/50, but still stuck, assume unsolvable by this basic logic
        // console.log(`Solver stuck with ${unrevealedCount} unrevealed cells.`);
        return false; 
    }
    
    if (iterations >= maxIterations) {
        // console.log("Solvability check reached max iterations.");
        // Consider reaching max iterations as potentially unsolvable or too complex
        return false; 
    }

    // If loop finished naturally (queue empty) and all non-mines revealed
    return unrevealedCount === 0;
}

/**
 * Checks for common 50/50 patterns that require guessing
 * Optimized to reduce redundant neighbor calculations.
 * @param {Array} board - The game board
 * @param {Set} revealed - Set of revealed cell keys
 * @param {Set} flagged - Set of flagged cell keys
 * @returns {boolean} - True if a 50/50 pattern is found
 */
function has5050Pattern(board, revealed, flagged) {
    const edgeCells = findEdgeCells(board, revealed, flagged);
    
    // Pre-calculate unknown neighbors for relevant edge cells
    const edgeCellInfo = new Map();
    for (const cell of edgeCells) {
        // Only consider cells that could form a 1-in-2 pattern
        if (cell.adjacentUnknowns === 2 && cell.adjacentMines - cell.adjacentFlagged === 1) {
            const unknownNeighbors = getNeighbors(cell.x, cell.y).filter(n => {
                const key = `${n.x},${n.y}`;
                return !revealed.has(key) && !flagged.has(key);
            });
            // Sort neighbors to ensure consistent comparison regardless of order
            unknownNeighbors.sort((a, b) => (a.y * State.columns + a.x) - (b.y * State.columns + b.x));
            edgeCellInfo.set(`${cell.x},${cell.y}`, unknownNeighbors);
        }
    }

    // Convert map keys to an array for easier iteration
    const relevantEdgeKeys = Array.from(edgeCellInfo.keys());

    // Compare relevant edge cells
    for (let i = 0; i < relevantEdgeKeys.length; i++) {
        const key1 = relevantEdgeKeys[i];
        const neighbors1 = edgeCellInfo.get(key1);
        
        // Compare with subsequent cells in the list
        for (let j = i + 1; j < relevantEdgeKeys.length; j++) {
            const key2 = relevantEdgeKeys[j];
            const neighbors2 = edgeCellInfo.get(key2);

            // Check if they share the exact same two unknown neighbors
            if (neighbors1[0].x === neighbors2[0].x && 
                neighbors1[0].y === neighbors2[0].y &&
                neighbors1[1].x === neighbors2[1].x && 
                neighbors1[1].y === neighbors2[1].y) {
                // console.log(`Detected 50/50 pattern between ${key1} and ${key2}`);
                return true; // Found a 50/50 pattern
            }
        }
    }
    
    return false; // No 50/50 pattern found
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
    const maxAttempts = 100; // Reduced attempts since our algorithm is smarter now
    
    // Identify the center of the safe zone (the actual first click)
    const firstClick = safeZone.length > 0 ? 
        safeZone[Math.floor(safeZone.length / 2)] : 
        { x: 0, y: 0 };
    
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
        
        // Use enhanced progressive mine generation strategy
        const success = enhancedProgressiveGeneration(safeZone);
        
        if (success) {
            // Calculate adjacent mines
            updateAdjacentMineCounts(State.gameBoard);
            
            // Quick check: verify the first click area is solvable
            if (isFirstClickAreaSolvable(State.gameBoard, firstClick)) {
                // Full check: verify the entire board is solvable 
                if (attempts <= 5 || isBoardSolvable(State.gameBoard, [firstClick])) {
                    console.log(`Generated fully solvable board in ${attempts} attempts`);
                    return true;
                }
            }
        }
    }
    
    console.warn(`Using fallback random generation after ${maxAttempts} attempts`);
    
    // Fallback: Generate a standard random board (ensure safe zone is clear)
    for (let y = 0; y < State.rows; y++) {
        for (let x = 0; x < State.columns; x++) {
            State.gameBoard[y][x].isMine = false;
            State.gameBoard[y][x].adjacentMines = 0;
        }
    }
    placeRandomMines(safeZone);
    updateAdjacentMineCounts(State.gameBoard);
    
    return false;
}

/**
 * Enhanced progressive mine generation with multiple strategies to improve solvability
 * @param {Array} safeZone - Array of cells that should not have mines
 * @returns {boolean} - Whether mine placement was successful
 */
function enhancedProgressiveGeneration(safeZone) {
    // Clear the board first
    for (let y = 0; y < State.rows; y++) {
        for (let x = 0; x < State.columns; x++) {
            State.gameBoard[y][x].isMine = false;
        }
    }
    
    // Prepare safe cells lookup for quick access
    const safeMap = new Set();
    for (const cell of safeZone) {
        safeMap.add(`${cell.x},${cell.y}`);
    }
    
    // Calculate available positions
    const availablePositions = [];
    for (let y = 0; y < State.rows; y++) {
        for (let x = 0; x < State.columns; x++) {
            if (!safeMap.has(`${x},${y}`)) {
                availablePositions.push({x, y});
            }
        }
    }
    
    // If we don't have enough positions, we can't place all mines
    if (availablePositions.length < State.mineCount) {
        console.error("Not enough positions to place all mines");
        return false;
    }
    
    // Step 1: Create a pattern-based initial distribution for better solvability
    const gridSize = Math.min(State.rows, State.columns);
    const patternScale = gridSize <= 10 ? 2 : (gridSize <= 16 ? 3 : 4);
    createPatternedDistribution(safeMap, patternScale);
    
    // Count mines placed in pattern phase
    let minesPlaced = countMinesOnBoard();
    
    // Step 2: Place remaining mines with strategic rules
    if (minesPlaced < State.mineCount) {
        placeRemainingMinesStrategically(safeMap, minesPlaced);
    }
    // Step 3: Validate final mine count
    minesPlaced = countMinesOnBoard();
    return minesPlaced === State.mineCount;
}

/**
 * Creates an initial mine distribution following patterns known to produce
 * more solvable boards
 * @param {Set} safeMap - Set of safe cell coordinates as strings "x,y"
 * @param {number} scale - Scale factor for the pattern
 */
function createPatternedDistribution(safeMap, scale) {
    // Use a checkerboard-like pattern to spread mines evenly
    // This naturally prevents many adjacent mines which cause problems
    const patternDensity = 0.65; // Adjustable - higher means more mines from pattern
    const targetFromPattern = Math.floor(State.mineCount * patternDensity);
    let placed = 0;
    
    // Loop with randomized order to avoid predictable patterns
    const positions = [];
    for (let y = 0; y < State.rows; y += scale) {
        for (let x = 0; x < State.columns; x += scale) {
            // Add some randomization within the cell
            const offsetX = Math.floor(Math.random() * scale);
            const offsetY = Math.floor(Math.random() * scale);
            
            const finalX = x + offsetX;
            const finalY = y + offsetY;
            
            // Skip if out of bounds
            if (finalX >= State.columns || finalY >= State.rows) continue;
            
            // Add to positions with a random priority
            positions.push({
                x: finalX,
                y: finalY,
                priority: Math.random()
            });
        }
    }
    
    // Sort by random priority and place mines
    positions.sort((a, b) => a.priority - b.priority);
    
    for (const pos of positions) {
        if (placed >= targetFromPattern) break;
        
        // Skip if in safe zone
        if (safeMap.has(`${pos.x},${pos.y}`)) continue;
        
        // Place mine
        State.gameBoard[pos.y][pos.x].isMine = true;
        placed++;
    }
}

/**
 * Strategically places remaining mines to maximize solvability
 * @param {Set} safeMap - Set of safe cell coordinates as strings "x,y" 
 * @param {number} alreadyPlaced - Number of mines already placed
 */
function placeRemainingMinesStrategically(safeMap, alreadyPlaced) {
    const remainingToPlace = State.mineCount - alreadyPlaced;
    if (remainingToPlace <= 0) return true;
    
    // Update adjacent counts for current partial board
    updateAdjacentMineCounts(State.gameBoard);
    
    // Get all valid positions with a score
    const candidates = [];
    
    for (let y = 0; y < State.rows; y++) {
        for (let x = 0; x < State.columns; x++) {
            // Skip safe zones and existing mines
            if (safeMap.has(`${x},${y}`) || State.gameBoard[y][x].isMine) {
                continue;
            }
            
            // Calculate a suitability score for placing a mine here
            const score = calculatePlacementScore(x, y);
            candidates.push({x, y, score});
        }
    }
    
    // Sort by score (lower is better)
    candidates.sort((a, b) => a.score - b.score);
    
    // Place remaining mines
    let placed = 0;
    for (let i = 0; i < candidates.length && placed < remainingToPlace; i++) {
        const pos = candidates[i];
        State.gameBoard[pos.y][pos.x].isMine = true;
        placed++;
    }
    
    // Update the board's adjacent mine counts after placing all mines
    updateAdjacentMineCounts(State.gameBoard);
    return placed === remainingToPlace;
}

/**
 * Calculates a score for how suitable a position is for mine placement
 * Lower scores are better for placing mines
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {number} - Placement score (lower is better)
 */
function calculatePlacementScore(x, y) {
    let score = 0;
    const neighbors = getNeighbors(x, y);
    
    // Count adjacent existing mines (avoid clusters)
    let adjacentMines = 0;
    for (const n of neighbors) {
        if (State.gameBoard[n.y][n.x].isMine) {
            adjacentMines++;
        }
    }
    
    // Heavily penalize creating clusters of mines
    score += adjacentMines * 20;
    
    // Penalize creating potential 50/50 situations
    for (const n of neighbors) {
        // Skip if it's a mine
        if (State.gameBoard[n.y][n.x].isMine) continue;
        
        // Check if placing mine here would create a 50/50 situation
        const nNeighbors = getNeighbors(n.x, n.y);
        let otherMines = 0;
        let emptyCells = 0;
        
        for (const nn of nNeighbors) {
            // Skip the cell we're evaluating
            if (nn.x === x && nn.y === y) continue;
            
            if (State.gameBoard[nn.y][nn.x].isMine) {
                otherMines++;
            } else {
                emptyCells++;
            }
        }
        
        // If placing a mine here would make this neighboring cell have N mines
        // and N non-mine cells, it might create a 50/50 situation
        const wouldHaveMines = otherMines + 1;
        if (wouldHaveMines === emptyCells && emptyCells <= 2) {
            score += 50; // Heavy penalty
        }
    }
    
    // Add randomization to break ties (0-1 range)
    score += Math.random();
    
    return score;
}

/**
 * Quick check if the first click area is solvable
 * This is much faster than checking the whole board
 * @param {Array} board - The game board
 * @param {Object} firstClick - The first click position
 * @returns {boolean} - Whether the first click area is solvable
 */
function isFirstClickAreaSolvable(board, firstClick) {
    // Clone just the first click area and immediate surroundings
    const simulationBoard = JSON.parse(JSON.stringify(board));
    const revealed = simulateReveal(simulationBoard, firstClick.x, firstClick.y, new Set());
    
    // Check if any revealed cells have adjacent numbers that would cause 50/50 guesses
    for (const cellKey of revealed) {
        const [x, y] = cellKey.split(',').map(Number);
        
        if (simulationBoard[y][x].adjacentMines > 0) {
            // Check for common 50/50 patterns in the first reveal area
            if (hasLocalUnsolvablePattern(simulationBoard, x, y, revealed)) {
                return false;
            }
        }
    }
    
    return true;
}

/**
 * Checks for common unsolvable patterns in a local area
 * @param {Array} board - The game board
 * @param {number} x - X coordinate of the center cell
 * @param {number} y - Y coordinate of the center cell
 * @param {Set} revealed - Set of revealed cell keys
 * @returns {boolean} - True if an unsolvable pattern is found
 */
function hasLocalUnsolvablePattern(board, x, y, revealed) {
    const neighbors = getNeighbors(x, y);
    const unrevealed = neighbors.filter(n => !revealed.has(`${n.x},${n.y}`));
    
    // Simple check for 1-in-2 scenarios (probably the most common 50/50 case)
    if (unrevealed.length === 2 && board[y][x].adjacentMines === 1) {
        return true;
    }
    
    return false;
}

/**
 * Counts total mines currently on the board
 * @returns {number} - Number of mines on the board
 */
function countMinesOnBoard() {
    let count = 0;
    for (let y = 0; y < State.rows; y++) {
        for (let x = 0; x < State.columns; x++) {
            if (State.gameBoard[y][x].isMine) {
                count++;
            }
        }
    }
    return count;
}

/**
 * Places mines randomly on the board
 * @param {Array} safeZone - Array of cells that should not have mines
 */
function placeRandomMines(safeZone) {
    // Make sure we're using the correct mine count from State
    const targetMineCount = State.mineCount;
    
    // Reset all mines first to ensure correct count
    for (let y = 0; y < State.rows; y++) {
        for (let x = 0; x < State.columns; x++) {
            State.gameBoard[y][x].isMine = false;
        }
    }
    
    let minesPlaced = 0;
    // Use a safety counter to prevent infinite loops
    let attempts = 0;
    const maxAttempts = State.rows * State.columns * 10;
    
    while (minesPlaced < targetMineCount && attempts < maxAttempts) {
        attempts++;
        const x = Math.floor(Math.random() * State.columns);
        const y = Math.floor(Math.random() * State.rows);
        
        const isSafe = safeZone.some(pos => pos.x === x && pos.y === y);
        
        if (!isSafe && !State.gameBoard[y][x].isMine) {
            State.gameBoard[y][x].isMine = true;
            minesPlaced++;
        }
    }
    
    if (minesPlaced !== targetMineCount) {
        console.error(`Failed to place all mines: ${minesPlaced}/${targetMineCount} placed`);
    }
}

/**
 * Evaluates how close a board is to being fully solvable
 * @param {Array} board - The game board to evaluate
 * @param {Object} firstClick - The first click position
 * @returns {Object} - Statistics about the board's solvability
 */
function evaluateBoardSolvability(board, firstClick) {
    const simulationBoard = JSON.parse(JSON.stringify(board));
    let revealed = new Set();
    revealed = simulateReveal(simulationBoard, firstClick.x, firstClick.y, revealed);
    
    let flagged = new Set();
    let unrevealed = [];
    
    for (let y = 0; y < State.rows; y++) {
        for (let x = 0; x < State.columns; x++) {
            const cellKey = `${x},${y}`;
            if (!simulationBoard[y][x].isMine && !revealed.has(cellKey)) {
                unrevealed.push({ x, y });
            }
        }
    }
    
    let progress = true;
    let iterations = 0;
    const maxIterations = 100;
    
    while (progress && unrevealed.length > 0 && iterations < maxIterations) {
        iterations++;
        progress = false;
        
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
