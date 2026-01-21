import { io } from "https://cdn.socket.io/4.5.4/socket.io.esm.min.js";
import { showToast } from "./toast.js";

export class SocketClient {
    constructor(stateManager) {
        // Connect to the same origin that served the page (works with any port)
        this.socket = io();
        this.state = stateManager;

        this.socket.on('connect', () => {
            console.log('Connected to server at:', window.location.origin);
            document.getElementById('connection-status').innerText = 'Connected';
            document.getElementById('connection-status').classList.remove('disconnected');
            document.getElementById('connection-status').classList.add('connected');

            // Room Logic
            const urlParams = new URLSearchParams(window.location.search);
            let roomId = urlParams.get('room');
            if (!roomId) {
                roomId = 'room-' + Math.random().toString(36).substr(2, 6);
                const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?room=' + roomId;
                window.history.pushState({ path: newUrl }, '', newUrl);
            }

            // Generate or retrieve user info
            const userId = localStorage.getItem('userId') || 'user-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', userId);

            const color = localStorage.getItem('userColor') || '#' + Math.floor(Math.random() * 16777215).toString(16);
            localStorage.setItem('userColor', color);

            this.socket.emit('join', { userId, color, roomId });
            this.state.setLocalUser(userId, color);

            // Update UI with Room ID (if we have a place for it, else just URL is fine)
            // console.log(`Joined Room: ${roomId}`);
            document.title = `Orbit | Room ${roomId.substr(0, 4)}`;
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected');
            document.getElementById('connection-status').innerText = 'Disconnected';
            document.getElementById('connection-status').classList.add('disconnected');
            document.getElementById('connection-status').classList.remove('connected');
        });

        this.socket.on('history_sync', (history) => {
            this.state.syncHistory(history);
        });

        this.socket.on('op_new', (op) => {
            this.state.applyRemoteOperation(op);
            if (op.type === 'clear') {
                showToast('Board cleared by host', 'success');
            }
        });

        this.socket.on('op_undo', (data) => {
            this.state.applyUndo(data.id);
        });

        this.socket.on('user_joined', (user) => {
            this.state.addUser(user);
        });

        // Re-using user_joined for updating user list for simplicity or handle separately
        this.socket.on('user_left', (data) => {
            this.state.removeUser(data.userId);
        });

        this.socket.on('cursor_update', (data) => {
            this.state.updateCursor(data);
        });

        this.socket.on('users_sync', (users) => {
            users.forEach(u => this.state.addUser(u));
        });

        // Event Toasts
        this.socket.on('user_joined', (user) => {
            this.state.addUser(user);
            showToast('New user joined', 'user');
        });

        this.socket.on('user_left', (data) => {
            this.state.removeUser(data.userId);
            showToast('User left session', 'leave');
        });

        this.socket.on('live_stroke', (data) => {
            if (this.state.handleLiveStroke) {
                this.state.handleLiveStroke(data);
            }
        });
    }

    emitDraw(data) {
        this.socket.emit('draw_stroke', data);
    }

    emitClear(data) {
        this.socket.emit('clear_board', data);
        showToast('Board cleared', 'success');
    }

    emitUndo() {
        this.socket.emit('undo');
    }

    emitCursor(pos) {
        this.socket.emit('cursor_move', pos);
    }

    emitLiveStroke(data) {
        this.socket.emit('live_stroke', data);
    }
}