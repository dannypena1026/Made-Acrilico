import {
    loadFromStorage,
    removeFromStorage,
    saveToStorage
} from '../utils/helpers.js';

const CART_STORAGE_KEY = 'made-acrilico-cart';
const CART_SHIPPING_STORAGE_KEY = 'made-acrilico-shipping-enabled';
const LEGACY_CART_STORAGE_KEY = 'made-acrílico-cart';
const LEGACY_SHIPPING_STORAGE_KEY = 'made-acrílico-shipping-enabled';

export function saveCartItems(items) {
    saveToStorage(CART_STORAGE_KEY, items);
}

export function loadCartItems(normalizeItem) {
    const storedCart =
        loadFromStorage(
            CART_STORAGE_KEY,
            loadFromStorage(LEGACY_CART_STORAGE_KEY, [])
        );

    const items =
        (Array.isArray(storedCart) ? storedCart : [])
            .map(normalizeItem)
            .filter(Boolean);

    saveCartItems(items);
    removeFromStorage(LEGACY_CART_STORAGE_KEY);

    return items;
}

export function saveShippingPreference(enabled) {
    saveToStorage(CART_SHIPPING_STORAGE_KEY, enabled);
}

export function loadShippingPreference() {
    const enabled =
        loadFromStorage(
            CART_SHIPPING_STORAGE_KEY,
            loadFromStorage(LEGACY_SHIPPING_STORAGE_KEY, false)
        ) === true;

    saveShippingPreference(enabled);
    removeFromStorage(LEGACY_SHIPPING_STORAGE_KEY);

    return enabled;
}
