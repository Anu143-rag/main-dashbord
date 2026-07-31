import { createProxyMiddleware } from 'http-proxy-middleware';
console.log(Object.keys(createProxyMiddleware({ target: 'http://localhost' })));
