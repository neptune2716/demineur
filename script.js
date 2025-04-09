// Game state variables
let gameBoard = [];
let rows = 10;
let columns = 10;
let mineCount = 10;
let cellsRevealed = 0;
let gameActive = false;
let firstClick = true;
let timer = 0;
let timerInterval;
let flaggedMines = 0;
let speedrunMode = true;

// Controller settings
let revealButton = "left";    // "left" or "right"
let flagButton = "right";     // "left" or "right"
let chordButton = "left";     // "left", "right", or "none"
let autoFlagButton = "right"; // "left", "right", or "none"

// Audio system variables
let audioEnabled = true;
let volumeLevel = 0.5;
let backgroundAudio = null;
let currentBackgroundAudio = 'none';

// Game config objects
const difficulties = {
    easy: { rows: 9, columns: 9, mines: 10 },
    medium: { rows: 16, columns: 16, mines: 40 },
    hard: { rows: 16, columns: 30, mines: 99 }
};

// Cache DOM elements
const gameBoardElement = document.getElementById('game-board');
const minesCounterElement = document.getElementById('mines-counter');
const timerElement = document.getElementById('timer');
const customModalElement = document.getElementById('custom-modal');

// Initialize the game
document.addEventListener('DOMContentLoaded', function() {
    // Menu control
    document.getElementById('menu-button').addEventListener('click', function() {
        playSound('click-sound');
        document.getElementById('menu-modal').style.display = 'block';
    });
    
    document.getElementById('menu-close').addEventListener('click', function() {
        playSound('click-sound');
        document.getElementById('menu-modal').style.display = 'none';
    });
    
    // Game controls
    document.getElementById('new-game').addEventListener('click', function() {
        playSound('click-sound');
        document.getElementById('menu-modal').style.display = 'none';
        initializeGame();
    });
    
    document.querySelectorAll('.difficulty').forEach(button => {
        button.addEventListener('click', function() {
            playSound('click-sound');
            const difficulty = this.dataset.difficulty;
            setDifficulty(difficulty);
            document.getElementById('menu-modal').style.display = 'none';
            initializeGame();
        });
    });
    
    document.getElementById('custom-difficulty').addEventListener('click', function() {
        playSound('click-sound');
        document.getElementById('menu-modal').style.display = 'none';
        openCustomModal();
    });
    
    document.getElementById('start-custom').addEventListener('click', function() {
        playSound('click-sound');
        startCustomGame();
    });
    
    document.getElementById('custom-close').addEventListener('click', function() {
        playSound('click-sound');
        closeCustomModal();
    });
    
    document.getElementById('theme').addEventListener('change', function() {
        playSound('click-sound');
        setTheme(this.value);
    });
      // Speedrun mode toggle
    document.getElementById('speedrun-toggle').addEventListener('change', function() {
        speedrunMode = this.checked;
        localStorage.setItem('speedrunMode', speedrunMode);
    });
      // Controller options
    document.querySelectorAll('input[name="reveal"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked) {
                revealButton = this.value;
                // If both reveal and flag are set to the same button, switch the other one
                if (revealButton === flagButton) {
                    const newFlagButton = revealButton === "left" ? "right" : "left";
                    flagButton = newFlagButton;
                    document.querySelector(`input[name="flag"][value="${newFlagButton}"]`).checked = true;
                }
                localStorage.setItem('revealButton', revealButton);
                localStorage.setItem('flagButton', flagButton);
            }
        });
    });
    
    document.querySelectorAll('input[name="flag"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked) {
                flagButton = this.value;
                // If both reveal and flag are set to the same button, switch the other one
                if (flagButton === revealButton) {
                    const newRevealButton = flagButton === "left" ? "right" : "left";
                    revealButton = newRevealButton;
                    document.querySelector(`input[name="reveal"][value="${newRevealButton}"]`).checked = true;
                }
                localStorage.setItem('flagButton', flagButton);
                localStorage.setItem('revealButton', revealButton);
            }
        });
    });
    
    document.querySelectorAll('input[name="chord"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked) {
                chordButton = this.value;
                localStorage.setItem('chordButton', chordButton);
            }
        });
    });
    
    document.querySelectorAll('input[name="autoflag"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked) {
                autoFlagButton = this.value;
                localStorage.setItem('autoFlagButton', autoFlagButton);
            }
        });
    });
    
    // Handle speedrun mode toggle - update UI elements
    document.getElementById('speedrun-toggle').addEventListener('change', function() {
        speedrunMode = this.checked;
        localStorage.setItem('speedrunMode', speedrunMode);
        
        // Enable or disable speedrun-related controls
        const speedrunControls = document.querySelectorAll('.speedrun-control');
        speedrunControls.forEach(control => {
            control.classList.toggle('disabled', !speedrunMode);
            const inputs = control.querySelectorAll('input');
            inputs.forEach(input => input.disabled = !speedrunMode);
        });
    });
    
    // Audio controls
    document.getElementById('sound-toggle').addEventListener('change', function() {
        audioEnabled = this.checked;
        if (!audioEnabled && backgroundAudio) {
            pauseBackgroundAudio();
        } else if (audioEnabled && currentBackgroundAudio !== 'none') {
            playBackgroundAudio(currentBackgroundAudio);
        }
        localStorage.setItem('audioEnabled', audioEnabled);
    });
    
    document.getElementById('volume').addEventListener('input', function() {
        volumeLevel = this.value / 100;
        updateVolume();
        localStorage.setItem('volumeLevel', volumeLevel);
    });
    
    document.getElementById('background-audio').addEventListener('change', function() {
        playSound('click-sound');
        currentBackgroundAudio = this.value;
        if (currentBackgroundAudio === 'none') {
            pauseBackgroundAudio();
        } else {
            playBackgroundAudio(currentBackgroundAudio);
        }
        localStorage.setItem('backgroundAudio', currentBackgroundAudio);
    });    // Load audio preferences
    if (localStorage.getItem('audioEnabled') !== null) {
        audioEnabled = localStorage.getItem('audioEnabled') === 'true';
        document.getElementById('sound-toggle').checked = audioEnabled;
    }
    
    if (localStorage.getItem('volumeLevel') !== null) {
        volumeLevel = parseFloat(localStorage.getItem('volumeLevel'));
        document.getElementById('volume').value = volumeLevel * 100;
    }
    
    if (localStorage.getItem('backgroundAudio')) {
        currentBackgroundAudio = localStorage.getItem('backgroundAudio');
        document.getElementById('background-audio').value = currentBackgroundAudio;
        // Don't auto-play audio on page load to avoid browser restrictions
        // Background audio will be played when the user interacts with the game
    }
      // Load controller preferences
    if (localStorage.getItem('revealButton')) {
        revealButton = localStorage.getItem('revealButton');
        document.querySelector(`input[name="reveal"][value="${revealButton}"]`).checked = true;
    }
    
    if (localStorage.getItem('flagButton')) {
        flagButton = localStorage.getItem('flagButton');
        document.querySelector(`input[name="flag"][value="${flagButton}"]`).checked = true;
    }
    
    if (localStorage.getItem('chordButton')) {
        chordButton = localStorage.getItem('chordButton');
        document.querySelector(`input[name="chord"][value="${chordButton}"]`).checked = true;
    }
    
    if (localStorage.getItem('autoFlagButton')) {
        autoFlagButton = localStorage.getItem('autoFlagButton');
        document.querySelector(`input[name="autoflag"][value="${autoFlagButton}"]`).checked = true;
    }
    
    if (localStorage.getItem('speedrunMode') !== null) {
        speedrunMode = localStorage.getItem('speedrunMode') === 'true';
        document.getElementById('speedrun-toggle').checked = speedrunMode;
        
        // Enable or disable speedrun-related controls
        const speedrunControls = document.querySelectorAll('.speedrun-control');
        speedrunControls.forEach(control => {
            control.classList.toggle('disabled', !speedrunMode);
            const inputs = control.querySelectorAll('input');
            inputs.forEach(input => input.disabled = !speedrunMode);
        });
    }
    
    // Initialize with default settings
    initializeGame();
});

// Set the game theme
function setTheme(theme) {
    document.body.className = '';
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('theme', theme);
}

// Set difficulty
function setDifficulty(difficulty) {
    if (difficulties[difficulty]) {
        rows = difficulties[difficulty].rows;
        columns = difficulties[difficulty].columns;
        mineCount = difficulties[difficulty].mines;
    }
}

// Custom game modal handlers
function openCustomModal() {
    customModalElement.style.display = 'block';
}

function closeCustomModal() {
    customModalElement.style.display = 'none';
}

function startCustomGame() {
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const minesInput = document.getElementById('mines');
    
    rows = Math.max(5, Math.min(50, parseInt(heightInput.value) || 10));
    columns = Math.max(5, Math.min(50, parseInt(widthInput.value) || 10));
    mineCount = Math.max(1, Math.min(rows * columns - 1, parseInt(minesInput.value) || 10));
    
    heightInput.value = rows;
    widthInput.value = columns;
    minesInput.value = mineCount;
    
    closeCustomModal();
    initializeGame();
}

// Initialize or restart the game
function initializeGame() {
    // Reset game state
    gameActive = true;
    firstClick = true;
    cellsRevealed = 0;
    flaggedMines = 0;
    clearInterval(timerInterval);
    timer = 0;
    timerElement.textContent = '0';
    
    // Update CSS variables for grid
    document.documentElement.style.setProperty('--rows', rows);
    document.documentElement.style.setProperty('--columns', columns);
    
    // Create empty board
    gameBoard = Array.from({ length: rows }, () => 
        Array.from({ length: columns }, () => ({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            adjacentMines: 0
        }))
    );
    
    // Update UI
    minesCounterElement.textContent = mineCount;
    renderBoard();
    
    // Add active game visual indicator
    document.body.classList.add('game-active');
}

// Render the game board
function renderBoard() {
    // Clear previous board
    gameBoardElement.innerHTML = '';
    
    // Create grid cells
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            
            // Add event listeners
            cell.addEventListener('click', handleLeftClick);
            cell.addEventListener('contextmenu', handleRightClick);
            
            gameBoardElement.appendChild(cell);
        }
    }
}

// Handle left-click on cell
function handleLeftClick(event) {
    if (!gameActive) return;
    handleMouseClick(event, "left");
}

// Handle right-click on cell
function handleRightClick(event) {
    event.preventDefault();
    if (!gameActive) return;
    handleMouseClick(event, "right");
}

// Unified mouse click handler that uses controller settings
function handleMouseClick(event, button) {
    const x = parseInt(event.target.dataset.x);
    const y = parseInt(event.target.dataset.y);
    const cell = gameBoard[y][x];
    
    // First click safety
    if (firstClick) {
        firstClick = false;
        generateMines(x, y);
        startTimer();
    }
    
    // Handle reveal action
    if (button === revealButton && !cell.isFlagged) {
        playSound('click-sound');
        revealCell(x, y);
    }
    
    // Handle flag action
    if (button === flagButton && !cell.isRevealed) {
        toggleFlag(x, y);
    }
    
    // Handle chord action (only in speedrun mode)
    if (speedrunMode && button === chordButton && chordButton !== "none" && 
        cell.isRevealed && cell.adjacentMines > 0) {
        handleNumberClick(x, y);
    }
    
    // Handle auto-flag action (only in speedrun mode)
    if (speedrunMode && button === autoFlagButton && autoFlagButton !== "none" && 
        cell.isRevealed && cell.adjacentMines > 0) {
        handleAutoFlag(x, y);
    }
}

// Generate mines (ensuring first click is safe)
function generateMines(safeX, safeY) {
    let minesPlaced = 0;
    
    // Create a safe zone around the first click
    const safeZone = [];
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = safeX + dx;
            const ny = safeY + dy;
            if (nx >= 0 && nx < columns && ny >= 0 && ny < rows) {
                safeZone.push({ x: nx, y: ny });
            }
        }
    }
    
    // Place mines randomly
    while (minesPlaced < mineCount) {
        const x = Math.floor(Math.random() * columns);
        const y = Math.floor(Math.random() * rows);
        
        // Check if position is not in safe zone and doesn't already have a mine
        const isSafe = safeZone.some(pos => pos.x === x && pos.y === y);
        
        if (!isSafe && !gameBoard[y][x].isMine) {
            gameBoard[y][x].isMine = true;
            minesPlaced++;
        }
    }
    
    // Calculate adjacent mines for each cell
    calculateAdjacentMines();
}

// Calculate number of adjacent mines for each cell
function calculateAdjacentMines() {
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
            if (gameBoard[y][x].isMine) continue;
            
            let count = 0;
            
            // Check all 8 surrounding cells
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    // Check if neighbor is valid and has a mine
                    if (nx >= 0 && nx < columns && ny >= 0 && ny < rows && gameBoard[ny][nx].isMine) {
                        count++;
                    }
                }
            }
            
            gameBoard[y][x].adjacentMines = count;
        }
    }
}

// Reveal a cell
function revealCell(x, y) {
    const cell = gameBoard[y][x];
    
    // Skip if already revealed or flagged
    if (cell.isRevealed || cell.isFlagged) return;
    
    // Mark as revealed
    cell.isRevealed = true;
    cellsRevealed++;
    
    // Update UI
    const cellElement = getCellElement(x, y);
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
                
                if (nx >= 0 && nx < columns && ny >= 0 && ny < rows) {
                    revealCell(nx, ny);
                }
            }
        }
    }
    
    // Check for win
    checkWinCondition();
}

// Toggle flag on a cell
function toggleFlag(x, y) {
    const cell = gameBoard[y][x];
    
    if (!cell.isRevealed) {
        cell.isFlagged = !cell.isFlagged;
        const cellElement = getCellElement(x, y);
        
        if (cell.isFlagged) {
            cellElement.classList.add('flagged');
            if (cell.isMine) flaggedMines++;
            playSound('flag-sound');
        } else {
            cellElement.classList.remove('flagged');
            if (cell.isMine) flaggedMines--;
            playSound('flag-sound');
        }
        
        // Update mines counter
        minesCounterElement.textContent = mineCount - document.querySelectorAll('.cell.flagged').length;
    }
}

// Handle clicking on a number (chord)
function handleNumberClick(x, y) {
    const cell = gameBoard[y][x];
    if (!cell.isRevealed || cell.adjacentMines === 0) return;
    
    // Count flagged cells around this number
    let flaggedCount = 0;
    const adjacentCells = [];
    
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < columns && ny >= 0 && ny < rows) {
                adjacentCells.push({ x: nx, y: ny });
                if (gameBoard[ny][nx].isFlagged) {
                    flaggedCount++;
                }
            }
        }
    }
    
    // If flagged count matches the number, reveal all non-flagged cells
    if (flaggedCount === cell.adjacentMines) {
        adjacentCells.forEach(pos => {
            if (!gameBoard[pos.y][pos.x].isFlagged && !gameBoard[pos.y][pos.x].isRevealed) {
                revealCell(pos.x, pos.y);
            }
        });
    }
}

// Handle auto-flag on a number
function handleAutoFlag(x, y) {
    // Only handle this in speedrun mode
    if (!speedrunMode) return;
    
    const cell = gameBoard[y][x];
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
            
            if (nx >= 0 && nx < columns && ny >= 0 && ny < rows) {
                if (!gameBoard[ny][nx].isRevealed) {
                    if (gameBoard[ny][nx].isFlagged) {
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

// Get DOM element for a cell
function getCellElement(x, y) {
    return document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
}

// Start timer
function startTimer() {
    timerInterval = setInterval(() => {
        timer++;
        timerElement.textContent = timer;
    }, 1000);
}

// Check win condition
function checkWinCondition() {
    // Win if all non-mine cells are revealed
    if (cellsRevealed === (rows * columns - mineCount)) {
        gameOver(true);
    }
}

// Game over handler
function gameOver(isWin) {
    gameActive = false;
    clearInterval(timerInterval);
    document.body.classList.remove('game-active');
    
    // Play win or lose sound
    if (isWin) {
        playSound('win-sound');
    } else {
        playSound('lose-sound');
    }
    
    // Reveal all mines
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
            const cell = gameBoard[y][x];
            
            if (cell.isMine) {
                const cellElement = getCellElement(x, y);
                cellElement.classList.add('mine');
                
                // Auto-flag all mines when winning
                if (isWin && !cell.isFlagged) {
                    cell.isFlagged = true;
                    cellElement.classList.add('flagged');
                }
            }
        }
    }
    
    // Show custom result modal instead of alert
    const resultModal = document.getElementById('result-modal');
    const resultMessage = document.getElementById('result-message');
    const resultDetails = document.getElementById('result-details');
    
    if (isWin) {
        resultMessage.textContent = 'Congratulations!';
        resultDetails.textContent = `You won in ${timer} seconds.`;
        resultMessage.style.color = 'var(--accent-color)';
    } else {
        resultMessage.textContent = 'Game Over';
        resultDetails.textContent = 'Better luck next time!';
        resultMessage.style.color = 'var(--mine-color)';
    }
    
    resultModal.style.display = 'block';
    
    // Set up new game button in result modal
    document.getElementById('new-game-result').addEventListener('click', function() {
        resultModal.style.display = 'none';
        initializeGame();
    });
}

// Audio functions
function playSound(soundId) {
    if (!audioEnabled) return;
    
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.volume = volumeLevel;
        sound.currentTime = 0;
        sound.play();
    }
}

function playBackgroundAudio(type) {
    pauseBackgroundAudio();
    
    if (!audioEnabled) return;
    
    backgroundAudio = document.getElementById(`${type}-audio`);
    if (backgroundAudio) {
        backgroundAudio.volume = volumeLevel * 0.5; // Background at 50% of effects
        backgroundAudio.loop = true;
        backgroundAudio.play();
    }
}

function pauseBackgroundAudio() {
    if (backgroundAudio) {
        backgroundAudio.pause();
    }
}

function updateVolume() {
    const sounds = document.querySelectorAll('audio');
    sounds.forEach(sound => {
        if (sound.id.includes('-audio')) {
            sound.volume = volumeLevel * 0.5; // Background at 50% of effects
        } else {
            sound.volume = volumeLevel;
        }
    });
}

// Apply saved theme if exists
if (localStorage.getItem('theme')) {
    const savedTheme = localStorage.getItem('theme');
    document.getElementById('theme').value = savedTheme;
    setTheme(savedTheme);
}
