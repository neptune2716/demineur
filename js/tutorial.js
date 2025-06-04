/**
 * Tutorial Module
 * Provides interactive tutorial for learning Minesweeper strategies
 */

import * as Storage from './storage.js';
import * as Audio from './audio.js';
import * as Statistics from './statistics.js';

// Tutorial state variables
let currentPage = 1;
const totalPages = 3;
let tutorialModal;
let tutorialOpen = false;

// DOM elements
let prevButton;
let nextButton;
let pageIndicator;
let skipButton;
let dontShowCheckbox;

/**
 * Initialize the tutorial system
 */
export function initTutorial() {
    // Fetch the tutorial modal HTML and inject it into the page
    fetch('tutorial-modal.html')
        .then(response => response.text())
        .then(html => {
            // Inject the tutorial modal HTML into the document
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            document.body.appendChild(tempDiv.firstElementChild);
            
            // Now that the tutorial modal is in the DOM, initialize it
            setupTutorialElements();
            setupEventListeners();
            
            // Check if we should show the tutorial on startup
            checkIfShowTutorial();
        })
        .catch(error => console.error('Error loading tutorial modal:', error));
}

/**
 * Set up references to DOM elements
 */
function setupTutorialElements() {
    tutorialModal = document.getElementById('tutorial-modal');
    prevButton = document.getElementById('tutorial-prev');
    nextButton = document.getElementById('tutorial-next');
    pageIndicator = document.getElementById('tutorial-page-indicator');
    skipButton = document.getElementById('skip-tutorial');
    dontShowCheckbox = document.getElementById('dont-show-again');
}

/**
 * Set up event listeners for tutorial controls
 */
function setupEventListeners() {
    // Close button
    document.getElementById('tutorial-close').addEventListener('click', closeTutorial);
    
    // Navigation buttons
    prevButton.addEventListener('click', () => {
        Audio.playSound('click-sound');
        navigateTutorial(-1);
    });
    
    nextButton.addEventListener('click', () => {
        Audio.playSound('click-sound');
        navigateTutorial(1);
    });
      // Skip button
    skipButton.addEventListener('click', () => {
        Audio.playSound('click-sound');
        if (dontShowCheckbox.checked) {
            localStorage.setItem('dontShowTutorial', true);
        }
        closeTutorial();
    });
    
    // Close when clicking outside modal
    window.addEventListener('click', (event) => {
        if (event.target === tutorialModal) {
            closeTutorial();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!tutorialOpen) return;
        
        if (e.key === 'Escape') {
            closeTutorial();
        } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
            navigateTutorial(1);
        } else if (e.key === 'ArrowLeft' && currentPage > 1) {
            navigateTutorial(-1);
        }
    });
}

/**
 * Navigate between tutorial pages
 * @param {number} direction - Direction to navigate (1 for next, -1 for previous)
 */
function navigateTutorial(direction) {
    // Hide current page
    document.getElementById(`tutorial-page-${currentPage}`).style.display = 'none';
    
    // Update page number
    currentPage += direction;
    
    // Show new page
    document.getElementById(`tutorial-page-${currentPage}`).style.display = 'block';
    
    // Update navigation buttons state
    updateNavigationState();
}

/**
 * Update the state of navigation buttons based on current page
 */
function updateNavigationState() {
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
    pageIndicator.textContent = `${currentPage}/${totalPages}`;
}

/**
 * Open the tutorial modal
 */
export function openTutorial() {
    // Check if tutorial modal exists, if not, it might not be loaded yet
    if (!tutorialModal) {
        console.log('Tutorial modal not found, attempting to initialize');
        // Try to re-initialize tutorial elements
        setupTutorialElements();
        
        // If still not available, show a message and return
        if (!tutorialModal) {
            console.error('Tutorial modal not available yet');
            alert('Tutorial is loading, please try again in a moment.');
            return;
        }
    }

    // Reset to first page
    currentPage = 1;
    
    // Hide all pages and show the first one
    for (let i = 1; i <= totalPages; i++) {
        const page = document.getElementById(`tutorial-page-${i}`);
        if (page) page.style.display = 'none';
    }
    
    const firstPage = document.getElementById('tutorial-page-1');
    if (firstPage) firstPage.style.display = 'block';
    
    // Update navigation buttons
    updateNavigationState();
    
    // Show the modal
    tutorialModal.style.display = 'block';
    tutorialOpen = true;
    
    // Play sound
    Audio.playSound('click-sound');
}

/**
 * Open the tutorial modal silently (no sound)
 * Used for initial page load to avoid audio autoplay restrictions
 */
function openTutorialSilent() {
    // Check if tutorial modal exists, if not, it might not be loaded yet
    if (!tutorialModal) {
        console.log('Tutorial modal not found, attempting to initialize');
        // Try to re-initialize tutorial elements
        setupTutorialElements();
        
        // If still not available, show a message and return
        if (!tutorialModal) {
            console.error('Tutorial modal not available yet');
            return; // Don't show alert on auto-load
        }
    }

    // Reset to first page
    currentPage = 1;
    
    // Hide all pages and show the first one
    for (let i = 1; i <= totalPages; i++) {
        const page = document.getElementById(`tutorial-page-${i}`);
        if (page) page.style.display = 'none';
    }
    
    const firstPage = document.getElementById('tutorial-page-1');
    if (firstPage) firstPage.style.display = 'block';
    
    // Update navigation buttons
    updateNavigationState();
    
    // Show the modal
    tutorialModal.style.display = 'block';
    tutorialOpen = true;
    
    // No sound played here to avoid autoplay restrictions
}

/**
 * Close the tutorial modal
 */
function closeTutorial() {
    tutorialModal.style.display = 'none';
    tutorialOpen = false;
    Audio.playSound('click-sound');
}

/**
 * Check if we should show the tutorial on startup
 */
function checkIfShowTutorial() {
    const dontShow = localStorage.getItem('dontShowTutorial') === 'true';
    
    // Get statistics directly from localStorage to check if games have been played
    let hasPlayedGames = false;
    try {
        const stats = JSON.parse(localStorage.getItem('gameStatistics'));
        hasPlayedGames = stats && stats.games && stats.games.played > 0;
    } catch (e) {
        console.log('No valid statistics found in localStorage');
    }
    
    // Show tutorial if:
    // 1. User hasn't opted out with "don't show" checkbox
    // 2. User hasn't played any games yet
    if (!dontShow && !hasPlayedGames) {
        // Open tutorial without playing sound on initial load
        openTutorialSilent();
    }
}
