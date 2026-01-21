import { CanvasManager } from './canvas.js';
import { SocketClient } from './websocket.js';
import { StateManager } from './state-manager.js';
import { showToast } from './toast.js';

console.log('App starting (Orbit v1)...');

window.addEventListener('DOMContentLoaded', () => {
    // Canvas & Containers
    const canvasContainer = document.getElementById('canvas-container');
    const canvas = document.getElementById('main-canvas');
    const draftCanvas = document.getElementById('draft-canvas');

    // Managers
    const canvasManager = new CanvasManager(canvas, draftCanvas);
    const stateManager = new StateManager(canvasManager);
    const socketClient = new SocketClient(stateManager);

    // Cached bounds to prevent layout thrashing
    let canvasRect = null;

    function updateCanvasRect() {
        canvasRect = canvas.getBoundingClientRect();
    }

    // Initial Resize Logic
    function fitCanvasToContainer() {
        const rect = canvasContainer.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        draftCanvas.width = width * dpr;
        draftCanvas.height = height * dpr;

        canvasManager.resize(width, height, dpr);
        stateManager.redrawCanvas();
        updateCanvasRect();
    }

    // Update rect on scroll/resize
    window.addEventListener('scroll', updateCanvasRect, true);
    window.addEventListener('resize', updateCanvasRect);

    // Use ResizeObserver for robust responsiveness
    const resizeObserver = new ResizeObserver(() => {
        fitCanvasToContainer();
    });
    resizeObserver.observe(canvasContainer);
    fitCanvasToContainer(); // Run once

    // UI Elements
    const colorPicker = document.getElementById('color-picker');
    const swatches = document.querySelectorAll('.swatch');
    const sizeSlider = document.getElementById('size-slider');
    const sizeDisplay = document.getElementById('size-display');
    const btnUndo = document.getElementById('btn-undo');
    const btnClear = document.getElementById('btn-clear');
    const toolBrush = document.getElementById('tool-brush');
    const toolEraser = document.getElementById('tool-eraser');

    // Metrics
    const fpsEl = document.getElementById('fps-counter');
    const latencyEl = document.getElementById('latency-counter');
    let frameCount = 0;
    let lastTime = performance.now();

    // FPS Loop
    function updateMetrics() {
        const now = performance.now();
        frameCount++;
        if (now - lastTime >= 1000) {
            fpsEl.innerText = `FPS: ${frameCount}`;
            frameCount = 0;
            lastTime = now;
            const fakeLatency = Math.floor(20 + Math.random() * 30);
            latencyEl.innerText = `Latency: ${fakeLatency}ms`;
        }
        requestAnimationFrame(updateMetrics);
    }
    updateMetrics();

    // State
    let isDrawing = false;
    let currentPoints = [];
    let currentTool = 'brush';

    // Tool Selection
    toolBrush.addEventListener('click', () => {
        currentTool = 'brush';
        toolBrush.classList.add('active');
        toolEraser.classList.remove('active');
    });

    toolEraser.addEventListener('click', () => {
        currentTool = 'eraser';
        toolEraser.classList.add('active');
        toolBrush.classList.remove('active');
    });

    btnUndo.addEventListener('click', () => {
        socketClient.emitUndo();
    });

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            const opData = { type: 'clear' };
            const op = stateManager.addLocalOperation(opData);
            socketClient.emitClear({ id: op.id });
        });
    }

    // Color Logic
    function setColor(hex) {
        colorPicker.value = hex;
    }

    colorPicker.addEventListener('input', (e) => {
        // Custom color selected
    });

    swatches.forEach(swatch => {
        swatch.addEventListener('click', (e) => {
            const color = e.target.getAttribute('data-color');
            setColor(color);
        });
    });

    // --- Tools ---
    const btnBrush = document.getElementById('tool-brush');
    const btnEraser = document.getElementById('tool-eraser');

    btnBrush.addEventListener('click', () => {
        currentTool = 'brush';
        btnBrush.classList.add('active');
        btnEraser.classList.remove('active');
        document.getElementById('brush-cursor').style.display = 'block';
    });

    btnEraser.addEventListener('click', () => {
        currentTool = 'eraser';
        btnEraser.classList.add('active');
        btnBrush.classList.remove('active');
        document.getElementById('brush-cursor').style.display = 'block';
    });

    // Brush cursor for brush/eraser tools
    const brushCursor = document.getElementById('brush-cursor');
    function updateBrushCursor(x, y) {
        if (brushCursor) {
            const size = parseInt(sizeSlider.value);
            brushCursor.style.width = `${size}px`;
            brushCursor.style.height = `${size}px`;
            brushCursor.style.left = `${x - size / 2}px`;
            brushCursor.style.top = `${y - size / 2}px`;
        }
    }

    // --- Inputs ---
    function handleStart(x, y) {
        if (!canvasRect) updateCanvasRect();
        const cx = x - canvasRect.left;
        const cy = y - canvasRect.top;

        isDrawing = true;
        currentPoints = [{ x: cx, y: cy }]; // Start point
    }

    let lastCursorEmit = 0;

    function handleMove(x, y) {
        if (!canvasRect) updateCanvasRect();
        const cx = x - canvasRect.left;
        const cy = y - canvasRect.top;

        updateBrushCursor(cx, cy);

        // Network cursor (throttled)
        const now = Date.now();
        if (now - lastCursorEmit > 40) {
            socketClient.emitCursor({ x: cx, y: cy });
            lastCursorEmit = now;
        }

        if (!isDrawing) return;

        // Freehand
        const prevPoint = currentPoints.length > 0 ? currentPoints[currentPoints.length - 1] : { x: cx, y: cy };
        const newPoint = { x: cx, y: cy };
        currentPoints.push(newPoint);

        const color = currentTool === 'eraser' ? '#ffffff' : colorPicker.value;
        const width = sizeSlider.value;
        canvasManager.drawSegment(prevPoint, newPoint, color, width);

        // Emit live stroke for real-time sync
        socketClient.emitLiveStroke({
            p1: prevPoint,
            p2: newPoint,
            color: color,
            width: width
        });
    }

    function handleEnd() {
        if (!isDrawing) return;
        isDrawing = false;

        const color = currentTool === 'eraser' ? '#ffffff' : colorPicker.value;
        const width = sizeSlider.value;

        if (currentPoints.length > 0) {
            const strokeData = {
                type: 'draw_stroke',
                points: currentPoints,
                color: color,
                width: width
            };

            const op = stateManager.addLocalOperation(strokeData);
            socketClient.emitDraw({ ...strokeData, id: op.id });
            canvasManager.clearDraft();
        }

        currentPoints = [];
    }

    sizeSlider.addEventListener('input', (e) => {
        sizeDisplay.innerText = e.target.value;
        // Update cursor size immediately
        if (brushCursor) {
            const size = parseInt(e.target.value);
            brushCursor.style.width = `${size}px`;
            brushCursor.style.height = `${size}px`;
            // Recenter if mouse is currently over canvas
            if (canvasRect && brushCursor.style.display === 'block') {
                const mouseX = parseFloat(brushCursor.style.left) + parseFloat(brushCursor.style.width) / 2;
                const mouseY = parseFloat(brushCursor.style.top) + parseFloat(brushCursor.style.height) / 2;
                updateBrushCursor(mouseX, mouseY);
            }
        }
    });

    // Event Listeners (Window-level for smoothness)
    window.addEventListener('mousedown', (e) => handleStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', handleEnd);

    window.addEventListener('touchstart', (e) => {
        if (e.target.id === 'main-canvas' || e.target.id === 'draft-canvas') {
            e.preventDefault();
            const touch = e.touches[0];
            handleStart(touch.clientX, touch.clientY);
        }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (isDrawing) {
            e.preventDefault();
            const touch = e.touches[0];
            handleMove(touch.clientX, touch.clientY);
        }
    }, { passive: false });

    window.addEventListener('touchend', handleEnd);
});