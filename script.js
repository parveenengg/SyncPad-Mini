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
            floatingImage: null
        }
    };
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
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Robust Resize: Observer
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                // Determine if visible
                if (dom.canvas.wrapper.offsetParent !== null) {
                    resizeCanvas();
                }
            });
            ro.observe(dom.canvas.wrapper);
        }

        // Before Unload Warning
        window.addEventListener('beforeunload', (e) => {
            e.preventDefault();
            e.returnValue = 'Data will be lost!';
        });
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
            setTimeout(resizeCanvas, 50);
        }
    }

    // --- Text Editor Logic ---

    // Command Buttons
    dom.text.cmdBtns.forEach(btn => {
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent focus loss
            const cmd = btn.dataset.cmd;
            document.execCommand(cmd, false, null);
        });
    });

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
            reader.readAsDataURL(file);
        }
        e.target.value = ''; // reset
    });


    // --- Canvas Logic ---

    function resizeCanvas() {
        // Save current content
        const dataUrl = dom.canvas.element.toDataURL();
        const img = new Image();
        img.src = dataUrl;

        // Resize
        const rect = dom.canvas.wrapper.getBoundingClientRect();
        dom.canvas.element.width = rect.width;
        dom.canvas.element.height = rect.height;

        // Restore content
        img.onload = () => {
            dom.canvas.ctx.drawImage(img, 0, 0);
        };
        // Re-set styles
        updateCanvasContext();
    }

    function updateCanvasContext() {
        const ctx = dom.canvas.ctx;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = state.canvas.size;

        if (state.canvas.tool === 'eraser') {
            ctx.strokeStyle = '#ffffff';
            ctx.globalAlpha = 1.0;
        } else {
            ctx.strokeStyle = state.canvas.color;

            // Brush styles
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
                // Shapes
                ctx.globalAlpha = 1.0;
            }
        }
    }

    // Tool Selection
    dom.canvas.brushTypeSelect.addEventListener('change', (e) => {
        state.canvas.brushType = e.target.value;
        setCanvasTool('brush'); // switch to brush if not already
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
        // Update the icon next to it to show the color
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
        }
    });

    // Canvas Image Logic (Floating Div)
    dom.canvas.imgBtn.addEventListener('click', () => dom.canvas.imgInput.click());
    dom.canvas.imgInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (red) => {
                createFloatingImage(red.target.result);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    });

    function createFloatingImage(src) {
        if (state.canvas.floatingImage) {
            state.canvas.floatingImage.remove(); // Only one at a time for simplicity
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

        // Stamp Logic
        stampBtn.onclick = () => {
            const rect = dom.canvas.element.getBoundingClientRect();
            const contRect = container.getBoundingClientRect();

            // Calculate relative position to canvas
            const x = contRect.left - rect.left + 5; // +5 padding
            const y = contRect.top - rect.top + 5;
            const w = img.width; // current rendered width
            const h = img.height;

            // Draw to canvas
            const ctx = dom.canvas.ctx;
            ctx.globalAlpha = 1.0;
            ctx.drawImage(img, x, y, img.getBoundingClientRect().width, img.getBoundingClientRect().height);

            state.canvas.isDirty = true;

            container.remove();
            state.canvas.floatingImage = null;
        };

        controls.appendChild(stampBtn);
        container.appendChild(img);
        container.appendChild(controls);
        dom.canvas.wrapper.appendChild(container);

        state.canvas.floatingImage = container;

        // Basic Drag Logic
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
        if (e.target !== canvas) return;
        if (e.cancelable) e.preventDefault(); // Prevent scrolling/emulation

        if (e.type !== 'mousedown' && e.type !== 'touchstart') return;

        state.canvas.isDrawing = true;
        state.canvas.isDirty = true;

        const { x, y } = getPos(e);
        state.canvas.startX = x;
        state.canvas.startY = y;

        // Force round caps for smooth drawing
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(x, y);

        // Snapshot for shapes
        if (['rect', 'circle', 'tri', 'star', 'line', 'arrow'].includes(state.canvas.tool)) {
            state.canvas.snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } else {
            // Dot for single click
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    // Draw Function (Standard Path)
    const draw = (e) => {
        if (!state.canvas.isDrawing) return;
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();

        const { x, y } = getPos(e);

        if (state.canvas.tool === 'brush' || state.canvas.tool === 'eraser') {
            ctx.lineTo(x, y);
            ctx.stroke();
        } else if (['rect', 'circle', 'tri', 'star', 'line', 'arrow'].includes(state.canvas.tool)) {
            // Restore snapshot
            ctx.putImageData(state.canvas.snapshot, 0, 0);
            ctx.beginPath();

            const w = x - state.canvas.startX;
            const h = y - state.canvas.startY;

            if (state.canvas.tool === 'rect') {
                ctx.rect(state.canvas.startX, state.canvas.startY, w, h);
            } else if (state.canvas.tool === 'circle') {
                const r = Math.sqrt(w * w + h * h);
                ctx.arc(state.canvas.startX, state.canvas.startY, r, 0, 2 * Math.PI);
            } else if (state.canvas.tool === 'line') {
                ctx.moveTo(state.canvas.startX, state.canvas.startY);
                ctx.lineTo(x, y);
            } else if (state.canvas.tool === 'tri') {
                ctx.moveTo(state.canvas.startX + w / 2, state.canvas.startY);
                ctx.lineTo(state.canvas.startX, state.canvas.startY + h);
                ctx.lineTo(state.canvas.startX + w, state.canvas.startY + h);
                ctx.closePath();
            } else if (state.canvas.tool === 'star') {
                const r = Math.sqrt(w * w + h * h);
                const spikes = 5;
                const outerRadius = r;
                const innerRadius = r / 2;
                let rot = Math.PI / 2 * 3;
                let cx = state.canvas.startX;
                let cy = state.canvas.startY;
                const step = Math.PI / spikes;

                ctx.moveTo(cx, cy - outerRadius);
                for (let i = 0; i < spikes; i++) {
                    cx = state.canvas.startX + Math.cos(rot) * outerRadius;
                    cy = state.canvas.startY + Math.sin(rot) * outerRadius;
                    ctx.lineTo(cx, cy);
                    rot += step;

                    cx = state.canvas.startX + Math.cos(rot) * innerRadius;
                    cy = state.canvas.startY + Math.sin(rot) * innerRadius;
                    ctx.lineTo(cx, cy);
                    rot += step;
                }
                ctx.closePath();
            } else if (state.canvas.tool === 'arrow') {
                const headLen = 15;
                const angle = Math.atan2(h, w);
                ctx.moveTo(state.canvas.startX, state.canvas.startY);
                ctx.lineTo(x, y);
                // Arrow head
                ctx.lineTo(x - headLen * Math.cos(angle - Math.PI / 6), y - headLen * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(x, y);
                ctx.lineTo(x - headLen * Math.cos(angle + Math.PI / 6), y - headLen * Math.sin(angle + Math.PI / 6));
            }
            ctx.stroke();
        }
    };

    // Stop Draw
    const stopDraw = () => {
        if (state.canvas.isDrawing) {
            state.canvas.isDrawing = false;
            ctx.beginPath();
        }
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseout', stopDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);

    // --- PDF Export ---
    // --- PDF Export ---
    dom.nav.downloadBtn.addEventListener('click', () => {
        // --- Download Guard ---
        const textContent = dom.text.editor.innerText.trim();
        const hasText = textContent.length > 0 && textContent !== "Start typing here...";
        const hasFloating = !!state.canvas.floatingImage;
        const hasCanvas = state.canvas.isDirty || hasFloating;

        if (!hasText && !hasCanvas) {
            alert('You haven’t created anything yet. Please add content before downloading.');
            return;
        }

        // Show branding footer temporarily
        const footer = document.getElementById('pdf-footer');
        footer.classList.remove('hidden');

        let elementToPrint;
        let opt = {
            margin: 0.5,
            filename: `SyncPad_${new Date().toISOString().slice(0, 10)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        if (currentMode === 'text') {
            // Clone the editor content to add footer
            const content = dom.text.editor.cloneNode(true);
            const wrapper = document.createElement('div');
            wrapper.style.padding = "20px";
            wrapper.appendChild(content);

            // Append footer cloned
            const footerClone = footer.cloneNode(true);
            footerClone.classList.remove('hidden');
            footerClone.style.marginTop = "50px";
            footerClone.style.textAlign = "right";
            footerClone.style.fontFamily = "sans-serif";
            footerClone.style.color = "#777";
            footerClone.style.fontSize = "12px";
            wrapper.appendChild(footerClone);

            elementToPrint = wrapper;

            // Generate
            html2pdf().set(opt).from(elementToPrint).save().then(() => {
                footer.classList.add('hidden'); // Hide again just in case
            });

        } else {
            // Canvas Mode
            // For canvas, we print the canvas image + footer
            const wrapper = document.createElement('div');

            const img = new Image();
            img.src = dom.canvas.element.toDataURL('image/png');
            img.style.width = "100%";

            const footerClone = footer.cloneNode(true);
            footerClone.classList.remove('hidden');
            footerClone.style.marginTop = "20px";
            footerClone.style.textAlign = "right";

            wrapper.appendChild(img);
            wrapper.appendChild(footerClone);

            elementToPrint = wrapper;

            // Wait for image to load
            img.onload = () => {
                html2pdf().set(opt).from(elementToPrint).save().then(() => {
                    footer.classList.add('hidden');
                });
            };
        }
    });

    // Go!
    init();
});