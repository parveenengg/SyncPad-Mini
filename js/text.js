// ========================================
// SYNCPAD MINI - TEXT EDITOR
// Text toolbar and editor logic
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log("Text editor module loaded");

    // Get text editor DOM elements
    const textEditor = document.getElementById('editor');
    const textToolbar = document.querySelector('.text-toolbar');
    const fontFamily = document.getElementById('font-family');
    const fontSize = document.getElementById('font-size');
    const textColor = document.getElementById('text-color');
    const highlightColor = document.getElementById('highlight-color');
    const clearBtn = document.getElementById('clear-text-btn');
    const cmdBtns = document.querySelectorAll('.text-toolbar .tool-btn[data-cmd]');
    const imgBtn = document.getElementById('text-img-btn');
    const imgInput = document.getElementById('text-img-input');

    // ========================================
    // COMMAND BUTTONS (Bold, Italic, etc.)
    // ========================================
    cmdBtns.forEach(btn => {
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent focus loss
            const cmd = btn.dataset.cmd;
            document.execCommand(cmd, false, null);
        });
    });

    // ========================================
    // FONT FAMILY
    // ========================================
    fontFamily.addEventListener('change', (e) => {
        document.execCommand('fontName', false, e.target.value);
        textEditor.focus();
    });

    // ========================================
    // FONT SIZE
    // ========================================
    fontSize.addEventListener('change', (e) => {
        document.execCommand('fontSize', false, e.target.value);
        textEditor.focus();
    });

    // ========================================
    // TEXT COLOR
    // ========================================
    textColor.addEventListener('input', (e) => {
        document.execCommand('foreColor', false, e.target.value);
        textEditor.focus();
    });

    // ========================================
    // HIGHLIGHT COLOR
    // ========================================
    highlightColor.addEventListener('input', (e) => {
        document.execCommand('hiliteColor', false, e.target.value);
        textEditor.focus();
    });

    // ========================================
    // CLEAR TEXT BUTTON
    // ========================================
    clearBtn.addEventListener('click', () => {
        if (confirm('Clear all text?')) {
            textEditor.innerHTML = '<div class="placeholder">Start typing here...</div>';
        }
    });

    // ========================================
    // PLACEHOLDER HANDLING
    // ========================================
    textEditor.addEventListener('focus', () => {
        if (textEditor.textContent.trim() === 'Start typing here...') {
            textEditor.innerHTML = '';
        }
    });

    // ========================================
    // IMAGE UPLOAD
    // ========================================
    imgBtn.addEventListener('click', () => imgInput.click());

    imgInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (red) => {
                document.execCommand('insertImage', false, red.target.result);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = ''; // reset
    });
});
