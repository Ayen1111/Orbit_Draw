export class CanvasManager {
    constructor(canvas, draftCanvas) {
        this.canvas = canvas;
        this.draftCanvas = draftCanvas;

        this.ctx = canvas.getContext('2d', { alpha: false }); // Main canvas opaque for perf
        this.draftCtx = draftCanvas.getContext('2d'); // Default alpha: true

        // Settings
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.draftCtx.lineCap = 'round';
        this.draftCtx.lineJoin = 'round';

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize(width, height, dpr) {
        // dimensions are already set on canvas.width/height by main.js
        // We just need to scale the context

        this.ctx.scale(dpr, dpr);
        this.draftCtx.scale(dpr, dpr);

        // Reset context properties after resize (scaling resets them sometimes?)
        // Actually scale persists? No, changing width/height resets context state.

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.fillStyle = '#ffffff';
        // Note: fillRect needs to use LOGICAL coordinates now because we scaled!
        // But wait, if we set width=physical, and scale(dpr), then drawing 0,0,logical,logical covers it?
        // Yes.
        this.ctx.fillRect(0, 0, width, height);

        this.draftCtx.lineCap = 'round';
        this.draftCtx.lineJoin = 'round';

        // Store logical dimensions if needed or just trust user passes valid coords
        this.width = width;
        this.height = height;
    }

    clear() {
        this.ctx.fillStyle = '#ffffff';
        // Use the logical width/height stored during resize
        this.ctx.fillRect(0, 0, this.width || this.canvas.width, this.height || this.canvas.height);
    }

    clearDraft() {
        this.draftCtx.clearRect(0, 0, this.width || this.draftCanvas.width, this.height || this.draftCanvas.height);
    }

    /**
     * Renders a single operation (stroke) to MAIN canvas
     */
    drawOperation(op) {
        if (op.type === 'draw_stroke') {
            this.drawStroke(this.ctx, op.data);
        } else if (op.type === 'clear') {
            this.clear();
        }
    }

    /**
     * Draws a strok on a specific context
     */
    drawStroke(ctx, data) {
        const { points, color, width } = data;
        if (!points || points.length < 2) return;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;

        // Move to first point
        ctx.moveTo(points[0].x, points[0].y);

        // Smoothing
        for (let i = 1; i < points.length - 2; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }

        if (points.length > 2) {
            ctx.quadraticCurveTo(
                points[points.length - 2].x,
                points[points.length - 2].y,
                points[points.length - 1].x,
                points[points.length - 1].y
            );
        } else {
            ctx.lineTo(points[1].x, points[1].y);
        }

        ctx.stroke();
    }

    // Helper for live drawing on draft layer
    // Helper for live drawing on draft layer (Legacy O(N) method, kept for reference or specialized use)
    drawDraftSegment(points, color, width) {
        if (points.length < 2) return;
        this.clearDraft();
        this.drawStroke(this.draftCtx, { points, color, width });
    }

    // Optimized: Draw only the latest segment (O(1))
    drawSegment(p1, p2, color, width) {
        if (!p1 || !p2) return;
        const ctx = this.draftCtx;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    drawOperation(op) {
        if (op.type === 'draw_stroke') {
            this.drawStroke(this.ctx, op.data);
        } else if (op.type === 'clear') {
            this.clear();
        }
    }
}
