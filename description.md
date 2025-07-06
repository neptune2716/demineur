# Relaxing Minesweeper - Complete Feature Documentation

## Overview

**Relaxing Minesweeper** is a modern, web-based implementation of the classic Minesweeper game with a focus on creating a peaceful, stress-free gaming experience. The application combines traditional gameplay mechanics with innovative features designed to reduce frustration and enhance relaxation.

## Core Game Features

### 🎯 Classic Minesweeper Gameplay
- **Left-click** to reveal cells
- **Right-click** to flag/unflag potential mines
- **Mine Counter** shows remaining unflagged mines
- **Timer** tracks game duration
- **Safe First Click** - ensures you never hit a mine on your first click
- **Auto-reveal** of adjacent empty cells when clicking an empty cell
- **Win/Loss Detection** with appropriate visual feedback

### 🎚️ Difficulty Levels
- **Easy**: 9x9 grid with 10 mines
- **Medium**: 16x16 grid with 40 mines  
- **Hard**: 30x16 grid with 99 mines
- **Custom**: User-defined grid size and mine count
  - Grid size: 5x5 to 500x500
  - Configurable mine count with automatic validation

## Advanced Gameplay Features

### ⚡ Speedrun Mode (Default: Enabled)
Enhances gameplay efficiency with advanced interaction methods:
- **Chord Clicking**: Click on a revealed number to automatically reveal surrounding cells if the correct number of mines are flagged
- **Auto-flagging**: Right-click on a revealed number to automatically flag remaining mines if the pattern can be determined
- **Customizable Controls**: Choose which mouse button performs each action
- **Performance Tracking**: Statistics track whether speedrun mode was used

### 🛡️ Safe Mode 
Ensures solvable puzzles without guessing:
- **No 50/50 Situations**: Prevents unsolvable configurations that require guessing
- **Logic-Based Solutions**: All mines can be determined through logical deduction
- **Board Regeneration**: Automatically generates new boards if current one isn't solvable
- **Statistics Tracking**: Separate tracking for games played with safe mode enabled

### 🧘 Zen Mode - Unique Progressive Difficulty System
A calming, endless mode that adapts to provide optimal challenge:

#### Level Progression
- **Starts Easy**: Level 1 begins with 9x9 grid, 10 mines
- **Gradual Scaling**: Grid size increases every 5 levels
- **Dynamic Mine Density**: Mine percentage gradually increases from ~12% to max ~22%
- **Infinite Levels**: No upper limit, allowing endless progression

#### Zen Mode Features
- **Automatic Safe Mode**: Always enabled to prevent frustrating situations
- **Level Indicator**: Prominently displays current level
- **Respawn System**: Option to replay failed levels
- **Progress Tracking**: 
  - Best level reached in one continuous run (no respawns)
  - Best level reached with respawns allowed
- **State Persistence**: Automatically saves progress between sessions
- **Smooth Transitions**: Seamless progression between levels with visual feedback

#### Zen Mode UI/UX
- **Dedicated Start Modal**: Choose to start new or continue previous progress
- **Loss Modal**: Options to replay current level, restart from level 1, or return to menu
- **Visual Indicators**: Title changes to "Zen Mode", special level indicator
- **No New Game Button**: Removed during Zen Mode to prevent accidental resets

## Visual Design & Themes

### 🎨 Theme System
**12 Built-in Themes:**
- **Default**: Clean, modern interface
- **Ocean**: Blue oceanic color palette
- **Forest**: Green nature-inspired colors
- **Sunset**: Warm orange/pink tones
- **Dark Mode**: High-contrast dark interface
- **Night Sky**: Deep blue with star-like accents
- **Pastel**: Soft, muted colors
- **Japanese Garden**: Zen-inspired earth tones
- **Spring**: Fresh green and flower colors
- **Summer**: Bright, sunny yellow/orange
- **Autumn**: Rich reds, oranges, and browns
- **Winter**: Cool blues and whites

### 🎨 Custom Color System
- **Full Color Customization**: Modify any theme element
- **Color Picker Interface**: Easy-to-use color selection
- **Customizable Elements**:
  - Background color
  - Board background
  - Cell colors (unrevealed/revealed)
  - Text colors
  - Accent colors
- **Real-time Preview**: See changes immediately
- **Persistent Storage**: Custom colors saved between sessions

### ✨ Animations & Visual Effects
- **Smooth Transitions**: Between menu and gameplay views
- **Cell Reveal Animations**: Gentle transitions when revealing cells
- **Ripple Effects**: Subtle visual feedback on interactions
- **Animated Backgrounds**: Optional floating particles matching current theme
- **Level-up Animations**: Special effects for Zen Mode progression
- **Achievement Popups**: Celebratory notifications for unlocked achievements

## Audio System

### 🔊 Sound Effects
- **Click Sounds**: Gentle feedback for all interactions
- **Game Event Sounds**: Distinct audio cues for:
  - Flagging mines
  - Winning games
  - Losing games
  - Menu interactions

### 🎵 Background Audio (Planned Feature)
- **Calming Soundscapes**: Forest, rain, ocean ambient sounds
- **Volume Controls**: Independent volume adjustment
- **Mute Options**: Quick audio disable
- **Audio Persistence**: Settings saved between sessions

*Note: Background music mentioned in TODO but not yet implemented*

## Statistics & Progress Tracking

### 📊 Game Statistics
**Overall Statistics:**
- Total games played/won
- Overall win rate percentage
- Current win streak
- Best win streak achieved
- Daily play streak tracking

**Difficulty-Specific Stats:**
- Games played/won per difficulty
- Win rates for each difficulty level
- Personal best times for standard difficulties
- Custom game best times (tracked by dimensions/mine count)

**Zen Mode Progress:**
- Best level reached without respawns (single run)
- Best level reached with respawns allowed
- Current run tracking (level, respawn usage)

### 🏆 Achievement System
**Win-Based Achievements:**
- First Win
- 10, 50, 100 total wins
- Difficulty mastery (20 Easy, 15 Medium, 10 Hard wins)

**Performance Achievements:**
- Perfect games (no wrong flags): Easy, Medium, Hard
- Speed achievements: Win under time thresholds
  - Easy: Under 30 seconds
  - Medium: Under 120 seconds  
  - Hard: Under 300 seconds

**Milestone Achievements:**
- 100, 1000 games played
- 50%, 75% win rate achievements
- 7-day, 30-day play streaks

**Achievement Features:**
- Visual indicators (🏆 unlocked, 🔒 locked)
- Hover tooltips with descriptions
- Achievement popup notifications
- Progress tracking for incremental achievements

### 📈 Game History
- **Detailed Records**: Date, time, settings used for each win
- **Mode Indicators**: Visual markers for Speedrun/Safe mode usage
- **Searchable History**: View recent games by difficulty
- **Export Options**: Statistics reset functionality

## Game State Management

### 💾 Automatic Saving
**Standard Modes:**
- Game state saved during active play
- Resume exactly where you left off
- Automatic cleanup on win/loss
- Preserves board state, timer, flags, all settings

**Zen Mode:**
- Separate save system for continuous progression  
- Complete game state preservation
- Progress level tracking
- Respawn state management

### 🔄 State Persistence
- **Settings**: All preferences saved in localStorage
- **Theme Selection**: Custom colors and theme choice
- **Audio Preferences**: Volume and mute settings
- **Control Mapping**: Custom mouse button assignments
- **Tutorial State**: Tracks whether tutorial has been seen

### 🎮 Game Recovery
- **Automatic Detection**: Saved games loaded on startup
- **Priority System**: Zen games take precedence over standard games
- **Error Handling**: Corrupted saves automatically cleared
- **Manual Override**: Options to start fresh when desired

## User Interface & Controls

### 🖱️ Control Customization
**Mouse Button Mapping:**
- **Reveal Cells**: Left click (default) or right click
- **Flag Mines**: Right click (default) or left click  
- **Chord Actions**: Left/right click or disabled
- **Auto-flag**: Left/right click or disabled

**Keyboard Controls:**
- **Arrow Keys**: Navigate tutorial pages
- **Escape**: Close modals and tutorial
- **Spacebar**: Pause/resume (when implemented)

### 📱 Interface Modes
**Main Screen:**
- Difficulty indicator with current selection
- Statistics overview (win rate, current streak)
- Mode indicators (Speedrun ⚡, Safe Mode 🛡️)
- Game control buttons

**In-Game UI:**
- Mine counter
- Timer display
- Zen level indicator (when applicable)
- Pause/New Game controls
- Mode status indicators

**Modal System:**
- Options/Settings menu
- Custom game configuration
- Statistics viewer
- Tutorial system
- Zen Mode dialogs
- Results screens

### 🎯 Responsive Design
- **Flexible Layout**: Adapts to different screen sizes
- **Centered Gameplay**: Game board automatically centered during play
- **Touch-Friendly**: Large touch targets for mobile use
- **Zoom Support**: Handles browser zoom gracefully

## Tutorial System

### 📚 Interactive Learning
**3-Page Tutorial System:**
- **Basic Gameplay**: Core mechanics and controls
- **Pattern Recognition**: Common mine patterns and solving techniques
- **Advanced Strategies**: Speedrun mode features and optimization tips

**Tutorial Features:**
- **Navigation**: Previous/Next buttons, page indicators
- **Keyboard Support**: Arrow key navigation
- **Skip Option**: Quick exit with "don't show again" checkbox
- **Smart Display Logic**: Only shows for new users or when requested
- **State Tracking**: Remembers if tutorial has been seen

**Display Conditions:**
- First-time users (no games played)
- Users who haven't seen tutorial before
- Manual access through menu options
- Respects "don't show again" preference

## Performance & Technical Features

### ⚡ Optimization
- **Efficient Rendering**: Optimized for large custom boards
- **Animation Performance**: Smooth 60fps animations where possible
- **Memory Management**: Proper cleanup of event listeners and timers
- **Smart Loading**: Lazy loading of tutorial content

### 🔧 Configuration System
- **Modular Architecture**: Separate modules for game logic, UI, audio, etc.
- **JSON Configuration**: Easy modification of game parameters
- **Event-Driven Design**: Clean separation of concerns
- **Error Handling**: Graceful degradation when features fail

### 💽 Storage Management
- **localStorage Integration**: Persistent data storage
- **Data Validation**: Automatic cleanup of corrupted saves
- **Storage Efficiency**: Optimized data structures
- **Privacy**: All data stored locally, no external servers

## Accessibility Features

### ♿ Current Accessibility
- **Keyboard Navigation**: Full keyboard support for tutorials
- **Visual Indicators**: Clear visual feedback for all actions
- **Color Options**: High contrast themes available
- **Text Readability**: Careful font choices and sizing

### 🔮 Planned Accessibility (From TODO)
- **Scalable UI**: User-configurable board/tile/text sizes
- **Enhanced Contrast**: Additional high-contrast options
- **Screen Reader Support**: ARIA labels and proper semantic markup
- **Motor Accessibility**: Alternative input methods

## Mobile & Cross-Platform Support

### 📱 Current Mobile Features
- **Responsive Design**: Adapts to mobile screen sizes
- **Touch Controls**: Basic touch support for tapping and long-press
- **Mobile-Friendly UI**: Appropriately sized buttons and controls

### 🔮 Planned Mobile Enhancements (From TODO)
- **Optimized Touch Controls**: Enhanced mobile interaction
- **Pinch-to-Zoom**: For large custom boards
- **Mobile-Specific UI**: Tailored interface for mobile devices
- **Touch Gestures**: Advanced gesture support

## Future Enhancements (From TODO)

### 🎮 Gameplay Features
- **Pattern/Puzzle Mode**: Special mine arrangements and daily challenges
- **Zen Garden Mode**: Visual transformation of revealed cells into garden elements
- **Multiplayer Zen**: Collaborative puzzle-solving experience

### 🎵 Audio Expansion  
- **Background Music**: Implementation of calming background soundtracks
- **Enhanced Audio**: More sound options and ambient audio

### 🌐 Platform Features
- **Progressive Web App**: Offline functionality and app-like experience
- **Cloud Sync**: Optional cloud storage for cross-device progress
- **Social Features**: Leaderboards and achievement sharing

## Technical Architecture

### 🏗️ Module Structure
- **main.js**: Core initialization and event coordination
- **game.js**: Game logic, win/loss detection, board generation
- **ui.js**: User interface management and DOM manipulation  
- **state.js**: Game state management and data flow
- **storage.js**: Persistent storage operations
- **statistics.js**: Statistics tracking and achievement system
- **audio.js**: Sound effect management
- **tutorial.js**: Tutorial system implementation
- **controller.js**: Input handling and control mapping
- **theme-customizer.js**: Theme and color customization

### 🎨 Styling Architecture
- **Modular CSS**: Separate files for different feature areas
- **CSS Custom Properties**: Theme system built on CSS variables
- **Animation Library**: Dedicated animation styles
- **Responsive Framework**: Mobile-first responsive design

### 🧪 Testing
- **Jest Framework**: Unit testing for critical functions
- **DOM Testing**: jsdom environment for UI testing
- **Feature Testing**: Specific tests for Zen mode and statistics

## Installation & Usage

### 🚀 Quick Start
1. **No Installation Required**: Runs directly in web browser
2. **Local Server Option**: Use Python HTTP server for development
3. **File Access**: Can run directly from file system
4. **Browser Compatibility**: Works in all modern browsers

### 🔧 Development Setup
```bash
# Option 1: Direct file access
# Simply open index.html in your browser

# Option 2: Local server (recommended)
cd path/to/minesweeper
python -m http.server 8000
# Navigate to http://localhost:8000
```

### 📋 System Requirements
- **Browser**: Any modern web browser (Chrome, Firefox, Safari, Edge)
- **JavaScript**: ES6+ support required
- **Storage**: ~1MB for saves and settings
- **Audio**: Web Audio API support for sound effects

## Conclusion

Relaxing Minesweeper represents a comprehensive reimagining of the classic game, focusing on user experience, progressive difficulty, and stress-free gameplay. The combination of traditional mechanics with modern features like Zen Mode, comprehensive statistics, and extensive customization options creates a unique and engaging puzzle experience suitable for both casual players and minesweeper enthusiasts.

The application's modular architecture, attention to accessibility, and focus on relaxation make it a standout implementation that prioritizes player enjoyment over frustration, while still maintaining the strategic depth that makes minesweeper compelling.
