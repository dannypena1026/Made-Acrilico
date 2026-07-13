import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildQuoteFromInput,
    calculateStickerDiscount,
    calculateStickerQuote,
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

test('medidas mayores al último tramo se calculan proporcionalmente', () => {
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

test('stickers calcula por rollo de 51 pulgadas y material', () => {
    const quote =
        buildQuoteFromInput({
            materialKey: 'stickers',
            stickerMaterial: 'white',
            stickerWidth: 3,
            stickerHeight: 4,
            quantity: 100
        });

    assert.equal(quote.invalid, false);
    assert.equal(quote.material, 'Stickers / Vinil Blanco');
    assert.equal(quote.size, '3 x 4 in');
    assert.equal(quote.total, 989);
});

test('stickers aplica descuento automático interno de 3% cada 500 hasta 20%', () => {
    assert.equal(calculateStickerDiscount(499), 0);
    assert.equal(calculateStickerDiscount(500), 0.03);
    assert.equal(calculateStickerDiscount(1000), 0.06);
    assert.equal(calculateStickerDiscount(4000), 0.20);
});

test('stickers respeta cantidad mínima 100 y precio mínimo RD$500', () => {
    const quote =
        buildQuoteFromInput({
            materialKey: 'stickers',
            stickerMaterial: 'white',
            stickerWidth: 1,
            stickerHeight: 1,
            quantity: 25
        });

    assert.equal(quote.invalid, false);
    assert.equal(quote.quantity, 100);
    assert.equal(quote.total, 500);
    assert.equal(quote.unitPrice, 5);
});

test('stickers mayores de 3 pulgadas permiten menos de 100 y calculan precio variable', () => {
    const quote =
        buildQuoteFromInput({
            materialKey: 'stickers',
            stickerMaterial: 'white',
            stickerWidth: 4,
            stickerHeight: 4,
            quantity: 25
        });

    assert.equal(quote.invalid, false);
    assert.equal(quote.quantity, 25);
    assert.equal(quote.total, 436);
    assert.equal(quote.unitPrice, 17.44);
});

test('stickers devuelve una cotización inválida sin fallar cuando falta una medida', () => {
    const quote =
        calculateStickerQuote({
            materialKey: 'white',
            width: Number.NaN,
            height: 4,
            quantity: 25
        });

    assert.equal(quote.invalid, true);
    assert.equal(quote.quantity, 25);
});

test('stickers elige la orientación que requiere menos longitud de rollo', () => {
    const quote =
        calculateStickerQuote({
            materialKey: 'white',
            width: 1,
            height: 20,
            quantity: 100
        });

    assert.equal(quote.invalid, false);
    assert.equal(quote.rotated, true);
    assert.ok(Math.abs(quote.chargedLength - 55) < 0.0001);
});

test('stickers no muestra descuento aplicado cuando el precio mínimo absorbe el descuento', () => {
    const quote =
        calculateStickerQuote({
            materialKey: 'white',
            width: 1,
            height: 1,
            quantity: 500
        });

    assert.equal(quote.configuredDiscountRate, 0.03);
    assert.equal(quote.discountRate, 0);
    assert.equal(quote.discountAmount, 0);
    assert.equal(quote.total, 500);
});
