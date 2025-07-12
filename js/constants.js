/**
 * Game Constants Module
 * Centralizes all magic numbers and configuration constants used throughout the application
 */

// UI and Animation Constants
export const UI_CONSTANTS = {
    // Particle system
    PARTICLE_OPACITY_MIN: 0.3,
    PARTICLE_OPACITY_RANGE: 0.7,
    PARTICLE_POSITION_MAX: 100, // percentage
    
    // Board sizing thresholds
    BOARD_SIZE_SMALL_MAX: 500,
    BOARD_SIZE_MEDIUM_MAX: 1000,
    
    // Timer
    TIMER_INTERVAL_MS: 1000,
    
    // Animation delays
    ANIMATION_DELAY_SHORT_MS: 100,
    ANIMATION_DELAY_MEDIUM_MS: 200,
    ANIMATION_DELAY_LONG_MS: 300,
    TRANSITION_DELAY_MS: 500
};

// Game Logic Constants
export const GAME_CONSTANTS = {
    // Custom game limits
    MIN_BOARD_SIZE: 5,
    MAX_BOARD_SIZE: 500,
    MAX_BOARD_SIZE_ZEN: 50,
    DEFAULT_BOARD_SIZE: 10,
    MIN_MINES: 1,
    MAX_MINE_DENSITY: 0.3, // 30% of total tiles
    SAFE_AREA_SIZE: 9, // 3x3 safe area around first click
    
    // Zen mode progression
    ZEN_SIZE_INCREASE_INTERVAL: 5, // levels
    ZEN_BASE_DENSITY: 0.12,
    ZEN_MAX_DENSITY: 0.22,
    ZEN_DENSITY_INCREASE_PER_LEVEL: 0.002,
    ZEN_MIN_MINES: 5,
    ZEN_SAFE_DISTANCE: 7, // minimum distance from first click for mine repair
    
    // Batch processing
    BATCH_REVEAL_THRESHOLD: 20
};

// Audio Constants
export const AUDIO_CONSTANTS = {
    // Volume
    VOLUME_SCALE: 100, // for UI slider conversion
    MAX_VOLUME: 1.0,
    
    // Audio settings
    FADE_OUT_DURATION: 0.3,
    AMBIENT_DELAY_MS: 500,
    FADE_START_MULTIPLIER: 1000 // convert seconds to milliseconds
};

// Statistics Constants
export const STATS_CONSTANTS = {
    // Speed thresholds (seconds)
    SPEED_THRESHOLD_EASY: 30,
    SPEED_THRESHOLD_MEDIUM: 120,
    SPEED_THRESHOLD_HARD: 300,
    
    // Achievement thresholds
    ACHIEVEMENT_TEN_WINS: 10,
    ACHIEVEMENT_FIFTY_WINS: 50,
    ACHIEVEMENT_HUNDRED_WINS: 100,
    ACHIEVEMENT_THOUSAND_WINS: 1000,
    ACHIEVEMENT_MIN_GAMES_FOR_WINRATE: 20,
    ACHIEVEMENT_FIFTY_PERCENT_WINRATE: 50,
    ACHIEVEMENT_SEVENTY_FIVE_PERCENT_WINRATE: 75,
    ACHIEVEMENT_WEEK_STREAK: 7,
    ACHIEVEMENT_MONTH_STREAK: 30,
    
    // Mastery achievements
    ACHIEVEMENT_EASY_MASTER: 20,
    ACHIEVEMENT_MEDIUM_MASTER: 15,
    ACHIEVEMENT_HARD_MASTER: 10,
    
    // Game history limits
    MAX_GAME_HISTORY_PER_DIFFICULTY: 100
};

// UI Element Selectors (to centralize DOM queries)
export const SELECTORS = {
    // Game board
    GAME_BOARD: '#game-board',
    GAME_BOARD_CONTAINER: '.game-board-container',
    
    // UI elements
    TIMER: '#timer',
    MINES_COUNTER: '#mines-counter',
    CURRENT_DIFFICULTY_LABEL: '#current-difficulty-label',
    
    // Custom game inputs
    CUSTOM_WIDTH: '#width',
    CUSTOM_HEIGHT: '#height',
    CUSTOM_MINES: '#mines',
    
    // Mode toggles
    SPEEDRUN_TOGGLE: '#speedrun-toggle',
    SAFE_MODE_TOGGLE: '#safe-mode-toggle',
    
    // Zen mode elements
    ZEN_LEVEL_INDICATOR: '#zen-level-indicator',
    ZEN_CURRENT_LEVEL: '#zen-current-level',
    
    // Mode indicators
    SPEEDRUN_INDICATOR: '#speedrun-indicator',
    SAFE_INDICATOR: '#safe-indicator',
    IN_GAME_SPEEDRUN: '#in-game-speedrun',
    IN_GAME_SAFE: '#in-game-safe',
    
    // Particles
    PARTICLES_CONTAINER: '#particles-container',
    
    // Volume control
    VOLUME_SLIDER: '#volume'
};

// Error Messages
export const ERROR_MESSAGES = {
    // Input validation
    INVALID_BOARD_SIZE: 'Board size must be between {min} and {max}',
    INVALID_MINE_COUNT: 'Mine count must be between {min} and {max}',
    MINE_DENSITY_EXCEEDED: 'Maximum mines allowed is {max} ({percent}% of total tiles)',
    
    // DOM errors
    ELEMENT_NOT_FOUND: 'Required DOM element not found: {selector}',
    
    // Storage errors
    STORAGE_SAVE_FAILED: 'Failed to save data to localStorage',
    STORAGE_LOAD_FAILED: 'Failed to load data from localStorage',
    
    // Game errors
    SAFE_BOARD_GENERATION_FAILED: "Couldn't guarantee a fully solvable board - some guessing may be required",
    
    // Audio errors
    AUDIO_CONTEXT_FAILED: 'Failed to create audio context',
    AUDIO_LOAD_FAILED: 'Failed to load audio file: {file}'
};

// Default Values
export const DEFAULTS = {
    // Game settings
    DIFFICULTY: 'easy',
    SPEEDRUN_MODE: true,
    SAFE_MODE: false,
    
    // Custom game
    CUSTOM_WIDTH: 10,
    CUSTOM_HEIGHT: 10,
    CUSTOM_MINES: 10,
    
    // Audio
    VOLUME_LEVEL: 0.7,
    
    // Zen mode
    ZEN_LEVEL: 1
};

// CSS Classes
export const CSS_CLASSES = {
    // Game states
    GAME_ACTIVE: 'game-active',
    GAME_PLAYING: 'game-playing',
    
    // Board sizes
    BOARD_SIZE_SMALL: 'small',
    BOARD_SIZE_MEDIUM: 'medium',
    BOARD_SIZE_LARGE: 'large',
    
    // Mode indicators
    MODE_DISABLED: 'disabled',
    
    // Cell states
    CELL_REVEALED: 'revealed',
    CELL_FLAGGED: 'flagged',
    CELL_MINE: 'mine',
    CELL_MISFLAGGED: 'misflagged'
};

// Data Attributes
export const DATA_ATTRIBUTES = {
    CELL_X: 'data-x',
    CELL_Y: 'data-y',
    BOARD_SIZE: 'data-board-size',
    ORIGINAL_STATE: 'data-original-state'
};

// localStorage Keys
export const STORAGE_KEYS = {
    // Preferences
    SPEEDRUN_MODE: 'speedrunMode',
    SAFE_MODE: 'safeMode',
    VOLUME_LEVEL: 'volumeLevel',
    CUSTOM_GAME_SETTINGS: 'customGameSettings',
    CUSTOM_COLORS: 'customColors',
    SELECTED_THEME: 'selectedTheme',
    
    // Game state
    GAME_STATE: 'gameState',
    ZEN_GAME_STATE: 'zenGameState',
    ZEN_PROGRESS: 'zenProgress',
    
    // Statistics
    STATISTICS: 'statistics'
};
