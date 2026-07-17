import { BUSINESS_CONFIG } from './business-config.js';

function removeTrailingSlash(value = '') {
    return String(value).trim().replace(/\/+$/, '');
}

function isLocalHost(hostname = '') {
    return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        /^10\./.test(hostname) ||
        /^192\.168\./.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    );
}

export function getSecureApiUrl(path) {
    const requestedPath = `/${String(path || '').replace(/^\/+/, '')}`;
    const configuredBaseUrl = removeTrailingSlash(
        BUSINESS_CONFIG.secureApiBaseUrl
    );

    if (configuredBaseUrl) {
        return `${configuredBaseUrl}${requestedPath}`;
    }

    if (isLocalHost(window.location.hostname)) {
        // The local development server proxies /api to the Worker. Keeping one
        // origin prevents phones on the same Wi-Fi from needing port 8787.
        return requestedPath;
    }

    // The Pages custom domain on www currently owns its static fallback routes.
    // Keep the API on the apex Worker route; CORS permits both public hostnames.
    return `https://madeacrilico.com${requestedPath}`;
}
