/**
 * Audio Module
 * Handles all game sounds and audio settings
 */

// Audio system variables
export let audioEnabled = true;
export let volumeLevel = 0.5;
export let backgroundAudio = null;
export let currentBackgroundAudio = 'none';

// Play a sound effect
export function playSound(soundId) {
    if (!audioEnabled) return;
    
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.volume = volumeLevel;
        sound.currentTime = 0;
        sound.play().catch(error => {
            console.log("Audio play failed:", error);
        });
    }
}

// Play background ambient audio
export function playBackgroundAudio(type) {
    pauseBackgroundAudio();
    
    if (!audioEnabled) return;
    
    backgroundAudio = document.getElementById(`${type}-audio`);
    if (backgroundAudio) {
        backgroundAudio.volume = volumeLevel * 0.5; // Background at 50% of effects
        backgroundAudio.loop = true;
        backgroundAudio.play().catch(error => {
            console.log("Background audio play failed:", error);
        });
    }
}

// Pause current background audio
export function pauseBackgroundAudio() {
    if (backgroundAudio) {
        backgroundAudio.pause();
    }
}

// Update volume for all audio elements
export function updateVolume() {
    const sounds = document.querySelectorAll('audio');
    sounds.forEach(sound => {
        if (sound.id.includes('-audio')) {
            sound.volume = volumeLevel * 0.5; // Background at 50% of effects
        } else {
            sound.volume = volumeLevel;
        }
    });
}

// Load audio preferences from localStorage
export function loadAudioPreferences() {
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
    }
}

// Setup audio event listeners
export function setupAudioListeners() {
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
    });
}
