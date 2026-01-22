export class StateManager {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.history = []; // Local copy of full history
        this.users = new Map();
        this.localUserId = null;
        this.cursorsContainer = document.getElementById('cursors-layer');
        this.userListEl = document.getElementById('user-ul');
    }

    setLocalUser(id, color) {
        this.localUserId = id;
        this.localUserColor = color;
        // Also update the color picker to match
        document.getElementById('color-picker').value = color; // simple hex check
    }

    syncHistory(history) {
        this.history = history;
        this.redrawCanvas();
    }

    applyRemoteOperation(op) {
        this.history.push(op);
        
        if (op.active) {
            this.canvasManager.drawOperation(op);
        }
    }

    applyUndo(opId) {
        // Find operation and deactivate
        const op = this.history.find(o => o.id === opId);
        if (op) {
            op.active = false;
            // Must redraw everything to remove this stroke
            this.redrawCanvas();
        }
    }

    addLocalOperation(data) {
        // Generate a UUID for the operation
        const id = crypto.randomUUID();
        const op = {
            id: id,
            type: data.type || 'draw_stroke',
            userId: this.localUserId,
            data: data,
            active: true,
            timestamp: Date.now()
        };
        this.history.push(op);
        if (op.type === 'clear') {
            this.canvasManager.clear();
        } else {
            this.canvasManager.drawOperation(op);
        }
        return op;
    }

    redrawCanvas() {
        this.canvasManager.clear();
        this.history.forEach(op => {
            if (op.active) {
                this.canvasManager.drawOperation(op);
            }
        });
    }

    addUser(user) {
        this.users.set(user.userId, user);
        this.updateUserList();

        // Create cursor element ONLY for remote users
        if (user.userId !== this.localUserId) {
            const cursorHandler = document.createElement('div');
            cursorHandler.className = 'cursor';
            cursorHandler.id = `cursor-${user.userId}`;
            cursorHandler.innerHTML = `
                <div class="cursor-pointer" style="border-bottom-color: ${user.color}"></div>
                <div class="cursor-label" style="background: ${user.color}">${user.userId.substr(0, 4)}</div>
            `;
            this.cursorsContainer.appendChild(cursorHandler);
        }
    }

    removeUser(userId) {
        this.users.delete(userId);
        this.updateUserList();
        const el = document.getElementById(`cursor-${userId}`);
        if (el) el.remove();
    }

    updateUserList() {
        this.userListEl.innerHTML = '';
        this.users.forEach(u => {
            const li = document.createElement('li');
            li.innerHTML = `<div class="user-dot" style="background:${u.color}">${u.userId.charAt(0).toUpperCase()}</div>`;
            this.userListEl.appendChild(li);
        });

        // Update count
        const count = this.users.size;
        const countEl = document.getElementById('user-count');
        if (countEl) {
            countEl.innerText = `Users (${count})`;
        }
    }

    handleLiveStroke(data) {
        const { p1, p2, color, width } = data;
        // Draw directly to main context for immediate feedback
        // This will be overwritten/cleaned up when the full stroke is received and redrawCanvas is called
        this.canvasManager.drawStroke(this.canvasManager.ctx, {
            points: [p1, p2],
            color: color,
            width: width
        });
    }

    updateCursor(data) {
        const { userId, position } = data;
        const el = document.getElementById(`cursor-${userId}`);
        if (el) {
            el.style.transform = `translate(${position.x}px, ${position.y}px)`;
        } else {
            // If user unknown, maybe add them? (Lazy load)
            if (!this.users.has(userId)) {
                // We'd need their color... 
                // For now ignore or request info.
            }
        }
    }
}
