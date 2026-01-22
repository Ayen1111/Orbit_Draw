# Orbit - Real-Time Collaborative Canvas

Orbit is a high-performance, real-time collaborative whiteboard application built with **Node.js**, **Socket.IO**, and **Vanilla HTML5 Canvas**. It features 0-latency live drawing, room-based isolation for private sessions, and a premium glassmorphism UI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

![Status](https://img.shields.io/badge/status-live-green.svg)
[![Render](https://img.shields.io/badge/Render-Live-46E3B7?style=flat&logo=render&logoColor=white)](https://orbit-draw.onrender.com)

## 🚀 Features

### 🎨 Live Collaboration
*   **Real-Time Sync**: Strokes are broadcasted immediately as you draw (live streaming points), not just after you finish.
*   **Multi-User Cursors**: See exactly where other users are hovering with name labels and unique colors.
*   **Room Isolation**: Every new session creates a unique, private room (e.g., `?room=xyz`). Users in different rooms cannot see each other.
*   **Shareable Links**: Dedicated button to copy the room URL for instant collaboration.

### 🛠 Powerful Tools
*   **Brush Engine**: Smooth, pressure-simulated freehand drawing.
*   **Eraser**: Clean deletion of content.
*   **Customization**: Adjustable stroke width (2px-40px) and custom color picker (HEX supported).
*   **Undo/Redo**: Global history stack handled by the server (supports undoing across users).
*   **Clear Board**: Instantly wipe the canvas for everyone in the room.

### ⚡ Performance & UX
*   **O(1) Rendering**: Optimized drawing loop renders only new segments, ensuring 60fps even with huge drawings.
*   **Glassmorphism UI**: Modern, floating toolbars with blur effects.
*   **Entrance Animations**: Smooth UI transitions.
*   **Toast Notifications**: Non-intrusive alerts for events (User Joined, Link Copied, etc.).

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Ayen1111/Orbit_Draw.git
    cd Orbit_Draw
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Start the Server**
    ```bash
    npm start
    ```

4.  **Open in Browser**
    Visit `http://localhost:3000`.
    *   To collaborate, click "Share" and open the link in another tab or device.

## 🏗 Architecture

*   **Server**: Node.js + Express hosting the static frontend and Socket.IO server.
*   **State Management**: 
    *   **Server**: `RoomManager` holds `DrawingState` for each room.
    *   **Client**: `StateManager` handles local history and syncs with `SocketClient`.
*   **Canvas Operation**:
    *   **Double Buffering**: `main-canvas` (persistent) + `draft-canvas` (live strokes).
    *   **Culling**: Only draws new segments during drag events to minimize CPU usage.

## 📝 Usage

*   **Draw**: Left-click and drag.
*   **Tools**: Switch between Brush (B) and Eraser (E) via toolbar or keyboard shortcuts.
*   **Share**: Click the Share button in the top-right to copy the private room link.
*   **Clear**: Use the trash icon (warning: clears for everyone!).