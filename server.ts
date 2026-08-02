import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';
import compression from 'compression';

const TARGET_API = 'https://gps-backend-jzd7.onrender.com';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // --- Mock endpoints for pending backend updates ---
  app.get('/api/search', (req, res) => {
    res.json({
      schools: [
        { id: "mock-1", name: "Delhi Public School", city: "Delhi", state: "Delhi" }
      ],
      devices: [
        { id: "mock-2", licensePlate: "DL1P-1234", deviceId: "TM100-MOCK" }
      ],
      admins: [
        { id: "mock-3", name: "Principal Sharma", role: "SCHOOL_ADMIN" }
      ]
    });
  });

  app.get('/api/notifications', (req, res) => {
    res.json([
      {
        id: "sys-warning-2",
        type: "SYSTEM_WARNING",
        title: "High Speed Alert",
        message: "Bus DL1P-4321 exceeded speed limit (85 km/h).",
        status: "ACTIVE",
        createdAt: new Date().toISOString()
      }
    ]);
  });

  app.post('/api/notifications/:id/resolve', (req, res) => {
    res.json({ success: true });
  });
  // ------------------------------------------------

  // Add compression middleware
  app.use(compression());

  // Setup Proxy for /api
  const apiProxy = createProxyMiddleware({
    target: TARGET_API,
    changeOrigin: true,
    secure: false,
  });
  
  app.post('/api/auth/login', express.json(), async (req, res) => {
    try {
      const fetchRes = await fetch(`${TARGET_API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      const data = await fetchRes.json();
      if (fetchRes.ok && data.token) {
        res.cookie('token', data.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000
        });
        res.status(fetchRes.status).json({ user: data.user });
      } else {
        res.status(fetchRes.status).json(data);
      }
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
  });

  // Use a middleware function to avoid express stripping the path
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      const tokenMatch = req.headers.cookie?.match(/(?:^|;\s*)token=([^;]*)/);
      if (tokenMatch) {
        req.headers['authorization'] = `Bearer ${tokenMatch[1]}`;
      }
      return apiProxy(req, res, next);
    }
    next();
  });

  // Setup Proxy for Websockets
  const wsProxy = createProxyMiddleware({
    target: TARGET_API,
    changeOrigin: true,
    ws: true,
    secure: false,
  });
  app.use('/socket.io', wsProxy);

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = app.listen(PORT as number, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  
  httpServer.on('upgrade', (req, socket, head) => {
    const tokenMatch = req.headers.cookie?.match(/(?:^|;\s*)token=([^;]*)/);
    if (tokenMatch) {
      req.headers['authorization'] = `Bearer ${tokenMatch[1]}`;
    }
    (wsProxy.upgrade as any)(req, socket, head);
  });
}

startServer();
