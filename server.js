const http = require('http');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 8080;
const INTERNAL_PORT = 9090;
const BASE_URL = process.env.BASE_URL || `http://0.0.0.0:${PORT}`;

// Start supergateway on internal port
const gateway = spawn('npx', [
  '-y', 'supergateway',
  '--stdio', `npx -y @thevgergroup/apollo-io-mcp@latest`,
  '--port', String(INTERNAL_PORT),
  '--baseUrl', BASE_URL,
  '--ssePath', '/sse',
  '--messagePath', '/message',
  '--cors'
], {
  env: { ...process.env, APOLLO_API_KEY: process.env.APOLLO_API_KEY },
  shell: true
});

gateway.stdout.on('data', d => process.stdout.write(d));
gateway.stderr.on('data', d => process.stderr.write(d));
gateway.on('exit', code => { console.log(`Gateway exited: ${code}`); process.exit(code); });

// Proxy server
const server = http.createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    });
    return res.end();
  }

  // Handle .well-known endpoints - return 404 properly
  if (req.url.includes('.well-known')) {
    res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ error: 'not_found' }));
  }

  // Health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok' }));
  }

  // Proxy to supergateway
  const options = {
    hostname: '127.0.0.1',
    port: INTERNAL_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${INTERNAL_PORT}` }
  };

  const proxy = http.request(options, proxyRes => {
    const headers = { ...proxyRes.headers, 'Access-Control-Allow-Origin': '*' };
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  });

  proxy.on('error', err => {
    console.error('Proxy error:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'gateway_unavailable' }));
  });

  req.pipe(proxy);
});

// Wait for gateway to start, then listen
setTimeout(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Proxy server listening on port ${PORT}`);
    console.log(`Forwarding to supergateway on port ${INTERNAL_PORT}`);
  });
}, 3000);
