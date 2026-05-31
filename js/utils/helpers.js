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
    if (crypto?.randomUUID) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function saveToStorage(key, value) {
    localStorage.setItem(
        key,
        JSON.stringify(value)
    );
}

export function loadFromStorage(key, fallback = null) {
    const data =
        localStorage.getItem(key);

    if (!data) return fallback;

    try {
        return JSON.parse(data);
    } catch {
        return fallback;
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
