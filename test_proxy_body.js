import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import http from 'http';

const targetApp = express();
targetApp.use(express.json());
targetApp.post('/api/test', (req, res) => {
  res.json({ bodyReceived: req.body });
});
targetApp.post('/api/auth/login', (req, res) => {
  res.json({ token: '12345', user: { id: 1 } });
});
const targetServer = targetApp.listen(3002);

const proxyApp = express();

proxyApp.post('/api/auth/login', express.json(), async (req, res) => {
  try {
    const response = await fetch(`http://localhost:3002/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    if (data.token) {
      res.cookie('token', data.token, { httpOnly: true });
      delete data.token;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'err' });
  }
});

proxyApp.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

const apiProxy = createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
});

proxyApp.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
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

const proxyServer = proxyApp.listen(3003, async () => {
  console.log('Testing login...');
  const resLogin = await fetch('http://localhost:3003/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test' })
  });
  console.log('Login status:', resLogin.status);
  console.log('Login cookies:', resLogin.headers.get('set-cookie'));
  const loginBody = await resLogin.json();
  console.log('Login body:', loginBody);

  console.log('Testing proxy body...');
  const resProxy = await fetch('http://localhost:3003/api/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': resLogin.headers.get('set-cookie')
    },
    body: JSON.stringify({ hello: 'world' })
  });
  console.log('Proxy status:', resProxy.status);
  const proxyBody = await resProxy.json();
  console.log('Proxy body:', proxyBody);

  targetServer.close();
  proxyServer.close();
  process.exit(0);
});
