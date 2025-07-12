/**
 * Input Validation Module
 * Provides robust input validation functions for user inputs
 */

import { GAME_CONSTANTS, ERROR_MESSAGES } from './constants.js';

/**
 * Validates if a value is a positive integer
 * @param {any} value - Value to validate
 * @returns {boolean} True if valid positive integer
 */
export function isPositiveInteger(value) {
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0 && num === parseFloat(value);
}

/**
 * Validates if a value is a number within a range
 * @param {any} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {boolean} True if valid number in range
 */
export function isNumberInRange(value, min, max) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
}

/**
 * Validates board dimensions
 * @param {number} width - Board width
 * @param {number} height - Board height
 * @param {boolean} isZenMode - Whether this is for Zen mode (different limits)
 * @returns {{isValid: boolean, error?: string, correctedWidth?: number, correctedHeight?: number}}
 */
export function validateBoardDimensions(width, height, isZenMode = false) {
    const maxSize = isZenMode ? GAME_CONSTANTS.MAX_BOARD_SIZE_ZEN : GAME_CONSTANTS.MAX_BOARD_SIZE;
    const minSize = GAME_CONSTANTS.MIN_BOARD_SIZE;
    
    // Validate width
    if (!isPositiveInteger(width)) {
        return {
            isValid: false,
            error: ERROR_MESSAGES.INVALID_BOARD_SIZE.replace('{min}', minSize).replace('{max}', maxSize),
            correctedWidth: GAME_CONSTANTS.DEFAULT_BOARD_SIZE
        };
    }
    
    // Validate height
    if (!isPositiveInteger(height)) {
        return {
            isValid: false,
            error: ERROR_MESSAGES.INVALID_BOARD_SIZE.replace('{min}', minSize).replace('{max}', maxSize),
            correctedHeight: GAME_CONSTANTS.DEFAULT_BOARD_SIZE
        };
    }
    
    const correctedWidth = Math.max(minSize, Math.min(maxSize, parseInt(width)));
    const correctedHeight = Math.max(minSize, Math.min(maxSize, parseInt(height)));
    
    return {
        isValid: correctedWidth === parseInt(width) && correctedHeight === parseInt(height),
        correctedWidth,
        correctedHeight
    };
}

/**
 * Validates mine count against board dimensions
 * @param {number} mineCount - Number of mines
 * @param {number} totalTiles - Total number of tiles on board
 * @returns {{isValid: boolean, error?: string, correctedMineCount?: number, maxAllowed?: number}}
 */
export function validateMineCount(mineCount, totalTiles) {
    if (!isPositiveInteger(mineCount)) {
        return {
            isValid: false,
            error: ERROR_MESSAGES.INVALID_MINE_COUNT.replace('{min}', GAME_CONSTANTS.MIN_MINES).replace('{max}', totalTiles - GAME_CONSTANTS.SAFE_AREA_SIZE),
            correctedMineCount: GAME_CONSTANTS.MIN_MINES
        };
    }
    
    const maxMinesByDensity = Math.floor(totalTiles * GAME_CONSTANTS.MAX_MINE_DENSITY);
    const maxMinesBySafeArea = totalTiles - GAME_CONSTANTS.SAFE_AREA_SIZE;
    const maxAllowed = Math.min(maxMinesByDensity, maxMinesBySafeArea);
    
    const parsedMineCount = parseInt(mineCount);
    const correctedMineCount = Math.max(GAME_CONSTANTS.MIN_MINES, Math.min(maxAllowed, parsedMineCount));
    
    if (parsedMineCount > maxAllowed) {
        const densityPercent = Math.round(GAME_CONSTANTS.MAX_MINE_DENSITY * 100);
        return {
            isValid: false,
            error: ERROR_MESSAGES.MINE_DENSITY_EXCEEDED.replace('{max}', maxAllowed).replace('{percent}', densityPercent),
            correctedMineCount,
            maxAllowed
        };
    }
    
    return {
        isValid: correctedMineCount === parsedMineCount,
        correctedMineCount,
        maxAllowed
    };
}

/**
 * Validates custom game settings as a whole
 * @param {string|number} width - Board width
 * @param {string|number} height - Board height  
 * @param {string|number} mines - Mine count
 * @param {boolean} isZenMode - Whether this is for Zen mode
 * @returns {{isValid: boolean, errors: string[], correctedSettings: {width: number, height: number, mines: number}}}
 */
export function validateCustomGameSettings(width, height, mines, isZenMode = false) {
    const errors = [];
    let correctedWidth, correctedHeight, correctedMines;
    
    // Validate dimensions
    const dimensionValidation = validateBoardDimensions(width, height, isZenMode);
    if (!dimensionValidation.isValid && dimensionValidation.error) {
        errors.push(dimensionValidation.error);
    }
    correctedWidth = dimensionValidation.correctedWidth;
    correctedHeight = dimensionValidation.correctedHeight;
    
    // Validate mine count
    const totalTiles = correctedWidth * correctedHeight;
    const mineValidation = validateMineCount(mines, totalTiles);
    if (!mineValidation.isValid && mineValidation.error) {
        errors.push(mineValidation.error);
    }
    correctedMines = mineValidation.correctedMineCount;
    
    return {
        isValid: errors.length === 0,
        errors,
        correctedSettings: {
            width: correctedWidth,
            height: correctedHeight,
            mines: correctedMines
        }
    };
}

/**
 * Validates theme color hex codes
 * @param {string} color - Hex color code
 * @returns {boolean} True if valid hex color
 */
export function validateHexColor(color) {
    if (typeof color !== 'string') return false;
    
    // Remove # if present
    const hex = color.replace('#', '');
    
    // Check if it's 3 or 6 character hex
    if (hex.length !== 3 && hex.length !== 6) return false;
    
    // Check if all characters are valid hex
    return /^[0-9A-Fa-f]+$/.test(hex);
}

/**
 * Validates volume level
 * @param {any} volume - Volume level (0-100 or 0.0-1.0)
 * @returns {{isValid: boolean, correctedVolume: number}}
 */
export function validateVolume(volume) {
    const num = parseFloat(volume);
    
    if (isNaN(num)) {
        return { isValid: false, correctedVolume: 0.7 };
    }
    
    // Handle both 0-100 and 0.0-1.0 scales
    let correctedVolume;
    if (num > 1) {
        // Assume 0-100 scale
        correctedVolume = Math.max(0, Math.min(100, num)) / 100;
    } else {
        // Assume 0.0-1.0 scale
        correctedVolume = Math.max(0, Math.min(1, num));
    }
    
    return {
        isValid: true,
        correctedVolume
    };
}

/**
 * Validates Zen level
 * @param {any} level - Zen level
 * @returns {{isValid: boolean, correctedLevel: number}}
 */
export function validateZenLevel(level) {
    if (!isPositiveInteger(level)) {
        return { isValid: false, correctedLevel: 1 };
    }
    
    const parsedLevel = parseInt(level);
    // Reasonable upper limit to prevent overflow in level calculations
    const maxLevel = 1000;
    const correctedLevel = Math.max(1, Math.min(maxLevel, parsedLevel));
    
    return {
        isValid: correctedLevel === parsedLevel,
        correctedLevel
    };
}

/**
 * Sanitizes user input for safe usage
 * @param {string} input - User input string
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input, maxLength = 100) {
    if (typeof input !== 'string') {
        return '';
    }
    
    return input
        .trim()
        .substring(0, maxLength)
        .replace(/[<>\"'&]/g, ''); // Remove potentially dangerous characters
}

/**
 * Validates DOM element selector and returns element if found
 * @param {string} selector - CSS selector
 * @returns {{isValid: boolean, element?: HTMLElement, error?: string}}
 */
export function validateAndGetElement(selector) {
    try {
        const element = document.querySelector(selector);
        if (!element) {
            return {
                isValid: false,
                error: ERROR_MESSAGES.ELEMENT_NOT_FOUND.replace('{selector}', selector)
            };
        }
        return {
            isValid: true,
            element
        };
    } catch (error) {
        return {
            isValid: false,
            error: `Invalid selector: ${selector}`
        };
    }
}

/**
 * Validates localStorage data structure
 * @param {any} data - Data to validate
 * @param {Object} expectedStructure - Expected structure with type validation
 * @returns {{isValid: boolean, errors: string[]}}
 */
export function validateStorageData(data, expectedStructure) {
    const errors = [];
    
    if (typeof data !== 'object' || data === null) {
        errors.push('Data must be an object');
        return { isValid: false, errors };
    }
    
    // Recursively validate structure
    function validateObject(obj, structure, path = '') {
        for (const [key, expectedType] of Object.entries(structure)) {
            const currentPath = path ? `${path}.${key}` : key;
            
            if (!(key in obj)) {
                errors.push(`Missing required property: ${currentPath}`);
                continue;
            }
            
            const value = obj[key];
            
            if (typeof expectedType === 'string') {
                // Simple type check
                if (typeof value !== expectedType) {
                    errors.push(`Property ${currentPath} should be ${expectedType}, got ${typeof value}`);
                }
            } else if (typeof expectedType === 'object' && expectedType !== null) {
                // Nested object validation
                if (typeof value === 'object' && value !== null) {
                    validateObject(value, expectedType, currentPath);
                } else {
                    errors.push(`Property ${currentPath} should be an object`);
                }
            }
        }
    }
    
    validateObject(data, expectedStructure);
    
    return {
        isValid: errors.length === 0,
        errors
    };
}
