module.exports = (socket, io, roomManager) => {
    let currentUserId = null;
    let currentRoomId = null;
    let state = null; // The DrawingState for this room

    // Handle Join
    socket.on('join', (userData) => {
        currentUserId = userData.userId || socket.id;
        currentRoomId = userData.roomId || 'default'; // Default room if none specified

        // Join the socket.io room
        socket.join(currentRoomId);
        console.log(`User ${currentUserId} joined room: ${currentRoomId}`);

        // Get state for this room
        state = roomManager.getRoom(currentRoomId);

        // Store user info
        state.addUser(currentUserId, {
            ...userData,
            socketId: socket.id,
            color: userData.color || '#' + Math.floor(Math.random() * 16777215).toString(16)
        });

        // Send current history to the new user
        socket.emit('history_sync', state.history);

        // Send current user list
        socket.emit('users_sync', Array.from(state.users.values()));

        // Broadcast presence ONLY to this room
        socket.to(currentRoomId).emit('user_joined', { userId: currentUserId, ...state.users.get(currentUserId) });
    });

    // Handle Drawing Stroke
    socket.on('draw_stroke', (data) => {
        if (!state) return;
        const op = {
            type: 'draw_stroke',
            userId: currentUserId,
            id: data.id,
            data: data
        };
        const savedOp = state.addOperation(op);

        // Broadcast to room
        socket.to(currentRoomId).emit('op_new', savedOp);
    });

    // Handle Undo
    socket.on('undo', () => {
        if (!state) return;
        const undoneOp = state.undoLastOperation();
        if (undoneOp) {
            // Broadcast the undo event to room (via io.to to include sender if needed, but undo usually triggered by sender)
            // Ideally io.to(room).emit for everyone
            io.to(currentRoomId).emit('op_undo', { id: undoneOp.id });
        }
    });

    // Handle Clear Board
    socket.on('clear_board', (data) => {
        if (!state) return;
        const op = {
            type: 'clear',
            userId: currentUserId,
            id: data.id,
            timestamp: Date.now()
        };
        const savedOp = state.addOperation(op);
        io.to(currentRoomId).emit('op_new', savedOp);
    });

    // Handle Cursor Move
    socket.on('cursor_move', (position) => {
        if (!currentUserId || !state) return;
        state.updateUserCursor(currentUserId, position);
        socket.to(currentRoomId).emit('cursor_update', { userId: currentUserId, position });
    });

    // Handle Live Stroke
    socket.on('live_stroke', (data) => {
        if (!currentRoomId) return;
        socket.to(currentRoomId).emit('live_stroke', data);
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
        if (currentUserId && state) {
            state.removeUser(currentUserId);
            io.to(currentRoomId).emit('user_left', { userId: currentUserId });
        }
    });
};
