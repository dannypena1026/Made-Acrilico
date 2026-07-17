import { applyRuntimeBusinessConfig } from './business-config.js';
import { getSecureApiUrl } from './secure-api.js';

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

let configurationPromise = null;
let runtimeImages = {};
let runtimeConfiguration = null;

export function markSiteConfigurationReady() {
    document.documentElement.dataset.siteConfigReady = 'true';
}

function isTrustedImageUrl(value) {
    try {
        const url = new URL(value, window.location.origin);
        return url.protocol === 'https:'
            && (url.hostname === 'res.cloudinary.com' || url.origin === window.location.origin);
    } catch {
        return false;
    }
}

export function applyRuntimeImages(documentRoot = document) {
    documentRoot.querySelectorAll('[data-site-image]').forEach(image => {
        const slot = image.dataset.siteImage;
        const savedImage = runtimeImages[slot];

        if (!SITE_IMAGE_SLOTS.has(slot) || !savedImage || !isTrustedImageUrl(savedImage.url)) {
            return;
        }

        image.src = savedImage.url;
        if (savedImage.alt) image.alt = savedImage.alt;
    });
}

export function getRuntimeSiteConfiguration() {
    return runtimeConfiguration;
}

export async function loadRuntimeSiteConfiguration() {
    if (!configurationPromise) {
        configurationPromise = (async () => {
            const controller = new AbortController();
            const timeoutId = window.setTimeout(() => controller.abort(), 2500);

            try {
                const response = await fetch(getSecureApiUrl('/api/site-config'), {
                    headers: { Accept: 'application/json' },
                    signal: controller.signal
                });
                const payload = await response.json().catch(() => ({}));

                if (!response.ok || !payload.success || !payload.config) return false;

                runtimeConfiguration = payload.config;
                runtimeImages = payload.config.images && typeof payload.config.images === 'object'
                    ? payload.config.images
                    : {};
                return applyRuntimeBusinessConfig(payload.config);
            } catch {
                return false;
            } finally {
                window.clearTimeout(timeoutId);
            }
        })();
    }

    const loaded = await configurationPromise;
    applyRuntimeImages();
    return loaded;
}
