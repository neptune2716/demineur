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
import { GAME_CONSTANTS, ERROR_MESSAGES } from './constants.js';

// Handle left-click on cell
export function handleLeftClick(event) {
    handleMouseClick(event, "left");
}

// Handle right-click on cell
export function handleRightClick(event) {
    event.preventDefault();
    handleMouseClick(event, "right");
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
    // Moved gameActive check and ripple effect here
    if (!State.gameActive) return;
    addRippleEffect(event.target);

    const x = parseInt(event.target.dataset.x);
    const y = parseInt(event.target.dataset.y);
    const cell = State.gameBoard[y][x];
    
    // First click safety
    if (State.firstClick) {
        // Remember if we're in Zen Mode before handling the first click
        const wasInZenMode = State.isZenMode;
        const zenLevel = State.zenLevel;
        
        State.setFirstClick(false);
        generateMines(x, y);
        UI.startTimer();
        
        // Transition to game playing state
        UI.transitionToGameplay();
        
        // Ensure Zen Mode state is preserved if we were in Zen Mode
        if (wasInZenMode) {
            State.setZenMode(true);
            State.setZenLevel(zenLevel);
            // Update UI to reflect Zen Mode
            UI.updateZenLevelIndicator();
            // Ensure the title stays as "Zen Mode"
            document.getElementById('game-title').textContent = 'Zen Mode';
            // Explicitly set difficulty back to 'zen'
            State.setDifficulty('zen');
        }
    }
    
    // Handle auto-flag action first (only in speedrun mode)
    if (State.speedrunMode && button === autoFlagButton && autoFlagButton !== "none" && 
        cell.isRevealed && cell.adjacentMines > 0) {
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
        generateSafeModeBoard(safeZone);
    } else {
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
    
    calculateAdjacentMines();
}

// Generate a board that prevents 50/50 guessing situations (Safe Mode)
function generateSafeModeBoard(safeZone) {
    const success = generateSolvableBoard(safeZone);
    
    if (!success) {        import('./notification.js').then(Notification => {
            Notification.showInfo(ERROR_MESSAGES.SAFE_BOARD_GENERATION_FAILED);
        });
    }
}

// Calculate number of adjacent mines for each cell
export function calculateAdjacentMines() {
    for (let y = 0; y < State.rows; y++) {
        for (let x = 0; x < State.columns; x++) {
            if (State.gameBoard[y][x].isMine) continue;
            
            let count = 0;
            
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const nx = x + dx;
                    const ny = y + dy;
                    
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
const BATCH_THRESHOLD = GAME_CONSTANTS.BATCH_REVEAL_THRESHOLD;

// Reveal a cell with optimization for large boards
export function revealCell(x, y) {
    if (!revealingBatch) {
        cellsToReveal = [];
        revealingBatch = true;
        
        collectCellsToReveal(x, y);
        
        applyBatchReveal();
        
        revealingBatch = false;
        
        checkWinCondition();
    } else {
        collectCellsToReveal(x, y);
    }
}

// Collect all cells that need to be revealed in the current operation
function collectCellsToReveal(x, y) {
    const cell = State.gameBoard[y][x];
    
    if (cell.isRevealed || cell.isFlagged || cell.toBeRevealed) return;
    
    cell.toBeRevealed = true;
    cellsToReveal.push({ x, y, cell });
    
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
    const batchSize = cellsToReveal.length;
    const useBatchMode = batchSize > BATCH_THRESHOLD;
    
    const hitMine = cellsToReveal.some(item => item.cell.isMine);
    if (hitMine) {
        const mineCell = cellsToReveal.find(item => item.cell.isMine);
        
        mineCell.cell.isRevealed = true;
        State.incrementCellsRevealed();
        
        const cellElement = UI.getCellElement(mineCell.x, mineCell.y);
        cellElement.classList.add('revealed', 'animated');
        
        cellsToReveal.forEach(item => delete item.cell.toBeRevealed);
        
        gameOver(false);
        return;
    }
    
    if (useBatchMode) {
        cellsToReveal.forEach(item => {
            item.cell.isRevealed = true;
            State.incrementCellsRevealed();
            delete item.cell.toBeRevealed;
        });
        
        cellsToReveal.forEach(item => {
            const cellElement = UI.getCellElement(item.x, item.y);
            cellElement.classList.add('revealed', 'batch-reveal');
            
            if (item.cell.adjacentMines > 0) {
                cellElement.textContent = item.cell.adjacentMines;
                cellElement.dataset.mines = item.cell.adjacentMines;
            }
        });
    } else {
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
        
        UI.updateMinesCounter();
        
        checkWinCondition();
    }
}

// Helper function to get info about adjacent cells
function getAdjacentCellInfo(x, y) {
    let flaggedCount = 0;
    let unrevealedCount = 0;
    const adjacentCells = [];
    const unrevealedCells = [];
    const flaggedCells = [];

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;

            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < State.columns && ny >= 0 && ny < State.rows) {
                const adjacentCell = State.gameBoard[ny][nx];
                const pos = { x: nx, y: ny };
                adjacentCells.push(pos);

                if (!adjacentCell.isRevealed) {
                    if (adjacentCell.isFlagged) {
                        flaggedCount++;
                        flaggedCells.push(pos);
                    } else {
                        unrevealedCount++;
                        unrevealedCells.push(pos);
                    }
                }
            }
        }
    }

    return { flaggedCount, unrevealedCount, adjacentCells, unrevealedCells, flaggedCells };
}

// Handle clicking on a number (chord)
export function handleNumberClick(x, y) {
    const cell = State.gameBoard[y][x];
    if (!cell.isRevealed || cell.adjacentMines === 0) return;

    const { flaggedCount, adjacentCells } = getAdjacentCellInfo(x, y);
    let actionTaken = false; // Flag to track if cells were revealed

    if (flaggedCount === cell.adjacentMines) {
        adjacentCells.forEach(pos => {
            const adjacentCell = State.gameBoard[pos.y][pos.x];
            if (!adjacentCell.isFlagged && !adjacentCell.isRevealed) {
                revealCell(pos.x, pos.y);
                actionTaken = true; // Mark that an action occurred
            }
        });
    }

    // Save game state if an action was taken
    if (actionTaken && State.gameActive && !State.firstClick) {
        if (State.isZenMode) {
            Storage.saveZenGameState();
        } else {
            Storage.saveGameState();
        }
    }
}

// Handle auto-flag on a number
export function handleAutoFlag(x, y, isAutoFlagAction = false) {
    if (!State.speedrunMode) return;

    const cell = State.gameBoard[y][x];
    if (!cell.isRevealed || cell.adjacentMines === 0) return;

    const { flaggedCount, unrevealedCount, unrevealedCells } = getAdjacentCellInfo(x, y);
    let actionTaken = false; // Flag to track if cells were flagged or revealed

    // Condition to auto-flag remaining unrevealed cells
    if (cell.adjacentMines === flaggedCount + unrevealedCount && unrevealedCount > 0) {
        if (isAutoFlagAction) {
            Audio.playSound('flag-sound');
        }

        unrevealedCells.forEach(pos => {
            toggleFlag(pos.x, pos.y, true); // skipSound = true
            actionTaken = true;
        });

    // Condition to auto-reveal remaining unrevealed cells (like chording)
    } else if (cell.adjacentMines === flaggedCount && unrevealedCount > 0) {
        if (isAutoFlagAction) {
            Audio.playSound('click-sound');
        }

        unrevealedCells.forEach(pos => {
            // Check again inside loop in case revealCell changes state
            if (!State.gameBoard[pos.y][pos.x].isRevealed && !State.gameBoard[pos.y][pos.x].isFlagged) {
                 revealCell(pos.x, pos.y);
                 actionTaken = true;
            }
        });
    }

    // Save game state if an action was taken
    if (actionTaken && State.gameActive && !State.firstClick) {
        if (State.isZenMode) {
            Storage.saveZenGameState();
        } else {
            Storage.saveGameState();
        }
    }

    // Return true if an action was taken, false otherwise
    return actionTaken;
}

// Check win condition
export function checkWinCondition() {
    if (State.cellsRevealed === (State.rows * State.columns - State.mineCount) && State.flaggedMines === State.mineCount) {
        gameOver(true);
    }
}

// Game over handler
export function gameOver(isWin) {
    // --- Common Setup ---
    State.setGameActive(false);
    clearInterval(State.timerInterval);
    document.body.classList.remove('game-active');

    if (isWin) {
        Audio.playSound('win-sound');
    } else {
        Audio.playSound('lose-sound');
    }

    revealAllMines(isWin); // Reveal mines and mark misflags

    // --- Mode-Specific Handling ---
    if (State.isZenMode) {
        handleZenGameOver(isWin);
    } else {
        handleNormalGameOver(isWin);
    }

    // --- Common Cleanup ---
    // Update main page stats (called here to ensure it happens after stats are recorded)
    UI.updateMainPageStats();
}

// Helper to reveal all mines and mark misflagged cells at game end
function revealAllMines(isWin) {
    for (let y = 0; y < State.rows; y++) {
        for (let x = 0; x < State.columns; x++) {
            const cell = State.gameBoard[y][x];
            const cellElement = UI.getCellElement(x, y);

            if (cell.isMine) {
                cellElement.classList.add('mine');
                // Auto-flag remaining mines on win
                if (isWin && !cell.isFlagged) {
                    cell.isFlagged = true; // Update state
                    cellElement.classList.add('flagged'); // Update UI
                }
            } else if (cell.isFlagged) {
                // Mark incorrectly flagged cells if it's a loss
                if (!isWin) {
                    cellElement.classList.add('misflagged');
                }
            }
        }
    }
    // Update the counter one last time after potential auto-flagging on win
    if (isWin) {
        UI.updateMinesCounter();
    }
}

// Handles game over logic specific to Zen Mode
function handleZenGameOver(isWin) {
    Storage.clearZenGameState(); // Clear the active game state regardless of win/loss

    if (isWin) {
        // --- Zen Win Logic ---
        const previousLevel = State.zenLevel;
        State.incrementZenLevel();
        // Statistics module likely handles best level tracking now, but save progress just in case
        Storage.saveZenProgress(); 

        UI.updateZenLevelIndicator(); // Update UI to show new level

        // Use dynamic import for notification
        import('./notification.js').then(Notification => {
            Notification.showSuccess(`Level ${previousLevel} Complete! Starting Level ${State.zenLevel}...`);
        });

        UI.animateLevelUp(); // Animate the level indicator

        // Start the next level after a delay
        setTimeout(() => {
            UI.startZenLevel(State.zenLevel);
        }, 1500); // Delay to allow user to see the board/notification

    } else {
        // --- Zen Loss Logic ---
        // Record statistics for the lost level
        import('./statistics.js').then(Statistics => {
            Statistics.recordGameResult(
                false, // isWin = false
                State.zenLevel, // Value is the level lost
                'zen',
                { rows: State.rows, columns: State.columns, mines: State.mineCount },
                { 
                    cellsRevealed: State.cellsRevealed, 
                    wrongFlags: document.querySelectorAll('.cell.misflagged').length // Count misflagged cells
                }
            );
        });        // Show the Zen loss modal
        UI.showZenLossModal(State.zenLevel);

        // Don't clear progress tracking on loss - player should be able to continue from best level
    }
}

// Handles game over logic specific to Normal Modes
function handleNormalGameOver(isWin) {
    Storage.clearSavedGame(); // Clear any saved state for this game

    // Record statistics
    import('./statistics.js').then(Statistics => {
        // Determine difficulty string ('easy', 'medium', 'hard', 'custom')
        let difficulty = 'custom';
        // Use the imported Config directly
        for (const [diffName, config] of Object.entries(Config.difficulties)) {
            if (config.rows === State.rows &&
                config.columns === State.columns &&
                config.mines === State.mineCount) {
                difficulty = diffName; 
                break;
            }
        }

        const gameStats = {
            cellsRevealed: State.cellsRevealed,
            wrongFlags: document.querySelectorAll('.cell.misflagged').length, // Count misflagged cells
            speedrunMode: State.speedrunMode, // Pass mode info
            safeMode: State.safeMode
        };

        Statistics.recordGameResult(
            isWin,
            State.timer, // Value is the time taken
            difficulty,
            { rows: State.rows, columns: State.columns, mines: State.mineCount },
            gameStats
        );
    });

    // Show the standard result modal
    UI.showResultModal(isWin, State.timer);
}
