/**
 * Theme Customizer Module
 * Handles theme customization including color pickers and seasonal themes
 */

// Default custom theme colors
const DEFAULT_CUSTOM_COLORS = {
    background: '#f8f9fa',
    boardBackground: '#e9ecef',
    cellColor: '#dee2e6',
    cellRevealed: '#ffffff',
    textColor: '#212529',
    accentColor: '#6c757d',
    mineColor: '#dc3545',
    flagColor: '#0d6efd'
};

// Initialize the color customizer
export function initColorCustomizer() {
    // Get the theme selector and color customizer elements
    const themeSelector = document.getElementById('theme');
    const colorCustomizer = document.getElementById('color-customizer');
    
    // Show or hide the color customizer based on theme selection
    themeSelector.addEventListener('change', function() {
        if (this.value === 'custom') {
            colorCustomizer.style.display = 'block';
            loadCustomColors();
        } else {
            colorCustomizer.style.display = 'none';
        }
    });
    
    // If custom theme is already selected, show the color customizer
    if (themeSelector.value === 'custom') {
        colorCustomizer.style.display = 'block';
        loadCustomColors();
    }
    
    // Initialize the color pickers with values from localStorage or defaults
    document.getElementById('custom-bg').addEventListener('input', updateCustomColor);
    document.getElementById('custom-board-bg').addEventListener('input', updateCustomColor);
    document.getElementById('custom-cell').addEventListener('input', updateCustomColor);
    document.getElementById('custom-revealed').addEventListener('input', updateCustomColor);
    document.getElementById('custom-text').addEventListener('input', updateCustomColor);
    document.getElementById('custom-accent').addEventListener('input', updateCustomColor);
    document.getElementById('custom-mine').addEventListener('input', updateCustomColor);
    document.getElementById('custom-flag').addEventListener('input', updateCustomColor);
    
    // Save custom colors button
    document.getElementById('save-custom-colors').addEventListener('click', saveCustomColors);
    
    // Reset custom colors button
    document.getElementById('reset-custom-colors').addEventListener('click', resetCustomColors);
}

// Load saved custom colors into the color pickers
function loadCustomColors() {
    const savedColors = getSavedCustomColors();
    
    // Set color picker values
    document.getElementById('custom-bg').value = savedColors.background;
    document.getElementById('custom-board-bg').value = savedColors.boardBackground;
    document.getElementById('custom-cell').value = savedColors.cellColor;
    document.getElementById('custom-revealed').value = savedColors.cellRevealed;
    document.getElementById('custom-text').value = savedColors.textColor;
    document.getElementById('custom-accent').value = savedColors.accentColor;
    document.getElementById('custom-mine').value = savedColors.mineColor;
    document.getElementById('custom-flag').value = savedColors.flagColor;
    
    // Apply the custom colors
    applyCustomColors(savedColors);
}

// Get saved custom colors from localStorage or use defaults
function getSavedCustomColors() {
    const savedColors = localStorage.getItem('customColors');
    return savedColors ? JSON.parse(savedColors) : DEFAULT_CUSTOM_COLORS;
}

// Update custom colors as the user adjusts the color pickers
function updateCustomColor(event) {
    const colorId = event.target.id;
    const color = event.target.value;
    
    // Get current custom colors
    const customColors = getSavedCustomColors();
    
    // Update the appropriate color
    switch (colorId) {
        case 'custom-bg':
            customColors.background = color;
            document.documentElement.style.setProperty('--background', color);
            break;
        case 'custom-board-bg':
            customColors.boardBackground = color;
            document.documentElement.style.setProperty('--board-background', color);
            break;
        case 'custom-cell':
            customColors.cellColor = color;
            document.documentElement.style.setProperty('--cell-color', color);
            break;
        case 'custom-revealed':
            customColors.cellRevealed = color;
            document.documentElement.style.setProperty('--cell-revealed', color);
            break;
        case 'custom-text':
            customColors.textColor = color;
            document.documentElement.style.setProperty('--text-color', color);
            break;
        case 'custom-accent':
            customColors.accentColor = color;
            document.documentElement.style.setProperty('--accent-color', color);
            break;
        case 'custom-mine':
            customColors.mineColor = color;
            document.documentElement.style.setProperty('--mine-color', color);
            break;
        case 'custom-flag':
            customColors.flagColor = color;
            document.documentElement.style.setProperty('--flag-color', color);
            break;
    }
    
    // Save updated colors to localStorage temporarily
    localStorage.setItem('tempCustomColors', JSON.stringify(customColors));
}

// Save custom colors to localStorage
function saveCustomColors() {
    // Get the temporary custom colors or current values
    const tempColors = localStorage.getItem('tempCustomColors');
    const currentColors = tempColors ? JSON.parse(tempColors) : collectCurrentCustomColors();
    
    // Save to localStorage
    localStorage.setItem('customColors', JSON.stringify(currentColors));
    localStorage.removeItem('tempCustomColors');
    
    // Show confirmation
    alert('Custom colors saved successfully!');
}

// Collect current custom colors from the color pickers
function collectCurrentCustomColors() {
    return {
        background: document.getElementById('custom-bg').value,
        boardBackground: document.getElementById('custom-board-bg').value,
        cellColor: document.getElementById('custom-cell').value,
        cellRevealed: document.getElementById('custom-revealed').value,
        textColor: document.getElementById('custom-text').value,
        accentColor: document.getElementById('custom-accent').value,
        mineColor: document.getElementById('custom-mine').value,
        flagColor: document.getElementById('custom-flag').value
    };
}

// Apply custom colors to the CSS variables
function applyCustomColors(colors) {
    document.documentElement.style.setProperty('--background', colors.background);
    document.documentElement.style.setProperty('--board-background', colors.boardBackground);
    document.documentElement.style.setProperty('--cell-color', colors.cellColor);
    document.documentElement.style.setProperty('--cell-revealed', colors.cellRevealed);
    document.documentElement.style.setProperty('--text-color', colors.textColor);
    document.documentElement.style.setProperty('--accent-color', colors.accentColor);
    document.documentElement.style.setProperty('--mine-color', colors.mineColor);
    document.documentElement.style.setProperty('--flag-color', colors.flagColor);
    
    // Calculate a suitable shadow color based on accent
    const shadowColor = `rgba(0, 0, 0, 0.1)`;
    document.documentElement.style.setProperty('--shadow-color', shadowColor);
    
    // Set animation colors
    document.documentElement.style.setProperty('--animation-color', colors.accentColor);
    document.documentElement.style.setProperty('--animation-secondary', colors.cellColor);
}

// Reset custom colors to default values
function resetCustomColors() {
    // Reset to default colors
    document.getElementById('custom-bg').value = DEFAULT_CUSTOM_COLORS.background;
    document.getElementById('custom-board-bg').value = DEFAULT_CUSTOM_COLORS.boardBackground;
    document.getElementById('custom-cell').value = DEFAULT_CUSTOM_COLORS.cellColor;
    document.getElementById('custom-revealed').value = DEFAULT_CUSTOM_COLORS.cellRevealed;
    document.getElementById('custom-text').value = DEFAULT_CUSTOM_COLORS.textColor;
    document.getElementById('custom-accent').value = DEFAULT_CUSTOM_COLORS.accentColor;
    document.getElementById('custom-mine').value = DEFAULT_CUSTOM_COLORS.mineColor;
    document.getElementById('custom-flag').value = DEFAULT_CUSTOM_COLORS.flagColor;
    
    // Apply the default colors
    applyCustomColors(DEFAULT_CUSTOM_COLORS);
    
    // Save to localStorage
    localStorage.setItem('customColors', JSON.stringify(DEFAULT_CUSTOM_COLORS));
}
