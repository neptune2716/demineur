/**
 * Audio Module
 * Handles all game sounds and audio settings
 */

// Audio system variables
export let audioEnabled = true;
export let volumeLevel = 0.5;
export let backgroundAudio = null;
export let currentBackgroundAudio = 'none';

// Audio context for advanced audio processing
let audioContext = null;
let audioAnalyser = null;
let audioGainNode = null;

// Sound effect configuration
const SOUND_EFFECTS = {
    'click': {
        id: 'click-sound',
        fadeOut: 0.3,
        file: 'click.wav', // Updated file extension
        volumeAdjust: 1  // Increase click sound volume (was too quiet)
    },
    'flag': {
        id: 'flag-sound',
        fadeOut: 0.5,
        file: 'flag.mp3',
        volumeAdjust: 0.15  // Decrease flag sound volume (was too loud)
    },
    'win': {
        id: 'win-sound',
        fadeOut: 1.0,
        file: 'win.wav', // Updated file extension
        delay: 500      // Add 0.5s delay to avoid overlap with other sounds
    },
    'lose': {
        id: 'lose-sound',
        fadeOut: 1.5,
        file: 'lose.wav', // Updated file extension
        volumeAdjust: 0.8 // Slightly reduce lose sound volume
    }
};

// Initialize Web Audio API
export function initAudioContext() {
    try {
        // Create audio context only on user interaction to comply with browser policies
        if (!audioContext && window.AudioContext) {
            audioContext = new AudioContext();
            audioGainNode = audioContext.createGain();
            audioGainNode.connect(audioContext.destination);
            audioGainNode.gain.value = volumeLevel;
            
            // Create analyser for visualization if needed in the future
            audioAnalyser = audioContext.createAnalyser();
            audioAnalyser.fftSize = 256;
            audioAnalyser.connect(audioGainNode);
            
            console.log("Audio context initialized successfully");
        }
    } catch (error) {
        console.error("Failed to initialize audio context:", error);
    }
}

// Store audio connections to prevent creating multiple connections for the same element
const connectedAudioElements = new Map();

// Play a sound effect
export function playSound(soundId) {
    if (!audioEnabled) return;
    
    // Initialize audio context on first user interaction if needed
    if (!audioContext) initAudioContext();
    
    const sound = document.getElementById(soundId);
    if (sound) {
        // Get sound effect config if available
        const effectName = soundId.replace('-sound', '');
        const config = SOUND_EFFECTS[effectName] || { fadeOut: 0.5 };
        
        // Apply delay if specified in the config
        const playWithDelay = () => {
            // Basic fallback approach if Web Audio API isn't available
            if (!audioContext) {
                // Apply volume adjustment if specified
                const adjustedVolume = volumeLevel * (config.volumeAdjust || 1);
                sound.volume = Math.min(1, adjustedVolume); // Ensure volume doesn't exceed 1
                sound.currentTime = 0;
                sound.play().catch(error => {
                    console.log("Audio play failed:", error);
                });
                return;
            }
            
            // Create or reuse audio source
            let source;
            let gainNode;
            
            // Check if this audio element is already connected
            if (!connectedAudioElements.has(soundId)) {
                // First time - create new source and connection
                source = audioContext.createMediaElementSource(sound);
                gainNode = audioContext.createGain();
                
                // Store connection info for reuse
                connectedAudioElements.set(soundId, { source, gainNode });
                
                // Connect the source to the gain node and then to the main audio context
                source.connect(gainNode);
                gainNode.connect(audioContext.destination);
            } else {
                // Reuse existing connections
                const connections = connectedAudioElements.get(soundId);
                source = connections.source;
                gainNode = connections.gainNode;
            }
            
            // Set current volume with adjustment if specified
            const adjustedVolume = volumeLevel * (config.volumeAdjust || 1);
            gainNode.gain.value = Math.min(1, adjustedVolume); // Ensure volume doesn't exceed 1
            
            // Reset and play the sound
            sound.currentTime = 0;
            sound.play().then(() => {
                // Apply fade out at the end for smoother sound
                const duration = sound.duration || config.fadeOut;
                const fadeStart = duration - config.fadeOut;
                
                // Schedule fade out
                setTimeout(() => {
                    const fadeOutTime = audioContext.currentTime + config.fadeOut;
                    gainNode.gain.linearRampToValueAtTime(adjustedVolume, audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0, fadeOutTime);
                    
                }, fadeStart * 1000);
            }).catch(error => {
                console.log("Audio play failed:", error);
            });
        };
        
        // Check if we need to delay the sound
        if (config.delay && config.delay > 0) {
            setTimeout(playWithDelay, config.delay);
        } else {
            playWithDelay();
        }
    }
}

// TEMPORARILY DISABLED: Play background ambient audio with crossfade
// Background audio feature is on standby due to large file sizes
export function playBackgroundAudio(type) {
    console.log("Background audio currently disabled");
    // PLACEHOLDER: Background audio functionality disabled
    
    // Update current background audio reference for state tracking
    currentBackgroundAudio = type;
}

// TEMPORARILY DISABLED: Pause background audio with fade out
export function pauseBackgroundAudio() {
    console.log("Background audio currently disabled");
    // PLACEHOLDER: Background audio pause functionality disabled
}

// Update volume for all audio elements
export function updateVolume() {
    // Update master gain if using Web Audio API
    if (audioContext && audioGainNode) {
        audioGainNode.gain.value = volumeLevel;
    }
    
    // Also update individual audio elements
    const sounds = document.querySelectorAll('audio');
    sounds.forEach(sound => {
        if (sound.id.includes('-audio')) {
            // Lower volume for background audio
            sound.volume = volumeLevel * 0.5;
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
    // Sound toggle listener
    document.getElementById('sound-toggle').addEventListener('change', function() {
        audioEnabled = this.checked;
        
        // Initialize audio context on first enable
        if (audioEnabled) {
            initAudioContext();
            
            // Resume audio context if it was suspended
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            // Resume background audio if needed
            if (currentBackgroundAudio !== 'none') {
                playBackgroundAudio(currentBackgroundAudio);
            }
        } else {
            // Pause all audio when disabled
            pauseBackgroundAudio();
            
            // Suspend audio context to save resources
            if (audioContext && audioContext.state === 'running') {
                audioContext.suspend();
            }
        }
        
        localStorage.setItem('audioEnabled', audioEnabled);
    });
    
    // Volume slider listener
    document.getElementById('volume').addEventListener('input', function() {
        volumeLevel = this.value / 100;
        updateVolume();
        localStorage.setItem('volumeLevel', volumeLevel);
        
        // Play a soft click to demonstrate new volume level
        if (audioEnabled && this.value % 10 === 0) {
            playSound('click-sound');
        }
    });
    
    // Background audio selection listener
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
    
    // Add focus event to ensure audio works after tab becomes active again
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && audioEnabled) {
            // Resume audio context if it was suspended
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            // Resume background audio if it was playing
            if (currentBackgroundAudio !== 'none' && backgroundAudio && backgroundAudio.paused) {
                playBackgroundAudio(currentBackgroundAudio);
            }
        }
    });
}
