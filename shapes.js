// Shape Drawing Functions

// Select drawing tool
function selectDrawTool(tool) {
    currentDrawTool = tool;

    // Update button states
    const buttons = document.querySelectorAll('.shape-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    if (tool === 'freehand') {
        document.getElementById('freehandBtn')?.classList.add('active');
        document.getElementById('freehandBtnCollab')?.classList.add('active');
    } else if (tool === 'rectangle') {
        document.getElementById('rectangleBtn')?.classList.add('active');
        document.getElementById('rectangleBtnCollab')?.classList.add('active');
    } else if (tool === 'circle') {
        document.getElementById('circleBtn')?.classList.add('active');
        document.getElementById('circleBtnCollab')?.classList.add('active');
    }
}

// Create shape container in text editor
function createShapeInEditor(shapeType, width, height) {
    const isCollab = currentPage === 'collab';
    const editor = isCollab ?
        document.getElementById('textEditorCollab') :
        document.getElementById('textEditor');

    if (!editor) return;

    // Create shape container
    const shapeContainer = document.createElement('div');
    shapeContainer.className = 'shape-container';
    shapeContainer.style.width = width + 'px';
    shapeContainer.style.height = height + 'px';
    shapeContainer.style.float = 'right';
    shapeContainer.style.margin = '10px';
    shapeContainer.style.position = 'relative';
    shapeContainer.style.border = `2px solid ${currentColor}`;
    shapeContainer.style.borderRadius = shapeType === 'circle' ? '50%' : '8px';
    shapeContainer.style.background = 'rgba(255, 255, 255, 0.9)';
    shapeContainer.style.cursor = 'move';

    // Create canvas inside shape
    const shapeCanvas = document.createElement('canvas');
    shapeCanvas.width = width;
    shapeCanvas.height = height;
    shapeCanvas.style.width = '100%';
    shapeCanvas.style.height = '100%';
    shapeCanvas.style.borderRadius = shapeType === 'circle' ? '50%' : '8px';
    shapeCanvas.className = 'shape-canvas';

    shapeContainer.appendChild(shapeCanvas);

    // Setup drawing on this canvas
    setupShapeCanvas(shapeCanvas);

    // Make draggable
    makeShapeDraggable(shapeContainer);

    // Insert at cursor or at beginning
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.insertNode(shapeContainer);
    } else {
        editor.insertBefore(shapeContainer, editor.firstChild);
    }

    // Store shape data
    const shapeData = {
        type: shapeType,
        width: width,
        height: height,
        color: currentColor,
        id: `shape-${Date.now()}`
    };
    shapes.push(shapeData);

    // Broadcast shape creation
    if (isCollab && socket && isConnected) {
        socket.emit('create-shape', shapeData);
    }
}

// Setup drawing on shape canvas
function setupShapeCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let points = [];

    canvas.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        drawing = true;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineWidth = currentStrokeSize;
        ctx.lineCap = 'round';
        ctx.strokeStyle = currentColor;
        points = [{ x, y }];
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!drawing) return;
        e.stopPropagation();

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
        points.push({ x, y });
    });

    canvas.addEventListener('mouseup', (e) => {
        e.stopPropagation();
        drawing = false;
    });

    canvas.addEventListener('mouseleave', () => {
        drawing = false;
    });
}

// Make shape draggable
function makeShapeDraggable(element) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    element.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'CANVAS') return; // Don't drag when drawing

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = element.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        element.style.position = 'absolute';
        element.style.left = initialLeft + 'px';
        element.style.top = initialTop + 'px';
        element.style.float = 'none';

        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        element.style.left = (initialLeft + deltaX) + 'px';
        element.style.top = (initialTop + deltaY) + 'px';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { selectDrawTool, createShapeInEditor };
}
