# Architecture: Collaborative Drawing Application

## Overview
This application enables multiple users to draw on a shared canvas in real-time. It uses a **client-server architecture** where the server acts as the central authority for the drawing state and operation history.

## Data Flow
1.  **Action**: User A draws a stroke on the client.
2.  **Dispatch**: The client immediately renders the stroke (optimistic UI) and emits a `draw_stroke` event to the server via WebSocket.
3.  **Process**: The server receives the event, validates it, timestamps it, and appends it to the global `history`.
4.  **Broadcast**: The server broadcasts the new operation to all *other* connected clients.
5.  **Render**: Client B receives the operation and renders it on their canvas.

## WebSocket Protocol

### Events (Client -> Server)
-   `join`: Sent on connection to request current state.
-   `draw_start`: User pressed mouse down (optional, for real-time smoothness).
-   `draw_stroke`: A completed stroke or batch of points.
    ```json
    {
      "type": "draw_stroke",
      "data": {
        "userId": "uuid-v4",
        "points": [{"x": 10, "y": 10}, ...],
        "color": "#ff0000",
        "width": 5,
        "type": "line" // or "eraser"
      }
    }
    ```
-   `undo`: Request to undo the most recent global action.
-   `cursor_move`: Real-time cursor coordinates for presence UI.

### Events (Server -> Client)
-   `history_sync`: Sent to a new user upon joining. Contains the full history array.
-   `op_new`: A new operation occurred from another user.
-   `op_undo`: An operation ID was undone. Clients must clear and redraw or erase the specific stroke (if feasible), but for global undo correctness, full redraw might be safest initially.
-   `cursor_update`: Updates location of a user's cursor.

## State Management & Undo/Redo
### Server State
The server maintains a linear history of operations:
```javascript
history = [
  { id: 1, userId: 'A', type: 'stroke', data: {...}, active: true },
  { id: 2, userId: 'B', type: 'stroke', data: {...}, active: true }
]
```

### Global Undo Strategy
When a `undo` request is received:
1.  Server searches `history` backwards for the last `active: true` operation.
2.  Marks it as `active: false`.
3.  Broadcasts an `op_undo` event with the `id` of the undone operation.
    *   *Alternative*: Broadcast a forced `history_sync` if managing incremental undo is too complex/buggy.

## Conflict Resolution
-   **Ordering**: The server provides the ground truth for operation order. Messages are processed sequentially.
-   **Latency**: Clients use optimistic rendering. If the server rejects an edit (rare in this simple app) or reorders significantly, a state reconciliation (full history resync) can enforce consistency.
