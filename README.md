# SyncPad - Collaborative WordPad

A real-time collaborative notepad/wordpad application with drawing capabilities, built with vanilla JavaScript and Socket.io.

## Features

- ✅ Real-time collaboration (max 3 users per room)
- ✅ Text editing with formatting (bold, italic, underline)
- ✅ Font customization (size, family, color, alignment)
- ✅ Drawing mode with freehand, rectangle, and circle tools
- ✅ Shape containers for drawing with text flow
- ✅ Unique URL-based collaboration rooms
- ✅ Editable usernames with color-coded presence
- ✅ PDF export for both text and drawings
- ✅ Modern, elegant UI design
- ✅ Mobile responsive

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd SyncPad_Mini\ copy

# Install dependencies
npm install

# Start the server
npm start
```

The application will be available at `http://localhost:3000`

## Usage

### Solo Mode
1. Open `http://localhost:3000`
2. Start typing or drawing

### Collaboration Mode
1. Click "SyncPad" in the navbar
2. Share the generated URL with collaborators (max 3 users)
3. All users can edit and draw in real-time

### Drawing Shapes
1. Switch to "Draw" mode
2. Select a tool: Freehand, Rectangle, or Circle
3. For shapes: Click and drag on canvas to create shape containers
4. Draw inside shape containers
5. Shapes can be dragged and repositioned
6. Text automatically flows around shapes

### PDF Export
- Click the Download button (⬇️) to export your work as PDF

## Deployment

### Option 1: Render.com (Recommended - Free)

1. Push your code to GitHub
2. Go to [render.com](https://render.com)
3. Create a new "Web Service"
4. Connect your GitHub repository
5. Use these settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
6. Deploy!

Your app will be live at `https://your-app-name.onrender.com`

### Option 2: Railway.app

1. Push to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Node.js and deploys

### Option 3: Glitch.com

1. Go to [glitch.com](https://glitch.com)
2. Click "New Project" → "Import from GitHub"
3. Enter your repository URL
4. Glitch will automatically deploy

## Project Structure

```
SyncPad_Mini copy/
├── server.js          # WebSocket server
├── index.html         # Main HTML structure
├── script.js          # Client-side logic
├── shapes.js          # Shape drawing functionality
├── style.css          # Styling
├── package.json       # Dependencies
└── README.md          # This file
```

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express
- **Real-time**: Socket.io (WebSocket)
- **PDF Export**: jsPDF

## Features in Detail

### Real-Time Collaboration
- WebSocket-based synchronization
- Room-based isolation with unique URLs
- Max 3 users per room
- Automatic user color assignment
- Live cursor and typing indicators

### Text Editing
- Rich text formatting
- Multiple font families
- Font size adjustment (12-24px)
- Text alignment (left, center, right)
- Color selection

### Drawing
- Freehand drawing
- Shape containers (rectangles and circles)
- Adjustable stroke size
- Color customization
- Drawing inside shapes
- Draggable shapes

### User Management
- Editable usernames
- Color-coded user presence
- Real-time user list updates
- Room full detection

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers

## Known Limitations

- No data persistence (rooms clear when all users leave)
- No undo/redo functionality
- Maximum 3 users per room
- No authentication/user accounts

## Future Enhancements

- Database integration for persistence
- User authentication
- Undo/redo functionality
- More drawing tools
- File attachments
- Chat functionality

## License

MIT

## Author

Created as a college project

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

## Support

For issues or questions, please open a GitHub issue.
