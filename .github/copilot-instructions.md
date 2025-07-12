# Minesweeper AI Coding Instructions

## Architecture Overview

This is a feature-rich, relaxing Minesweeper clone built with vanilla JavaScript using ES6 modules. The codebase follows a **modular architecture** with clear separation of concerns:

- **State Management**: Centralized in `js/state.js` with explicit setters - never modify state variables directly
- **Module System**: ES6 modules with specific responsibilities (Game logic, UI, Audio, Storage, etc.)
- **Event-Driven**: Uses addEventListener patterns with careful cleanup and delegation
- **CSS Custom Properties**: Extensive theming system using CSS variables for consistent styling

## Critical Development Patterns

### State Management
```javascript
// ✅ ALWAYS use state setters
State.setGameActive(true);
State.incrementCellsRevealed();

// ❌ NEVER modify state directly  
State.gameActive = true; // This breaks the architecture
```

### Game Mode Handling
The game has **three distinct modes** with different save/load behavior:
- **Standard modes** (easy/medium/hard/custom): Use `Storage.saveGameState()`
- **Zen Mode**: Progressive difficulty with `Storage.saveZenGameState()`
- **Safe Mode**: Guarantees solvable boards without guessing

Always check `State.isZenMode` before save operations and use appropriate storage functions.

### Module Imports
```javascript
// ✅ Use dynamic imports for cross-dependencies
import('./notification.js').then(Notification => {
    Notification.showSuccess('Level complete!');
});

// ✅ Static imports for direct dependencies
import * as State from './state.js';
```

### DOM Element Access
Use constants from `constants.js` for selectors:
```javascript
import { SELECTORS } from './constants.js';
const element = document.querySelector(SELECTORS.TIMER);
```

## Key Workflows

### Adding New Features
1. **Constants First**: Add configuration to `js/constants.js`
2. **Validation**: Add input validation to `js/validation.js` 
3. **State Updates**: Use existing setters or add new ones to `js/state.js`
4. **Storage**: Update save/load functions in `js/storage.js` if persistence needed
5. **UI Updates**: Modify `js/ui.js` for visual changes
6. **CSS Variables**: Add theme support via CSS custom properties

### Testing
```bash
npm test  # Runs Jest with jsdom environment
```
- Tests are in `tests/` directory
- Uses `jest-environment-jsdom` for DOM testing
- ES6 modules enabled with `--experimental-vm-modules`

### Theming System
The project uses a **CSS custom properties** system for extensive theming:
```css
/* Define in themes.css */
.theme-ocean {
    --background: #e3f2fd;
    --cell-color: #90caf9;
    /* ... more variables */
}
```

## Game-Specific Logic

### Cell Revelation Algorithm
Uses **batch processing** for large reveals with `BATCH_THRESHOLD` optimization. The `revealCell()` function collects all cells to reveal first, then applies changes in batches to prevent UI lag on large boards.

### Zen Mode Progression
- **Level calculation**: `floor((level-1)/5) + startSize` for board dimensions
- **Mine density**: Increases by 0.002 per level with limits
- **Save state**: Preserves exact board state, not just level progress

### Controller System
Flexible input mapping in `js/controller.js`:
- `revealButton`/`flagButton`: Basic actions
- `chordButton`/`autoFlagButton`: Speedrun mode enhancements
- Settings persist via localStorage with conflict resolution

### Safe Mode Implementation
Uses `js/safe-board.js` to generate guaranteed-solvable boards without 50/50 guessing situations. This is computationally intensive and may occasionally fail on complex boards.

## File Organization Patterns

- **`js/`**: All JavaScript modules with single-responsibility principle
- **`css/`**: Modular CSS with `base.css` + feature-specific files
- **`sounds/`**: Audio assets with programmatic loading
- **`tests/`**: Jest test files matching `*.test.js` pattern

## Common Gotchas

1. **First Click Handling**: Always check `State.firstClick` before mine generation
2. **Timer Management**: Clear intervals properly to prevent memory leaks
3. **Mode Transitions**: Zen mode overrides standard difficulty settings
4. **Batch Operations**: Large board reveals use different animation classes
5. **Storage Separation**: Zen and standard games use completely different save systems

## External Dependencies

- **Jest**: Testing framework with jsdom for DOM testing
- **No build tools**: Direct ES6 module loading in browser
- **localStorage**: Primary persistence mechanism with error handling

When implementing new features, follow the established patterns of explicit state management, modular design, and comprehensive input validation.
