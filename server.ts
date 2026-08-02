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

  app.post('/api/notifications/resolve-batch', express.json(), (req, res) => {
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
  
  // Use a middleware function to avoid express stripping the path
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
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
  
  httpServer.on('upgrade', wsProxy.upgrade as any);
}

startServer();
