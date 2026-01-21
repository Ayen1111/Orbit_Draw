const DrawingState = require('./drawing-state');

class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    getRoom(roomId) {
        if (!this.rooms.has(roomId)) {
            console.log(`Creating new room: ${roomId}`);
            this.rooms.set(roomId, new DrawingState());
        }
        return this.rooms.get(roomId);
    }

    removeRoom(roomId) {
        this.rooms.delete(roomId);
    }
}

module.exports = RoomManager;
