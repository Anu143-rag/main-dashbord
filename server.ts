import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';

const TARGET_API = 'https://gps-backend-jzd7.onrender.com';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Custom Authentication Routes
  app.post('/api/auth/login', express.json(), async (req, res) => {
    try {
      const response = await fetch(`${TARGET_API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();

      if (response.ok && data.token) {
        // Set HttpOnly cookie
        res.cookie('token', data.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        delete data.token; // Do not send token to client
        res.status(response.status).json(data);
      } else {
        res.status(response.status).json(data);
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
  });

  // Setup Proxy for /api
  const apiProxy = createProxyMiddleware({
    target: TARGET_API,
    changeOrigin: true,
    secure: false,
  });
  
  // Use a middleware function to avoid express stripping the path
  app.use((req, res, next) => {
    if (req.url.startsWith('/api') && !req.url.startsWith('/api/auth/login') && !req.url.startsWith('/api/auth/logout')) {
      // Parse cookies
      if (req.headers.cookie) {
        const cookies = req.headers.cookie.split(';').reduce((acc: any, cookie: string) => {
          const [key, value] = cookie.split('=').map(c => c.trim());
          if (key && value) acc[key] = decodeURIComponent(value);
          return acc;
        }, {});

        if (cookies.token) {
          req.headers['authorization'] = `Bearer ${cookies.token}`;
        }
      }
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
