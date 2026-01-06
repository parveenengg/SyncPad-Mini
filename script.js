document.addEventListener('DOMContentLoaded', () => {
    console.log("SyncPad Script Loaded");

    // --- State ---
    let currentMode = 'text';
    const state = {
        canvas: {
            isDrawing: false,
            isDirty: false,
            tool: 'brush',
            brushType: 'pen',
            color: '#000000',
            size: 5,
            startX: 0,
            startY: 0,
            snapshot: null,
            floatingImage: null,
            // Undo/Redo History
            history: [],
            historyStep: -1
        }
    };

    // --- DOM Elements ---
    const dom = {
        nav: {
            linksBtn: document.getElementById('links-btn'),
            mobileMenu: document.getElementById('mobile-menu'),
            downloadBtn: document.getElementById('download-btn'),
        },
        mode: {
            btns: document.querySelectorAll('.mode-btn'),
            containers: {
                text: document.getElementById('text-container'),
                canvas: document.getElementById('canvas-container')
            }
        },
        text: {
            editor: document.getElementById('editor'),
            toolbar: document.querySelector('.text-toolbar'),
            fontFamily: document.getElementById('font-family'),
            fontSize: document.getElementById('font-size'),
            textColor: document.getElementById('text-color'),
            highlightColor: document.getElementById('highlight-color'),
            clearBtn: document.getElementById('clear-text-btn'),
            cmdBtns: document.querySelectorAll('.text-toolbar .tool-btn[data-cmd]'),
            imgBtn: document.getElementById('text-img-btn'),
            imgInput: document.getElementById('text-img-input')
        },
        canvas: {
            element: document.getElementById('drawing-canvas'),
            ctx: document.getElementById('drawing-canvas').getContext('2d'),
            wrapper: document.querySelector('.canvas-wrapper'),

            brushTypeSelect: document.getElementById('brush-type'),
            brushBtn: document.getElementById('tool-brush'),
            eraserBtn: document.getElementById('tool-eraser'),
            shapeBtns: document.querySelectorAll('.shape-btn'),

            // New Stroke UI
            strokeBtns: document.querySelectorAll('.stroke-btn'),

            colorInput: document.getElementById('stroke-color'),
            clearBtn: document.getElementById('clear-canvas-btn'),

            imgBtn: document.getElementById('canvas-img-btn'),
            imgInput: document.getElementById('canvas-img-input')
        }
    };

    // --- Initialization ---
    function init() {
        try {
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);

            // Robust Resize: Observer
            if (window.ResizeObserver) {
                const ro = new ResizeObserver(() => {
                    // Determine if visible
                    if (dom.canvas.wrapper.offsetParent !== null) {
                        try {
                            resizeCanvas();
                        } catch (e) {
                            console.error("Error in ResizeObserver:", e);
                        }
                    }
                });
                ro.observe(dom.canvas.wrapper);
            }

            // Before Unload Warning
            window.addEventListener('beforeunload', (e) => {
                e.preventDefault();
                e.returnValue = 'Data will be lost!';
            });

            // Initialize History
            saveCanvasState();
        } catch (e) {
            console.error("Initialization Failed:", e);
            alert("SyncPad failed to initialize correctly. Please reload the page.");
        }
    }

    // --- UI Logic ---

    // Mobile Menu
    dom.nav.linksBtn.addEventListener('click', () => {
        dom.nav.mobileMenu.classList.toggle('hidden');
    });

    // Mode Switching
    dom.mode.btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            switchMode(mode);
        });
    });

    function switchMode(mode) {
        currentMode = mode;

        // Update All Buttons (Sync Desktop/Mobile)
        dom.mode.btns.forEach(b => {
            b.classList.toggle('active', b.dataset.mode === mode);
        });

        // Update Containers
        dom.mode.containers.text.classList.toggle('active', mode === 'text');
        dom.mode.containers.canvas.classList.toggle('active', mode === 'canvas');

        // Resize canvas if showing
        if (mode === 'canvas') {
            setTimeout(() => {
                try {
                    resizeCanvas();
                } catch (e) {
                    console.error("Error resizing canvas on switch:", e);
                }
            }, 50);
        }
    }

    // --- Global Shortcuts ---
    document.addEventListener('keydown', (e) => {
        // Undo / Redo
        if ((e.ctrlKey || e.metaKey)) {
            if (e.key === 'z') {
                if (currentMode === 'canvas') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        redoCanvas();
                    } else {
                        undoCanvas();
                    }
                }
                // Text mode is handled natively
            } else if (e.key === 'y') {
                if (currentMode === 'canvas') {
                    e.preventDefault();
                    redoCanvas();
                }
                // Text mode is handled natively
            }
        }

        // Canvas Tool Shortcuts (Only processing if not typing in text mode)
        // Check if Text Mode is active AND editor is focused?
        // Actually, if currentMode is canvas, we accept these keys.
        if (currentMode === 'canvas' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    setCanvasTool('brush');
                    break;
                case 'e':
                    setCanvasTool('eraser');
                    break;
                case ']':
                    increaseBrushSize();
                    break;
                case '[':
                    decreaseBrushSize();
                    break;
            }
        }
    });

    function increaseBrushSize() {
        // Sizes: 2, 5, 10, 20. Find next largest.
        const currentSize = state.canvas.size;
        const buttonSizes = Array.from(dom.canvas.strokeBtns).map(b => parseInt(b.dataset.size));
        const nextSize = buttonSizes.find(s => s > currentSize);

        if (nextSize) {
            const btn = Array.from(dom.canvas.strokeBtns).find(b => parseInt(b.dataset.size) === nextSize);
            if (btn) btn.click();
        }
    }

    function decreaseBrushSize() {
        const currentSize = state.canvas.size;
        const buttonSizes = Array.from(dom.canvas.strokeBtns).map(b => parseInt(b.dataset.size)).reverse();
        const prevSize = buttonSizes.find(s => s < currentSize);

        if (prevSize) {
            const btn = Array.from(dom.canvas.strokeBtns).find(b => parseInt(b.dataset.size) === prevSize);
            if (btn) btn.click();
        }
    }


    // --- Text Editor Logic ---

    // Command Buttons
    dom.text.cmdBtns.forEach(btn => {
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent focus loss
            try {
                const cmd = btn.dataset.cmd;
                document.execCommand(cmd, false, null);
            } catch (err) {
                console.error("Text command failed:", err);
            }
        });
    });

    // Lorem Ipsum
    const loremBtn = document.getElementById('lorem-btn');
    if (loremBtn) {
        loremBtn.addEventListener('click', () => {
            const latin = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";
            document.execCommand('insertText', false, latin);
            dom.text.editor.focus();
        });
    }

    // Font Family
    dom.text.fontFamily.addEventListener('change', (e) => {
        document.execCommand('fontName', false, e.target.value);
        dom.text.editor.focus();
    });

    // Font Size
    dom.text.fontSize.addEventListener('change', (e) => {
        document.execCommand('fontSize', false, e.target.value);
        dom.text.editor.focus();
    });

    // Colors
    dom.text.textColor.addEventListener('input', (e) => {
        document.execCommand('foreColor', false, e.target.value);
        dom.text.editor.focus();
    });

    dom.text.highlightColor.addEventListener('input', (e) => {
        document.execCommand('hiliteColor', false, e.target.value);
        dom.text.editor.focus();
    });

    // Clear Text
    dom.text.clearBtn.addEventListener('click', () => {
        if (confirm('Clear all text?')) {
            dom.text.editor.innerHTML = '<div class="placeholder">Start typing here...</div>';
        }
    });

    // Handle Placeholder on Focus
    dom.text.editor.addEventListener('focus', () => {
        if (dom.text.editor.textContent.trim() === 'Start typing here...') {
            dom.text.editor.innerHTML = '';
        }
    });

    // Text Image Upload
    dom.text.imgBtn.addEventListener('click', () => dom.text.imgInput.click());
    dom.text.imgInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (red) => {
                document.execCommand('insertImage', false, red.target.result);
            };
            reader.onerror = (err) => {
                console.error("File reading failed in Text Mode:", err);
                alert("Failed to load image.");
            };
            reader.readAsDataURL(file);
        }
        e.target.value = ''; // reset
    });


    // --- Canvas Logic ---

    function saveCanvasState() {
        try {
            // Limit history to 20 steps
            if (state.canvas.historyStep < state.canvas.history.length - 1) {
                // If we undid and then drew new, truncate future history
                state.canvas.history = state.canvas.history.slice(0, state.canvas.historyStep + 1);
            }
            state.canvas.history.push(dom.canvas.element.toDataURL());
            if (state.canvas.history.length > 20) {
                state.canvas.history.shift();
            } else {
                state.canvas.historyStep++;
            }
        } catch (e) {
            console.error("Error saving canvas state:", e);
        }
    }

    function undoCanvas() {
        if (state.canvas.historyStep > 0) {
            state.canvas.historyStep--;
            restoreCanvasState(state.canvas.history[state.canvas.historyStep]);
        }
    }

    function redoCanvas() {
        if (state.canvas.historyStep < state.canvas.history.length - 1) {
            state.canvas.historyStep++;
            restoreCanvasState(state.canvas.history[state.canvas.historyStep]);
        }
    }

    function restoreCanvasState(dataUrl) {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            dom.canvas.ctx.clearRect(0, 0, dom.canvas.element.width, dom.canvas.element.height);
            dom.canvas.ctx.drawImage(img, 0, 0);
        };
        img.onerror = (err) => console.error("Failed to restore canvas state", err);
    }


    function resizeCanvas() {
        try {
            const dataUrl = dom.canvas.element.toDataURL(); // Save current
            const img = new Image();
            img.src = dataUrl;

            const rect = dom.canvas.wrapper.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return; // Hidden or collapsed

            dom.canvas.element.width = rect.width;
            dom.canvas.element.height = rect.height;

            img.onload = () => {
                dom.canvas.ctx.drawImage(img, 0, 0);
            };
            updateCanvasContext();
        } catch (e) {
            console.error("Canvas resize error:", e);
        }
    }

    function updateCanvasContext() {
        try {
            const ctx = dom.canvas.ctx;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = state.canvas.size;

            if (state.canvas.tool === 'eraser') {
                ctx.strokeStyle = '#ffffff';
                ctx.globalAlpha = 1.0;
            } else {
                ctx.strokeStyle = state.canvas.color;

                if (state.canvas.tool === 'brush') {
                    if (state.canvas.brushType === 'pen') {
                        ctx.globalAlpha = 1.0;
                        ctx.lineCap = 'round';
                    } else if (state.canvas.brushType === 'marker') {
                        ctx.globalAlpha = 0.5;
                        ctx.lineCap = 'square';
                    } else if (state.canvas.brushType === 'pencil') {
                        ctx.globalAlpha = 0.8;
                    }
                } else {
                    ctx.globalAlpha = 1.0;
                }
            }
        } catch (e) { console.error("Update Context Error:", e); }
    }

    // Tool Selection
    dom.canvas.brushTypeSelect.addEventListener('change', (e) => {
        state.canvas.brushType = e.target.value;
        setCanvasTool('brush');
    });

    dom.canvas.brushBtn.addEventListener('click', () => setCanvasTool('brush'));
    dom.canvas.eraserBtn.addEventListener('click', () => setCanvasTool('eraser'));
    dom.canvas.shapeBtns.forEach(btn => {
        btn.addEventListener('click', () => setCanvasTool(btn.dataset.shape));
    });

    function setCanvasTool(tool) {
        state.canvas.tool = tool;

        // Update UI
        dom.canvas.brushBtn.classList.toggle('active', tool === 'brush');
        dom.canvas.eraserBtn.classList.toggle('active', tool === 'eraser');
        dom.canvas.shapeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.shape === tool);
        });

        // Cursor logic
        dom.canvas.element.style.cursor = tool === 'eraser' ? 'cell' : 'crosshair';
        updateCanvasContext();
    }

    // Stroke Size (Visual Buttons)
    dom.canvas.strokeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // UI Update
            dom.canvas.strokeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // State Update
            state.canvas.size = parseInt(btn.dataset.size);
            updateCanvasContext();
        });
    });

    // Color Feedback
    dom.canvas.colorInput.addEventListener('input', (e) => {
        state.canvas.color = e.target.value;
        const wrapper = dom.canvas.colorInput.parentElement;
        const icon = wrapper.querySelector('.color-icon');
        if (icon) {
            icon.style.color = e.target.value;
        }
        updateCanvasContext();
    });

    // Clear Canvas
    dom.canvas.clearBtn.addEventListener('click', () => {
        if (confirm('Clear entire drawing?')) {
            dom.canvas.ctx.clearRect(0, 0, dom.canvas.element.width, dom.canvas.element.height);
            state.canvas.isDirty = false;
            saveCanvasState(); // Checkpoint
        }
    });

    // Canvas Image Logic
    dom.canvas.imgBtn.addEventListener('click', () => dom.canvas.imgInput.click());
    dom.canvas.imgInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (red) => {
                createFloatingImage(red.target.result);
            };
            reader.onerror = (err) => console.error("Canvas image load failed:", err);
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    });

    function createFloatingImage(src) {
        try {
            if (state.canvas.floatingImage) {
                state.canvas.floatingImage.remove();
            }

            const container = document.createElement('div');
            container.className = 'canvas-image-container';
            container.style.left = '50px';
            container.style.top = '50px';

            const img = new Image();
            img.src = src;

            const controls = document.createElement('div');
            controls.className = 'canvas-image-controls';

            const stampBtn = document.createElement('button');
            stampBtn.className = 'canvas-stamp-btn';
            stampBtn.innerText = 'Stamp';

            stampBtn.onclick = () => {
                try {
                    const rect = dom.canvas.element.getBoundingClientRect();
                    const contRect = container.getBoundingClientRect();

                    const x = contRect.left - rect.left + 5;
                    const y = contRect.top - rect.top + 5;

                    const ctx = dom.canvas.ctx;
                    ctx.globalAlpha = 1.0;
                    ctx.drawImage(img, x, y, img.getBoundingClientRect().width, img.getBoundingClientRect().height);

                    state.canvas.isDirty = true;
                    saveCanvasState(); // Checkpoint

                    container.remove();
                    state.canvas.floatingImage = null;
                } catch (e) {
                    console.error("Stamping failed:", e);
                }
            };

            controls.appendChild(stampBtn);
            container.appendChild(img);
            container.appendChild(controls);
            dom.canvas.wrapper.appendChild(container);

            state.canvas.floatingImage = container;

            let isDragging = false;
            let diffX = 0, diffY = 0;

            container.addEventListener('mousedown', (e) => {
                if (e.target === stampBtn) return;
                isDragging = true;
                const rect = container.getBoundingClientRect();
                diffX = e.clientX - rect.left;
                diffY = e.clientY - rect.top;
            });

            window.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                container.style.left = (e.clientX - diffX - dom.canvas.wrapper.getBoundingClientRect().left) + 'px';
                container.style.top = (e.clientY - diffY - dom.canvas.wrapper.getBoundingClientRect().top) + 'px';
            });

            window.addEventListener('mouseup', () => {
                isDragging = false;
            });
        } catch (e) {
            console.error("Floating image creation failed:", e);
        }
    }


    // Drawing Events
    const canvas = dom.canvas.element;
    const ctx = dom.canvas.ctx;

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        return { x, y };
    };

    const startDraw = (e) => {
        try {
            if (e.target !== canvas) return;
            if (e.cancelable) e.preventDefault();

            if (e.type !== 'mousedown' && e.type !== 'touchstart') return;

            state.canvas.isDrawing = true;
            state.canvas.isDirty = true;

            const { x, y } = getPos(e);
            state.canvas.startX = x;
            state.canvas.startY = y;

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(x, y);

            if (['rect', 'circle', 'tri', 'star', 'line', 'arrow'].includes(state.canvas.tool)) {
                state.canvas.snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
            } else {
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        } catch (err) {
            console.error("StartDraw failed:", err);
            state.canvas.isDrawing = false; // Reset safety
        }
    };

    // Draw Function
    const draw = (e) => {
        try {
            if (!state.canvas.isDrawing) return;
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();

            const { x, y } = getPos(e);

            if (state.canvas.tool === 'brush' || state.canvas.tool === 'eraser') {
                ctx.lineTo(x, y);
                ctx.stroke();
            } else if (['rect', 'circle', 'tri', 'star', 'line', 'arrow'].includes(state.canvas.tool)) {
                if (!state.canvas.snapshot) return;
                ctx.putImageData(state.canvas.snapshot, 0, 0);

                // Redraw all shapes logic...
                // To keep it clean, I'll just copy the existing logic or keep it minimal
                // But since I'm replacing the whole file content block, I must assume the logic was good.
                // The previous logic for shapes was inline.
                ctx.beginPath();
                const w = x - state.canvas.startX;
                const h = y - state.canvas.startY;

                drawPreviewShape(state.canvas.tool, state.canvas.startX, state.canvas.startY, w, h, x, y);

                ctx.stroke();
            }
        } catch (err) {
            console.error("Draw failed:", err);
        }
    };

    // Helper to keep draw() clean
    function drawPreviewShape(tool, startX, startY, w, h, curX, curY) {
        if (tool === 'rect') {
            dom.canvas.ctx.rect(startX, startY, w, h);
        } else if (tool === 'circle') {
            const r = Math.sqrt(w * w + h * h);
            dom.canvas.ctx.arc(startX, startY, r, 0, 2 * Math.PI);
        } else if (tool === 'line') {
            dom.canvas.ctx.moveTo(startX, startY);
            dom.canvas.ctx.lineTo(curX, curY);
        } else if (tool === 'tri') {
            dom.canvas.ctx.moveTo(startX + w / 2, startY);
            dom.canvas.ctx.lineTo(startX, startY + h);
            dom.canvas.ctx.lineTo(startX + w, startY + h);
            dom.canvas.ctx.closePath();
        } else if (tool === 'star') {
            const r = Math.sqrt(w * w + h * h);
            const spikes = 5;
            const outerRadius = r;
            const innerRadius = r / 2;
            let rot = Math.PI / 2 * 3;
            let cx = startX;
            let cy = startY;
            const step = Math.PI / spikes;

            dom.canvas.ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                cx = startX + Math.cos(rot) * outerRadius;
                cy = startY + Math.sin(rot) * outerRadius;
                dom.canvas.ctx.lineTo(cx, cy);
                rot += step;

                cx = startX + Math.cos(rot) * innerRadius;
                cy = startY + Math.sin(rot) * innerRadius;
                dom.canvas.ctx.lineTo(cx, cy);
                rot += step;
            }
            dom.canvas.ctx.closePath();
        } else if (tool === 'arrow') {
            const headLen = 15;
            const angle = Math.atan2(h, w);
            dom.canvas.ctx.moveTo(startX, startY);
            dom.canvas.ctx.lineTo(curX, curY);
            dom.canvas.ctx.lineTo(curX - headLen * Math.cos(angle - Math.PI / 6), curY - headLen * Math.sin(angle - Math.PI / 6));
            dom.canvas.ctx.moveTo(curX, curY);
            dom.canvas.ctx.lineTo(curX - headLen * Math.cos(angle + Math.PI / 6), curY - headLen * Math.sin(angle + Math.PI / 6));
        }
    }

    const stopDraw = () => {
        try {
            if (state.canvas.isDrawing) {
                state.canvas.isDrawing = false;
                ctx.beginPath();
                saveCanvasState(); // Checkpoint state for undo
            }
        } catch (e) {
            console.error("StopDraw error:", e);
        }
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseout', stopDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);

    // --- PDF Export with Smart Logic ---

    // Helper Functions
    function hasTextContent() {
        const textContent = dom.text.editor.innerText.trim();
        const placeholder = 'Start typing here...SYNCPAD_MINI by parveenengg';
        const cleanText = textContent.replace(/\s+/g, '');
        const cleanPlaceholder = placeholder.replace(/\s+/g, '');

        return textContent.length > 0 && cleanText !== cleanPlaceholder && textContent !== 'Start typing here...';
    }

    function hasCanvasContent() {
        const hasFloating = !!state.canvas.floatingImage;
        return state.canvas.isDirty || hasFloating;
    }

    function downloadTextPDF() {
        try {
            const header = document.getElementById('pdf-header');

            // Clone the editor content to avoid messing up the UI
            const content = dom.text.editor.cloneNode(true);

            // CRITICAL FIX: Reset height to 'auto' so it doesn't force a full page 
            // if the text is short. The UI has min-height: 100vh, which we don't want here.
            content.style.minHeight = 'auto';
            content.style.height = 'auto';
            content.style.overflow = 'visible';
            content.style.boxShadow = 'none'; // Remove drop shadow
            content.style.margin = '0';
            content.style.padding = '0'; // Let the wrapper handle padding
            content.style.background = 'transparent'; // Remove any page gradients

            const wrapper = document.createElement('div');
            wrapper.style.padding = "40px"; // Print margins
            wrapper.style.boxSizing = "border-box";

            // Append Header FIRST
            const headerClone = header.cloneNode(true);
            headerClone.classList.remove('hidden');
            wrapper.appendChild(headerClone);

            // Append Content
            wrapper.appendChild(content);

            // Options optimized for single-page feeling for short content
            const opt = {
                margin: 0, // We handle margins in the wrapper
                filename: `SyncPad_Text_${new Date().toISOString().slice(0, 10)}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    scrollY: 0 // capture from top
                },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['css', 'legacy'] }
            };

            html2pdf().set(opt).from(wrapper).save().catch(e => {
                console.error("html2pdf failed:", e);
                alert("Failed to generate PDF. Please try again.");
            });
        } catch (e) { console.error("Download Text failed:", e); }
    }

    function downloadCanvasPDF() {
        try {
            const footer = document.getElementById('pdf-footer');
            const wrapper = document.createElement('div');

            const img = new Image();
            img.src = dom.canvas.element.toDataURL('image/png');
            img.style.width = "100%";

            const footerClone = footer.cloneNode(true);
            footerClone.classList.remove('hidden');
            footerClone.style.marginTop = "20px";
            footerClone.style.textAlign = "right";
            footerClone.style.fontFamily = "sans-serif";
            footerClone.style.color = "#777";
            footerClone.style.fontSize = "12px";

            wrapper.appendChild(img);
            wrapper.appendChild(footerClone);

            const opt = {
                margin: 0.5,
                filename: `SyncPad_Canvas_${new Date().toISOString().slice(0, 10)}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            img.onload = () => {
                html2pdf().set(opt).from(wrapper).save().catch(e => {
                    console.error("html2pdf (canvas) failed:", e);
                    alert("Failed to generate Canvas PDF.");
                });
            };
        } catch (e) { console.error("Download Canvas failed:", e); }
    }

    // Modal Logic
    const modal = document.getElementById('download-modal');
    const modalOverlay = modal.querySelector('.modal-overlay');
    const downloadTextBtn = document.getElementById('download-text-btn');
    const downloadCanvasBtn = document.getElementById('download-canvas-btn');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    function showModal() {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    function hideModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Modal event listeners
    downloadTextBtn.addEventListener('click', () => {
        hideModal();
        downloadTextPDF();
    });

    downloadCanvasBtn.addEventListener('click', () => {
        hideModal();
        downloadCanvasPDF();
    });

    modalCloseBtn.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', hideModal);

    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            hideModal();
        }
    });

    // Main Download Button Logic
    dom.nav.downloadBtn.addEventListener('click', () => {
        try {
            const hasText = hasTextContent();
            const hasCanvas = hasCanvasContent();

            console.log('Download clicked - Text:', hasText, 'Canvas:', hasCanvas);

            if (!hasText && !hasCanvas) {
                alert('No data to download! Please add some text or drawings first.');
                return;
            }

            if (hasText && hasCanvas) {
                showModal();
            } else if (hasText) {
                downloadTextPDF();
            } else if (hasCanvas) {
                downloadCanvasPDF();
            }
        } catch (e) { console.error("Download Button Logic Error:", e); }
    });

    // Go!
    init();
});