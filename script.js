// State management
let currentMode = 'text';
let currentPage = 'home';
let isDrawing = false;
let currentFontSize = 14;
let currentColor = 'black';
let currentAlignment = 'left';
let currentStrokeSize = 3;

// Canvas elements
let canvas, ctx, canvasCollab, ctxCollab;

// User colors for collaboration
const userColors = ['black', 'red', 'blue', 'green'];
let currentUserIndex = 0;
let currentUserColor = userColors[currentUserIndex];

// Socket.io client for real-time collaboration
let socket = null;
let currentRoomId = null;
let isConnected = false;
let connectedUsers = [];
let isReceivingUpdate = false; // Flag to prevent echo when receiving updates

// Shape drawing state
let currentDrawTool = 'freehand'; // 'freehand', 'rectangle', 'circle'
let shapes = []; // Array to store created shapes
let isCreatingShape = false;
let shapeStartPos = null;

// Initialize
window.addEventListener('load', () => {
    canvas = document.getElementById('drawingCanvas');
    canvasCollab = document.getElementById('drawingCanvasCollab');

    if (canvas) {
        ctx = canvas.getContext('2d');
        setCanvasSize();
        setupCanvas(canvas, ctx);
    }

    if (canvasCollab) {
        ctxCollab = canvasCollab.getContext('2d');
        setCanvasSize();
        setupCanvas(canvasCollab, ctxCollab);
    }

    // Initialize controls
    updateFontSizeDisplay();
    selectColor('black');
    setAlignment('left');
    generateShareLink();

    // Setup both editors
    setupEditor('textEditor');
    setupEditor('textEditorCollab');
});

window.addEventListener('resize', () => {
    setCanvasSize();
});

// ============================================================================
// SOCKET.IO CLIENT - REAL-TIME COLLABORATION
// ============================================================================

function initializeSocket() {
    // Connect to Socket.io server
    socket = io(window.location.origin);

    socket.on('connect', () => {
        console.log('Connected to server');
        isConnected = true;

        // If we're on collab page and have a room ID, join it
        if (currentPage === 'collab' && currentRoomId) {
            socket.emit('join-room', currentRoomId);
        }
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        isConnected = false;
    });

    // Handle room full error
    socket.on('room-full', (data) => {
        alert(data.message);
        // Redirect back to home page
        if (currentPage === 'collab') {
            goToHome();
        }
    });

    // Receive initial room state when joining
    socket.on('room-state', (state) => {
        console.log('Received room state:', state);
        isReceivingUpdate = true;

        // Set user color
        currentUserColor = state.yourColor;
        const colorIndex = userColors.indexOf(state.yourColor);
        if (colorIndex !== -1) {
            currentUserIndex = colorIndex;
        }

        // Update user list
        connectedUsers = state.users;
        updateUserListUI(state.users);

        // Load content
        const editor = document.getElementById('textEditorCollab');
        if (editor && state.content.html) {
            editor.innerHTML = state.content.html;
        }

        // Load drawings
        if (state.drawings && state.drawings.length > 0 && canvasCollab) {
            const ctx = canvasCollab.getContext('2d');
            state.drawings.forEach(stroke => {
                drawStrokeOnCanvas(ctx, stroke);
            });
        }

        isReceivingUpdate = false;
    });

    // Handle text updates from other users
    socket.on('text-update', (data) => {
        if (currentPage !== 'collab') return;

        isReceivingUpdate = true;
        const editor = document.getElementById('textEditorCollab');
        if (editor) {
            // Save cursor position
            const selection = window.getSelection();
            let cursorPos = 0;
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                cursorPos = range.startOffset;
            }

            // Update content
            editor.innerHTML = data.content.html;

            // Restore cursor position (simplified)
            try {
                const range = document.createRange();
                const sel = window.getSelection();
                if (editor.childNodes.length > 0) {
                    range.setStart(editor.childNodes[0], Math.min(cursorPos, editor.textContent.length));
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            } catch (e) {
                // Cursor restoration failed, not critical
            }
        }
        isReceivingUpdate = false;
    });

    // Handle drawing updates from other users
    socket.on('drawing-update', (stroke) => {
        if (currentPage !== 'collab' || !canvasCollab) return;

        const ctx = canvasCollab.getContext('2d');
        drawStrokeOnCanvas(ctx, stroke);
    });

    // Handle canvas clear
    socket.on('canvas-cleared', () => {
        if (currentPage !== 'collab' || !canvasCollab) return;

        const ctx = canvasCollab.getContext('2d');
        ctx.clearRect(0, 0, canvasCollab.width, canvasCollab.height);
    });

    // Handle user joined
    socket.on('user-joined', (user) => {
        console.log('User joined:', user);
        connectedUsers.push(user);
        updateUserListUI(connectedUsers);
    });

    // Handle user left
    socket.on('user-left', (userId) => {
        console.log('User left:', userId);
        connectedUsers = connectedUsers.filter(u => u.id !== userId);
        updateUserListUI(connectedUsers);
    });

    // Handle users update
    socket.on('users-update', (users) => {
        connectedUsers = users;
        updateUserListUI(users);
    });
}

// Helper function to draw a stroke on canvas
function drawStrokeOnCanvas(ctx, stroke) {
    if (!stroke.points || stroke.points.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = stroke.color || 'black';
    ctx.lineWidth = stroke.size || 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
}

// Update user list UI
function updateUserListUI(users) {
    const userListDesktop = document.querySelector('.user-list-desktop');
    const colorDisplay = document.getElementById('currentUserColor');

    if (colorDisplay) {
        colorDisplay.textContent = currentUserColor.charAt(0).toUpperCase() + currentUserColor.slice(1);
        colorDisplay.style.color = currentUserColor;
    }

    if (!userListDesktop) return;

    // Clear existing user items
    userListDesktop.innerHTML = '';

    // Add user items
    users.forEach((user, index) => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';

        const userCircle = document.createElement('div');
        userCircle.className = `user-circle user-${user.color}`;

        // Highlight current user's circle
        if (user.color === currentUserColor) {
            userCircle.style.border = '3px solid #1a73e8';
            userCircle.style.boxShadow = '0 0 0 2px rgba(26, 115, 232, 0.3)';
        }

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'user-name-input';
        nameInput.placeholder = user.color === currentUserColor ? 'Your name' : 'Name';
        nameInput.value = user.name || '';
        nameInput.maxLength = 20;

        // Only allow editing own name
        if (user.color === currentUserColor) {
            nameInput.addEventListener('change', (e) => {
                if (socket && isConnected) {
                    socket.emit('username-change', e.target.value);
                }
            });
        } else {
            nameInput.disabled = true;
            nameInput.style.background = '#f5f5f5';
        }

        userItem.appendChild(userCircle);
        userItem.appendChild(nameInput);
        userListDesktop.appendChild(userItem);
    });

    // Update mobile user count
    const userCountText = document.querySelector('.user-count-text');
    if (userCountText) {
        userCountText.textContent = users.length;
    }
}

// Broadcast text changes to other users
function broadcastTextChange() {
    if (!socket || !isConnected || currentPage !== 'collab' || isReceivingUpdate) return;

    const editor = document.getElementById('textEditorCollab');
    if (!editor) return;

    const content = {
        text: editor.innerText || editor.textContent || '',
        html: editor.innerHTML
    };

    socket.emit('text-change', content);
}

// ============================================================================
// END SOCKET.IO CLIENT
// ============================================================================


// Set canvas size
function setCanvasSize() {
    const canvases = [
        { canvas: canvas, ctx: ctx },
        { canvas: canvasCollab, ctx: ctxCollab }
    ];

    canvases.forEach(({ canvas }) => {
        if (!canvas) return;

        if (window.innerWidth < 768) {
            canvas.width = window.innerWidth - 40;
            canvas.height = 500;
        } else if (window.innerWidth < 1024) {
            canvas.width = 700;
            canvas.height = 990;
        } else {
            canvas.width = 800;
            canvas.height = 1130;
        }
    });
}

// Setup editor with proper event listeners
function setupEditor(editorId) {
    const editor = document.getElementById(editorId);
    if (!editor) return;

    // Add placeholder text on first load
    if (!editor.textContent.trim() && !editor.querySelector('.placeholder-text')) {
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder-text';
        placeholder.style.color = '#999';
        placeholder.style.fontStyle = 'italic';
        placeholder.textContent = 'Click on the logo SyncPad to collaborate with others.';
        editor.appendChild(placeholder);
    }

    // Remove placeholder when user starts typing
    editor.addEventListener('input', (e) => {
        const placeholder = editor.querySelector('.placeholder-text');
        if (placeholder) {
            const textContent = editor.textContent.trim();
            const placeholderText = placeholder.textContent.trim();
            if (textContent && textContent !== placeholderText) {
                placeholder.remove();
            }
        }

        // Apply formatting as user types
        applyCurrentFormatting();

        // Track collaboration colors if on collab page
        if (currentPage === 'collab' && editorId === 'textEditorCollab') {
            markUserText(editor, currentUserColor);

            // Broadcast text changes to other users
            broadcastTextChange();
        }
    });

    // Track selection for updating controls
    editor.addEventListener('mouseup', () => {
        updateControlsFromSelection(editor);
    });

    editor.addEventListener('keyup', () => {
        updateControlsFromSelection(editor);
    });

    // Update format button states on selection change
    editor.addEventListener('selectionchange', () => {
        updateFormatButtonStates();
    });
}

// Apply current formatting to new text
function applyCurrentFormatting() {
    const isCollab = currentPage === 'collab';
    const editor = isCollab ?
        document.getElementById('textEditorCollab') :
        document.getElementById('textEditor');

    if (!editor) return;

    // Get font family
    const fontFamily = isCollab ?
        document.getElementById('fontFamilyCollab').value :
        document.getElementById('fontFamily').value;

    // Apply text alignment to the editor
    editor.style.textAlign = currentAlignment;

    // Apply formatting to selected text or prepare for next input
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        if (!range.collapsed) {
            // Apply to selection
            document.execCommand('fontSize', false, '7'); // Use largest size
            document.execCommand('foreColor', false, currentColor);
            document.execCommand('fontName', false, fontFamily);

            // Fix font size with actual pixel size
            const selectedText = range.toString();
            if (selectedText) {
                const span = document.createElement('span');
                span.style.fontSize = currentFontSize + 'px';
                span.style.color = currentColor;
                span.style.fontFamily = fontFamily;

                try {
                    range.surroundContents(span);
                } catch (e) {
                    // If surroundContents fails, use different approach
                    const contents = range.extractContents();
                    span.appendChild(contents);
                    range.insertNode(span);
                }
            }
        }
    }
}

// Update controls based on current selection
function updateControlsFromSelection(editor) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const container = range.commonAncestorContainer;
    const element = container.nodeType === Node.TEXT_NODE ?
        container.parentElement : container;

    if (element) {
        const styles = window.getComputedStyle(element);

        // Update font size
        if (styles.fontSize) {
            const size = parseInt(styles.fontSize);
            if (size >= 12 && size <= 24) {
                currentFontSize = size;
                updateFontSizeDisplay();
            }
        }

        // Update color
        if (styles.color) {
            const rgb = styles.color;
            if (rgb.includes('0, 0, 0') || rgb === 'black') selectColor('black');
            else if (rgb.includes('255, 0, 0') || rgb === 'red') selectColor('red');
            else if (rgb.includes('0, 0, 255') || rgb === 'blue') selectColor('blue');
            else if (rgb.includes('0, 128, 0') || rgb === 'green') selectColor('green');
        }
    }
}

// Mode switching
function switchMode(mode, buttonElement) {
    currentMode = mode;
    const isCollab = currentPage === 'collab';

    const textEditor = isCollab ?
        document.getElementById('textEditorCollab') :
        document.getElementById('textEditor');
    const canvasContainer = isCollab ?
        document.getElementById('canvasContainerCollab') :
        document.getElementById('canvasContainer');

    // Update button states
    if (buttonElement) {
        const buttons = buttonElement.parentElement.querySelectorAll('.mode-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        buttonElement.classList.add('active');
    }

    if (mode === 'text') {
        if (textEditor) textEditor.style.display = 'block';
        if (canvasContainer) canvasContainer.style.display = 'none';
        showTextControls();
    } else {
        if (textEditor) textEditor.style.display = 'none';
        if (canvasContainer) {
            canvasContainer.style.display = 'flex';
            // Re-initialize canvas if needed
            const canvas = isCollab ? canvasCollab : document.getElementById('drawingCanvas');
            if (canvas) {
                setCanvasSize();
                if (!canvas.getContext('2d').getImageData(0, 0, 1, 1).data[3]) {
                    // Canvas is empty, clear it
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }
        }
        showDrawControls();
    }
}

// Show/hide controls based on mode
function showTextControls() {
    const menuBars = document.querySelectorAll('.menu-bar');
    menuBars.forEach(menuBar => {
        const textControls = menuBar.querySelectorAll('.text-control');
        textControls.forEach(control => {
            control.style.display = control.classList.contains('font-size-control') ||
                control.classList.contains('align-controls') ? 'flex' : '';
        });

        const strokeControls = menuBar.querySelectorAll('.stroke-size-control');
        strokeControls.forEach(control => control.style.display = 'none');
    });
}

function showDrawControls() {
    const menuBars = document.querySelectorAll('.menu-bar');
    menuBars.forEach(menuBar => {
        const textControls = menuBar.querySelectorAll('.text-control');
        textControls.forEach(control => control.style.display = 'none');

        const strokeControls = menuBar.querySelectorAll('.stroke-size-control');
        strokeControls.forEach(control => control.style.display = 'flex');

        const shapeTools = menuBar.querySelectorAll('.shape-tools');
        shapeTools.forEach(tool => tool.style.display = 'flex');
    });

    // Set freehand as default
    selectDrawTool('freehand');
}

// Font size controls
function changeFontSize(delta) {
    currentFontSize = Math.max(12, Math.min(24, currentFontSize + delta));
    updateFontSizeDisplay();
    applyCurrentFormatting();
}

function updateFontSizeDisplay() {
    const homeDisplay = document.getElementById('fontSizeDisplay');
    const collabDisplay = document.getElementById('fontSizeDisplayCollab');

    if (homeDisplay) homeDisplay.textContent = currentFontSize;
    if (collabDisplay) collabDisplay.textContent = currentFontSize;
}

function showFontSizePicker() {
    const isCollab = currentPage === 'collab';
    const display = isCollab ?
        document.getElementById('fontSizeDisplayCollab') :
        document.getElementById('fontSizeDisplay');

    if (!display) return;

    // Create dropdown
    const dropdown = document.createElement('select');
    dropdown.style.position = 'absolute';
    dropdown.style.zIndex = '1000';
    dropdown.style.padding = '4px';
    dropdown.style.border = '1px solid #ccc';
    dropdown.style.borderRadius = '4px';
    dropdown.style.fontSize = '13px';
    dropdown.style.background = 'white';

    // Add options
    for (let i = 12; i <= 24; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === currentFontSize) option.selected = true;
        dropdown.appendChild(option);
    }

    // Position dropdown
    const rect = display.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + 2) + 'px';
    dropdown.style.left = rect.left + 'px';

    // Add to body
    document.body.appendChild(dropdown);
    dropdown.focus();

    // Handle selection
    dropdown.addEventListener('change', () => {
        currentFontSize = parseInt(dropdown.value);
        updateFontSizeDisplay();
        applyCurrentFormatting();
        document.body.removeChild(dropdown);
    });

    // Remove on blur
    dropdown.addEventListener('blur', () => {
        if (document.body.contains(dropdown)) {
            document.body.removeChild(dropdown);
        }
    });

    // Remove on click outside
    setTimeout(() => {
        const clickHandler = (e) => {
            if (!dropdown.contains(e.target) && e.target !== display) {
                if (document.body.contains(dropdown)) {
                    document.body.removeChild(dropdown);
                }
                document.removeEventListener('click', clickHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', clickHandler), 0);
    }, 0);
}

// Stroke size controls for drawing
function changeStrokeSize(delta) {
    currentStrokeSize = Math.max(1, Math.min(20, currentStrokeSize + delta));
    const homeDisplay = document.getElementById('strokeSizeDisplay');
    const collabDisplay = document.getElementById('strokeSizeDisplayCollab');

    if (homeDisplay) homeDisplay.textContent = currentStrokeSize;
    if (collabDisplay) collabDisplay.textContent = currentStrokeSize;
}

// Color selection
function selectColor(color) {
    currentColor = color;

    // Update all color circles
    const colorPickers = document.querySelectorAll('.color-picker');
    colorPickers.forEach(picker => {
        const circles = picker.querySelectorAll('.color-circle');
        circles.forEach(circle => {
            if (circle.dataset.color === color) {
                circle.classList.add('selected');
            } else {
                circle.classList.remove('selected');
            }
        });
    });

    if (currentMode === 'text') {
        applyCurrentFormatting();
    }
}

// Text alignment
function setAlignment(align) {
    currentAlignment = align;

    const isCollab = currentPage === 'collab';
    const editor = isCollab ?
        document.getElementById('textEditorCollab') :
        document.getElementById('textEditor');

    if (!editor || currentMode !== 'text') return;

    editor.focus();

    // Use execCommand for alignment
    if (align === 'left') {
        document.execCommand('justifyLeft', false, null);
    } else if (align === 'center') {
        document.execCommand('justifyCenter', false, null);
    } else if (align === 'right') {
        document.execCommand('justifyRight', false, null);
    }

    // Update all alignment buttons
    const buttons = ['alignLeft', 'alignCenter', 'alignRight',
        'alignLeftCollab', 'alignCenterCollab', 'alignRightCollab'];

    buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove('active');
    });

    if (align === 'left') {
        const leftBtn = document.getElementById('alignLeft');
        const leftBtnCollab = document.getElementById('alignLeftCollab');
        if (leftBtn) leftBtn.classList.add('active');
        if (leftBtnCollab) leftBtnCollab.classList.add('active');
    } else if (align === 'center') {
        const centerBtn = document.getElementById('alignCenter');
        const centerBtnCollab = document.getElementById('alignCenterCollab');
        if (centerBtn) centerBtn.classList.add('active');
        if (centerBtnCollab) centerBtnCollab.classList.add('active');
    } else if (align === 'right') {
        const rightBtn = document.getElementById('alignRight');
        const rightBtnCollab = document.getElementById('alignRightCollab');
        if (rightBtn) rightBtn.classList.add('active');
        if (rightBtnCollab) rightBtnCollab.classList.add('active');
    }

    applyCurrentFormatting();
}

// Format toggles (Bold, Italic, Underline)
function toggleFormat(format) {
    const isCollab = currentPage === 'collab';
    const editor = isCollab ?
        document.getElementById('textEditorCollab') :
        document.getElementById('textEditor');

    if (!editor || currentMode !== 'text') return;

    editor.focus();
    document.execCommand(format, false, null);

    // Update button state
    const btnId = format + (isCollab ? 'BtnCollab' : 'Btn');
    const btn = document.getElementById(btnId);

    if (btn) {
        const isActive = document.queryCommandState(format);
        btn.classList.toggle('active', isActive);
    }
}

// Update format button states based on current selection
function updateFormatButtonStates() {
    const isCollab = currentPage === 'collab';
    const editor = isCollab ?
        document.getElementById('textEditorCollab') :
        document.getElementById('textEditor');

    if (!editor || currentMode !== 'text') return;

    const formats = ['bold', 'italic', 'underline'];
    formats.forEach(format => {
        const btnId = format + (isCollab ? 'BtnCollab' : 'Btn');
        const btn = document.getElementById(btnId);
        if (btn) {
            const isActive = document.queryCommandState(format);
            btn.classList.toggle('active', isActive);
        }
    });
}

// Mark text with user color underline for collaboration
function markUserText(editor, userColor) {
    setTimeout(() => {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        if (range.collapsed) {
            const textNode = range.startContainer;
            if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent.length > 0) {
                const lastChar = textNode.textContent.length - 1;
                const charRange = document.createRange();
                charRange.setStart(textNode, Math.max(0, lastChar));
                charRange.setEnd(textNode, textNode.textContent.length);

                const span = document.createElement('span');
                span.style.textDecoration = 'underline';
                span.style.textDecorationColor = userColor;
                span.style.textDecorationThickness = '2px';
                span.className = `user-text user-${userColor}`;

                try {
                    charRange.surroundContents(span);
                } catch (e) {
                    const contents = charRange.extractContents();
                    span.appendChild(contents);
                    charRange.insertNode(span);
                }
            }
        }
    }, 10);
}

// Apply formatting (called when changing font family)
function applyFormatting() {
    applyCurrentFormatting();
}

// Canvas drawing
function setupCanvas(canvas, ctx) {
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);
}

function getPosition(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches && e.touches[0]) {
        return {
            x: (e.touches[0].clientX - rect.left) * scaleX,
            y: (e.touches[0].clientY - rect.top) * scaleY
        };
    }
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function startDrawing(e) {
    if (currentMode !== 'draw') return;
    e.preventDefault();

    const canvas = e.target;
    const ctx = canvas.getContext('2d');
    const pos = getPosition(e, canvas);

    // If creating a shape (rectangle or circle), start shape creation
    if (currentDrawTool === 'rectangle' || currentDrawTool === 'circle') {
        isCreatingShape = true;
        shapeStartPos = pos;
        return;
    }

    // Otherwise, freehand drawing
    isDrawing = true;

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineWidth = currentStrokeSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = currentColor;

    // Initialize stroke points for broadcasting
    if (currentPage === 'collab' && canvas === canvasCollab) {
        window.currentStrokePoints = [pos];
    }
}

function draw(e) {
    if (!isDrawing || currentMode !== 'draw') return;
    e.preventDefault();
    const canvas = e.target;
    const ctx = canvas.getContext('2d');
    const pos = getPosition(e, canvas);

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    // Collect stroke points for broadcasting
    if (currentPage === 'collab' && canvas === canvasCollab && window.currentStrokePoints) {
        window.currentStrokePoints.push(pos);
    }
}

function stopDrawing(e) {
    if (isDrawing) {
        e.preventDefault();

        // Broadcast the complete stroke to other users
        if (currentPage === 'collab' && window.currentStrokePoints && window.currentStrokePoints.length > 0) {
            const strokeData = {
                points: window.currentStrokePoints,
                color: currentColor,
                size: currentStrokeSize
            };

            if (socket && isConnected) {
                socket.emit('draw-stroke', strokeData);
            }

            window.currentStrokePoints = null;
        }
    }

    // Handle shape creation
    if (isCreatingShape && shapeStartPos) {
        const canvas = e.target;
        const endPos = getPosition(e, canvas);

        const width = Math.abs(endPos.x - shapeStartPos.x);
        const height = Math.abs(endPos.y - shapeStartPos.y);

        // Only create if shape is large enough
        if (width > 50 && height > 50) {
            // Switch to text mode to insert shape
            const wasInDrawMode = currentMode === 'draw';
            if (wasInDrawMode) {
                switchMode('text');
            }

            // Create shape in editor
            createShapeInEditor(currentDrawTool, width, height);

            // Switch back to draw mode if needed
            if (wasInDrawMode) {
                setTimeout(() => switchMode('draw'), 100);
            }
        }

        isCreatingShape = false;
        shapeStartPos = null;
    }

    isDrawing = false;
}

function handleTouchStart(e) {
    startDrawing(e);
}

function handleTouchMove(e) {
    draw(e);
}

// Navigation
function togglePage() {
    if (currentPage === 'home') {
        goToCollab();
    } else {
        goToHome();
    }
}

function goToCollab() {
    currentPage = 'collab';
    document.getElementById('homePage').classList.add('hidden');
    document.getElementById('collabPage').style.display = 'block';

    // Get or create room ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    let roomId = urlParams.get('collab');

    if (!roomId) {
        // Generate new room ID
        roomId = Math.random().toString(36).substr(2, 9);
        // Update URL without reloading page
        const newUrl = window.location.origin + window.location.pathname + '?collab=' + roomId;
        window.history.pushState({ path: newUrl }, '', newUrl);
    }

    currentRoomId = roomId;

    // Initialize Socket.io if not already initialized
    if (!socket) {
        initializeSocket();
    } else if (isConnected) {
        // Already connected, just join the room
        socket.emit('join-room', currentRoomId);
    }

    // Ensure editor is set up and mode is correct
    setupEditor('textEditorCollab');
    if (currentMode === 'text') {
        showTextControls();
    } else {
        showDrawControls();
    }
}

function goToHome() {
    currentPage = 'home';
    document.getElementById('collabPage').style.display = 'none';
    document.getElementById('homePage').classList.remove('hidden');

    // Ensure editor is set up
    setupEditor('textEditor');
    showTextControls();
}

// Clear content
function clearContent() {
    const isCollab = currentPage === 'collab';
    const editor = isCollab ?
        document.getElementById('textEditorCollab') :
        document.getElementById('textEditor');
    const canvas = isCollab ? canvasCollab : document.getElementById('drawingCanvas');

    if (confirm('Are you sure you want to clear all content?')) {
        if (editor) editor.innerHTML = '';
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Broadcast canvas clear to other users
            if (isCollab && socket && isConnected) {
                socket.emit('clear-canvas');
            }
        }
    }
}

// Download PDF
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const isCollab = currentPage === 'collab';
    const editor = isCollab ?
        document.getElementById('textEditorCollab') :
        document.getElementById('textEditor');

    if (currentMode === 'text') {
        const text = editor ? (editor.innerText || editor.textContent || '') : '';

        if (!text.trim()) {
            alert('No content to download!');
            return;
        }

        const doc = new jsPDF();
        doc.setFontSize(currentFontSize);

        const lines = doc.splitTextToSize(text, 180);
        let y = 15;
        const lineHeight = currentFontSize * 0.5;
        const pageHeight = doc.internal.pageSize.height;

        lines.forEach(line => {
            if (y + lineHeight > pageHeight - 20) {
                doc.addPage();
                y = 15;
            }
            doc.text(line, 15, y);
            y += lineHeight;
        });

        doc.save('syncpad-notes.pdf');
    } else {
        const canvas = isCollab ? canvasCollab : document.getElementById('drawingCanvas');
        if (!canvas) return;

        const imgData = canvas.toDataURL('image/png');

        const emptyCanvas = document.createElement('canvas');
        emptyCanvas.width = canvas.width;
        emptyCanvas.height = canvas.height;

        if (canvas.toDataURL() === emptyCanvas.toDataURL()) {
            alert('No drawing to download!');
            return;
        }

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        doc.save('syncpad-drawing.pdf');
    }
}

// Share link generation
function generateShareLink() {
    const randomId = Math.random().toString(36).substr(2, 9);
    const link = window.location.origin + window.location.pathname + '?collab=' + randomId;
    const linkInput = document.getElementById('shareLink');
    if (linkInput) linkInput.value = link;
}

// Copy link
function copyLink(buttonElement) {
    const link = window.location.origin + window.location.pathname + '?collab=' + Math.random().toString(36).substr(2, 9);

    // Create temporary input
    const tempInput = document.createElement('input');
    tempInput.value = link;
    document.body.appendChild(tempInput);
    tempInput.select();

    try {
        document.execCommand('copy');
        const btn = buttonElement || document.querySelector('.copy-link-btn');
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<span class="btn-icon">✓</span><span class="btn-text">Copied!</span>';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
            }, 2000);
        }
    } catch (err) {
        alert('Failed to copy link');
    }

    document.body.removeChild(tempInput);
}