import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, request as proxyRequest } from 'node:http';
import { extname, resolve } from 'node:path';
import { createGzip } from 'node:zlib';

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

const COMPRESSIBLE_EXTENSIONS = new Set(['.css', '.html', '.js', '.json', '.svg']);

function safeFilePath(pathname) {
    let decodedPath;
    try {
        decodedPath = decodeURIComponent(pathname);
    } catch {
        return null;
    }

    const normalizedPath = decodedPath === '/'
        ? '/index.html'
        : decodedPath.replace(/\/+$/, '');
    const filePath = resolve(ROOT, `.${normalizedPath}`);
    if (!filePath.startsWith(`${ROOT}/`)) return null;

    if (existsSync(filePath) && statSync(filePath).isFile()) return filePath;

    if (!extname(normalizedPath)) {
        const htmlPath = resolve(ROOT, `.${normalizedPath}.html`);
        if (htmlPath.startsWith(`${ROOT}/`) && existsSync(htmlPath) && statSync(htmlPath).isFile()) {
            return htmlPath;
        }
    }

    return null;
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

function serveFile(request, response, filePath, status = 200, extraHeaders = {}) {
    const extension = extname(filePath).toLowerCase();
    const acceptsGzip = /(?:^|,)\s*gzip\s*(?:,|$)/i.test(request.headers['accept-encoding'] || '');
    const useGzip = acceptsGzip && COMPRESSIBLE_EXTENSIONS.has(extension);
    const headers = {
        'Content-Type': CONTENT_TYPES[extension] || 'application/octet-stream',
        'Cache-Control': 'no-store',
        ...extraHeaders
    };

    if (useGzip) {
        headers['Content-Encoding'] = 'gzip';
        headers.Vary = 'Accept-Encoding';
    }

    response.writeHead(status, headers);
    if (request.method === 'HEAD') {
        response.end();
        return;
    }

    const stream = createReadStream(filePath);
    if (useGzip) {
        stream.pipe(createGzip()).pipe(response);
        return;
    }
    stream.pipe(response);
}

const server = createServer((request, response) => {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
        proxyApi(request, response);
        return;
    }

    const filePath = safeFilePath(url.pathname);
    if (!filePath) {
        serveFile(request, response, resolve(ROOT, '404.html'), 404);
        return;
    }

    serveFile(request, response, filePath);
});

server.listen(PORT, HOST, () => {
    console.log(`Made Acrilico local: http://localhost:${PORT}`);
    console.log(`Worker proxy: http://${WORKER_HOST}:${WORKER_PORT}/api/*`);
});
