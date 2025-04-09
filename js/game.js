/**
 * Game Module
 * Core game logic for the Minesweeper game
 */

import * as State from './state.js';
import * as Audio from './audio.js';
import * as Storage from './storage.js';
import * as UI from './ui.js';
import { revealButton, flagButton, chordButton, autoFlagButton } from './controller.js';

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
    
    // Handle auto-flag action (only in speedrun mode)
    if (State.speedrunMode && button === autoFlagButton && autoFlagButton !== "none" && 
        cell.isRevealed && cell.adjacentMines > 0) {
        handleAutoFlag(x, y);
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
    
    // Place mines randomly
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
    
    // Calculate adjacent mines for each cell
    calculateAdjacentMines();
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

// Reveal a cell
export function revealCell(x, y) {
    const cell = State.gameBoard[y][x];
    
    // Skip if already revealed or flagged
    if (cell.isRevealed || cell.isFlagged) return;
      // Mark as revealed
    cell.isRevealed = true;
    State.incrementCellsRevealed();
    
    // Update UI
    const cellElement = UI.getCellElement(x, y);
    cellElement.classList.add('revealed');
    
    // Handle mine click
    if (cell.isMine) {
        gameOver(false);
        return;
    }
    
    // Show number of adjacent mines
    if (cell.adjacentMines > 0) {
        cellElement.textContent = cell.adjacentMines;
        cellElement.dataset.mines = cell.adjacentMines;
    } 
    // Auto-reveal surrounding cells for empty cells
    else {
        // Reveal all adjacent cells
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < State.columns && ny >= 0 && ny < State.rows) {
                    revealCell(nx, ny);
                }
            }
        }
    }
    
    // Check for win
    checkWinCondition();
}

// Toggle flag on a cell
export function toggleFlag(x, y) {
    const cell = State.gameBoard[y][x];
    
    if (!cell.isRevealed) {
        cell.isFlagged = !cell.isFlagged;
        const cellElement = UI.getCellElement(x, y);
          if (cell.isFlagged) {
            cellElement.classList.add('flagged');
            if (cell.isMine) State.incrementFlaggedMines();
            Audio.playSound('flag-sound');
        } else {
            cellElement.classList.remove('flagged');
            if (cell.isMine) State.decrementFlaggedMines();
            Audio.playSound('flag-sound');
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
export function handleAutoFlag(x, y) {
    // Only handle this in speedrun mode
    if (!State.speedrunMode) return;
    
    const cell = State.gameBoard[y][x];
    if (!cell.isRevealed || cell.adjacentMines === 0) return;
    
    // Count only adjacent unrevealed cells and adjacent flagged cells
    let unrevealedCount = 0;
    let currentFlagged = 0;
    const unrevealedCells = [];
    
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < State.columns && ny >= 0 && ny < State.rows) {
                if (!State.gameBoard[ny][nx].isRevealed) {
                    if (State.gameBoard[ny][nx].isFlagged) {
                        currentFlagged++;
                    } else {
                        unrevealedCount++;
                        unrevealedCells.push({ x: nx, y: ny });
                    }
                }
            }
        }
    }
    
    // Auto-flag when the number on the tile equals flags already placed + number of undiscovered adjacent tiles
    if (cell.adjacentMines === currentFlagged + unrevealedCount && unrevealedCount > 0) {
        unrevealedCells.forEach(pos => {
            toggleFlag(pos.x, pos.y);
        });
    }
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
    
    // Show result modal
    UI.showResultModal(isWin, State.timer);
}
