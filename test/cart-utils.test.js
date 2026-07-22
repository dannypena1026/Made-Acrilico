import test from 'node:test';
import assert from 'node:assert/strict';

import {
    createOrderIntentFingerprint,
    generateOrderId,
    getCartItemMinimumQuantity,
    getCartItemTotal,
    isValidDominicanPhone,
    normalizeDominicanPhone
} from '../js/modules/cart-utils.js';

test('normaliza teléfonos dominicanos con o sin el prefijo internacional', () => {
    assert.equal(normalizeDominicanPhone('+1 (829) 882-4820'), '8298824820');
    assert.equal(normalizeDominicanPhone('809 555 1234'), '8095551234');
    assert.equal(isValidDominicanPhone('+1 (829) 882-4820'), true);
    assert.equal(isValidDominicanPhone('305 555 1234'), false);
});

test('mantiene el mínimo de 100 stickers para medidas de hasta 3 pulgadas', () => {
    assert.equal(
        getCartItemMinimumQuantity({ materialKey: 'stickers', width: 3, height: 3 }),
        100
    );
    assert.equal(
        getCartItemMinimumQuantity({ materialKey: 'stickers', width: 3.1, height: 3 }),
        1
    );
    assert.equal(
        getCartItemMinimumQuantity({ materialKey: 'textil', width: 3, height: 3 }),
        1
    );
});

test('usa el total cotizado de stickers y la multiplicación en los demás materiales', () => {
    assert.equal(
        getCartItemTotal({ materialKey: 'stickers', total: 500, unitPrice: 4, quantity: 100 }),
        500
    );
    assert.equal(
        getCartItemTotal({ materialKey: 'uv', unitPrice: 250, quantity: 3 }),
        750
    );
});

test('genera un identificador de orden legible y único por sufijo', () => {
    const date = new Date('2026-07-16T14:30:45');
    const orderId = generateOrderId(date);

    assert.match(orderId, /^MA-20260716-143045-[A-Z0-9]{6}$/);
});

test('genera una huella estable para reintentar la misma orden sin duplicarla', async () => {
    const payload = {
        customer: { name: 'Cliente', phone: '8298824820' },
        fulfillment: 'pickup',
        items: [{ materialKey: 'textil', height: 18, quantity: 1 }]
    };

    const first = await createOrderIntentFingerprint(payload);
    const second = await createOrderIntentFingerprint(structuredClone(payload));
    const changed = await createOrderIntentFingerprint({
        ...payload,
        items: [{ materialKey: 'textil', height: 18, quantity: 2 }]
    });

    assert.match(first, /^[a-f0-9]{64}$/);
    assert.equal(first, second);
    assert.notEqual(first, changed);
});
