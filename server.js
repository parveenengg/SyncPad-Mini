const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

// Serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Store room data: { roomId: { users: [], content: {}, drawings: [] } }
const rooms = new Map();

// Available colors for users
const USER_COLORS = ['black', 'red', 'blue', 'green'];

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    let currentRoom = null;
    let userColor = null;
    let userName = 'Anonymous';

    // Join a collaboration room
    socket.on('join-room', (roomId) => {
        currentRoom = roomId;

        // Initialize room if it doesn't exist
        if (!rooms.has(roomId)) {
            rooms.set(roomId, {
                users: [],
                content: { text: '', html: '' },
                drawings: [],
                shapes: []
            });
        }

        const room = rooms.get(roomId);

        // Check user limit (max 3 users)
        if (room.users.length >= 3) {
            socket.emit('room-full', {
                message: 'This collaboration room is full (maximum 3 users). Please create a new room.'
            });
            return;
        }

        socket.join(roomId);

        // Assign color to user (cycle through available colors)
        const colorIndex = room.users.length % USER_COLORS.length;
        userColor = USER_COLORS[colorIndex];

        // Add user to room
        const user = {
            id: socket.id,
            color: userColor,
            name: userName
        };
        room.users.push(user);

        console.log(`User ${socket.id} joined room ${roomId} with color ${userColor}`);

        // Send current room state to the new user
        socket.emit('room-state', {
            content: room.content,
            drawings: room.drawings,
            shapes: room.shapes,
            users: room.users,
            yourColor: userColor
        });

        // Notify others in the room
        socket.to(roomId).emit('user-joined', user);

        // Send updated user list to all
        io.to(roomId).emit('users-update', room.users);
    });

    // Handle text content changes
    socket.on('text-change', (data) => {
        if (!currentRoom) return;

        const room = rooms.get(currentRoom);
        if (room) {
            room.content = data;
            // Broadcast to others in the room
            socket.to(currentRoom).emit('text-update', {
                content: data,
                userId: socket.id,
                userColor: userColor
            });
        }
    });

    // Handle drawing strokes
    socket.on('draw-stroke', (strokeData) => {
        if (!currentRoom) return;

        const room = rooms.get(currentRoom);
        if (room) {
            const stroke = {
                ...strokeData,
                userId: socket.id,
                userColor: userColor,
                timestamp: Date.now()
            };
            room.drawings.push(stroke);

            // Broadcast to others in the room
            socket.to(currentRoom).emit('drawing-update', stroke);
        }
    });

    // Handle shape creation
    socket.on('create-shape', (shapeData) => {
        if (!currentRoom) return;

        const room = rooms.get(currentRoom);
        if (room) {
            const shape = {
                ...shapeData,
                id: `shape-${Date.now()}-${socket.id}`,
                userId: socket.id,
                timestamp: Date.now()
            };
            room.shapes.push(shape);

            // Broadcast to all in the room
            io.to(currentRoom).emit('shape-created', shape);
        }
    });

    // Handle shape updates (move, resize)
    socket.on('update-shape', (shapeData) => {
        if (!currentRoom) return;

        const room = rooms.get(currentRoom);
        if (room) {
            const shapeIndex = room.shapes.findIndex(s => s.id === shapeData.id);
            if (shapeIndex !== -1) {
                room.shapes[shapeIndex] = { ...room.shapes[shapeIndex], ...shapeData };
                socket.to(currentRoom).emit('shape-updated', shapeData);
            }
        }
    });

    // Handle canvas clear
    socket.on('clear-canvas', () => {
        if (!currentRoom) return;

        const room = rooms.get(currentRoom);
        if (room) {
            room.drawings = [];
            room.shapes = [];
            io.to(currentRoom).emit('canvas-cleared');
        }
    });

    // Handle username change
    socket.on('username-change', (newName) => {
        if (!currentRoom) return;

        userName = newName;
        const room = rooms.get(currentRoom);
        if (room) {
            const user = room.users.find(u => u.id === socket.id);
            if (user) {
                user.name = newName;
                io.to(currentRoom).emit('users-update', room.users);
            }
        }
    });

    // Handle mode change (text/draw)
    socket.on('mode-change', (mode) => {
        if (!currentRoom) return;
        socket.to(currentRoom).emit('user-mode-change', {
            userId: socket.id,
            mode: mode
        });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);

        if (currentRoom) {
            const room = rooms.get(currentRoom);
            if (room) {
                // Remove user from room
                room.users = room.users.filter(u => u.id !== socket.id);

                // Notify others
                socket.to(currentRoom).emit('user-left', socket.id);
                io.to(currentRoom).emit('users-update', room.users);

                // Clean up empty rooms
                if (room.users.length === 0) {
                    rooms.delete(currentRoom);
                    console.log(`Room ${currentRoom} deleted (empty)`);
                }
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 SyncPad server running on http://localhost:${PORT}`);
    console.log(`📝 Open http://localhost:${PORT} in your browser`);
});
