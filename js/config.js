/**
 * Game Configuration Module
 * Contains game settings, difficulty presets, and other configuration constants
 */

// Game difficulty presets
export const difficulties = {
    easy: { rows: 9, columns: 9, mines: 10 },
    medium: { rows: 16, columns: 16, mines: 40 },
    hard: { rows: 16, columns: 30, mines: 99 }
};

// Default game settings
export const defaultConfig = {
    rows: 10,
    columns: 10,
    mineCount: 10
};
