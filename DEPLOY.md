# Deploying Orbit Canvas

Because Orbit uses **WebSockets** for real-time communication, it requires a permanently running server.
**Vercel** (and Netlify) are "Serverless" platforms, meaning they shut down the server immediately after a response, which breaks real-time connections.

Instead, we recommend **Render** or **Railway**, which handle Node.js servers perfectly (and have free tiers).

## Option 1: Render (Recommended & Free)

1.  **Push your code to GitHub** (Ensure your repo `Orbit_Draw` has all the files).
2.  **Sign up** at [render.com](https://render.com/).
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub account and select `Orbit_Draw`.
5.  **Configure**:
    *   **Name**: `orbit-canvas`
    *   **Region**: Closest to you (e.g., Singapore/Frankfurt).
    *   **Branch**: `main`
    *   **Root Directory**: `.` (leave empty)
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
6.  Click **Create Web Service**.
7.  Wait 1-2 minutes. Render will give you a URL (e.g., `https://orbit-canvas.onrender.com`).

## Option 2: Railway (Faster)

1.  Go to [railway.app](https://railway.app/).
2.  Login with GitHub.
3.  Click **New Project** -> **Deploy from GitHub repo**.
4.  Select `Orbit_Draw`.
5.  Railway will automatically detect `package.json` and deploy it.
6.  It will generate a domain for you automatically.

## Why not Vercel?
Vercel is built for static sites (Next.js, React). While it can run Node.js, it kills the process after 10 seconds. WebSocket apps need the process to stay alive forever to listen for drawing events. Deploying this to Vercel would cause users to disconnect constantly.
