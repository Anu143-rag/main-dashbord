import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';

const TARGET_API = 'https://gps-backend-jzd7.onrender.com';

async function startServer() {
  const app = express();
  const PORT = 3000;

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
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        return; 
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  
  // Setup Proxy for Websockets
  const wsProxy = createProxyMiddleware({
    target: TARGET_API,
    changeOrigin: true,
    ws: true,
    secure: false,
  });
  app.use('/socket.io', wsProxy);
  httpServer.on('upgrade', wsProxy.upgrade as any);
}

startServer();
