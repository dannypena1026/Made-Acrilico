import { buildQuoteFromInput } from '../core/pricing-engine.js';
import { generateId } from '../utils/helpers.js';

export function normalizeCartItem(item) {
    if (!item || typeof item !== 'object') return null;

    if (
        ['textil', 'uv', 'stickers'].includes(item.materialKey) &&
        Number.isFinite(Number(item.quantity)) &&
        Number(item.quantity) > 0
    ) {
        const quantity =
            Math.min(1000000, Math.max(1, Math.floor(Number(item.quantity))));

        const quote =
            buildQuoteFromInput({
                materialKey: item.materialKey,
                height: Number(item.height),
                quantity,
                uvWidth: Number(item.width),
                stickerMaterial: item.stickerMaterialKey || 'white',
                stickerWidth: Number(item.width),
                stickerHeight: Number(item.height)
            });

        if (quote.invalid) return null;

        return {
            ...quote,
            id: item.id ? String(item.id) : generateId(),
            fileName: String(item.fileName || 'Sin archivo').slice(0, 255),
            fileType: String(item.fileType || 'N/A').slice(0, 120),
            fileSize: item.fileSize || 'N/A',
            fileToken: String(item.fileToken || '').slice(0, 2048)
        };
    }

    if (item.title && Number.isFinite(item.price) && item.price > 0) {
        return {
            id: item.id ? String(item.id) : generateId(),
            material: String(item.title).slice(0, 120),
            size: String(item.details || 'Medida no especificada').slice(0, 120),
            chargedLength: 0,
            yards: 0,
            quantity: 1,
            unitPrice: item.price,
            fileName: String(item.fileName || 'Sin archivo').slice(0, 255),
            fileType: String(item.fileType || 'N/A').slice(0, 120),
            fileSize: item.fileSize || 'N/A',
            fileToken: String(item.fileToken || '').slice(0, 2048)
        };
    }

    return null;
}

export function getCartItemTotal(item) {
    if (item.materialKey === 'stickers') {
        return item.total || (item.unitPrice * item.quantity);
    }

    return item.unitPrice * item.quantity;
}

export function getCartItemMinimumQuantity(item) {
    return item.materialKey === 'stickers' &&
        Number.isFinite(item.width) &&
        Number.isFinite(item.height) &&
        item.width <= 3 &&
        item.height <= 3
        ? 100
        : 1;
}

export function generateOrderId(date = new Date()) {
    const stamp =
        date.toISOString()
            .slice(0, 10)
            .replace(/-/g, '');

    const timeStamp =
        [date.getHours(), date.getMinutes(), date.getSeconds()]
            .map(value => String(value).padStart(2, '0'))
            .join('');

    const uniqueSuffix =
        generateId()
            .replace(/-/g, '')
            .slice(-6)
            .toUpperCase();

    return `MA-${stamp}-${timeStamp}-${uniqueSuffix}`;
}

export async function createOrderIntentFingerprint(orderPayload) {
    const bytes = new TextEncoder().encode(JSON.stringify(orderPayload));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function normalizeDominicanPhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');

    return digits.length === 11 && digits.startsWith('1')
        ? digits.slice(1)
        : digits;
}

export function isValidDominicanPhone(phone) {
    return /^8(?:09|29|49)\d{7}$/.test(normalizeDominicanPhone(phone));
}
