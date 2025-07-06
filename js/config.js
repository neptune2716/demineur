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

// localStorage utility functions with error handling
export const LocalStorageUtils = {
    /**
     * Safely get an item from localStorage
     * @param {string} key - The localStorage key
     * @param {*} defaultValue - Default value if key doesn't exist or parsing fails
     * @returns {*} The parsed value or default value
     */
    getItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item !== null ? item : defaultValue;
        } catch (error) {
            console.warn(`Failed to get localStorage item '${key}':`, error);
            return defaultValue;
        }
    },

    /**
     * Safely get and parse a JSON item from localStorage
     * @param {string} key - The localStorage key
     * @param {*} defaultValue - Default value if key doesn't exist or parsing fails
     * @returns {*} The parsed JSON value or default value
     */
    getJsonItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;
            return JSON.parse(item);
        } catch (error) {
            console.warn(`Failed to parse localStorage JSON item '${key}':`, error);
            return defaultValue;
        }
    },

    /**
     * Safely set an item in localStorage
     * @param {string} key - The localStorage key
     * @param {*} value - The value to store
     * @returns {boolean} True if successful, false otherwise
     */
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error(`Failed to set localStorage item '${key}':`, error);
            return false;
        }
    },

    /**
     * Safely set a JSON item in localStorage
     * @param {string} key - The localStorage key
     * @param {*} value - The value to stringify and store
     * @returns {boolean} True if successful, false otherwise
     */
    setJsonItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Failed to set localStorage JSON item '${key}':`, error);
            return false;
        }
    },

    /**
     * Safely remove an item from localStorage
     * @param {string} key - The localStorage key
     * @returns {boolean} True if successful, false otherwise
     */
    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn(`Failed to remove localStorage item '${key}':`, error);
            return false;
        }
    },

    /**
     * Check if localStorage is available
     * @returns {boolean} True if localStorage is available
     */
    isAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.warn('localStorage is not available:', error);
            return false;
        }
    }
};
