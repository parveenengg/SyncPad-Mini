// Shape Drawing Functions

// Select drawing tool
function selectDrawTool(tool) {
    currentDrawTool = tool;

    // Update button states in both modes
    const allShapeButtons = document.querySelectorAll('.shape-btn');
    allShapeButtons.forEach(btn => btn.classList.remove('active'));

    // Activate all buttons for this tool (both Text and Canvas mode buttons)
    const toolButtons = document.querySelectorAll(`.shape-btn[title*="${tool}" i], .shape-btn[onclick*="${tool}"]`);
    toolButtons.forEach(btn => btn.classList.add('active'));
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
    shapeContainer.style.float = 'right'; // Default float
    shapeContainer.style.margin = '10px';
    shapeContainer.style.position = 'relative'; // Keeps it in flow initially

    // Styling based on shape type
    shapeContainer.style.border = `2px solid ${currentColor}`;
    shapeContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; // Transparent background

    if (shapeType === 'circle') {
        shapeContainer.style.borderRadius = '50%';
    } else {
        shapeContainer.style.borderRadius = '8px';
    }

    shapeContainer.style.cursor = 'move';

    // Create canvas inside shape
    const shapeCanvas = document.createElement('canvas');
    shapeCanvas.width = width;
    shapeCanvas.height = height;
    shapeCanvas.style.width = '100%';
    shapeCanvas.style.height = '100%';

    if (shapeType === 'circle') {
        shapeCanvas.style.borderRadius = '50%';
    } else {
        shapeCanvas.style.borderRadius = '8px';
    }

    shapeCanvas.className = 'shape-canvas';

    shapeContainer.appendChild(shapeCanvas);

    // Add delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '×';
    deleteBtn.style.position = 'absolute';
    deleteBtn.style.top = '-10px';
    deleteBtn.style.right = '-10px';
    deleteBtn.style.background = 'red';
    deleteBtn.style.color = 'white';
    deleteBtn.style.border = 'none';
    deleteBtn.style.borderRadius = '50%';
    deleteBtn.style.width = '20px';
    deleteBtn.style.height = '20px';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.display = 'none'; // Show on hover
    deleteBtn.onclick = function () {
        shapeContainer.remove();
    };

    shapeContainer.onmouseenter = () => deleteBtn.style.display = 'block';
    shapeContainer.onmouseleave = () => deleteBtn.style.display = 'none';
    shapeContainer.appendChild(deleteBtn);

    // Setup drawing on this canvas
    setupShapeCanvas(shapeCanvas);

    // Make draggable
    makeShapeDraggable(shapeContainer);

    // Insert at cursor or at end
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        let range = selection.getRangeAt(0);
        // Ensure we are inserting into the editor
        if (editor.contains(range.commonAncestorContainer)) {
            range.collapse(false);
            range.insertNode(shapeContainer);
        } else {
            editor.appendChild(shapeContainer);
        }
    } else {
        editor.appendChild(shapeContainer);
    }

    // Broadcast shape creation (TODO: Enhance collab logic for shapes)
    if (isCollab && socket && isConnected) {
        // socket.emit('create-shape', shapeData);
    }
}

// Setup drawing on shape canvas
function setupShapeCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    let drawing = false;

    // Prevent dragging container when drawing on canvas
    canvas.addEventListener('mousedown', (e) => {
        drawing = true;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineWidth = currentStrokeSize || 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = currentColor || 'black';
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!drawing) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    });

    window.addEventListener('mouseup', () => {
        drawing = false;
    });
}

// Make shape draggable
function makeShapeDraggable(element) {
    let isDragging = false;
    let startX, startY;

    element.addEventListener('mousedown', (e) => {
        // Do not drag if clicking on the canvas to draw
        if (e.target.tagName === 'CANVAS') return;

        isDragging = true;
        startX = e.clientX - element.offsetLeft;
        startY = e.clientY - element.offsetTop;

        // If it was floating, switch to absolute positioning for free drag?
        // User asked to "drag it up or down". Text flow usually means float.
        // If we want free drag, we need absolute.
        // Let's keep it simple: If they drag, maybe we switch to absolute.
        if (element.style.position !== 'absolute') {
            element.style.position = 'absolute';
            element.style.left = element.offsetLeft + 'px';
            element.style.top = element.offsetTop + 'px';
            element.style.float = 'none';
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        element.style.left = (e.clientX - startX) + 'px';
        element.style.top = (e.clientY - startY) + 'px';
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });
}
