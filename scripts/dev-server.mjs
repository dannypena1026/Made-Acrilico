import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, request as proxyRequest } from 'node:http';
import { extname, resolve } from 'node:path';

const PORT = Number(process.env.PORT || 4190);
const HOST = process.env.HOST || '0.0.0.0';
const WORKER_HOST = process.env.WORKER_HOST || '127.0.0.1';
const WORKER_PORT = Number(process.env.WORKER_PORT || 8787);
const ROOT = resolve(process.cwd());

const CONTENT_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2'
};

function safeFilePath(pathname) {
    const requested = pathname === '/' ? '/index.html' : pathname;
    const filePath = resolve(ROOT, `.${decodeURIComponent(requested)}`);
    return filePath.startsWith(`${ROOT}/`) ? filePath : null;
}

function proxyApi(request, response) {
    const clientOrigin = request.headers.origin || `http://${request.headers.host || 'localhost'}`;
    const upstream = proxyRequest({
        hostname: WORKER_HOST,
        port: WORKER_PORT,
        path: request.url,
        method: request.method,
        headers: {
            ...request.headers,
            origin: clientOrigin,
            host: `${WORKER_HOST}:${WORKER_PORT}`
        }
    }, upstreamResponse => {
        response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
        upstreamResponse.pipe(response);
    });

    upstream.on('error', () => {
        if (!response.headersSent) {
            response.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
        }
        response.end(JSON.stringify({
            success: false,
            message: 'El servicio interno local no está disponible. Inicia npm run dev:worker.'
        }));
    });

    request.pipe(upstream);
}

const server = createServer((request, response) => {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
        proxyApi(request, response);
        return;
    }

    const filePath = safeFilePath(url.pathname);
    if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Archivo no encontrado');
        return;
    }

    response.writeHead(200, {
        'Content-Type': CONTENT_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store'
    });
    if (request.method === 'HEAD') {
        response.end();
        return;
    }
    createReadStream(filePath).pipe(response);
});

server.listen(PORT, HOST, () => {
    console.log(`Made Acrilico local: http://localhost:${PORT}`);
    console.log(`Worker proxy: http://${WORKER_HOST}:${WORKER_PORT}/api/*`);
});
