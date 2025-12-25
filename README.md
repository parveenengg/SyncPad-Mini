# SyncPad Mini - Documentation

## Project Overview

SyncPad Mini is a browser-based document editor with two modes:
1. **Text Mode**: A rich text editor (like Google Docs)
2. **Canvas Mode**: A drawing canvas (like Microsoft Paint)

**Key Features**:
- Switch between text and drawing modes
- Export to PDF
- Responsive design (works on desktop and mobile)
- No backend required - runs entirely in the browser

---

## Page Structure (HTML Logic)

The application has a single-page layout with these main sections:

### 1. Navbar (Always Visible)
- **Brand**: "SyncPad Mini" logo
- **Mode Toggle** (Desktop): Buttons to switch between Text/Canvas
- **Download Button**: Exports current mode to PDF
- **Links Menu** (Mobile): GitHub and Portfolio links

### 2. Mobile Mode Bar (Mobile Only)
- Duplicate mode toggle for smaller screens
- Appears below navbar on screens < 600px

### 3. Workspace (Main Area)
Contains two containers that are shown/hidden based on mode:

#### Text Container (`#text-container`)
- **Text Toolbar**: Formatting buttons (Bold, Italic, Font, etc.)
- **Text Editor**: ContentEditable div where you type

#### Canvas Container (`#canvas-container`)
- **Canvas Toolbar**: Drawing tools (Brush, Shapes, Colors, etc.)
- **Canvas Element**: HTML5 `<canvas>` where drawing happens

**How Mode Switching Works**:
- Only ONE container is visible at a time
- Clicking mode button adds `.active` class to the chosen container
- CSS rule: `.editor-container.active { display: flex; }`

---

## Text Editor

### How Typing Works
1. User clicks in the white editor area
2. Browser's built-in ContentEditable feature activates
3. User types normally - browser handles text rendering
4. Placeholder text ("Start typing here...") disappears on focus

### How Formatting Tools Work

**Example: Making Text Bold**
1. User selects text with mouse
2. User clicks Bold button (B icon)
3. JavaScript calls `document.execCommand('bold', false, null)`
4. Browser wraps selected text in `<b>` tags
5. Text appears bold

**Other Tools**:
- **Font Family/Size**: Dropdowns that call `execCommand('fontName', ...)` or `execCommand('fontSize', ...)`
- **Colors**: Color pickers that call `execCommand('foreColor', ...)` or `execCommand('hiliteColor', ...)`
- **Alignment**: Buttons that call `execCommand('justifyLeft', ...)` etc.
- **Lists**: Buttons that call `execCommand('insertUnorderedList', ...)` etc.

**Key Point**: The browser does the heavy lifting. JavaScript just tells it what command to run.

---

## Canvas Editor

### What is a Pencil/Brush?

Think of it like a real pencil on paper:
- When you press down (mousedown), the pencil touches the paper
- As you move (mousemove), the pencil draws a line
- When you lift up (mouseup), the pencil stops drawing

In code:
- **Pencil = Canvas Context** (`ctx`)
- **Paper = Canvas Element** (`<canvas>`)
- **Drawing = Calling `ctx.stroke()`**

### How Drawing Works (Conceptual Flow)

**Step 1: User Presses Mouse Down**
```
mousedown event → startDraw() function runs
→ Set isDrawing = true
→ Remember starting position (startX, startY)
→ Begin a new path: ctx.beginPath()
→ Move pencil to starting point: ctx.moveTo(x, y)
```

**Step 2: User Moves Mouse (While Holding Button)**
```
mousemove event → draw() function runs
→ Check: Is isDrawing true? (If no, do nothing)
→ Get current mouse position (x, y)
→ Draw line from last position to current: ctx.lineTo(x, y)
→ Actually render the line: ctx.stroke()
```

**Step 3: User Releases Mouse**
```
mouseup event → stopDraw() function runs
→ Set isDrawing = false
→ End the path: ctx.beginPath() (reset for next stroke)
```

**Result**: A continuous line appears on canvas following the mouse path.

### What Tools Are Supposed to Do

**Brush Tool** (Default):
- Draws freehand lines
- Has subtypes: Pen (solid), Marker (semi-transparent), Pencil (lighter)

**Eraser Tool**:
- Same as brush but draws in white color
- Effectively "erases" by covering with background color

**Shape Tools** (Rectangle, Circle, Triangle, Star, Line, Arrow):
- **Intended Behavior**:
  1. User clicks and drags
  2. Shape preview appears (rubber-banding effect)
  3. On mouse release, final shape is drawn
- **How It Should Work**:
  - On mousedown: Save canvas snapshot
  - On mousemove: Restore snapshot, draw preview shape
  - On mouseup: Final shape stays

**Color Picker**:
- Changes `state.canvas.color`
- Next stroke uses new color

**Size Buttons**:
- Changes `state.canvas.size` (2px, 5px, 10px, 20px)
- Next stroke uses new thickness

---

## CSS Responsibility

CSS handles ALL visual appearance:

### Layout
- **Flexbox**: Navbar, toolbars, and workspace use flexbox
- **Height Management**: `body { height: 100vh }` ensures full screen
- **Workspace**: `flex: 1` makes it fill remaining space

### Responsive Design
- **Breakpoint**: 600px
- **Above 600px** (Desktop):
  - `.mobile-only { display: none }`
  - Mode toggle appears in navbar center
- **Below 600px** (Mobile):
  - `.desktop-only { display: none }`
  - Separate mode bar appears below navbar

### Styling
- **Colors**: CSS variables (`:root`) define color scheme
- **Buttons**: Hover effects, active states
- **Toolbars**: Horizontal scroll on mobile if too many tools

**Key Point**: CSS does NOT control functionality, only appearance.

---

## JavaScript Responsibility

JavaScript handles ALL interactivity:

### State Management
```javascript
const state = {
    canvas: {
        isDrawing: false,  // Is user currently drawing?
        tool: 'brush',     // Current tool selected
        color: '#000000',  // Current color
        size: 5,           // Current brush size
        // ... more state
    }
};
```

### DOM References
```javascript
const dom = {
    nav: { downloadBtn: ..., linksBtn: ... },
    mode: { btns: ..., containers: ... },
    text: { editor: ..., toolbar: ..., cmdBtns: ... },
    canvas: { element: ..., ctx: ..., brushBtn: ..., shapeBtns: ... }
};
```

### Event Listeners
- **Mode Switching**: Listens to mode button clicks, toggles `.active` class
- **Text Toolbar**: Listens to button clicks, calls `execCommand(...)`
- **Canvas Drawing**: Listens to mouse events on canvas
- **Download**: Listens to download button, generates PDF using html2pdf library

### Key Functions

**switchMode(mode)**:
- Updates `currentMode` variable
- Adds/removes `.active` class on containers
- Syncs both desktop and mobile mode buttons

**startDraw(e)**:
- Sets `isDrawing = true`
- Captures starting position
- Begins canvas path

**draw(e)**:
- Only runs if `isDrawing === true`
- Draws line to current mouse position
- Calls `ctx.stroke()` to render

**stopDraw()**:
- Sets `isDrawing = false`
- Resets path for next stroke

---

## Known Issues

### 1. Canvas Tool Selection Not Working
**Problem**: Clicking shape tools (Rectangle, Circle, etc.) doesn't change drawing behavior. Brush tool always draws freehand lines.

**Why**: Tool state (`state.canvas.tool`) is being updated, but the `draw()` function doesn't check which tool is active before drawing.

**Expected Fix**: `draw()` function should have conditional logic:
```javascript
if (state.canvas.tool === 'brush') {
    // Draw freehand line
} else if (state.canvas.tool === 'rect') {
    // Draw rectangle
}
```

### 2. Download Button Not Triggering
**Problem**: Clicking "Download PDF" button doesn't generate a PDF file.

**Possible Causes**:
- Event listener not attached correctly
- html2pdf library not loaded
- Empty content guard blocking download

**Expected Behavior**:
- In Text mode: Export text editor content to PDF
- In Canvas mode: Export canvas drawing to PDF
- Add branding footer "SyncPad – By Praveen Kumar"

---

## 📁 Project Structure

```
SyncPad_Mini/
├── index.html              → Main HTML container
├── README.md               → This documentation
│
├── css/                    → Modular stylesheets
│   ├── base.css           → Variables, navbar, layout, responsive
│   ├── toolbar.css        → Shared toolbar styles (text + canvas)
│   ├── text-editor.css    → Text editor specific styles
│   └── canvas.css         → Canvas drawing area styles
│
├── js/                     → Modular JavaScript
│   ├── main.js            → Mode switching logic
│   └── text.js            → Text editor & toolbar logic
│
└── style.css               → Legacy styles (canvas logic still inline)
```

### How Files Connect

**Load Order**:
1. HTML loads → DOM ready
2. CSS files load (parallel)
3. JavaScript files execute in order:
   - `main.js` → Sets up mode switching
   - `text.js` → Attaches text editor listeners

**Mode Switching Flow**:
```
User clicks mode button
  ↓
main.js switches containers
  ↓
CSS shows/hides via .active class
  ↓
Canvas resize event fires (if canvas mode)
```

**Text Editor Flow**:
```
User clicks Bold button
  ↓
text.js captures click
  ↓
Calls document.execCommand('bold')
  ↓
Browser wraps text in <b> tags
```

**Canvas Drawing Flow** (still in inline script):
```
User mousedown on canvas
  ↓
Inline script: startDraw()
  ↓
User mousemove
  ↓
Inline script: draw() → ctx.stroke()
  ↓
User mouseup
  ↓
Inline script: stopDraw()
```

### Why Some Code is Still Inline

- **Canvas logic**: Complex state management, not yet extracted
- **PDF export**: Depends on canvas state, kept inline for now
- **Future**: Can be extracted to `canvas.js` for full modularity

---

## How to Answer Viva Questions

**Q: How does drawing on canvas work?**
A: "When the user presses the mouse down, we capture the starting position and set a flag `isDrawing = true`. As the mouse moves, we continuously draw lines from the previous position to the current position using `ctx.lineTo()` and `ctx.stroke()`. When the mouse is released, we set `isDrawing = false` to stop drawing. This creates a continuous line following the mouse path."

**Q: How do you switch between text and canvas modes?**
A: "We have two container divs - one for text mode and one for canvas mode. Only one is visible at a time using CSS `.active` class. When a mode button is clicked, JavaScript removes `.active` from the current container and adds it to the selected container. CSS rule `.editor-container.active { display: flex }` makes it visible."

**Q: How does the text editor formatting work?**
A: "We use the browser's built-in ContentEditable feature and `document.execCommand()` API. When a user selects text and clicks Bold, we call `document.execCommand('bold')` which tells the browser to wrap the selected text in `<b>` tags. The browser handles all the text manipulation - we just send commands."

**Q: Why is the code in one file?**
A: "Initially we had separate HTML, CSS, and JavaScript files. However, when loading from the `file://` protocol (local files), browsers block JavaScript file loading due to CORS security. To make the project work without a server, we inlined the JavaScript into the HTML file. This is a common workaround for client-side-only applications."

**Q: What's the difference between brush types (Pen, Marker, Pencil)?**
A: "They all draw lines but with different visual properties. Pen uses full opacity (alpha = 1.0) for solid lines. Marker uses semi-transparent (alpha = 0.5) for a highlighter effect. Pencil uses lighter opacity (alpha = 0.8) for a softer look. We set these using `ctx.globalAlpha` before drawing."
