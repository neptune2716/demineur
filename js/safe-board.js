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
    const maxAttempts = 5000; // Increased attempts significantly

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
        }
    }
    
    console.warn(`Failed to generate a guaranteed solvable board after ${maxAttempts} attempts. Falling back to standard random generation for this round.`);
    
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
 * Uses a progressive approach to place mines in a way that's more likely to be solvable
 * @param {Array} safeZone - Array of cells that should not have mines
 * @returns {boolean} - Whether mine placement was successful
 */
function tryProgressiveMineGeneration(safeZone) {
    try {
        // Reset board mines
        for (let y = 0; y < State.rows; y++) {
            for (let x = 0; x < State.columns; x++) {
                State.gameBoard[y][x].isMine = false;
            }
        }

        const initialMineFraction = 0.85; 
        const initialCount = Math.floor(State.mineCount * initialMineFraction);
        
        let minesPlaced = 0;
        let attempts = 0;
        const maxPlacementAttempts = State.rows * State.columns * 5; 

        const gridSize = 3; 
        const densityGrid = {};
        
        // Place the initial mines (relatively random but spread)
        while (minesPlaced < initialCount && attempts < maxPlacementAttempts) {
            attempts++;
            let x = Math.floor(Math.random() * State.columns);
            let y = Math.floor(Math.random() * State.rows);
            
            // Basic density check (optional refinement)
            const gridX = Math.floor(x / gridSize);
            const gridY = Math.floor(y / gridSize);
            const gridKey = `${gridX},${gridY}`;
            const maxDensity = Math.ceil((initialCount / (State.rows * State.columns / (gridSize * gridSize))) * 1.8); 
            if (densityGrid[gridKey] && densityGrid[gridKey] >= maxDensity && Math.random() < 0.5) {
                 continue; 
            }

            const isSafe = safeZone.some(pos => pos.x === x && pos.y === y);
            if (!isSafe && !State.gameBoard[y][x].isMine) {
                State.gameBoard[y][x].isMine = true;
                minesPlaced++;
                densityGrid[gridKey] = (densityGrid[gridKey] || 0) + 1;
            }
        }

        // Handle failure to place initial mines
        if (minesPlaced < initialCount) {
             console.warn("Progressive placement: Could not place initial mines evenly. Filling randomly.");
             while(minesPlaced < initialCount && attempts < maxPlacementAttempts * 2) {
                 attempts++;
                 let x = Math.floor(Math.random() * State.columns);
                 let y = Math.floor(Math.random() * State.rows);
                 const isSafe = safeZone.some(pos => pos.x === x && pos.y === y);
                 if (!isSafe && !State.gameBoard[y][x].isMine) {
                     State.gameBoard[y][x].isMine = true;
                     minesPlaced++;
                 }
             }
             if (minesPlaced < initialCount) {
                 console.error("Failed to place initial mines.");
                 return false; // Critical failure
             }
        }
        
        // Calculate adjacent mines for the partially filled board
        updateAdjacentMineCounts(State.gameBoard);
        
        // --- Strategic Placement for Remaining Mines ---
        const remainingMinesToPlace = State.mineCount - minesPlaced;
        if (remainingMinesToPlace > 0) {
            const candidates = [];
            // Find all potential spots
            for (let y = 0; y < State.rows; y++) {
                for (let x = 0; x < State.columns; x++) {
                    const isSafe = safeZone.some(pos => pos.x === x && pos.y === y);
                    if (isSafe || State.gameBoard[y][x].isMine) continue;
                    candidates.push({ x, y });
                }
            }

            // Score each candidate
            const scoredCandidates = [];
            for (const cand of candidates) {
                let score = 0;
                let adjacentExistingMines = 0;

                // Simulate placing mine at candidate location
                State.gameBoard[cand.y][cand.x].isMine = true;
                // Temporarily update counts around the candidate for accurate neighbor checks
                const neighborsToUpdate = getNeighbors(cand.x, cand.y);
                neighborsToUpdate.push(cand); // Include candidate itself if needed by logic below
                const originalNeighborCounts = new Map();
                for(const n of neighborsToUpdate) {
                    if (!State.gameBoard[n.y][n.x].isMine) {
                        originalNeighborCounts.set(`${n.x},${n.y}`, State.gameBoard[n.y][n.x].adjacentMines);
                        State.gameBoard[n.y][n.x].adjacentMines = countAdjacentMines(State.gameBoard, n.x, n.y);
                    }
                }

                // --- Scoring Logic --- 
                const neighbors = getNeighbors(cand.x, cand.y);
                for (const n of neighbors) {
                    if (State.gameBoard[n.y][n.x].isMine) {
                        // Check if the neighbor is the mine we just placed (it shouldn't be, but safety check)
                        if (n.x !== cand.x || n.y !== cand.y) {
                             adjacentExistingMines++;
                        }
                        continue; // Skip scoring based on mine neighbors
                    }

                    // Analyze the non-mine neighbor 'n'
                    const nnNeighbors = getNeighbors(n.x, n.y);
                    let otherMines = 0;
                    let otherUnknown = 0;

                    for (const nn of nnNeighbors) {
                        // Skip the candidate cell itself when analyzing neighbor's neighbors
                        if (nn.x === cand.x && nn.y === cand.y) continue; 

                        if (State.gameBoard[nn.y][nn.x].isMine) {
                            otherMines++;
                        } else {
                            // Consider a cell potentially unknown if it's not a mine and not in the initial safe zone
                            // This is an approximation, as we don't know the revealed state yet.
                            const nnIsSafe = safeZone.some(pos => pos.x === nn.x && pos.y === nn.y);
                            if (!nnIsSafe) { 
                                otherUnknown++;
                            }
                        }
                    }

                    const neighborMineCount = State.gameBoard[n.y][n.x].adjacentMines; // This count includes the simulated mine at cand

                    // Penalize creating forced mine situations
                    if (neighborMineCount === otherUnknown + 1 && otherUnknown > 0) { // +1 because cand is the mine
                        score += 5; // Moderate penalty for forcing all other unknowns to be mines
                    }

                    // Penalize creating 1-1 patterns (high penalty)
                    // If neighbor's count becomes 1, and it only has one *other* unknown neighbor
                    if (neighborMineCount === 1 && otherUnknown === 1) { 
                        score += 50; // High penalty for creating 1-1
                    }
                     // Penalize creating 1-2 patterns (potential 50/50)
                     if (neighborMineCount === 1 && otherUnknown === 2) {
                         score += 15; // Moderate penalty
                     }
                     // Penalize creating 2-2 patterns (potential 50/50)
                     if (neighborMineCount === 2 && otherUnknown === 2) {
                         score += 15; // Moderate penalty
                     }
                }
                // --- End Scoring Logic --- 

                // Add penalty for clumping
                score += adjacentExistingMines * 3;
                // Add small random factor for tie-breaking
                score += Math.random(); 

                scoredCandidates.push({ x: cand.x, y: cand.y, score });

                // Undo simulation: Remove mine and restore neighbor counts
                State.gameBoard[cand.y][cand.x].isMine = false;
                 for(const n of neighborsToUpdate) {
                     if (!State.gameBoard[n.y][n.x].isMine) {
                         const key = `${n.x},${n.y}`;
                         if (originalNeighborCounts.has(key)) {
                            State.gameBoard[n.y][n.x].adjacentMines = originalNeighborCounts.get(key);
                         } // else: it was 0 before and still is, or wasn't a neighbor we tracked
                     }
                 }
            }
            
            // Sort candidates by score (lower score first)
            scoredCandidates.sort((a, b) => a.score - b.score);
            
            // Place remaining mines using the best candidates
            let placedCount = 0;
            for (let i = 0; i < scoredCandidates.length && placedCount < remainingMinesToPlace; i++) {
                const bestCandidate = scoredCandidates[i];
                 // Ensure the spot is still available (should be, but safety check)
                 if (!State.gameBoard[bestCandidate.y][bestCandidate.x].isMine) { 
                    State.gameBoard[bestCandidate.y][bestCandidate.x].isMine = true;
                    minesPlaced++;
                    placedCount++;
                 } else {
                     console.warn("Progressive placement conflict: Tried to place mine in already occupied spot.");
                 }
            }
            // Update counts globally once after all remaining mines are placed
            updateAdjacentMineCounts(State.gameBoard);
        }
        
        // Final check: Ensure correct number of mines placed
        let finalMineCount = 0;
        for (let y = 0; y < State.rows; y++) {
            for (let x = 0; x < State.columns; x++) {
                if (State.gameBoard[y][x].isMine) finalMineCount++;
            }
        }

        if (finalMineCount !== State.mineCount) {
             console.warn(`Progressive placement ended with ${finalMineCount}/${State.mineCount} mines. Filling remaining randomly.`);
             // Fill any remaining deficit randomly
             attempts = 0; // Reset attempts for random fill
             while (finalMineCount < State.mineCount && attempts < maxPlacementAttempts) { // Reuse attempts limit
                 attempts++;
                 let x = Math.floor(Math.random() * State.columns);
                 let y = Math.floor(Math.random() * State.rows);
                 const isSafe = safeZone.some(pos => pos.x === x && pos.y === y);
                 if (!isSafe && !State.gameBoard[y][x].isMine) {
                     State.gameBoard[y][x].isMine = true;
                     finalMineCount++;
                 }
             }
             if (finalMineCount !== State.mineCount) {
                 console.error("Failed to place correct number of mines even after random fill.");
                 return false; // Indicate failure
             }
             updateAdjacentMineCounts(State.gameBoard); // Update counts after random fill
        }

        return true; // Placement successful
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
