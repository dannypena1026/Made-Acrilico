import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildQuoteFromInput,
    calculateTieredPrice
} from '../js/core/pricing-engine.js';

test('DTF Textil cobra media yarda cuando el alto llega hasta 18"', () => {
    const quote =
        buildQuoteFromInput({
            materialKey: 'textil',
            height: 18,
            quantity: 1
        });

    assert.equal(quote.invalid, false);
    assert.equal(quote.chargedLength, 18);
    assert.equal(quote.unitPrice, 300);
    assert.equal(quote.total, 300);
});

test('DTF Textil cobra yarda completa cuando supera 18"', () => {
    const quote =
        buildQuoteFromInput({
            materialKey: 'textil',
            height: 24,
            quantity: 2
        });

    assert.equal(quote.chargedLength, 36);
    assert.equal(quote.unitPrice, 500);
    assert.equal(quote.total, 1000);
});

test('DTF UV 16 usa sus tramos de precio', () => {
    const quote =
        buildQuoteFromInput({
            materialKey: 'uv',
            uvWidth: 16,
            height: 24,
            quantity: 1
        });

    assert.equal(quote.material, 'DTF UV (16")');
    assert.equal(quote.chargedLength, 24);
    assert.equal(quote.unitPrice, 900);
});

test('DTF UV 11.5 usa sus tramos de precio', () => {
    const quote =
        buildQuoteFromInput({
            materialKey: 'uv',
            uvWidth: 11.5,
            height: 36,
            quantity: 1
        });

    assert.equal(quote.material, 'DTF UV (11.5")');
    assert.equal(quote.chargedLength, 36);
    assert.equal(quote.unitPrice, 900);
});

test('medidas mayores al ultimo tramo se calculan proporcionalmente', () => {
    const price =
        calculateTieredPrice(
            72,
            [
                {
                    length: 36,
                    price: 500
                }
            ]
        );

    assert.equal(price.chargedLength, 72);
    assert.equal(price.pricePerYard, 500);
    assert.equal(price.unitPrice, 1000);
});
