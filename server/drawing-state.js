class DrawingState {
    constructor() {
        this.history = []; // Array of operations
        this.users = new Map(); // Map of userId -> user data (cursor, color, etc.)
    }

    /**
     * Add a new operation to the history.
     * @param {Object} operation - The operation object (draw_stroke, etc.)
     */
    addOperation(operation) {
        // Assign a unique ID if not present (though client should ideally provide one for idempotency, simple counter works for now)
        if (!operation.id) {
            operation.id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        }
        operation.timestamp = Date.now();
        operation.active = true; // All new operations are active by default
        this.history.push(operation);
        return operation;
    }

    /**
     * Mark the last active operation as inactive (Undo).
     * @returns {Object|null} The undone operation or null if nothing to undo.
     */
    undoLastOperation() {
        // Iterate backwards to find the last active operation
        for (let i = this.history.length - 1; i >= 0; i--) {
            if (this.history[i].active) {
                this.history[i].active = false;
                return this.history[i];
            }
        }
        return null;
    }

    /*
     * Redo could be implemented by tracking "undone" stack or searching forward, 
     * but global redo is tricky without a specific target. 
     * For now, we focus on Global Undo as requested.
     */

    /**
     * Get the full history of active operations.
     * Use this for syncing new users.
     */
    getHistory() {
        // optimization: could filter only active ones, but sending all allows client to know full state
        return this.history;
    }

    addUser(userId, userData) {
        this.users.set(userId, userData);
    }

    removeUser(userId) {
        this.users.delete(userId);
    }

    updateUserCursor(userId, position) {
        if (this.users.has(userId)) {
            const user = this.users.get(userId);
            user.cursor = position;
            this.users.set(userId, user);
        }
    }
}

module.exports = DrawingState;
