/**
 * Controller Module
 * Manages user input and control settings
 */

// Controller settings
export let revealButton = "left";    // "left" or "right"
export let flagButton = "right";     // "left" or "right"
export let chordButton = "left";     // "left", "right", or "none"
export let autoFlagButton = "right"; // "left", "right", or "none"

// Load controller settings from localStorage
export function loadControllerSettings() {
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
}

// Setup controller event listeners
export function setupControllerListeners() {
    document.querySelectorAll('input[name="reveal"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked) {                revealButton = this.value;
                // If both reveal and flag are set to the same button, switch the other one
                if (revealButton === flagButton) {
                    const newFlagButton = revealButton === "left" ? "right" : "left";
                    flagButton = newFlagButton;
                    document.querySelector(`input[name="flag"][value="${newFlagButton}"]`).checked = true;
                }
                try {
                    localStorage.setItem('revealButton', revealButton);
                    localStorage.setItem('flagButton', flagButton);
                } catch (error) {
                    console.warn('Failed to save controller settings:', error);
                }
            }
        });
    });
    
    document.querySelectorAll('input[name="flag"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked) {
                flagButton = this.value;                // If both reveal and flag are set to the same button, switch the other one
                if (flagButton === revealButton) {
                    const newRevealButton = flagButton === "left" ? "right" : "left";
                    revealButton = newRevealButton;
                    document.querySelector(`input[name="reveal"][value="${newRevealButton}"]`).checked = true;
                }
                try {
                    localStorage.setItem('flagButton', flagButton);
                    localStorage.setItem('revealButton', revealButton);
                } catch (error) {
                    console.warn('Failed to save controller settings:', error);
                }
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
}
