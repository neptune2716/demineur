/**
 * Notification Module
 * Provides custom themed notifications that replace browser alerts
 */

// Track notification timeout IDs
const notificationTimeouts = {};
let notificationCounter = 0;

/**
 * Show a custom notification
 * @param {string} message - The message to display
 * @param {object} options - Notification options
 * @param {string} [options.type='info'] - Type of notification: 'success', 'error', 'warning', 'info'
 * @param {string} [options.title] - Optional title for the notification
 * @param {number} [options.duration=3000] - Duration in milliseconds to show the notification
 */
export function showNotification(message, options = {}) {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    // Create notification ID
    const notificationId = `notification-${notificationCounter++}`;
    
    // Set defaults
    const type = options.type || 'info';
    const title = options.title || getDefaultTitle(type);
    const duration = options.duration || 3000;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = notificationId;
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-title">
            <span>${title}</span>
            <button class="close-btn">&times;</button>
        </div>
        <div class="notification-message">${message}</div>
        <div class="notification-progress"></div>
    `;
    
    // Add event listener for close button
    const closeBtn = notification.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        closeNotification(notificationId);
    });
    
    // Add to container
    container.appendChild(notification);
    
    // Show notification with animation delay
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Set auto-close timer
    notificationTimeouts[notificationId] = setTimeout(() => {
        closeNotification(notificationId);
    }, duration);
}

/**
 * Close notification by ID
 */
function closeNotification(id) {
    const notification = document.getElementById(id);
    if (!notification) return;
    
    // Clear timeout
    if (notificationTimeouts[id]) {
        clearTimeout(notificationTimeouts[id]);
        delete notificationTimeouts[id];
    }
    
    // Hide notification
    notification.classList.remove('show');
    
    // Remove from DOM after animation
    setTimeout(() => {
        notification.remove();
    }, 400); // Match the CSS transition duration
}

/**
 * Get default title based on notification type
 */
function getDefaultTitle(type) {
    switch (type) {
        case 'success': return 'Success';
        case 'error': return 'Error';
        case 'warning': return 'Warning';
        default: return 'Information';
    }
}

/**
 * Shortcuts for different notification types
 */
export function showSuccess(message, options = {}) {
    showNotification(message, { ...options, type: 'success' });
}

export function showError(message, options = {}) {
    showNotification(message, { ...options, type: 'error' });
}

export function showWarning(message, options = {}) {
    showNotification(message, { ...options, type: 'warning' });
}

export function showInfo(message, options = {}) {
    showNotification(message, { ...options, type: 'info' });
}
