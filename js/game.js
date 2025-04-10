/**
 * Game Module
 * Core game logic for the Minesweeper game
 */

import * as State from './state.js';
import * as Audio from './audio.js';
import * as Storage from './storage.js';
import * as UI from './ui.js';
import * as Config from './config.js';
import { revealButton, flagButton, chordButton, autoFlagButton } from './controller.js';
import { generateSolvableBoard } from './safe-board.js';

// Handle left-click on cell
export function handleLeftClick(event) {
    if (!State.gameActive) return;
    // Add ripple effect on click
    addRippleEffect(event.target);
    handleMouseClick(event, "left");
    Storage.saveGameState();
}

// Handle right-click on cell
export function handleRightClick(event) {
    event.preventDefault();
    if (!State.gameActive) return;
    // Add ripple effect on right click
    addRippleEffect(event.target);
    handleMouseClick(event, "right");
    Storage.saveGameState();
}

// Add ripple effect to cell
function addRippleEffect(element) {
    if (element.classList.contains('revealed')) return;
    
    // Reset animation by removing and re-adding class
    element.classList.remove('ripple-effect');
    
    // Trigger browser reflow to restart animation
    void element.offsetWidth;
    
    // Add class to start animation
    element.classList.add('ripple-effect');
    
    // Remove class after animation completes
    setTimeout(() => {
        element.classList.remove('ripple-effect');
    }, 600); // Match the duration in CSS
}

// Unified mouse click handler that uses controller settings
export function handleMouseClick(event, button) {
    const x = parseInt(event.target.dataset.x);
    const y = parseInt(event.target.dataset.y);
    const cell = State.gameBoard[y][x];
      // First click safety
    if (State.firstClick) {
        State.setFirstClick(false);
        generateMines(x, y);
        UI.startTimer();
        
        // Transition to game playing state
        UI.transitionToGameplay();
    }
    
    // Handle auto-flag action first (only in speedrun mode)
    // This needs to be handled before other actions to prevent click sound
    if (State.speedrunMode && button === autoFlagButton && autoFlagButton !== "none" && 
        cell.isRevealed && cell.adjacentMines > 0) {
        // Don't play any sound here - we'll directly handle sounds in the flag function
        handleAutoFlag(x, y, true); // Pass true to indicate this is from auto-flag
        return; // Exit early to avoid playing click sound
    }
    
    // Handle reveal action
    if (button === revealButton && !cell.isFlagged) {
        Audio.playSound('click-sound');
        revealCell(x, y);
    }
    
    // Handle flag action
    if (button === flagButton && !cell.isRevealed) {
        toggleFlag(x, y);
    }
    
    // Handle chord action (only in speedrun mode)
    if (State.speedrunMode && button === chordButton && chordButton !== "none" && 
        cell.isRevealed && cell.adjacentMines > 0) {
        handleNumberClick(x, y);
    }
}

// Generate mines (ensuring first click is safe)
export function generateMines(safeX, safeY) {
    let minesPlaced = 0;
    
    // Create a safe zone around the first click
    const safeZone = [];
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = safeX + dx;
            const ny = safeY + dy;
            if (nx >= 0 && nx < State.columns && ny >= 0 && ny < State.rows) {
                safeZone.push({ x: nx, y: ny });
            }
        }
    }
    
    if (State.safeMode) {
        // In safe mode, we use a specialized algorithm to ensure a solvable board
        generateSafeModeBoard(safeZone);
    } else {
        // Regular random mine placement
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
    
    // Calculate adjacent mines for each cell
    calculateAdjacentMines();
}

// Generate a board that prevents 50/50 guessing situations (Safe Mode)
function generateSafeModeBoard(safeZone) {
    // Use the algorithm in safe-board.js to generate a solvable board
    const success = generateSolvableBoard(safeZone);
    
    // If we failed to generate a solvable board after max attempts,
    // fall back to standard board generation
    if (!success) {
        // Regular random mine placement
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
        
        // Show notification that safe mode couldn't be guaranteed
        import('./notification.js').then(Notification => {
            Notification.showInfo("Couldn't guarantee a fully solvable board - some guessing may be required");
        });
    }
}

// Calculate number of adjacent mines for each cell
export function calculateAdjacentMines() {
    for (let y = 0; y < State.rows; y++) {
        for (let x = 0; x < State.columns; x++) {
            if (State.gameBoard[y][x].isMine) continue;
            
            let count = 0;
            
            // Check all 8 surrounding cells
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    // Check if neighbor is valid and has a mine
                    if (nx >= 0 && nx < State.columns && ny >= 0 && ny < State.rows && State.gameBoard[ny][nx].isMine) {
                        count++;
                    }
                }
            }
            
            State.gameBoard[y][x].adjacentMines = count;
        }
    }
}

// Track cells to be revealed in batches for optimization
let cellsToReveal = [];
let revealingBatch = false;
const BATCH_THRESHOLD = 20; // Threshold after which we use batch mode

// Reveal a cell with optimization for large boards
export function revealCell(x, y) {
    // For single cell reveals, use normal reveal process
    if (!revealingBatch) {
        // Start a new batch operation
        cellsToReveal = [];
        revealingBatch = true;
        
        // First collect all cells that need to be revealed
        collectCellsToReveal(x, y);
        
        // Then apply the reveal to all collected cells
        applyBatchReveal();
        
        // Reset batch state
        revealingBatch = false;
        
        // Check for win condition once at the end
        checkWinCondition();
    } else {
        // Already in a batch operation, just collect this cell
        collectCellsToReveal(x, y);
    }
}

// Collect all cells that need to be revealed in the current operation
function collectCellsToReveal(x, y) {
    const cell = State.gameBoard[y][x];
    
    // Skip if already revealed or flagged, or already in our collection
    if (cell.isRevealed || cell.isFlagged || cell.toBeRevealed) return;
    
    // Mark for reveal
    cell.toBeRevealed = true;
    cellsToReveal.push({ x, y, cell });
    
    // For empty cells, recursively collect adjacent cells
    if (!cell.isMine && cell.adjacentMines === 0) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < State.columns && ny >= 0 && ny < State.rows) {
                    collectCellsToReveal(nx, ny);
                }
            }
        }
    }
}

// Apply the reveal to all collected cells
function applyBatchReveal() {
    // Use different reveal strategies based on batch size
    const batchSize = cellsToReveal.length;
    const useBatchMode = batchSize > BATCH_THRESHOLD;
    
    // Check for game over first (if we hit a mine)
    const hitMine = cellsToReveal.some(item => item.cell.isMine);
    if (hitMine) {
        // Just reveal the mine cell and trigger game over
        const mineCell = cellsToReveal.find(item => item.cell.isMine);
        
        // Mark as revealed
        mineCell.cell.isRevealed = true;
        State.incrementCellsRevealed();
        
        // Update UI
        const cellElement = UI.getCellElement(mineCell.x, mineCell.y);
        cellElement.classList.add('revealed', 'animated');
        
        // Clean up temp property
        cellsToReveal.forEach(item => delete item.cell.toBeRevealed);
        
        // Handle game over
        gameOver(false);
        return;
    }
    
    // For very large batches, consider using document fragment or staggered reveals
    if (useBatchMode) {
        // Update data model first
        cellsToReveal.forEach(item => {
            item.cell.isRevealed = true;
            State.incrementCellsRevealed();
            delete item.cell.toBeRevealed;
        });
        
        // Then batch update the DOM
        cellsToReveal.forEach(item => {
            const cellElement = UI.getCellElement(item.x, item.y);
            cellElement.classList.add('revealed', 'batch-reveal');
            
            if (item.cell.adjacentMines > 0) {
                cellElement.textContent = item.cell.adjacentMines;
                cellElement.dataset.mines = item.cell.adjacentMines;
            }
        });
    } else {
        // For smaller batches, use normal animations
        cellsToReveal.forEach(item => {
            item.cell.isRevealed = true;
            State.incrementCellsRevealed();
            delete item.cell.toBeRevealed;
            
            const cellElement = UI.getCellElement(item.x, item.y);
            cellElement.classList.add('revealed');
            
            if (item.cell.adjacentMines > 0) {
                cellElement.textContent = item.cell.adjacentMines;
                cellElement.dataset.mines = item.cell.adjacentMines;
            }
        });
    }
}

// Toggle flag on a cell
export function toggleFlag(x, y, skipSound = false) {
    const cell = State.gameBoard[y][x];
    
    if (!cell.isRevealed) {
        cell.isFlagged = !cell.isFlagged;
        const cellElement = UI.getCellElement(x, y);
          if (cell.isFlagged) {
            cellElement.classList.add('flagged');
            if (cell.isMine) State.incrementFlaggedMines();
            if (!skipSound) Audio.playSound('flag-sound');
        } else {
            cellElement.classList.remove('flagged');
            if (cell.isMine) State.decrementFlaggedMines();
            if (!skipSound) Audio.playSound('flag-sound');
        }
        
        // Update mines counter
        UI.updateMinesCounter();
        
        // Check for win after flagging too
        checkWinCondition();
    }
}

// Handle clicking on a number (chord)
export function handleNumberClick(x, y) {
    const cell = State.gameBoard[y][x];
    if (!cell.isRevealed || cell.adjacentMines === 0) return;
    
    // Count flagged cells around this number
    let flaggedCount = 0;
    const adjacentCells = [];
    
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < State.columns && ny >= 0 && ny < State.rows) {
                adjacentCells.push({ x: nx, y: ny });
                if (State.gameBoard[ny][nx].isFlagged) {
                    flaggedCount++;
                }
            }
        }
    }
    
    // If flagged count matches the number, reveal all non-flagged cells
    if (flaggedCount === cell.adjacentMines) {
        adjacentCells.forEach(pos => {
            if (!State.gameBoard[pos.y][pos.x].isFlagged && !State.gameBoard[pos.y][pos.x].isRevealed) {
                revealCell(pos.x, pos.y);
            }
        });
    }
}

// Handle auto-flag on a number
export function handleAutoFlag(x, y, isAutoFlagAction = false) {
    // Only handle this in speedrun mode
    if (!State.speedrunMode) return;
    
    const cell = State.gameBoard[y][x];
    if (!cell.isRevealed || cell.adjacentMines === 0) return;
    
    // Count only adjacent unrevealed cells and adjacent flagged cells
    let unrevealedCount = 0;
    let currentFlagged = 0;
    const unrevealedCells = [];
    const flaggedCells = [];
    
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < State.columns && ny >= 0 && ny < State.rows) {
                if (!State.gameBoard[ny][nx].isRevealed) {
                    if (State.gameBoard[ny][nx].isFlagged) {
                        currentFlagged++;
                        flaggedCells.push({ x: nx, y: ny });
                    } else {
                        unrevealedCount++;
                        unrevealedCells.push({ x: nx, y: ny });
                    }
                }
            }
        }    }    
    
    // Case 1: Auto-flag when the number on the tile equals flags already placed + number of undiscovered adjacent tiles
    if (cell.adjacentMines === currentFlagged + unrevealedCount && unrevealedCount > 0) {
        // Play the flag sound once for the entire operation
        if (isAutoFlagAction) {
            Audio.playSound('flag-sound');
        }
        
        unrevealedCells.forEach(pos => {
            // Skip all sounds for each individual flag during auto-flagging
            toggleFlag(pos.x, pos.y, true);
        });
        return true; // Operation performed
    }
    
    // Case 2: Chord when the number of flags equals the adjacent mines (reveal adjacent unflagged cells)
    else if (cell.adjacentMines === currentFlagged && unrevealedCount > 0) {
        // Play click sound once for the chord operation
        if (isAutoFlagAction) {
            Audio.playSound('click-sound');
        }
        
        // Reveal all non-flagged adjacent cells (chord action)
        unrevealedCells.forEach(pos => {
            revealCell(pos.x, pos.y);
        });
        return true; // Operation performed
    }
    
    return false; // No operation performed
}

// Check win condition
export function checkWinCondition() {
    // Win if all non-mine cells are revealed AND all mines are flagged
    if (State.cellsRevealed === (State.rows * State.columns - State.mineCount) && State.flaggedMines === State.mineCount) {
        gameOver(true);
    }
}

// Game over handler
export function gameOver(isWin) {
    State.setGameActive(false);
    clearInterval(State.timerInterval);
    document.body.classList.remove('game-active');
    
    // Play win or lose sound
    if (isWin) {
        Audio.playSound('win-sound');
    } else {
        Audio.playSound('lose-sound');
    }
    
    // Reveal all mines
    for (let y = 0; y < State.rows; y++) {
        for (let x = 0; x < State.columns; x++) {
            const cell = State.gameBoard[y][x];
            
            if (cell.isMine) {
                const cellElement = UI.getCellElement(x, y);
                cellElement.classList.add('mine');
                
                // Auto-flag all mines when winning
                if (isWin && !cell.isFlagged) {
                    cell.isFlagged = true;
                    cellElement.classList.add('flagged');
                }
            }
        }
    }
    
    // Clear saved game state
    Storage.clearSavedGame();
    
    // Record this game's result in statistics
    import('./statistics.js').then(Statistics => {
        // Get current difficulty name
        let difficulty = 'custom';
        for (const [diffName, config] of Object.entries(Config.difficulties)) {
            if (config.rows === State.rows && 
                config.columns === State.columns && 
                config.mines === State.mineCount) {
                difficulty = diffName;
                break;
            }
        }

        // Calculate game stats
        const gameStats = {
            cellsRevealed: State.cellsRevealed,
            wrongFlags: document.querySelectorAll('.cell.flagged:not(.mine)').length
        };

        // Record the game result
        Statistics.recordGameResult(
            isWin, 
            State.timer,
            difficulty,
            { rows: State.rows, columns: State.columns, mines: State.mineCount },
            gameStats
        );
        
        // Update statistics on the main page
        UI.updateMainPageStats();
    });
    
    // Show result modal
    UI.showResultModal(isWin, State.timer);
}
