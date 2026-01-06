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

            // Special handling for justify commands
            if (cmd === 'justifyFull' || cmd === 'justifyLeft' || cmd === 'justifyCenter' || cmd === 'justifyRight') {
                const selection = window.getSelection();

                if (selection.rangeCount > 0 && !selection.isCollapsed) {
                    const range = selection.getRangeAt(0);
                    const selectedContent = range.extractContents();

                    const alignDiv = document.createElement('div');

                    // Set alignment based on command
                    if (cmd === 'justifyFull') alignDiv.style.textAlign = 'justify';
                    else if (cmd === 'justifyLeft') alignDiv.style.textAlign = 'left';
                    else if (cmd === 'justifyCenter') alignDiv.style.textAlign = 'center';
                    else if (cmd === 'justifyRight') alignDiv.style.textAlign = 'right';

                    alignDiv.appendChild(selectedContent);
                    range.insertNode(alignDiv);

                    // Restore selection
                    const newRange = document.createRange();
                    newRange.selectNodeContents(alignDiv);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                }
            } else {
                // Regular command execution for other buttons
                document.execCommand(cmd, false, null);
            }

            textEditor.focus();
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
        if (textEditor.textContent.trim() === 'SYNCPAD_MINI by parveenengg(Parveen Kumar)') {
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

    // ========================================
    // JUSTIFY CONTENT SHORTCUT (Ctrl/Cmd + Shift + J)
    // ========================================
    textEditor.addEventListener('keydown', (e) => {
        // Check for Ctrl+Shift+J (Windows/Linux) or Cmd+Shift+J (Mac)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'j') {
            e.preventDefault();

            const selection = window.getSelection();
            if (selection.rangeCount > 0 && !selection.isCollapsed) {
                const range = selection.getRangeAt(0);
                const selectedContent = range.extractContents();

                const justifyDiv = document.createElement('div');
                justifyDiv.style.textAlign = 'justify';
                justifyDiv.appendChild(selectedContent);

                range.insertNode(justifyDiv);

                // Restore selection
                const newRange = document.createRange();
                newRange.selectNodeContents(justifyDiv);
                selection.removeAllRanges();
                selection.addRange(newRange);

                textEditor.focus();
            }
        }
    });
});