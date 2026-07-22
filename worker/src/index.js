import { buildQuoteFromInput } from '../../js/core/pricing-engine.js';
import {
    DEFAULT_BUSINESS_CONFIG,
    DEFAULT_MATERIALS
} from '../../js/core/business-config.js';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_ORDER_ITEMS = 30;
const ASSET_TOKEN_TTL_SECONDS = 60 * 60 * 24;
const UPLOAD_WINDOW_SECONDS = 60 * 10;
const ORDER_WINDOW_SECONDS = 60 * 10;
const UPLOAD_LIMIT = 12;
const ORDER_LIMIT = 6;
const ADMIN_LOGIN_LIMIT = 5;
const ADMIN_LOGIN_WINDOW_SECONDS = 60 * 15;
const ADMIN_SESSION_TTL_SECONDS = 60 * 30;
const ADMIN_PASSWORD_ITERATIONS = 210000;
const ADMIN_PAGE_SIZE = 25;
const ADMIN_MAX_PAGE_SIZE = 50;
const MAX_SITE_IMAGE_BYTES = 8 * 1024 * 1024;

const SITE_IMAGE_SLOTS = new Set([
    'brand-logo',
    'home-textil',
    'home-uv',
    'home-stickers',
    'store-badge',
    'store-sublimation',
    'store-uv',
    'store-textil'
]);

const ORDER_STATUSES = new Set([
    'pending_review',
    'pending_notification',
    'in_review',
    'approved',
    'in_production',
    'ready',
    'completed',
    'cancelled'
]);

const PAYMENT_STATUSES = new Set([
    'pending',
    'deposit_received',
    'paid',
    'refunded'
]);

const FILE_SIGNATURES = {
    png: bytes => startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    jpg: bytes => startsWith(bytes, [0xff, 0xd8, 0xff]),
    webp: bytes => startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8),
    tiff: bytes => startsWith(bytes, [0x49, 0x49, 0x2a, 0x00]) || startsWith(bytes, [0x4d, 0x4d, 0x00, 0x2a]),
    pdf: bytes => includesAscii(bytes, '%PDF-'),
    psd: bytes => startsWith(bytes, [0x38, 0x42, 0x50, 0x53]),
    ai: bytes => includesAscii(bytes, '%PDF-') || includesAscii(bytes, '%!PS-Adobe')
};

const SIGNATURE_ALIASES = {
    jpeg: 'jpg',
    jpe: 'jpg',
    tif: 'tiff'
};

function startsWith(bytes, signature, offset = 0) {
    return signature.every((value, index) => bytes[offset + index] === value);
}

function includesAscii(bytes, text) {
    const signature = Array.from(text, character => character.charCodeAt(0));
    return bytes.some((_, index) => startsWith(bytes, signature, index));
}

function getFileExtension(fileName = '') {
    const segments = String(fileName).trim().toLowerCase().split('.');
    return segments.length > 1 ? segments.pop() : '';
}

function getAllowedExtensions(material) {
    const general = ['png', 'pdf', 'ai', 'psd'];
    if (material !== 'stickers') return general;
    return ['png', 'pdf', 'ai', 'jpg', 'jpeg', 'jpe', 'webp', 'tif', 'tiff'];
}

function toBase64Url(bytes) {
    const binary = String.fromCharCode(...bytes);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
    const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return Uint8Array.from(atob(padded), character => character.charCodeAt(0));
}

async function hmac(value, secret) {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
    return toBase64Url(new Uint8Array(signature));
}

function constantTimeEqual(left, right) {
    const leftBytes = new TextEncoder().encode(String(left));
    const rightBytes = new TextEncoder().encode(String(right));
    if (leftBytes.byteLength !== rightBytes.byteLength) return false;

    if (typeof crypto.subtle.timingSafeEqual === 'function') {
        return crypto.subtle.timingSafeEqual(leftBytes, rightBytes);
    }

    let difference = 0;
    for (let index = 0; index < leftBytes.byteLength; index += 1) {
        difference |= leftBytes[index] ^ rightBytes[index];
    }
    return difference === 0;
}

async function hashAdminPassword(password, salt) {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits({
        name: 'PBKDF2',
        salt: fromBase64Url(salt),
        iterations: ADMIN_PASSWORD_ITERATIONS,
        hash: 'SHA-256'
    }, key, 256);
    return toBase64Url(new Uint8Array(bits));
}

function createPasswordSalt() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return toBase64Url(bytes);
}

async function createAssetToken(asset, secret) {
    const payload = toBase64Url(new TextEncoder().encode(JSON.stringify(asset)));
    return `${payload}.${await hmac(payload, secret)}`;
}

async function verifyAssetToken(token, secret) {
    const [payload, suppliedSignature] = String(token || '').split('.');
    if (!payload || !suppliedSignature) return null;
    const expectedSignature = await hmac(payload, secret);
    if (!constantTimeEqual(suppliedSignature, expectedSignature)) return null;

    try {
        const parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
        return Number.isFinite(parsed.expiresAt) && parsed.expiresAt > Date.now() ? parsed : null;
    } catch {
        return null;
    }
}

function parseAllowedOrigins(env) {
    return String(env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);
}

function getOrigin(request) {
    return request.headers.get('Origin') || '';
}

function isAllowedOrigin(request, env) {
    return parseAllowedOrigins(env).includes(getOrigin(request));
}

function corsHeaders(request, env) {
    const origin = getOrigin(request);
    return isAllowedOrigin(request, env)
        ? {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
            Vary: 'Origin'
        }
        : {};
}

function getRequestId(request) {
    const candidate = request.headers.get('CF-Ray') || request.headers.get('X-Request-ID') || 'local';
    return cleanText(candidate, 80).replace(/[^a-zA-Z0-9._:-]/g, '') || 'unknown';
}

function logWorkerError(request, operation, error) {
    const url = new URL(request.url);
    console.error({
        level: 'error',
        event: 'worker_request_failed',
        operation,
        requestId: getRequestId(request),
        method: request.method,
        path: url.pathname,
        errorName: cleanText(error?.name || 'Error', 80)
    });
}

function json(request, env, status, body) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Request-ID': getRequestId(request),
            ...corsHeaders(request, env)
        }
    });
}

function parseInteger(value, fallback, minimum, maximum) {
    const number = Number.parseInt(String(value || ''), 10);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(Math.max(number, minimum), maximum);
}

async function enforceRateLimit(request, env, scope, limit, windowSeconds) {
    // Local development is isolated on the developer machine. Skipping the
    // persisted Durable Object limit here keeps repeated UI tests from locking
    // the operator out; deployed HTTPS requests always use the limiter.
    if (isLocalRequest(request)) return true;
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const id = env.RATE_LIMITER.idFromName(`${scope}:${ip}`);
    const response = await env.RATE_LIMITER.get(id).fetch('https://rate-limit/check', {
        method: 'POST',
        body: JSON.stringify({ limit, windowSeconds })
    });
    return response.ok;
}

function cleanText(value, maxLength) {
    return String(value || '').trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, maxLength);
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function cleanNumber(value, fallback, minimum, maximum) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(Math.max(number, minimum), maximum);
}

function cleanBoolean(value, fallback) {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1' || value === 1) return true;
    if (value === 'false' || value === '0' || value === 0) return false;
    return fallback;
}

function normalizeCustomerReviews(value) {
    if (!Array.isArray(value)) return [];

    return value
        .map(review => ({
            author: cleanText(review?.author, 90),
            rating: Math.round(cleanNumber(review?.rating, 0, 0, 5)),
            text: cleanText(review?.text, 700),
            published: cleanText(review?.published, 80)
        }))
        .filter(review => review.author && review.rating > 0 && review.text)
        .slice(0, 8);
}

function cleanUrl(value, fallback, allowedHosts = []) {
    const candidate = cleanText(value, 1000);
    if (!candidate) return fallback;

    try {
        const url = new URL(candidate);
        if (url.protocol !== 'https:') return fallback;
        if (allowedHosts.length && !allowedHosts.includes(url.hostname)) return fallback;
        return url.toString();
    } catch {
        return fallback;
    }
}

function normalizeTierList(value, fallback, maximumLength = 144) {
    if (!Array.isArray(value) || value.length !== fallback.length) {
        return clone(fallback);
    }

    return fallback.map((tier, index) => ({
        length: cleanNumber(value[index]?.length, tier.length, 1, maximumLength),
        price: Math.round(cleanNumber(value[index]?.price, tier.price, 1, 1000000))
    }));
}

function normalizeSiteImages(images = {}) {
    if (!images || typeof images !== 'object' || Array.isArray(images)) return {};
    const normalized = {};

    Object.entries(images).forEach(([slot, image]) => {
        if (!SITE_IMAGE_SLOTS.has(slot) || !image || typeof image !== 'object') return;
        const url = cleanUrl(image.url, '', ['res.cloudinary.com']);
        if (!url) return;
        normalized[slot] = {
            url,
            alt: cleanText(image.alt, 160)
        };
    });

    return normalized;
}

function normalizeSiteConfiguration(value = {}) {
    const defaults = {
        business: clone(DEFAULT_BUSINESS_CONFIG),
        materials: clone(DEFAULT_MATERIALS),
        images: {},
        reviews: []
    };
    const business = value.business || {};
    const materials = value.materials || {};
    const textil = materials.textil || {};
    const uv = materials.uv || {};
    const stickers = materials.stickers || {};
    const defaultUv = defaults.materials.uv.widths;
    const defaultStickerMaterials = defaults.materials.stickers.materials;

    return {
        business: {
            ...defaults.business,
            name: cleanText(business.name, 80) || defaults.business.name,
            whatsappNumber: cleanText(business.whatsappNumber, 20).replace(/\D/g, '') || defaults.business.whatsappNumber,
            phoneDisplay: cleanText(business.phoneDisplay, 40) || defaults.business.phoneDisplay,
            phoneHref: cleanText(business.phoneHref, 20).replace(/[^+\d]/g, '') || defaults.business.phoneHref,
            email: cleanText(business.email, 254).toLowerCase() || defaults.business.email,
            address: cleanText(business.address, 300) || defaults.business.address,
            mapsUrl: cleanUrl(business.mapsUrl, defaults.business.mapsUrl, ['www.google.com', 'maps.google.com']),
            deliveryEstimate: cleanText(business.deliveryEstimate, 120) || defaults.business.deliveryEstimate,
            paymentMethods: cleanText(business.paymentMethods, 160) || defaults.business.paymentMethods,
            estimateNotice: cleanText(business.estimateNotice, 300) || defaults.business.estimateNotice,
            maxUploadSizeMb: Math.round(cleanNumber(business.maxUploadSizeMb, defaults.business.maxUploadSizeMb, 1, 10)),
            quoteFileExtensions: clone(defaults.business.quoteFileExtensions),
            stickerQuoteFileExtensions: clone(defaults.business.stickerQuoteFileExtensions),
            secureApiBaseUrl: ''
        },
        materials: {
            textil: {
                ...defaults.materials.textil,
                width: cleanNumber(textil.width, defaults.materials.textil.width, 1, 60),
                label: cleanText(textil.label, 80) || defaults.materials.textil.label,
                displayName: cleanText(textil.displayName, 80) || defaults.materials.textil.displayName,
                tiers: normalizeTierList(textil.tiers, defaults.materials.textil.tiers)
            },
            uv: {
                ...defaults.materials.uv,
                label: cleanText(uv.label, 80) || defaults.materials.uv.label,
                widths: Object.fromEntries(Object.entries(defaultUv).map(([width, defaultWidth]) => {
                    const inputWidth = uv.widths?.[width] || {};
                    return [width, {
                        label: cleanText(inputWidth.label, 80) || defaultWidth.label,
                        enabled: cleanBoolean(inputWidth.enabled, defaultWidth.enabled),
                        tiers: normalizeTierList(inputWidth.tiers, defaultWidth.tiers)
                    }];
                }))
            },
            stickers: {
                ...defaults.materials.stickers,
                rollWidth: cleanNumber(stickers.rollWidth, defaults.materials.stickers.rollWidth, 1, 120),
                separation: cleanNumber(stickers.separation, defaults.materials.stickers.separation, 0, 2),
                minQuantity: Math.round(cleanNumber(stickers.minQuantity, defaults.materials.stickers.minQuantity, 1, 100000)),
                minTotal: Math.round(cleanNumber(stickers.minTotal, defaults.materials.stickers.minTotal, 1, 1000000)),
                displayName: cleanText(stickers.displayName, 80) || defaults.materials.stickers.displayName,
                materials: Object.fromEntries(Object.entries(defaultStickerMaterials).map(([key, defaultMaterial]) => {
                    const inputMaterial = stickers.materials?.[key] || {};
                    return [key, {
                        label: cleanText(inputMaterial.label, 80) || defaultMaterial.label,
                        pricePerSqFt: cleanNumber(inputMaterial.pricePerSqFt, defaultMaterial.pricePerSqFt, 1, 100000)
                    }];
                })),
                autoDiscount: {
                    quantityStep: Math.round(cleanNumber(stickers.autoDiscount?.quantityStep, defaults.materials.stickers.autoDiscount.quantityStep, 1, 100000)),
                    increment: cleanNumber(stickers.autoDiscount?.increment, defaults.materials.stickers.autoDiscount.increment, 0, 0.5),
                    maxRate: cleanNumber(stickers.autoDiscount?.maxRate, defaults.materials.stickers.autoDiscount.maxRate, 0, 0.8)
                }
            }
        },
        images: normalizeSiteImages(value.images),
        reviews: normalizeCustomerReviews(value.reviews)
    };
}

function normalizePhone(value) {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
}

function isValidDominicanPhone(value) {
    return /^8(?:09|29|49)\d{7}$/.test(normalizePhone(value));
}

function formatDop(value) {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 0
    }).format(value);
}

function normalizeOrderItem(item, materials = DEFAULT_MATERIALS) {
    if (!item || typeof item !== 'object') return null;
    const materialKey = cleanText(item.materialKey, 20);
    const quantity = Math.floor(Number(item.quantity));
    const width = Number(item.width);
    const height = Number(item.height);

    if (!['textil', 'uv', 'stickers'].includes(materialKey) || !Number.isFinite(quantity) || quantity < 1 || quantity > 1000000 || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || width > 200 || height > 10000) {
        return null;
    }

    const quote = buildQuoteFromInput({
        materialKey,
        height,
        quantity,
        uvWidth: width,
        stickerMaterial: cleanText(item.stickerMaterialKey, 30) || 'white',
        stickerWidth: width,
        stickerHeight: height
    }, materials);

    return quote.invalid ? null : quote;
}

function buildOrderMessage({ orderId, customer, fulfillment, items }) {
    const subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const lines = items.map((item, index) => {
        const quantityLabel = item.materialKey === 'stickers'
            ? `${item.quantity} stickers`
            : `${item.quantity} ${item.quantity === 1 ? 'copia' : 'copias'}`;

        return `${index + 1}. ${item.material} - ${item.size} - ${quantityLabel} - ${formatDop(item.total)}\nArchivo: ${item.fileName}\nDescarga temporal: ${item.fileUrl}`;
    });

    return `ORDEN MADE ACRÍLICO - ${orderId}

CLIENTE
${customer.name}
WhatsApp: ${customer.phone}

ENTREGA
Tipo: ${fulfillment === 'shipping' ? 'Envío' : 'Retiro en tienda'}
${fulfillment === 'shipping' ? `Dirección: ${customer.address}` : ''}
${customer.notes ? `Nota: ${customer.notes}` : ''}

RESUMEN
Subtotal productos: ${formatDop(subtotal)}
Impuestos / ITBIS: Se confirma tras revisión
Envío: ${fulfillment === 'shipping' ? 'A cotizar' : 'No incluido'}
Total estimado inicial: ${formatDop(subtotal)}
Estado: Pendiente de revisar archivo, entrega, impuestos y pago antes de producir

PRODUCTOS

${lines.join('\n\n')}`;
}

function hasOrdersDatabase(env) {
    return Boolean(env.ORDERS_DB?.prepare);
}

async function getSiteConfiguration(env) {
    const row = await env.ORDERS_DB
        .prepare('SELECT setting_value FROM site_settings WHERE setting_key = ?')
        .bind('public_configuration')
        .first();

    if (!row?.setting_value) return normalizeSiteConfiguration();

    try {
        return normalizeSiteConfiguration(JSON.parse(row.setting_value));
    } catch {
        return normalizeSiteConfiguration();
    }
}

async function saveSiteConfiguration(env, configuration, detail) {
    const updatedAt = new Date().toISOString();
    await env.ORDERS_DB.batch([
        env.ORDERS_DB
            .prepare(`INSERT INTO site_settings (setting_key, setting_value, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = excluded.updated_at`)
            .bind('public_configuration', JSON.stringify(configuration), updatedAt),
        env.ORDERS_DB
            .prepare('INSERT INTO site_events (event_type, detail, created_at) VALUES (?, ?, ?)')
            .bind('site_configuration_updated', detail, updatedAt)
    ]);
}

function hasCloudinaryUpload(env) {
    return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_UPLOAD_PRESET);
}

function isCloudinaryAssetUrl(value, cloudName) {
    try {
        const url = new URL(String(value || ''));
        return url.protocol === 'https:'
            && url.hostname === 'res.cloudinary.com'
            && url.pathname.startsWith(`/${encodeURIComponent(cloudName)}/`);
    } catch {
        return false;
    }
}

function getSafeContentType(file, extension) {
    const types = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        jpe: 'image/jpeg',
        webp: 'image/webp',
        tif: 'image/tiff',
        tiff: 'image/tiff',
        pdf: 'application/pdf',
        ai: 'application/pdf',
        psd: 'image/vnd.adobe.photoshop'
    };

    return types[extension] || file.type || 'application/octet-stream';
}

function getSafeFileName(fileName, extension) {
    const baseName = cleanText(fileName, 180)
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^[-.]+|[-.]+$/g, '')
        .slice(0, 160);
    return baseName || `archivo.${extension}`;
}

function getCookie(request, name) {
    const encodedName = `${name}=`;
    return String(request.headers.get('Cookie') || '')
        .split(';')
        .map(value => value.trim())
        .find(value => value.startsWith(encodedName))
        ?.slice(encodedName.length) || '';
}

function isLocalRequest(request) {
    const url = new URL(request.url);
    if (url.protocol === 'http:') return true;
    const hostname = url.hostname;
    return hostname === 'localhost'
        || hostname === '127.0.0.1'
        || hostname === '0.0.0.0'
        || /^192\.168\./.test(hostname)
        || /^10\./.test(hostname)
        || /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
}

function adminSessionCookie(token, request, expire = false) {
    const attributes = [
        'Path=/api/admin',
        'HttpOnly',
        'SameSite=Strict',
        isLocalRequest(request) ? '' : 'Secure'
    ].filter(Boolean).join('; ');

    const expiration = expire
        ? '; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
        : '';

    return `made_acrilico_admin=${token}; ${attributes}${expiration}`;
}

async function getAdminCredential(env) {
    if (!env.ORDERS_DB) return null;

    return env.ORDERS_DB
        .prepare('SELECT password_hash, salt, updated_at FROM admin_credentials WHERE id = 1')
        .first();
}

async function createAdminSession(secret, passwordUpdatedAt = '') {
    return createAssetToken({
        purpose: 'admin_session',
        expiresAt: Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000,
        nonce: crypto.randomUUID(),
        passwordUpdatedAt
    }, secret);
}

async function verifyAdminSession(request, env) {
    if (!env.ADMIN_SESSION_SECRET) return false;

    const session = await verifyAssetToken(
        getCookie(request, 'made_acrilico_admin'),
        env.ADMIN_SESSION_SECRET
    );

    if (session?.purpose !== 'admin_session') return false;

    const credential = await getAdminCredential(env);

    if (!credential?.updated_at) return true;

    return session.passwordUpdatedAt === credential.updated_at;
}

async function verifyAdminPassword(password, env) {
    const credential = await getAdminCredential(env);

    if (credential?.password_hash && credential.salt) {
        const hash = await hashAdminPassword(password, credential.salt);
        return constantTimeEqual(hash, credential.password_hash);
    }

    return Boolean(env.ADMIN_PASSWORD)
        && constantTimeEqual(password, String(env.ADMIN_PASSWORD));
}

async function handleAdminLogin(request, env) {
    if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) {
        return json(request, env, 503, { success: false, message: 'El acceso interno aún no está configurado.' });
    }
    if (!await enforceRateLimit(request, env, 'admin-login', ADMIN_LOGIN_LIMIT, ADMIN_LOGIN_WINDOW_SECONDS)) {
        return json(request, env, 429, { success: false, message: 'Demasiados intentos. Espera 15 minutos.' });
    }
    const body = await request.json().catch(() => ({}));
    const password = String(body.password || '');
    if (!await verifyAdminPassword(password, env)) {
        return json(request, env, 401, { success: false, message: 'Credenciales inválidas.' });
    }
    return new Response(JSON.stringify({ success: true }), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'Set-Cookie': adminSessionCookie(
                await createAdminSession(env.ADMIN_SESSION_SECRET, (await getAdminCredential(env))?.updated_at || ''),
                request
            ),
            ...corsHeaders(request, env)
        }
    });
}

async function handleAdminPasswordUpdate(request, env) {
    const body = await request.json().catch(() => null);
    const currentPassword = String(body?.currentPassword || '');
    const nextPassword = String(body?.nextPassword || '');

    if (nextPassword.length < 16 || nextPassword.length > 200) {
        return json(request, env, 400, { success: false, message: 'La nueva contraseña debe tener entre 16 y 200 caracteres.' });
    }
    if (!await verifyAdminPassword(currentPassword, env)) {
        return json(request, env, 401, { success: false, message: 'La contraseña actual no es correcta.' });
    }

    const salt = createPasswordSalt();
    const hash = await hashAdminPassword(nextPassword, salt);
    await env.ORDERS_DB
        .prepare(`INSERT INTO admin_credentials (id, password_hash, salt, updated_at)
            VALUES (1, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET password_hash = excluded.password_hash, salt = excluded.salt, updated_at = excluded.updated_at`)
        .bind(hash, salt, new Date().toISOString())
        .run();

    return new Response(JSON.stringify({ success: true }), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'Set-Cookie': adminSessionCookie('', request, true),
            ...corsHeaders(request, env)
        }
    });
}

function handleAdminLogout(request, env) {
    return new Response(JSON.stringify({ success: true }), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'Set-Cookie': adminSessionCookie('', request, true),
            ...corsHeaders(request, env)
        }
    });
}

function parseStoredItems(itemsJson) {
    try {
        const items = JSON.parse(itemsJson);
        return Array.isArray(items) ? items : [];
    } catch {
        return [];
    }
}

function canTransitionOrderStatus(from, to) {
    if (from === to) return true;
    if (from === 'completed' || from === 'cancelled') return false;
    if (to === 'cancelled') return true;

    const allowedTransitions = {
        pending_review: ['in_review', 'approved'],
        pending_notification: ['pending_review', 'in_review', 'approved'],
        in_review: ['pending_review', 'approved'],
        approved: ['in_review', 'in_production'],
        in_production: ['approved', 'ready'],
        ready: ['in_production', 'completed']
    };

    return allowedTransitions[from]?.includes(to) || false;
}

async function getStoredOrder(env, orderId) {
    return env.ORDERS_DB
        .prepare('SELECT id, status, email_status FROM orders WHERE id = ?')
        .bind(orderId)
        .first();
}

async function addOrderEvent(env, orderId, eventType, detail = '') {
    await env.ORDERS_DB
        .prepare(
            'INSERT INTO order_events (order_id, event_type, detail, created_at) VALUES (?, ?, ?, ?)'
        )
        .bind(orderId, eventType, detail, new Date().toISOString())
        .run();
}

async function createStoredOrder(env, order) {
    const result = await env.ORDERS_DB
        .prepare(
            `INSERT OR IGNORE INTO orders (
                id, status, email_status, customer_name, customer_phone,
                fulfillment, customer_address, customer_notes, subtotal_dop,
                items_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
            order.id,
            'pending_review',
            'pending',
            order.customer.name,
            order.customer.phone,
            order.fulfillment,
            order.customer.address,
            order.customer.notes,
            order.total,
            JSON.stringify(order.items),
            order.createdAt,
            order.createdAt
        )
        .run();

    if (result.meta?.changes !== 1) return false;

    await addOrderEvent(env, order.id, 'created', 'Orden recibida desde el sitio web.');
    return true;
}

async function updateOrderEmailStatus(env, orderId, { status, emailStatus, detail = '' }) {
    const updatedAt = new Date().toISOString();
    await env.ORDERS_DB
        .prepare(
            'UPDATE orders SET status = ?, email_status = ?, updated_at = ? WHERE id = ?'
        )
        .bind(status, emailStatus, updatedAt, orderId)
        .run();
    await addOrderEvent(env, orderId, emailStatus, detail);
}

async function deliverOrderEmail(env, order) {
    if (!env.WEB3FORMS_ACCESS_KEY) return false;

    const form = new FormData();
    form.append('access_key', env.WEB3FORMS_ACCESS_KEY);
    form.append('subject', `Nueva solicitud MADE ACRÍLICO ${order.id} - ${order.customer.name} - ${formatDop(order.total)}`);
    form.append('from_name', 'MADE ACRÍLICO Web');
    form.append('message', buildOrderMessage({
        orderId: order.id,
        customer: order.customer,
        fulfillment: order.fulfillment,
        items: order.items
    }));

    const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: form
    });
    const result = await response.json().catch(() => ({}));
    return Boolean(response.ok && result.success);
}

async function handleUpload(request, env) {
    const contentType = request.headers.get('Content-Type') || '';
    if (!/^multipart\/form-data(?:;|$)/i.test(contentType)) {
        return json(request, env, 415, { success: false, message: 'La carga debe enviarse como formulario multipart.' });
    }

    if (!hasCloudinaryUpload(env)) {
        return json(request, env, 503, { success: false, message: 'El almacenamiento de archivos no está disponible. Intenta nuevamente en unos minutos.' });
    }
    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (contentLength > MAX_UPLOAD_BYTES + 1024 * 128) {
        return json(request, env, 413, { success: false, message: 'El archivo supera 10 MB.' });
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) {
        return json(request, env, 400, { success: false, message: 'No se pudo leer el formulario de carga.' });
    }
    const file = formData.get('file');
    const material = cleanText(formData.get('material'), 20);

    if (!(file instanceof File) || !['textil', 'uv', 'stickers'].includes(material)) {
        return json(request, env, 400, { success: false, message: 'Archivo o material inválido.' });
    }

    const extension = getFileExtension(file.name);
    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES || !getAllowedExtensions(material).includes(extension)) {
        return json(request, env, 400, { success: false, message: 'El archivo no cumple los formatos o el tamaño permitido.' });
    }

    const bytes = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
    const signatureName = SIGNATURE_ALIASES[extension] || extension;
    if (!FILE_SIGNATURES[signatureName]?.(bytes)) {
        return json(request, env, 400, { success: false, message: 'El contenido del archivo no coincide con su extensión.' });
    }

    const uploadForm = new FormData();
    uploadForm.append('file', file, getSafeFileName(file.name, extension));
    uploadForm.append('upload_preset', env.CLOUDINARY_UPLOAD_PRESET);
    uploadForm.append('folder', 'made-acrilico/orders');

    let uploaded;
    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/auto/upload`,
            {
                method: 'POST',
                body: uploadForm
            }
        );
        uploaded = await response.json().catch(() => ({}));
        if (!response.ok || !uploaded.secure_url || !isCloudinaryAssetUrl(uploaded.secure_url, env.CLOUDINARY_CLOUD_NAME)) {
            throw new Error('Cloudinary rejected the upload.');
        }
    } catch {
        return json(request, env, 502, { success: false, message: 'No se pudo guardar el archivo. Intenta nuevamente.' });
    }

    const asset = {
        url: uploaded.secure_url,
        publicId: cleanText(uploaded.public_id, 255),
        fileName: cleanText(file.name, 180),
        contentType: getSafeContentType(file, extension),
        material,
        expiresAt: Date.now() + ASSET_TOKEN_TTL_SECONDS * 1000
    };

    return json(request, env, 201, {
        success: true,
        assetToken: await createAssetToken(asset, env.ASSET_TOKEN_SECRET)
    });
}

async function handlePublicSiteConfiguration(request, env) {
    if (!hasOrdersDatabase(env)) {
        return json(request, env, 503, { success: false, message: 'La configuración pública no está disponible.' });
    }

    return json(request, env, 200, {
        success: true,
        config: await getSiteConfiguration(env)
    });
}

async function handleAdminSiteConfiguration(request, env) {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
        return json(request, env, 400, { success: false, message: 'Configuración inválida.' });
    }

    const existing = await getSiteConfiguration(env);
    const configuration = normalizeSiteConfiguration({
        ...body,
        images: existing.images,
        reviews: body.reviews
    });
    await saveSiteConfiguration(env, configuration, 'Datos comerciales y reglas de cotización actualizados desde el panel.');

    return json(request, env, 200, { success: true, config: configuration });
}

async function uploadAdminSiteImage(file, env) {
    const extension = getFileExtension(file.name);
    if (!['png', 'jpg', 'jpeg', 'jpe', 'webp'].includes(extension)
        || file.size <= 0
        || file.size > MAX_SITE_IMAGE_BYTES) {
        return null;
    }

    const bytes = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
    const signatureName = SIGNATURE_ALIASES[extension] || extension;
    if (!FILE_SIGNATURES[signatureName]?.(bytes)) return null;

    const form = new FormData();
    form.append('file', file, getSafeFileName(file.name, extension));
    form.append('upload_preset', env.CLOUDINARY_UPLOAD_PRESET);
    form.append('folder', 'made-acrilico/site');

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/image/upload`,
        { method: 'POST', body: form }
    );
    const uploaded = await response.json().catch(() => ({}));
    return response.ok && isCloudinaryAssetUrl(uploaded.secure_url, env.CLOUDINARY_CLOUD_NAME)
        ? uploaded.secure_url
        : null;
}

async function handleAdminSiteImageUpload(request, env) {
    if (!hasCloudinaryUpload(env)) {
        return json(request, env, 503, { success: false, message: 'El almacenamiento de imágenes no está disponible.' });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const slot = cleanText(formData.get('slot'), 50);
    const alt = cleanText(formData.get('alt'), 160);

    if (!(file instanceof File) || !SITE_IMAGE_SLOTS.has(slot)) {
        return json(request, env, 400, { success: false, message: 'Imagen o espacio de imagen inválido.' });
    }

    let url;
    try {
        url = await uploadAdminSiteImage(file, env);
    } catch {
        url = null;
    }

    if (!url) {
        return json(request, env, 400, { success: false, message: 'La imagen debe ser PNG, JPG o WEBP y pesar hasta 8 MB.' });
    }

    const configuration = await getSiteConfiguration(env);
    configuration.images[slot] = { url, alt };
    await saveSiteConfiguration(env, configuration, `Imagen actualizada: ${slot}.`);

    return json(request, env, 201, {
        success: true,
        image: configuration.images[slot]
    });
}

async function handleAdminSiteImageReset(request, env, slot) {
    if (!SITE_IMAGE_SLOTS.has(slot)) {
        return json(request, env, 404, { success: false, message: 'Espacio de imagen no encontrado.' });
    }

    const configuration = await getSiteConfiguration(env);
    delete configuration.images[slot];
    await saveSiteConfiguration(env, configuration, `Imagen restaurada al valor local: ${slot}.`);
    return json(request, env, 200, { success: true });
}

async function handleOrder(request, env) {
    let body;
    try {
        body = await request.json();
    } catch {
        return json(request, env, 400, { success: false, message: 'El cuerpo de la orden debe ser JSON válido.' });
    }
    if (!body || typeof body !== 'object' || !Array.isArray(body.items) || body.items.length === 0 || body.items.length > MAX_ORDER_ITEMS) {
        return json(request, env, 400, { success: false, message: 'La orden no tiene productos válidos.' });
    }

    const customer = {
        name: cleanText(body.customer?.name, 100),
        phone: cleanText(body.customer?.phone, 20),
        address: cleanText(body.customer?.address, 300),
        notes: cleanText(body.customer?.notes, 1000)
    };
    const fulfillment = body.fulfillment === 'shipping' ? 'shipping' : 'pickup';
    const orderId = cleanText(body.orderId, 64);

    if (!/^MA-\d{8}-\d{6}-[A-Z0-9]{6}$/.test(orderId) || !customer.name || !isValidDominicanPhone(customer.phone) || (fulfillment === 'shipping' && !customer.address)) {
        return json(request, env, 400, { success: false, message: 'Revisa los datos de la orden antes de enviarla.' });
    }

    if (!hasOrdersDatabase(env)) {
        return json(request, env, 503, { success: false, message: 'El registro de órdenes no está disponible. Intenta nuevamente en unos minutos.' });
    }

    const existingOrder = await getStoredOrder(env, orderId);
    if (existingOrder) {
        return json(request, env, 200, {
            success: true,
            orderId,
            duplicate: true,
            emailSent: existingOrder.email_status === 'sent'
        });
    }

    const siteConfiguration = await getSiteConfiguration(env);
    const items = [];
    for (const rawItem of body.items) {
        const quote = normalizeOrderItem(rawItem, siteConfiguration.materials);
        const asset = await verifyAssetToken(rawItem?.fileToken, env.ASSET_TOKEN_SECRET);
        if (!quote || !asset || asset.material !== quote.materialKey || !isCloudinaryAssetUrl(asset.url, env.CLOUDINARY_CLOUD_NAME)) {
            return json(request, env, 400, { success: false, message: 'Uno de los archivos no es válido o venció. Súbelo nuevamente.' });
        }

        items.push({
            ...quote,
            fileName: asset.fileName || cleanText(rawItem.fileName, 255) || 'Archivo sin nombre',
            fileUrl: asset.url
        });
    }

    const order = {
        id: orderId,
        customer,
        fulfillment,
        items,
        total: items.reduce((sum, item) => sum + Number(item.total || 0), 0),
        createdAt: new Date().toISOString()
    };

    const saved = await createStoredOrder(env, order);
    if (!saved) {
        const duplicate = await getStoredOrder(env, orderId);
        return json(request, env, 200, {
            success: true,
            orderId,
            duplicate: true,
            emailSent: duplicate?.email_status === 'sent'
        });
    }

    let emailSent = false;

    try {
        emailSent = await deliverOrderEmail(env, order);
    } catch (error) {
        logWorkerError(request, 'order_email_delivery', error);
        emailSent = false;
    }
    await updateOrderEmailStatus(env, order.id, {
        status: emailSent ? 'pending_review' : 'pending_notification',
        emailStatus: emailSent ? 'sent' : 'failed',
        detail: emailSent
            ? 'Correo de revisión enviado.'
            : 'La orden fue guardada; el correo requiere seguimiento manual.'
    });

    return json(request, env, emailSent ? 201 : 202, {
        success: true,
        orderId,
        emailSent
    });
}

function serializeOrder(row, includeItems = false) {
    return {
        id: row.id,
        status: row.status,
        emailStatus: row.email_status,
        paymentStatus: row.payment_status || 'pending',
        paymentNote: row.payment_note || '',
        customer: {
            name: row.customer_name,
            phone: row.customer_phone,
            address: row.customer_address,
            notes: row.customer_notes
        },
        fulfillment: row.fulfillment,
        subtotal: Number(row.subtotal_dop || 0),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        ...(includeItems ? { items: parseStoredItems(row.items_json) } : {})
    };
}

async function handleAdminOrders(request, env, url) {
    const page = parseInteger(url.searchParams.get('page'), 1, 1, 1000000);
    const limit = parseInteger(url.searchParams.get('limit'), ADMIN_PAGE_SIZE, 1, ADMIN_MAX_PAGE_SIZE);
    const status = cleanText(url.searchParams.get('status'), 40);
    const search = cleanText(url.searchParams.get('q'), 100);

    if (status && !ORDER_STATUSES.has(status)) {
        return json(request, env, 400, { success: false, message: 'Estado de orden inválido.' });
    }

    const offset = (page - 1) * limit;
    const searchPattern = `%${search.replace(/[%_\\]/g, '\\$&')}%`;
    const where = `WHERE (? = '' OR status = ?) AND (? = '' OR id LIKE ? ESCAPE '\\' OR customer_name LIKE ? ESCAPE '\\' OR customer_phone LIKE ? ESCAPE '\\')`;
    const bindings = [status, status, search, searchPattern, searchPattern, searchPattern];

    const [count, rows] = await env.ORDERS_DB.batch([
        env.ORDERS_DB
            .prepare(`SELECT COUNT(*) AS total FROM orders ${where}`)
            .bind(...bindings),
        env.ORDERS_DB
            .prepare(`SELECT id, status, email_status, payment_status, payment_note, customer_name, customer_phone, fulfillment, subtotal_dop, created_at, updated_at FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
            .bind(...bindings, limit, offset)
    ]);

    return json(request, env, 200, {
        success: true,
        page,
        limit,
        total: Number(count.results?.[0]?.total || 0),
        orders: (rows.results || []).map(row => serializeOrder(row))
    });
}

async function handleAdminOrderDetail(request, env, orderId) {
    const [orderResult, eventsResult] = await env.ORDERS_DB.batch([
        env.ORDERS_DB
            .prepare('SELECT * FROM orders WHERE id = ?')
            .bind(orderId),
        env.ORDERS_DB
            .prepare('SELECT event_type, detail, created_at FROM order_events WHERE order_id = ? ORDER BY id DESC')
            .bind(orderId)
    ]);
    const order = orderResult.results?.[0];

    if (!order) {
        return json(request, env, 404, { success: false, message: 'Orden no encontrada.' });
    }

    return json(request, env, 200, {
        success: true,
        order: serializeOrder(order, true),
        events: eventsResult.results || []
    });
}

async function handleAdminOrderUpdate(request, env, orderId, adminEmail) {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
        return json(request, env, 400, { success: false, message: 'Actualización inválida.' });
    }

    const existing = await env.ORDERS_DB
        .prepare('SELECT id, status, payment_status, payment_note FROM orders WHERE id = ?')
        .bind(orderId)
        .first();

    if (!existing) {
        return json(request, env, 404, { success: false, message: 'Orden no encontrada.' });
    }

    const nextStatus = body.status === undefined
        ? existing.status
        : cleanText(body.status, 40);
    const nextPaymentStatus = body.paymentStatus === undefined
        ? existing.payment_status
        : cleanText(body.paymentStatus, 40);
    const nextPaymentNote = body.paymentNote === undefined
        ? existing.payment_note
        : cleanText(body.paymentNote, 300);

    if (!ORDER_STATUSES.has(nextStatus) || !PAYMENT_STATUSES.has(nextPaymentStatus)) {
        return json(request, env, 400, { success: false, message: 'Estado de orden o pago inválido.' });
    }

    if (!canTransitionOrderStatus(existing.status, nextStatus)) {
        return json(request, env, 409, { success: false, message: 'La transición de estado no está permitida.' });
    }

    if (existing.status === nextStatus
        && existing.payment_status === nextPaymentStatus
        && existing.payment_note === nextPaymentNote) {
        return json(request, env, 200, { success: true, unchanged: true });
    }

    const updatedAt = new Date().toISOString();
    await env.ORDERS_DB
        .prepare('UPDATE orders SET status = ?, payment_status = ?, payment_note = ?, updated_at = ? WHERE id = ?')
        .bind(nextStatus, nextPaymentStatus, nextPaymentNote, updatedAt, orderId)
        .run();

    const changes = [];
    if (existing.status !== nextStatus) changes.push(`Estado: ${existing.status} -> ${nextStatus}`);
    if (existing.payment_status !== nextPaymentStatus) changes.push(`Pago: ${existing.payment_status} -> ${nextPaymentStatus}`);
    if (existing.payment_note !== nextPaymentNote) changes.push('Nota de pago actualizada');
    await addOrderEvent(env, orderId, 'admin_update', `${changes.join('. ')}. Actualizado por ${adminEmail}.`);

    return json(request, env, 200, { success: true });
}

async function handleAdminMetrics(request, env) {
    const [totals, statuses, materials] = await env.ORDERS_DB.batch([
        env.ORDERS_DB.prepare(`SELECT
            COUNT(*) AS total_orders,
            COALESCE(SUM(subtotal_dop), 0) AS total_estimated,
            SUM(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) AS last_30_days
            FROM orders`),
        env.ORDERS_DB.prepare('SELECT status, COUNT(*) AS total FROM orders GROUP BY status'),
        env.ORDERS_DB.prepare(`SELECT
            COALESCE(json_extract(item.value, '$.material'), 'Sin material') AS material,
            COUNT(*) AS total
            FROM orders, json_each(orders.items_json) AS item
            GROUP BY material
            ORDER BY total DESC
            LIMIT 6`)
    ]);

    return json(request, env, 200, {
        success: true,
        totals: totals.results?.[0] || {},
        byStatus: statuses.results || [],
        byMaterial: materials.results || []
    });
}

export class RateLimiter {
    constructor(state) {
        this.state = state;
    }

    async fetch(request) {
        const { limit, windowSeconds } = await request.json();
        const now = Date.now();
        const cutoff = now - Number(windowSeconds) * 1000;
        const entries = (await this.state.storage.get('entries') || []).filter(timestamp => timestamp > cutoff);

        if (entries.length >= Number(limit)) {
            return new Response(null, { status: 429 });
        }

        entries.push(now);
        await this.state.storage.put('entries', entries);
        return new Response(null, { status: 204 });
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: isAllowedOrigin(request, env) ? 204 : 403, headers: corsHeaders(request, env) });
        }

        if (url.pathname.startsWith('/api/admin/')) {
            if (!isAllowedOrigin(request, env)) {
                return json(request, env, 403, { success: false, message: 'Origen no autorizado.' });
            }

            if (request.method === 'POST' && url.pathname === '/api/admin/login') {
                return await handleAdminLogin(request, env);
            }

            if (request.method === 'POST' && url.pathname === '/api/admin/logout') {
                return handleAdminLogout(request, env);
            }

            if (!hasOrdersDatabase(env)) {
                return json(request, env, 503, { success: false, message: 'El registro de órdenes no está disponible.' });
            }

            if (!await verifyAdminSession(request, env)) {
                return json(request, env, 401, { success: false, message: 'Acceso interno no autorizado.' });
            }

            try {
                if (request.method === 'GET' && url.pathname === '/api/admin/orders') {
                    return await handleAdminOrders(request, env, url);
                }
                if (request.method === 'GET' && url.pathname === '/api/admin/metrics') {
                    return await handleAdminMetrics(request, env);
                }
                if (request.method === 'GET' && url.pathname === '/api/admin/site-config') {
                    return json(request, env, 200, {
                        success: true,
                        config: await getSiteConfiguration(env)
                    });
                }
                if (request.method === 'PUT' && url.pathname === '/api/admin/site-config') {
                    return await handleAdminSiteConfiguration(request, env);
                }
                if (request.method === 'POST' && url.pathname === '/api/admin/site-images') {
                    return await handleAdminSiteImageUpload(request, env);
                }
                if (request.method === 'PATCH' && url.pathname === '/api/admin/password') {
                    return await handleAdminPasswordUpdate(request, env);
                }

                const siteImageMatch = url.pathname.match(/^\/api\/admin\/site-images\/(brand-logo|home-textil|home-uv|home-stickers|store-badge|store-sublimation|store-uv|store-textil)$/);
                if (siteImageMatch && request.method === 'DELETE') {
                    return await handleAdminSiteImageReset(request, env, siteImageMatch[1]);
                }

                const detailMatch = url.pathname.match(/^\/api\/admin\/orders\/(MA-\d{8}-\d{6}-[A-Z0-9]{6})$/);
                if (detailMatch && request.method === 'GET') {
                    return await handleAdminOrderDetail(request, env, detailMatch[1]);
                }
                if (detailMatch && request.method === 'PATCH') {
                    return await handleAdminOrderUpdate(request, env, detailMatch[1], 'Panel interno');
                }

                return json(request, env, 405, { success: false, message: 'Método o ruta interna no permitidos.' });
            } catch (error) {
                logWorkerError(request, 'admin_request', error);
                return json(request, env, 500, { success: false, message: 'No se pudo procesar la operación interna.' });
            }
        }

        if (!isAllowedOrigin(request, env)) {
            return json(request, env, 403, { success: false, message: 'Origen no autorizado.' });
        }

        if (request.method === 'GET' && url.pathname === '/api/site-config') {
            return await handlePublicSiteConfiguration(request, env);
        }

        if (request.method !== 'POST') {
            return json(request, env, 405, { success: false, message: 'Método no permitido.' });
        }

        try {
            if (url.pathname === '/api/uploads') {
                if (!await enforceRateLimit(request, env, 'upload', UPLOAD_LIMIT, UPLOAD_WINDOW_SECONDS)) {
                    return json(request, env, 429, { success: false, message: 'Demasiados intentos. Espera unos minutos.' });
                }
                return await handleUpload(request, env);
            }

            if (url.pathname === '/api/orders') {
                if (!await enforceRateLimit(request, env, 'order', ORDER_LIMIT, ORDER_WINDOW_SECONDS)) {
                    return json(request, env, 429, { success: false, message: 'Demasiados intentos. Espera unos minutos.' });
                }
                return await handleOrder(request, env);
            }

            return json(request, env, 404, { success: false, message: 'Ruta no encontrada.' });
        } catch (error) {
            logWorkerError(request, 'public_request', error);
            return json(request, env, 500, { success: false, message: 'No se pudo procesar la solicitud. Intenta nuevamente.' });
        }
    }
};

export {
    adminSessionCookie,
    createAssetToken,
    createAdminSession,
    canTransitionOrderStatus,
    createStoredOrder,
    getAllowedExtensions,
    isCloudinaryAssetUrl,
    normalizeCustomerReviews,
    normalizeOrderItem,
    normalizeSiteConfiguration,
    verifyAdminSession,
    verifyAssetToken
};
