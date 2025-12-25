// ========================================
// SYNCPAD MINI - MODE SWITCHING
// Minimal extraction: ONLY mode switching logic
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log("Mode switching module loaded");

    // Get mode buttons and containers
    const modeBtns = document.querySelectorAll('.mode-btn');
    const textContainer = document.getElementById('text-container');
    const canvasContainer = document.getElementById('canvas-container');

    // Track current mode
    let currentMode = 'text';

    // Mode switching function
    function switchMode(mode) {
        currentMode = mode;

        // Update all mode buttons (sync desktop/mobile)
        modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Update containers
        textContainer.classList.toggle('active', mode === 'text');
        canvasContainer.classList.toggle('active', mode === 'canvas');

        // Trigger resize event for canvas if switching to canvas
        if (mode === 'canvas') {
            // Dispatch custom event that inline script can listen to
            window.dispatchEvent(new CustomEvent('canvasModeActivated'));
        }
    }

    // Attach click listeners to mode buttons
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            switchMode(mode);
        });
    });

    // Expose to global scope (for debugging)
    window.SyncPadMode = {
        currentMode: () => currentMode,
        switchMode
    };
});
