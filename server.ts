import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Start Python Backend (FastAPI)
  console.log('Starting Python backend...');
  const pythonProcess = spawn('python3', ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8001'], {
    stdio: 'inherit',
    env: { ...process.env, PYTHONPATH: process.cwd() }
  });

  pythonProcess.on('error', (err) => {
    console.error('Failed to start Python backend:', err);
  });

  // 2. Proxy API requests to FastAPI (port 8001)
  app.use('/api', createProxyMiddleware({
    target: 'http://127.0.0.1:8001',
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        if ('writeHead' in res) {
          res.writeHead(502, { 'Content-Type': 'text/plain' });
          res.end('Python backend not reachable');
        }
      }
    }
  }));

  // 3. Vite middleware for development
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
