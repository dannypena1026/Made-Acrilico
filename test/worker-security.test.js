import test from 'node:test';
import assert from 'node:assert/strict';
import {
    adminSessionCookie,
    canTransitionOrderStatus,
    createAssetToken,
    createAdminSession,
    createStoredOrder,
    getAllowedExtensions,
    isCloudinaryAssetUrl,
    normalizeCustomerReviews,
    normalizeOrderItem,
    normalizeSiteConfiguration,
    verifyAdminSession,
    verifyAssetToken
} from '../worker/src/index.js';

test('el Worker mantiene PSD fuera de los formatos de stickers', () => {
    assert.deepEqual(
        getAllowedExtensions('stickers'),
        ['png', 'pdf', 'ai', 'jpg', 'jpeg', 'jpe', 'webp', 'tif', 'tiff']
    );
    assert.ok(getAllowedExtensions('textil').includes('psd'));
});

test('el Worker recalcula una cotización y descarta totales enviados por el navegador', () => {
    const item = normalizeOrderItem({
        materialKey: 'textil',
        width: 22,
        height: 18,
        quantity: 1,
        total: 1
    });

    assert.equal(item.total, 300);
    assert.equal(item.materialKey, 'textil');
});

test('el token de un archivo se valida y no acepta alteraciones', async () => {
    const secret = 'prueba-secreta-larga';
    const token = await createAssetToken({
        key: 'orders/2026/07/00000000-0000-4000-8000-000000000000-sample.png',
        material: 'stickers',
        expiresAt: Date.now() + 60000
    }, secret);

    const valid = await verifyAssetToken(token, secret);
    const invalid = await verifyAssetToken(`${token}x`, secret);

    assert.equal(valid.material, 'stickers');
    assert.equal(invalid, null);
});

test('el Worker solo acepta URLs HTTPS del cloud Cloudinary configurado', () => {
    assert.equal(
        isCloudinaryAssetUrl(
            'https://res.cloudinary.com/made-acrilico/image/upload/v1/made-acrilico/orders/sample.png',
            'made-acrilico'
        ),
        true
    );
    assert.equal(isCloudinaryAssetUrl('https://example.com/archivo.png', 'made-acrilico'), false);
    assert.equal(isCloudinaryAssetUrl('http://res.cloudinary.com/made-acrilico/image/upload/sample.png', 'made-acrilico'), false);
});

test('las reseñas manuales se normalizan antes de llegar al carrusel público', () => {
    const reviews = normalizeCustomerReviews([
        {
            author: 'Cliente de prueba',
            rating: 5,
            text: 'Muy buena atención y excelente terminación.',
            published: 'hace 2 semanas'
        },
        { author: 'Entrada incompleta', rating: 0, text: 'No debe pasar.' }
    ]);

    assert.equal(reviews.length, 1);
    assert.equal(reviews[0].author, 'Cliente de prueba');
    assert.equal(reviews[0].rating, 5);
    assert.equal(reviews[0].published, 'hace 2 semanas');
});

test('el flujo interno no permite reabrir una orden terminada o cancelada', () => {
    assert.equal(canTransitionOrderStatus('pending_review', 'in_review'), true);
    assert.equal(canTransitionOrderStatus('in_production', 'ready'), true);
    assert.equal(canTransitionOrderStatus('ready', 'completed'), true);
    assert.equal(canTransitionOrderStatus('completed', 'in_production'), false);
    assert.equal(canTransitionOrderStatus('cancelled', 'in_review'), false);
});

test('la sesión interna firmada solo valida con el secreto correcto', async () => {
    const secret = 'secreto-de-sesion-de-prueba-seguro';
    const token = await createAdminSession(secret);
    const request = new Request('https://madeacrilico.com/api/admin/metrics', {
        headers: { Cookie: `made_acrilico_admin=${token}` }
    });

    assert.equal(await verifyAdminSession(request, { ADMIN_SESSION_SECRET: secret }), true);
    assert.equal(await verifyAdminSession(request, { ADMIN_SESSION_SECRET: 'otro-secreto' }), false);
});

test('la sesión se invalida cuando la contraseña fue cambiada', async () => {
    const secret = 'secreto-de-sesion-de-prueba-seguro';
    const updatedAt = '2026-07-16T15:00:00.000Z';
    const token = await createAdminSession(secret, updatedAt);
    const request = new Request('https://madeacrilico.com/api/admin/metrics', {
        headers: { Cookie: `made_acrilico_admin=${token}` }
    });
    const createEnvironment = credentialUpdatedAt => ({
        ADMIN_SESSION_SECRET: secret,
        ORDERS_DB: {
            prepare() {
                return {
                    async first() {
                        return { updated_at: credentialUpdatedAt };
                    }
                };
            }
        }
    });

    assert.equal(await verifyAdminSession(request, createEnvironment(updatedAt)), true);
    assert.equal(
        await verifyAdminSession(request, createEnvironment('2026-07-16T16:00:00.000Z')),
        false
    );
});

test('la cookie del panel dura solo durante el navegador y puede expirar de inmediato', () => {
    const request = new Request('https://madeacrilico.com/api/admin/login');
    const activeCookie = adminSessionCookie('token-de-prueba', request);
    const expiredCookie = adminSessionCookie('', request, true);

    assert.match(activeCookie, /HttpOnly/);
    assert.match(activeCookie, /SameSite=Strict/);
    assert.match(activeCookie, /Secure/);
    assert.doesNotMatch(activeCookie, /Max-Age=/);
    assert.match(expiredCookie, /Max-Age=0/);
});

test('la configuración pública conserva una forma segura y rechaza imágenes externas', () => {
    const config = normalizeSiteConfiguration({
        business: { name: 'MADE ACRÍLICO Pruebas', maxUploadSizeMb: 99 },
        materials: { stickers: { minQuantity: -50 } },
        images: {
            'home-uv': { url: 'https://example.com/no-permitida.webp', alt: 'No usar' },
            'home-textil': { url: 'https://res.cloudinary.com/made-acrilico/image/upload/v1/textil.webp', alt: 'Textil' }
        },
        reviews: [
            { author: 'Cliente real', rating: 5, text: 'Atención excelente.', published: 'hace una semana' },
            { author: '', rating: 5, text: 'No se publica.' }
        ]
    });

    assert.equal(config.business.name, 'MADE ACRÍLICO Pruebas');
    assert.equal(config.business.maxUploadSizeMb, 10);
    assert.equal(config.materials.stickers.minQuantity, 1);
    assert.equal(config.images['home-uv'], undefined);
    assert.equal(config.images['home-textil'].alt, 'Textil');
    assert.equal(config.reviews.length, 1);
    assert.equal(config.reviews[0].author, 'Cliente real');
});

test('la orden queda guardada antes de depender del correo externo', async () => {
    const calls = [];
    const database = {
        prepare(query) {
            return {
                bind(...values) {
                    return {
                        async run() {
                            calls.push({ query, values });
                            return {
                                meta: {
                                    changes: query.includes('INSERT OR IGNORE INTO orders') ? 1 : 1
                                }
                            };
                        }
                    };
                }
            };
        }
    };

    const created = await createStoredOrder(
        { ORDERS_DB: database },
        {
            id: 'MA-20260715-120000-ABC123',
            customer: {
                name: 'Cliente de prueba',
                phone: '8298824820',
                address: '',
                notes: ''
            },
            fulfillment: 'pickup',
            total: 500,
            items: [{ material: 'DTF Textil', total: 500 }],
            createdAt: '2026-07-15T12:00:00.000Z'
        }
    );

    assert.equal(created, true);
    assert.equal(calls.length, 2);
    assert.match(calls[0].query, /INSERT OR IGNORE INTO orders/);
    assert.match(calls[1].query, /INSERT INTO order_events/);
});
