const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const setupWebSocket = require('./websocket-handler');
const RoomManager = require('./rooms');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for now
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));

// Room Manager handling multiple states
const roomManager = new RoomManager();

io.on('connection', (socket) => {
    setupWebSocket(socket, io, roomManager);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});