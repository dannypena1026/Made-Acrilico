export function formatCurrency(value) {
    return new Intl.NumberFormat(
        'es-DO',
        {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 0
        }
    ).format(value);
}

export function generateId() {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function saveToStorage(key, value) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );
        return true;
    } catch {
        return false;
    }
}

export function loadFromStorage(key, fallback = null) {
    let data;

    try {
        data = localStorage.getItem(key);
    } catch {
        return fallback;
    }

    if (!data) return fallback;

    try {
        return JSON.parse(data);
    } catch {
        return fallback;
    }
}

export function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch {
        return false;
    }
}

export function escapeHTML(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function getTrustedURL(value, allowedHosts = []) {
    try {
        const hasWindow =
            typeof window !== 'undefined';

        const baseURL =
            hasWindow
                ? window.location.origin
                : 'https://made-acrilico.local';

        const url =
            new URL(
                String(value || ''),
                baseURL
            );

        const isAllowedProtocol =
            url.protocol === 'https:' ||
            (
                hasWindow &&
                url.protocol === 'http:' &&
                url.hostname === window.location.hostname
            );

        if (!isAllowedProtocol) return '';

        if (
            allowedHosts.length > 0 &&
            !allowedHosts.includes(url.hostname)
        ) {
            return '';
        }

        return url.href;
    } catch {
        return '';
    }
}
